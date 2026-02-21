import { create } from 'zustand';
import { temporal } from 'zundo';
import type {
  WidgetInstance,
  WidgetFlow,
  WidgetConnection,
  WidgetDefinition,
} from '../types';
import { widgetRegistry } from '../registry/widgetRegistry';

/**
 * Widget Store - Manages widget instances, flows, and connections
 * Uses Zustand with temporal middleware for undo/redo
 */
interface WidgetStore {
  // State
  widgets: Record<string, WidgetInstance>;
  flows: Record<string, WidgetFlow>;
  connections: WidgetConnection[];
  selectedWidgetId: string | null;

  // Widget instance operations
  addWidget: (
    widgetId: string,
    config?: unknown,
    position?: { x: number; y: number },
  ) => string | null;
  removeWidget: (instanceId: string) => void;
  updateWidgetConfig: (instanceId: string, config: unknown) => void;
  updateWidgetInput: (instanceId: string, input: unknown) => void;
  updateWidgetOutput: (instanceId: string, output: unknown) => void;
  setSelectedWidget: (instanceId: string | null) => void;

  // Connection operations
  connectWidgets: (connection: WidgetConnection) => void;
  disconnectWidgets: (
    fromWidgetId: string,
    toWidgetId: string,
    outputKey?: string,
    inputKey?: string,
  ) => void;
  getConnectedWidgets: (instanceId: string) => WidgetInstance[];

  // Flow operations
  createFlow: (name: string, widgetIds: string[]) => string;
  removeFlow: (flowId: string) => void;
  updateFlow: (flowId: string, updates: Partial<WidgetFlow>) => void;

  // Queries
  getWidget: (instanceId: string) => WidgetInstance | undefined;
  getWidgetOutput: (instanceId: string, outputKey?: string) => unknown;
  getWidgetsByType: (widgetId: string) => WidgetInstance[];

  // Bulk operations
  clearWidgets: () => void;
}

let instanceIdCounter = 0;

function generateInstanceId(): string {
  return `widget_${Date.now()}_${instanceIdCounter++}`;
}

let flowIdCounter = 0;

function generateFlowId(): string {
  return `flow_${Date.now()}_${flowIdCounter++}`;
}

