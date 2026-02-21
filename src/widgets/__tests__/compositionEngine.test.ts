import { describe, it, expect, beforeEach } from 'vitest';
import { compositionEngine } from '../composition/compositionEngine';
import { widgetRegistry } from '../registry/widgetRegistry';
import type { WidgetDefinition, WidgetInstance, WidgetConnection } from '../types';

describe('CompositionEngine', () => {
  const mockWidgetA: WidgetDefinition = {
    id: 'widget-a',
    name: 'Widget A',
    category: 'visualization',
    icon: 'Icon',
    description: 'Test widget A',
    tags: [],
    inputSchema: { type: 'object', properties: { data: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { result: { type: 'string' } } },
    configSchema: { type: 'object' },
    defaultConfig: {},
    component: () => null,
    examples: [],
  };

  const mockWidgetB: WidgetDefinition = {
    id: 'widget-b',
    name: 'Widget B',
    category: 'interaction',
    icon: 'Icon',
    description: 'Test widget B',
    tags: [],
    inputSchema: { type: 'object', properties: { input: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { output: { type: 'string' } } },
    configSchema: { type: 'object' },
    defaultConfig: {},
    component: () => null,
    examples: [],
  };

  beforeEach(() => {
    widgetRegistry.clear();
    widgetRegistry.register(mockWidgetA);
    widgetRegistry.register(mockWidgetB);
  });

  describe('canConnect', () => {
    it('should allow connection between registered widgets', () => {
      const result = compositionEngine.canConnect('widget-a', 'widget-b');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject connection with non-existent source widget', () => {
      const result = compositionEngine.canConnect('non-existent', 'widget-b');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject connection with non-existent target widget', () => {
      const result = compositionEngine.canConnect('widget-a', 'non-existent');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('propagateData', () => {
    const mockWidgets: Record<string, WidgetInstance> = {
      'instance-1': {
        id: 'instance-1',
        widgetId: 'widget-a',
        config: {},
      },
      'instance-2': {
        id: 'instance-2',
        widgetId: 'widget-b',
        config: {},
      },
    };

    it('should propagate data from source to target', () => {
      const connection: WidgetConnection = {
        from: { widgetId: 'instance-1', outputKey: 'result' },
        to: { widgetId: 'instance-2', inputKey: 'input' },
      };

      const sourceOutput = { result: 'test data' };

      const result = compositionEngine.propagateData(
        connection,
        sourceOutput,
        mockWidgets,
      );

      expect(result).not.toBeNull();
      expect(result?.targetId).toBe('instance-2');
      expect(result?.input).toEqual({ input: 'test data' });
    });

    it('should apply transformation if provided', () => {
      const connection: WidgetConnection = {
        from: { widgetId: 'instance-1', outputKey: 'result' },
        to: { widgetId: 'instance-2', inputKey: 'input' },
        transform: (data) => (data as string).toUpperCase(),
      };

      const sourceOutput = { result: 'test data' };

      const result = compositionEngine.propagateData(
        connection,
        sourceOutput,
        mockWidgets,
      );

      expect(result).not.toBeNull();
      expect(result?.input).toEqual({ input: 'TEST DATA' });
    });

    it('should return null for non-existent target widget', () => {
      const connection: WidgetConnection = {
        from: { widgetId: 'instance-1', outputKey: 'result' },
        to: { widgetId: 'non-existent', inputKey: 'input' },
      };

      const result = compositionEngine.propagateData(
        connection,
        { result: 'data' },
        mockWidgets,
      );

      expect(result).toBeNull();
    });
  });

  describe('buildFlowGraph', () => {
    it('should build flow graph with sources and sinks', () => {
      const widgets: Record<string, WidgetInstance> = {
        'w1': { id: 'w1', widgetId: 'widget-a', config: {} },
        'w2': { id: 'w2', widgetId: 'widget-b', config: {} },
        'w3': { id: 'w3', widgetId: 'widget-a', config: {} },
      };

      const connections: WidgetConnection[] = [
        {
          from: { widgetId: 'w1', outputKey: 'result' },
          to: { widgetId: 'w2', inputKey: 'input' },
        },
        {
          from: { widgetId: 'w2', outputKey: 'output' },
          to: { widgetId: 'w3', inputKey: 'data' },
        },
      ];

      const { graph, sources, sinks } = compositionEngine.buildFlowGraph(
        widgets,
        connections,
      );

      expect(graph.size).toBe(3);
      expect(sources).toContain('w1'); // w1 has no incoming connections
      expect(sinks).toContain('w3'); // w3 has no outgoing connections
      expect(graph.get('w1')).toContain('w2');
      expect(graph.get('w2')).toContain('w3');
    });

    it('should handle disconnected widgets', () => {
      const widgets: Record<string, WidgetInstance> = {
        'w1': { id: 'w1', widgetId: 'widget-a', config: {} },
        'w2': { id: 'w2', widgetId: 'widget-b', config: {} },
      };

      const connections: WidgetConnection[] = [];

      const { sources, sinks } = compositionEngine.buildFlowGraph(
        widgets,
        connections,
      );

      // All widgets are both sources and sinks when disconnected
      expect(sources).toHaveLength(2);
      expect(sinks).toHaveLength(2);
    });
  });

  describe('hasCycle', () => {
    it('should detect cycle in widget graph', () => {
      const widgets: Record<string, WidgetInstance> = {
        'w1': { id: 'w1', widgetId: 'widget-a', config: {} },
        'w2': { id: 'w2', widgetId: 'widget-b', config: {} },
        'w3': { id: 'w3', widgetId: 'widget-a', config: {} },
      };

      // Create a cycle: w1 -> w2 -> w3 -> w1
      const connections: WidgetConnection[] = [
        {
          from: { widgetId: 'w1', outputKey: 'result' },
          to: { widgetId: 'w2', inputKey: 'input' },
        },
        {
          from: { widgetId: 'w2', outputKey: 'output' },
          to: { widgetId: 'w3', inputKey: 'data' },
        },
        {
          from: { widgetId: 'w3', outputKey: 'result' },
          to: { widgetId: 'w1', inputKey: 'data' },
        },
      ];

      const hasCycle = compositionEngine.hasCycle(widgets, connections);
      expect(hasCycle).toBe(true);
    });

    it('should not detect cycle in acyclic graph', () => {
      const widgets: Record<string, WidgetInstance> = {
        'w1': { id: 'w1', widgetId: 'widget-a', config: {} },
        'w2': { id: 'w2', widgetId: 'widget-b', config: {} },
        'w3': { id: 'w3', widgetId: 'widget-a', config: {} },
      };

      // Linear flow: w1 -> w2 -> w3
      const connections: WidgetConnection[] = [
        {
          from: { widgetId: 'w1', outputKey: 'result' },
          to: { widgetId: 'w2', inputKey: 'input' },
        },
        {
          from: { widgetId: 'w2', outputKey: 'output' },
          to: { widgetId: 'w3', inputKey: 'data' },
        },
      ];

      const hasCycle = compositionEngine.hasCycle(widgets, connections);
      expect(hasCycle).toBe(false);
    });
  });

  describe('validateOutput', () => {
    it('should validate output against schema', () => {
      const output = { result: 'test' };
      const result = compositionEngine.validateOutput('widget-a', output);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return error for non-existent widget', () => {
      const result = compositionEngine.validateOutput('non-existent', {});

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateInput', () => {
    it('should validate input against schema', () => {
      const input = { data: 'test' };
      const result = compositionEngine.validateInput('widget-a', input);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return error for non-existent widget', () => {
      const result = compositionEngine.validateInput('non-existent', {});

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
