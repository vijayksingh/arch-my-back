/**
 * Timing constants for delays, debounces, and animations.
 * All values in milliseconds.
 */

export const TIMING = {
  /** Default debounce delay for save operations */
  DEBOUNCE_SAVE: 2000,

  /** Feedback message display duration */
  FEEDBACK_DISPLAY: 2000,

  /** Short animation duration */
  ANIMATION_SHORT: 180,

  /** Block highlight clear delay */
  BLOCK_HIGHLIGHT_CLEAR: 350,

  /** Block highlight fade duration */
  BLOCK_HIGHLIGHT_FADE: 1500,
} as const;
