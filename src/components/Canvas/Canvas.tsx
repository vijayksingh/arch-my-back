import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import type { ArchNode, ComponentCategory } from '@/types';
import { useCanvasStore } from '@/stores/canvasStore';
import { componentTypeMap } from '@/registry/componentTypes';
import ArchNodeComponent from './ArchNode';
import ArchEdge from './ArchEdge';

const nodeTypes: NodeTypes = {
  archComponent: ArchNodeComponent,
};

const edgeTypes: EdgeTypes = {
  archEdge: ArchEdge,
};

const DRAG_DATA_TYPE = 'application/archcomponent';
const categoryMiniMapColors: Record<ComponentCategory, string> = {
  Traffic: 'hsl(var(--category-traffic-accent))',
  Compute: 'hsl(var(--category-compute-accent))',
  Storage: 'hsl(var(--category-storage-accent))',
  Messaging: 'hsl(var(--category-messaging-accent))',
  Caching: 'hsl(var(--category-caching-accent))',
  External: 'hsl(var(--category-external-accent))',
};

export default function Canvas() {
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const addNode = useCanvasStore((s) => s.addNode);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: ArchNode) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

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
  const miniMapNodeColor = useCallback((node: ArchNode) => {
    const componentType = (node.data as ArchNode['data'] | undefined)?.componentType;
    if (!componentType) return 'hsl(var(--muted-foreground))';

    const typeDef = componentTypeMap.get(componentType);
    if (!typeDef) return 'hsl(var(--muted-foreground))';

    return categoryMiniMapColors[typeDef.category];
  }, []);

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
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid
        snapGrid={[20, 20]}
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
