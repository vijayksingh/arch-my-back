import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWidgetStore } from '../store/widgetStore';
import { WidgetNode } from './WidgetNode';
import { compositionEngine } from '../composition/compositionEngine';
import type { WidgetConnection } from '../types';

const nodeTypes: NodeTypes = {
  widget: WidgetNode,
};

interface FlowEditorProps {
  flowId?: string;
  onSave?: (flowId: string) => void;
}

/**
 * Visual Flow Editor
 * Allows users to compose widgets by dragging connections between them
 */
export function FlowEditor({ flowId, onSave }: FlowEditorProps) {
  const { widgets, connections, connectWidgets, flows } = useWidgetStore();

  // Convert widget instances to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    const widgetList = flowId && flows[flowId]
      ? flows[flowId].widgets
      : Object.values(widgets);

    return widgetList.map((widget) => ({
      id: widget.id,
      type: 'widget',
      position: widget.position || { x: 0, y: 0 },
      data: {
        widget,
        onOutput: (output: unknown) => {
          // Handle output and propagate to connected widgets
          useWidgetStore.getState().updateWidgetOutput(widget.id, output);

          // Find connections from this widget
          const outgoingConnections = connections.filter(
            (conn) => conn.from.widgetId === widget.id
          );

          // Propagate data through connections
          outgoingConnections.forEach((conn) => {
            const result = compositionEngine.propagateData(
              conn,
              output,
              useWidgetStore.getState().widgets
            );

            if (result) {
              useWidgetStore.getState().updateWidgetInput(
                result.targetId,
                result.input
              );
            }
          });
        },
      },
    }));
  }, [widgets, connections, flows, flowId]);

  // Convert widget connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    const relevantConnections = flowId && flows[flowId]
      ? flows[flowId].connections
      : connections;

    return relevantConnections.map((conn, index) => ({
      id: `edge-${index}`,
      source: conn.from.widgetId,
      target: conn.to.widgetId,
      sourceHandle: conn.from.outputKey,
      targetHandle: conn.to.inputKey,
      animated: true,
      label: conn.from.outputKey && conn.to.inputKey
        ? `${conn.from.outputKey} → ${conn.to.inputKey}`
        : undefined,
    }));
  }, [connections, flows, flowId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      // Validate connection
      const validation = compositionEngine.canConnect(
        params.source,
        params.target,
        params.sourceHandle || undefined,
        params.targetHandle || undefined
      );

      if (!validation.valid) {
        console.error('Invalid connection:', validation.error);
        return;
      }

      // Create widget connection
      const newConnection: WidgetConnection = {
        from: {
          widgetId: params.source,
          outputKey: params.sourceHandle || 'output',
        },
        to: {
          widgetId: params.target,
          inputKey: params.targetHandle || 'input',
        },
      };

      // Add to store
      connectWidgets(newConnection);

      // Add edge to React Flow
      setEdges((eds) => addEdge(params, eds));
    },
    [connectWidgets, setEdges]
  );

  // Handle node position updates
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const store = useWidgetStore.getState();
      const widget = store.widgets[node.id];
      if (widget) {
        store.updateWidgetConfig(node.id, {
          ...widget.config,
        });
        // Update position in widget instance
        widget.position = node.position;
      }
    },
    []
  );

  // Save flow
  const handleSave = useCallback(() => {
    const store = useWidgetStore.getState();
    const widgetIds = nodes.map((node) => node.id);
    const savedFlowId = flowId || store.createFlow('Untitled Flow', widgetIds);
    onSave?.(savedFlowId);
  }, [nodes, flowId, onSave]);

  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-between border-b p-2">
        <h3 className="text-sm font-medium">Flow Editor</h3>
        <button
          onClick={handleSave}
          className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
        >
          Save Flow
        </button>
      </div>
      <div className="h-[calc(100%-3rem)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
