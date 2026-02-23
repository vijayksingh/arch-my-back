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
  Clients: '--category-clients-accent',
  Traffic: '--category-traffic-accent',
  Compute: '--category-compute-accent',
  Databases: '--category-databases-accent',
  Caching: '--category-caching-accent',
  'Search & Analytics': '--category-search-accent',
  'ML / AI': '--category-ml-accent',
  Observability: '--category-observability-accent',
  External: '--category-external-accent',
  Messaging: '--category-messaging-accent',
};

/**
 * CSS custom property values for category glow effects.
 * Use directly as: `var(${glow})`
 */
export const categoryGlows: Record<ComponentCategory, string> = {
  Clients: 'var(--glow-clients)',
  Traffic: 'var(--glow-traffic)',
  Compute: 'var(--glow-compute)',
  Databases: 'var(--glow-databases)',
  Caching: 'var(--glow-caching)',
  'Search & Analytics': 'var(--glow-search)',
  'ML / AI': 'var(--glow-ml)',
  Observability: 'var(--glow-observability)',
  External: 'var(--glow-external)',
  Messaging: 'var(--glow-messaging)',
};

/**
 * Resolved HSL color strings for category accents.
 * Use directly in styles or minimap colors.
 */
export const categoryColors: Record<ComponentCategory, string> = {
  Clients: 'hsl(var(--category-clients-accent))',
  Traffic: 'hsl(var(--category-traffic-accent))',
  Compute: 'hsl(var(--category-compute-accent))',
  Databases: 'hsl(var(--category-databases-accent))',
  Caching: 'hsl(var(--category-caching-accent))',
  'Search & Analytics': 'hsl(var(--category-search-accent))',
  'ML / AI': 'hsl(var(--category-ml-accent))',
  Observability: 'hsl(var(--category-observability-accent))',
  External: 'hsl(var(--category-external-accent))',
  Messaging: 'hsl(var(--category-messaging-accent))',
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
