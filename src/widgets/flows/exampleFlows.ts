import type { WidgetFlow, WidgetInstance } from '../types';
import { stripePaymentWalkthroughFlow } from './stripePaymentFlow';

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
 * Flow 6: Uber Dispatch Real-Time Flow
 * Timeline → Annotation Layer → Comparison Table → Trade-offs Card → Code Block
 * Use case: Demonstrate real-time dispatch from rider request to driver assignment
 */
export const uberDispatchFlow: WidgetFlow = {
  id: 'uber-dispatch-flow',
  name: 'Uber Dispatch Real-Time Flow',
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
            timestamp: '2024-01-01T10:00:00.000Z',
            title: 'Rider Request',
            description: 'User requests ride from location A to B',
          },
          {
            id: 'evt-2',
            timestamp: '2024-01-01T10:00:00.050Z',
            title: 'H3 Geospatial Query',
            description: 'Query H3 index for nearby drivers within resolution 9',
          },
          {
            id: 'evt-3',
            timestamp: '2024-01-01T10:00:00.150Z',
            title: 'Driver Pool Retrieved',
            description: 'Found 47 drivers within 2km radius',
          },
          {
            id: 'evt-4',
            timestamp: '2024-01-01T10:00:00.200Z',
            title: 'ETA Calculation',
            description: 'Gurafu routing engine + DeepETA ML model',
          },
          {
            id: 'evt-5',
            timestamp: '2024-01-01T10:00:00.450Z',
            title: 'Surge Pricing',
            description: 'Calculate surge multiplier: 1.3x (high demand)',
          },
          {
            id: 'evt-6',
            timestamp: '2024-01-01T10:00:00.650Z',
            title: 'Bipartite Matching',
            description: 'Min-cost perfect matching on rider-driver graph',
          },
          {
            id: 'evt-7',
            timestamp: '2024-01-01T10:00:00.800Z',
            title: 'Driver Assigned',
            description: 'Driver matched, ETA 3 min, $12.50 fare',
          },
          {
            id: 'evt-8',
            timestamp: '2024-01-01T10:00:01.000Z',
            title: 'Push Notifications',
            description: 'Notify rider and driver via WebSocket',
          },
        ],
      }
    ),
    createWidgetInstance(
      'annotation-layer',
      {
        allowNewAnnotations: true,
      },
      { x: 450, y: 100 },
      {
        content: 'Dispatch Flow',
        annotations: [
          {
            id: 'ann-1',
            startLine: 2,
            endLine: 3,
            text: 'H3 hexagonal grid enables O(1) lookup by dividing Earth into cells. Resolution 9 = ~0.1km² cells.',
            author: 'System Architect',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'ann-2',
            startLine: 4,
            endLine: 4,
            text: 'DeepETA hybrid: routing engine for base ETA + ML model predicts residual based on traffic, weather, driver behavior.',
            author: 'ML Engineer',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'ann-3',
            startLine: 6,
            endLine: 6,
            text: 'Hungarian algorithm (Kuhn-Munkres) solves assignment in O(n³). Optimizes global quality vs greedy per-request.',
            author: 'Algorithms Lead',
            timestamp: new Date().toISOString(),
          },
        ],
      }
    ),
    createWidgetInstance(
      'comparison-table',
      {
        highlightDifferences: true,
        layout: 'grid',
      },
      { x: 50, y: 600 },
      {
        items: [
          {
            name: 'Greedy Matching',
            attributes: {
              algorithm: 'First-available driver',
              latency: '<50ms',
              quality: 'Suboptimal',
              fairness: 'Low (favors nearby)',
              scalability: 'High',
            },
          },
          {
            name: 'Optimal Matching (Uber)',
            attributes: {
              algorithm: 'Bipartite graph (Hungarian)',
              latency: '~800ms',
              quality: 'Optimal',
              fairness: 'High (balanced)',
              scalability: 'Medium',
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
      { x: 550, y: 600 },
      {
        decision: 'Matching Strategy',
        tradeoffs: [
          {
            aspect: 'Latency',
            option1: 'Greedy: <50ms',
            option2: 'Optimal: ~800ms',
            chosen: 'option2',
            rationale: 'Better matches worth extra 750ms. Users tolerate 1-2s for quality.',
          },
          {
            aspect: 'Accuracy vs Speed',
            option1: 'Routing engine only',
            option2: 'Routing + ML post-processing',
            chosen: 'option2',
            rationale: 'ML adds 3ms but reduces ETA error by 15%. Critical for user trust.',
          },
          {
            aspect: 'Surge Pricing',
            option1: 'Fixed pricing',
            option2: 'Dynamic surge',
            chosen: 'option2',
            rationale: 'Balances supply-demand. Incentivizes drivers during high demand.',
          },
        ],
      }
    ),
    createWidgetInstance(
      'code-block',
      {
        language: 'typescript',
        editable: false,
        showLineNumbers: true,
      },
      { x: 50, y: 1050 },
      {
        code: `// H3 Geospatial Query Example
import { geoToH3, kRing } from 'h3-js';

// Convert rider GPS to H3 cell
const riderH3 = geoToH3(37.7749, -122.4194, 9); // SF coords, res 9
// Get neighboring cells (k=2 means 2-ring neighbors)
const searchCells = kRing(riderH3, 2); // ~19 cells

// Query Redis for drivers in these cells
const drivers = await redis.mget(
  searchCells.map(cell => \`drivers:\${cell}\`)
);

// Example: Bipartite Matching
const costMatrix = riders.map(r =>
  drivers.map(d => calculateCost(r, d, { eta, rating, surge }))
);
const assignment = hungarianAlgorithm(costMatrix);`,
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
      to: { widgetId: 'comparison-table-instance-1', inputKey: 'filter' },
    },
    {
      from: { widgetId: 'comparison-table-instance-1', outputKey: 'selected' },
      to: { widgetId: 'tradeoffs-card-instance-1', inputKey: 'options' },
    },
    {
      from: { widgetId: 'tradeoffs-card-instance-1', outputKey: 'decision' },
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
    uberDispatchFlow,
    stripePaymentWalkthroughFlow,
  ];
}

/**
 * Get an example flow by ID
 */
export function getExampleFlow(flowId: string): WidgetFlow | undefined {
  return getAllExampleFlows().find((flow) => flow.id === flowId);
}
