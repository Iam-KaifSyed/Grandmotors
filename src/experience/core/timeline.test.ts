import { describe, expect, it } from 'vitest';
import { compileTimeline } from './timeline';
import type { CameraKey, Chapter } from './types';

const key = (t: number, x: number, hold = false): CameraKey => ({
  t,
  pos: [x, 1, 5],
  look: [0, 1, 0],
  fov: 35,
  hold,
});

const chapters: Chapter[] = [
  {
    id: 'open',
    beats: 1,
    camera: [key(0, 0, true), key(1, 2)],
    tracks: [{ channel: 'light.key', keys: [{ t: 0, v: 0 }, { t: 1, v: 1 }] }],
    overlays: [{ id: 'hero', from: 0.2, to: 0.8 }],
  },
  {
    id: 'arrival',
    beats: 3,
    camera: [key(0, 2), key(0.5, 4), key(1, 6, true)],
    tracks: [{ channel: 'light.key', keys: [{ t: 0, v: 1 }, { t: 1, v: 0.5 }] }],
    overlays: [],
  },
];

describe('compileTimeline', () => {
  const tl = compileTimeline(chapters);

  it('splits scroll by beats', () => {
    expect(tl.totalBeats).toBe(4);
    expect(tl.ranges[0]!.end).toBeCloseTo(0.25);
    expect(tl.ranges[1]!.start).toBeCloseTo(0.25);
  });

  it('hits camera keys exactly and clamps outside 0..1', () => {
    expect(tl.sample(0).camera.pos[0]).toBeCloseTo(0);
    expect(tl.sample(0.25).camera.pos[0]).toBeCloseTo(2);
    expect(tl.sample(1).camera.pos[0]).toBeCloseTo(6);
    expect(tl.sample(-5).camera.pos[0]).toBeCloseTo(0);
    expect(tl.sample(9).camera.pos[0]).toBeCloseTo(6);
  });

  it('reports the active chapter and local time', () => {
    const f = tl.sample(0.625);
    expect(f.chapterId).toBe('arrival');
    expect(f.local).toBeCloseTo(0.5);
    expect(tl.sample(1).chapterId).toBe('arrival');
  });

  it('is continuous across the chapter boundary', () => {
    const a = tl.sample(0.25 - 1e-5).camera.pos[0];
    const b = tl.sample(0.25 + 1e-5).camera.pos[0];
    expect(Math.abs(a - b)).toBeLessThan(1e-3);
  });

  it('dwells at hold keys', () => {
    const d = (p: number) =>
      Math.abs(tl.sample(p + 1e-4).camera.pos[0] - tl.sample(p - 1e-4).camera.pos[0]);
    expect(d(0.001)).toBeLessThan(d(0.125));
  });

  it('interpolates channels across chapters and fades overlays', () => {
    expect(tl.sample(0.25).values['light.key']).toBeCloseTo(1);
    expect(tl.sample(1).values['light.key']).toBeCloseTo(0.5);
    expect(tl.sample(0.125).overlays[0]?.id).toBe('hero');
    expect(tl.sample(0.125).overlays[0]?.opacity).toBeCloseTo(1);
    // local 0.16 is before the overlay starts; local 0.24 is mid fade-in.
    expect(tl.sample(0.04).overlays.length).toBe(0);
    const fading = tl.sample(0.06).overlays[0]?.opacity ?? 0;
    expect(fading).toBeGreaterThan(0);
    expect(fading).toBeLessThan(1);
  });

  it('rejects a camera jump between chapters', () => {
    const bad: Chapter[] = [chapters[0]!, { ...chapters[1]!, camera: [key(0, 9), key(1, 6)] }];
    expect(() => compileTimeline(bad)).toThrow(/discontinuity/);
  });
});
