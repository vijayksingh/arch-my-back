/**
 * Canvas tool mode discriminators
 * Used to control which drawing/interaction mode is active
 */
export const CANVAS_TOOL = {
  CURSOR: 'cursor',
  SELECT: 'select',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text',
} as const;

export type CanvasToolId = typeof CANVAS_TOOL[keyof typeof CANVAS_TOOL];
