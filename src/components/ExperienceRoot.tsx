import { Suspense, useEffect, useRef, useState } from 'react';
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
import { Navbar } from './Navbar';
import { CinematicIntro } from './CinematicIntro';
import { MaterialDiagnostics } from './3d/MaterialDiagnostics';
import { VH_PER_BEAT, timeline } from '../experience/chapters';

gsap.registerPlugin(ScrollTrigger);

export function ExperienceRoot() {
  const [ready, setReady] = useState(true);
  const lenisRef = useRef<Lenis | null>(null);
  const [introFinished, setIntroFinished] = useState(false);
  const [heroTransitioning, setHeroTransitioning] = useState(false);
  const [heroComplete, setHeroComplete] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCompletelyCovered, setIsCompletelyCovered] = useState(false);

  useEffect(() => {
    // Reset director state and scroll position to 0 for initial 3D experience
    scrollState.target = 0;
    scrollState.current = 0;

    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      if (window.scrollY > 0 && !window.location.hash) {
        window.scrollTo(0, 0);
      }
    }

    // Determine tier in background (non-blocking)
    detectTier().catch(() => {}).finally(() => setReady(true));

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
        // As we reach the final beats, fade out the bottom HUD cues so they don't clash with incoming content
        setHeroTransitioning(self.progress >= 0.90);
        // Chapter indicator fades once the 3D sequence has concluded
        setHeroComplete(self.progress >= 0.98);
      },
      onLeave: () => {
        setHeroTransitioning(true);
        setHeroComplete(true);
      },
      onEnterBack: (self) => {
        if (self.progress < 0.95) {
          setHeroComplete(false);
        }
        if (self.progress < 0.88) {
          setHeroTransitioning(false);
        }
      },
    });

    // Track scroll position for navbar styling & GPU canvas culling once completely obscured
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 40);

      const scrollContainer = document.getElementById('scroll-container');
      if (scrollContainer) {
        const triggerHeight = scrollContainer.offsetHeight;
        // Covered ONLY when user has scrolled past the valid, non-zero scroll-container height
        setIsCompletelyCovered(triggerHeight > 0 && scrollY >= triggerHeight);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
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
  const isHighTier = ready && getTier() !== 'low';
  const dpr = ready ? (getTier() === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2)) : 1;

  return (
    <>
      {/* 1. Permanent Fixed Top Navbar across entire page */}
      <Navbar heroComplete={heroComplete} isScrolled={isScrolled} />

      {/* 2. Fixed 3D Canvas Layer (calibrated dark garage setup preserved) */}
      <div
        id="experience-canvas-container"
        className="fixed inset-0 w-full h-full pointer-events-none bg-[#07090A] overflow-hidden"
        style={{
          zIndex: 0,
          visibility: isCompletelyCovered ? 'hidden' : 'visible',
          backgroundColor: '#07090a',
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
              toneMappingExposure: 1.0,
            }}
            shadows
          >
            <Director />
            <CameraManager />
            <Suspense fallback={null}>
              <Environment />
              <HeroVehicle />
            </Suspense>
          </Canvas>
        )}

        {/* HUD: Chapter Typography and Bottom Telemetry / Explore Cue */}
        <HUD hideBottomCues={heroTransitioning} />

        {/* Scrubber / Tweakpane controls (gated behind ?debug=true flag) */}
        <DebugPanel />
      </div>

      {/* HTML overlay injected below the canvas relative to pointer events */}
      <MaterialDiagnostics />

      {/* Scroll track for the 3D chapters */}
      <div
        id="scroll-container"
        style={{ width: '100%', height: `${totalBeats * VH_PER_BEAT}vh` }}
      />

      {!introFinished && <CinematicIntro onComplete={() => setIntroFinished(true)} />}
    </>
  );
}
