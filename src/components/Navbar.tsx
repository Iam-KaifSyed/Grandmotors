import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getFrame } from '../lib/directorState';
import { CHAPTER_DATA } from '../lib/chapterTransitions';

const navLinks = [
  { href: '/', label: 'HOME' },
  { href: '/services', label: 'SERVICES' },
  { href: '/my-bookings', label: 'MY BOOKINGS' },
  { href: '/about', label: 'ABOUT' },
  { href: '/contact', label: 'CONTACT' },
];

interface NavbarProps {
  heroComplete?: boolean;
  isScrolled?: boolean;
}

export function Navbar({ heroComplete = false, isScrolled = false }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const indicatorNumberRef = useRef<HTMLSpanElement>(null);
  const indicatorLabelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let prevChapter = -1;

    const tick = () => {
      const frame = getFrame();
      if (!frame) return;

      const currentChapter = Math.max(0, Math.min(CHAPTER_DATA.length - 1, frame.chapter));

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
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300 ${
        isScrolled || heroComplete
          ? 'bg-[#07090A]/90 backdrop-blur-md border-b border-white/8 shadow-lg shadow-black/40 py-3 sm:py-3.5'
          : 'bg-gradient-to-b from-[#07090A]/90 via-[#07090A]/40 to-transparent py-4 sm:py-5 md:py-6'
      }`}
    >
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-between">
        {/* Brand */}
        <a
          href="/"
          className="flex items-center gap-2 sm:gap-3 pointer-events-auto group shrink-0 pt-0.5"
          aria-label="Grand Motors Home"
        >
          <span className="text-xs md:text-sm font-semibold tracking-[0.25em] text-[#F2F0EA] uppercase group-hover:text-[#B88952] transition-colors">
            GRAND MOTORS
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B88952] opacity-80 group-hover:opacity-100 transition-opacity shadow-[0_0_6px_rgba(184,137,82,0.8)]" />
        </a>

        {/* Minimal Desktop Navigation Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-6 lg:gap-10 pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 shadow-lg shadow-black/30"
        >
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
        <div className="flex items-center gap-3 sm:gap-5 md:gap-7 pointer-events-auto">
          {/* Book Service Button */}
          <div className="hidden sm:block">
            <a
              href="/book-service"
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] active:bg-[#a67943] rounded-full transition-colors pointer-events-auto shadow-md shadow-[#B88952]/15"
            >
              Book Service
            </a>
          </div>

          {/* Dynamic Chapter Indicator (visible during 3D beats, fades smoothly on hero completion) */}
          <div
            className={`hero-chapter text-right pointer-events-none transition-opacity duration-300 ${
              heroComplete ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'
            }`}
          >
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
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[#F2F0EA] hover:text-[#B88952] hover:border-[#B88952]/40 transition-all cursor-pointer pointer-events-auto"
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
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-[60px] z-50 pointer-events-auto animate-in fade-in duration-200">
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
            <div className="pt-3 border-t border-white/8 space-y-2.5">
              <a
                href="/book-service"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-bold tracking-[0.18em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-xl transition-colors text-center shadow-lg shadow-[#B88952]/15"
              >
                Book Service
              </a>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="tel:+918623948898"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                >
                  <span>Call</span>
                </a>
                <a
                  href="https://wa.me/918623948898"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl transition-colors"
                >
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
