import type { WidgetDefinition } from '../types';

/**
 * Widget Registry - Central registry for all widget definitions
 * Similar to component registry, but for composable widgets
 */
class WidgetRegistry {
  private widgets: Map<string, WidgetDefinition<any, any, any>> = new Map();

  /**
   * Register a new widget definition
   */
  register(widget: WidgetDefinition<any, any, any>): void {
    if (this.widgets.has(widget.id)) {
      console.warn(`Widget "${widget.id}" is already registered. Overwriting.`);
    }
    this.widgets.set(widget.id, widget);
  }

  /**
   * Register multiple widget definitions at once
   */
  registerMany(widgets: WidgetDefinition<any, any, any>[]): void {
    widgets.forEach((widget) => this.register(widget));
  }

  /**
   * Unregister a widget definition
   */
  unregister(widgetId: string): boolean {
    return this.widgets.delete(widgetId);
  }

  /**
   * Get a widget definition by ID
   */
  get(widgetId: string): WidgetDefinition<any, any, any> | undefined {
    return this.widgets.get(widgetId);
  }

  /**
   * Get all registered widgets
   */
  getAll(): WidgetDefinition<any, any, any>[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get widgets by category
   */
  getByCategory(category: string): WidgetDefinition<any, any, any>[] {
    return this.getAll().filter((widget) => widget.category === category);
  }

  /**
   * Search widgets by tags
   */
  searchByTags(tags: string[]): WidgetDefinition<any, any, any>[] {
    return this.getAll().filter((widget) =>
      tags.some((tag) => widget.tags.includes(tag)),
    );
  }

  /**
   * Check if a widget is registered
   */
  has(widgetId: string): boolean {
    return this.widgets.has(widgetId);
  }

  /**
   * Clear all registered widgets (useful for testing)
   */
  clear(): void {
    this.widgets.clear();
  }

  /**
   * Get count of registered widgets
   */
  get count(): number {
    return this.widgets.size;
  }
}

// Singleton instance
export const widgetRegistry = new WidgetRegistry();

// Helper function to get widgets grouped by category
export function getWidgetsByCategory(): Record<string, WidgetDefinition<any, any, any>[]> {
  const widgets = widgetRegistry.getAll();
  return widgets.reduce(
    (acc, widget) => {
      if (!acc[widget.category]) {
        acc[widget.category] = [];
      }
      acc[widget.category].push(widget);
      return acc;
    },
    {} as Record<string, WidgetDefinition<any, any, any>[]>,
  );
}
