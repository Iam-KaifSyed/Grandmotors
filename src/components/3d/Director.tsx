import { useFrame } from '@react-three/fiber';
import { timeline } from '../../experience/chapters';
import { setFrame } from '../../lib/directorState';
import { damp, scrollState } from '../../lib/progress';

export function Director() {
  useFrame((_, delta) => {
    // 1. Smooth scroll
    scrollState.current = damp(scrollState.current, scrollState.target, 5.0, delta);

    // 2. Evaluate chapter timeframe
    const frame = timeline.sample(scrollState.current);
    setFrame(frame);
  });

  return null;
}
