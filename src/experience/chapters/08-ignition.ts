import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, track } from './util';

export const ignition: Chapter = {
  id: 'ignition',
  beats: 1,
  camera: [cam(0, B.reassemblyEnd, true), cam(1, B.ignitionEnd)],
  tracks: [
    // Scene 1 inverted: it starts with a faint glow, holds, then fades to
    // full black over the final quarter.
    track('light.ambient', [0, 0.04], [0.25, 0.04], [1, 0.0]),
    track('light.headlamps', [0, 0.12], [0.25, 0.12], [1, 0.0]),
    track('light.key', [0, 0.15], [0.25, 0.15], [1, 0.0]),
    track('light.floor', [0, 0.12], [0.25, 0.12], [1, 0.0])
  ],
  overlays: []
};
