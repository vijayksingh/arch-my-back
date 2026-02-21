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

// Widget Definitions - Wave 2 Widgets
export { comparisonTableWidget } from './comparison-table/comparisonTableDefinition';
export { timelineWidget } from './timeline/timelineDefinition';
export { codeDiffWidget } from './code-diff/codeDiffDefinition';

// Widget Definitions - Wave 3 Widgets
export { annotationLayerWidget } from './annotation-layer/annotationLayerDefinition';
export { tradeoffsCardWidget } from './tradeoffs-card/tradeoffsCardDefinition';
export { codeBlockWidget } from './code-block/codeBlockDefinition';
export { breadcrumbWidget } from './breadcrumb/breadcrumbDefinition';

// Initialize: Register all widgets
import { widgetRegistry } from './registry/widgetRegistry';
import { comparisonTableWidget } from './comparison-table/comparisonTableDefinition';
import { timelineWidget } from './timeline/timelineDefinition';
import { codeDiffWidget } from './code-diff/codeDiffDefinition';
import { annotationLayerWidget } from './annotation-layer/annotationLayerDefinition';
import { tradeoffsCardWidget } from './tradeoffs-card/tradeoffsCardDefinition';
import { codeBlockWidget } from './code-block/codeBlockDefinition';
import { breadcrumbWidget } from './breadcrumb/breadcrumbDefinition';

// Auto-register on module load
widgetRegistry.registerMany([
  // Wave 2
  comparisonTableWidget,
  timelineWidget,
  codeDiffWidget,
  // Wave 3
  annotationLayerWidget,
  tradeoffsCardWidget,
  codeBlockWidget,
  breadcrumbWidget,
]);
