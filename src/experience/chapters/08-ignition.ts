import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, track } from './util';

export const ignition: Chapter = {
  id: 'ignition',
  beats: 1,
  camera: [cam(0, B.reassemblyEnd, true), cam(1, B.ignitionEnd)],
  tracks: [
    // Fade completely to black starting from previous chapter's intensity
    track('light.ambient', [0, 0.2], [1, 0.0]),
    track('light.headlamps', [0, 0.8], [1, 0.0]),
    track('light.key', [0, 1.0], [1, 0.0]),
    track('light.floor', [0, 0.8], [1, 0.0])
  ],
  overlays: []
};
