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
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import { useEffect } from 'react';

const nodeTypes = {
  archComponent: ArchNode,
  shapeRect: ShapeNode,
  shapeCircle: ShapeNode,
  shapeText: ShapeNode,
  sectionBadge: SectionBadgeNode,
};

const edgeTypes = {
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
  const [displayNodes, setDisplayNodes, onNodesChange] = useNodesState<Node>([]);
  const [displayEdges, setDisplayEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Update nodes and edges when they change
  useEffect(() => {
    setDisplayNodes(nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        highlighted: highlightedNodeIds.includes(node.id),
      },
    })));
  }, [nodes, highlightedNodeIds, setDisplayNodes]);

  useEffect(() => {
    setDisplayEdges(edges.map(edge => ({
      ...edge,
      animated: animatedEdgeIds.includes(edge.id),
    })));
  }, [edges, animatedEdgeIds, setDisplayEdges]);

  return (
    <div className="h-full w-full bg-transparent">
      <ReactFlowProvider>
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
