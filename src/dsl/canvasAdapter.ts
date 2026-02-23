/**
 * Canvas adapter: archspec JSON ↔ React Flow nodes/edges conversion
 *
 * Converts between archspec JSON format and React Flow's node/edge data structures.
 * Positions are NOT managed here (that's CanvasStatePatcher's job in task #4).
 */

import type { ArchspecDocument, Component, Group, Connection } from './archspecZodSchema.js';
import { NODE_TYPE } from '@/constants';

/**
 * React Flow Node structure
 */
export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  parentNode?: string;
  draggable?: boolean;
}

/**
 * React Flow Edge structure
 */
export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

/**
 * Convert archspec JSON to React Flow nodes and edges
 *
 * @param doc - Validated ArchspecDocument
 * @returns Array of nodes and edges for React Flow
 *
 * @example
 * ```typescript
 * const { nodes, edges } = toCanvasNodes(archspecDoc);
 * // Use with React Flow: <ReactFlow nodes={nodes} edges={edges} />
 * ```
 */
export function toCanvasNodes(doc: ArchspecDocument): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  // Convert groups to nodes
  if (doc.groups) {
    for (const group of doc.groups) {
      nodes.push({
        id: group.id,
        type: 'group', // Use generic 'group' type (CollapsibleGroup in task #8)
        position: { x: 0, y: 0 }, // Positions set by CanvasStatePatcher
        data: {
          label: group.label,
          isGroup: true,
        },
        parentNode: group.parent ?? undefined,
        draggable: true,
      });
    }
  }

  // Convert components to nodes
  for (const component of doc.components) {
    nodes.push({
      id: component.id,
      type: NODE_TYPE.ARCH_COMPONENT,
      position: { x: 0, y: 0 }, // Positions set by CanvasStatePatcher
      data: {
        componentType: component.type,
        label: component.label,
        config: component.config ?? {},
      },
      parentNode: component.group,
      draggable: true,
    });
  }

  // Convert connections to edges
  for (const connection of doc.connections) {
    const edgeId = `${connection.from}-${connection.to}`;
    edges.push({
      id: edgeId,
      source: connection.from,
      target: connection.to,
      type: 'archEdge',
      data: {
        protocol: connection.config?.protocol,
        port: connection.config?.port,
        label: connection.config?.label,
        mode: connection.config?.mode,
        fanOut: connection.config?.fanOut,
      },
    });
  }

  return { nodes, edges };
}

/**
 * Convert React Flow nodes and edges back to archspec JSON
 *
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @param archName - Name for the architecture (default: 'Untitled')
 * @param version - Archspec version (default: '1.0')
 * @returns ArchspecDocument (should be validated before use)
 *
 * @example
 * ```typescript
 * const archspecDoc = fromCanvasNodes(nodes, edges, 'My Architecture');
 * const validation = validateArchspec(archspecDoc);
 * if (validation.success) {
 *   const dslText = serialize(validation.data);
 * }
 * ```
 */
export function fromCanvasNodes(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  archName: string = 'Untitled',
  version: string = '1.0'
): ArchspecDocument {
  const components: Component[] = [];
  const groups: Group[] = [];
  const connections: Connection[] = [];

  // Extract groups and components from nodes
  for (const node of nodes) {
    if (node.type === 'group' || node.data?.isGroup) {
      groups.push({
        id: node.id,
        label: node.data?.label ?? node.id,
        parent: node.parentNode ?? null,
      });
    } else if (node.type === NODE_TYPE.ARCH_COMPONENT) {
      components.push({
        id: node.id,
        type: node.data?.componentType ?? 'app_server',
        label: node.data?.label ?? node.id,
        group: node.parentNode,
        config: node.data?.config && Object.keys(node.data.config).length > 0
          ? node.data.config
          : undefined,
      });
    }
  }

  // Extract connections from edges
  for (const edge of edges) {
    const config: Record<string, any> = {};

    if (edge.data?.protocol) config.protocol = edge.data.protocol;
    if (edge.data?.port) config.port = edge.data.port;
    if (edge.data?.label) config.label = edge.data.label;
    if (edge.data?.mode) config.mode = edge.data.mode;
    if (edge.data?.fanOut !== undefined) config.fanOut = edge.data.fanOut;

    connections.push({
      from: edge.source,
      to: edge.target,
      config: Object.keys(config).length > 0 ? config : undefined,
    });
  }

  return {
    archspec_version: version,
    name: archName,
    components,
    groups: groups.length > 0 ? groups : undefined,
    connections,
  };
}
