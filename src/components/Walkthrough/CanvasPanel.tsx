/**
 * CanvasPanel - Right side of walkthrough with interactive canvas
 */

import { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ConnectionMode,
} from '@xyflow/react';
import ArchNode from '@/components/Canvas/ArchNode';
import ShapeNode from '@/components/Canvas/ShapeNode';
import SectionBadgeNode from '@/components/Canvas/SectionBadgeNode';
import ArchEdge from '@/components/Canvas/ArchEdge';

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

interface CanvasPanelProps {
  nodes: Node[];
  edges: Edge[];
  highlightedNodeIds?: string[];
  animatedEdgeIds?: string[];
}

export function CanvasPanel({
  nodes,
  edges,
  highlightedNodeIds = [],
  animatedEdgeIds = []
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
    <div className="h-full w-full bg-background">
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
        // Read-only mode - no dragging or selecting
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
