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
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

function CanvasEffects({ stepId }: { stepId: string }) {
  const { fitView } = useReactFlow();

  // Fit view on step navigation only
  useEffect(() => {
    const timeout = setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 }).catch(() => {});
    }, 100);
    return () => clearTimeout(timeout);
  }, [stepId, fitView]);

  // Note: Highlighted nodes already get styling via data.highlighted
  // No need to zoom the viewport to them — that causes aggressive jumps

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
  onConnect,
  onNodeAdd
}: CanvasPanelProps) {

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
    <div className="h-full w-full bg-transparent">
      <ReactFlowProvider>
        <CanvasPanelInner
          displayNodes={displayNodes}
          displayEdges={displayEdges}
          stepId={stepId}
          nodesDraggable={nodesDraggable}
          nodesConnectable={nodesConnectable}
          onConnect={onConnect}
          onNodeAdd={onNodeAdd}
          handleIsValidConnection={handleIsValidConnection}
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
  onConnect?: (connection: Connection) => void;
  onNodeAdd?: (node: Node) => void;
  handleIsValidConnection: (connection: Connection | Edge) => boolean;
}

function CanvasPanelInner({
  displayNodes,
  displayEdges,
  stepId,
  nodesDraggable,
  nodesConnectable,
  onConnect,
  onNodeAdd,
  handleIsValidConnection
}: CanvasPanelInnerProps) {
  const [newlyAddedNodeId, setNewlyAddedNodeId] = useState<string | null>(null);

  // Local state for ReactFlow controlled mode
  const [localNodes, setLocalNodes] = useState<Node[]>(displayNodes);
  const [localEdges, setLocalEdges] = useState<Edge[]>(displayEdges);

  // Sync from parent when displayNodes actually change (new step, new node added)
  useEffect(() => {
    setLocalNodes(displayNodes);
  }, [displayNodes]);

  useEffect(() => {
    setLocalEdges(displayEdges);
  }, [displayEdges]);

  // Handle ReactFlow node changes (drag, select, etc.)
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setLocalNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  // Handle ReactFlow edge changes
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setLocalEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  // Enrich nodes with isNewlyAdded flag and highlighted status
  const enrichedNodes = useMemo(() =>
    localNodes.map(n => {
      // Get highlighted status from displayNodes (which has it set by parent)
      const displayNode = displayNodes.find(dn => dn.id === n.id);
      return {
        ...n,
        data: {
          ...n.data,
          isNewlyAdded: n.id === newlyAddedNodeId,
          highlighted: displayNode?.data?.highlighted ?? false,
        },
      };
    }),
    [localNodes, newlyAddedNodeId, displayNodes]
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
    [onNodeAdd, displayNodes]
  );

  return (
    <ReactFlow
      nodes={enrichedNodes}
      edges={localEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={baseNodeTypes}
      edgeTypes={archEdgeTypes}
      connectionMode={ConnectionMode.Loose}
      minZoom={0.1}
      maxZoom={4}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      nodesDraggable={nodesDraggable}
      nodesConnectable={nodesConnectable}
      elementsSelectable={nodesDraggable || nodesConnectable}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      isValidConnection={handleIsValidConnection}
    >
      <Background />
      <Controls position="bottom-right" />
      <MiniMap position="bottom-left" pannable zoomable />
      <CanvasEffects stepId={stepId} />
    </ReactFlow>
  );
}
