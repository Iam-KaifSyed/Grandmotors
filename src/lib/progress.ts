/**
 * Shared scroll state. Mutated outside React on purpose: the render loop reads it
 * every frame and nothing re-renders when it changes.
 */
export const scrollState = {
  /** Raw 0..1 scroll position. */
  target: 0,
  /** Damped value the camera actually follows. */
  current: 0,
};

/** Frame-rate independent exponential smoothing. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
