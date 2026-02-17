import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type Theme,
  type ThemeEffect,
  getThemeEffect,
  resolveInitialTheme,
  toggleTheme as toggleThemePure,
  DOMThemeEffect,
} from '@/services/themeService';

const THEME_STORAGE_KEY = 'archmyback_theme';

// Get the theme effect instance (dependency injection)
const themeEffect: ThemeEffect = getThemeEffect();

export function initializeTheme(): Theme {
  const initialTheme = resolveInitialTheme(themeEffect);
  themeEffect.applyTheme(initialTheme);
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
      theme: resolveInitialTheme(themeEffect),
      setTheme: (theme) => {
        themeEffect.applyTheme(theme);
        // Update cache if using DOMThemeEffect
        if (themeEffect instanceof DOMThemeEffect) {
          themeEffect.updateCache(theme);
        }
        set({ theme });
      },
      toggleTheme: () => {
        const nextTheme = toggleThemePure(get().theme);
        themeEffect.applyTheme(nextTheme);
        // Update cache if using DOMThemeEffect
        if (themeEffect instanceof DOMThemeEffect) {
          themeEffect.updateCache(nextTheme);
        }
        set({ theme: nextTheme });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        themeEffect.applyTheme(state?.theme ?? resolveInitialTheme(themeEffect));
      },
    }
  )
);
