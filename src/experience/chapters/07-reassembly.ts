import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, track } from './util';

export const reassembly: Chapter = {
  id: 'reassembly',
  // Doubled scroll length so the power-on is spread out and never feels
  // abrupt right after scene 1's blackout.
  beats: 2,
  camera: [cam(0, B.diagnosticsEnd, true), cam(1, B.reassemblyEnd)],
  tracks: [
    // Scene 2: rise gently from black (end of scene 1) with eased keys and a
    // mid waypoint so the brightening is smooth, not a sudden jump.
    // Authored pre-reversed: t=1 connects to Scene 1, t=0 connects to Scene 3.
    track('light.ambient', [0, 0.12, 'smooth'], [0.5, 0.08, 'smooth'], [1, 0.04, 'smooth']),
    track('light.key', [0, 0.55, 'smooth'], [0.5, 0.35, 'smooth'], [1, 0.15, 'smooth']),
    track('light.headlamps', [0, 0.45, 'smooth'], [0.5, 0.28, 'smooth'], [1, 0.12, 'smooth']),
    track('light.floor', [0, 0.45, 'smooth'], [0.5, 0.28, 'smooth'], [1, 0.12, 'smooth']),
  ],
  overlays: []
};
