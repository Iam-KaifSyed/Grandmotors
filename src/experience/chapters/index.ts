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

function reverseChapter(c: Chapter): Chapter {
  return {
    ...c,
    camera: c.camera.map(key => ({ ...key, t: 1 - key.t })).reverse(),
    tracks: c.tracks.map(tr => ({
      ...tr,
      keys: tr.keys.map(k => ({ ...k, t: 1 - k.t })).reverse()
    })),
    overlays: c.overlays.map(o => ({
      ...o,
      from: Math.max(0, 1 - (o.to || 1)),
      to: Math.min(1, 1 - (o.from || 0))
    })).reverse()
  };
}

export const CHAPTERS: readonly Chapter[] = [
  ignition,
  reassembly,
  diagnostics,
  suspension,
  brakes,
  engine,
  reveal,
  arrival,
  open,
].map(reverseChapter);

export const timeline = compileTimeline(CHAPTERS);

/** Scroll length of one beat, in viewport heights. 22.4 beats comes to about 10 screens. */
export const VH_PER_BEAT = 45;
