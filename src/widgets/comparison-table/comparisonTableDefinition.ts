import type { WidgetDefinition } from '../types';
import { ComparisonTable } from './ComparisonTable';
import type {
  ComparisonTableInput,
  ComparisonTableOutput,
  ComparisonTableConfig,
} from './ComparisonTable';
import { comparisonTableExamples } from './examples';

/**
 * Comparison Table Widget Definition
 */
export const comparisonTableWidget: WidgetDefinition<
  ComparisonTableInput,
  ComparisonTableOutput,
  ComparisonTableConfig
> = {
  id: 'comparison-table',
  name: 'Comparison Table',
  category: 'visualization',
  icon: 'Table',
  description: 'Side-by-side comparison of approaches, technologies, architectures',
  tags: ['comparison', 'table', 'visualization'],

  inputSchema: {
    type: 'object',
    properties: {
      columns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['id', 'title'],
        },
      },
      rows: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            cells: { type: 'object' },
          },
          required: ['id', 'label', 'cells'],
        },
      },
    },
    required: ['columns', 'rows'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      selectedColumn: { type: 'string' },
      selectedRow: { type: 'string' },
      exportFormat: { type: 'string', enum: ['markdown', 'json', 'csv'] },
    },
  },

  configSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      striped: { type: 'boolean', default: true },
      highlightOnHover: { type: 'boolean', default: true },
      sortable: { type: 'boolean', default: false },
      maxWidth: { type: 'string' },
    },
  },

  defaultConfig: {
    name: 'Comparison Table',
    striped: true,
    highlightOnHover: true,
    sortable: false,
  },

  component: ComparisonTable,
  examples: comparisonTableExamples,
};
