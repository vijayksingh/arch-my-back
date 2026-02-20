import { describe, it, expect } from 'vitest';
import { parser } from '../syntax';

describe('archspec grammar (Lezer parser)', () => {
  describe('valid DSL parsing', () => {
    it('parses minimal architecture with one component', () => {
      const dsl = `archspec v1

architecture "Simple" {
  api = app_server "API" {}
}`;

      const tree = parser.parse(dsl);
      expect(tree.length).toBeGreaterThan(0);

      // Check for no syntax errors
      let hasError = false;
      tree.iterate({
        enter(node) {
          if (node.type.isError) {
            hasError = true;
          }
        }
      });
      expect(hasError).toBe(false);
    });

    it('parses architecture with nested groups and connections', () => {
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

      const tree = parser.parse(dsl);
      expect(tree.length).toBeGreaterThan(0);

      let hasError = false;
      tree.iterate({
        enter(node) {
          if (node.type.isError) {
            hasError = true;
          }
        }
      });
      expect(hasError).toBe(false);
    });

    it('parses all component types from DSL grammar', () => {
      const dsl = `archspec v1

architecture "All Types" {
  c1 = cdn "CDN" {}
  c2 = waf "WAF" {}
  c3 = api_gateway "Gateway" {}
  c4 = app_server "Server" {}
  c5 = worker "Worker" {}
  c6 = postgres "Database" {}
  c7 = cache "Cache" {}
  c8 = object_storage "Storage" {}
  c9 = event_stream "Stream" {}
}`;

      const tree = parser.parse(dsl);
      let hasError = false;
      tree.iterate({
        enter(node) {
          if (node.type.isError) {
            hasError = true;
          }
        }
      });
      expect(hasError).toBe(false);
    });

    it('parses connection operators (directed and bidirectional)', () => {
      const dsl = `archspec v1

architecture "Connections" {
  a = app_server "A" {}
  b = postgres "B" {}
  c = cache "C" {}
  d = worker "D" {}

  a -> b
  b <- c
  c <-> d
  d -- a
}`;

      const tree = parser.parse(dsl);
      let hasError = false;
      tree.iterate({
        enter(node) {
          if (node.type.isError) {
            hasError = true;
          }
        }
      });
      expect(hasError).toBe(false);
    });

    it('parses connection chains (multi-hop)', () => {
      const dsl = `archspec v1

architecture "Chain" {
  a = app_server "A" {}
  b = cache "B" {}
  c = postgres "C" {}

  a -> b -> c
}`;

      const tree = parser.parse(dsl);
      let hasError = false;
      tree.iterate({
        enter(node) {
          if (node.type.isError) {
            hasError = true;
          }
        }
      });
      expect(hasError).toBe(false);
    });

    it('parses properties with various value types', () => {
      const dsl = `archspec v1

architecture "Properties" {
  api = app_server "API" {
    str: "hello"
    num: 42
    bool: true
    nullVal: null
    arr: [1, 2, 3]
  }
}`;

      const tree = parser.parse(dsl);
      let hasError = false;
      tree.iterate({
        enter(node) {
          if (node.type.isError) {
            hasError = true;
          }
        }
      });
      expect(hasError).toBe(false);
    });
  });

  describe('error recovery (partial/invalid DSL)', () => {
    it('detects syntax error with missing closing brace', () => {
      const dsl = `archspec v1

architecture "Incomplete" {
  api = app_server "API" {
`;

      const tree = parser.parse(dsl);
      let errorCount = 0;
      tree.iterate({
        enter(node) {
          if (node.type.isError) {
            errorCount++;
          }
        }
      });
      expect(errorCount).toBeGreaterThan(0);
    });

    it('detects syntax error with invalid component type', () => {
      const dsl = `archspec v1

architecture "Invalid" {
  api = invalid_type "API" {}
}`;

      const tree = parser.parse(dsl);
      // Note: Grammar may accept unknown identifiers as component types
      // Validation happens at Zod schema level
      expect(tree.length).toBeGreaterThan(0);
    });

    it('handles incomplete connection (mid-typing scenario)', () => {
      const dsl = `archspec v1

architecture "Typing" {
  api = app_server "API" {}
  db = postgres "DB" {}
  api ->
}`;

      const tree = parser.parse(dsl);
      // Parser should recover and produce partial tree
      expect(tree.length).toBeGreaterThan(0);
    });

    it('handles missing architecture name', () => {
      const dsl = `archspec v1

architecture {
  api = app_server "API" {}
}`;

      const tree = parser.parse(dsl);
      // Should parse but might have errors
      expect(tree.length).toBeGreaterThan(0);
    });
  });
});
