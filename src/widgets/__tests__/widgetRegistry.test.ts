import { describe, it, expect, beforeEach } from 'vitest';
import { widgetRegistry } from '../registry/widgetRegistry';
import type { WidgetDefinition } from '../types';

describe('WidgetRegistry', () => {
  // Clear registry before each test
  beforeEach(() => {
    widgetRegistry.clear();
  });

  const mockWidget: WidgetDefinition = {
    id: 'test-widget',
    name: 'Test Widget',
    category: 'visualization',
    icon: 'TestIcon',
    description: 'A test widget',
    tags: ['test', 'mock'],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    configSchema: { type: 'object' },
    defaultConfig: {},
    component: () => null,
    examples: [],
  };

  it('should register a widget', () => {
    widgetRegistry.register(mockWidget);
    expect(widgetRegistry.has('test-widget')).toBe(true);
    expect(widgetRegistry.get('test-widget')).toEqual(mockWidget);
  });

  it('should unregister a widget', () => {
    widgetRegistry.register(mockWidget);
    expect(widgetRegistry.has('test-widget')).toBe(true);

    const result = widgetRegistry.unregister('test-widget');
    expect(result).toBe(true);
    expect(widgetRegistry.has('test-widget')).toBe(false);
  });

  it('should return false when unregistering non-existent widget', () => {
    const result = widgetRegistry.unregister('non-existent');
    expect(result).toBe(false);
  });

  it('should get all registered widgets', () => {
    const widget2: WidgetDefinition = {
      ...mockWidget,
      id: 'test-widget-2',
      name: 'Test Widget 2',
    };

    widgetRegistry.register(mockWidget);
    widgetRegistry.register(widget2);

    const all = widgetRegistry.getAll();
    expect(all).toHaveLength(2);
    expect(all).toContainEqual(mockWidget);
    expect(all).toContainEqual(widget2);
  });

  it('should get widgets by category', () => {
    const visualWidget = mockWidget;
    const interactionWidget: WidgetDefinition = {
      ...mockWidget,
      id: 'interaction-widget',
      category: 'interaction',
    };

    widgetRegistry.register(visualWidget);
    widgetRegistry.register(interactionWidget);

    const visualizationWidgets = widgetRegistry.getByCategory('visualization');
    expect(visualizationWidgets).toHaveLength(1);
    expect(visualizationWidgets[0].id).toBe('test-widget');

    const interactionWidgets = widgetRegistry.getByCategory('interaction');
    expect(interactionWidgets).toHaveLength(1);
    expect(interactionWidgets[0].id).toBe('interaction-widget');
  });

  it('should search widgets by tags', () => {
    const widget1 = mockWidget;
    const widget2: WidgetDefinition = {
      ...mockWidget,
      id: 'widget-2',
      tags: ['comparison', 'table'],
    };

    widgetRegistry.register(widget1);
    widgetRegistry.register(widget2);

    const results = widgetRegistry.searchByTags(['test']);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('test-widget');

    const results2 = widgetRegistry.searchByTags(['table']);
    expect(results2).toHaveLength(1);
    expect(results2[0].id).toBe('widget-2');
  });

  it('should overwrite widget when registering with same ID', () => {
    const widget1 = mockWidget;
    const widget2: WidgetDefinition = {
      ...mockWidget,
      name: 'Updated Test Widget',
    };

    widgetRegistry.register(widget1);
    widgetRegistry.register(widget2);

    const retrieved = widgetRegistry.get('test-widget');
    expect(retrieved?.name).toBe('Updated Test Widget');
    expect(widgetRegistry.count).toBe(1);
  });

  it('should clear all widgets', () => {
    widgetRegistry.register(mockWidget);
    expect(widgetRegistry.count).toBe(1);

    widgetRegistry.clear();
    expect(widgetRegistry.count).toBe(0);
    expect(widgetRegistry.getAll()).toHaveLength(0);
  });

  it('should return correct count', () => {
    expect(widgetRegistry.count).toBe(0);

    widgetRegistry.register(mockWidget);
    expect(widgetRegistry.count).toBe(1);

    const widget2 = { ...mockWidget, id: 'widget-2' };
    widgetRegistry.register(widget2);
    expect(widgetRegistry.count).toBe(2);

    widgetRegistry.unregister('test-widget');
    expect(widgetRegistry.count).toBe(1);
  });

  it('should register multiple widgets at once', () => {
    const widgets: WidgetDefinition[] = [
      mockWidget,
      { ...mockWidget, id: 'widget-2' },
      { ...mockWidget, id: 'widget-3' },
    ];

    widgetRegistry.registerMany(widgets);
    expect(widgetRegistry.count).toBe(3);
  });
});
