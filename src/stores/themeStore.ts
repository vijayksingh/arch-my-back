import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'archmyback_theme';

interface PersistedThemeShape {
  state?: {
    theme?: unknown;
  };
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (!raw) return null;

  // Supports both Zustand persist JSON payload and a plain-string fallback.
  if (isTheme(raw)) return raw;

  try {
    const parsed = JSON.parse(raw) as PersistedThemeShape;
    if (isTheme(parsed?.state?.theme)) return parsed.state.theme;
  } catch {
    return null;
  }

  return null;
}

function resolveInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.setAttribute('data-theme', theme);
}

export function initializeTheme(): Theme {
  const initialTheme = resolveInitialTheme();
  applyTheme(initialTheme);
  return initialTheme;
}

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: resolveInitialTheme(),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        set({ theme: nextTheme });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? resolveInitialTheme());
      },
    }
  )
);
