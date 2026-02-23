import type { Node } from '@xyflow/react';
import type {
  CanvasNode,
  CanvasShapeKind,
  CanvasShapeNode,
  ArchNode,
  SectionBadgeNode,
  NotebookBlockType,
} from '@/types';
import { componentTypeMap, type ComponentTypeKey } from '@/registry/componentTypes';
import { generateNodeId } from '@/lib/idGenerator';
import { getDefaultShapeSize } from '@/lib/shapeSizeDefaults';
import {
  NODE_TYPE,
  SIZE_CONSTRAINTS,
  FONT_SIZE,
  SECTION_BADGE,
} from '@/constants';

export interface NodeSlice {
  addNode: (componentType: ComponentTypeKey, position: { x: number; y: number }) => boolean;
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
  addWidgetNode: (
    widgetInstanceId: string,
    position: { x: number; y: number }
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
  addSectionBadgeNode: (
    blockId: string,
    blockType: NotebookBlockType,
    label: string,
    position: { x: number; y: number },
  ) => string;
}

export const createNodeSlice = (
  set: any,
  get: any
): NodeSlice => ({
  addNode: (componentType, position) => {
    // Validate component type exists
    const typeDef = componentTypeMap.get(componentType);
    if (!typeDef) {
      return false;
    }

    const newNode: ArchNode = {
      id: generateNodeId(),
      type: NODE_TYPE.ARCH_COMPONENT,
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
      rectangle: NODE_TYPE.SHAPE_RECT,
      circle: NODE_TYPE.SHAPE_CIRCLE,
      text: NODE_TYPE.SHAPE_TEXT,
    } as const;
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
        fontSize: shape === 'text' ? FONT_SIZE.DEFAULT_TEXT : undefined,
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
    const { width, height } = getDefaultShapeSize(shape);
    return get().addShapeNodeWithSize(shape, position, width, height);
  },

  addWidgetNode: (widgetInstanceId, position) => {
    const id = generateNodeId();
    const newNode: Node = {
      id,
      type: NODE_TYPE.WIDGET_NODE,
      position,
      data: {
        widgetInstanceId,
      },
    };
    set({ nodes: [...get().nodes, newNode as CanvasNode] });
    return id;
  },

  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n: CanvasNode) => n.id !== nodeId),
      edges: get().edges.filter(
        (e: any) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId:
        get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      activeShapeEditId:
        get().activeShapeEditId === nodeId ? null : get().activeShapeEditId,
    });
  },

  updateNodeConfig: (nodeId, config) => {
    // Validate node exists
    const node = get().nodes.find((n: CanvasNode) => n.id === nodeId);
    if (!node) return false;

    set({
      nodes: get().nodes.map((n: CanvasNode): CanvasNode => {
        if (n.id !== nodeId) return n;

        // For archComponent nodes, update nested config
        if (n.type === NODE_TYPE.ARCH_COMPONENT) {
          return {
            ...n,
            data: { ...n.data, config: { ...n.data.config, ...config } },
          } as CanvasNode;
        }

        // For other node types (like sectionBadge), update data directly
        return {
          ...n,
          data: { ...n.data, ...config },
        } as CanvasNode;
      }),
    });
    return true;
  },

  updateNodeLabel: (nodeId, label) => {
    set({
      nodes: get().nodes.map((n: CanvasNode) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } as CanvasNode : n
      ),
    });
  },

  updateShapeStyle: (nodeId, style) => {
    const targetNode = get().nodes.find((node: CanvasNode) => node.id === nodeId);
    if (!targetNode) return false;
    if (targetNode.type === NODE_TYPE.ARCH_COMPONENT) return false;

    const width =
      typeof style.width === 'number' && Number.isFinite(style.width)
        ? Math.max(SIZE_CONSTRAINTS.MIN_WIDTH, Math.round(style.width))
        : undefined;
    const height =
      typeof style.height === 'number' && Number.isFinite(style.height)
        ? Math.max(SIZE_CONSTRAINTS.MIN_HEIGHT, Math.round(style.height))
        : undefined;
    const fontSize =
      typeof style.fontSize === 'number' && Number.isFinite(style.fontSize)
        ? Math.min(FONT_SIZE.MAX, Math.max(FONT_SIZE.MIN, Math.round(style.fontSize)))
        : undefined;

    set({
      nodes: get().nodes.map((node: CanvasNode): CanvasNode => {
        if (node.id !== nodeId || node.type === NODE_TYPE.ARCH_COMPONENT) return node;

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

  addSectionBadgeNode: (blockId, blockType, label, position) => {
    const id = generateNodeId();
    const newNode: SectionBadgeNode = {
      id,
      type: NODE_TYPE.SECTION_BADGE,
      position,
      data: { blockId, blockType, label },
      style: { width: SECTION_BADGE.WIDTH },
    };
    set({ nodes: [...get().nodes, newNode] });
    return id;
  },
});
