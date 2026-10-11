import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { getFrame } from '../lib/directorState';
import { CHAPTER_DATA, getChapterAnimationState } from '../lib/chapterTransitions';
import { CinematicProgressBar } from './CinematicProgressBar';
import { ScrollExploreButton } from './ScrollExploreButton';

interface HUDProps {
  hideBottomCues?: boolean;
}

export function HUD({ hideBottomCues = false }: HUDProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let prevChapter = -1;

    const tick = () => {
      const frame = getFrame();
      if (!frame) return;

      const currentChapter = Math.max(0, Math.min(CHAPTER_DATA.length - 1, frame.chapter));
      const localProgress = frame.local;

      // Animate Chapter Typography Groups (Strict Zero-Overlap Rule)
      CHAPTER_DATA.forEach((_, idx) => {
        const el = chapterRefs.current[idx];
        if (!el) return;

        const { opacity, transform, isVisible } = getChapterAnimationState(
          idx,
          currentChapter,
          localProgress,
          CHAPTER_DATA[idx].direction,
          CHAPTER_DATA.length
        );

        el.style.opacity = opacity.toFixed(3);
        el.style.transform = transform;
        el.style.visibility = isVisible ? 'visible' : 'hidden';
        el.style.pointerEvents = isVisible ? 'auto' : 'none';
      });
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Spacer where Navbar sits at top */}
      <div className="w-full h-20 pointer-events-none" />

      {/* ============================================================ */}
      {/* 1. HERO LEFT-SIDE EDITORIAL TYPOGRAPHY                      */}
      {/* ============================================================ */}
      <main className="relative w-full px-4 sm:px-8 md:px-12 lg:px-16 flex-1 flex items-center">
        <div className="relative w-full max-w-xl lg:max-w-2xl lg:ml-[2vw] min-h-[260px] sm:min-h-[300px] md:min-h-[340px] flex items-center">
          {CHAPTER_DATA.map((chapter, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={chapter.chapterNumber}
                ref={(el) => {
                  chapterRefs.current[idx] = el;
                }}
                className={`chapter-${chapter.chapterNumber} absolute inset-0 flex flex-col justify-center will-change-transform ${
                  isFirst ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                }`}
                style={{
                  transform: 'translateX(0px)',
                }}
              >
                {/* Eyebrow */}
                <div className="hero-eyebrow flex items-center gap-2 mb-3 sm:mb-4 md:mb-6">
                  <span className="text-[10px] sm:text-xs font-semibold tracking-[0.24em] sm:tracking-[0.28em] text-[#A7AAAD] uppercase">
                    {chapter.eyebrowCategory}
                  </span>
                  <span className="text-[#B88952] text-[10px] sm:text-xs font-medium">/</span>
                  <span className="text-[10px] sm:text-xs font-medium tracking-[0.2em] sm:tracking-[0.24em] text-[#A7AAAD]/90 uppercase">
                    {chapter.eyebrowName}
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] font-extrabold tracking-[-0.035em] text-[#F2F0EA] leading-[0.96] sm:leading-[0.92] uppercase mb-3 sm:mb-5 md:mb-7">
                  {chapter.titleLines.map((line, lineIdx) => (
                    <div
                      key={lineIdx}
                      className={`hero-title-line ${lineIdx > 0 ? 'mt-0.5 sm:mt-1 md:mt-2' : ''}`}
                    >
                      {line}
                    </div>
                  ))}
                </h1>

                {/* Supporting Description */}
                <p className="hero-description text-xs sm:text-sm md:text-[15px] font-normal tracking-[0.02em] text-[#A7AAAD] leading-relaxed max-w-sm sm:max-w-md mb-3 sm:mb-6 line-clamp-3 sm:line-clamp-none">
                  {chapter.description}
                </p>

                {/* Services List (for chapters 02-09) */}
                {chapter.services && chapter.services.length > 0 && (
                  <ul className="flex flex-col gap-1.5 sm:gap-2 mt-1 sm:mt-2 border-l border-[#B88952]/40 pl-3 sm:pl-4 py-0.5 sm:py-1">
                    {chapter.services.map((service, sIdx) => (
                      <li
                        key={sIdx}
                        className="text-[10px] sm:text-[11px] md:text-xs font-medium tracking-[0.12em] sm:tracking-[0.15em] text-[#A7AAAD]/90 uppercase flex items-center gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-[#B88952]/60 shrink-0"></span>
                        <span className="truncate">{service}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* ============================================================ */}
      {/* 2. CINEMATIC TIMELINE & BOTTOM FOOTER                        */}
      {/* ============================================================ */}
      <footer
        className={`hero-scroll w-full px-4 sm:px-8 md:px-12 lg:px-16 pb-3 sm:pb-5 flex flex-col items-center gap-2 sm:gap-2.5 transition-opacity duration-500 ease-out ${
          hideBottomCues ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
        {/* Cinematic Film Timeline Progress Bar */}
        <CinematicProgressBar />

        {/* Cues & Attribution */}
        <div className="w-full flex items-center justify-between text-[10px] md:text-[11px] font-medium tracking-[0.2em] sm:tracking-[0.22em] text-[#A7AAAD]/80 uppercase">
          {/* Bottom Left Cue */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#B88952]/80 rounded-full" />
            <span>ENGINEERED FOR THE DRIVE</span>
          </div>

          {/* Bottom Right Cue — 3D interactive button to smoothly scroll to the website */}
          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <ScrollExploreButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
