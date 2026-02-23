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
  onNodeAdd?: (node: Node) => void; // For build mode: add node from palette
}

export function CanvasPanel({
  nodes,
  edges,
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

      // Get position on canvas where the component was dropped
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Grid-based placement to avoid stacking
      const GRID_CELL_W = 220;  // node width (~160) + gap
      const GRID_CELL_H = 120;  // node height (~80) + gap
      let finalPosition = { ...position };

      // Check if any existing node occupies this grid cell
      const isOccupied = (pos: { x: number; y: number }) =>
        displayNodes.some(n =>
          Math.abs(n.position.x - pos.x) < GRID_CELL_W * 0.7 &&
          Math.abs(n.position.y - pos.y) < GRID_CELL_H * 0.7
        );

      if (isOccupied(finalPosition)) {
        // Spiral outward to find an open cell
        let found = false;
        for (let ring = 1; ring <= 5 && !found; ring++) {
          for (let dx = -ring; dx <= ring && !found; dx++) {
            for (let dy = -ring; dy <= ring && !found; dy++) {
              if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue; // only check ring perimeter
              const candidate = {
                x: finalPosition.x + dx * GRID_CELL_W,
                y: finalPosition.y + dy * GRID_CELL_H,
              };
              if (!isOccupied(candidate)) {
                finalPosition = candidate;
                found = true;
              }
            }
          }
        }
        // If all cells occupied (unlikely with 5 rings = 100 cells), just offset right
        if (!found) {
          finalPosition = { x: finalPosition.x + GRID_CELL_W * 6, y: finalPosition.y };
        }
      }

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
      fitView
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
      <CanvasEffects highlightedNodeIds={highlightedNodeIds} nodesCount={enrichedNodes.length} />
    </ReactFlow>
  );
}
