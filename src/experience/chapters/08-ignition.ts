import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, shot, track } from './util';

/** Starter, a slight shudder, headlamps on, garage lights warm up, then the slow pull-back to the call to action. */
export const ignition: Chapter = {
  id: 'ignition',
  beats: 2.6,
  camera: [
    cam(0, B.reassemblyEnd, true),
    cam(0.5, shot([0, 1.6, 8.6], [0, 1.0, 0.25], 38)),
    cam(1, B.ignitionEnd),
  ],
  tracks: [
    track('fx.cluster', [0, 0], [0.3, 0], [0.4, 1]),
    track('fx.vibe', [0, 0], [0.3, 0], [0.4, 0.6], [0.5, 0.25], [1, 0.2]),
    track('fx.exhaust', [0, 0], [0.3, 0], [0.45, 1], [0.9, 1], [1, 0.4]),
    track('light.headlamps', [0, 0], [0.38, 0], [0.5, 1]),
    track('light.garage', [0, 0], [0.5, 0], [0.85, 1]),
    track('light.key', [0, 0.8], [1, 1]),
    track('light.ambient', [0, 0.3], [1, 0.5]),
    track('light.floor', [0, 0.7], [1, 1]),
  ],
  overlays: [{ id: 'finale', from: 0.55, to: 1, fadeOut: false }],
};
