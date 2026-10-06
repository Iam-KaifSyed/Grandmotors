import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { getFrame } from '../lib/directorState';

export function HUD() {
  const awakenRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      const frame = getFrame();
      if (!frame) return;

      const awakenOverlay = frame.overlays.find(o => o.id === 'awaken');
      if (awakenRef.current) {
        awakenRef.current.style.opacity = (awakenOverlay?.opacity ?? 0).toString();
      }

      const revealOverlay = frame.overlays.find(o => o.id === 'reveal');
      if (revealRef.current) {
        revealRef.current.style.opacity = (revealOverlay?.opacity ?? 0).toString();
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none p-12 lg:p-24 flex items-center">

      {/* AWAKEN OVERLAY */}
      <div
        ref={awakenRef}
        className="opacity-0 absolute left-8 lg:left-24 top-1/2 -translate-y-1/2 text-white font-light tracking-[0.2em] leading-tight"
      >
        <h1 className="text-xl md:text-3xl text-neutral-300">
          ENGINEERED<br />
          FOR THE<br />
          ROAD.
        </h1>
      </div>

      
      {/* REVEAL OVERLAY */}
      <div
        ref={revealRef}
        className="opacity-0 absolute left-8 lg:left-24 top-1/2 -translate-y-1/2 text-white font-light tracking-[0.2em] leading-tight"
      >
        <h1 className="text-xl md:text-3xl text-neutral-300">
          PRECISION<br />
          STARTS WITH<br />
          UNDERSTANDING.
        </h1>
      </div>

      <a
        href="https://sketchfab.com/3d-models/cafe-nhan-sam-hoa-tan-queen-food-e28a0fb813ad49e0ba610c7fa0137146"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 pointer-events-auto text-[10px] opacity-20 hover:opacity-50 text-neutral-500 font-sans tracking-normal"
      >
        3D Model: CC-BY-4.0 Khoai Lang Tím Sấy Giòn Queen Food
      </a>
    </div>
  );
}
