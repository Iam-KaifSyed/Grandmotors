import type { Chapter } from '../core/types';
import { B } from './shots';
import { cam, shot, track } from './util';

/** Camera exits forward through the windscreen while every lifted part returns, in reverse order. */
export const reassembly: Chapter = {
  id: 'reassembly',
  beats: 2.8,
  camera: [
    cam(0, B.diagnosticsEnd),
    cam(0.3, shot([0, 1.5, 1.3], [0, 1.05, 3.0], 42)),
    cam(0.6, shot([0, 1.9, 4.4], [0, 1.0, 1.2], 42)),
    cam(1, B.reassemblyEnd, true),
  ],
  tracks: [
    track('fx.scan', [0, 1], [0.15, 0]),
    // Reverse of the engine chapter's lift order.
    track('coolantTank.py', [0, 0.12], [0.18, 0.12], [0.3, 0]),
    track('battery.py', [0, 0.12], [0.22, 0.12], [0.34, 0]),
    track('airbox.py', [0, 0.14], [0.26, 0.14], [0.38, 0]),
    track('engineCover.py', [0, 0.16], [0.3, 0.16], [0.44, 0]),
    track('fx.hl.engine', [0, 0]),
    track('hood.rx', [0, -1.1], [0.45, -1.1], [0.72, 0, 'out']),
    track('fx.glass', [0, 0], [0.55, 0], [0.7, 1]),
    track('wheelFR.px', [0, -0.3], [0.6, -0.3], [0.82, 0]),
    track('fx.tyre', [0, 0.07], [0.6, 0.07], [0.82, 1]),
    track('light.cabin', [0, 1], [0.25, 1], [0.6, 0]),
    track('fx.cluster', [0, 1], [0.1, 1], [0.3, 0]),
    track('light.bay', [0, 0], [0.1, 0], [0.3, 0.8], [0.6, 0.8], [0.85, 0]),
    track('light.ambient', [0, 0.03], [0.4, 0.03], [0.9, 0.3]),
    track('light.key', [0, 0.05], [0.5, 0.05], [0.95, 0.8]),
    track('light.floor', [0, 0.15], [0.5, 0.15], [0.95, 0.7]),
  ],
  overlays: [{ id: 'reassembly', from: 0.65, to: 0.98 }],
};
