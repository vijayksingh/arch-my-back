import { describe, test, expect } from 'vitest';
import { templates } from '../index';
import { componentTypeMap } from '@/registry/componentTypes';
import type { DesignTemplate } from '@/types';

describe('templates', () => {
  describe('template registry', () => {
    test('exports 5 templates', () => {
      expect(templates).toHaveLength(5);
    });

    test('all templates have required fields', () => {
      templates.forEach((template) => {
        expect(template).toHaveProperty('slug');
        expect(template).toHaveProperty('title');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('nodes');
        expect(template).toHaveProperty('edges');

        // Verify types
        expect(typeof template.slug).toBe('string');
        expect(typeof template.title).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(Array.isArray(template.nodes)).toBe(true);
        expect(Array.isArray(template.edges)).toBe(true);
      });
    });

    test('all templates have unique slugs', () => {
      const slugs = templates.map((t) => t.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    test('all templates have non-empty titles and descriptions', () => {
      templates.forEach((template) => {
        expect(template.title.trim().length).toBeGreaterThan(0);
        expect(template.description.trim().length).toBeGreaterThan(0);
      });
    });

    test('all templates have at least one node', () => {
      templates.forEach((template) => {
        expect(template.nodes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('template node validation', () => {
    test('all archComponent nodes use valid component types from registry', () => {
      templates.forEach((template) => {
        template.nodes.forEach((node) => {
          if (node.type === 'archComponent') {
            const componentType = node.data.componentType;
            const typeExists = componentTypeMap.has(componentType);

            expect(typeExists).toBe(true);
            // Helpful error message if test fails
            if (!typeExists) {
              console.error(
                `Template "${template.slug}" has node "${node.id}" with invalid componentType: "${componentType}"`
              );
            }
          }
        });
      });
    });

    test('all nodes have required properties', () => {
      templates.forEach((template) => {
        template.nodes.forEach((node) => {
          expect(node).toHaveProperty('id');
          expect(node).toHaveProperty('type');
          expect(node).toHaveProperty('position');
          expect(node).toHaveProperty('data');

          expect(typeof node.id).toBe('string');
          expect(node.id.length).toBeGreaterThan(0);

          expect(node.position).toHaveProperty('x');
          expect(node.position).toHaveProperty('y');
          expect(typeof node.position.x).toBe('number');
          expect(typeof node.position.y).toBe('number');
        });
      });
    });

    test('all archComponent nodes have label and config', () => {
      templates.forEach((template) => {
        template.nodes.forEach((node) => {
          if (node.type === 'archComponent') {
            expect(node.data).toHaveProperty('label');
            expect(node.data).toHaveProperty('config');
            expect(typeof node.data.label).toBe('string');
            expect(typeof node.data.config).toBe('object');
          }
        });
      });
    });
  });

  describe('template edge validation', () => {
    test('all edges reference existing nodes', () => {
      templates.forEach((template) => {
        const nodeIds = new Set(template.nodes.map((n) => n.id));

        template.edges.forEach((edge) => {
          const sourceExists = nodeIds.has(edge.source);
          const targetExists = nodeIds.has(edge.target);

          expect(sourceExists).toBe(true);
          expect(targetExists).toBe(true);

          // Helpful error messages
          if (!sourceExists) {
            console.error(
              `Template "${template.slug}" has edge "${edge.id}" with non-existent source: "${edge.source}"`
            );
          }
          if (!targetExists) {
            console.error(
              `Template "${template.slug}" has edge "${edge.id}" with non-existent target: "${edge.target}"`
            );
          }
        });
      });
    });

    test('all edges have required properties', () => {
      templates.forEach((template) => {
        template.edges.forEach((edge) => {
          expect(edge).toHaveProperty('id');
          expect(edge).toHaveProperty('source');
          expect(edge).toHaveProperty('target');
          expect(edge).toHaveProperty('type');

          expect(typeof edge.id).toBe('string');
          expect(typeof edge.source).toBe('string');
          expect(typeof edge.target).toBe('string');
          expect(edge.type).toBe('archEdge');
        });
      });
    });

    test('edges have unique IDs within each template', () => {
      templates.forEach((template) => {
        const edgeIds = template.edges.map((e) => e.id);
        const uniqueIds = new Set(edgeIds);
        expect(uniqueIds.size).toBe(edgeIds.length);
      });
    });
  });

  describe('specific templates', () => {
    test('urlShortener template exists', () => {
      const urlShortener = templates.find((t) => t.slug === 'url-shortener');
      expect(urlShortener).toBeDefined();
      expect(urlShortener?.title).toBeTruthy();
    });

    test('ecommerce template exists', () => {
      const ecommerce = templates.find((t) => t.slug === 'ecommerce');
      expect(ecommerce).toBeDefined();
      expect(ecommerce?.title).toBe('E-Commerce Platform');
      expect(ecommerce?.nodes.length).toBeGreaterThan(5); // Should have multiple components
    });

    test('realtimeChat template exists', () => {
      const realtimeChat = templates.find((t) => t.slug === 'realtime-chat');
      expect(realtimeChat).toBeDefined();
      expect(realtimeChat?.title).toBeTruthy();
    });

    test('videoStreaming template exists', () => {
      const videoStreaming = templates.find((t) => t.slug === 'video-streaming');
      expect(videoStreaming).toBeDefined();
      expect(videoStreaming?.title).toBeTruthy();
    });

    test('iotPipeline template exists', () => {
      const iotPipeline = templates.find((t) => t.slug === 'iot-pipeline');
      expect(iotPipeline).toBeDefined();
      expect(iotPipeline?.title).toBeTruthy();
    });
  });
});
