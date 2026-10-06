import type { ActiveOverlay, Channel, Chapter, ChapterId, Frame, ScalarKey, Vec3 } from './types';
import { clamp01, ease, findSegment, hermite, smootherstep } from './interp';

export interface ChapterRange {
  id: ChapterId;
  index: number;
  /** Global progress 0..1. */
  start: number;
  end: number;
}

export interface Timeline {
  totalBeats: number;
  ranges: readonly ChapterRange[];
  sample(progress: number): Frame;
}

const EPS = 1e-6;
const CAM_DIM = 7; // pos xyz, look xyz, fov

interface GlobalTrackKey extends ScalarKey {
  t: number; // global
}

function near(a: readonly number[], b: readonly number[]): boolean {
  return a.every((v, i) => Math.abs(v - b[i]!) < EPS);
}

function flat(pos: Vec3, look: Vec3, fov: number): number[] {
  return [pos[0], pos[1], pos[2], look[0], look[1], look[2], fov];
}

/**
 * Compile chapters into one continuous timeline.
 *
 * The camera is a single Hermite spline through every chapter's keys in global
 * time, so velocity is continuous across chapter boundaries by construction.
 * A key marked `hold` gets zero tangent (a deliberate dwell).
 */
export function compileTimeline(chapters: readonly Chapter[]): Timeline {
  if (chapters.length === 0) throw new Error('timeline: no chapters');

  const totalBeats = chapters.reduce((sum, c) => sum + c.beats, 0);
  const ranges: ChapterRange[] = [];
  let acc = 0;
  for (const [index, c] of chapters.entries()) {
    if (!(c.beats > 0)) throw new Error(`timeline: chapter "${c.id}" needs beats > 0`);
    const start = acc / totalBeats;
    acc += c.beats;
    ranges.push({ id: c.id, index, start, end: acc / totalBeats });
  }

  // ---- camera ------------------------------------------------------------
  const camT: number[] = [];
  const camV: number[][] = [];
  const camHold: boolean[] = [];

  for (const [i, c] of chapters.entries()) {
    const r = ranges[i]!;
    const keys = c.camera;
    if (keys.length < 2) throw new Error(`timeline: chapter "${c.id}" needs >= 2 camera keys`);
    if (Math.abs(keys[0]!.t) > EPS || Math.abs(keys[keys.length - 1]!.t - 1) > EPS) {
      throw new Error(`timeline: chapter "${c.id}" camera keys must span t=0..1`);
    }
    for (let k = 1; k < keys.length; k++) {
      if (!(keys[k]!.t > keys[k - 1]!.t)) {
        throw new Error(`timeline: chapter "${c.id}" camera keys must be strictly increasing`);
      }
    }

    for (const [k, key] of keys.entries()) {
      const v = flat(key.pos, key.look, key.fov);
      if (i > 0 && k === 0) {
        // Shared boundary key: must match the previous chapter's last key.
        const prev = camV[camV.length - 1]!;
        if (!near(prev, v)) {
          throw new Error(
            `timeline: camera discontinuity between "${chapters[i - 1]!.id}" and "${c.id}"`,
          );
        }
        camHold[camHold.length - 1] = camHold[camHold.length - 1]! || !!key.hold;
        continue;
      }
      camT.push(r.start + key.t * (r.end - r.start));
      camV.push(v);
      camHold.push(!!key.hold);
    }
  }

  // Tangents: Catmull-Rom on non-uniform times; zero at the two ends and at holds.
  const camM: number[][] = camV.map(() => new Array<number>(CAM_DIM).fill(0));
  for (let j = 1; j < camT.length - 1; j++) {
    if (camHold[j]) continue;
    const dt = camT[j + 1]! - camT[j - 1]!;
    for (let d = 0; d < CAM_DIM; d++) {
      camM[j]![d] = (camV[j + 1]![d]! - camV[j - 1]![d]!) / dt;
    }
  }

  // ---- scalar tracks (global time) --------------------------------------
  const tracks = new Map<Channel, GlobalTrackKey[]>();
  for (const [i, c] of chapters.entries()) {
    const r = ranges[i]!;
    for (const tr of c.tracks) {
      let list = tracks.get(tr.channel);
      if (!list) tracks.set(tr.channel, (list = []));
      for (const k of tr.keys) {
        if (k.t < 0 || k.t > 1) {
          throw new Error(`timeline: "${c.id}" ${tr.channel} key t=${k.t} outside 0..1`);
        }
        const t = r.start + k.t * (r.end - r.start);
        const last = list[list.length - 1];
        if (last && t < last.t - EPS) {
          throw new Error(`timeline: "${c.id}" ${tr.channel} keys out of order`);
        }
        list.push({ ...k, t });
      }
    }
  }

  // ---- sampling -----------------------------------------------------------
  const sample = (progress: number): Frame => {
    const p = clamp01(progress);

    let ci = ranges.findIndex((r) => p < r.end);
    if (ci < 0) ci = ranges.length - 1;
    const range = ranges[ci]!;
    const chapter = chapters[ci]!;
    const local = clamp01((p - range.start) / (range.end - range.start));

    // camera
    const seg = findSegment(camT, p);
    const h = camT[seg + 1]! - camT[seg]!;
    const u = clamp01((p - camT[seg]!) / h);
    const out = new Array<number>(CAM_DIM);
    for (let d = 0; d < CAM_DIM; d++) {
      out[d] = hermite(
        camV[seg]![d]!,
        camV[seg + 1]![d]!,
        camM[seg]![d]!,
        camM[seg + 1]![d]!,
        h,
        u,
      );
    }

    // channels
    const values: Partial<Record<Channel, number>> = {};
    for (const [channel, keys] of tracks) {
      const first = keys[0]!;
      const last = keys[keys.length - 1]!;
      if (p <= first.t) {
        values[channel] = first.v;
      } else if (p >= last.t) {
        values[channel] = last.v;
      } else {
        const times = keys.map((k) => k.t);
        const s = findSegment(times, p);
        const a = keys[s]!;
        const b = keys[s + 1]!;
        const span = b.t - a.t;
        const e = span < EPS ? 1 : ease(b.ease ?? 'smooth', (p - a.t) / span);
        values[channel] = a.v + (b.v - a.v) * e;
      }
    }

    // overlays
    const overlays: ActiveOverlay[] = [];
    for (const o of chapter.overlays) {
      if (local < o.from || local > o.to) continue;
      const fade = Math.min(o.fade ?? 0.08, (o.to - o.from) / 2);
      let opacity = 1;
      if (fade > EPS) {
        if (o.fadeIn !== false) opacity = Math.min(opacity, smootherstep((local - o.from) / fade));
        if (o.fadeOut !== false) opacity = Math.min(opacity, smootherstep((o.to - local) / fade));
      }
      if (opacity > 0.001) overlays.push({ id: o.id, opacity });
    }

    return {
      chapter: ci,
      chapterId: chapter.id,
      local,
      camera: {
        pos: [out[0]!, out[1]!, out[2]!],
        look: [out[3]!, out[4]!, out[5]!],
        fov: out[6]!,
      },
      values,
      overlays,
    };
  };

  return { totalBeats, ranges, sample };
}
