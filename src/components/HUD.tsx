import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { getFrame } from '../lib/directorState';
import { CHAPTER_DATA, getChapterAnimationState } from '../lib/chapterTransitions';
import { CinematicProgressBar } from './CinematicProgressBar';
import { ScrollExploreButton } from './ScrollExploreButton';


export function HUD() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const indicatorNumberRef = useRef<HTMLSpanElement>(null);
  const indicatorLabelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let prevChapter = -1;

    const tick = () => {
      const frame = getFrame();
      if (!frame) return;

      const currentChapter = Math.max(0, Math.min(CHAPTER_DATA.length - 1, frame.chapter));
      const localProgress = frame.local;

      // 1. Update Chapter Indicator in Header
      if (currentChapter !== prevChapter) {
        prevChapter = currentChapter;
        const currentData = CHAPTER_DATA[currentChapter];
        if (currentData) {
          if (indicatorNumberRef.current) {
            indicatorNumberRef.current.textContent = currentData.chapterNumber;
          }
          if (indicatorLabelRef.current) {
            indicatorLabelRef.current.textContent = currentData.chapterLabel;
          }
        }
      }

      // 2. Animate Chapter Typography Groups (Strict Zero-Overlap Rule)
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
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION & CHAPTER INDICATOR                        */}
      {/* ============================================================ */}
      <header className="hero-nav w-full px-6 md:px-12 lg:px-16 pt-8 md:pt-10 flex items-start justify-between">
        {/* Brand */}
        <a href="/" className="flex items-center gap-3 pointer-events-auto group">
          <span className="text-xs md:text-sm font-semibold tracking-[0.25em] text-[#F2F0EA] uppercase group-hover:text-[#B88952] transition-colors">
            GRAND MOTORS
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B88952] opacity-80 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Minimal Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-12 pointer-events-auto">
          <a
            href="/"
            className="text-[11px] font-medium tracking-[0.2em] text-[#D8D6D0]/70 hover:text-[#F2F0EA] transition-colors duration-200 uppercase"
          >
            HOME
          </a>
          <a
            href="/services"
            className="text-[11px] font-medium tracking-[0.2em] text-[#D8D6D0]/70 hover:text-[#F2F0EA] transition-colors duration-200 uppercase"
          >
            SERVICES
          </a>
          <a
            href="/about"
            className="text-[11px] font-medium tracking-[0.2em] text-[#D8D6D0]/70 hover:text-[#F2F0EA] transition-colors duration-200 uppercase"
          >
            ABOUT
          </a>
          <a
            href="/contact"
            className="text-[11px] font-medium tracking-[0.2em] text-[#D8D6D0]/70 hover:text-[#F2F0EA] transition-colors duration-200 uppercase"
          >
            CONTACT
          </a>
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center gap-6 md:gap-10 pointer-events-auto">
          {/* Book Service Button */}
          <div className="hidden sm:block">
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center px-5 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-full transition-colors pointer-events-auto"
            >
              Book Service
            </a>
          </div>

          {/* Dynamic Chapter Indicator */}
          <div className="hero-chapter text-right pointer-events-none">
          <div className="flex items-baseline justify-end gap-1 font-mono text-xs md:text-sm tracking-wider">
            <span ref={indicatorNumberRef} className="text-[#F2F0EA] font-semibold">
              01
            </span>
            <span className="text-[#A7AAAD]/40">/</span>
            <span className="text-[#A7AAAD]/60 text-[11px]">09</span>
          </div>
          <div 
            ref={indicatorLabelRef}
            className="text-[10px] md:text-[11px] font-medium tracking-[0.22em] text-[#A7AAAD]/80 uppercase mt-0.5"
          >
            GARAGE ARRIVAL
          </div>
        </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO LEFT-SIDE EDITORIAL TYPOGRAPHY                      */}
      {/* ============================================================ */}
      <main className="relative w-full px-6 md:px-12 lg:px-16 flex-1 flex items-center">
        <div className="relative w-full max-w-xl lg:max-w-2xl lg:ml-[2vw] h-[340px] flex items-center">
          
          {CHAPTER_DATA.map((chapter, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={chapter.chapterNumber}
                ref={(el) => { chapterRefs.current[idx] = el; }}
                className={`chapter-${chapter.chapterNumber} absolute inset-0 flex flex-col justify-center will-change-transform ${
                  isFirst ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                }`}
                style={{
                  transform: 'translateX(0px)',
                }}
              >
                {/* Eyebrow */}
                <div className="hero-eyebrow flex items-center gap-2 mb-4 md:mb-6">
                  <span className="text-[10px] md:text-xs font-semibold tracking-[0.28em] text-[#A7AAAD] uppercase">
                    {chapter.eyebrowCategory}
                  </span>
                  <span className="text-[#B88952] text-[10px] md:text-xs font-medium">/</span>
                  <span className="text-[10px] md:text-xs font-medium tracking-[0.24em] text-[#A7AAAD]/90 uppercase">
                    {chapter.eyebrowName}
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] font-extrabold tracking-[-0.035em] text-[#F2F0EA] leading-[0.92] uppercase mb-5 md:mb-7">
                  {chapter.titleLines.map((line, lineIdx) => (
                    <div 
                      key={lineIdx} 
                      className={`hero-title-line ${lineIdx > 0 ? 'mt-1 md:mt-2' : ''}`}
                    >
                      {line}
                    </div>
                  ))}
                </h1>

                {/* Supporting Description */}
                <p className="hero-description text-xs sm:text-sm md:text-[15px] font-normal tracking-[0.02em] text-[#A7AAAD] leading-relaxed max-w-md mb-6">
                  {chapter.description}
                </p>

                {/* Services List (for chapters 02-09) */}
                {chapter.services && chapter.services.length > 0 && (
                  <ul className="flex flex-col gap-2 mt-2 border-l border-[#B88952]/40 pl-4 py-1">
                    {chapter.services.map((service, sIdx) => (
                      <li key={sIdx} className="text-[11px] md:text-xs font-medium tracking-[0.15em] text-[#A7AAAD]/90 uppercase flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#B88952]/60"></span>
                        {service}
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
      {/* 3. CINEMATIC TIMELINE & BOTTOM FOOTER                        */}
      {/* ============================================================ */}
      <footer className="hero-scroll w-full px-6 md:px-12 lg:px-16 pb-4 md:pb-5 flex flex-col items-center gap-2.5">
        {/* Cinematic Film Timeline Progress Bar */}
        <CinematicProgressBar />

        {/* Cues & Attribution */}
        <div className="w-full flex items-center justify-between text-[10px] md:text-[11px] font-medium tracking-[0.22em] text-[#A7AAAD]/80 uppercase">
          {/* Bottom Left Cue */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#B88952]/80 rounded-full" />
            <span>ENGINEERED FOR THE DRIVE</span>
          </div>

          {/* Bottom Right Cue — 3D interactive button to smoothly scroll to the website */}
          <ScrollExploreButton />
        </div>
      </footer>
    </div>
  );
}
