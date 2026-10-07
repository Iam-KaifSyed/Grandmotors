cat << 'INNER_EOF' > src/experience/chapters/06-diagnostics.ts
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
INNER_EOF

cat << 'INNER_EOF' > src/experience/chapters/07-reassembly.ts
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
INNER_EOF
