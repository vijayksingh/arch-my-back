import { useCallback, useEffect, useMemo } from 'react';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  SelectionMode,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import type { EdgeTypes, Node, NodeTypes } from '@xyflow/react';
import type { CanvasNode } from '@/types';
import { useCanvasStore } from '@/stores/canvasStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { componentTypeMap } from '@/registry/componentTypes';
import { categoryColors } from '@/registry/categoryThemes';
import ArchNodeComponent from './ArchNode';
import ArchEdge from './ArchEdge';
import ShapeNode from './ShapeNode';

const nodeTypes: NodeTypes = {
  archComponent: ArchNodeComponent,
  shapeRect: ShapeNode,
  shapeCircle: ShapeNode,
  shapeText: ShapeNode,
};

const edgeTypes: EdgeTypes = {
  archEdge: ArchEdge,
};

const DRAG_DATA_TYPE = 'application/archcomponent';

export default function Canvas() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { screenToFlowPosition, fitBounds } = useReactFlow();

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const addNode = useCanvasStore((s) => s.addNode);
  const addShapeNode = useCanvasStore((s) => s.addShapeNode);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
  const sections = useWorkspaceStore((s) => s.sections);
  const activeCanvasTool = useWorkspaceStore((s) => s.activeCanvasTool);
  const pendingFocusSectionId = useWorkspaceStore((s) => s.pendingFocusSectionId);
  const clearPendingFocusSection = useWorkspaceStore(
    (s) => s.clearPendingFocusSection,
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: CanvasNode) => {
      if (node.type === 'archComponent') {
        setSelectedNode(node.id);
        return;
      }
      setSelectedNode(null);
    },
    [setSelectedNode],
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (activeCanvasTool === 'rectangle' || activeCanvasTool === 'circle' || activeCanvasTool === 'text') {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        addShapeNode(activeCanvasTool, position);
        setSelectedNode(null);
        return;
      }

      if (activeCanvasTool === 'cursor') {
        setSelectedNode(null);
      }
    },
    [activeCanvasTool, addShapeNode, screenToFlowPosition, setSelectedNode],
  );

  const onSelectionChange = useCallback(
    ({ nodes: nextSelection }: { nodes: Node[] }) => {
      if (nextSelection.length === 1 && nextSelection[0].type === 'archComponent') {
        setSelectedNode(nextSelection[0].id);
      } else {
        setSelectedNode(null);
      }
    },
    [setSelectedNode],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const componentType = event.dataTransfer.getData(DRAG_DATA_TYPE);
      if (!componentType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(componentType, position);
    },
    [screenToFlowPosition, addNode],
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'archEdge' as const,
      animated: false,
    }),
    [],
  );
  const miniMapNodeColor = useCallback((node: CanvasNode) => {
    if (node.type !== 'archComponent') return 'hsl(var(--accent-foreground) / 0.65)';

    const componentType = node.data.componentType;
    if (!componentType) return 'hsl(var(--muted-foreground))';

    const typeDef = componentTypeMap.get(componentType);
    if (!typeDef) return 'hsl(var(--muted-foreground))';

    return categoryColors[typeDef.category];
  }, []);

  useEffect(() => {
    if (!pendingFocusSectionId) return;

    const section = sections.find((entry) => entry.id === pendingFocusSectionId);
    if (section) {
      fitBounds(
        {
          x: section.bounds.x,
          y: section.bounds.y,
          width: section.bounds.width,
          height: section.bounds.height,
        },
        { padding: 0.24, duration: prefersReducedMotion ? 0 : 420 },
      );
      setSelectedNode(null);
    }

    clearPendingFocusSection();
  }, [
    clearPendingFocusSection,
    fitBounds,
    pendingFocusSectionId,
    sections,
    setSelectedNode,
  ]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid
        snapGrid={[20, 20]}
        panOnDrag={activeCanvasTool === 'cursor'}
        selectionOnDrag={activeCanvasTool === 'select'}
        selectionMode={SelectionMode.Partial}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--canvas-dot))"
        />
        <Controls position="bottom-right" />
        <MiniMap
          position="top-right"
          nodeColor={miniMapNodeColor}
          maskColor="var(--canvas-mask)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
