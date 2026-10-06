import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, track } from './util';

/** The static hero shot transitions into a walkaround */
export const arrival: Chapter = {
  id: 'arrival',
  beats: 3,
  camera: [
    cam(0, B.openEnd, true),
    cam(1, B.arrivalEnd),
  ],
  tracks: [
    track('rig.pz', [0, 0], [1, 0]), // Car stays in center
    track('light.ambient', [0, 0.1], [1, 0.15]),
    track('light.key', [0, 1.2], [1, 1.0]),
    track('light.floor', [0, 0.7], [1, 0.6]), 
    track('light.headlamps', [0, 0.8], [1, 0.8]), 
  ],
  overlays: [],
};
