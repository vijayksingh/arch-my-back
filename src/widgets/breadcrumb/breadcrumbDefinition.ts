import type { WidgetDefinition } from '../types';
import { Breadcrumb } from './Breadcrumb';
import type { BreadcrumbInput, BreadcrumbOutput, BreadcrumbConfig } from './Breadcrumb';
import { breadcrumbExamples } from './examples';

/**
 * Breadcrumb Navigator Widget Definition
 */
export const breadcrumbWidget: WidgetDefinition<
  BreadcrumbInput,
  BreadcrumbOutput,
  BreadcrumbConfig
> = {
  id: 'breadcrumb-navigator',
  name: 'Breadcrumb Navigator',
  category: 'context',
  icon: 'ChevronRight',
  description: 'Show hierarchical context - "where am I in the codebase/system?"',
  tags: ['breadcrumb', 'navigation', 'context', 'hierarchy'],

  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            type: {
              type: 'string',
              enum: ['file', 'function', 'class', 'module', 'folder'],
            },
            metadata: { type: 'object' },
          },
          required: ['id', 'label', 'type'],
        },
      },
      currentId: { type: 'string' },
    },
    required: ['path'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      selectedId: { type: 'string' },
      path: { type: 'string' },
    },
    required: ['selectedId'],
  },

  configSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      maxLength: { type: 'number', default: 5 },
      showIcons: { type: 'boolean', default: true },
      separator: {
        type: 'string',
        enum: ['chevron', 'slash', 'dot'],
        default: 'chevron',
      },
    },
  },

  defaultConfig: {
    name: 'Breadcrumb Navigator',
    maxLength: 5,
    showIcons: true,
    separator: 'chevron',
  },

  component: Breadcrumb,
  examples: breadcrumbExamples,
};
