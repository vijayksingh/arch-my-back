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
  NotebookBlockType,
  SectionBadgeNode,
} from '@/types';
import type { CanvasSection } from '@/types/design';
import { componentTypeMap } from '@/registry/componentTypes';

let sectionIdCounter = 0;

function createSectionId(): string {
  sectionIdCounter += 1;
  return `section_${(Date.now() + sectionIdCounter).toString(36)}`;
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || 'Untitled Section';
}

function toSectionLink(sectionId: string, title: string): string {
  return `[${title}](section:${sectionId})`;
}

interface CanvasBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasStore {
  // State
  nodes: CanvasNode[];
  edges: ArchEdge[];
  sections: CanvasSection[];
  selectedNodeId: string | null;
  activeShapeEditId: string | null;
  pendingFocusSectionId: string | null;

  // Node/edge operations (React Flow callbacks)
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<ArchEdge>;
  onConnect: OnConnect;

  // Custom operations
  addNode: (componentType: string, position: { x: number; y: number }) => boolean;
  addShapeNode: (
    shape: CanvasShapeKind,
    position: { x: number; y: number },
  ) => string;
  addShapeNodeWithSize: (
    shape: CanvasShapeKind,
    position: { x: number; y: number },
    width: number,
    height: number,
  ) => string;
  removeNode: (nodeId: string) => void;
  updateNodeConfig: (
    nodeId: string,
    config: Record<string, unknown>
  ) => boolean;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateShapeStyle: (
    nodeId: string,
    style: { width?: number; height?: number; fontSize?: number }
  ) => boolean;
  setSelectedNode: (nodeId: string | null) => void;
  startShapeInlineEdit: (nodeId: string) => void;
  stopShapeInlineEdit: () => void;

  // Edge operations
  updateEdgeData: (edgeId: string, data: Partial<ArchEdge['data']>) => void;

  // Bulk operations
  loadDesign: (
    nodes: CanvasNode[],
    edges: ArchEdge[],
    sections?: CanvasSection[]
  ) => void;
  clearCanvas: () => void;

  // Notebook badge nodes
  addSectionBadgeNode: (
    blockId: string,
    blockType: NotebookBlockType,
    label: string,
    position: { x: number; y: number },
  ) => string;

  // Section operations (moved from workspaceStore)
  addSection: (section: CanvasSection) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<CanvasSection>) => void;
  getSectionLink: (id: string) => string | null;
  createSectionFromNodeSelection: (
    title: string,
    selectedNodeIds: string[],
    bounds: CanvasBounds
  ) => CanvasSection | null;

  requestFocusSection: (id: string) => void;
  clearPendingFocusSection: () => void;

  // Bulk section operations for sync
  setSections: (sections: CanvasSection[]) => void;
}

let nodeIdCounter = 0;

