/**
 * Canvas State Patcher: intelligent diff/patch for DSL → canvas sync
 *
 * Syncs DSL changes to React Flow canvas while preserving user-positioned nodes.
 * Core algorithm:
 * 1. Diff old vs new ArchspecDocument (by component ID)
 * 2. Patch canvas state: preserve positions, update data, add/remove nodes
 * 3. Handle groups with bounding box logic
 * 4. Place new nodes intelligently (near group siblings or below existing)
 */

import type { ArchspecDocument, Component, Group, Connection } from './archspecZodSchema.js';
import { toCanvasNodes, type CanvasNode, type CanvasEdge } from './canvasAdapter.js';

/**
 * Canvas state structure (from canvasStore.ts)
 */
export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * Diff result for a single entity type
 */
interface DiffResult<T> {
  added: T[];
  deleted: T[];
  modified: Array<{ old: T; new: T }>;
  unchanged: T[];
}

/**
 * Full diff between two ArchspecDocuments
 */
interface ArchspecDiff {
  components: DiffResult<Component>;
  groups: DiffResult<Group>;
  connections: DiffResult<Connection>;
}

/**
 * Position hint for placing new nodes
 */
interface PositionHint {
  x: number;
  y: number;
}

/**
 * Main entry point: patch canvas state based on DSL changes
 *
 * @param oldDoc - Previous ArchspecDocument (null on first load)
 * @param newDoc - Current ArchspecDocument
 * @param oldCanvasState - Previous canvas state with user-positioned nodes
 * @returns New canvas state with preserved positions and applied changes
 *
 * @example
 * ```typescript
 * const newCanvasState = patchCanvasState(
 *   prevDoc,
 *   currentDoc,
 *   { nodes: currentNodes, edges: currentEdges }
 * );
 * canvasStore.setState({ nodes: newCanvasState.nodes, edges: newCanvasState.edges });
 * ```
 */
export function patchCanvasState(
  oldDoc: ArchspecDocument | null,
  newDoc: ArchspecDocument,
  oldCanvasState: CanvasState
): CanvasState {
  // Handle first load: no previous state
  if (!oldDoc || oldCanvasState.nodes.length === 0) {
    return firstLoadLayout(newDoc);
  }

  // Handle empty document
  if (newDoc.components.length === 0 && (!newDoc.groups || newDoc.groups.length === 0)) {
    return { nodes: [], edges: [] };
  }

  // Compute diff between old and new documents
  const diff = computeDiff(oldDoc, newDoc);

  // Build position lookup from old canvas state
  const positionMap = buildPositionMap(oldCanvasState.nodes);

  // Patch nodes: preserve, update, add, remove
  const patchedNodes = patchNodes(diff, positionMap, oldCanvasState.nodes);

  // Regenerate edges from connections (positions are automatic in React Flow)
  const patchedEdges = regenerateEdges(newDoc.connections);

  return { nodes: patchedNodes, edges: patchedEdges };
}

/**
 * First load layout: use default stacking layout
 * (ELK.js auto-layout deferred to task #9)
 */
function firstLoadLayout(doc: ArchspecDocument): CanvasState {
  const { nodes: rawNodes, edges } = toCanvasNodes(doc);

  // Apply simple stacking layout
  const layoutNodes = rawNodes.map((node, index) => ({
    ...node,
    position: {
      x: 100,
      y: 100 + index * 150, // Stack vertically
    },
  }));

  return { nodes: layoutNodes, edges };
}

/**
 * Compute diff between two ArchspecDocuments
 */
function computeDiff(oldDoc: ArchspecDocument, newDoc: ArchspecDocument): ArchspecDiff {
  return {
    components: diffByIdWithRename(
      oldDoc.components,
      newDoc.components,
      (c) => c.id,
      (c) => `${c.type}:${c.label}` // Rename detection key
    ),
    groups: diffById(
      oldDoc.groups ?? [],
      newDoc.groups ?? [],
      (g) => g.id
    ),
    connections: diffConnections(oldDoc.connections, newDoc.connections),
  };
}

/**
 * Generic diff by ID
 */
