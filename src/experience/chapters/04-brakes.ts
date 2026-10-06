import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam } from './util';

export const brakes: Chapter = {
  id: 'brakes',
  beats: 1,
  camera: [cam(0, B.engineEnd, true), cam(1, B.brakesEnd)],
  tracks: [],
  overlays: []
};
