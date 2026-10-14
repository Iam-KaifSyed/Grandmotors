import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ACCENT_THEMES,
  ACCENT_LIST,
  getStoredThemeMode,
  getStoredThemeAccent,
  resolveEffectiveMode,
  applyTheme,
  setThemeMode,
  setThemeAccent,
  initTheme,
  THEME_MODE_STORAGE_KEY,
  THEME_ACCENT_STORAGE_KEY,
  type ThemeAccent,
  type ThemeMode,
} from './theme';

// In-memory mock for localStorage in Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) {
      delete mockStorage[k];
    }
  },
};

// Mock document.documentElement & event listeners
const attributes: Record<string, string> = {};
const classList = new Set<string>();

const docElementMock = {
  setAttribute: (k: string, v: string) => {
    attributes[k] = v;
  },
  getAttribute: (k: string) => attributes[k] ?? null,
  removeAttribute: (k: string) => {
    delete attributes[k];
  },
  classList: {
    add: (c: string) => classList.add(c),
    remove: (c: string) => classList.delete(c),
    toggle: (c: string, force?: boolean) => {
      if (force !== undefined) {
        if (force) classList.add(c);
        else classList.delete(c);
        return force;
      }
      if (classList.has(c)) {
        classList.delete(c);
        return false;
      } else {
        classList.add(c);
        return true;
      }
    },
    contains: (c: string) => classList.has(c),
  },
};

const listeners: Record<string, Function[]> = {};

// @ts-ignore
globalThis.localStorage = localStorageMock;
// @ts-ignore
globalThis.document = {
  documentElement: docElementMock as any,
  querySelector: () => null,
} as any;
// @ts-ignore
globalThis.window = {
  matchMedia: ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as any,
  dispatchEvent: ((event: any) => {
    const list = listeners[event.type] || [];
    list.forEach((fn) => fn(event));
    return true;
  }) as any,
  addEventListener: ((type: string, fn: any) => {
    listeners[type] = listeners[type] || [];
    listeners[type].push(fn);
  }) as any,
  removeEventListener: ((type: string, fn: any) => {
    if (listeners[type]) {
      listeners[type] = listeners[type].filter((cb) => cb !== fn);
    }
  }) as any,
} as any;
// @ts-ignore
globalThis.CustomEvent = class CustomEvent {
  type: string;
  detail: any;
  constructor(type: string, params?: { detail: any }) {
    this.type = type;
    this.detail = params?.detail;
  }
} as any;

