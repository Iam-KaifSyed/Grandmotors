import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam } from './util';

export const ignition: Chapter = {
  id: 'ignition',
  beats: 1,
  camera: [cam(0, B.reassemblyEnd, true), cam(1, B.ignitionEnd)],
  tracks: [],
  overlays: []
};
