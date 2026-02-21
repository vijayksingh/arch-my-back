import { describe, it, expect } from 'vitest';
import { patchCanvasState } from '../canvasStatePatcher';
import type { ArchspecDocument } from '../archspecZodSchema';

describe('canvas state patcher (diff/patch algorithm)', () => {
  describe('first load (no previous state)', () => {
    it('initializes canvas with vertical stacking layout', () => {
      const doc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Simple',
        components: [
          { id: 'api', type: 'app_server', label: 'API' },
          { id: 'db', type: 'postgres', label: 'Database' },
        ],
        connections: [{ from: 'api', to: 'db' }],
      };

      const result = patchCanvasState(null, doc, { nodes: [], edges: [] });

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);

      // Check vertical stacking
      const apiNode = result.nodes.find((n) => n.id === 'api');
      const dbNode = result.nodes.find((n) => n.id === 'db');
      expect(apiNode?.position.y).toBeLessThan(dbNode?.position.y ?? 0);
    });

    it('converts all components to canvas nodes', () => {
      const doc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Multiple',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'redis', label: 'B' },
          { id: 'c', type: 'postgres', label: 'C' },
        ],
        connections: [],
      };

      const result = patchCanvasState(null, doc, { nodes: [], edges: [] });

      expect(result.nodes).toHaveLength(3);
      expect(result.nodes[0].type).toBe('archComponent');
      expect(result.nodes[0].data.componentType).toBeDefined();
      expect(result.nodes[0].data.label).toBeDefined();
    });

    it('converts groups to canvas nodes with isGroup flag', () => {
      const doc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Groups',
        components: [
          { id: 'api', type: 'app_server', label: 'API', group: 'backend' },
        ],
        groups: [{ id: 'backend', label: 'Backend Services', parent: null }],
        connections: [],
      };

      const result = patchCanvasState(null, doc, { nodes: [], edges: [] });

      expect(result.nodes).toHaveLength(2);

      const groupNode = result.nodes.find((n) => n.id === 'backend');
      expect(groupNode).toBeDefined();
      expect(groupNode?.type).toBe('group');
      expect(groupNode?.data.isGroup).toBe(true);
      expect(groupNode?.data.label).toBe('Backend Services');

      const apiNode = result.nodes.find((n) => n.id === 'api');
      expect(apiNode?.parentNode).toBe('backend');
    });

    it('converts connections to canvas edges', () => {
      const doc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Connections',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [
          { from: 'a', to: 'b', config: { protocol: 'TCP', port: 5432 } },
        ],
      };

      const result = patchCanvasState(null, doc, { nodes: [], edges: [] });

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('a');
      expect(result.edges[0].target).toBe('b');
      expect(result.edges[0].type).toBe('archEdge');
      expect(result.edges[0].data?.protocol).toBe('TCP');
      expect(result.edges[0].data?.port).toBe(5432);
    });
  });

  describe('preserving positions (unchanged nodes)', () => {
    it('preserves user-positioned nodes when DSL unchanged', () => {
      const oldDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Stable',
        components: [
          { id: 'api', type: 'app_server', label: 'API' },
          { id: 'db', type: 'postgres', label: 'DB' },
        ],
        connections: [{ from: 'api', to: 'db' }],
      };

      const oldCanvas = {
        nodes: [
          {
            id: 'api',
            type: 'archComponent',
            position: { x: 200, y: 300 }, // User-positioned
            data: { componentType: 'app_server', label: 'API', config: {} },
          },
          {
            id: 'db',
            type: 'archComponent',
            position: { x: 500, y: 400 }, // User-positioned
            data: { componentType: 'postgres', label: 'DB', config: {} },
          },
        ],
        edges: [{ id: 'api-db', source: 'api', target: 'db', type: 'archEdge' }],
      };

      const newDoc = { ...oldDoc }; // No changes

      const result = patchCanvasState(oldDoc, newDoc, oldCanvas);

      const apiNode = result.nodes.find((n) => n.id === 'api');
      const dbNode = result.nodes.find((n) => n.id === 'db');

      expect(apiNode?.position).toEqual({ x: 200, y: 300 });
      expect(dbNode?.position).toEqual({ x: 500, y: 400 });
    });

    it('updates node data when component config changes but preserves position', () => {
      const oldDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Update',
        components: [
          {
            id: 'api',
            type: 'app_server',
            label: 'API',
            config: { replicas: 1 },
          },
        ],
        connections: [],
      };

      const oldCanvas = {
        nodes: [
          {
            id: 'api',
            type: 'archComponent',
            position: { x: 100, y: 200 },
            data: { componentType: 'app_server', label: 'API', config: { replicas: 1 } },
          },
        ],
        edges: [],
      };

      const newDoc: ArchspecDocument = {
        ...oldDoc,
        components: [
          {
            id: 'api',
            type: 'app_server',
            label: 'API',
            config: { replicas: 3 }, // Config changed
          },
        ],
      };

      const result = patchCanvasState(oldDoc, newDoc, oldCanvas);

      const apiNode = result.nodes.find((n) => n.id === 'api');
      expect(apiNode?.position).toEqual({ x: 100, y: 200 }); // Position preserved
      expect(apiNode?.data.config.replicas).toBe(3); // Data updated
    });
  });

  describe('adding new nodes', () => {
    it('places new component below existing nodes', () => {
      const oldDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Before',
        components: [{ id: 'api', type: 'app_server', label: 'API' }],
        connections: [],
      };

      const oldCanvas = {
        nodes: [
          {
            id: 'api',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: { componentType: 'app_server', label: 'API', config: {} },
          },
        ],
        edges: [],
      };

      const newDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'After',
        components: [
          { id: 'api', type: 'app_server', label: 'API' },
          { id: 'db', type: 'postgres', label: 'DB' }, // New component
        ],
        connections: [],
      };

      const result = patchCanvasState(oldDoc, newDoc, oldCanvas);

      const apiNode = result.nodes.find((n) => n.id === 'api');
      const dbNode = result.nodes.find((n) => n.id === 'db');

      expect(apiNode?.position).toEqual({ x: 100, y: 100 }); // Unchanged
      expect(dbNode?.position.y).toBeGreaterThan(apiNode?.position.y ?? 0); // Placed below
    });

    it('places new component near group siblings', () => {
      const oldDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Before',
        components: [
          { id: 'api1', type: 'app_server', label: 'API 1', group: 'backend' },
        ],
        groups: [{ id: 'backend', label: 'Backend', parent: null }],
        connections: [],
      };

      const oldCanvas = {
        nodes: [
          {
            id: 'backend',
            type: 'group',
            position: { x: 50, y: 50 },
            data: { label: 'Backend', isGroup: true },
          },
          {
            id: 'api1',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: { componentType: 'app_server', label: 'API 1', config: {} },
            parentNode: 'backend',
          },
        ],
        edges: [],
      };

      const newDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'After',
        components: [
          { id: 'api1', type: 'app_server', label: 'API 1', group: 'backend' },
          { id: 'api2', type: 'app_server', label: 'API 2', group: 'backend' }, // New sibling
        ],
        groups: [{ id: 'backend', label: 'Backend', parent: null }],
        connections: [],
      };

      const result = patchCanvasState(oldDoc, newDoc, oldCanvas);

      const api1Node = result.nodes.find((n) => n.id === 'api1');
      const api2Node = result.nodes.find((n) => n.id === 'api2');

      expect(api1Node?.position).toEqual({ x: 100, y: 100 }); // Unchanged
      expect(api2Node?.position.x).toBeGreaterThan(api1Node?.position.x ?? 0); // To the right
      expect(api2Node?.parentNode).toBe('backend');
    });

    it('adds new edges when connections added', () => {
      const oldDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Before',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [],
      };

      const oldCanvas = {
        nodes: [
          {
            id: 'a',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: { componentType: 'app_server', label: 'A', config: {} },
          },
          {
            id: 'b',
            type: 'archComponent',
            position: { x: 300, y: 100 },
            data: { componentType: 'postgres', label: 'B', config: {} },
          },
        ],
        edges: [],
      };

      const newDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'After',
        components: oldDoc.components,
        connections: [{ from: 'a', to: 'b' }], // New connection
      };

      const result = patchCanvasState(oldDoc, newDoc, oldCanvas);

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('a');
      expect(result.edges[0].target).toBe('b');
    });
  });

  describe('deleting nodes', () => {
    it('removes deleted components from canvas', () => {
      const oldDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Before',
        components: [
          { id: 'api', type: 'app_server', label: 'API' },
          { id: 'db', type: 'postgres', label: 'DB' },
        ],
        connections: [{ from: 'api', to: 'db' }],
      };

      const oldCanvas = {
        nodes: [
          {
            id: 'api',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: { componentType: 'app_server', label: 'API', config: {} },
          },
          {
            id: 'db',
            type: 'archComponent',
            position: { x: 300, y: 100 },
            data: { componentType: 'postgres', label: 'DB', config: {} },
          },
        ],
        edges: [{ id: 'api-db', source: 'api', target: 'db', type: 'archEdge' }],
      };

      const newDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'After',
        components: [{ id: 'api', type: 'app_server', label: 'API' }], // db deleted
        connections: [],
      };

      const result = patchCanvasState(oldDoc, newDoc, oldCanvas);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('api');
      expect(result.nodes.find((n) => n.id === 'db')).toBeUndefined();
    });

    it('removes deleted edges from canvas', () => {
      const oldDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Before',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [{ from: 'a', to: 'b' }],
      };

      const oldCanvas = {
        nodes: [
          {
            id: 'a',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: { componentType: 'app_server', label: 'A', config: {} },
          },
          {
            id: 'b',
            type: 'archComponent',
            position: { x: 300, y: 100 },
            data: { componentType: 'postgres', label: 'B', config: {} },
          },
        ],
        edges: [{ id: 'a-b', source: 'a', target: 'b', type: 'archEdge' }],
      };

      const newDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'After',
        components: oldDoc.components,
        connections: [], // Connection deleted
      };

      const result = patchCanvasState(oldDoc, newDoc, oldCanvas);

      expect(result.edges).toHaveLength(0);
    });
  });

  describe('empty document handling', () => {
    it('returns empty canvas when document has no components', () => {
      const oldDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Before',
        components: [{ id: 'api', type: 'app_server', label: 'API' }],
        connections: [],
      };

      const oldCanvas = {
        nodes: [
          {
            id: 'api',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: { componentType: 'app_server', label: 'API', config: {} },
          },
        ],
        edges: [],
      };

      const newDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Empty',
        components: [], // All deleted
        connections: [],
      };

      const result = patchCanvasState(oldDoc, newDoc, oldCanvas);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });
  });

  describe('rename detection', () => {
    it('preserves position when component ID changes but type+label match', () => {
      const oldDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'Before',
        components: [
          { id: 'old_api', type: 'app_server', label: 'API Server' },
        ],
        connections: [],
      };

      const oldCanvas = {
        nodes: [
          {
            id: 'old_api',
            type: 'archComponent',
            position: { x: 200, y: 300 },
            data: { componentType: 'app_server', label: 'API Server', config: {} },
          },
        ],
        edges: [],
      };

      const newDoc: ArchspecDocument = {
        archspec_version: '1.0',
        name: 'After',
        components: [
          { id: 'new_api', type: 'app_server', label: 'API Server' }, // ID changed but type+label same
        ],
        connections: [],
      };

      const result = patchCanvasState(oldDoc, newDoc, oldCanvas);

      const newApiNode = result.nodes.find((n) => n.id === 'new_api');
      expect(newApiNode).toBeDefined();
      expect(newApiNode?.position).toEqual({ x: 200, y: 300 }); // Position preserved from old_api
    });
  });
});
