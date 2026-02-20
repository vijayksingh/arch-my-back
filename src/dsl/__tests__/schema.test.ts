import { describe, it, expect } from 'vitest';
import { ArchspecDocumentSchema } from '../archspecZodSchema';

describe('archspec Zod schema validation', () => {
  describe('valid archspec documents', () => {
    it('validates minimal AI profile (2 components, 1 connection, no groups)', () => {
      const minimalDoc = {
        archspec_version: '1.0',
        name: 'URL Shortener',
        components: [
          { id: 'api', type: 'app_server', label: 'API' },
          { id: 'db', type: 'postgres', label: 'Database' },
        ],
        connections: [{ from: 'api', to: 'db' }],
      };

      const result = ArchspecDocumentSchema.safeParse(minimalDoc);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('URL Shortener');
        expect(result.data.components).toHaveLength(2);
        expect(result.data.groups).toBeUndefined();
      }
    });

    it('validates full profile with groups and nested config', () => {
      const fullDoc = {
        archspec_version: '1.0',
        name: 'E-Commerce Platform',
        components: [
          {
            id: 'cdn',
            type: 'cdn',
            label: 'CloudFront',
            group: 'edge',
            config: { provider: 'aws' },
          },
          {
            id: 'api',
            type: 'app_server',
            label: 'Product API',
            group: 'compute',
            config: { runtime: 'node:20', replicas: 3 },
          },
          {
            id: 'pg',
            type: 'postgres',
            label: 'Products DB',
            group: 'storage',
            config: { storage: '500GB' },
          },
        ],
        groups: [
          { id: 'edge', label: 'Edge Layer', parent: null },
          { id: 'compute', label: 'Compute', parent: null },
          { id: 'storage', label: 'Data Layer', parent: null },
        ],
        connections: [
          { from: 'cdn', to: 'api', config: { protocol: 'HTTPS' } },
          {
            from: 'api',
            to: 'pg',
            config: { protocol: 'TCP', port: 5432, mode: 'sync', fanOut: 0.2 },
          },
        ],
      };

      const result = ArchspecDocumentSchema.safeParse(fullDoc);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.components).toHaveLength(3);
        expect(result.data.groups).toHaveLength(3);
        expect(result.data.connections).toHaveLength(2);
      }
    });

    it('validates all valid component types', () => {
      const doc = {
        archspec_version: '1.0',
        name: 'All Types',
        components: [
          { id: 'lb', type: 'load_balancer', label: 'LB' },
          { id: 'gw', type: 'api_gateway', label: 'Gateway' },
          { id: 'cdn', type: 'cdn', label: 'CDN' },
          { id: 'app', type: 'app_server', label: 'App' },
          { id: 'worker', type: 'worker', label: 'Worker' },
          { id: 'fn', type: 'serverless', label: 'Function' },
          { id: 'pg', type: 'postgres', label: 'Postgres' },
          { id: 's3', type: 'object_storage', label: 'S3' },
          { id: 'redis', type: 'redis', label: 'Redis' },
          { id: 'kafka', type: 'kafka', label: 'Kafka' },
          { id: 'ws', type: 'websocket', label: 'WebSocket' },
          { id: 'ext', type: 'external_api', label: 'External' },
        ],
        connections: [],
      };

      const result = ArchspecDocumentSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it('validates connection config with all optional fields', () => {
      const doc = {
        archspec_version: '1.0',
        name: 'Connection Config',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [
          {
            from: 'a',
            to: 'b',
            config: {
              protocol: 'TCP',
              port: 5432,
              mode: 'sync',
              fanOut: 1.5,
              label: 'Database Connection',
            },
          },
        ],
      };

      const result = ArchspecDocumentSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it('validates nested groups (parent-child relationship)', () => {
      const doc = {
        archspec_version: '1.0',
        name: 'Nested Groups',
        components: [
          { id: 'api', type: 'app_server', label: 'API', group: 'backend' },
        ],
        groups: [
          { id: 'infra', label: 'Infrastructure', parent: null },
          { id: 'backend', label: 'Backend Services', parent: 'infra' },
        ],
        connections: [],
      };

      const result = ArchspecDocumentSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid archspec documents', () => {
    it('rejects missing required field: name', () => {
      const invalidDoc = {
        archspec_version: '1.0',
        // missing name
        components: [],
        connections: [],
      };

      const result = ArchspecDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((e) => e.path[0] === 'name');
        expect(nameError).toBeDefined();
        expect(nameError?.code).toBe('invalid_type');
      }
    });

    it('rejects missing required field: archspec_version', () => {
      const invalidDoc = {
        name: 'Test',
        components: [],
        connections: [],
      };

      const result = ArchspecDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
      if (!result.success) {
        const versionError = result.error.issues.find(
          (e) => e.path[0] === 'archspec_version'
        );
        expect(versionError).toBeDefined();
      }
    });

    it('rejects missing required field: components', () => {
      const invalidDoc = {
        archspec_version: '1.0',
        name: 'Test',
        connections: [],
      };

      const result = ArchspecDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
      if (!result.success) {
        const componentsError = result.error.issues.find(
          (e) => e.path[0] === 'components'
        );
        expect(componentsError).toBeDefined();
      }
    });

    it('rejects wrong type for components (not array)', () => {
      const invalidDoc = {
        archspec_version: '1.0',
        name: 'Test',
        components: 'not-an-array',
        connections: [],
      };

      const result = ArchspecDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['components']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('rejects unknown component type', () => {
      const invalidDoc = {
        archspec_version: '1.0',
        name: 'Test',
        components: [{ id: 'x', type: 'unknown_type', label: 'Unknown' }],
        connections: [],
      };

      const result = ArchspecDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
      if (!result.success) {
        const typeError = result.error.issues.find(
          (e) => e.path[0] === 'components' && e.path[2] === 'type'
        );
        expect(typeError).toBeDefined();
        expect(typeError?.code).toBe('invalid_value'); // Zod v3.24+ uses 'invalid_value' for enums
      }
    });

    it('rejects component with missing id', () => {
      const invalidDoc = {
        archspec_version: '1.0',
        name: 'Test',
        components: [{ type: 'app_server', label: 'API' }],
        connections: [],
      };

      const result = ArchspecDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
      if (!result.success) {
        const idError = result.error.issues.find(
          (e) => e.path[0] === 'components' && e.path[2] === 'id'
        );
        expect(idError).toBeDefined();
      }
    });

    it('rejects connection with invalid mode', () => {
      const invalidDoc = {
        archspec_version: '1.0',
        name: 'Test',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [{ from: 'a', to: 'b', config: { mode: 'invalid' } }],
      };

      const result = ArchspecDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
      if (!result.success) {
        const modeError = result.error.issues.find(
          (e) =>
            e.path[0] === 'connections' &&
            e.path[2] === 'config' &&
            e.path[3] === 'mode'
        );
        expect(modeError).toBeDefined();
        expect(modeError?.code).toBe('invalid_value'); // Zod v3.24+ uses 'invalid_value' for enums
      }
    });

    it('rejects negative fanOut', () => {
      const invalidDoc = {
        archspec_version: '1.0',
        name: 'Test',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [{ from: 'a', to: 'b', config: { fanOut: -0.5 } }],
      };

      const result = ArchspecDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fanOutError = result.error.issues.find(
          (e) =>
            e.path[0] === 'connections' &&
            e.path[2] === 'config' &&
            e.path[3] === 'fanOut'
        );
        expect(fanOutError).toBeDefined();
        expect(fanOutError?.code).toBe('too_small');
      }
    });

    it('rejects connection with missing from field', () => {
      const invalidDoc = {
        archspec_version: '1.0',
        name: 'Test',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [{ to: 'b' }],
      };

      const result = ArchspecDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fromError = result.error.issues.find(
          (e) => e.path[0] === 'connections' && e.path[2] === 'from'
        );
        expect(fromError).toBeDefined();
      }
    });
  });
});
