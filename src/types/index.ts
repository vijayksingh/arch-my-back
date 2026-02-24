import type { Node, Edge } from '@xyflow/react';
import { BLOCK_TYPE, VIEW_MODE, CANVAS_TOOL, REQUIREMENT_KIND, LLD_STATUS } from '@/constants';
import type { ComponentTypeKey } from './componentTypes';

// --- Component Registry Types ---

export type ComponentCategory =
  | 'Clients'
  | 'Traffic'
  | 'Compute'
  | 'Databases'
  | 'Caching'
  | 'Search & Analytics'
  | 'ML / AI'
  | 'Observability'
  | 'External'
  | 'Messaging';

export interface ComponentTypeConfig {
  key: string;
  label: string;
  category: ComponentCategory;
  icon: string; // lucide-react icon name
  description: string;
  defaultConfig: Record<string, unknown>;
  configFields: ConfigField[];
  configSchema?: Record<string, unknown>; // JSONSchema object for DSL serialization
  primaryFields?: string[]; // 2-3 key fields for progressive disclosure UI
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  defaultValue: string | number;
}

// --- Canvas Node/Edge Types ---

export interface NodeContext {
  purpose?: string; // What this component does
  problemSolved?: string; // Why it exists / what problem it solves
  walkthroughContext?: string; // How it fits into this walkthrough step
  relatedConcepts?: string[]; // Links or related topics
}

export interface ArchNodeData {
  componentType: ComponentTypeKey; // key from registry
  label: string;
  config: Record<string, unknown>;
  context?: NodeContext; // Optional rich context for walkthrough mode
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

export interface SectionBadgeNodeData {
  blockId: string;
  blockType: NotebookBlockType;
  label: string;
  [key: string]: unknown;
}

export type SectionBadgeNode = Node<SectionBadgeNodeData, 'sectionBadge'>;

export interface CollapsibleGroupNodeData {
  label: string;
  isCollapsed: boolean;
  childNodeIds: string[];
  parentGroupId?: string;
  [key: string]: unknown;
}

export type CollapsibleGroupNode = Node<CollapsibleGroupNodeData, 'collapsibleGroup'>;

export type CanvasNode = ArchNode | CanvasShapeNode | SectionBadgeNode | CollapsibleGroupNode;

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

export type WorkspaceViewMode = typeof VIEW_MODE[keyof typeof VIEW_MODE];
export type CanvasTool = typeof CANVAS_TOOL[keyof typeof CANVAS_TOOL];

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
  linkedBlockId?: string;
}

// --- Notebook Block Types ---

export type NotebookBlockType = typeof BLOCK_TYPE[keyof typeof BLOCK_TYPE];

interface NotebookBlockBase {
  id: string;
  type: NotebookBlockType;
  sectionId: string | null;
  createdAt: number;
}

export interface TextBlockData {
  markdown: string;
}

export interface RequirementItem {
  id: string;
  text: string;
  kind: typeof REQUIREMENT_KIND[keyof typeof REQUIREMENT_KIND];
}

export interface RequirementsBlockData {
  items: RequirementItem[];
}

export interface SchemaField {
  id: string;
  name: string;
  fieldType: string;
  constraints: string;
}

export interface SchemaTable {
  id: string;
  name: string;
  fields: SchemaField[];
}

export interface SchemaBlockData {
  tables: SchemaTable[];
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  requestBody: string;
  responseBody: string;
}

export interface ApiBlockData {
  endpoints: ApiEndpoint[];
}

export interface LldBlockData {
  title: string;
  summary?: string;
  content: string;
  status?: typeof LLD_STATUS[keyof typeof LLD_STATUS];
}

export type NotebookBlock =
  | (NotebookBlockBase & { type: typeof BLOCK_TYPE.TEXT; data: TextBlockData })
  | (NotebookBlockBase & { type: typeof BLOCK_TYPE.REQUIREMENTS; data: RequirementsBlockData })
  | (NotebookBlockBase & { type: typeof BLOCK_TYPE.SCHEMA; data: SchemaBlockData })
  | (NotebookBlockBase & { type: typeof BLOCK_TYPE.API; data: ApiBlockData })
  | (NotebookBlockBase & { type: typeof BLOCK_TYPE.LLD; data: LldBlockData });

// --- Simulation Types ---
export * from './simulation';
