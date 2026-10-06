import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, shot, track } from './util';

/** Slow orbit from the right-front 3/4 across the nose to the left-front 3/4. */
export const reveal: Chapter = {
  id: 'reveal',
  beats: 1.6,
  camera: [
    cam(0, B.arrivalEnd, true),
    cam(0.5, shot([0, 1.5, 7.4], [0, 0.95, 0.4], 34)),
    cam(1, B.revealEnd),
  ],
  tracks: [
    track('light.ambient', [0, 0.22], [1, 0.3]),
    track('light.key', [0, 0.9], [1, 1]),
    track('light.headlamps', [0, 1], [1, 0.85]),
    track('light.floor', [0, 0.7], [1, 0.7]),
  ],
  overlays: [{ id: 'reveal', from: 0.3, to: 0.9 }],
};
