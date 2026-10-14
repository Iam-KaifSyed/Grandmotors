'use client';

import { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Monitor, Palette, Check, ChevronDown } from 'lucide-react';
import {
  type ThemeMode,
  type ThemeAccent,
  type EffectiveMode,
  ACCENT_LIST,
  ACCENT_THEMES,
  getStoredThemeMode,
  getStoredThemeAccent,
  resolveEffectiveMode,
  setThemeMode,
  setThemeAccent,
  THEME_CHANGE_EVENT,
} from '../../lib/theme';

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredThemeMode());
  const [accent, setAccentState] = useState<ThemeAccent>(() => getStoredThemeAccent());
  const [effectiveMode, setEffectiveMode] = useState<EffectiveMode>(() =>
    resolveEffectiveMode(getStoredThemeMode())
  );

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{
        mode: ThemeMode;
        effectiveMode: EffectiveMode;
        accent: ThemeAccent;
      }>;
      if (customEvent.detail) {
        setModeState(customEvent.detail.mode);
        setEffectiveMode(customEvent.detail.effectiveMode);
        setAccentState(customEvent.detail.accent);
      } else {
        const m = getStoredThemeMode();
        setModeState(m);
        setEffectiveMode(resolveEffectiveMode(m));
        setAccentState(getStoredThemeAccent());
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const toggleMode = () => {
    const nextMode: ThemeMode = effectiveMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  return {
    mode,
    effectiveMode,
    accent,
    setMode: setThemeMode,
    setAccent: setThemeAccent,
    toggleMode,
  };
}

/**
 * Compact Light/Dark Mode toggle button for the Navbar
 */
export function ThemeModeToggle({ className = '' }: { className?: string }) {
  const { effectiveMode, toggleMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted ? effectiveMode === 'light' : false;

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={isLight ? 'Switch to Night Mode' : 'Switch to Day Mode'}
      title={isLight ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)'}
      className={`relative inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full
        bg-[var(--gm-bg-card)]/80 hover:bg-[var(--gm-bg-card-hover)]
        border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-border)]
        text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)]
        backdrop-blur-md transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--gm-accent-primary)] ${className}`}
    >
      <span className="sr-only">Toggle Day/Night Mode</span>
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun Icon (shown in Light mode) */}
        <Sun
          className={`w-4 h-4 transition-all duration-300 absolute ${
            isLight
              ? 'opacity-100 rotate-0 scale-100 text-[var(--gm-accent-primary)]'
              : 'opacity-0 -rotate-90 scale-50'
          }`}
          strokeWidth={2}
        />
        {/* Moon Icon (shown in Dark mode) */}
        <Moon
          className={`w-4 h-4 transition-all duration-300 absolute ${
            !isLight
              ? 'opacity-100 rotate-0 scale-100 text-[var(--gm-text-primary)]'
              : 'opacity-0 rotate-90 scale-50'
          }`}
          strokeWidth={2}
        />
      </div>
    </button>
  );
}

/**
 * Dropdown accent theme picker for the desktop Navbar
 */
