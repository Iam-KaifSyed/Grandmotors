import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, shot, track } from './util';

/** The car rolls into the bay; the camera tracks it low and floor lights trip on. */
export const arrival: Chapter = {
  id: 'arrival',
  beats: 2.4,
  camera: [
    cam(0, B.openEnd),
    cam(0.5, shot([-2.4, 0.8, 6.2], [0, 0.85, -0.6], 34)),
    cam(1, B.arrivalEnd),
  ],
  tracks: [
    track('rig.pz', [0, -5], [0.9, 0, 'out']),
    // 5 m at r = 0.42 is about 1.9 revolutions.
    track('fx.wheelSpin', [0, 0], [0.9, 1.9, 'out']),
    track('light.ambient', [0, 0.12], [1, 0.22]),
    track('light.headlamps', [0, 1], [1, 1]),
    track('light.key', [0, 0], [0.4, 0], [0.95, 0.9]),
    track('light.floor', [0, 0], [0.2, 0], [0.95, 0.7]),
    track('fx.sheen', [0, 1], [1, 1]),
  ],
  overlays: [{ id: 'brand', from: 0.55, to: 0.98 }],
};
