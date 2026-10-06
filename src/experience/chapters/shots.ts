import { shot } from './util';

export const B = {
  // Hero render quality test shot (3/4 front, grounded, cinematic lens)
  heroFront: shot([-3.2, 0.8, 3.8], [0.2, 0.5, 0.0], 32),
  
  open: shot([-4.2, 1.0, 4.8], [0.0, 0.4, 0.0], 35),
  openEnd: shot([-4.0, 1.05, 4.6], [0.0, 0.42, 0.0], 35), // Micro push-in

  // Car is at Z=0 for this test!
  arrivalEnd: shot([-3.5, 0.4, -3.5], [0, 0.6, 0.5], 35),
  revealEnd: shot([3.5, 0.8, 3.5], [0, 0.6, 0.5], 30),

  // Dummies
  engineEnd: shot([-1.9, 1.5, 3.1], [-0.9, 0.7, 1.6], 30),
  brakesEnd: shot([-2.0, 0.6, 2.1], [-0.85, 0.45, 1.42], 26),
  suspensionEnd: shot([-2.3, 1.1, 0.4], [-0.9, 1.0, 0.1], 30),
  diagnosticsEnd: shot([-0.3, 1.28, -0.25], [0, 1.0, 0.9], 38),
  reassemblyEnd: shot([0, 1.7, 7], [0, 0.95, 0.3], 42),
  ignitionEnd: shot([0, 1.55, 10.4], [0, 1.0, 0.2], 32),
} as const;
