import { NODE_TYPE } from '@/constants';

export interface SelectionSlice {
  selectedNodeId: string | null;
  activeShapeEditId: string | null;
  setSelectedNode: (nodeId: string | null) => void;
  startShapeInlineEdit: (nodeId: string) => void;
  stopShapeInlineEdit: () => void;
}

export const createSelectionSlice = (
  set: any,
  _get: any
): SelectionSlice => ({
  selectedNodeId: null,
  activeShapeEditId: null,

  setSelectedNode: (nodeId) => {
    set((state: SelectionSlice) => ({
      selectedNodeId: nodeId,
      activeShapeEditId:
        nodeId && state.activeShapeEditId === nodeId ? state.activeShapeEditId : null,
    }));
  },

  startShapeInlineEdit: (nodeId) => {
    set((state: any) => {
      const targetNode = state.nodes.find((node: any) => node.id === nodeId);
      if (!targetNode || targetNode.type === NODE_TYPE.ARCH_COMPONENT) {
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
});
