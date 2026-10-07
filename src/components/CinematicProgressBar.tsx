import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { scrollState } from '../lib/progress';
import { CHAPTER_DATA } from '../lib/chapterTransitions';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  colorType: 'white' | 'amber' | 'gold' | 'deep';
}

export function CinematicProgressBar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // Particle pool
    const sparks: Spark[] = [];
    const MAX_SPARKS = 16;
    let prevProgress = scrollState.current;
    let lastTime = performance.now();
    let idleTimer = 0;

    const spawnSpark = (x: number, y: number, velocity: number) => {
      if (sparks.length >= MAX_SPARKS) return;

      const angle = velocity >= 0 
        ? Math.PI + (Math.random() - 0.5) * 1.2 
        : (Math.random() - 0.5) * 1.2;
      
      const speed = 0.2 + Math.random() * 0.7 + Math.min(Math.abs(velocity) * 80, 1.2);
      const colorTypes: ('white' | 'amber' | 'gold' | 'deep')[] = ['white', 'amber', 'gold', 'deep'];
      const colorType = colorTypes[Math.floor(Math.random() * colorTypes.length)];

      sparks.push({
        x: x + (Math.random() - 0.5) * 2,
        y: y + (Math.random() - 0.5) * 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (0.15 + Math.random() * 0.25), // slight upward thermal lift
        size: 0.6 + Math.random() * 0.8,
        alpha: 0.6 + Math.random() * 0.4,
        maxLife: 20 + Math.floor(Math.random() * 25),
        life: 0,
        colorType
      });
    };

    const tick = () => {
      if (width === 0 || height === 0) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Master scroll progress (clamped 0 to 1)
      const rawProgress = Math.max(0, Math.min(1, scrollState.current));
      const deltaProgress = (rawProgress - prevProgress) / Math.max(dt, 0.001);
      prevProgress = rawProgress;

      const centerY = height / 2;
      const emberX = rawProgress * width;

      // Spawn particles when scrolling or breathing when idle
      const isMoving = Math.abs(deltaProgress) > 0.005;
      if (isMoving) {
        spawnSpark(emberX, centerY, deltaProgress);
        if (Math.abs(deltaProgress) > 0.05 && Math.random() < 0.6) {
          spawnSpark(emberX, centerY, deltaProgress);
        }
        idleTimer = 0;
      } else {
        idleTimer += dt;
        // Idle gentle breathing spark every ~0.6s
        if (idleTimer > 0.45 && Math.random() < 0.15) {
          spawnSpark(emberX, centerY, 0);
          idleTimer = 0;
        }
      }

      // Update particle physics
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.94;
        s.vy *= 0.94;
        s.vy -= 0.015; // buoyancy
        s.life++;

        if (s.life >= s.maxLife) {
          sparks.splice(i, 1);
        }
      }

      // ----------------------------------------------------
      // DRAWING
      // ----------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // 1. Base track line (subtle dark/white-grey line)
      ctx.strokeStyle = 'rgba(242, 240, 234, 0.09)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // 2. Subtle Chapter divisions / film notches
      const totalChapters = CHAPTER_DATA.length;
      if (totalChapters > 1) {
        ctx.fillStyle = 'rgba(242, 240, 234, 0.07)';
        for (let i = 1; i < totalChapters; i++) {
          const notchX = Math.round((i / (totalChapters - 1)) * width);
          ctx.fillRect(notchX - 0.5, centerY - 2, 1, 4);
        }
      }

      // 3. Active Progress Line (travels left -> right)
      if (emberX > 0) {
        // Main active line
        const activeGrad = ctx.createLinearGradient(0, centerY, emberX, centerY);
        activeGrad.addColorStop(0, 'rgba(184, 137, 82, 0.15)');
        activeGrad.addColorStop(0.65, 'rgba(184, 137, 82, 0.45)');
        activeGrad.addColorStop(0.92, 'rgba(224, 168, 102, 0.8)');
        activeGrad.addColorStop(1, 'rgba(255, 248, 235, 0.95)');

        ctx.strokeStyle = activeGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(emberX, centerY);
        ctx.stroke();

        // Subtle leading edge glow segment
        if (emberX > 10) {
          const glowSegmentGrad = ctx.createLinearGradient(emberX - 24, centerY, emberX, centerY);
          glowSegmentGrad.addColorStop(0, 'rgba(184, 137, 82, 0)');
          glowSegmentGrad.addColorStop(1, 'rgba(184, 137, 82, 0.28)');

          ctx.strokeStyle = glowSegmentGrad;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(emberX - 24, centerY);
          ctx.lineTo(emberX, centerY);
          ctx.stroke();
        }
      }

      // 4. Trailing Sparks / Particles
      sparks.forEach((s) => {
        const lifeRatio = s.life / s.maxLife;
        const currentAlpha = s.alpha * (1 - lifeRatio);
        
        let fillColor = `rgba(184, 137, 82, ${currentAlpha})`;
        if (s.colorType === 'white') {
          fillColor = `rgba(255, 248, 235, ${currentAlpha * 0.95})`;
        } else if (s.colorType === 'gold') {
          fillColor = `rgba(235, 178, 110, ${currentAlpha * 0.9})`;
        } else if (s.colorType === 'deep') {
          fillColor = `rgba(140, 94, 46, ${currentAlpha * 0.75})`;
        }

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (1 - lifeRatio * 0.3), 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Hot Glowing Ember at Leading Edge
      const flicker = 0.93 + Math.sin(now * 0.008) * 0.07 + (Math.random() - 0.5) * 0.03;

      // Outer soft amber halo
      const haloGrad = ctx.createRadialGradient(emberX, centerY, 0, emberX, centerY, 10);
      haloGrad.addColorStop(0, `rgba(184, 137, 82, ${0.42 * flicker})`);
      haloGrad.addColorStop(0.45, `rgba(184, 137, 82, ${0.14 * flicker})`);
      haloGrad.addColorStop(1, 'rgba(184, 137, 82, 0)');

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(emberX, centerY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Mid warm-gold glow
      const midGrad = ctx.createRadialGradient(emberX, centerY, 0, emberX, centerY, 4.5);
      midGrad.addColorStop(0, `rgba(255, 215, 160, ${0.85 * flicker})`);
      midGrad.addColorStop(0.65, `rgba(184, 137, 82, ${0.45 * flicker})`);
      midGrad.addColorStop(1, 'rgba(184, 137, 82, 0)');

      ctx.fillStyle = midGrad;
      ctx.beginPath();
      ctx.arc(emberX, centerY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner white-hot spark core
      ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * flicker})`;
      ctx.beginPath();
      ctx.arc(emberX, centerY, 1.4, 0, Math.PI * 2);
      ctx.fill();
    };

    gsap.ticker.add(tick);

    return () => {
      resizeObserver.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    // Seek action
    const seek = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetScroll = ratio * (document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: targetScroll, behavior: 'auto' });
    };

    seek(e.clientX);

    const onPointerMove = (moveEvent: PointerEvent) => {
      seek(moveEvent.clientX);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative w-full h-8 flex items-center justify-center pointer-events-auto cursor-pointer select-none touch-none group"
      aria-hidden="true"
    >
      {/* Invisible hit area for easier grabbing (extends upwards only to avoid blocking bottom cues) */}
      <div className="absolute inset-x-0 -top-4 bottom-0 pointer-events-none" />
      <canvas
        ref={canvasRef}
        className="w-full h-full block group-hover:brightness-125 transition-all"
      />
    </div>
  );
}
