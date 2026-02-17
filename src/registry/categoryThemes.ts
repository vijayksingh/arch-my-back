import type { ComponentCategory } from '@/types';

/**
 * Centralized category theme registry.
 * Single source of truth for all category-based theming across the application.
 */

/**
 * CSS custom property tokens for category accent colors.
 * Use with: `hsl(var(${token}))`
 */
export const categoryAccentTokens: Record<ComponentCategory, string> = {
  Traffic: '--category-traffic-accent',
  Compute: '--category-compute-accent',
  Storage: '--category-storage-accent',
  Messaging: '--category-messaging-accent',
  Caching: '--category-caching-accent',
  External: '--category-external-accent',
};

/**
 * CSS custom property values for category glow effects.
 * Use directly as: `var(${glow})`
 */
export const categoryGlows: Record<ComponentCategory, string> = {
  Traffic: 'var(--glow-traffic)',
  Compute: 'var(--glow-compute)',
  Storage: 'var(--glow-storage)',
  Messaging: 'var(--glow-messaging)',
  Caching: 'var(--glow-caching)',
  External: 'var(--glow-external)',
};

/**
 * Resolved HSL color strings for category accents.
 * Use directly in styles or minimap colors.
 */
export const categoryColors: Record<ComponentCategory, string> = {
  Traffic: 'hsl(var(--category-traffic-accent))',
  Compute: 'hsl(var(--category-compute-accent))',
  Storage: 'hsl(var(--category-storage-accent))',
  Messaging: 'hsl(var(--category-messaging-accent))',
  Caching: 'hsl(var(--category-caching-accent))',
  External: 'hsl(var(--category-external-accent))',
};

/**
 * Get the CSS custom property token for a category's accent color.
 * @param category - The component category
 * @returns The CSS token string (e.g., '--category-traffic-accent')
 */
export function getCategoryAccentToken(category: ComponentCategory): string {
  return categoryAccentTokens[category];
}

/**
 * Get the glow CSS variable for a category.
 * @param category - The component category
 * @returns The CSS variable string (e.g., 'var(--glow-traffic)')
 */
export function getCategoryGlow(category: ComponentCategory): string {
  return categoryGlows[category];
}

/**
 * Get the resolved HSL color string for a category.
 * @param category - The component category
 * @returns The HSL color string (e.g., 'hsl(var(--category-traffic-accent))')
 */
export function getCategoryColor(category: ComponentCategory): string {
  return categoryColors[category];
}
