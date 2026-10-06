import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, track } from './util';

/** Static Render Quality Hero Shot (3/4 Front) */
export const open: Chapter = {
  id: 'open',
  beats: 3, 
  camera: [
    cam(0, B.open),
    cam(1, B.openEnd),
  ],
  tracks: [
    // Keep car at 0 so we can see it perfectly
    track('rig.pz', [0, 0], [1, 0]), 
    
    // Fully dialed-in cinematic lighting from beat 0
    track('light.ambient', [0, 0.1], [1, 0.1]), 
    track('light.headlamps', [0, 0.8], [1, 0.8]), 
    track('light.key', [0, 1.2], [1, 1.2]), 
    track('light.floor', [0, 0.7], [1, 0.7]), 
  ],
  overlays: [],
};
