/**
 * View mode discriminators
 * Controls the layout/visibility of document and canvas panels
 */
export const VIEW_MODE = {
  DOCUMENT: 'document',
  BOTH: 'both',
  CANVAS: 'canvas',
} as const;

export type ViewModeId = typeof VIEW_MODE[keyof typeof VIEW_MODE];
