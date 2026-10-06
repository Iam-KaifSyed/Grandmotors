import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { getFrame } from '../lib/directorState';

export function HUD() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      const frame = getFrame();
      if (!frame || !heroRef.current) return;

      const heroOverlay = frame.overlays.find(o => o.id === 'hero');
      heroRef.current.style.opacity = (heroOverlay?.opacity ?? 0).toString();
      heroRef.current.style.pointerEvents = heroOverlay?.opacity ? 'auto' : 'none';
      heroRef.current.style.transform = `translateY(${(1 - (heroOverlay?.opacity ?? 0)) * 10}px)`;
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
      <div 
        ref={heroRef}
        className="opacity-0 transition-opacity duration-100 ease-linear text-white tracking-[0.3em] font-light text-sm md:text-base uppercase flex flex-col items-center"
      >
        <span className="opacity-70 text-xs mb-2 tracking-[0.4em]">Moosapet, Hyderabad</span>
        <h1 className="text-3xl md:text-5xl font-medium tracking-[0.2em] uppercase" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>Grand Motor</h1>
      </div>
    </div>
  );
}
