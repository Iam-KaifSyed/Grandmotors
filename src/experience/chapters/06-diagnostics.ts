import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, shot, track } from './util';

/** Camera rises along the flank, passes through the driver window into the cabin, then the scanner sweeps. */
export const diagnostics: Chapter = {
  id: 'diagnostics',
  beats: 3.0,
  camera: [
    cam(0, B.suspensionEnd),
    cam(0.25, shot([-1.5, 1.3, 0.3], [-0.4, 1.1, 0.2], 32)),
    cam(0.45, shot([-0.5, 1.22, -0.1], [-0.4, 1.0, 0.85], 36), true),
    cam(0.8, shot([-0.45, 1.2, 0.05], [-0.4, 1.0, 0.9], 30), true),
    cam(1, B.diagnosticsEnd),
  ],
  tracks: [
    track('fx.hl.suspension', [0, 1], [0.15, 0]),
    // Glass fades out so the camera can pass through it.
    track('fx.glass', [0, 1], [0.12, 1], [0.3, 0]),
    track('light.cabin', [0, 0], [0.35, 0], [0.55, 1]),
    track('fx.cluster', [0, 0], [0.5, 0], [0.62, 1]),
    // Structural sweep only. It carries no readings and shows no numbers.
    track('fx.scan', [0, 0], [0.68, 0], [0.95, 1]),
    track('light.ambient', [0, 0.1], [0.3, 0.03]),
    track('light.key', [0, 0.2], [0.3, 0.05]),
    track('light.detail', [0, 0.3], [0.4, 0]),
    track('light.floor', [0, 0.3], [0.4, 0.15]),
  ],
  overlays: [{ id: 'diagnostics', from: 0.5, to: 0.96 }],
};
