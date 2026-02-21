/**
 * Widget System - Entry point
 *
 * Exports all widget-related types, stores, and utilities
 */

// Types
export * from './types';

// Registry
export { widgetRegistry, getWidgetsByCategory } from './registry/widgetRegistry';

// Store
export { useWidgetStore } from './store/widgetStore';

// Composition
export { compositionEngine, CompositionEngine } from './composition/compositionEngine';

// Widget Definitions - Real Widgets
export { comparisonTableWidget } from './comparison-table/comparisonTableDefinition';
export { timelineWidget } from './timeline/timelineDefinition';
export { codeDiffWidget } from './code-diff/codeDiffDefinition';

// Widget Definitions - Placeholder Widgets (Wave 3)
export { placeholderWidgets } from './definitions/placeholderWidgets';

// Initialize: Register all widgets
import { widgetRegistry } from './registry/widgetRegistry';
import { comparisonTableWidget } from './comparison-table/comparisonTableDefinition';
import { timelineWidget } from './timeline/timelineDefinition';
import { codeDiffWidget } from './code-diff/codeDiffDefinition';
import { placeholderWidgets } from './definitions/placeholderWidgets';

// Auto-register on module load
widgetRegistry.registerMany([
  comparisonTableWidget,
  timelineWidget,
  codeDiffWidget,
  ...placeholderWidgets,
]);
