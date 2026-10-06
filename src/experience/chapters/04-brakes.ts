import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, shot, track } from './util';

/** Camera descends along the fender into the arch; the wheel spins up, slows, and the tyre ghosts back. */
export const brakes: Chapter = {
  id: 'brakes',
  beats: 3.0,
  camera: [
    cam(0, B.engineEnd),
    cam(0.3, shot([-2.3, 0.75, 2.7], [-0.9, 0.5, 1.5], 28)),
    cam(0.55, shot([-2.1, 0.5, 2.25], [-0.9, 0.42, 1.42], 26), true),
    cam(1, B.brakesEnd),
  ],
  tracks: [
    track('fx.wheelSpin', [0, 1.9], [0.25, 1.9], [0.55, 5.4], [0.8, 5.9, 'out']),
    // Pull the wheel outward (FR is -x) to open the view to disc and caliper.
    track('wheelFR.px', [0, 0], [0.6, 0], [0.85, -0.3]),
    track('fx.tyre', [0, 1], [0.55, 1], [0.75, 0.07]),
    track('fx.hl.brake', [0, 0], [0.68, 0], [0.8, 1]),
    track('light.bay', [0, 1], [0.3, 0]),
    track('light.detail', [0, 0], [0.1, 0], [0.4, 1]),
    track('light.key', [0, 0.45], [0.4, 0.2]),
    track('light.headlamps', [0, 0.25], [0.3, 0]),
    track('light.floor', [0, 0.4], [0.4, 0.3]),
    track('light.ambient', [0, 0.14], [0.4, 0.1]),
  ],
  overlays: [{ id: 'brakes', from: 0.6, to: 0.97 }],
};