export const useWidgetStore = create<WidgetStore>()(
  temporal(
    (set, get) => ({
      widgets: {},
      flows: {},
      connections: [],
      selectedWidgetId: null,

      addWidget: (widgetId, config, position) => {
        // Validate widget definition exists
        const definition = widgetRegistry.get(widgetId);
        if (!definition) {
          console.error(`Widget definition "${widgetId}" not found in registry`);
          return null;
        }

        const instanceId = generateInstanceId();
        const newWidget: WidgetInstance = {
          id: instanceId,
          widgetId,
          config: config ?? definition.defaultConfig,
          position: position ?? { x: 0, y: 0 },
        };

        set((state) => ({
          widgets: { ...state.widgets, [instanceId]: newWidget },
        }));

        return instanceId;
      },

      removeWidget: (instanceId) => {
        set((state) => {
          const { [instanceId]: _removed, ...remainingWidgets } = state.widgets;

          // Remove connections involving this widget
          const filteredConnections = state.connections.filter(
            (conn) =>
              conn.from.widgetId !== instanceId &&
              conn.to.widgetId !== instanceId,
          );

          return {
            widgets: remainingWidgets,
            connections: filteredConnections,
            selectedWidgetId:
              state.selectedWidgetId === instanceId
                ? null
                : state.selectedWidgetId,
          };
        });
      },

      updateWidgetConfig: (instanceId, config) => {
        set((state) => {
          const widget = state.widgets[instanceId];
          if (!widget) return state;

          return {
            widgets: {
              ...state.widgets,
              [instanceId]: {
                ...widget,
                config: { ...widget.config, ...config },
              },
            },
          };
        });
      },

      updateWidgetInput: (instanceId, input) => {
        set((state) => {
          const widget = state.widgets[instanceId];
          if (!widget) return state;

          return {
            widgets: {
              ...state.widgets,
              [instanceId]: { ...widget, input },
            },
          };
        });
      },

      updateWidgetOutput: (instanceId, output) => {
        set((state) => {
          const widget = state.widgets[instanceId];
          if (!widget) return state;

          return {
            widgets: {
              ...state.widgets,
              [instanceId]: { ...widget, output },
            },
          };
        });
      },

      setSelectedWidget: (instanceId) => {
        set({ selectedWidgetId: instanceId });
      },

      connectWidgets: (connection) => {
        // Validate both widgets exist
        const fromWidget = get().widgets[connection.from.widgetId];
        const toWidget = get().widgets[connection.to.widgetId];

        if (!fromWidget || !toWidget) {
          console.error('Cannot connect: one or both widgets not found');
          return;
        }

        set((state) => ({
          connections: [...state.connections, connection],
        }));
      },

      disconnectWidgets: (fromWidgetId, toWidgetId, outputKey, inputKey) => {
        set((state) => ({
          connections: state.connections.filter(
            (conn) =>
              !(
                conn.from.widgetId === fromWidgetId &&
                conn.to.widgetId === toWidgetId &&
                (outputKey === undefined ||
                  conn.from.outputKey === outputKey) &&
                (inputKey === undefined || conn.to.inputKey === inputKey)
              ),
          ),
        }));
      },

      getConnectedWidgets: (instanceId) => {
        const state = get();
        const connections = state.connections.filter(
          (conn) =>
            conn.from.widgetId === instanceId ||
            conn.to.widgetId === instanceId,
        );

        const connectedIds = new Set<string>();
        connections.forEach((conn) => {
          connectedIds.add(conn.from.widgetId);
          connectedIds.add(conn.to.widgetId);
        });
        connectedIds.delete(instanceId);

        return Array.from(connectedIds)
          .map((id) => state.widgets[id])
          .filter(Boolean);
      },

      createFlow: (name, widgetIds) => {
        const flowId = generateFlowId();
        const state = get();

        // Get widget instances
        const widgets = widgetIds
          .map((id) => state.widgets[id])
          .filter(Boolean);

        // Get connections between these widgets
        const connections = state.connections.filter(
          (conn) =>
            widgetIds.includes(conn.from.widgetId) &&
            widgetIds.includes(conn.to.widgetId),
        );

        const newFlow: WidgetFlow = {
          id: flowId,
          name,
          widgets,
          connections,
        };

        set((state) => ({
          flows: { ...state.flows, [flowId]: newFlow },
        }));

        return flowId;
      },

      removeFlow: (flowId) => {
        set((state) => {
          const { [flowId]: _removed, ...remainingFlows } = state.flows;
          return { flows: remainingFlows };
        });
      },

      updateFlow: (flowId, updates) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) return state;

          return {
            flows: {
              ...state.flows,
              [flowId]: { ...flow, ...updates },
            },
          };
        });
      },

      getWidget: (instanceId) => {
        return get().widgets[instanceId];
      },

      getWidgetOutput: (instanceId, outputKey) => {
        const widget = get().widgets[instanceId];
        if (!widget || !widget.output) return undefined;

        if (outputKey && typeof widget.output === 'object' && widget.output !== null) {
          return (widget.output as Record<string, unknown>)[outputKey];
        }

        return widget.output;
      },

      getWidgetsByType: (widgetId) => {
        const state = get();
        return Object.values(state.widgets).filter(
          (widget) => widget.widgetId === widgetId,
        );
      },

      clearWidgets: () => {
        set({
          widgets: {},
          flows: {},
          connections: [],
          selectedWidgetId: null,
        });
        // Clear temporal history when clearing widgets
        useWidgetStore.temporal.getState().clear();
      },
    }),
    {
      limit: 50,
      // Only track meaningful state changes (not UI state like selection)
      equality: (pastState, currentState) =>
        JSON.stringify(pastState.widgets) ===
          JSON.stringify(currentState.widgets) &&
        JSON.stringify(pastState.connections) ===
          JSON.stringify(currentState.connections) &&
        JSON.stringify(pastState.flows) === JSON.stringify(currentState.flows),
    },
  ),
);
