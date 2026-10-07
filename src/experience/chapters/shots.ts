import { shot } from './util';

export const B = {
  // Hero render quality test shot (3/4 front, grounded, cinematic lens)
  heroFront: shot([-3.1, 1.22, 3.4], [-0.75, 0.52, 0.1], 32),
  
  // Chapter 00: Hero Composition (Occupies 55-65% width on center/right, height 1.22m, negative space on left)
  open: shot([-3.1, 1.22, 3.4], [-0.75, 0.52, 0.1], 32),
  openEnd: shot([-3.2, 1.35, 3.8], [-0.5, 0.6, 0.2], 30), // 09 MAINTENANCE & CUSTOM (Wide beauty shot)

  // Car is at Z=0 for this test!
  arrivalEnd: shot([-4.0, 1.1, 0.0], [0, 0.7, 0], 35), // 08 BODY, GLASS & INTERIOR (Side profile)
  revealEnd: shot([2.0, 0.5, 3.6], [0.3, 0.4, 1.8], 30), // 07 A/C & CLIMATE (Front intks/grille)

  // Specific service shots
  engineEnd: shot([-1.2, 0.8, 3.4], [-0.4, 0.6, 1.8], 30), // 06 ELECTRICAL (Headlights/Front)
  brakesEnd: shot([-2.0, 0.9, 0.8], [-0.6, 0.6, 1.2], 26), // 05 STEERING & SUSPENSION (Wheel arch/Kinematics)
  suspensionEnd: shot([-2.2, 0.4, -1.8], [-0.9, 0.4, -1.4], 30), // 04 TYRES & WHEELS (Rear tyre low)
  diagnosticsEnd: shot([-1.8, 0.45, 1.8], [-0.8, 0.35, 1.5], 38), // 03 BRAKES (Front left wheel focus)
  reassemblyEnd: shot([0.5, 1.8, -3.5], [0, 1.0, -1.5], 42), // 02 ENGINE & DIAGNOSTICS (Top down rear engine)
  ignitionEnd: shot([0, 1.55, 10.4], [0, 1.0, 0.2], 32),
} as const;
