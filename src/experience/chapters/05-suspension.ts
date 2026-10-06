import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam } from './util';

export const suspension: Chapter = {
  id: 'suspension',
  beats: 1,
  camera: [cam(0, B.brakesEnd, true), cam(1, B.suspensionEnd)],
  tracks: [],
  overlays: []
};
