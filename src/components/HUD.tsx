import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getFrame } from '../lib/directorState';
import { CHAPTER_DATA, getChapterAnimationState } from '../lib/chapterTransitions';
import { CinematicProgressBar } from './CinematicProgressBar';
import { ScrollExploreButton } from './ScrollExploreButton';

const navLinks = [
  { href: '/', label: 'HOME' },
  { href: '/services', label: 'SERVICES' },
  { href: '/my-bookings', label: 'MY BOOKINGS' },
  { href: '/about', label: 'ABOUT' },
  { href: '/contact', label: 'CONTACT' },
];

export function HUD() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const indicatorNumberRef = useRef<HTMLSpanElement>(null);
  const indicatorLabelRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="hero-nav w-full px-4 sm:px-8 md:px-12 lg:px-16 pt-5 sm:pt-7 md:pt-9 flex items-start justify-between">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2 sm:gap-3 pointer-events-auto group shrink-0 pt-0.5">
          <span className="text-xs md:text-sm font-semibold tracking-[0.25em] text-[#F2F0EA] uppercase group-hover:text-[#B88952] transition-colors">
            GRAND MOTORS
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B88952] opacity-80 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Minimal Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-10 pointer-events-auto bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-5 py-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[11px] font-semibold tracking-[0.16em] text-[#D8D6D0]/80 hover:text-[#B88952] transition-colors duration-200 uppercase"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8 pointer-events-auto">
          {/* Book Service Button */}
          <div className="hidden sm:block">
            <a
              href="/book-service"
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-full transition-colors pointer-events-auto shadow-md shadow-[#B88952]/10"
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
              className="text-[9px] sm:text-[10px] md:text-[11px] font-medium tracking-[0.2em] sm:tracking-[0.22em] text-[#A7AAAD]/80 uppercase mt-0.5 truncate max-w-[120px] sm:max-w-none"
            >
              GARAGE ARRIVAL
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[#F2F0EA] hover:text-[#B88952] hover:border-[#B88952]/40 transition-all cursor-pointer pointer-events-auto"
          >
            {mobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu on Hero */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-[64px] z-50 pointer-events-auto">
          <div className="bg-[#0e1013]/95 backdrop-blur-xl border border-white/12 rounded-2xl p-5 shadow-2xl space-y-4 max-w-sm mx-auto">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 text-xs font-bold tracking-[0.14em] uppercase text-[#D8D6D0] hover:text-[#B88952] hover:bg-white/5 rounded-xl transition-all"
                >
                  <span>{link.label}</span>
                  <span className="text-[#B88952] text-xs">&rarr;</span>
                </a>
              ))}
            </nav>
            <div className="pt-3 border-t border-white/8 space-y-2">
              <a
                href="/book-service"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-bold tracking-[0.18em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-xl transition-colors text-center"
              >
                Book Service
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. HERO LEFT-SIDE EDITORIAL TYPOGRAPHY                      */}
      {/* ============================================================ */}
      <main className="relative w-full px-4 sm:px-8 md:px-12 lg:px-16 flex-1 flex items-center">
        <div className="relative w-full max-w-xl lg:max-w-2xl lg:ml-[2vw] min-h-[260px] sm:min-h-[300px] md:min-h-[340px] flex items-center">
          
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
                      <li key={sIdx} className="text-[10px] sm:text-[11px] md:text-xs font-medium tracking-[0.12em] sm:tracking-[0.15em] text-[#A7AAAD]/90 uppercase flex items-center gap-2">
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
      {/* 3. CINEMATIC TIMELINE & BOTTOM FOOTER                        */}
      {/* ============================================================ */}
      <footer className="hero-scroll w-full px-4 sm:px-8 md:px-12 lg:px-16 pb-3 sm:pb-5 flex flex-col items-center gap-2 sm:gap-2.5">
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
