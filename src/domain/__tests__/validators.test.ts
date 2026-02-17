import { describe, it, expect } from 'vitest';
import {
  validateNode,
  validateEdge,
  validateBounds,
  validateJSON,
  validateEdgeReferences,
} from '../validators';
import type { CanvasNode, ArchEdge, CanvasBounds } from '@/types';

describe('validateNode', () => {
  it('should validate a valid ArchNode', () => {
    const validNode: CanvasNode = {
      id: 'node_1',
      type: 'archComponent',
      position: { x: 100, y: 200 },
      data: {
        componentType: 'loadBalancer',
        label: 'Load Balancer',
        config: {},
      },
    };

    const result = validateNode(validNode);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validNode);
    }
  });

  it('should validate a valid ShapeNode', () => {
    const validNode: CanvasNode = {
      id: 'node_2',
      type: 'shapeRect',
      position: { x: 50, y: 100 },
      data: {
        label: 'Rectangle',
        shape: 'rectangle',
      },
    };

    const result = validateNode(validNode);
    expect(result.success).toBe(true);
  });

  it('should fail when node is not an object', () => {
    const result = validateNode('not an object');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Node must be an object');
    }
  });

  it('should fail when id is missing', () => {
    const invalidNode = {
      type: 'archComponent',
      position: { x: 100, y: 200 },
      data: { componentType: 'api', label: 'API', config: {} },
    };

    const result = validateNode(invalidNode);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Node ID must be a non-empty string');
    }
  });

  it('should fail when position is invalid', () => {
    const invalidNode = {
      id: 'node_1',
      type: 'archComponent',
      position: { x: 'invalid', y: 200 },
      data: { componentType: 'api', label: 'API', config: {} },
    };

    const result = validateNode(invalidNode);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Node position.x must be a number');
    }
  });

  it('should fail when component type does not exist in registry', () => {
    const invalidNode: CanvasNode = {
      id: 'node_1',
      type: 'archComponent',
      position: { x: 100, y: 200 },
      data: {
        componentType: 'nonexistentType',
        label: 'Invalid',
        config: {},
      },
    };

    const result = validateNode(invalidNode);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('does not exist in registry'))).toBe(true);
    }
  });

  it('should fail when shape is invalid', () => {
    const invalidNode = {
      id: 'node_2',
      type: 'shapeRect',
      position: { x: 50, y: 100 },
      data: {
        label: 'Rectangle',
        shape: 'invalid-shape',
      },
    };

    const result = validateNode(invalidNode);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('must be one of'))).toBe(true);
    }
  });
});

describe('validateEdge', () => {
  it('should validate a valid edge', () => {
    const validEdge: ArchEdge = {
      id: 'edge_1',
      source: 'node_1',
      target: 'node_2',
      type: 'archEdge',
      data: { protocol: 'HTTPS' },
    };

    const result = validateEdge(validEdge);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validEdge);
    }
  });

  it('should validate edge without data', () => {
    const validEdge = {
      id: 'edge_1',
      source: 'node_1',
      target: 'node_2',
    };

    const result = validateEdge(validEdge);
    expect(result.success).toBe(true);
  });

  it('should fail when edge is not an object', () => {
    const result = validateEdge(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Edge must be an object');
    }
  });

  it('should fail when source is missing', () => {
    const invalidEdge = {
      id: 'edge_1',
      target: 'node_2',
    };

    const result = validateEdge(invalidEdge);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Edge source must be a non-empty string');
    }
  });

  it('should fail when data is not an object', () => {
    const invalidEdge = {
      id: 'edge_1',
      source: 'node_1',
      target: 'node_2',
      data: 'invalid',
    };

    const result = validateEdge(invalidEdge);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Edge data must be an object if provided');
    }
  });
});

