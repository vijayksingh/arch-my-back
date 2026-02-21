import type { WidgetFlow, WidgetInstance, WidgetConnection } from '../types';

/**
 * Example Flows - Demonstrate widget composability
 * Each flow shows how widgets can be connected to create useful workflows
 */

// Helper to create widget instances
function createWidgetInstance(
  widgetId: string,
  config: unknown,
  position: { x: number; y: number },
  input?: unknown,
  output?: unknown
): WidgetInstance {
  return {
    id: `${widgetId}-${Date.now()}-${Math.random()}`,
    widgetId,
    config,
    position,
    input,
    output,
  };
}

/**
 * Flow 1: System Comparison Flow
 * Breadcrumb → Comparison Table → Trade-offs Card
 * Use case: Navigate system, compare approaches, see trade-offs
 */
export const systemComparisonFlow: WidgetFlow = {
  id: 'system-comparison-flow',
  name: 'System Comparison Flow',
  widgets: [
    createWidgetInstance(
      'breadcrumb',
      {
        showIcons: true,
        interactive: true,
      },
      { x: 50, y: 100 },
      {
        path: ['Architecture', 'Database', 'Comparison'],
      }
    ),
    createWidgetInstance(
      'comparison-table',
      {
        highlightDifferences: true,
        layout: 'grid',
      },
      { x: 400, y: 100 },
      {
        items: [
          {
            name: 'PostgreSQL',
            attributes: {
              type: 'Relational',
              scalability: 'Vertical',
              consistency: 'ACID',
            },
          },
          {
            name: 'MongoDB',
            attributes: {
              type: 'Document',
              scalability: 'Horizontal',
              consistency: 'Eventual',
            },
          },
        ],
      }
    ),
    createWidgetInstance(
      'tradeoffs-card',
      {
        showMetrics: true,
      },
      { x: 800, y: 100 },
      {
        decision: 'Database Selection',
        tradeoffs: [
          {
            aspect: 'Consistency',
            option1: 'Strong (PostgreSQL)',
            option2: 'Eventual (MongoDB)',
            chosen: 'option1',
            rationale: 'Financial transactions require ACID guarantees',
          },
          {
            aspect: 'Scalability',
            option1: 'Vertical (PostgreSQL)',
            option2: 'Horizontal (MongoDB)',
            chosen: 'option2',
            rationale: 'Need to scale reads across multiple nodes',
          },
        ],
      }
    ),
  ],
  connections: [
    {
      from: { widgetId: 'breadcrumb-instance-1', outputKey: 'currentPath' },
      to: { widgetId: 'comparison-table-instance-1', inputKey: 'context' },
    },
    {
      from: { widgetId: 'comparison-table-instance-1', outputKey: 'selected' },
      to: { widgetId: 'tradeoffs-card-instance-1', inputKey: 'options' },
    },
  ],
};

/**
 * Flow 2: Code Review Flow
 * Code Diff → Annotation Layer → Trade-offs Card
 * Use case: Review changes, annotate issues, document decisions
 */
