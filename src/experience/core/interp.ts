import type { Ease } from './types';

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

export const smootherstep = (x: number): number => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export function ease(kind: Ease, u: number): number {
  const t = clamp01(u);
  if (kind === 'linear') return t;
  if (kind === 'out') return 1 - (1 - t) * (1 - t); // quadratic ease-out
  return smootherstep(t);
}

/** Index i such that times[i] <= t < times[i+1], clamped to [0, n-2]. Needs n >= 2. */
export function findSegment(times: readonly number[], t: number): number {
  const last = times.length - 2;
  if (t <= times[0]!) return 0;
  if (t >= times[times.length - 1]!) return last;
  let lo = 0;
  let hi = last;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (times[mid]! <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Cubic Hermite. m0/m1 are derivatives with respect to time,
 * h is the segment duration and u the normalised position in it.
 */
export function hermite(p0: number, p1: number, m0: number, m1: number, h: number, u: number): number {
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * p0 +
    (u3 - 2 * u2 + u) * h * m0 +
    (-2 * u3 + 3 * u2) * p1 +
    (u3 - u2) * h * m1
  );
}
