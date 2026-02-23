/**
 * Drag-and-drop data type discriminators
 * MIME types used for drag data transfer between UI elements
 */
export const DRAG_DATA_TYPE = {
  COMPONENT: 'application/archcomponent',
  WIDGET: 'application/widget',
} as const;

export type DragDataTypeId = typeof DRAG_DATA_TYPE[keyof typeof DRAG_DATA_TYPE];
