import type { WidgetExample } from '../types';
import type { AnnotationLayerInput, AnnotationLayerConfig } from './AnnotationLayer';

/**
 * Example 1: Canvas Node Annotations
 */
export const canvasNodeExample: WidgetExample<
  AnnotationLayerInput,
  AnnotationLayerConfig
> = {
  name: 'Canvas Node Annotations',
  description: 'Annotate nodes in a canvas diagram',
  input: {
    targetId: 'canvas-node-auth-service',
    annotations: [
      {
        id: 'ann-1',
        type: 'note',
        position: { x: 100, y: 50 },
        content: 'This service handles JWT token validation and refresh',
        visible: true,
        style: {
          backgroundColor: '#dbeafe',
          borderColor: '#3b82f6',
        },
      },
      {
        id: 'ann-2',
        type: 'callout',
        position: { x: 300, y: 150 },
        content: 'Performance bottleneck: consider caching user permissions',
        visible: true,
        style: {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
        },
      },
      {
        id: 'ann-3',
        type: 'highlight',
        position: { x: 150, y: 250 },
        content: 'Critical path for login flow',
        visible: true,
        style: {
          backgroundColor: '#fecaca',
          borderColor: '#ef4444',
        },
      },
    ],
  },
  config: {
    name: 'Canvas Annotations',
    editable: true,
    showAll: true,
  },
};

/**
 * Example 2: Timeline Event Annotations
 */
export const timelineExample: WidgetExample<
  AnnotationLayerInput,
  AnnotationLayerConfig
> = {
  name: 'Timeline Event Annotations',
  description: 'Add notes to timeline events',
  input: {
    targetId: 'timeline-deployment-history',
    annotations: [
      {
        id: 'ann-t1',
        type: 'note',
        position: { x: 50, y: 80 },
        content: 'First production deployment - had to rollback due to DB migration issue',
        visible: true,
        style: {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
        },
      },
      {
        id: 'ann-t2',
        type: 'callout',
        position: { x: 250, y: 150 },
        content: 'Successful deployment after fixing migration scripts',
        visible: true,
        style: {
          backgroundColor: '#d1fae5',
          borderColor: '#10b981',
        },
      },
    ],
  },
  config: {
    name: 'Timeline Annotations',
    editable: true,
    showAll: true,
  },
};

/**
 * Example 3: Code Diff Annotations
 */
export const codeDiffExample: WidgetExample<
  AnnotationLayerInput,
  AnnotationLayerConfig
> = {
  name: 'Code Review Annotations',
  description: 'Review comments on code changes',
  input: {
    targetId: 'code-diff-pr-1234',
    annotations: [
      {
        id: 'ann-c1',
        type: 'note',
        position: { x: 80, y: 60 },
        content: 'Consider extracting this logic into a separate function for reusability',
        visible: true,
        style: {
          backgroundColor: '#e0e7ff',
          borderColor: '#6366f1',
        },
      },
      {
        id: 'ann-c2',
        type: 'highlight',
        position: { x: 200, y: 180 },
        content: 'Security issue: validate user input before processing',
        visible: true,
        style: {
          backgroundColor: '#fecaca',
          borderColor: '#ef4444',
        },
      },
      {
        id: 'ann-c3',
        type: 'callout',
        position: { x: 350, y: 100 },
        content: 'Nice refactor! Much cleaner than before',
        visible: true,
        style: {
          backgroundColor: '#d1fae5',
          borderColor: '#10b981',
        },
      },
    ],
  },
  config: {
    name: 'Code Review',
    editable: false,
    showAll: true,
  },
};

export const annotationLayerExamples = [
  canvasNodeExample,
  timelineExample,
  codeDiffExample,
];