function generateNodeId(): string {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  sections: [],
  selectedNodeId: null,
  activeShapeEditId: null,
  pendingFocusSectionId: null,

  onNodesChange: (changes) => {
    const nextNodes = applyNodeChanges(changes, get().nodes);
    const selectedNodeId = get().selectedNodeId;
    const activeShapeEditId = get().activeShapeEditId;
    set({
      nodes: nextNodes,
      selectedNodeId: selectedNodeId && nextNodes.some((n) => n.id === selectedNodeId)
        ? selectedNodeId
        : null,
      activeShapeEditId:
        activeShapeEditId &&
        nextNodes.some(
          (n) => n.id === activeShapeEditId && n.type !== 'archComponent'
        )
          ? activeShapeEditId
          : null,
    });
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

    set({ nodes: [...get().nodes, newNode] });
    return true;
  },

  addShapeNodeWithSize: (shape, position, width, height) => {
    const typeByShape = {
      rectangle: 'shapeRect' as const,
      circle: 'shapeCircle' as const,
      text: 'shapeText' as const,
    };
    const labelByShape = {
      rectangle: 'Rectangle',
      circle: 'Circle',
      text: 'Text',
    };
    const id = generateNodeId();
    const newShapeNode: CanvasNode = {
      id,
      type: typeByShape[shape],
      position,
      data: {
        label: labelByShape[shape],
        shape,
        fontSize: shape === 'text' ? 14 : undefined,
      },
      style: { width, height },
    };
    set({
      nodes: [...get().nodes, newShapeNode],
      selectedNodeId: id,
      activeShapeEditId: null,
    });
    return id;
  },

  addShapeNode: (shape, position) => {
    const defaultSizes = {
      rectangle: { width: 180, height: 110 },
      circle: { width: 130, height: 130 },
      text: { width: 180, height: 44 },
    };
    const { width, height } = defaultSizes[shape];
    return get().addShapeNodeWithSize(shape, position, width, height);
  },

  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId:
        get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      activeShapeEditId:
        get().activeShapeEditId === nodeId ? null : get().activeShapeEditId,
    });
  },

  updateNodeConfig: (nodeId, config) => {
    // Validate node exists
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return false;

    set({
      nodes: get().nodes.map<CanvasNode>((n) => {
        if (n.id !== nodeId) return n;

        // For archComponent nodes, update nested config
        if (n.type === 'archComponent') {
          return {
            ...n,
            data: { ...n.data, config: { ...n.data.config, ...config } },
          };
        }

        // For other node types (like sectionBadge), update data directly
        return {
          ...n,
          data: { ...n.data, ...config },
        };
      }),
    });
    return true;
  },

  updateNodeLabel: (nodeId, label) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } as CanvasNode : n
      ),
    });
  },

  updateShapeStyle: (nodeId, style) => {
    const targetNode = get().nodes.find((node) => node.id === nodeId);
    if (!targetNode) return false;
    if (targetNode.type === 'archComponent') return false;

    const width =
      typeof style.width === 'number' && Number.isFinite(style.width)
        ? Math.max(48, Math.round(style.width))
        : undefined;
    const height =
      typeof style.height === 'number' && Number.isFinite(style.height)
        ? Math.max(32, Math.round(style.height))
        : undefined;
    const fontSize =
      typeof style.fontSize === 'number' && Number.isFinite(style.fontSize)
        ? Math.min(96, Math.max(10, Math.round(style.fontSize)))
        : undefined;

    set({
      nodes: get().nodes.map<CanvasNode>((node) => {
        if (node.id !== nodeId || node.type === 'archComponent') return node;

        const nextStyle = { ...(node.style ?? {}) };
        const nextData = { ...node.data };

        if (width !== undefined) nextStyle.width = width;
        if (height !== undefined) nextStyle.height = height;
        if (fontSize !== undefined) nextData.fontSize = fontSize;

        const nextNode = {
          ...node,
          style: nextStyle,
          data: nextData,
        } as CanvasShapeNode;
        return nextNode;
      }),
    });
    return true;
  },

  setSelectedNode: (nodeId) => {
    set((state) => ({
      selectedNodeId: nodeId,
      activeShapeEditId:
        nodeId && state.activeShapeEditId === nodeId ? state.activeShapeEditId : null,
    }));
  },

  startShapeInlineEdit: (nodeId) => {
    set((state) => {
      const targetNode = state.nodes.find((node) => node.id === nodeId);
      if (!targetNode || targetNode.type === 'archComponent') {
        return { activeShapeEditId: null };
      }
      return {
        activeShapeEditId: nodeId,
        selectedNodeId: nodeId,
      };
    });
  },

  stopShapeInlineEdit: () => {
    set({ activeShapeEditId: null });
  },

  updateEdgeData: (edgeId, data) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e
      ),
    });
  },

  loadDesign: (nodes, edges, sections = []) => {
    set({
      nodes,
      edges,
      sections,
      selectedNodeId: null,
      activeShapeEditId: null,
      pendingFocusSectionId: null,
    });
  },

  clearCanvas: () => {
    set({
      nodes: [],
      edges: [],
      sections: [],
      selectedNodeId: null,
      activeShapeEditId: null,
      pendingFocusSectionId: null,
    });
  },

  addSectionBadgeNode: (blockId, blockType, label, position) => {
    const id = generateNodeId();
    const newNode: SectionBadgeNode = {
      id,
      type: 'sectionBadge',
      position,
      data: { blockId, blockType, label },
      style: { width: 260 },
    };
    set({ nodes: [...get().nodes, newNode] });
    return id;
  },

  // Section operations (moved from workspaceStore)
  addSection: (section) => {
    set((state) => ({ sections: [...state.sections, section] }));
  },

  removeSection: (id) => {
    set((state) => ({
      sections: state.sections.filter((s) => s.id !== id),
      pendingFocusSectionId:
        state.pendingFocusSectionId === id ? null : state.pendingFocusSectionId,
    }));
  },

  updateSection: (id, updates) => {
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  },

  getSectionLink: (id) => {
    const section = get().sections.find((s) => s.id === id);
    if (!section) return null;
    return toSectionLink(section.id, section.title);
  },

  createSectionFromNodeSelection: (title, selectedNodeIds, bounds) => {
    if (selectedNodeIds.length === 0) return null;
    if (bounds.width <= 0 || bounds.height <= 0) return null;

    const section: CanvasSection = {
      id: createSectionId(),
      title: normalizeTitle(title),
      nodeIds: Array.from(new Set(selectedNodeIds)),
      bounds,
      createdAt: Date.now(),
    };

    set((state) => ({ sections: [...state.sections, section] }));
    return section;
  },

  requestFocusSection: (id) => set({ pendingFocusSectionId: id }),
  clearPendingFocusSection: () => set({ pendingFocusSectionId: null }),

  setSections: (sections) => set({ sections }),
}));
