import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam } from './util';

export const diagnostics: Chapter = {
  id: 'diagnostics',
  beats: 1,
  camera: [cam(0, B.suspensionEnd, true), cam(1, B.diagnosticsEnd)],
  tracks: [],
  overlays: []
};
