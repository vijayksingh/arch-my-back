/**
 * Z-index layering constants for stacking UI elements.
 * Higher values appear above lower values.
 */

export const Z_INDEX = {
  /** Base layer (default) */
  BASE: 0,

  /** Node resize handles */
  RESIZE_HANDLE: 20,

  /** Drag preview overlay */
  DRAG_PREVIEW: 50,

  /** Modal pickers and overlays */
  MODAL_PICKER: 200,
} as const;
