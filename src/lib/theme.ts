export type ThemeMode = 'dark' | 'light' | 'system';
export type EffectiveMode = 'dark' | 'light';
export type ThemeAccent = 'amber' | 'red' | 'blue' | 'green' | 'violet';

export interface AccentDefinition {
  id: ThemeAccent;
  name: string;
  tagline: string;
  colorDark: string;
  colorLight: string;
  rgbDark: string;
  rgbLight: string;
  previewColor: string;
}

export const ACCENT_THEMES: Record<ThemeAccent, AccentDefinition> = {
  amber: {
    id: 'amber',
    name: 'Grand Amber',
    tagline: 'Signature Heritage',
    colorDark: '#b88952',
    colorLight: '#a87432',
    rgbDark: '184, 137, 82',
    rgbLight: '168, 116, 50',
    previewColor: '#b88952',
  },
  red: {
    id: 'red',
    name: 'Racing Red',
    tagline: 'Motorsport Spirit',
    colorDark: '#ef4444',
    colorLight: '#dc2626',
    rgbDark: '239, 68, 68',
    rgbLight: '220, 38, 38',
    previewColor: '#ef4444',
  },
  blue: {
    id: 'blue',
    name: 'Electric Blue',
    tagline: 'Precision Dynamic',
    colorDark: '#0ea5e9',
    colorLight: '#0284c7',
    rgbDark: '14, 165, 233',
    rgbLight: '2, 132, 199',
    previewColor: '#0ea5e9',
  },
  green: {
    id: 'green',
    name: 'Emerald Green',
    tagline: 'British Racing Legacy',
    colorDark: '#10b981',
    colorLight: '#059669',
    rgbDark: '16, 185, 129',
    rgbLight: '5, 150, 105',
    previewColor: '#10b981',
  },
  violet: {
    id: 'violet',
    name: 'Royal Violet',
    tagline: 'Executive Luxury',
    colorDark: '#a855f7',
    colorLight: '#7e22ce',
    rgbDark: '168, 85, 247',
    rgbLight: '126, 34, 206',
    previewColor: '#a855f7',
  },
};

export const ACCENT_LIST: AccentDefinition[] = Object.values(ACCENT_THEMES);

export const THEME_MODE_STORAGE_KEY = 'gm-theme-mode';
export const THEME_ACCENT_STORAGE_KEY = 'gm-theme-accent';
export const THEME_CHANGE_EVENT = 'gm-theme-change';

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  return 'dark'; // Default Night Mode
}

export function getStoredThemeAccent(): ThemeAccent {
  if (typeof window === 'undefined') return 'amber';
  try {
    const stored = localStorage.getItem(THEME_ACCENT_STORAGE_KEY);
    if (stored && stored in ACCENT_THEMES) {
      return stored as ThemeAccent;
    }
  } catch {
    // Ignore storage errors
  }
  return 'amber'; // Default Grand Amber
}

export function resolveEffectiveMode(mode: ThemeMode): EffectiveMode {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  }
  return mode;
}

export function applyTheme(mode: ThemeMode, accent: ThemeAccent): void {
  if (typeof document === 'undefined') return;
  const effectiveMode = resolveEffectiveMode(mode);
  const root = document.documentElement;

  root.setAttribute('data-theme-mode', effectiveMode);
  root.setAttribute('data-theme-accent', accent);
  root.classList.toggle('dark', effectiveMode === 'dark');
  root.classList.toggle('light', effectiveMode === 'light');

  // Update meta theme-color for mobile address bars
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', effectiveMode === 'light' ? '#f6f7f9' : '#07090a');
  }

  // Dispatch custom event so all active React / Astro components update synchronously
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: { mode, effectiveMode, accent },
      })
    );
  }
}

export function setThemeMode(mode: ThemeMode): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    }
  } catch {
    // Ignore storage errors
  }
  const currentAccent = getStoredThemeAccent();
  applyTheme(mode, currentAccent);
}

export function setThemeAccent(accent: ThemeAccent): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_ACCENT_STORAGE_KEY, accent);
    }
  } catch {
    // Ignore storage errors
  }
  const currentMode = getStoredThemeMode();
  applyTheme(currentMode, accent);
}

export function initTheme(): void {
  if (typeof window === 'undefined') return;
  const mode = getStoredThemeMode();
  const accent = getStoredThemeAccent();
  applyTheme(mode, accent);

  // Listen to OS color scheme changes when mode is 'system'
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemChange = () => {
      const currentMode = getStoredThemeMode();
      if (currentMode === 'system') {
        const currentAccent = getStoredThemeAccent();
        applyTheme('system', currentAccent);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemChange);
    }
  }
}
