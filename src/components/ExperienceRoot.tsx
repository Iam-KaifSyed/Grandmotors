import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { detectTier, getTier } from '../lib/DeviceTier';
import { scrollState } from '../lib/progress';

import { Director } from './3d/Director';
import { CameraManager } from './3d/CameraManager';
import { Environment } from './3d/Environment';
import { Greybox } from './3d/Greybox';
import { DebugPanel } from './3d/DebugPanel';
import { HUD } from './HUD';
import { VH_PER_BEAT, timeline } from '../experience/chapters';

gsap.registerPlugin(ScrollTrigger);

export function ExperienceRoot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Determine tier
    detectTier().then(() => setReady(true));

    // Setup Lenis
    const lenis = new Lenis({
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    const st = ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scrollState.target = self.progress;
      }
    });

    return () => {
      lenis.destroy();
      st.kill();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  const totalBeats = timeline.totalBeats;
  const isHighTier = ready && getTier() === 'high';
  // Standard fixed DPR approach depending on tier
  const dpr = ready ? (getTier() === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2)) : 1;

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none bg-[#050506]">
        {ready && (
          <Canvas
            className="w-full h-full"
            camera={{ near: 0.1, far: 100 }}
            dpr={dpr}
            gl={{ antialias: isHighTier, alpha: false, preserveDrawingBuffer: false }}
            shadows
          >
            <Director />
            <CameraManager />
            <Environment />
            <Greybox />
          </Canvas>
        )}

        <HUD />

        {/* Scrubber / Tweakpane controls */}
        {import.meta.env.DEV && <DebugPanel />}
      </div>

      <div 
        id="scroll-container"
        style={{ width: '100%', height: `${totalBeats * VH_PER_BEAT}vh` }} 
      />
    </>
  );
}