describe('validateBounds', () => {
  it('should validate valid bounds', () => {
    const validBounds: CanvasBounds = {
      x: 100,
      y: 200,
      width: 300,
      height: 400,
    };

    const result = validateBounds(validBounds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validBounds);
    }
  });

  it('should fail when bounds is not an object', () => {
    const result = validateBounds([100, 200, 300, 400]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Bounds must be an object');
    }
  });

  it('should fail when width is not a number', () => {
    const invalidBounds = {
      x: 100,
      y: 200,
      width: 'invalid',
      height: 400,
    };

    const result = validateBounds(invalidBounds);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Bounds width must be a number');
    }
  });

  it('should fail when width is not positive', () => {
    const invalidBounds = {
      x: 100,
      y: 200,
      width: -10,
      height: 400,
    };

    const result = validateBounds(invalidBounds);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Bounds width must be positive');
    }
  });

  it('should fail when height is zero', () => {
    const invalidBounds = {
      x: 100,
      y: 200,
      width: 300,
      height: 0,
    };

    const result = validateBounds(invalidBounds);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Bounds height must be positive');
    }
  });
});

describe('validateJSON', () => {
  it('should validate valid JSON with nodes and edges', () => {
    const validJSON = JSON.stringify({
      nodes: [
        {
          id: 'node_1',
          type: 'archComponent',
          position: { x: 100, y: 200 },
          data: { componentType: 'loadBalancer', label: 'LB', config: {} },
        },
      ],
      edges: [
        {
          id: 'edge_1',
          source: 'node_1',
          target: 'node_2',
        },
      ],
    });

    const result = validateJSON(validJSON);
    expect(result.success).toBe(true);
  });

  it('should fail with invalid JSON string', () => {
    const result = validateJSON('{ invalid json }');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('Invalid JSON');
    }
  });

  it('should fail when nodes is not an array', () => {
    const invalidJSON = JSON.stringify({
      nodes: 'not an array',
      edges: [],
    });

    const result = validateJSON(invalidJSON);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('nodes must be an array');
    }
  });

  it('should fail when edges array contains invalid edge', () => {
    const invalidJSON = JSON.stringify({
      nodes: [],
      edges: [{ id: 'edge_1' }], // missing source and target
    });

    const result = validateJSON(invalidJSON);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('Edge at index 0'))).toBe(true);
    }
  });
});

describe('validateEdgeReferences', () => {
  it('should validate edges with valid node references', () => {
    const nodes: CanvasNode[] = [
      {
        id: 'node_1',
        type: 'archComponent',
        position: { x: 0, y: 0 },
        data: { componentType: 'loadBalancer', label: 'LB', config: {} },
      },
      {
        id: 'node_2',
        type: 'archComponent',
        position: { x: 100, y: 0 },
        data: { componentType: 'api', label: 'API', config: {} },
      },
    ];

    const edges: ArchEdge[] = [
      {
        id: 'edge_1',
        source: 'node_1',
        target: 'node_2',
        type: 'archEdge',
      },
    ];

    const result = validateEdgeReferences(edges, nodes);
    expect(result.success).toBe(true);
  });

  it('should fail when edge source does not exist', () => {
    const nodes: CanvasNode[] = [
      {
        id: 'node_2',
        type: 'archComponent',
        position: { x: 100, y: 0 },
        data: { componentType: 'api', label: 'API', config: {} },
      },
    ];

    const edges: ArchEdge[] = [
      {
        id: 'edge_1',
        source: 'nonexistent',
        target: 'node_2',
        type: 'archEdge',
      },
    ];

    const result = validateEdgeReferences(edges, nodes);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('source node'))).toBe(true);
    }
  });

  it('should fail when edge target does not exist', () => {
    const nodes: CanvasNode[] = [
      {
        id: 'node_1',
        type: 'archComponent',
        position: { x: 0, y: 0 },
        data: { componentType: 'loadBalancer', label: 'LB', config: {} },
      },
    ];

    const edges: ArchEdge[] = [
      {
        id: 'edge_1',
        source: 'node_1',
        target: 'nonexistent',
        type: 'archEdge',
      },
    ];

    const result = validateEdgeReferences(edges, nodes);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('target node'))).toBe(true);
    }
  });
});
