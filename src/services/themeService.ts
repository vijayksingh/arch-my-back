/**
 * Theme Service - Functional Core / Imperative Shell Pattern
 *
 * Separates pure domain logic from side effects:
 * - Pure functions: toggleTheme, isTheme, getSystemTheme
 * - Side effects: ThemeEffect interface for DOM/storage operations
 * - Dependency injection: getThemeEffect() factory
 */

export type Theme = 'light' | 'dark';

// ============================================================================
// FUNCTIONAL CORE - Pure domain logic, no side effects
// ============================================================================

/**
 * Type guard for Theme
 */
export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * Toggle theme between light and dark
 */
export function toggleTheme(currentTheme: Theme): Theme {
  return currentTheme === 'dark' ? 'light' : 'dark';
}

/**
 * Get system preference for theme (used as fallback)
 * Pure function - returns a Theme based on matchMedia result
 */
export function getSystemThemePreference(matchesDarkMode: boolean): Theme {
  return matchesDarkMode ? 'dark' : 'light';
}

// ============================================================================
// IMPERATIVE SHELL - Side effects interface
// ============================================================================

/**
 * Interface for theme side effects (DOM manipulation, storage)
 * Allows dependency injection and mocking in tests
 */
export interface ThemeEffect {
  /**
   * Apply theme to the DOM
   */
  applyTheme(theme: Theme): void;

  /**
   * Get stored theme from persistence layer
   */
  getStoredTheme(): Theme | null;

  /**
   * Get system theme preference
   */
  getSystemTheme(): Theme;

  /**
   * Check if code is running in browser environment
   */
  isBrowser(): boolean;
}

// ============================================================================
// PRODUCTION IMPLEMENTATION - Real DOM/storage operations
// ============================================================================

const THEME_STORAGE_KEY = 'archmyback_theme';

interface PersistedThemeShape {
  state?: {
    theme?: unknown;
  };
}

/**
 * Production implementation using real DOM and localStorage
 */
export class DOMThemeEffect implements ThemeEffect {
  private themeCache: Theme | null | undefined;

  constructor() {
    this.themeCache = undefined;
  }

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  applyTheme(theme: Theme): void {
    if (!this.isBrowser()) return;

    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.setAttribute('data-theme', theme);
  }

  getStoredTheme(): Theme | null {
    if (!this.isBrowser()) return null;

    // Return cached value if available
    if (this.themeCache !== undefined) return this.themeCache;

    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      this.themeCache = null;
      return null;
    }

    // Supports both Zustand persist JSON payload and plain-string fallback
    if (isTheme(raw)) {
      this.themeCache = raw;
      return raw;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedThemeShape;
      if (isTheme(parsed?.state?.theme)) {
        this.themeCache = parsed.state.theme;
        return parsed.state.theme;
      }
    } catch {
      this.themeCache = null;
      return null;
    }

    this.themeCache = null;
    return null;
  }

  getSystemTheme(): Theme {
    if (!this.isBrowser()) return 'dark';

    const matchesDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return getSystemThemePreference(matchesDarkMode);
  }

  /**
   * Update cache when theme changes (called by store)
   */
  updateCache(theme: Theme): void {
    this.themeCache = theme;
  }
}

// ============================================================================
// MOCK IMPLEMENTATION - For testing
// ============================================================================

/**
 * Mock implementation for testing (no real DOM/storage operations)
 */
export class MockThemeEffect implements ThemeEffect {
  private appliedTheme: Theme | null = null;
  private storedTheme: Theme | null = null;
  private systemTheme: Theme = 'dark';

  isBrowser(): boolean {
    return true; // Simulate browser environment
  }

  applyTheme(theme: Theme): void {
    this.appliedTheme = theme;
  }

  getStoredTheme(): Theme | null {
    return this.storedTheme;
  }

  getSystemTheme(): Theme {
    return this.systemTheme;
  }

  getAppliedTheme(): Theme | null {
    return this.appliedTheme;
  }

  // Test helpers
  setStoredTheme(theme: Theme | null): void {
    this.storedTheme = theme;
  }

  setSystemTheme(theme: Theme): void {
    this.systemTheme = theme;
  }
}

// ============================================================================
// FACTORY - Dependency injection
// ============================================================================

let themeEffectInstance: ThemeEffect | null = null;

/**
 * Get theme effect instance (singleton for production)
 */
export function getThemeEffect(): ThemeEffect {
  if (!themeEffectInstance) {
    themeEffectInstance = new DOMThemeEffect();
  }
  return themeEffectInstance;
}

/**
 * Set theme effect instance (for testing)
 */
export function setThemeEffect(effect: ThemeEffect): void {
  themeEffectInstance = effect;
}

/**
 * Reset theme effect instance to default
 */
export function resetThemeEffect(): void {
  themeEffectInstance = null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Resolve initial theme from storage or system preference
 */
export function resolveInitialTheme(effect: ThemeEffect): Theme {
  return effect.getStoredTheme() ?? effect.getSystemTheme();
}

/**
 * Initialize theme on app startup
 */
export function initializeTheme(effect?: ThemeEffect): Theme {
  const themeEffect = effect ?? getThemeEffect();
  const initialTheme = resolveInitialTheme(themeEffect);
  themeEffect.applyTheme(initialTheme);
  return initialTheme;
}
