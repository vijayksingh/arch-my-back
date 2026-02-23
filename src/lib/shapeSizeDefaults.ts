import type { CanvasShapeKind } from '@/types';

/**
 * Default dimensions for each shape type
 */
export const DEFAULT_SHAPE_SIZES = {
  rectangle: { width: 180, height: 110 },
  circle: { width: 130, height: 130 },
  text: { width: 180, height: 44 },
} as const;

/**
 * Get default size for a given shape type
 */
export function getDefaultShapeSize(shapeType: CanvasShapeKind): {
  width: number;
  height: number;
} {
  return DEFAULT_SHAPE_SIZES[shapeType];
}
