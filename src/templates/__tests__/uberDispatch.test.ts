import { describe, test, expect } from 'vitest';
import { uberDispatchTemplate } from '../uberDispatch';
import { componentTypeMap } from '@/registry/componentTypes';
import { NODE_TYPE } from '@/constants';

describe('uberDispatchTemplate', () => {
  test('has valid basic structure', () => {
    expect(uberDispatchTemplate).toHaveProperty('slug', 'uber-dispatch');
    expect(uberDispatchTemplate).toHaveProperty('title');
    expect(uberDispatchTemplate).toHaveProperty('description');
    expect(uberDispatchTemplate).toHaveProperty('nodes');
    expect(uberDispatchTemplate).toHaveProperty('edges');
  });

  test('has nodes and edges', () => {
    expect(uberDispatchTemplate.nodes.length).toBeGreaterThan(0);
    expect(uberDispatchTemplate.edges.length).toBeGreaterThan(0);
  });

  test('all nodes use valid component types', () => {
    uberDispatchTemplate.nodes.forEach((node) => {
      if (node.type === NODE_TYPE.ARCH_COMPONENT) {
        const componentType = node.data.componentType;
        const typeExists = componentTypeMap.has(componentType);

        expect(typeExists).toBe(true);
        if (!typeExists) {
          console.error(
            `Node "${node.id}" has invalid componentType: "${componentType}"`
          );
        }
      }
    });
  });

  test('all edges reference existing nodes', () => {
    const nodeIds = new Set(uberDispatchTemplate.nodes.map((n) => n.id));

    uberDispatchTemplate.edges.forEach((edge) => {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    });
  });

  test('demonstrates real-world architecture components', () => {
    const labels = uberDispatchTemplate.nodes.map((n) => n.data.label.toLowerCase());

    // Check for key Uber components
    expect(labels.some((l) => l.includes('h3') || l.includes('geospatial'))).toBe(true);
    expect(labels.some((l) => l.includes('matching'))).toBe(true);
    expect(labels.some((l) => l.includes('eta') || l.includes('gurafu'))).toBe(true);
    expect(labels.some((l) => l.includes('surge'))).toBe(true);
  });

  test('has appropriate scale configuration', () => {
    // Check that services have high replica counts for scale
    const services = uberDispatchTemplate.nodes.filter(
      (n) => n.type === NODE_TYPE.ARCH_COMPONENT && n.data.componentType === 'app_server'
    );

    expect(services.length).toBeGreaterThan(0);

    // At least some services should be configured for high scale
    const highScaleServices = services.filter(
      (s) => {
        const config = s.data.config as { replicas?: number };
        return config.replicas && config.replicas >= 10;
      }
    );

    expect(highScaleServices.length).toBeGreaterThan(0);
  });
});
