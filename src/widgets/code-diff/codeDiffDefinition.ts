import type { WidgetDefinition } from '../types';
import { CodeDiff } from './CodeDiff';
import type {
  CodeDiffInput,
  CodeDiffOutput,
  CodeDiffConfig,
} from './CodeDiff';
import { codeDiffExamples } from './examples';

/**
 * Code Diff Widget Definition
 */
export const codeDiffWidget: WidgetDefinition<
  CodeDiffInput,
  CodeDiffOutput,
  CodeDiffConfig
> = {
  id: 'code-diff',
  name: 'Code Diff Viewer',
  category: 'visualization',
  icon: 'Code',
  description: 'Show file changes, code evolution, before/after comparisons',
  tags: ['code', 'diff', 'visualization'],

  inputSchema: {
    type: 'object',
    properties: {
      language: { type: 'string' },
      oldCode: { type: 'string' },
      newCode: { type: 'string' },
      filename: { type: 'string' },
      hunks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            oldStart: { type: 'number' },
            oldLines: { type: 'number' },
            newStart: { type: 'number' },
            newLines: { type: 'number' },
          },
        },
      },
    },
    required: ['language', 'oldCode', 'newCode'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      selectedLine: { type: 'number' },
      viewMode: { type: 'string', enum: ['split', 'unified'] },
    },
  },

  configSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      viewMode: { type: 'string', enum: ['split', 'unified'], default: 'split' },
      showLineNumbers: { type: 'boolean', default: true },
    },
  },

  defaultConfig: {
    name: 'Code Diff Viewer',
    viewMode: 'split',
    showLineNumbers: true,
  },

  component: CodeDiff,
  examples: codeDiffExamples,
};
