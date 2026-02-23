import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  SelectionMode,
  BackgroundVariant,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import type { Node, XYPosition, Connection, Edge, OnNodesChange } from '@xyflow/react';
import type { CanvasNode, CanvasShapeKind, ComponentTypeConfig } from '@/types';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { useWidgetStore } from '@/widgets/store/widgetStore';
import { componentTypeMap } from '@/registry/componentTypes';
import { categoryColors } from '@/registry/categoryThemes';
import { designNodeTypes, archEdgeTypes } from '@/registry/flowNodeTypes';
import { cn } from '@/lib/utils';
import { validateArchConnection } from '@/lib/connectionRules';
import { SelectionActionBar } from './SelectionActionBar';
import {
  CANVAS_TOOL,
  DRAG_DATA_TYPE,
  NODE_TYPE,
  INTERACTION,
  Z_INDEX,
} from '@/constants';

const defaultEdgeOptions = {
  type: 'archEdge' as const,
  animated: false,
};

// Stable module-level constants for ReactFlow props
const EDITOR_FIT_VIEW_OPTIONS = { maxZoom: 1.0, padding: 0.15 } as const;
const WALKTHROUGH_FIT_VIEW_OPTIONS = { maxZoom: 1.0, padding: 0.2 } as const;
const EDITOR_DELETE_KEYS = ['Backspace', 'Delete'] as const;
const WALKTHROUGH_DELETE_KEYS = [] as const;

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

interface CanvasProps {
  mode?: 'editor' | 'walkthrough';
  walkthroughNodes?: Node[];
  walkthroughEdges?: Edge[];
  onNodeAdd?: (node: Node) => void;
  buildPaletteComponents?: ComponentTypeConfig[];
  showBuildValidator?: boolean;
  highlightedNodeIds?: string[];
  animatedEdgeIds?: string[];
  stepId?: string;
}

