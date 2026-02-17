import type { Node, Edge } from '@xyflow/react';

// --- Component Registry Types ---

export type ComponentCategory =
  | 'Traffic'
  | 'Compute'
  | 'Storage'
  | 'Messaging'
  | 'Caching'
  | 'External';

export interface ComponentTypeConfig {
  key: string;
  label: string;
  category: ComponentCategory;
  icon: string; // lucide-react icon name
  description: string;
  defaultConfig: Record<string, unknown>;
  configFields: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  defaultValue: string | number;
}

// --- Canvas Node/Edge Types ---

export interface ArchNodeData {
  componentType: string; // key from registry
  label: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

export type ArchNode = Node<ArchNodeData, 'archComponent'>;

export type CanvasShapeKind = 'rectangle' | 'circle' | 'text';

export interface CanvasShapeNodeData {
  label: string;
  shape: CanvasShapeKind;
  fontSize?: number;
  [key: string]: unknown;
}

export type CanvasShapeNode = Node<
  CanvasShapeNodeData,
  'shapeRect' | 'shapeCircle' | 'shapeText'
>;

export type CanvasNode = ArchNode | CanvasShapeNode;

export interface ArchEdgeData {
  protocol?: string;
  port?: number;
  label?: string;
  [key: string]: unknown;
}

export type ArchEdge = Edge<ArchEdgeData>;

// --- Template Types ---

export interface DesignTemplate {
  slug: string;
  title: string;
  description: string;
  nodes: CanvasNode[];
  edges: ArchEdge[];
}

// --- Workspace / Document Types ---

export type WorkspaceViewMode = 'document' | 'both' | 'canvas';
export type CanvasTool = 'cursor' | 'select' | 'rectangle' | 'circle' | 'text';

export interface CanvasBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasSection {
  id: string;
  title: string;
  nodeIds: string[];
  bounds: CanvasBounds;
  createdAt: number;
}

// --- Store Types ---

export interface CanvasState {
  nodes: CanvasNode[];
  edges: ArchEdge[];
  selectedNodeId: string | null;
}
