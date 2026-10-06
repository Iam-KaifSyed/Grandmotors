import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, shot, track } from './util';

/** Camera orbits behind the wheel to the strut; one slow compress and extend shows the spring working. */
export const suspension: Chapter = {
  id: 'suspension',
  beats: 2.4,
  camera: [
    cam(0, B.brakesEnd),
    cam(0.35, shot([-2.2, 0.85, 1.55], [-0.85, 0.65, 1.42], 26)),
    cam(0.7, shot([-2.0, 1.0, 0.9], [-0.8, 0.7, 1.42], 28), true),
    cam(1, B.suspensionEnd),
  ],
  tracks: [
    track('fx.hl.brake', [0, 1], [0.2, 0]),
    track('fx.hl.suspension', [0, 0], [0.35, 0], [0.5, 1]),
    // Visual demonstration only: one compression and one extension.
    track('springFR.sy', [0, 0], [0.4, 0], [0.52, -0.16], [0.68, 0]),
    track('wheelFR.py', [0, 0], [0.4, 0], [0.52, 0.07], [0.68, 0]),
    track('light.detail', [0, 1], [0.7, 1], [1, 0.3]),
  ],
  overlays: [{ id: 'suspension', from: 0.45, to: 0.92 }],
};
