import { describe, it, expect } from 'vitest';
import { deserialize } from '../deserializer';
import { serialize } from '../serializer';

describe('archspec DSL ↔ JSON roundtrip', () => {
  describe('DSL → JSON deserialization', () => {
    it('deserializes minimal architecture', () => {
      const dsl = `archspec v1

architecture "URL Shortener" {
  api = app_server "API" {}
  db = postgres "Database" {}
  api -> db
}`;

      const result = deserialize(dsl);
      expect(result.success).toBe(true);
      expect(result.diagnostics).toHaveLength(0);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.name).toBe('URL Shortener');
        expect(result.data.components).toHaveLength(2);
        expect(result.data.connections).toHaveLength(1);
      }
    });

    it('deserializes architecture with groups and connections', () => {
      const dsl = `archspec v1

architecture "E-Commerce" {
  edge = group "Edge" {
    gateway = api_gateway "Gateway" {}
  }

  compute = group "Compute" {
    api = app_server "API" {}
  }

  storage = group "Data" {
    db = postgres "DB" {}
  }

  gateway -> api
  api -> db
}`;

      const result = deserialize(dsl);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.name).toBe('E-Commerce');
        expect(result.data.components).toHaveLength(3);
        expect(result.data.groups).toHaveLength(3);
        expect(result.data.connections).toHaveLength(2);

        // Check component grouping
        const apiComponent = result.data.components.find((c) => c.id === 'api');
        expect(apiComponent?.group).toBe('compute');
      }
    });

    it('deserializes connection chains into individual connections', () => {
      const dsl = `archspec v1

architecture "Chain" {
  a = app_server "A" {}
  b = cache "B" {}
  c = postgres "C" {}

  a -> b -> c
}`;

      const result = deserialize(dsl);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.connections).toHaveLength(2);
        expect(result.data.connections[0]).toMatchObject({ from: 'a', to: 'b' });
        expect(result.data.connections[1]).toMatchObject({ from: 'b', to: 'c' });
      }
    });

    it('deserializes bidirectional connection operator', () => {
      const dsl = `archspec v1

architecture "Bidirectional" {
  a = app_server "A" {}
  b = cache "B" {}

  a <-> b
}`;

      const result = deserialize(dsl);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.connections).toHaveLength(2);
        expect(result.data.connections[0]).toMatchObject({ from: 'a', to: 'b' });
        expect(result.data.connections[1]).toMatchObject({ from: 'b', to: 'a' });
      }
    });

    it('deserializes component config with multiple property types', () => {
      const dsl = `archspec v1

architecture "Properties" {
  api = app_server "API" {
    str: "hello"
    num: 42
    bool: true
    nullVal: null
  }
}`;

      const result = deserialize(dsl);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        const api = result.data.components[0];
        expect(api.config).toMatchObject({
          str: 'hello',
          num: 42,
          bool: true,
          nullVal: null,
        });
      }
    });

    it('reports syntax errors with diagnostics', () => {
      const dsl = `archspec v1

architecture "Broken" {
  api = app_server "API"
  // Missing closing brace
`;

      const result = deserialize(dsl);
      expect(result.success).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.diagnostics[0].severity).toBe('error');
    });
  });

  describe('JSON → DSL serialization', () => {
    it('serializes minimal architecture', () => {
      const doc = {
        archspec_version: '1.0',
        name: 'URL Shortener',
        components: [
          { id: 'api', type: 'app_server', label: 'API' },
          { id: 'db', type: 'postgres', label: 'Database' },
        ],
        connections: [{ from: 'api', to: 'db' }],
      };

      const dsl = serialize(doc);
      expect(dsl).toContain('archspec v1');
      expect(dsl).toContain('architecture "URL Shortener"');
      expect(dsl).toContain('api = app_server "API" {}');
      expect(dsl).toContain('db = postgres "Database" {}');
      expect(dsl).toContain('api -> db');
    });

    it('serializes architecture with groups', () => {
      const doc = {
        archspec_version: '1.0',
        name: 'With Groups',
        components: [
          { id: 'api', type: 'app_server', label: 'API', group: 'compute' },
        ],
        groups: [{ id: 'compute', label: 'Compute Layer', parent: null }],
        connections: [],
      };

      const dsl = serialize(doc);
      expect(dsl).toContain('compute = group "Compute Layer"');
      expect(dsl).toContain('api = app_server "API" {}');
    });

    it('serializes component config properties', () => {
      const doc = {
        archspec_version: '1.0',
        name: 'Config',
        components: [
          {
            id: 'api',
            type: 'app_server',
            label: 'API',
            config: { runtime: 'node:20', replicas: 3 },
          },
        ],
        connections: [],
      };

      const dsl = serialize(doc);
      expect(dsl).toContain('runtime: "node:20"');
      expect(dsl).toContain('replicas: 3');
    });

    it('serializes connection config', () => {
      const doc = {
        archspec_version: '1.0',
        name: 'Connection Config',
        components: [
          { id: 'a', type: 'app_server', label: 'A' },
          { id: 'b', type: 'postgres', label: 'B' },
        ],
        connections: [
          { from: 'a', to: 'b', config: { protocol: 'TCP', port: 5432 } },
        ],
      };

      const dsl = serialize(doc);
      expect(dsl).toContain('a -> b {');
      expect(dsl).toContain('protocol: "TCP"');
      expect(dsl).toContain('port: 5432');
    });

    it('maps JSON component types to DSL types', () => {
      const doc = {
        archspec_version: '1.0',
        name: 'Type Mapping',
        components: [
          { id: 'c1', type: 'redis', label: 'Cache' },
          { id: 'c2', type: 'kafka', label: 'Stream' },
        ],
        connections: [],
      };

      const dsl = serialize(doc);
      expect(dsl).toContain('c1 = cache "Cache"'); // redis → cache
      expect(dsl).toContain('c2 = event_stream "Stream"'); // kafka → event_stream
    });
  });

  describe('roundtrip equivalence (DSL → JSON → DSL)', () => {
    it('produces equivalent output for minimal architecture', () => {
      const originalDsl = `archspec v1

architecture "Simple" {
  api = app_server "API" {}
  db = postgres "DB" {}
  api -> db
}`;

      const result = deserialize(originalDsl);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        const regeneratedDsl = serialize(result.data);
        const result2 = deserialize(regeneratedDsl);

        expect(result2.success).toBe(true);
        expect(result2.data).toBeDefined();

        if (result2.data) {
          // Compare normalized JSON
          expect(result2.data.name).toBe(result.data.name);
          expect(result2.data.components).toHaveLength(
            result.data.components.length
          );
          expect(result2.data.connections).toHaveLength(
            result.data.connections.length
          );
        }
      }
    });

    it('preserves component groups through roundtrip', () => {
      const originalDsl = `archspec v1

architecture "Groups" {
  backend = group "Backend" {
    api = app_server "API" {}
  }
}`;

      const result = deserialize(originalDsl);
      expect(result.success).toBe(true);

      if (result.data) {
        const regeneratedDsl = serialize(result.data);
        const result2 = deserialize(regeneratedDsl);

        expect(result2.success).toBe(true);
        if (result2.data) {
          const api = result2.data.components.find((c) => c.id === 'api');
          expect(api?.group).toBe('backend');
        }
      }
    });
  });
});
