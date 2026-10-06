import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam } from './util';

export const engine: Chapter = {
  id: 'engine',
  beats: 1,
  camera: [cam(0, B.revealEnd, true), cam(1, B.engineEnd)],
  tracks: [],
  overlays: []
};
