import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, track } from './util';

export const brakes: Chapter = {
  id: 'brakes',
  beats: 1,
  camera: [cam(0, B.engineEnd, true), cam(1, B.brakesEnd)],
  tracks: [
    track('light.ambient', [0, 0.2], [1, 0.2]),
    track('light.key', [0, 1.0], [1, 1.0]),
    track('light.headlamps', [0, 0.8], [1, 0.8]),
    track('light.floor', [0, 0.8], [1, 0.8]),
  ],
  overlays: []
};