function diffById<T>(
  oldItems: T[],
  newItems: T[],
  getId: (item: T) => string
): DiffResult<T> {
  const oldMap = new Map(oldItems.map((item) => [getId(item), item]));
  const newMap = new Map(newItems.map((item) => [getId(item), item]));

  const added: T[] = [];
  const deleted: T[] = [];
  const modified: Array<{ old: T; new: T }> = [];
  const unchanged: T[] = [];

  // Find added and modified
  for (const [id, newItem] of newMap) {
    const oldItem = oldMap.get(id);
    if (!oldItem) {
      added.push(newItem);
    } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
      modified.push({ old: oldItem, new: newItem });
    } else {
      unchanged.push(newItem);
    }
  }

  // Find deleted
  for (const [id, oldItem] of oldMap) {
    if (!newMap.has(id)) {
      deleted.push(oldItem);
    }
  }

  return { added, deleted, modified, unchanged };
}

/**
 * Diff with rename detection (by type+label matching)
 */
function diffByIdWithRename<T>(
  oldItems: T[],
  newItems: T[],
  getId: (item: T) => string,
  getRenameKey: (item: T) => string
): DiffResult<T> {
  const oldMap = new Map(oldItems.map((item) => [getId(item), item]));
  const newMap = new Map(newItems.map((item) => [getId(item), item]));
  const oldRenameMap = new Map(oldItems.map((item) => [getRenameKey(item), item]));

  const added: T[] = [];
  const deleted: T[] = [];
  const modified: Array<{ old: T; new: T }> = [];
  const unchanged: T[] = [];

  // Find added, modified, or renamed
  for (const [id, newItem] of newMap) {
    const oldItem = oldMap.get(id);
    if (!oldItem) {
      // Check if this is a rename (type+label match)
      const renameKey = getRenameKey(newItem);
      const renamedFrom = oldRenameMap.get(renameKey);
      if (renamedFrom && !newMap.has(getId(renamedFrom))) {
        // Treat as modified (preserve position from old ID)
        modified.push({ old: renamedFrom, new: newItem });
      } else {
        added.push(newItem);
      }
    } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
      modified.push({ old: oldItem, new: newItem });
    } else {
      unchanged.push(newItem);
    }
  }

  // Find deleted (excluding renamed items)
  for (const [id, oldItem] of oldMap) {
    if (!newMap.has(id)) {
      const renameKey = getRenameKey(oldItem);
      const renamedTo = Array.from(newMap.values()).find(
        (newItem) => getRenameKey(newItem) === renameKey && !oldMap.has(getId(newItem))
      );
      if (!renamedTo) {
        deleted.push(oldItem);
      }
    }
  }

  return { added, deleted, modified, unchanged };
}

/**
 * Diff connections (by from-to pair)
 */
function diffConnections(
  oldConnections: Connection[],
  newConnections: Connection[]
): DiffResult<Connection> {
  const getKey = (conn: Connection) => `${conn.from}->${conn.to}`;
  const oldMap = new Map(oldConnections.map((c) => [getKey(c), c]));
  const newMap = new Map(newConnections.map((c) => [getKey(c), c]));

  const added: Connection[] = [];
  const deleted: Connection[] = [];
  const modified: Array<{ old: Connection; new: Connection }> = [];
  const unchanged: Connection[] = [];

  for (const [key, newConn] of newMap) {
    const oldConn = oldMap.get(key);
    if (!oldConn) {
      added.push(newConn);
    } else if (JSON.stringify(oldConn.config) !== JSON.stringify(newConn.config)) {
      modified.push({ old: oldConn, new: newConn });
    } else {
      unchanged.push(newConn);
    }
  }

  for (const [key, oldConn] of oldMap) {
    if (!newMap.has(key)) {
      deleted.push(oldConn);
    }
  }

  return { added, deleted, modified, unchanged };
}

/**
 * Build position lookup map from old canvas nodes
 */
function buildPositionMap(nodes: CanvasNode[]): Map<string, PositionHint> {
  const map = new Map<string, PositionHint>();
  for (const node of nodes) {
    map.set(node.id, { x: node.position.x, y: node.position.y });
  }
  return map;
}

/**
 * Patch nodes: preserve, update, add, remove
 */
