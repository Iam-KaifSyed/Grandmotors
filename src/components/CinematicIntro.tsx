import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface CinematicIntroProps {
  onComplete: () => void;
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Stable callback ref so effect dependencies don't re-trigger
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const title = titleContainerRef.current;
    const container = containerRef.current;

    if (!title || !container) {
      setIsFinished(true);
      onCompleteRef.current();
      return;
    }

    // -------------------------------------------------------------
    // INTRO SEQUENCE: ONE GSAP TIMELINE (Total duration: 3.0s)
    // 0.0s – 0.5s : Pure dark background. Blur subtle shapes. (No animation here, just wait)
    // 0.5s – 1.3s : "GRAND MOTORS" title reveals (opacity 0->1, blur 12px->0, scale 0.94->1, y 10px->0)
    // 1.3s – 2.2s : HOLD fully visible title. No movement.
    // 2.2s – 3.0s : Transition title and dark background fading out (opacity->0) to reveal hero.
    // -------------------------------------------------------------
    const introTl = gsap.timeline({
      onComplete: () => {
        setIsFinished(true);
        onCompleteRef.current();
      },
    });

    // We start title at opacity:0, scale:0.94, y: 10px, filter blur 12px via inline CSS for stability
    introTl.fromTo(
      title,
      {
        opacity: 0,
        filter: 'blur(12px)',
        scale: 0.94,
        y: 10,
      },
      {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      },
      0.5 // Starts at 0.5s
    )
    .to(
      container,
      {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
      },
      2.2 // Starts at 2.2s
    );

    return () => {
      introTl.kill();
    };
  }, []);

  if (isFinished) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center w-full h-full pointer-events-auto"
      style={{
        zIndex: 9000,
        backgroundColor: '#07090A',
        backgroundImage: 'radial-gradient(ellipse at 50% 40%, rgba(184, 137, 82, 0.04) 0%, transparent 40%, transparent 100%)',
      }}
    >
      <div
        ref={titleContainerRef}
        style={{
          opacity: 0,
          transform: 'scale(0.94) translateY(10px)',
          filter: 'blur(12px)',
          willChange: 'opacity, transform, filter',
        }}
        className="flex flex-col items-center justify-center px-6"
      >
        <div className="flex items-center gap-3 mb-3 md:mb-4">
          <span className="h-px w-6 md:w-10 bg-gradient-to-r from-transparent to-[#B88952]/80" />
          <span className="text-[10px] sm:text-[11px] md:text-xs font-bold tracking-[0.35em] text-[#D8D6D0]/90 uppercase font-mono">
            HIGH PERFORMANCE AUTOMOTIVE
          </span>
          <span className="h-px w-6 md:w-10 bg-gradient-to-l from-transparent to-[#B88952]/80" />
        </div>

        <h1 className="flex flex-col items-center uppercase text-[#F2F0EA] drop-shadow-2xl font-extrabold m-0">
          <span className="text-[11vw] sm:text-[10vw] md:text-[9vw] lg:text-[8vw] leading-[0.92]">
            GRAND
          </span>
          <span className="text-[11vw] sm:text-[10vw] md:text-[9vw] lg:text-[8vw] leading-[0.92] mt-1 md:mt-2">
            MOTORS
          </span>
        </h1>

        <div className="w-[10vw] h-px bg-gradient-to-r from-transparent via-[#B88952] to-transparent mt-6 md:mt-8 opacity-60" />
      </div>
    </div>
  );
}
