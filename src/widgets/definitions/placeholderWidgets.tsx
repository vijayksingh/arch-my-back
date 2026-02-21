import type { WidgetDefinition, WidgetProps } from '../types';

/**
 * Placeholder widget components - simple implementations for Wave 1
 * These will be replaced with full implementations in Waves 2-3
 */

// Placeholder component for all widgets in Wave 1
function PlaceholderWidget({ config }: WidgetProps<unknown, unknown, { name: string }>) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded border-2 border-dashed border-border bg-muted/30 p-4">
      <div className="text-center">
        <div className="text-sm font-medium text-foreground">
          {config.name}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Placeholder - Full implementation in Wave 2/3
        </div>
      </div>
    </div>
  );
}

/**
 * Widget 4: Annotation Layer (Wave 3)
 */
export const annotationWidget: WidgetDefinition = {
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
    },
  },

  configSchema: {
    type: 'object',
    properties: {
      editable: { type: 'boolean', default: true },
      showAll: { type: 'boolean', default: true },
    },
  },

  defaultConfig: {
    name: 'Annotation Layer',
    editable: true,
    showAll: true,
  },

  component: PlaceholderWidget,
  examples: [],
};

/**
 * Widget 5: Trade-offs Card
 */
export const tradeoffsWidget: WidgetDefinition = {
  id: 'tradeoffs-card',
  name: 'Trade-offs Card',
  category: 'context',
  icon: 'Scale',
  description: 'Document pros/cons, decision records, architectural trade-offs',
  tags: ['tradeoffs', 'decision', 'ADR', 'context'],

  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      context: { type: 'string' },
      pros: {
        type: 'array',
        items: { type: 'string' },
      },
      cons: {
        type: 'array',
        items: { type: 'string' },
      },
      decision: { type: 'string' },
      alternatives: { type: 'array' },
    },
    required: ['title', 'pros', 'cons'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      selectedAlternative: { type: 'string' },
    },
  },

  configSchema: {
    type: 'object',
    properties: {
      showAlternatives: { type: 'boolean', default: true },
      exportAsADR: { type: 'boolean', default: false },
    },
  },

  defaultConfig: {
    name: 'Trade-offs Card',
    showAlternatives: true,
    exportAsADR: false,
  },

  component: PlaceholderWidget,
  examples: [],
};

/**
 * Widget 6: Interactive Code Block
 */
export const interactiveCodeWidget: WidgetDefinition = {
  id: 'interactive-code',
  name: 'Interactive Code Block',
  category: 'interaction',
  icon: 'Terminal',
  description: 'Run/edit code snippets inline',
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
    },
  },

  configSchema: {
    type: 'object',
    properties: {
      editable: { type: 'boolean', default: true },
      showOutput: { type: 'boolean', default: true },
    },
  },

  defaultConfig: {
    name: 'Interactive Code Block',
    editable: true,
    showOutput: true,
  },

  component: PlaceholderWidget,
  examples: [],
};

/**
 * Widget 7: Breadcrumb Navigator
 */
export const breadcrumbWidget: WidgetDefinition = {
  id: 'breadcrumb-navigator',
  name: 'Breadcrumb Navigator',
  category: 'context',
  icon: 'ChevronRight',
  description: 'Show context — "where am I in the codebase/system?"',
  tags: ['breadcrumb', 'navigation', 'context'],

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
              enum: ['file', 'function', 'class', 'module'],
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
    },
  },

  configSchema: {
    type: 'object',
    properties: {
      maxLength: { type: 'number', default: 5 },
      showIcons: { type: 'boolean', default: true },
    },
  },

  defaultConfig: {
    name: 'Breadcrumb Navigator',
    maxLength: 5,
    showIcons: true,
  },

  component: PlaceholderWidget,
  examples: [],
};

/**
 * Placeholder widgets for Wave 3 (not yet implemented)
 */
export const placeholderWidgets: WidgetDefinition[] = [
  annotationWidget,
  tradeoffsWidget,
  interactiveCodeWidget,
  breadcrumbWidget,
];