export const codeReviewFlow: WidgetFlow = {
  id: 'code-review-flow',
  name: 'Code Review Flow',
  widgets: [
    createWidgetInstance(
      'code-diff',
      {
        language: 'typescript',
        showLineNumbers: true,
        theme: 'github',
      },
      { x: 50, y: 100 },
      {
        before: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`,
        after: `function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}`,
      }
    ),
    createWidgetInstance(
      'annotation-layer',
      {
        allowNewAnnotations: true,
      },
      { x: 450, y: 100 },
      {
        content: 'Code changes',
        annotations: [
          {
            id: 'ann-1',
            startLine: 1,
            endLine: 1,
            text: 'Added TypeScript types for better type safety',
            author: 'Reviewer',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'ann-2',
            startLine: 2,
            endLine: 2,
            text: 'Replaced loop with reduce for more functional style',
            author: 'Reviewer',
            timestamp: new Date().toISOString(),
          },
        ],
      }
    ),
    createWidgetInstance(
      'tradeoffs-card',
      {
        showMetrics: true,
      },
      { x: 850, y: 100 },
      {
        decision: 'Refactoring Approach',
        tradeoffs: [
          {
            aspect: 'Readability',
            option1: 'Imperative loop',
            option2: 'Functional reduce',
            chosen: 'option2',
            rationale: 'More concise and expressive',
          },
          {
            aspect: 'Performance',
            option1: 'For loop',
            option2: 'Reduce',
            chosen: 'option1',
            rationale: 'Minor performance difference, readability wins',
          },
        ],
      }
    ),
  ],
  connections: [
    {
      from: { widgetId: 'code-diff-instance-1', outputKey: 'changes' },
      to: { widgetId: 'annotation-layer-instance-1', inputKey: 'content' },
    },
    {
      from: { widgetId: 'annotation-layer-instance-1', outputKey: 'annotations' },
      to: { widgetId: 'tradeoffs-card-instance-1', inputKey: 'context' },
    },
  ],
};

/**
 * Flow 3: Architecture Walkthrough Flow
 * Timeline → Annotation Layer → Breadcrumb
 * Use case: Step through events, annotate key moments, show context
 */
export const architectureWalkthroughFlow: WidgetFlow = {
  id: 'architecture-walkthrough-flow',
  name: 'Architecture Walkthrough Flow',
  widgets: [
    createWidgetInstance(
      'timeline',
      {
        orientation: 'vertical',
        showTimestamps: true,
      },
      { x: 50, y: 100 },
      {
        events: [
          {
            id: 'evt-1',
            timestamp: '2024-01-01T10:00:00Z',
            title: 'System Initialization',
            description: 'Application starts up',
          },
          {
            id: 'evt-2',
            timestamp: '2024-01-01T10:00:05Z',
            title: 'Database Connection',
            description: 'Connected to PostgreSQL',
          },
          {
            id: 'evt-3',
            timestamp: '2024-01-01T10:00:10Z',
            title: 'Cache Initialized',
            description: 'Redis cache ready',
          },
        ],
      }
    ),
    createWidgetInstance(
      'annotation-layer',
      {
        allowNewAnnotations: true,
      },
      { x: 400, y: 100 },
      {
        content: 'Timeline events',
        annotations: [
          {
            id: 'ann-1',
            startLine: 1,
            endLine: 1,
            text: 'Critical path: must complete in <5s',
            author: 'Architect',
            timestamp: new Date().toISOString(),
          },
        ],
      }
    ),
    createWidgetInstance(
      'breadcrumb',
      {
        showIcons: true,
        interactive: true,
      },
      { x: 800, y: 100 },
      {
        path: ['System', 'Startup', 'Initialization'],
      }
    ),
  ],
  connections: [
    {
      from: { widgetId: 'timeline-instance-1', outputKey: 'selectedEvent' },
      to: { widgetId: 'annotation-layer-instance-1', inputKey: 'content' },
    },
    {
      from: { widgetId: 'annotation-layer-instance-1', outputKey: 'context' },
      to: { widgetId: 'breadcrumb-instance-1', inputKey: 'path' },
    },
  ],
};

/**
 * Flow 4: API Design Flow
 * Comparison Table → Code Block → Code Diff
 * Use case: Compare approaches, prototype in code, see before/after
 */
export const apiDesignFlow: WidgetFlow = {
  id: 'api-design-flow',
  name: 'API Design Flow',
  widgets: [
    createWidgetInstance(
      'comparison-table',
      {
        highlightDifferences: true,
        layout: 'grid',
      },
      { x: 50, y: 100 },
      {
        items: [
          {
            name: 'REST API',
            attributes: {
              protocol: 'HTTP',
              format: 'JSON',
              realtime: 'No',
            },
          },
          {
            name: 'GraphQL',
            attributes: {
              protocol: 'HTTP',
              format: 'JSON',
              realtime: 'Subscriptions',
            },
          },
        ],
      }
    ),
    createWidgetInstance(
      'code-block',
      {
        language: 'typescript',
        editable: true,
        showLineNumbers: true,
      },
      { x: 450, y: 100 },
      {
        code: `// GraphQL Schema
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Query {
  user(id: ID!): User
}`,
      }
    ),
    createWidgetInstance(
      'code-diff',
      {
        language: 'typescript',
        showLineNumbers: true,
        theme: 'github',
      },
      { x: 850, y: 100 },
      {
        before: `// REST Endpoint
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findOne(req.params.id);
  res.json(user);
});`,
        after: `// GraphQL Resolver
const resolvers = {
  Query: {
    user: async (_, { id }, { db }) => {
      return await db.users.findOne(id);
    },
  },
};`,
      }
    ),
  ],
  connections: [
    {
      from: { widgetId: 'comparison-table-instance-1', outputKey: 'selected' },
      to: { widgetId: 'code-block-instance-1', inputKey: 'template' },
    },
    {
      from: { widgetId: 'code-block-instance-1', outputKey: 'code' },
      to: { widgetId: 'code-diff-instance-1', inputKey: 'after' },
    },
  ],
};

/**
 * Flow 5: Debugging Flow
 * Breadcrumb → Timeline → Code Block
 * Use case: Navigate codebase, see execution timeline, run test code
 */
export const debuggingFlow: WidgetFlow = {
  id: 'debugging-flow',
  name: 'Debugging Flow',
  widgets: [
    createWidgetInstance(
      'breadcrumb',
      {
        showIcons: true,
        interactive: true,
      },
      { x: 50, y: 100 },
      {
        path: ['src', 'services', 'auth', 'login.ts'],
      }
    ),
    createWidgetInstance(
      'timeline',
      {
        orientation: 'vertical',
        showTimestamps: true,
      },
      { x: 400, y: 100 },
      {
        events: [
          {
            id: 'evt-1',
            timestamp: '2024-01-01T10:00:00.000Z',
            title: 'Login attempt',
            description: 'User submitted credentials',
          },
          {
            id: 'evt-2',
            timestamp: '2024-01-01T10:00:00.150Z',
            title: 'Validation',
            description: 'Checking email format',
          },
          {
            id: 'evt-3',
            timestamp: '2024-01-01T10:00:00.300Z',
            title: 'Database query',
            description: 'Looking up user',
          },
          {
            id: 'evt-4',
            timestamp: '2024-01-01T10:00:00.450Z',
            title: 'Password check',
            description: 'Comparing hashed password',
          },
          {
            id: 'evt-5',
            timestamp: '2024-01-01T10:00:00.600Z',
            title: 'Session created',
            description: 'Generated JWT token',
          },
        ],
      }
    ),
    createWidgetInstance(
      'code-block',
      {
        language: 'typescript',
        editable: true,
        showLineNumbers: true,
      },
      { x: 800, y: 100 },
      {
        code: `// Test the login flow
const result = await login({
  email: 'test@example.com',
  password: 'password123'
});

console.log('Login result:', result);`,
      }
    ),
  ],
  connections: [
    {
      from: { widgetId: 'breadcrumb-instance-1', outputKey: 'currentFile' },
      to: { widgetId: 'timeline-instance-1', inputKey: 'source' },
    },
    {
      from: { widgetId: 'timeline-instance-1', outputKey: 'selectedEvent' },
      to: { widgetId: 'code-block-instance-1', inputKey: 'context' },
    },
  ],
};

/**
 * Get all example flows
 */
export function getAllExampleFlows(): WidgetFlow[] {
  return [
    systemComparisonFlow,
    codeReviewFlow,
    architectureWalkthroughFlow,
    apiDesignFlow,
    debuggingFlow,
  ];
}

/**
 * Get an example flow by ID
 */
export function getExampleFlow(flowId: string): WidgetFlow | undefined {
  return getAllExampleFlows().find((flow) => flow.id === flowId);
}
