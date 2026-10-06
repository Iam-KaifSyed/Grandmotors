import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, track } from './util';

/** Dark open: the car sits far back in the dark, headlamps come up, a reflection crosses the body. */
export const open: Chapter = {
  id: 'open',
  beats: 1.2,
  camera: [cam(0, B.open, true), cam(1, B.openEnd)],
  tracks: [
    track('light.ambient', [0, 0], [0.1, 0], [1, 0.12]),
    track('light.headlamps', [0, 0], [0.2, 0], [0.65, 1]),
    track('light.key', [0, 0], [1, 0]),
    track('light.floor', [0, 0], [1, 0]),
    track('fx.sheen', [0, 0], [0.45, 0], [1, 1]),
    // Car waits at its start position; the arrival chapter moves it in.
    track('rig.pz', [0, -5]),
  ],
  overlays: [{ id: 'hero', from: 0.22, to: 1, fade: 0.14 }],
};
