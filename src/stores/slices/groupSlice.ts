import type { CanvasNode, CollapsibleGroupNode } from '@/types';
import { generateNodeId } from '@/lib/idGenerator';
import { computeGroupBounds } from '@/lib/groupBoundsHelper';
import { NODE_TYPE, GROUP_DIMENSIONS } from '@/constants';

export interface GroupSlice {
  toggleGroupCollapse: (groupId: string) => void;
  addGroup: (
    label: string,
    childNodeIds: string[],
    position?: { x: number; y: number }
  ) => string;
  removeGroup: (groupId: string, deleteChildren?: boolean) => void;
}

export const createGroupSlice = (
  set: any,
  get: any
): GroupSlice => ({
  toggleGroupCollapse: (groupId) => {
    const nodes = get().nodes;
    const groupNode = nodes.find((n: CanvasNode) => n.id === groupId);

    if (!groupNode || groupNode.type !== NODE_TYPE.COLLAPSIBLE_GROUP) return;

    const isCurrentlyCollapsed = groupNode.data.isCollapsed ?? false;
    const nextCollapsed = !isCurrentlyCollapsed;

    // Find all child nodes (nodes with parentId === groupId)
    const childNodes = nodes.filter((n: CanvasNode) => n.parentId === groupId);

    set({
      nodes: nodes.map((node: CanvasNode) => {
        // Update the group node's collapsed state
        if (node.id === groupId && node.type === NODE_TYPE.COLLAPSIBLE_GROUP) {
          return {
            ...node,
            data: { ...node.data, isCollapsed: nextCollapsed },
            style: {
              ...node.style,
              height: nextCollapsed ? GROUP_DIMENSIONS.COLLAPSED_HEIGHT : (node.style?.height ?? GROUP_DIMENSIONS.DEFAULT_HEIGHT),
            },
          } as CollapsibleGroupNode;
        }

        // Hide/show child nodes
        if (node.parentId === groupId) {
          return { ...node, hidden: nextCollapsed };
        }

        return node;
      }),
      // Also hide/show edges connected to hidden child nodes
      edges: get().edges.map((edge: any) => {
        const sourceHidden = childNodes.some(
          (n: CanvasNode) => n.id === edge.source && nextCollapsed
        );
        const targetHidden = childNodes.some(
          (n: CanvasNode) => n.id === edge.target && nextCollapsed
        );

        if (sourceHidden || targetHidden) {
          return { ...edge, hidden: nextCollapsed };
        }
        return edge;
      }),
    });
  },

  addGroup: (label, childNodeIds, position = { x: 100, y: 100 }) => {
    const nodes = get().nodes;
    const groupId = generateNodeId();

    // Calculate bounds based on child nodes
    const bounds = computeGroupBounds(nodes, childNodeIds, position);

    const newGroup: CollapsibleGroupNode = {
      id: groupId,
      type: NODE_TYPE.COLLAPSIBLE_GROUP,
      position: bounds.position,
      data: {
        label,
        isCollapsed: false,
        childNodeIds,
      },
      style: {
        width: bounds.width,
        height: bounds.height,
      },
    };

    // Update child nodes to set parentId and adjust their positions to be relative
    const updatedNodes = nodes.map((node: CanvasNode) => {
      if (childNodeIds.includes(node.id)) {
        return {
          ...node,
          parentId: groupId,
          position: {
            x: node.position.x - bounds.position.x,
            y: node.position.y - bounds.position.y,
          },
          extent: 'parent' as const,
        };
      }
      return node;
    });

    set({ nodes: [...updatedNodes, newGroup] });
    return groupId;
  },

  removeGroup: (groupId, deleteChildren = false) => {
    const nodes = get().nodes;
    const groupNode = nodes.find((n: CanvasNode) => n.id === groupId);

    if (!groupNode || groupNode.type !== NODE_TYPE.COLLAPSIBLE_GROUP) return;

    const childNodes = nodes.filter((n: CanvasNode) => n.parentId === groupId);

    if (deleteChildren) {
      // Remove group and all child nodes
      const childIds = childNodes.map((n: CanvasNode) => n.id);
      set({
        nodes: nodes.filter(
          (n: CanvasNode) => n.id !== groupId && !childIds.includes(n.id)
        ),
        edges: get().edges.filter(
          (e: any) =>
            e.source !== groupId &&
            e.target !== groupId &&
            !childIds.includes(e.source) &&
            !childIds.includes(e.target)
        ),
      });
    } else {
      // Remove group but keep children, converting their positions back to absolute
      set({
        nodes: nodes
          .filter((n: CanvasNode) => n.id !== groupId)
          .map((node: CanvasNode) => {
            if (node.parentId === groupId) {
              return {
                ...node,
                parentId: undefined,
                position: {
                  x: node.position.x + groupNode.position.x,
                  y: node.position.y + groupNode.position.y,
                },
                extent: undefined,
                hidden: false,
              };
            }
            return node;
          }),
        edges: get().edges.filter(
          (e: any) => e.source !== groupId && e.target !== groupId
        ).map((edge: any) => {
          // Restore visibility of edges that were hidden due to group collapse
          const sourceWasChild = childNodes.some((n: CanvasNode) => n.id === edge.source);
          const targetWasChild = childNodes.some((n: CanvasNode) => n.id === edge.target);

          if (sourceWasChild || targetWasChild) {
            return { ...edge, hidden: false };
          }
          return edge;
        }),
      });
    }
  },
});
