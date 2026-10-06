import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam } from './util';

export const reassembly: Chapter = {
  id: 'reassembly',
  beats: 1,
  camera: [cam(0, B.diagnosticsEnd, true), cam(1, B.reassemblyEnd)],
  tracks: [],
  overlays: []
};