function patchNodes(
  diff: ArchspecDiff,
  positionMap: Map<string, PositionHint>,
  _oldNodes: CanvasNode[]
): CanvasNode[] {
  const newNodes: CanvasNode[] = [];
  const processedIds = new Set<string>();

  // 1. Handle unchanged components (preserve position)
  for (const component of diff.components.unchanged) {
    const position = positionMap.get(component.id) ?? { x: 100, y: 100 };
    newNodes.push(createComponentNode(component, position));
    processedIds.add(component.id);
  }

  // 2. Handle modified components (preserve position, update data)
  for (const { old, new: newComponent } of diff.components.modified) {
    const position = positionMap.get(old.id) ?? positionMap.get(newComponent.id) ?? { x: 100, y: 100 };
    newNodes.push(createComponentNode(newComponent, position));
    processedIds.add(newComponent.id);
  }

  // 3. Handle unchanged groups (preserve position)
  for (const group of diff.groups.unchanged) {
    const position = positionMap.get(group.id) ?? { x: 50, y: 50 };
    newNodes.push(createGroupNode(group, position));
    processedIds.add(group.id);
  }

  // 4. Handle modified groups (preserve position, update data)
  for (const { old, new: newGroup } of diff.groups.modified) {
    const position = positionMap.get(old.id) ?? positionMap.get(newGroup.id) ?? { x: 50, y: 50 };
    newNodes.push(createGroupNode(newGroup, position));
    processedIds.add(newGroup.id);
  }

  // 5. Handle added groups (place intelligently)
  for (const group of diff.groups.added) {
    const position = computeNewGroupPosition(group, newNodes, positionMap);
    newNodes.push(createGroupNode(group, position));
    processedIds.add(group.id);
  }

  // 6. Handle added components (place intelligently)
  for (const component of diff.components.added) {
    const position = computeNewComponentPosition(component, newNodes, positionMap);
    newNodes.push(createComponentNode(component, position));
    processedIds.add(component.id);
  }

  // Note: deleted components/groups are implicitly removed (not added to newNodes)

  return newNodes;
}

/**
 * Create a component node from Component
 */
function createComponentNode(component: Component, position: PositionHint): CanvasNode {
  return {
    id: component.id,
    type: 'archComponent',
    position: { x: position.x, y: position.y },
    data: {
      componentType: component.type,
      label: component.label,
      config: component.config ?? {},
    },
    parentNode: component.group,
  };
}

/**
 * Create a group node from Group
 */
function createGroupNode(group: Group, position: PositionHint): CanvasNode {
  return {
    id: group.id,
    type: 'group',
    position: { x: position.x, y: position.y },
    data: {
      label: group.label,
      isGroup: true,
    },
    parentNode: group.parent ?? undefined,
  };
}

/**
 * Compute position for a new component (not in old canvas state)
 */
function computeNewComponentPosition(
  component: Component,
  existingNodes: CanvasNode[],
  _positionMap: Map<string, PositionHint>
): PositionHint {
  // If component belongs to a group, place near sibling nodes
  if (component.group) {
    const siblings = existingNodes.filter(
      (n) => n.parentNode === component.group && n.id !== component.id
    );
    if (siblings.length > 0) {
      // Place to the right of the rightmost sibling
      const rightmost = siblings.reduce((max, node) =>
        node.position.x > max.position.x ? node : max
      );
      return {
        x: rightmost.position.x + 200, // Offset to the right
        y: rightmost.position.y,
      };
    }
  }

  // Otherwise, place below the lowest existing node
  if (existingNodes.length > 0) {
    const lowest = existingNodes.reduce((max, node) =>
      node.position.y > max.position.y ? node : max
    );
    return {
      x: 100,
      y: lowest.position.y + 150, // Stack vertically
    };
  }

  // Fallback: default position
  return { x: 100, y: 100 };
}

/**
 * Compute position for a new group
 */
function computeNewGroupPosition(
  group: Group,
  existingNodes: CanvasNode[],
  _positionMap: Map<string, PositionHint>
): PositionHint {
  // If group has a parent, place relative to parent
  if (group.parent) {
    const parentNode = existingNodes.find((n) => n.id === group.parent);
    if (parentNode) {
      return {
        x: parentNode.position.x + 50, // Offset from parent
        y: parentNode.position.y + 50,
      };
    }
  }

  // Otherwise, place below the lowest existing node
  if (existingNodes.length > 0) {
    const lowest = existingNodes.reduce((max, node) =>
      node.position.y > max.position.y ? node : max
    );
    return {
      x: 50,
      y: lowest.position.y + 200, // Extra spacing for groups
    };
  }

  // Fallback: default position
  return { x: 50, y: 50 };
}

/**
 * Regenerate edges from connections
 */
function regenerateEdges(connections: Connection[]): CanvasEdge[] {
  return connections.map((connection) => {
    const edgeId = `${connection.from}-${connection.to}`;
    return {
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
    };
  });
}
