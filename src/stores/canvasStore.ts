import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import type { ArchEdge, CanvasNode } from '@/types';
import type { CanvasSection } from '@/types/design';
import { NODE_TYPE, LIMITS } from '@/constants';
import { createNodeSlice, type NodeSlice } from './slices/nodeSlice';
import { createEdgeSlice, type EdgeSlice } from './slices/edgeSlice';
import { createSelectionSlice, type SelectionSlice } from './slices/selectionSlice';
import { createSectionSlice, type SectionSlice } from './slices/sectionSlice';
import { createGroupSlice, type GroupSlice } from './slices/groupSlice';

interface CanvasStore
  extends NodeSlice,
    EdgeSlice,
    SelectionSlice,
    SectionSlice,
    GroupSlice {
  // State
  nodes: CanvasNode[];
  edges: ArchEdge[];

  // React Flow callbacks
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<ArchEdge>;

  // Bulk operations
  loadDesign: (
    nodes: CanvasNode[],
    edges: ArchEdge[],
    sections?: CanvasSection[]
  ) => void;
  clearCanvas: () => void;

  // Layout operations
  autoLayout: () => Promise<void>;
}

export const useCanvasStore = create<CanvasStore>()(
  temporal(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],

      // Compose all slices
      ...createNodeSlice(set, get),
      ...createEdgeSlice(set, get),
      ...createSelectionSlice(set, get),
      ...createSectionSlice(set, get),
      ...createGroupSlice(set, get),

      // Cross-cutting operations
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
              (n) => n.id === activeShapeEditId && n.type !== NODE_TYPE.ARCH_COMPONENT
            )
              ? activeShapeEditId
              : null,
        });
      },

      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
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
        // Clear temporal history when loading a design
        useCanvasStore.temporal.getState().clear();
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
        // Clear temporal history when clearing canvas
        useCanvasStore.temporal.getState().clear();
      },

      autoLayout: async () => {
        const { nodes, edges } = get();
        if (nodes.length < 2) return;

        const { runElkLayout } = await import('@/services/layoutService');
        const newNodes = await runElkLayout(nodes, edges);
        set({ nodes: newNodes });
      },
    }),
    {
      limit: LIMITS.UNDO_HISTORY,
      // Only track meaningful state changes (not UI state like selection)
      // Use reference equality: Zustand mutations create new array references,
      // so if references match, no structural change occurred
      equality: (pastState, currentState) =>
        pastState.nodes === currentState.nodes &&
        pastState.edges === currentState.edges &&
        pastState.sections === currentState.sections,
    }
  )
);
