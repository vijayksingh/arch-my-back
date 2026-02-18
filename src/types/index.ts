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

export interface SectionBadgeNodeData {
  blockId: string;
  blockType: NotebookBlockType;
  label: string;
  [key: string]: unknown;
}

export type SectionBadgeNode = Node<SectionBadgeNodeData, 'sectionBadge'>;

export type CanvasNode = ArchNode | CanvasShapeNode | SectionBadgeNode;

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
  linkedBlockId?: string;
}

// --- Notebook Block Types ---

export type NotebookBlockType = 'text' | 'requirements' | 'schema' | 'api' | 'lld';

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
  kind: 'functional' | 'non-functional';
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
  status?: 'draft' | 'review' | 'final';
}

export type NotebookBlock =
  | (NotebookBlockBase & { type: 'text'; data: TextBlockData })
  | (NotebookBlockBase & { type: 'requirements'; data: RequirementsBlockData })
  | (NotebookBlockBase & { type: 'schema'; data: SchemaBlockData })
  | (NotebookBlockBase & { type: 'api'; data: ApiBlockData })
  | (NotebookBlockBase & { type: 'lld'; data: LldBlockData });
