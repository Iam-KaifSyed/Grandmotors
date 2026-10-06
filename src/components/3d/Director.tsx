import { useFrame } from '@react-three/fiber';
import { timeline, VH_PER_BEAT } from '../../experience/chapters';
import { setFrame } from '../../lib/directorState';
import { damp, scrollState } from '../../lib/progress';
import { useEffect } from 'react';

export function Director() {
  useEffect(() => {
    const totalVh = timeline.totalBeats * VH_PER_BEAT;
    document.body.style.height = `${totalVh}vh`;

    return () => {
      document.body.style.height = '';
    };
  }, []);

  useFrame((_, delta) => {
    // 1. Smooth scroll
    scrollState.current = damp(scrollState.current, scrollState.target, 5.0, delta);

    // 2. Evaluate chapter timeframe
    const frame = timeline.sample(scrollState.current);
    setFrame(frame);
  });

  return null;
}
