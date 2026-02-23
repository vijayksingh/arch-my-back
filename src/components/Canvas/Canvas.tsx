import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { Node, XYPosition, Connection, Edge } from '@xyflow/react';
import type { CanvasNode, CanvasShapeKind } from '@/types';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { useWidgetStore } from '@/widgets/store/widgetStore';
import { componentTypeMap } from '@/registry/componentTypes';
import { categoryColors } from '@/registry/categoryThemes';
import { designNodeTypes, archEdgeTypes } from '@/registry/flowNodeTypes';
import { cn } from '@/lib/utils';
import { validateArchConnection } from '@/lib/connectionRules';
import { SelectionActionBar } from './SelectionActionBar';
import { CANVAS_TOOL, DRAG_DATA_TYPE, NODE_TYPE } from '@/constants';
const MIN_DRAG = 20; // minimum drag distance in screen pixels to create a shape

const defaultEdgeOptions = {
  type: 'archEdge' as const,
  animated: false,
};

function isShapeTool(tool: string): tool is CanvasShapeKind {
  return tool === CANVAS_TOOL.RECTANGLE || tool === CANVAS_TOOL.CIRCLE || tool === CANVAS_TOOL.TEXT;
}

/** Returns true when the mouse event originates from the ReactFlow pane (background), not from a node, edge, or panel. */
function isPaneTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  return (
    !target.closest('.react-flow__node') &&
    !target.closest('.react-flow__edge') &&
    !target.closest('.react-flow__controls') &&
    !target.closest('.react-flow__minimap') &&
    !target.closest('.react-flow__panel')
  );
}

