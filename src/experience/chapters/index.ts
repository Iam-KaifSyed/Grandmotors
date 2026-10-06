import type { Chapter } from '../core/types';
import { compileTimeline } from '../core/timeline';
import { open } from './00-open';
import { arrival } from './01-arrival';
import { reveal } from './02-reveal';
import { engine } from './03-engine';
import { brakes } from './04-brakes';
import { suspension } from './05-suspension';
import { diagnostics } from './06-diagnostics';
import { reassembly } from './07-reassembly';
import { ignition } from './08-ignition';

export const CHAPTERS: readonly Chapter[] = [
  open,
  arrival,
  reveal,
  engine,
  brakes,
  suspension,
  diagnostics,
  reassembly,
  ignition,
];

export const timeline = compileTimeline(CHAPTERS);

/** Scroll length of one beat, in viewport heights. 22.4 beats comes to about 10 screens. */
export const VH_PER_BEAT = 45;
