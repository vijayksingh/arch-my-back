/**
 * CanvasPanel - Right side of walkthrough with interactive canvas
 */

import {
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { baseNodeTypes, archEdgeTypes } from '@/registry/flowNodeTypes';
import { validateArchConnection } from '@/lib/connectionRules';
import type { BuildPaletteComponent } from '@/types/walkthrough';
import { NODE_TYPE } from '@/constants';
import { componentTypes } from '@/registry/componentTypes';

// Category to tier mapping for semantic layout
const CATEGORY_TIER: Record<string, number> = {
  'Clients': 0,
  'Traffic': 1,
  'Compute': 2,
  'Caching': 2,        // same tier as compute, placed to the side
  'Messaging': 2,      // same tier as compute
  'Search & Analytics': 3,
  'ML / AI': 3,
  'Databases': 4,
  'Observability': 3,  // side channel
  'External': 1,       // similar to traffic layer
};

const TIER_Y: Record<number, number> = {
  0: 0,
  1: 150,
  2: 300,
  3: 450,
  4: 600,
};

function CanvasEffects({ highlightedNodeIds, stepId }: { highlightedNodeIds: string[], stepId: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (highlightedNodeIds.length > 0) {
        fitView({
          nodes: highlightedNodeIds.map(id => ({ id })),
          duration: 800,
          padding: 0.3,
        }).catch(() => { });
      } else {
        fitView({ duration: 800, padding: 0.1 }).catch(() => { });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [highlightedNodeIds, stepId, fitView]);

  return null;
}

interface CanvasPanelProps {
  nodes: Node[];
  edges: Edge[];
  stepId: string;
  highlightedNodeIds?: string[];
  animatedEdgeIds?: string[];
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  onNodeDragStop?: (e: React.MouseEvent, node: Node) => void;
  onConnect?: (connection: Connection) => void;
  onNodeAdd?: (node: Node) => void; // For build mode: add node from palette
}

export function CanvasPanel({
  nodes,
  edges,
  stepId,
  highlightedNodeIds = [],
  animatedEdgeIds = [],
  nodesDraggable = false,
  nodesConnectable = false,
  onNodeDragStop,
  onConnect,
  onNodeAdd
}: CanvasPanelProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Derive display nodes and edges from props using useMemo
  const displayNodes = useMemo(() =>
    nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        highlighted: highlightedNodeIds.includes(node.id),
      },
    })),
    [nodes, highlightedNodeIds]
  );

  const displayEdges = useMemo(() =>
    edges.map(edge => ({
      ...edge,
      animated: animatedEdgeIds.includes(edge.id),
    })),
    [edges, animatedEdgeIds]
  );

  // Validate connections in walkthrough mode
  const handleIsValidConnection = useCallback(
    (connection: Connection | Edge) => {
      return validateArchConnection(nodes, connection).valid;
    },
    [nodes]
  );

  return (
    <div className="h-full w-full bg-transparent" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <CanvasPanelInner
          displayNodes={displayNodes}
          displayEdges={displayEdges}
          stepId={stepId}
          nodesDraggable={nodesDraggable}
          nodesConnectable={nodesConnectable}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onNodeAdd={onNodeAdd}
          handleIsValidConnection={handleIsValidConnection}
          highlightedNodeIds={highlightedNodeIds}
          reactFlowWrapper={reactFlowWrapper}
        />
      </ReactFlowProvider>
    </div>
  );
}

interface CanvasPanelInnerProps {
  displayNodes: Node[];
  displayEdges: Edge[];
  stepId: string;
  nodesDraggable: boolean;
  nodesConnectable: boolean;
  onNodeDragStop?: (e: React.MouseEvent, node: Node) => void;
  onConnect?: (connection: Connection) => void;
  onNodeAdd?: (node: Node) => void;
  handleIsValidConnection: (connection: Connection | Edge) => boolean;
  highlightedNodeIds: string[];
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
}

function CanvasPanelInner({
  displayNodes,
  displayEdges,
  stepId,
  nodesDraggable,
  nodesConnectable,
  onNodeDragStop,
  onConnect,
  onNodeAdd,
  handleIsValidConnection,
  highlightedNodeIds
}: CanvasPanelInnerProps) {
  const { screenToFlowPosition } = useReactFlow();
  const [newlyAddedNodeId, setNewlyAddedNodeId] = useState<string | null>(null);

  // Enrich nodes with isNewlyAdded flag
  const enrichedNodes = useMemo(() =>
    displayNodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        isNewlyAdded: n.id === newlyAddedNodeId,
      },
    })),
    [displayNodes, newlyAddedNodeId]
  );

  // Handle drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const componentData = event.dataTransfer.getData('application/reactflow');
      if (!componentData || !onNodeAdd) return;

      const component: BuildPaletteComponent = JSON.parse(componentData);

      // Tier-based semantic placement using component categories
      const componentConfig = componentTypes.find(c => c.key === component.componentType);
      const category = componentConfig?.category || 'Compute';
      const tier = CATEGORY_TIER[category] ?? 2;
      const baseY = TIER_Y[tier] ?? 300;

      // Find existing nodes in same tier
      const sameTierNodes = displayNodes.filter(n => {
        const existingConfig = componentTypes.find(c => c.key === n.data?.componentType);
        const existingCategory = existingConfig?.category || 'Compute';
        const existingTier = CATEGORY_TIER[existingCategory] ?? 2;
        return existingTier === tier;
      });

      let finalX: number;
      if (sameTierNodes.length === 0) {
        finalX = 300; // center
      } else {
        const rightmost = Math.max(...sameTierNodes.map(n => n.position.x));
        finalX = rightmost + 220;
      }

      const finalPosition = { x: finalX, y: baseY };

      // Create new node
      const newNode: Node = {
        id: `${component.componentType}-${Date.now()}`,
        type: NODE_TYPE.ARCH_COMPONENT,
        position: finalPosition,
        data: {
          label: component.label,
          componentType: component.componentType,
        },
      };

      onNodeAdd(newNode);

      // Set newly added node ID and clear after 2 seconds
      setNewlyAddedNodeId(newNode.id);
      setTimeout(() => setNewlyAddedNodeId(null), 2000);
    },
    [screenToFlowPosition, onNodeAdd, displayNodes]
  );

  return (
    <ReactFlow
      nodes={enrichedNodes}
      edges={displayEdges}
      nodeTypes={baseNodeTypes}
      edgeTypes={archEdgeTypes}
      connectionMode={ConnectionMode.Loose}
      minZoom={0.1}
      maxZoom={4}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      nodesDraggable={nodesDraggable}
      nodesConnectable={nodesConnectable}
      elementsSelectable={nodesDraggable || nodesConnectable}
      onNodeDragStop={onNodeDragStop}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      isValidConnection={handleIsValidConnection}
    >
      <Background />
      <Controls />
      <MiniMap position="bottom-left" pannable zoomable />
      <CanvasEffects highlightedNodeIds={highlightedNodeIds} stepId={stepId} />
    </ReactFlow>
  );
}