export default function Canvas() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { screenToFlowPosition, fitBounds } = useReactFlow();

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const addNode = useCanvasStore((s) => s.addNode);
  const addShapeNodeWithSize = useCanvasStore((s) => s.addShapeNodeWithSize);
  const addWidgetNode = useCanvasStore((s) => s.addWidgetNode);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
  const startShapeInlineEdit = useCanvasStore((s) => s.startShapeInlineEdit);
  const stopShapeInlineEdit = useCanvasStore((s) => s.stopShapeInlineEdit);
  const sections = useCanvasStore((s) => s.sections);
  const activeCanvasTool = useEditorStore((s) => s.activeCanvasTool);
  const pendingFocusSectionId = useCanvasStore((s) => s.pendingFocusSectionId);
  const clearPendingFocusSection = useCanvasStore((s) => s.clearPendingFocusSection);
  const addWidgetInstance = useWidgetStore((s) => s.addWidget);

  // Drag-to-create state
  const dragStart = useRef<{ screen: { x: number; y: number }; flow: XYPosition } | null>(null);
  const activeDragTool = useRef<CanvasShapeKind | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Stable ref for screenToFlowPosition so window listeners see the latest version
  const screenToFlowPositionRef = useRef(screenToFlowPosition);
  useEffect(() => { screenToFlowPositionRef.current = screenToFlowPosition; }, [screenToFlowPosition]);

  const addShapeNodeWithSizeRef = useRef(addShapeNodeWithSize);
  useEffect(() => { addShapeNodeWithSizeRef.current = addShapeNodeWithSize; }, [addShapeNodeWithSize]);

  const startShapeInlineEditRef = useRef(startShapeInlineEdit);
  useEffect(() => { startShapeInlineEditRef.current = startShapeInlineEdit; }, [startShapeInlineEdit]);

  /**
   * Container-level mousedown handler.
   * When a shape tool is active, intercepts pane clicks to begin drag-to-create.
   * Node/edge clicks are ignored (ReactFlow handles them normally).
   */
  const handleContainerMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isShapeTool(activeCanvasTool) || e.button !== 0) return;
      if (!isPaneTarget(e.target)) return;

      const flowPos = screenToFlowPositionRef.current({ x: e.clientX, y: e.clientY });
      dragStart.current = { screen: { x: e.clientX, y: e.clientY }, flow: flowPos };
      activeDragTool.current = activeCanvasTool as CanvasShapeKind;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragStart.current) return;
        const dx = ev.clientX - dragStart.current.screen.x;
        const dy = ev.clientY - dragStart.current.screen.y;
        if (Math.hypot(dx, dy) < MIN_DRAG) { setDragPreview(null); return; }
        setDragPreview({
          x: Math.min(ev.clientX, dragStart.current.screen.x),
          y: Math.min(ev.clientY, dragStart.current.screen.y),
          w: Math.abs(dx),
          h: Math.abs(dy),
        });
      };

      const handleMouseUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (!dragStart.current) return;
        const start = dragStart.current;
        const shape = activeDragTool.current;
        dragStart.current = null;
        activeDragTool.current = null;
        setDragPreview(null);

        if (!shape) return;
        const dx = ev.clientX - start.screen.x;
        const dy = ev.clientY - start.screen.y;
        if (Math.hypot(dx, dy) < MIN_DRAG) return; // too small — ignore

        const flowEnd = screenToFlowPositionRef.current({ x: ev.clientX, y: ev.clientY });
        const x = Math.min(start.flow.x, flowEnd.x);
        const y = Math.min(start.flow.y, flowEnd.y);
        const w = Math.abs(flowEnd.x - start.flow.x);
        const h = Math.abs(flowEnd.y - start.flow.y);

        const shapeId = addShapeNodeWithSizeRef.current(shape, { x, y }, w, h);
        if (shape === CANVAS_TOOL.TEXT) startShapeInlineEditRef.current(shapeId);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [activeCanvasTool],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: CanvasNode) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode],
  );

  const onPaneClick = useCallback(
    (_event: React.MouseEvent) => {
      if (activeCanvasTool === CANVAS_TOOL.CURSOR || activeCanvasTool === CANVAS_TOOL.SELECT) {
        setSelectedNode(null);
        stopShapeInlineEdit();
      }
    },
    [activeCanvasTool, setSelectedNode, stopShapeInlineEdit],
  );

  const onSelectionChange = useCallback(
    ({ nodes: nextSelection }: { nodes: Node[] }) => {
      if (nextSelection.length === 1) {
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

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Check for widget drop
      const widgetId = event.dataTransfer.getData(DRAG_DATA_TYPE.WIDGET);
      if (widgetId) {
        // Create widget instance in store
        const widgetInstanceId = addWidgetInstance(widgetId, undefined, position);
        if (widgetInstanceId) {
          // Add canvas node for the widget using proper store API
          addWidgetNode(widgetInstanceId, position);
        }
        return;
      }

      // Check for component drop (existing behavior)
      const componentType = event.dataTransfer.getData(DRAG_DATA_TYPE.COMPONENT);
      if (componentType) {
        addNode(componentType, position);
      }
    },
    [screenToFlowPosition, addNode, addWidgetNode, addWidgetInstance],
  );

  const miniMapNodeColor = useCallback((node: CanvasNode) => {
    if (node.type !== NODE_TYPE.ARCH_COMPONENT) return 'hsl(var(--accent-foreground) / 0.65)';

    const componentType = node.data.componentType;
    const typeDef = componentTypeMap.get(componentType);
    if (!typeDef) return 'hsl(var(--muted-foreground))';

    return categoryColors[typeDef.category];
  }, []);

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      return validateArchConnection(nodes, connection).valid;
    },
    [nodes]
  );

  useEffect(() => {
    if (!pendingFocusSectionId) return;

    const section = sections.find((entry) => entry.id === pendingFocusSectionId);
    if (section) {
      fitBounds(
        section.bounds,
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
    <div
      className="relative h-full w-full"
      onMouseDown={handleContainerMouseDown}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={designNodeTypes}
        edgeTypes={archEdgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid
        snapGrid={[20, 20]}
        panOnDrag={activeCanvasTool === CANVAS_TOOL.CURSOR}
        selectionOnDrag={activeCanvasTool === CANVAS_TOOL.SELECT}
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
          position="bottom-left"
          nodeColor={miniMapNodeColor}
          maskColor="var(--canvas-mask)"
          pannable
          zoomable
          style={{
            width: 120,
            height: 80,
            opacity: 0.5,
            transition: 'opacity 0.2s ease-in-out',
          }}
          className="hover:opacity-100"
        />
      </ReactFlow>

      {/* Ghost preview overlay during drag-to-create */}
      {dragPreview && (
        <div
          style={{
            position: 'fixed',
            left: dragPreview.x,
            top: dragPreview.y,
            width: dragPreview.w,
            height: dragPreview.h,
            pointerEvents: 'none',
            zIndex: 50,
          }}
          className={cn(
            'border-2 border-dashed border-primary/60 bg-primary/5',
            activeCanvasTool === CANVAS_TOOL.CIRCLE ? 'rounded-full' : 'rounded',
          )}
        />
      )}

      {/* Floating group/section action bar — visible when nodes are selected */}
      <SelectionActionBar />
    </div>
  );
}