export function ThemeAccentPicker({ className = '' }: { className?: string }) {
  const { accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const currentTheme = ACCENT_THEMES[accent] || ACCENT_THEMES.amber;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Select accent theme, currently ${currentTheme.name}`}
        title={`Accent Theme: ${currentTheme.name}`}
        className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold tracking-wider rounded-full
          bg-[var(--gm-bg-card)]/80 hover:bg-[var(--gm-bg-card-hover)]
          border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-border)]
          text-[var(--gm-text-primary)] backdrop-blur-md transition-all duration-200 cursor-pointer
          focus-visible:ring-2 focus-visible:ring-[var(--gm-accent-primary)] shadow-sm"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shadow-sm transition-transform duration-200"
          style={{
            backgroundColor: currentTheme.previewColor,
            boxShadow: `0 0 8px ${currentTheme.previewColor}80`,
          }}
        />
        <span className="hidden xl:inline text-[11px] font-medium tracking-wider uppercase text-[var(--gm-text-secondary)]">
          {currentTheme.name}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[var(--gm-text-secondary)] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div
          role="menu"
          aria-label="Select accent theme"
          className="absolute right-0 top-full mt-2 w-56 p-1.5 rounded-2xl
            bg-[var(--gm-bg-modal)] border border-[var(--gm-border-medium)]
            shadow-2xl shadow-black/40 backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 border-b border-[var(--gm-border-subtle)] mb-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--gm-text-secondary)]">
              <Palette className="w-3.5 h-3.5 text-[var(--gm-accent-primary)]" />
              <span>Accent Themes</span>
            </div>
          </div>

          <div className="space-y-0.5">
            {ACCENT_LIST.map((t) => {
              const isSelected = t.id === accent;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccent(t.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)]'
                      : 'text-[var(--gm-text-primary)] hover:bg-[var(--gm-bg-card-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm transition-transform"
                      style={{
                        backgroundColor: t.previewColor,
                        boxShadow: isSelected ? `0 0 8px ${t.previewColor}` : 'none',
                      }}
                    />
                    <div>
                      <div className="leading-tight text-[12px]">{t.name}</div>
                      <div className="text-[10px] text-[var(--gm-text-secondary)] font-normal">
                        {t.tagline}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[var(--gm-accent-primary)] shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Combined desktop navbar controls
 */
export function ThemeControls({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <ThemeModeToggle />
      <ThemeAccentPicker />
    </div>
  );
}

/**
 * Compact theme controls for the Admin Navbar (Day/Night/System selector + Accent picker)
 */
export function AdminThemeControls({ className = '' }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      {/* Day / Night / System Mode Selector */}
      <div
        role="group"
        aria-label="Appearance Mode"
        className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)]"
      >
        <button
          type="button"
          onClick={() => setMode('light')}
          aria-label="Day Mode"
          title="Day Mode (Light)"
          aria-pressed={mode === 'light'}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${
            mode === 'light'
              ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)] shadow-xs'
              : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] border border-transparent'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Day</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('dark')}
          aria-label="Night Mode"
          title="Night Mode (Dark)"
          aria-pressed={mode === 'dark'}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${
            mode === 'dark'
              ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)] shadow-xs'
              : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] border border-transparent'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Night</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('system')}
          aria-label="System Mode"
          title="System Mode (Auto)"
          aria-pressed={mode === 'system'}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${
            mode === 'system'
              ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)] shadow-xs'
              : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] border border-transparent'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">System</span>
        </button>
      </div>

      {/* Accent Colour Selector */}
      <ThemeAccentPicker />
    </div>
  );
}

/**
 * Mobile Drawer Menu Theme Controls (Subtle, Nav-Aligned & Collapsible)
 */
export function MobileThemeControls() {
  const { mode, accent, setMode, setAccent } = useTheme();
  const [accentOpen, setAccentOpen] = useState(false);

  const currentTheme = ACCENT_THEMES[accent] || ACCENT_THEMES.amber;

  return (
    <div className="pt-2 border-t border-[var(--gm-border-subtle)] space-y-1">
      {/* 1. Appearance Mode: Subtle Row Blending with Nav Links */}
      <div className="flex items-center justify-between px-4 py-2 text-xs font-bold tracking-[0.14em] uppercase text-[var(--gm-text-secondary)] rounded-xl">
        <span className="text-[11px] sm:text-xs">Appearance</span>
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)]">
          <button
            type="button"
            onClick={() => setMode('dark')}
            aria-label="Night Mode"
            title="Night Mode"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${
              mode === 'dark'
                ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)] shadow-xs'
                : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)]'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span>Night</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('light')}
            aria-label="Day Mode"
            title="Day Mode"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${
              mode === 'light'
                ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)] shadow-xs'
                : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)]'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>Day</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('system')}
            aria-label="System Mode"
            title="System Mode"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${
              mode === 'system'
                ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)] shadow-xs'
                : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)]'
            }`}
          >
            <Monitor className="w-3 h-3" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 2. Accent Colour: Collapsible Dropdown Row */}
      <div>
        <button
          type="button"
          onClick={() => setAccentOpen((prev) => !prev)}
          aria-expanded={accentOpen}
          aria-controls="mobile-accent-palette"
          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold tracking-[0.14em] uppercase rounded-xl transition-all cursor-pointer ${
            accentOpen
              ? 'bg-[var(--gm-bg-card-hover)] text-[var(--gm-text-primary)]'
              : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] hover:bg-[var(--gm-bg-card-hover)]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform duration-200"
              style={{
                backgroundColor: currentTheme.previewColor,
                boxShadow: `0 0 6px ${currentTheme.previewColor}80`,
              }}
            />
            <span className="text-[11px] sm:text-xs">Accent Colour</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[var(--gm-accent-primary)] tracking-normal normal-case">
              {currentTheme.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--gm-text-secondary)] transition-transform duration-200 ${
                accentOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Collapsible Palette */}
        {accentOpen && (
          <div
            id="mobile-accent-palette"
            className="mt-1 p-1 rounded-xl bg-[var(--gm-bg-card)]/60 border border-[var(--gm-border-subtle)] space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {ACCENT_LIST.map((t) => {
              const isSelected = t.id === accent;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAccent(t.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)]'
                      : 'text-[var(--gm-text-primary)] hover:bg-[var(--gm-bg-card-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{
                        backgroundColor: t.previewColor,
                        boxShadow: isSelected ? `0 0 8px ${t.previewColor}` : 'none',
                      }}
                    />
                    <div>
                      <div className="leading-tight text-[12px]">{t.name}</div>
                      <div className="text-[10px] text-[var(--gm-text-secondary)] font-normal">
                        {t.tagline}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check
                      className="w-4 h-4 text-[var(--gm-accent-primary)] shrink-0"
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
