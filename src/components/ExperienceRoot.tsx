import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { detectTier, getTier } from '../lib/DeviceTier';
import { scrollState } from '../lib/progress';
import { registerLenis } from '../lib/heroScroll';
import * as THREE from 'three';

import { Director } from './3d/Director';
import { CameraManager } from './3d/CameraManager';
import { Environment } from './3d/Environment';
import { HeroVehicle } from './3d/HeroVehicle';
import { DebugPanel } from './3d/DebugPanel';
import { HUD } from './HUD';
import { CinematicIntro } from './CinematicIntro';
import { MaterialDiagnostics } from './3d/MaterialDiagnostics';
import { VH_PER_BEAT, timeline } from '../experience/chapters';
import { SiteContent } from './site/SiteContent';

gsap.registerPlugin(ScrollTrigger);

export function ExperienceRoot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const [introFinished, setIntroFinished] = useState(false);
  // When the 3D hero scroll completes, fade the fixed canvas/HUD layer out so
  // the website below sits cleanly on its own. The 3D experience itself is
  // untouched — this only controls the opacity of the fixed overlay layer.
  const [heroComplete, setHeroComplete] = useState(false);

  useEffect(() => {
    // Determine tier
    detectTier().then(() => setReady(true));

    // Setup Lenis
    const lenis = new Lenis({
      smoothWheel: true,
      anchors: true,
    });
    lenisRef.current = lenis;
    registerLenis(lenis); // expose for the HUD "Scroll to Explore" cue
    lenis.stop(); // Lock scroll during cinematic intro

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const st = ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scrollState.target = self.progress;
        // Fade the fixed hero layer out once its scroll range is complete, so the
        // website content below is not overlaid by the canvas/HUD.
        setHeroComplete(self.progress >= 0.999);
      },
      onLeave: () => setHeroComplete(true),
      onEnterBack: () => setHeroComplete(false),
    });

    return () => {
      lenis.destroy();
      registerLenis(null);
      st.kill();
      gsap.ticker.remove(tick);
    };
  }, []);

  // Start Lenis when intro finishes
  useEffect(() => {
    if (introFinished && lenisRef.current) {
      lenisRef.current.start();
    }
  }, [introFinished]);

  const totalBeats = timeline.totalBeats;
  // Always aim for clean presentation
  const isHighTier = ready && getTier() !== 'low';
  // Use higher DPR for this render quality pass
  const dpr = ready ? (getTier() === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2)) : 1;

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 w-full h-full pointer-events-none bg-[#07090A] overflow-hidden transition-opacity duration-700 ease-out"
        style={{
          opacity: heroComplete ? 0 : 1,
          visibility: heroComplete ? 'hidden' : 'visible',
        }}
      >
        {ready && (
          <Canvas
            className="w-full h-full"
            camera={{ near: 0.1, far: 100 }}
            dpr={dpr}
            gl={{ 
              antialias: isHighTier, 
              alpha: false, 
              preserveDrawingBuffer: false,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.0, // Base exposure for cinematic look
            }}
            shadows
          >
            <Director />
            <CameraManager />
            <Environment />
            <HeroVehicle />
          </Canvas>
        )}

        {/* HUD reinstated */}
        <HUD />

        {/* Scrubber / Tweakpane controls (gated behind ?debug=true flag) */}
        <DebugPanel />
      </div>

      {/* HTML overlay injected below the canvas relative to pointer events */}
      <MaterialDiagnostics />

      <div
        id="scroll-container"
        style={{ width: '100%', height: `${totalBeats * VH_PER_BEAT}vh` }}
      />

      {/* Main website — begins below the 3D hero as its own scroll section. */}
      <SiteContent />

      {!introFinished && <CinematicIntro onComplete={() => setIntroFinished(true)} />}
    </>
  );
}
