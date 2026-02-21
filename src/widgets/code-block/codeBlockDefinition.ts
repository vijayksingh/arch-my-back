import type { WidgetDefinition } from '../types';
import { CodeBlock } from './CodeBlock';
import type { CodeBlockInput, CodeBlockOutput, CodeBlockConfig } from './CodeBlock';
import { codeBlockExamples } from './examples';

/**
 * Interactive Code Block Widget Definition
 */
export const codeBlockWidget: WidgetDefinition<
  CodeBlockInput,
  CodeBlockOutput,
  CodeBlockConfig
> = {
  id: 'interactive-code',
  name: 'Interactive Code Block',
  category: 'interaction',
  icon: 'Terminal',
  description: 'Run/edit code snippets inline with sandboxed execution',
  tags: ['code', 'interactive', 'REPL', 'execution'],

  inputSchema: {
    type: 'object',
    properties: {
      language: { type: 'string' },
      code: { type: 'string' },
      runtime: {
        type: 'string',
        enum: ['browser', 'sandboxed'],
        default: 'sandboxed',
      },
      dependencies: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['language', 'code'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      output: { type: 'string' },
      error: { type: 'string' },
      executionTime: { type: 'number' },
    },
    required: ['code'],
  },

  configSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      editable: { type: 'boolean', default: true },
      showOutput: { type: 'boolean', default: true },
      theme: {
        type: 'string',
        enum: ['light', 'dark'],
        default: 'dark',
      },
      autoRun: { type: 'boolean', default: false },
    },
  },

  defaultConfig: {
    name: 'Interactive Code Block',
    editable: true,
    showOutput: true,
    theme: 'dark',
    autoRun: false,
  },

  component: CodeBlock,
  examples: codeBlockExamples,
};
