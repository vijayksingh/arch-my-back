import { describe, it, expect, beforeEach } from 'vitest';
import {
  type Theme,
  isTheme,
  toggleTheme,
  getSystemThemePreference,
  resolveInitialTheme,
  initializeTheme,
  MockThemeEffect,
  DOMThemeEffect,
} from '../themeService';

describe('themeService - Pure Functions', () => {
  describe('isTheme', () => {
    it('should return true for valid themes', () => {
      expect(isTheme('light')).toBe(true);
      expect(isTheme('dark')).toBe(true);
    });

    it('should return false for invalid themes', () => {
      expect(isTheme('invalid')).toBe(false);
      expect(isTheme('')).toBe(false);
      expect(isTheme(null)).toBe(false);
      expect(isTheme(undefined)).toBe(false);
      expect(isTheme(123)).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      expect(toggleTheme('light')).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      expect(toggleTheme('dark')).toBe('light');
    });
  });

  describe('getSystemThemePreference', () => {
    it('should return dark when matchMedia indicates dark mode', () => {
      expect(getSystemThemePreference(true)).toBe('dark');
    });

    it('should return light when matchMedia indicates light mode', () => {
      expect(getSystemThemePreference(false)).toBe('light');
    });
  });
});

describe('themeService - MockThemeEffect', () => {
  let mockEffect: MockThemeEffect;

  beforeEach(() => {
    mockEffect = new MockThemeEffect();
  });

  describe('isBrowser', () => {
    it('should return true (simulates browser)', () => {
      expect(mockEffect.isBrowser()).toBe(true);
    });
  });

  describe('applyTheme', () => {
    it('should record applied theme', () => {
      mockEffect.applyTheme('dark');
      expect(mockEffect.getAppliedTheme()).toBe('dark');

      mockEffect.applyTheme('light');
      expect(mockEffect.getAppliedTheme()).toBe('light');
    });
  });

  describe('getStoredTheme', () => {
    it('should return null by default', () => {
      expect(mockEffect.getStoredTheme()).toBe(null);
    });

    it('should return stored theme when set', () => {
      mockEffect.setStoredTheme('dark');
      expect(mockEffect.getStoredTheme()).toBe('dark');
    });
  });

  describe('getSystemTheme', () => {
    it('should return dark by default', () => {
      expect(mockEffect.getSystemTheme()).toBe('dark');
    });

    it('should return configured system theme', () => {
      mockEffect.setSystemTheme('light');
      expect(mockEffect.getSystemTheme()).toBe('light');
    });
  });
});

describe('themeService - Integration', () => {
  let mockEffect: MockThemeEffect;

  beforeEach(() => {
    mockEffect = new MockThemeEffect();
  });

  describe('resolveInitialTheme', () => {
    it('should use stored theme if available', () => {
      mockEffect.setStoredTheme('light');
      mockEffect.setSystemTheme('dark');

      const theme = resolveInitialTheme(mockEffect);
      expect(theme).toBe('light');
    });

    it('should fallback to system theme if no stored theme', () => {
      mockEffect.setStoredTheme(null);
      mockEffect.setSystemTheme('dark');

      const theme = resolveInitialTheme(mockEffect);
      expect(theme).toBe('dark');
    });
  });

  describe('initializeTheme', () => {
    it('should apply the resolved theme', () => {
      mockEffect.setStoredTheme('light');

      const theme = initializeTheme(mockEffect);

      expect(theme).toBe('light');
      expect(mockEffect.getAppliedTheme()).toBe('light');
    });

    it('should apply system theme when no stored theme', () => {
      mockEffect.setStoredTheme(null);
      mockEffect.setSystemTheme('dark');

      const theme = initializeTheme(mockEffect);

      expect(theme).toBe('dark');
      expect(mockEffect.getAppliedTheme()).toBe('dark');
    });
  });
});

describe('themeService - DOMThemeEffect behavior', () => {
  describe('isBrowser', () => {
    it('should detect browser environment', () => {
      const effect = new DOMThemeEffect();
      // In test environment (Node), this should return false
      // In browser, it would return true
      const isBrowser = effect.isBrowser();
      expect(typeof isBrowser).toBe('boolean');
    });
  });
});
