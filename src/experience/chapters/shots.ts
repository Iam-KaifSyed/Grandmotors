import { shot } from './util';

/**
 * Shots shared by neighbouring chapters. The compiler rejects any camera jump at a
 * chapter boundary, so each boundary is defined exactly once, here.
 *
 * Canonical frame: +y up, +z toward the car's front, +x toward the car's left.
 * Right-hand drive, so the driver sits on -x and the "FR" wheel is at -x.
 * Reference dimensions (metres): body 2.0 wide, 4.8 long, 1.95 tall; wheel radius 0.42.
 * Front-right wheel centre about (-0.9, 0.42, 1.42). Driver cluster about (-0.4, 1.0, 0.85).
 */
export const B = {
  open: shot([0, 1.15, 10], [0, 0.9, -2.6], 30),
  openEnd: shot([0, 1.1, 8.4], [0, 0.9, -2.6], 30),
  arrivalEnd: shot([-4.4, 1.1, 5.2], [0, 0.9, 0.4], 36),
  revealEnd: shot([2.8, 1.5, 5.6], [0, 1.0, 1.0], 34),
  engineEnd: shot([-1.9, 1.5, 3.1], [-0.9, 0.7, 1.6], 30),
  brakesEnd: shot([-2.0, 0.6, 2.1], [-0.85, 0.45, 1.42], 26),
  suspensionEnd: shot([-2.3, 1.1, 0.4], [-0.9, 1.0, 0.1], 30),
  diagnosticsEnd: shot([-0.3, 1.28, -0.25], [0, 1.0, 0.9], 38),
  reassemblyEnd: shot([0, 1.7, 7], [0, 0.95, 0.3], 42),
  ignitionEnd: shot([0, 1.55, 10.4], [0, 1.0, 0.2], 32),
} as const;
