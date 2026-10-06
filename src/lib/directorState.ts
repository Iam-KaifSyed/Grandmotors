import { timeline } from '../experience/chapters';
import type { Frame } from '../experience/core/types';

let currentFrame: Frame = timeline.sample(0);

export function getFrame(): Frame {
  return currentFrame;
}

export function setFrame(frame: Frame) {
  currentFrame = frame;
}
