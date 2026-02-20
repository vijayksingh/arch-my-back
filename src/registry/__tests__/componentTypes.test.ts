/**
 * Test suite for component registry validation
 * Verifies that all components have required metadata for Wave 2 features
 */

import { describe, test, expect } from 'vitest';
import { componentTypes, componentTypeMap } from '../componentTypes';

describe('Component Registry', () => {
  test('all component types are registered', () => {
    const expectedCount = componentTypes.length;
    expect(componentTypeMap.size).toBe(expectedCount);
    expect(expectedCount).toBeGreaterThanOrEqual(12); // At least 12 components
  });

  test('all components have configSchema', () => {
    componentTypes.forEach((component) => {
      expect(component.configSchema).toBeDefined();
      expect(typeof component.configSchema).toBe('object');
      expect(component.configSchema?.type).toBe('object');
      expect(component.configSchema?.properties).toBeDefined();
    });
  });

  test('all components have primaryFields', () => {
    componentTypes.forEach((component) => {
      expect(component.primaryFields).toBeDefined();
      expect(Array.isArray(component.primaryFields)).toBe(true);
      expect(component.primaryFields!.length).toBeGreaterThan(0);
      expect(component.primaryFields!.length).toBeLessThanOrEqual(3);
    });
  });

  test('primaryFields keys exist in configSchema properties', () => {
    componentTypes.forEach((component) => {
      const { primaryFields, configSchema } = component;
      const properties = configSchema?.properties as Record<string, unknown>;

      primaryFields?.forEach((fieldKey) => {
        expect(
          properties,
          `Component "${component.label}" missing primaryField "${fieldKey}" in configSchema`
        ).toHaveProperty(fieldKey);
      });
    });
  });

  test('configSchema required fields match configFields', () => {
    componentTypes.forEach((component) => {
      const { configFields, configSchema } = component;
      const requiredFields = (configSchema?.required as string[]) || [];

      // All required schema fields should have a corresponding configField
      requiredFields.forEach((requiredKey) => {
        const hasConfigField = configFields.some((f) => f.key === requiredKey);
        expect(
          hasConfigField,
          `Component "${component.label}" has required field "${requiredKey}" in schema but missing in configFields`
        ).toBe(true);
      });
    });
  });
});
