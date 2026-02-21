import type { WidgetConnection, WidgetInstance } from '../types';
import { widgetRegistry } from '../registry/widgetRegistry';
import Ajv from 'ajv';

const ajv = new Ajv();

/**
 * Composition Engine - Handles widget-to-widget data flow and validation
 * Implements pipe, fan-out, fan-in composition patterns
 */
export class CompositionEngine {
  /**
   * Validate if two widgets can be connected
   * Checks if output schema of source widget matches input schema of target widget
   */
  canConnect(
    fromWidgetId: string,
    toWidgetId: string,
    _outputKey?: string,
    _inputKey?: string,
  ): { valid: boolean; error?: string } {
    const fromDef = widgetRegistry.get(fromWidgetId);
    const toDef = widgetRegistry.get(toWidgetId);

    if (!fromDef) {
      return { valid: false, error: `Source widget "${fromWidgetId}" not found` };
    }

    if (!toDef) {
      return {
        valid: false,
        error: `Target widget "${toWidgetId}" not found`,
      };
    }

    // For now, accept any connection (schema validation can be added later)
    // In production, we'd validate that fromDef.outputSchema is compatible with toDef.inputSchema
    return { valid: true };
  }

  /**
   * Propagate output from one widget to connected widgets
   * Applies transformations if defined in the connection
   */
  propagateData(
    connection: WidgetConnection,
    sourceOutput: unknown,
    widgets: Record<string, WidgetInstance>,
  ): { targetId: string; input: unknown } | null {
    const targetWidget = widgets[connection.to.widgetId];
    if (!targetWidget) {
      console.error(
        `Target widget "${connection.to.widgetId}" not found for data propagation`,
      );
      return null;
    }

    // Extract the specific output value if outputKey is specified
    let data = sourceOutput;
    if (
      connection.from.outputKey &&
      typeof sourceOutput === 'object' &&
      sourceOutput !== null
    ) {
      data = (sourceOutput as Record<string, unknown>)[
        connection.from.outputKey
      ];
    }

    // Apply transformation if defined
    if (connection.transform) {
      data = connection.transform(data);
    }

    // If inputKey is specified, wrap the data in an object
    // Otherwise, pass the data as-is
    const input =
      connection.to.inputKey && typeof data !== 'undefined'
        ? { [connection.to.inputKey]: data }
        : data;

    return {
      targetId: connection.to.widgetId,
      input,
    };
  }

  /**
   * Validate widget output against its output schema
   */
  validateOutput(
    widgetId: string,
    output: unknown,
  ): { valid: boolean; errors?: string[] } {
    const definition = widgetRegistry.get(widgetId);
    if (!definition) {
      return { valid: false, errors: [`Widget "${widgetId}" not found`] };
    }

    const validate = ajv.compile(definition.outputSchema);
    const valid = validate(output);

    if (!valid && validate.errors) {
      return {
        valid: false,
        errors: validate.errors.map((err) => err.message || 'Validation error'),
      };
    }

    return { valid: true };
  }

  /**
   * Validate widget input against its input schema
   */
  validateInput(
    widgetId: string,
    input: unknown,
  ): { valid: boolean; errors?: string[] } {
    const definition = widgetRegistry.get(widgetId);
    if (!definition) {
      return { valid: false, errors: [`Widget "${widgetId}" not found`] };
    }

    const validate = ajv.compile(definition.inputSchema);
    const valid = validate(input);

    if (!valid && validate.errors) {
      return {
        valid: false,
        errors: validate.errors.map((err) => err.message || 'Validation error'),
      };
    }

    return { valid: true };
  }

  /**
   * Build a data flow graph from connections
   * Returns widgets in topological order (sources first, sinks last)
   */
  buildFlowGraph(
    widgets: Record<string, WidgetInstance>,
    connections: WidgetConnection[],
  ): {
    graph: Map<string, string[]>; // adjacency list
    sources: string[]; // widgets with no incoming connections
    sinks: string[]; // widgets with no outgoing connections
  } {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize graph with all widget IDs
    Object.keys(widgets).forEach((id) => {
      graph.set(id, []);
      inDegree.set(id, 0);
    });

    // Build adjacency list and calculate in-degrees
    connections.forEach((conn) => {
      const neighbors = graph.get(conn.from.widgetId) || [];
      neighbors.push(conn.to.widgetId);
      graph.set(conn.from.widgetId, neighbors);

      inDegree.set(conn.to.widgetId, (inDegree.get(conn.to.widgetId) || 0) + 1);
    });

    const sources = Array.from(inDegree.entries())
      .filter(([, degree]) => degree === 0)
      .map(([id]) => id);

    const sinks = Array.from(graph.entries())
      .filter(([, neighbors]) => neighbors.length === 0)
      .map(([id]) => id);

    return { graph, sources, sinks };
  }

  /**
   * Detect cycles in the widget graph
   * Returns true if there's a cycle (invalid composition)
   */
  hasCycle(
    widgets: Record<string, WidgetInstance>,
    connections: WidgetConnection[],
  ): boolean {
    const { graph } = this.buildFlowGraph(widgets, connections);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) return true;
      }
    }

    return false;
  }
}

// Singleton instance
export const compositionEngine = new CompositionEngine();
