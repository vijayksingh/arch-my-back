/**
 * Node and UI element dimensions used in logic and layout calculations.
 * These constants represent semantic sizes that are used across multiple files.
 */

/**
 * Architecture component node dimensions
 */
export const ARCH_NODE = {
  WIDTH: 156,
  MIN_HEIGHT: 96,
} as const;

/**
 * Section badge dimensions
 */
export const SECTION_BADGE = {
  WIDTH: 260,
} as const;

/**
 * Size constraints for resizable elements
 */
export const SIZE_CONSTRAINTS = {
  MIN_WIDTH: 48,
  MIN_HEIGHT: 32,
} as const;

/**
 * Font size constraints and defaults
 */
export const FONT_SIZE = {
  MIN: 10,
  MAX: 96,
  DEFAULT_TEXT: 14,
} as const;

/**
 * Default dimensions for groups
 */
export const GROUP_DIMENSIONS = {
  DEFAULT_WIDTH: 300,
  DEFAULT_HEIGHT: 200,
  COLLAPSED_HEIGHT: 36,
  HEADER_HEIGHT: 36,
  PADDING: 20,
} as const;

/**
 * Interaction thresholds
 */
export const INTERACTION = {
  MIN_DRAG_DISTANCE: 20,
} as const;
