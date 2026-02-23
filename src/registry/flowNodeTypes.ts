/**
 * Canonical node and edge type registries for ReactFlow.
 *
 * This file centralizes all node and edge type definitions used across
 * the design canvas (Canvas.tsx) and walkthrough canvas (CanvasPanel.tsx).
 */

import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import ArchNodeComponent from '@/components/Canvas/ArchNode';
import ArchEdge from '@/components/Canvas/ArchEdge';
import ShapeNode from '@/components/Canvas/ShapeNode';
import SectionBadgeNode from '@/components/Canvas/SectionBadgeNode';
import CollapsibleGroupNode from '@/components/Canvas/CollapsibleGroupNode';
import WidgetNode from '@/widgets/canvas/WidgetNode';

/**
 * Base node types shared by both design canvas and walkthrough canvas.
 * Includes: archComponent, shape nodes (rect/circle/text), and sectionBadge.
 */
export const baseNodeTypes: NodeTypes = {
  archComponent: ArchNodeComponent,
  shapeRect: ShapeNode,
  shapeCircle: ShapeNode,
  shapeText: ShapeNode,
  sectionBadge: SectionBadgeNode,
};

/**
 * Full node types for the design canvas.
 * Extends baseNodeTypes with collapsibleGroup and widgetNode.
 */
export const designNodeTypes: NodeTypes = {
  ...baseNodeTypes,
  collapsibleGroup: CollapsibleGroupNode,
  widgetNode: WidgetNode as any, // Type assertion needed for widget integration
};

/**
 * Edge types shared by both design and walkthrough canvases.
 * Both archEdge and default use the ArchEdge component.
 */
export const archEdgeTypes: EdgeTypes = {
  archEdge: ArchEdge,
  default: ArchEdge,
};
