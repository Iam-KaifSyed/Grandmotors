import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, track } from './util';

/** Controlled cinematic orbit exposing front aero, side profile, and wheels. */
export const reveal: Chapter = {
  id: 'reveal',
  beats: 3.5,
  camera: [
    cam(0, B.arrivalEnd, true),
    cam(1, B.revealEnd),
  ],
  tracks: [
    track('light.ambient', [0, 0.15], [1, 0.2]),
    track('light.key', [0, 1.0], [0.5, 1.2], [1, 1.0]), // Highlight peak midway through orbit
    track('light.headlamps', [0, 0.8], [1, 0.8]), 
    track('light.floor', [0, 0.6], [1, 0.8]),
    track('rig.pz', [0, 0], [1, 0]), // Hold position
  ],
  overlays: [{ id: 'reveal', from: 0.2, to: 0.9 }],
};
