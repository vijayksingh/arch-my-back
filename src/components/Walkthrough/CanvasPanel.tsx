/**
 * CanvasPanel - Right side of walkthrough with interactive canvas
 */

import ArchEdge from '@/components/Canvas/ArchEdge';
import ArchNode from '@/components/Canvas/ArchNode';
import SectionBadgeNode from '@/components/Canvas/SectionBadgeNode';
import ShapeNode from '@/components/Canvas/ShapeNode';
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
import { useCallback, useEffect, useMemo } from 'react';
import { isConnectionValid } from '@/lib/connectionRules';

const nodeTypes = {
  archComponent: ArchNode,
  shapeRect: ShapeNode,
  shapeCircle: ShapeNode,
  shapeText: ShapeNode,
  sectionBadge: SectionBadgeNode,
};

const edgeTypes = {
  archEdge: ArchEdge,
  default: ArchEdge,
};

function CanvasEffects({ highlightedNodeIds, nodesCount }: { highlightedNodeIds: string[], nodesCount: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (highlightedNodeIds.length > 0) {
        fitView({
          nodes: highlightedNodeIds.map(id => ({ id })),
          duration: 800,
          padding: 0.3,
        }).catch(() => { });
      } else if (nodesCount > 0) {
        fitView({ duration: 800, padding: 0.1 }).catch(() => { });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [highlightedNodeIds, nodesCount, fitView]);

  return null;
}

interface CanvasPanelProps {
  nodes: Node[];
  edges: Edge[];
  highlightedNodeIds?: string[];
  animatedEdgeIds?: string[];
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  onNodeDragStop?: (e: React.MouseEvent, node: Node) => void;
  onConnect?: (connection: Connection) => void;
}

export function CanvasPanel({
  nodes,
  edges,
  highlightedNodeIds = [],
  animatedEdgeIds = [],
  nodesDraggable = false,
  nodesConnectable = false,
  onNodeDragStop,
  onConnect
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
      // Prevent self-loops
      if (connection.source === connection.target) {
        return false;
      }

      // Get source and target nodes to determine their types
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      // Only validate arch component connections (not shapes, badges, etc.)
      if (sourceNode?.type === 'archComponent' && targetNode?.type === 'archComponent') {
        const sourceType = sourceNode.data.componentType as string;
        const targetType = targetNode.data.componentType as string;

        const validation = isConnectionValid(sourceType, targetType);
        return validation.valid;
      }

      // Allow all other connection types (shapes, badges, etc.)
      return true;
    },
    [nodes]
  );

  return (
    <div className="h-full w-full bg-transparent">
      <ReactFlowProvider>
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          minZoom={0.1}
          maxZoom={4}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          nodesDraggable={nodesDraggable}
          nodesConnectable={nodesConnectable}
          elementsSelectable={nodesDraggable || nodesConnectable}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          isValidConnection={handleIsValidConnection}
        >
          <Background />
          <Controls />
          <MiniMap />
          <CanvasEffects highlightedNodeIds={highlightedNodeIds} nodesCount={displayNodes.length} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
