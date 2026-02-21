import type { WidgetDefinition } from '../types';
import { AnnotationLayer } from './AnnotationLayer';
import type {
  AnnotationLayerInput,
  AnnotationLayerOutput,
  AnnotationLayerConfig,
} from './AnnotationLayer';
import { annotationLayerExamples } from './examples';

/**
 * Annotation Layer Widget Definition
 */
export const annotationLayerWidget: WidgetDefinition<
  AnnotationLayerInput,
  AnnotationLayerOutput,
  AnnotationLayerConfig
> = {
  id: 'annotation-layer',
  name: 'Annotation Layer',
  category: 'interaction',
  icon: 'MessageSquare',
  description: 'Add notes, callouts, highlights to any widget or canvas element',
  tags: ['annotation', 'notes', 'callout', 'interaction'],

  inputSchema: {
    type: 'object',
    properties: {
      targetId: { type: 'string' },
      annotations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: {
              type: 'string',
              enum: ['note', 'callout', 'highlight', 'arrow'],
            },
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
              },
              required: ['x', 'y'],
            },
            content: { type: 'string' },
            style: { type: 'object' },
            visible: { type: 'boolean' },
          },
          required: ['id', 'type', 'position', 'content'],
        },
      },
    },
    required: ['targetId'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      annotations: { type: 'array' },
      action: {
        type: 'string',
        enum: ['add', 'update', 'delete', 'export'],
      },
    },
    required: ['annotations'],
  },

  configSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      editable: { type: 'boolean', default: true },
      showAll: { type: 'boolean', default: true },
      allowedTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['note', 'callout', 'highlight', 'arrow'],
        },
      },
    },
  },

  defaultConfig: {
    name: 'Annotation Layer',
    editable: true,
    showAll: true,
    allowedTypes: ['note', 'callout', 'highlight', 'arrow'],
  },

  component: AnnotationLayer,
  examples: annotationLayerExamples,
};
