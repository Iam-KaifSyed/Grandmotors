import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getFrame } from '../lib/directorState';
import { CHAPTER_DATA } from '../lib/chapterTransitions';

import { Home, Wrench, Calendar, Info, Phone } from 'lucide-react';
import { NavBar, type NavItem } from './ui/tubelight-navbar';
import { ThemeControls, ThemeModeToggle, MobileThemeControls } from './ui/ThemeControls';

const navItems: NavItem[] = [
  { name: 'Home', url: '/', icon: Home },
  { name: 'Services', url: '/services', icon: Wrench },
  { name: 'My Bookings', url: '/my-bookings', icon: Calendar },
  { name: 'About', url: '/about', icon: Info },
  { name: 'Contact', url: '/contact', icon: Phone },
];

const navLinks = [
  { href: '/', label: 'HOME' },
  { href: '/services', label: 'SERVICES' },
  { href: '/book-service?location=doorstep#doorstep', label: 'DOORSTEP SERVICE', badge: 'NEW' },
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
          ? 'bg-[var(--gm-bg-nav)] backdrop-blur-md border-b border-[var(--gm-border-subtle)] shadow-sm py-3 sm:py-3.5'
          : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent py-4 sm:py-5 md:py-6'
      }`}
    >
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-between">
        {/* Brand */}
        <a
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto group shrink-0 pt-0.5"
          aria-label="Grand Motors Home"
        >
          <span
            className={`text-xs md:text-sm font-semibold tracking-[0.25em] uppercase group-hover:text-[var(--gm-accent-primary)] transition-colors ${
              isScrolled || heroComplete ? 'text-[var(--gm-text-primary)]' : 'text-white'
            }`}
          >
            GRAND MOTORS
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gm-accent-primary)] opacity-80 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_var(--gm-accent-glow)]" />
        </a>

        {/* Tubelight Navigation Bar (Desktop / Tablet) */}
        <NavBar
          items={navItems}
          currentPath="/"
          className="pointer-events-auto static sm:static translate-x-0 mb-0 sm:pt-0 hidden md:block"
        />

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 pointer-events-auto">
          {/* Desktop Theme Controls (Mode Toggle + Accent Picker) */}
          <ThemeControls className="hidden sm:flex" />

          {/* Mobile Theme Mode Toggle (Sun/Moon direct tap) */}
          <ThemeModeToggle className="sm:hidden" />

          {/* Doorstep Service Button Beside Book Service */}
          <div className="hidden lg:block">
            <a
              href="/book-service?location=doorstep#doorstep"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-[0.14em] uppercase text-[var(--gm-text-primary)] hover:text-[var(--gm-accent-primary)] bg-[var(--gm-bg-card)] hover:bg-[var(--gm-accent-muted)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-border)] rounded-full transition-all group pointer-events-auto cursor-pointer shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gm-accent-primary)] animate-accent-glow" />
              <span>Doorstep</span>
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)] animate-accent-glow shadow-[0_0_8px_var(--gm-accent-glow)]">
                NEW
              </span>
            </a>
          </div>

          {/* Book Service Button */}
          <div className="hidden sm:block">
            <a
              href="/book-service"
              className="inline-flex items-center justify-center px-4 sm:px-4.5 py-1.5 sm:py-2 text-xs font-semibold tracking-[0.14em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] active:bg-[var(--gm-accent-active)] rounded-full transition-colors pointer-events-auto shadow-md shadow-[var(--gm-accent-primary)]/20"
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
            <div className="flex items-baseline justify-end gap-1 font-mono text-xs md:text-sm tracking-wider text-white">
              <span ref={indicatorNumberRef} className="text-white font-semibold">
                01
              </span>
              <span className="text-white/40">/</span>
              <span className="text-white/60 text-[11px]">09</span>
            </div>
            <div
              ref={indicatorLabelRef}
              className="text-[9px] sm:text-[10px] md:text-[11px] font-medium tracking-[0.2em] sm:tracking-[0.22em] text-white/80 uppercase mt-0.5 truncate max-w-[120px] sm:max-w-none"
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
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-[var(--gm-bg-card)]/80 backdrop-blur-md border border-[var(--gm-border-subtle)] text-[var(--gm-text-primary)] hover:text-[var(--gm-accent-primary)] hover:border-[var(--gm-accent-border)] transition-all cursor-pointer pointer-events-auto"
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
        <div className="md:hidden fixed inset-x-4 top-[56px] z-50 pointer-events-auto animate-in fade-in duration-200">
          <div className="bg-[var(--gm-bg-modal)]/95 backdrop-blur-xl border border-[var(--gm-border-medium)] rounded-2xl p-5 shadow-2xl space-y-4 max-w-sm mx-auto max-h-[calc(100dvh-72px)] overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 text-xs font-bold tracking-[0.14em] uppercase text-[var(--gm-text-secondary)] hover:text-[var(--gm-accent-primary)] hover:bg-[var(--gm-bg-card-hover)] rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span>{link.label}</span>
                    {(link as any).badge && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)] animate-accent-glow shadow-[0_0_8px_var(--gm-accent-glow)]">
                        {(link as any).badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[var(--gm-accent-primary)] text-xs">&rarr;</span>
                </a>
              ))}
            </nav>

            {/* Mobile Theme & Appearance Section */}
            <MobileThemeControls />

            <div className="pt-3 border-t border-[var(--gm-border-subtle)] space-y-2.5">
              <a
                href="/book-service"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-bold tracking-[0.18em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] rounded-xl transition-colors text-center shadow-lg shadow-[var(--gm-accent-primary)]/20"
              >
                Book Service
              </a>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="tel:+918623948898"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-[var(--gm-text-primary)] bg-[var(--gm-bg-card)] hover:bg-[var(--gm-bg-card-hover)] border border-[var(--gm-border-subtle)] rounded-xl transition-colors"
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
