import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, shot, track } from './util';

/**
 * Hood opens, camera cranes over the fender and drops into the bay.
 * Hood pivot is its rear hinge; open = negative rx.
 */
export const engine: Chapter = {
  id: 'engine',
  beats: 3.4,
  camera: [
    cam(0, B.revealEnd, true),
    cam(0.4, shot([1.6, 2.5, 4.0], [0, 1.1, 1.6], 32)),
    cam(0.7, shot([0.2, 2.3, 2.7], [0, 0.95, 1.5], 28)),
    cam(0.88, shot([0, 1.8, 2.2], [0, 0.9, 1.5], 28), true),
    cam(1, B.engineEnd),
  ],
  tracks: [
    track('hood.rx', [0, 0], [0.04, 0], [0.36, -1.1]),
    // Components lift a few centimetres, one after another.
    track('engineCover.py', [0, 0], [0.5, 0], [0.62, 0.16]),
    track('airbox.py', [0, 0], [0.55, 0], [0.67, 0.14]),
    track('battery.py', [0, 0], [0.6, 0], [0.72, 0.12]),
    track('coolantTank.py', [0, 0], [0.65, 0], [0.77, 0.12]),
    track('fx.hl.engine', [0, 0], [0.45, 0], [0.55, 1], [0.92, 1], [1, 0]),
    track('light.key', [0, 1], [0.05, 1], [0.3, 0.45]),
    track('light.headlamps', [0, 0.85], [0.35, 0.25]),
    track('light.bay', [0, 0], [0.1, 0], [0.35, 1]),
    track('light.floor', [0, 0.7], [0.3, 0.4]),
    track('light.ambient', [0, 0.3], [0.35, 0.14]),
  ],
  overlays: [{ id: 'engine', from: 0.55, to: 0.96 }],
};
