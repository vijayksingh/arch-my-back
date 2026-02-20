import { describe, it, expect } from 'vitest';
import { validateArchspec } from '../validator';

describe('archspec validator', () => {
  describe('valid inputs', () => {
    it('validates minimal AI profile (2 components, 1 connection, no groups)', () => {
      const minimalSpec = {
        archspec_version: '1.0',
        name: 'URL Shortener',
        components: [
          { id: 'api', type: 'app_server', label: 'API' },
          { id: 'db', type: 'postgres', label: 'Database' },
        ],
        connections: [{ from: 'api', to: 'db' }],
      };

      const result = validateArchspec(minimalSpec);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('URL Shortener');
        expect(result.data.components).toHaveLength(2);
        expect(result.data.connections).toHaveLength(1);
        expect(result.data.groups).toBeUndefined();
      }
    });

    it('validates full E-Commerce Platform example', () => {
      const fullSpec = {
        archspec_version: '1.0',
        name: 'E-Commerce Platform',
        components: [
          { id: 'cdn', type: 'cdn', label: 'CloudFront', group: 'edge', config: {} },
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
            config: { replicas: 2, profile: 'standard-oltp' },
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

      const result = validateArchspec(fullSpec);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('E-Commerce Platform');
        expect(result.data.components).toHaveLength(3);
        expect(result.data.groups).toHaveLength(3);
        expect(result.data.connections).toHaveLength(2);
      }
    });

    it('validates all component types from registry', () => {
      const allTypesSpec = {
        archspec_version: '1.0',
        name: 'All Component Types',
        components: [
          { id: 'lb', type: 'load_balancer', label: 'Load Balancer' },
          { id: 'gw', type: 'api_gateway', label: 'API Gateway' },
          { id: 'cdn', type: 'cdn', label: 'CDN' },
          { id: 'app', type: 'app_server', label: 'App Server' },
          { id: 'worker', type: 'worker', label: 'Worker' },
          { id: 'fn', type: 'serverless', label: 'Serverless' },
          { id: 'pg', type: 'postgres', label: 'Postgres' },
          { id: 's3', type: 'object_storage', label: 'Object Storage' },
          { id: 'redis', type: 'redis', label: 'Redis' },
          { id: 'kafka', type: 'kafka', label: 'Kafka' },
          { id: 'ws', type: 'websocket', label: 'WebSocket' },
          { id: 'ext', type: 'external_api', label: 'External API' },
        ],
        connections: [],
      };

      const result = validateArchspec(allTypesSpec);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects missing required fields', () => {
      const invalidSpec = {
        archspec_version: '1.0',
        // missing name
        components: [],
        connections: [],
      };

      const result = validateArchspec(invalidSpec);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].path).toEqual(['name']);
        expect(result.errors[0].message).toContain('expected string');
      }
    });

    it('rejects wrong types', () => {
      const invalidSpec = {
        archspec_version: '1.0',
        name: 'Test',
        components: 'not-an-array', // should be array
        connections: [],
      };

      const result = validateArchspec(invalidSpec);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].path).toEqual(['components']);
      }
    });

    it('rejects unknown component types', () => {
      const invalidSpec = {
        archspec_version: '1.0',
        name: 'Test',
        components: [{ id: 'x', type: 'invalid_type', label: 'Invalid' }],
        connections: [],
      };

      const result = validateArchspec(invalidSpec);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].path).toEqual(['components', 0, 'type']);
        expect(result.errors[0].message).toContain('Invalid option');
      }
    });

    it('rejects invalid connection mode', () => {
      const invalidSpec = {
        archspec_version: '1.0',
        name: 'Test',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [{ from: 'a', to: 'b', config: { mode: 'invalid' } }],
      };

      const result = validateArchspec(invalidSpec);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toEqual(['connections', 0, 'config', 'mode']);
      }
    });

    it('rejects negative fanOut', () => {
      const invalidSpec = {
        archspec_version: '1.0',
        name: 'Test',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [{ from: 'a', to: 'b', config: { fanOut: -0.5 } }],
      };

      const result = validateArchspec(invalidSpec);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toEqual(['connections', 0, 'config', 'fanOut']);
        expect(result.errors[0].message).toContain('expected number to be >=0');
      }
    });
  });
});
