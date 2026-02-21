import type { WidgetDefinition } from '../types';
import { Timeline } from './Timeline';
import type {
  TimelineInput,
  TimelineOutput,
  TimelineConfig,
} from './Timeline';
import { timelineExamples } from './examples';

/**
 * Timeline Widget Definition
 */
export const timelineWidget: WidgetDefinition<
  TimelineInput,
  TimelineOutput,
  TimelineConfig
> = {
  id: 'timeline',
  name: 'Timeline/Sequence',
  category: 'visualization',
  icon: 'GitBranch',
  description: 'Visualize execution flow, request lifecycle, event sequences',
  tags: ['timeline', 'sequence', 'visualization', 'flow'],

  inputSchema: {
    type: 'object',
    properties: {
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            timestamp: { type: ['number', 'string'] },
            title: { type: 'string' },
            description: { type: 'string' },
            type: {
              type: 'string',
              enum: ['start', 'end', 'event', 'error', 'decision'],
            },
            metadata: { type: 'object' },
            swimlaneId: { type: 'string' },
          },
          required: ['id', 'timestamp', 'title'],
        },
      },
      swimlanes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
          },
          required: ['id', 'label'],
        },
      },
    },
    required: ['events'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      selectedEvent: { type: 'string' },
      zoomLevel: { type: 'number' },
      visibleRange: {
        type: 'object',
        properties: {
          start: { type: 'number' },
          end: { type: 'number' },
        },
      },
    },
  },

  configSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      showSwimlanes: { type: 'boolean', default: true },
      animate: { type: 'boolean', default: false },
    },
  },

  defaultConfig: {
    name: 'Timeline/Sequence',
    showSwimlanes: true,
    animate: false,
  },

  component: Timeline,
  examples: timelineExamples,
};
