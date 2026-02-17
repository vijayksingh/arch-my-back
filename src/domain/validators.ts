import type { CanvasNode, ArchEdge, CanvasBounds, ArchNode, CanvasShapeNode } from '@/types';
import { componentTypeMap } from '@/registry/componentTypes';

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

/**
 * Helper to create success result
 */
function success<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}

/**
 * Helper to create failure result
 */
function failure<T>(errors: string[]): ValidationResult<T> {
  return { success: false, errors };
}

/**
 * Validate that a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate that a value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Validate that a value is an object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate a CanvasNode (ArchNode or CanvasShapeNode)
 */
export function validateNode(node: unknown): ValidationResult<CanvasNode> {
  const errors: string[] = [];

  if (!isObject(node)) {
    return failure(['Node must be an object']);
  }

  // Validate common fields
  if (!isNonEmptyString(node.id)) {
    errors.push('Node ID must be a non-empty string');
  }

  if (!isNonEmptyString(node.type)) {
    errors.push('Node type must be a non-empty string');
  }

  if (!isObject(node.position)) {
    errors.push('Node position must be an object');
  } else {
    if (!isNumber(node.position.x)) {
      errors.push('Node position.x must be a number');
    }
    if (!isNumber(node.position.y)) {
      errors.push('Node position.y must be a number');
    }
  }

  if (!isObject(node.data)) {
    errors.push('Node data must be an object');
  }

  // Type-specific validation
  if (node.type === 'archComponent') {
    if (!isObject(node.data)) {
      errors.push('ArchNode data must be an object');
    } else {
      const data = node.data;

      if (!isNonEmptyString(data.componentType)) {
        errors.push('ArchNode componentType must be a non-empty string');
      } else {
        // Check if component type exists in registry
        const typeDef = componentTypeMap.get(data.componentType);
        if (!typeDef) {
          errors.push(`Component type "${data.componentType}" does not exist in registry`);
        }
      }

      if (!isNonEmptyString(data.label)) {
        errors.push('ArchNode label must be a non-empty string');
      }

      if (!isObject(data.config)) {
        errors.push('ArchNode config must be an object');
      }
    }
  } else if (node.type === 'shapeRect' || node.type === 'shapeCircle' || node.type === 'shapeText') {
    if (!isObject(node.data)) {
      errors.push('ShapeNode data must be an object');
    } else {
      const data = node.data;

      if (!isNonEmptyString(data.label)) {
        errors.push('ShapeNode label must be a non-empty string');
      }

      if (!isNonEmptyString(data.shape)) {
        errors.push('ShapeNode shape must be a non-empty string');
      } else {
        const validShapes = ['rectangle', 'circle', 'text'];
        if (!validShapes.includes(data.shape as string)) {
          errors.push(`ShapeNode shape must be one of: ${validShapes.join(', ')}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success(node as CanvasNode);
}

/**
 * Validate an ArchEdge
 */
export function validateEdge(edge: unknown): ValidationResult<ArchEdge> {
  const errors: string[] = [];

  if (!isObject(edge)) {
    return failure(['Edge must be an object']);
  }

  if (!isNonEmptyString(edge.id)) {
    errors.push('Edge ID must be a non-empty string');
  }

  if (!isNonEmptyString(edge.source)) {
    errors.push('Edge source must be a non-empty string');
  }

  if (!isNonEmptyString(edge.target)) {
    errors.push('Edge target must be a non-empty string');
  }

  // data is optional but must be an object if present
  if (edge.data !== undefined && edge.data !== null && !isObject(edge.data)) {
    errors.push('Edge data must be an object if provided');
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success(edge as ArchEdge);
}

/**
 * Validate CanvasBounds
 */
export function validateBounds(bounds: unknown): ValidationResult<CanvasBounds> {
  const errors: string[] = [];

  if (!isObject(bounds)) {
    return failure(['Bounds must be an object']);
  }

  if (!isNumber(bounds.x)) {
    errors.push('Bounds x must be a number');
  }

  if (!isNumber(bounds.y)) {
    errors.push('Bounds y must be a number');
  }

  if (!isNumber(bounds.width)) {
    errors.push('Bounds width must be a number');
  } else if (bounds.width <= 0) {
    errors.push('Bounds width must be positive');
  }

  if (!isNumber(bounds.height)) {
    errors.push('Bounds height must be a number');
  } else if (bounds.height <= 0) {
    errors.push('Bounds height must be positive');
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success(bounds as CanvasBounds);
}

/**
 * Validate JSON string and parse to {nodes, edges}
 */
export function validateJSON(
  json: string
): ValidationResult<{ nodes: CanvasNode[]; edges: ArchEdge[] }> {
  const errors: string[] = [];

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return failure([`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`]);
  }

  if (!isObject(parsed)) {
    return failure(['Parsed JSON must be an object']);
  }

  // Validate nodes array
  if (!Array.isArray(parsed.nodes)) {
    errors.push('nodes must be an array');
  } else {
    parsed.nodes.forEach((node, index) => {
      const result = validateNode(node);
      if (!result.success) {
        errors.push(`Node at index ${index}: ${result.errors.join(', ')}`);
      }
    });
  }

  // Validate edges array
  if (!Array.isArray(parsed.edges)) {
    errors.push('edges must be an array');
  } else {
    parsed.edges.forEach((edge, index) => {
      const result = validateEdge(edge);
      if (!result.success) {
        errors.push(`Edge at index ${index}: ${result.errors.join(', ')}`);
      }
    });
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success({
    nodes: parsed.nodes as CanvasNode[],
    edges: parsed.edges as ArchEdge[],
  });
}

/**
 * Validate that edge references point to existing nodes
 */
export function validateEdgeReferences(
  edges: ArchEdge[],
  nodes: CanvasNode[]
): ValidationResult<ArchEdge[]> {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  edges.forEach((edge, index) => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge at index ${index}: source node "${edge.source}" does not exist`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge at index ${index}: target node "${edge.target}" does not exist`);
    }
  });

  if (errors.length > 0) {
    return failure(errors);
  }

  return success(edges);
}