describe('Theme System', () => {
  beforeEach(() => {
    localStorageMock.clear();
    for (const k in attributes) delete attributes[k];
    classList.clear();
    for (const k in listeners) delete listeners[k];
  });

  it('defines all 5 required accent themes with colors', () => {
    expect(ACCENT_LIST).toHaveLength(5);
    expect(ACCENT_THEMES.amber.name).toBe('Grand Amber');
    expect(ACCENT_THEMES.red.name).toBe('Racing Red');
    expect(ACCENT_THEMES.blue.name).toBe('Electric Blue');
    expect(ACCENT_THEMES.green.name).toBe('Emerald Green');
    expect(ACCENT_THEMES.violet.name).toBe('Royal Violet');

    for (const accent of ACCENT_LIST) {
      expect(accent.colorDark).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(accent.colorLight).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(accent.rgbDark).toBeTruthy();
      expect(accent.rgbLight).toBeTruthy();
    }
  });

  it('defaults to dark mode (Night Mode) and amber accent', () => {
    expect(getStoredThemeMode()).toBe('dark');
    expect(getStoredThemeAccent()).toBe('amber');
  });

  it('persists theme mode to localStorage', () => {
    setThemeMode('light');
    expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('light');
    expect(getStoredThemeMode()).toBe('light');

    setThemeMode('dark');
    expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark');
    expect(getStoredThemeMode()).toBe('dark');

    setThemeMode('system');
    expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('system');
    expect(getStoredThemeMode()).toBe('system');
  });

  it('persists theme accent to localStorage', () => {
    setThemeAccent('red');
    expect(localStorage.getItem(THEME_ACCENT_STORAGE_KEY)).toBe('red');
    expect(getStoredThemeAccent()).toBe('red');

    setThemeAccent('blue');
    expect(localStorage.getItem(THEME_ACCENT_STORAGE_KEY)).toBe('blue');

    setThemeAccent('green');
    expect(localStorage.getItem(THEME_ACCENT_STORAGE_KEY)).toBe('green');

    setThemeAccent('violet');
    expect(localStorage.getItem(THEME_ACCENT_STORAGE_KEY)).toBe('violet');

    setThemeAccent('amber');
    expect(localStorage.getItem(THEME_ACCENT_STORAGE_KEY)).toBe('amber');
  });

  it('resolves effective mode correctly', () => {
    expect(resolveEffectiveMode('dark')).toBe('dark');
    expect(resolveEffectiveMode('light')).toBe('light');
    const systemResolved = resolveEffectiveMode('system');
    expect(['dark', 'light']).toContain(systemResolved);
  });

  it('applies theme attributes to document.documentElement', () => {
    applyTheme('light', 'blue');
    expect(docElementMock.getAttribute('data-theme-mode')).toBe('light');
    expect(docElementMock.getAttribute('data-theme-accent')).toBe('blue');
    expect(docElementMock.classList.contains('light')).toBe(true);
    expect(docElementMock.classList.contains('dark')).toBe(false);

    applyTheme('dark', 'green');
    expect(docElementMock.getAttribute('data-theme-mode')).toBe('dark');
    expect(docElementMock.getAttribute('data-theme-accent')).toBe('green');
    expect(docElementMock.classList.contains('dark')).toBe(true);
    expect(docElementMock.classList.contains('light')).toBe(false);
  });

  it('dispatches gm-theme-change custom event on theme change', () => {
    const handler = vi.fn();
    window.addEventListener('gm-theme-change', handler);

    setThemeMode('light');
    expect(handler).toHaveBeenCalled();

    window.removeEventListener('gm-theme-change', handler);
  });

  describe('Exhaustive matrix of 5 Colour Themes in Dark and Light modes', () => {
    const themes: ThemeAccent[] = ['amber', 'red', 'blue', 'green', 'violet'];
    const modes: ThemeMode[] = ['dark', 'light'];

    modes.forEach((mode) => {
      themes.forEach((accent) => {
        it(`applies ${ACCENT_THEMES[accent].name} in ${mode === 'dark' ? 'Night (Dark)' : 'Day (Light)'} mode`, () => {
          setThemeMode(mode);
          setThemeAccent(accent);

          expect(docElementMock.getAttribute('data-theme-mode')).toBe(mode);
          expect(docElementMock.getAttribute('data-theme-accent')).toBe(accent);
          expect(docElementMock.classList.contains(mode)).toBe(true);
          expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe(mode);
          expect(localStorage.getItem(THEME_ACCENT_STORAGE_KEY)).toBe(accent);
        });
      });
    });
  });

  describe('Page Navigation / Reload Persistence simulation', () => {
    it('restores user preference after simulated page navigation / reload', () => {
      // 1. User selects Light mode + Electric Blue on page A
      setThemeMode('light');
      setThemeAccent('blue');

      // 2. Simulated reload: DOM reset
      attributes['data-theme-mode'] = '';
      attributes['data-theme-accent'] = '';
      classList.clear();

      // 3. Page load init script runs
      initTheme();

      // 4. Assert restored state
      expect(docElementMock.getAttribute('data-theme-mode')).toBe('light');
      expect(docElementMock.getAttribute('data-theme-accent')).toBe('blue');
      expect(docElementMock.classList.contains('light')).toBe(true);
      expect(getStoredThemeMode()).toBe('light');
      expect(getStoredThemeAccent()).toBe('blue');
    });

    it('falls back safely to default Night Mode (dark + amber) on corrupted storage', () => {
      localStorageMock.setItem(THEME_MODE_STORAGE_KEY, 'invalid-mode');
      localStorageMock.setItem(THEME_ACCENT_STORAGE_KEY, 'invalid-accent');

      initTheme();

      expect(getStoredThemeMode()).toBe('dark');
      expect(getStoredThemeAccent()).toBe('amber');
      expect(docElementMock.getAttribute('data-theme-mode')).toBe('dark');
      expect(docElementMock.getAttribute('data-theme-accent')).toBe('amber');
    });

    it('handles mobile drawer theme adjustments and preserves selections', () => {
      // User changes to Day mode and Royal Violet
      setThemeMode('light');
      setThemeAccent('violet');

      expect(getStoredThemeMode()).toBe('light');
      expect(getStoredThemeAccent()).toBe('violet');

      // User changes to Emerald Green
      setThemeAccent('green');
      expect(getStoredThemeAccent()).toBe('green');

      // User changes back to Night mode
      setThemeMode('dark');
      expect(getStoredThemeMode()).toBe('dark');
      expect(getStoredThemeAccent()).toBe('green');
    });
  });
});
