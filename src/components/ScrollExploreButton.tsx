import React, { useRef, useState, useCallback, useEffect } from 'react';
import { scrollToSite } from '../lib/heroScroll';

interface ScrollExploreButtonProps {
  className?: string;
  onClick?: () => void;
}

export function ScrollExploreButton({ className = '', onClick }: ScrollExploreButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    // Check if device supports true hover/pointer
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
      setSupportsHover(mq.matches);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || !supportsHover) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate 3D tilt angles (max +- 15 deg)
    const rotateX = -((y - centerY) / centerY) * 14;
    const rotateY = ((x - centerX) / centerX) * 16;

    // Glare coordinates in percentages
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, glareX, glareY });
  }, [supportsHover]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      scrollToSite('site-content');
    }
  }, [onClick]);

  // Compute 3D transform dynamically
  const transformStyle = isHovered
    ? `perspective(1000px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg) translateZ(${isPressed ? '2px' : '10px'}) scale(${isPressed ? 0.97 : 1.04})`
    : isPressed
    ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(0.96)'
    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';

  return (
    <div className={`btn-3d-perspective-container inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        aria-label="Scroll to explore the website below"
        style={{
          transform: transformStyle,
        }}
        className={`group relative pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full cursor-pointer
          select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--gm-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gm-bg-page)]
          transition-all duration-200 ease-out btn-3d-card ${isHovered ? 'is-hovered' : ''}`}
      >
        {/* 3D Base Plate / Layer 0 */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-b from-[#1c1f24]/90 to-[#0d0f12]/95 border border-[var(--gm-accent-border)] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_0_15px_var(--gm-accent-glow)] backdrop-blur-md transition-all duration-300 group-hover:border-[var(--gm-accent-primary)] group-hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.9),0_0_24px_var(--gm-accent-glow)]"
        />

        {/* 3D Top Beveled Specular Highlight Ring / Layer 1 */}
        <div 
          className="absolute inset-[1px] rounded-full border border-white/10 opacity-70 pointer-events-none group-hover:border-[var(--gm-accent-border)] transition-colors duration-300"
          style={{ transform: 'translateZ(4px)' }}
        />

        {/* Dynamic Specular 3D Glare Sheen / Layer 2 */}
        {isHovered && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-60 transition-opacity duration-200 overflow-hidden"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.22) 0%, rgba(var(--gm-accent-rgb), 0.18) 40%, transparent 75%)`,
              transform: 'translateZ(8px)',
            }}
          />
        )}

        {/* 3D Elevated Label / Layer 3 */}
        <span
          className="relative z-10 text-[10px] md:text-[11px] font-semibold tracking-[0.22em] text-white group-hover:text-white transition-colors duration-200 uppercase btn-3d-text"
          style={{ transform: 'translateZ(14px)' }}
        >
          SCROLL TO EXPLORE
        </span>

        {/* 3D Floating Down Arrow Badge / Layer 4 */}
        <div
          className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-b from-[var(--gm-accent-primary)]/30 to-[var(--gm-accent-primary)]/10 border border-[var(--gm-accent-border)] shadow-[0_2px_8px_var(--gm-accent-glow)] group-hover:scale-110 group-hover:border-[var(--gm-accent-primary)] transition-all duration-300 btn-3d-badge"
          style={{ transform: 'translateZ(20px)' }}
        >
          <svg
            className="w-2.5 h-2.5 text-white group-hover:text-white transition-transform duration-300 btn-3d-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </button>
    </div>
  );
}
