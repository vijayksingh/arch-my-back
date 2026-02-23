/**
 * Barrel export for all typed constants
 * Import specific constants from this module to ensure type safety
 */

export { NODE_TYPE, type NodeTypeId } from './nodeTypes';
export { BLOCK_TYPE, type BlockTypeId } from './blockTypes';
export { CANVAS_TOOL, type CanvasToolId } from './canvasTools';
export { WIDGET_TYPE, type WidgetTypeId } from './widgetTypes';
export { REQUIREMENT_KIND, type RequirementKindId } from './requirements';
export { LLD_STATUS, type LLDStatusId } from './lldStatus';
export { VIEW_MODE, type ViewModeId } from './viewModes';
export { DRAG_DATA_TYPE, type DragDataTypeId } from './dragDataTypes';

// Numeric constants
export {
  ARCH_NODE,
  SECTION_BADGE,
  SIZE_CONSTRAINTS,
  FONT_SIZE,
  GROUP_DIMENSIONS,
  INTERACTION,
} from './dimensions';

// Re-export as DIMENSIONS namespace for convenience
export * as DIMENSIONS from './dimensions';
export { TIMING } from './timing';
export { Z_INDEX } from './zIndex';
export { LIMITS } from './limits';
