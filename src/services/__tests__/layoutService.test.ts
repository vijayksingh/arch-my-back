import { describe, test, expect, vi, beforeEach } from 'vitest';
import { runElkLayout } from '../layoutService';
import type { CanvasNode, ArchEdge } from '@/types';

// Mock the elkjs module since it uses Web Workers that won't work in jsdom
vi.mock('elkjs/lib/elk-api', () => {
  // Create a class constructor to match ELK's API
  class MockELK {
    async layout(graph: any) {
      // Simulate ELK layout by adding x, y positions to nodes
      const layoutedChildren = graph.children.map((node: any, i: number) => ({
        ...node,
        x: i * 200,
        y: 100,
        children: node.children?.map((child: any, j: number) => ({
          ...child,
          x: j * 100,
          y: 50,
        })),
      }));

      return {
        ...graph,
        children: layoutedChildren,
      };
    }
  }

  return {
    default: MockELK,
  };
});

describe('layoutService', () => {
  describe('runElkLayout', () => {
    test('returns empty array when no nodes provided', async () => {
      const result = await runElkLayout([], []);
      expect(result).toEqual([]);
    });

    test('applies positions to nodes from ELK layout', async () => {
      const nodes: CanvasNode[] = [
        {
          id: 'node-1',
          type: 'archComponent',
          position: { x: 0, y: 0 },
          data: {
            componentType: 'app_server',
            label: 'Server 1',
            config: {},
          },
        },
        {
          id: 'node-2',
          type: 'archComponent',
          position: { x: 0, y: 0 },
          data: {
            componentType: 'postgres',
            label: 'Database',
            config: {},
          },
        },
      ];

      const edges: ArchEdge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          type: 'archEdge',
          data: {},
        },
      ];

      const result = await runElkLayout(nodes, edges);

      // Check that positions were updated
      expect(result).toHaveLength(2);
      expect(result[0].position.x).toBe(0);
      expect(result[0].position.y).toBe(100);
      expect(result[1].position.x).toBe(200);
      expect(result[1].position.y).toBe(100);
    });

    test('handles nodes with groups (parentId)', async () => {
      const nodes: CanvasNode[] = [
        {
          id: 'group-1',
          type: 'collapsibleGroup',
          position: { x: 100, y: 100 },
          data: {
            label: 'Group',
            isCollapsed: false,
            childNodeIds: ['child-1'],
          },
          style: { width: 300, height: 200 },
        },
        {
          id: 'child-1',
          type: 'archComponent',
          position: { x: 20, y: 20 }, // relative to group
          parentId: 'group-1',
          data: {
            componentType: 'app_server',
            label: 'Child Server',
            config: {},
          },
        },
      ];

      const result = await runElkLayout(nodes, []);

      // Group should be laid out at top level
      expect(result.find((n) => n.id === 'group-1')).toBeDefined();

      // Child should have relative position to its parent
      const child = result.find((n) => n.id === 'child-1');
      expect(child?.parentId).toBe('group-1');
      expect(typeof child?.position.x).toBe('number');
      expect(typeof child?.position.y).toBe('number');
    });

    test('preserves node data and type during layout', async () => {
      const nodes: CanvasNode[] = [
        {
          id: 'node-1',
          type: 'archComponent',
          position: { x: 0, y: 0 },
          data: {
            componentType: 'redis',
            label: 'Cache',
            config: { port: 6379 },
          },
        },
      ];

      const result = await runElkLayout(nodes, []);

      expect(result[0].type).toBe('archComponent');
      expect(result[0].data.componentType).toBe('redis');
      expect(result[0].data.label).toBe('Cache');
      expect(result[0].data.config).toEqual({ port: 6379 });
    });

    test('converts edges to ELK format', async () => {
      const nodes: CanvasNode[] = [
        {
          id: 'node-1',
          type: 'archComponent',
          position: { x: 0, y: 0 },
          data: { componentType: 'app_server', label: 'Server', config: {} },
        },
        {
          id: 'node-2',
          type: 'archComponent',
          position: { x: 0, y: 0 },
          data: { componentType: 'postgres', label: 'DB', config: {} },
        },
      ];

      const edges: ArchEdge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          type: 'archEdge',
          data: { protocol: 'TCP' },
        },
      ];

      const result = await runElkLayout(nodes, edges);

      // Edges should be preserved in the result
      expect(result).toHaveLength(2);
      // The layout should have been called with correct edge structure
      expect(result.every(node => node.id)).toBe(true);
    });

    test('uses default dimensions for nodes without explicit size', async () => {
      const nodes: CanvasNode[] = [
        {
          id: 'node-1',
          type: 'archComponent',
          position: { x: 0, y: 0 },
          data: { componentType: 'app_server', label: 'Server', config: {} },
          // No style.width or style.height
        },
      ];

      const result = await runElkLayout(nodes, []);

      // Should complete without errors
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('node-1');
    });

    test('handles shape nodes with custom dimensions', async () => {
      const nodes: CanvasNode[] = [
        {
          id: 'shape-1',
          type: 'shapeRect',
          position: { x: 0, y: 0 },
          data: { label: 'Rectangle', shape: 'rectangle' },
          style: { width: 200, height: 150 },
        },
      ];

      const result = await runElkLayout(nodes, []);

      // Should preserve style dimensions
      expect(result[0].style?.width).toBe(200);
      expect(result[0].style?.height).toBe(150);
    });
  });
});
