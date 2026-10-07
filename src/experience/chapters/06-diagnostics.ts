import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, track } from './util';

export const diagnostics: Chapter = {
  id: 'diagnostics',
  beats: 1,
  camera: [cam(0, B.suspensionEnd, true), cam(1, B.diagnosticsEnd)],
  tracks: [
    // Scene 3: continue the gradual power-on from scene 2's mid level up to
    // full intensity (eased, so it settles into full without a hard kink).
    // Authored pre-reversed: t=1 connects to Scene 2, t=0 connects to Scene 4.
    track('light.ambient', [0, 0.2, 'smooth'], [1, 0.12, 'smooth']),
    track('light.key', [0, 1.0, 'smooth'], [1, 0.55, 'smooth']),
    track('light.headlamps', [0, 0.8, 'smooth'], [1, 0.45, 'smooth']),
    track('light.floor', [0, 0.8, 'smooth'], [1, 0.45, 'smooth']),
  ],
  overlays: []
};
