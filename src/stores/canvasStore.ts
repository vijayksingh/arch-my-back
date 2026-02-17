import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
} from '@xyflow/react';
import type {
  ArchEdge,
  ArchNode,
  CanvasNode,
  CanvasShapeKind,
  CanvasShapeNode,
} from '@/types';
import { componentTypeMap } from '@/registry/componentTypes';
import { validateJSON, validateEdgeReferences } from '@/domain/validators';

interface CanvasStore {
  // State
  nodes: CanvasNode[];
  edges: ArchEdge[];
  selectedNodeId: string | null;
  errors: string[];

  // Node/edge operations (React Flow callbacks)
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<ArchEdge>;
  onConnect: OnConnect;

  // Custom operations
  addNode: (componentType: string, position: { x: number; y: number }) => boolean;
  addShapeNode: (
    shape: CanvasShapeKind,
    position: { x: number; y: number },
  ) => void;
  removeNode: (nodeId: string) => void;
  updateNodeConfig: (
    nodeId: string,
    config: Record<string, unknown>
  ) => boolean;
  updateNodeLabel: (nodeId: string, label: string) => void;
  setSelectedNode: (nodeId: string | null) => void;

  // Error handling
  clearErrors: () => void;

  // Edge operations
  updateEdgeData: (edgeId: string, data: Partial<ArchEdge['data']>) => void;

  // Bulk operations
  loadDesign: (nodes: CanvasNode[], edges: ArchEdge[]) => void;
  clearCanvas: () => void;

  // Persistence
  toJSON: () => string;
  fromJSON: (json: string) => boolean;
}

let nodeIdCounter = 0;

function generateNodeId(): string {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  errors: [],

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection: Connection) => {
    const newEdge: ArchEdge = {
      ...connection,
      id: `edge_${connection.source}_${connection.target}`,
      type: 'archEdge',
      data: { protocol: 'HTTPS' },
    };
    set({ edges: addEdge(newEdge, get().edges) });
  },

  addNode: (componentType, position) => {
    // Validate component type exists
    const typeDef = componentTypeMap.get(componentType);
    if (!typeDef) {
      set({
        errors: [`Component type "${componentType}" does not exist in registry`],
      });
      return false;
    }

    const newNode: ArchNode = {
      id: generateNodeId(),
      type: 'archComponent',
      position,
      data: {
        componentType: typeDef.key,
        label: typeDef.label,
        config: { ...typeDef.defaultConfig },
      },
    };

    set({ nodes: [...get().nodes, newNode], errors: [] });
    return true;
  },

  addShapeNode: (shape, position) => {
    const baseByShape = {
      rectangle: {
        type: 'shapeRect' as const,
        label: 'Rectangle',
        width: 180,
        height: 110,
        fontSize: undefined,
      },
      circle: {
        type: 'shapeCircle' as const,
        label: 'Circle',
        width: 130,
        height: 130,
        fontSize: undefined,
      },
      text: {
        type: 'shapeText' as const,
        label: 'Text',
        width: 180,
        height: 44,
        fontSize: 14,
      },
    }[shape];

    const newShapeNode: CanvasNode = {
      id: generateNodeId(),
      type: baseByShape.type,
      position,
      data: {
        label: baseByShape.label,
        shape,
        fontSize: baseByShape.fontSize,
      },
      style: {
        width: baseByShape.width,
        height: baseByShape.height,
      },
    };

    set({ nodes: [...get().nodes, newShapeNode] });
  },

  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId:
        get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  updateNodeConfig: (nodeId, config) => {
    // Validate node exists
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) {
      set({ errors: [`Node with ID "${nodeId}" does not exist`] });
      return false;
    }

    if (node.type !== 'archComponent') {
      set({ errors: [`Node "${nodeId}" is not an architecture component`] });
      return false;
    }

    set({
      nodes: get().nodes.map<CanvasNode>((n) => {
        if (n.id !== nodeId || n.type !== 'archComponent') return n;
        return {
          ...n,
          data: { ...n.data, config: { ...n.data.config, ...config } },
        };
      }),
      errors: [],
    });
    return true;
  },

  updateNodeLabel: (nodeId, label) => {
    set({
      nodes: get().nodes.map<CanvasNode>((n) => {
        if (n.id !== nodeId) return n;
        if (n.type === 'archComponent') {
          const nextNode: ArchNode = { ...n, data: { ...n.data, label } };
          return nextNode;
        }
        const nextShapeNode: CanvasShapeNode = {
          ...n,
          data: { ...n.data, label },
        };
        return nextShapeNode;
      }),
    });
  },

  setSelectedNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  clearErrors: () => {
    set({ errors: [] });
  },

  updateEdgeData: (edgeId, data) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e
      ),
    });
  },

  loadDesign: (nodes, edges) => {
    set({ nodes, edges, selectedNodeId: null });
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [], selectedNodeId: null });
  },

  toJSON: () => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges }, null, 2);
  },

  fromJSON: (json) => {
    // Validate JSON structure
    const result = validateJSON(json);
    if (!result.success) {
      set({ errors: result.errors });
      return false;
    }

    const { nodes, edges } = result.data;

    // Validate edge references
    const edgeValidation = validateEdgeReferences(edges, nodes);
    if (!edgeValidation.success) {
      set({ errors: edgeValidation.errors });
      return false;
    }

    set({ nodes, edges, selectedNodeId: null, errors: [] });
    return true;
  },
}));
