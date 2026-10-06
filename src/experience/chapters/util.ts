import type { CameraKey, Channel, Ease, Track, Vec3 } from '../core/types';

export interface Shot {
  readonly pos: Vec3;
  readonly look: Vec3;
  readonly fov: number;
}

export const shot = (pos: Vec3, look: Vec3, fov: number): Shot => ({ pos, look, fov });

/** Camera key from a shot. `hold` zeroes camera velocity there (a dwell). */
export const cam = (t: number, s: Shot, hold = false): CameraKey => ({
  t,
  pos: s.pos,
  look: s.look,
  fov: s.fov,
  ...(hold ? { hold: true } : {}),
});

/** Scalar track from [t, value, ease?] tuples. */
export const track = (channel: Channel, ...keys: Array<[number, number, Ease?]>): Track => ({
  channel,
  keys: keys.map(([t, v, ease]) => (ease ? { t, v, ease } : { t, v })),
});
