import type { WidgetDefinition } from '../types';
import { TradeoffsCard } from './TradeoffsCard';
import type {
  TradeoffsCardInput,
  TradeoffsCardOutput,
  TradeoffsCardConfig,
} from './TradeoffsCard';
import { tradeoffsCardExamples } from './examples';

/**
 * Trade-offs Card Widget Definition
 */
export const tradeoffsCardWidget: WidgetDefinition<
  TradeoffsCardInput,
  TradeoffsCardOutput,
  TradeoffsCardConfig
> = {
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
      alternatives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            pros: {
              type: 'array',
              items: { type: 'string' },
            },
            cons: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['id', 'name', 'pros', 'cons'],
        },
      },
    },
    required: ['title', 'pros', 'cons'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      selectedAlternative: { type: 'string' },
      exportedADR: { type: 'string' },
    },
  },

  configSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      showAlternatives: { type: 'boolean', default: true },
      exportAsADR: { type: 'boolean', default: false },
      expandedByDefault: { type: 'boolean', default: false },
    },
  },

  defaultConfig: {
    name: 'Trade-offs Card',
    showAlternatives: true,
    exportAsADR: false,
    expandedByDefault: false,
  },

  component: TradeoffsCard,
  examples: tradeoffsCardExamples,
};