export default function Canvas({
  mode = 'editor',
  walkthroughNodes,
  walkthroughEdges,
  onNodeAdd,
  highlightedNodeIds = [],
  animatedEdgeIds = [],
  stepId,
}: CanvasProps = {}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { screenToFlowPosition, fitBounds, fitView } = useReactFlow();

  // Editor mode: use Zustand store
  const storeNodes = useCanvasStore((s) => s.nodes);
  const storeEdges = useCanvasStore((s) => s.edges);
  const storeOnNodesChange = useCanvasStore((s) => s.onNodesChange);
  const storeOnEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnectStore = useCanvasStore((s) => s.onConnect);
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

  // Walkthrough mode: use local controlled state
  const [localWalkthroughNodes, setLocalWalkthroughNodes] = useState<Node[]>(walkthroughNodes || []);
  const [localWalkthroughEdges, setLocalWalkthroughEdges] = useState<Edge[]>(walkthroughEdges || []);

  // Sync walkthrough props to local state
  useEffect(() => {
    if (mode === 'walkthrough' && walkthroughNodes) {
      setLocalWalkthroughNodes(walkthroughNodes);
    }
  }, [mode, walkthroughNodes]);

  useEffect(() => {
    if (mode === 'walkthrough' && walkthroughEdges) {
      setLocalWalkthroughEdges(walkthroughEdges);
    }
  }, [mode, walkthroughEdges]);

  // Determine which nodes/edges to use
  const nodes = mode === 'walkthrough' ? localWalkthroughNodes : storeNodes;
  const edges = mode === 'walkthrough' ? localWalkthroughEdges : storeEdges;

  // Walkthrough mode: local controlled handlers
  const handleWalkthroughNodesChange = useCallback((changes: NodeChange[]) => {
    setLocalWalkthroughNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const handleWalkthroughEdgesChange = useCallback((changes: EdgeChange[]) => {
    setLocalWalkthroughEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  // Create properly-typed wrapper for onNodesChange that bridges the type gap
  // between OnNodesChange<Node> (ReactFlow) and OnNodesChange<CanvasNode> (store)
  const onNodesChange: OnNodesChange<Node> = useCallback(
    (changes: NodeChange[]) => {
      if (mode === 'walkthrough') {
        handleWalkthroughNodesChange(changes);
      } else {
        // Safe cast: CanvasNode extends Node, and changes are generic NodeChange[]
        storeOnNodesChange(changes);
      }
    },
    [mode, handleWalkthroughNodesChange, storeOnNodesChange]
  );

  const onEdgesChange = mode === 'walkthrough' ? handleWalkthroughEdgesChange : storeOnEdgesChange;

  // Drag-to-create state
  const dragStart = useRef<{ screen: { x: number; y: number }; flow: XYPosition } | null>(null);
  const activeDragTool = useRef<CanvasShapeKind | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Connection feedback state
  const [connectionFeedback, setConnectionFeedback] = useState<{
    message: string;
    type: 'error' | 'warning';
  } | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        if (Math.hypot(dx, dy) < INTERACTION.MIN_DRAG_DISTANCE) { setDragPreview(null); return; }
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
        if (Math.hypot(dx, dy) < INTERACTION.MIN_DRAG_DISTANCE) return; // too small — ignore

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
    (_event: React.MouseEvent, node: Node) => {
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

      // Walkthrough mode: handle build palette drops
      if (mode === 'walkthrough' && onNodeAdd) {
        const componentData = event.dataTransfer.getData('application/reactflow');
        if (componentData) {
          // Parse the component from build palette
          const component = JSON.parse(componentData);
          const newNode: Node = {
            id: `${component.componentType}-${Date.now()}`,
            type: NODE_TYPE.ARCH_COMPONENT,
            position,
            data: {
              label: component.label,
              componentType: component.componentType,
            },
          };
          onNodeAdd(newNode);
          return;
        }
      }

      // Editor mode: handle widget and component drops
      if (mode === 'editor') {
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
      }
    },
    [screenToFlowPosition, addNode, addWidgetNode, addWidgetInstance, mode, onNodeAdd],
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

  const showConnectionFeedback = useCallback(
    (message: string, type: 'error' | 'warning') => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      setConnectionFeedback({ message, type });

      feedbackTimeoutRef.current = setTimeout(() => {
        setConnectionFeedback(null);
        feedbackTimeoutRef.current = null;
      }, 3500);
    },
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const validation = validateArchConnection(nodes, connection);

      if (!validation.valid) {
        // Hard rejection - show error and prevent connection
        if (validation.warning) {
          showConnectionFeedback(validation.warning, 'error');
        }
        return;
      }

      // Valid connection - proceed
      if (mode === 'editor') {
        onConnectStore(connection);
      }
      // Walkthrough mode handles connections via its own handler (passed as prop)

      // Show soft warning if present
      if (validation.warning) {
        showConnectionFeedback(validation.warning, 'warning');
      }
    },
    [nodes, onConnectStore, showConnectionFeedback, mode]
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

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Walkthrough mode: fit view on step change
  useEffect(() => {
    if (mode === 'walkthrough' && stepId) {
      const timeout = setTimeout(() => {
        fitView({ duration: prefersReducedMotion ? 0 : 800, padding: 0.2 }).catch(() => {});
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [mode, stepId, fitView, prefersReducedMotion]);

  // Enrich nodes and edges with walkthrough-specific data
  const displayNodes = useMemo(() => {
    if (mode !== 'walkthrough') return nodes;

    const highlightedSet = new Set(highlightedNodeIds);
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        highlighted: highlightedSet.has(node.id),
      },
    }));
  }, [mode, nodes, highlightedNodeIds]);

  const displayEdges = useMemo(() => {
    if (mode !== 'walkthrough') return edges;

    const animatedSet = new Set(animatedEdgeIds);
    return edges.map(edge => ({
      ...edge,
      animated: animatedSet.has(edge.id),
    }));
  }, [mode, edges, animatedEdgeIds]);

  // Stable ReactFlow config props - memoized to prevent re-renders
  const fitViewOptions = useMemo(
    () => (mode === 'walkthrough' ? WALKTHROUGH_FIT_VIEW_OPTIONS : EDITOR_FIT_VIEW_OPTIONS),
    [mode]
  );

  const deleteKeyCode = useMemo(
    () => (mode === 'editor' ? EDITOR_DELETE_KEYS : WALKTHROUGH_DELETE_KEYS),
    [mode]
  );

  return (
    <div
      className="relative h-full w-full"
      onMouseDown={handleContainerMouseDown}
    >
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeClick={mode === 'editor' ? onNodeClick : undefined}
        onPaneClick={mode === 'editor' ? onPaneClick : undefined}
        onSelectionChange={mode === 'editor' ? onSelectionChange : undefined}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={designNodeTypes}
        edgeTypes={archEdgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid
        snapGrid={[20, 20]}
        panOnDrag={mode === 'editor' ? activeCanvasTool === CANVAS_TOOL.CURSOR : true}
        selectionOnDrag={mode === 'editor' ? activeCanvasTool === CANVAS_TOOL.SELECT : false}
        selectionMode={SelectionMode.Partial}
        nodesDraggable={mode === 'walkthrough' ? true : undefined}
        nodesConnectable={mode === 'walkthrough' ? true : undefined}
        elementsSelectable={mode === 'walkthrough' ? true : undefined}
        fitView
        minZoom={0.1}
        maxZoom={mode === 'walkthrough' ? 4.0 : 2.0}
        fitViewOptions={fitViewOptions}
        deleteKeyCode={deleteKeyCode}
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
            zIndex: Z_INDEX.DRAG_PREVIEW,
          }}
          className={cn(
            'border-2 border-dashed border-primary/60 bg-primary/5',
            activeCanvasTool === CANVAS_TOOL.CIRCLE ? 'rounded-full' : 'rounded',
          )}
        />
      )}

      {/* Floating group/section action bar — visible when nodes are selected (editor mode only) */}
      {mode === 'editor' && <SelectionActionBar />}

      {/* Connection feedback toast */}
      {connectionFeedback && (
        <div
          className={cn(
            'fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg',
            'text-sm font-medium max-w-md text-center',
            'animate-in fade-in slide-in-from-bottom-2 duration-200',
            connectionFeedback.type === 'error'
              ? 'bg-destructive text-destructive-foreground border border-destructive/20'
              : 'bg-amber-500/90 text-white border border-amber-600/20'
          )}
          style={{ zIndex: Z_INDEX.DRAG_PREVIEW + 1 }}
        >
          {connectionFeedback.message}
        </div>
      )}
    </div>
  );
}
