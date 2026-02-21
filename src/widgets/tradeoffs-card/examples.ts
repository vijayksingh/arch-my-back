import type { WidgetExample } from '../types';
import type { TradeoffsCardInput, TradeoffsCardConfig } from './TradeoffsCard';

/**
 * Example 1: REST vs GraphQL Decision
 */
export const restVsGraphQLExample: WidgetExample<
  TradeoffsCardInput,
  TradeoffsCardConfig
> = {
  name: 'REST vs GraphQL',
  description: 'API architecture decision for new microservice',
  input: {
    title: 'API Architecture: REST vs GraphQL',
    context:
      'We need to design the API for our new user service. The service will be consumed by web, mobile, and internal microservices. Performance and flexibility are key requirements.',
    pros: [
      'GraphQL allows clients to request exactly the data they need',
      'Single endpoint simplifies versioning and documentation',
      'Strong type system with introspection',
      'Reduces over-fetching and under-fetching',
    ],
    cons: [
      'Steeper learning curve for the team',
      'Caching is more complex compared to REST',
      'Requires GraphQL client libraries',
      'Potential for expensive queries without proper rate limiting',
    ],
    decision:
      'We will use GraphQL for this service. The benefits of precise data fetching and the type system outweigh the learning curve. We will implement query complexity analysis and rate limiting to mitigate the risk of expensive queries.',
    alternatives: [
      {
        id: 'alt-rest',
        name: 'REST API',
        description:
          'Traditional RESTful API with JSON responses. Well-understood by the team.',
        pros: [
          'Team already has expertise',
          'Simple HTTP caching',
          'Wide tooling support',
          'Easy to debug with standard HTTP tools',
        ],
        cons: [
          'Over-fetching or under-fetching data',
          'Multiple endpoints to maintain',
          'Versioning can be complex',
          'No built-in type system',
        ],
      },
      {
        id: 'alt-grpc',
        name: 'gRPC',
        description:
          'High-performance RPC framework using Protocol Buffers. Best for internal service-to-service communication.',
        pros: [
          'Very fast with binary serialization',
          'Strong type safety with .proto files',
          'Bi-directional streaming',
          'Great for microservices',
        ],
        cons: [
          'Limited browser support',
          'Harder to debug than JSON',
          'Requires code generation',
          'Not ideal for public APIs',
        ],
      },
    ],
  },
  config: {
    name: 'API Architecture Decision',
    showAlternatives: true,
    expandedByDefault: false,
  },
};

/**
 * Example 2: Database Selection
 */
export const databaseExample: WidgetExample<TradeoffsCardInput, TradeoffsCardConfig> = {
  name: 'PostgreSQL vs DynamoDB',
  description: 'Database choice for high-traffic application',
  input: {
    title: 'Database: PostgreSQL vs DynamoDB',
    context:
      'Our application needs to handle millions of reads per day with occasional writes. We need strong consistency for user data but can tolerate eventual consistency for analytics.',
    pros: [
      'Horizontal scalability with minimal configuration',
      'Pay-per-request pricing aligns with usage',
      'Single-digit millisecond latency',
      'No server management required',
    ],
    cons: [
      'Limited query flexibility compared to SQL',
      'Requires careful data modeling upfront',
      'No ACID transactions across partitions',
      'Vendor lock-in with AWS',
    ],
    decision:
      'We will use DynamoDB for user-facing data and PostgreSQL for analytics. This hybrid approach gives us the best of both worlds.',
    alternatives: [
      {
        id: 'alt-postgres',
        name: 'PostgreSQL',
        description: 'Powerful open-source relational database with excellent SQL support.',
        pros: [
          'Rich query language (SQL)',
          'ACID transactions',
          'Mature ecosystem and tooling',
          'No vendor lock-in',
        ],
        cons: [
          'Requires more operational overhead',
          'Vertical scaling limits',
          'Sharding is complex',
          'Higher latency at scale',
        ],
      },
      {
        id: 'alt-mongodb',
        name: 'MongoDB',
        description:
          'Document database with flexible schema and horizontal scalability.',
        pros: [
          'Flexible schema',
          'Horizontal scaling built-in',
          'Rich query language',
          'Good developer experience',
        ],
        cons: [
          'Eventual consistency by default',
          'Memory-intensive',
          'Requires careful index management',
          'Can be expensive at scale',
        ],
      },
    ],
  },
  config: {
    name: 'Database Decision',
    showAlternatives: true,
    expandedByDefault: false,
  },
};

/**
 * Example 3: Monolith vs Microservices
 */
export const architectureExample: WidgetExample<
  TradeoffsCardInput,
  TradeoffsCardConfig
> = {
  name: 'Monolith vs Microservices',
  description: 'System architecture for startup MVP',
  input: {
    title: 'Architecture: Monolith vs Microservices',
    context:
      'We are building an MVP for a new SaaS product. The team is small (5 engineers) and we need to move fast. We expect rapid feature iteration and the product requirements are still evolving.',
    pros: [
      'Simple deployment and operations',
      'Easy to develop and debug locally',
      'No distributed systems complexity',
      'Faster development for small teams',
    ],
    cons: [
      'Harder to scale specific components',
      'Technology stack is locked in',
      'Risk of tight coupling over time',
      'Deployment requires full app restart',
    ],
    decision:
      'Start with a modular monolith. Build with clear module boundaries and well-defined interfaces. This gives us speed now with the option to extract microservices later if needed.',
    alternatives: [
      {
        id: 'alt-microservices',
        name: 'Microservices from Day 1',
        description:
          'Build as independent services from the start with clear service boundaries.',
        pros: [
          'Independent scaling of services',
          'Technology flexibility per service',
          'Parallel team development',
          'Isolation of failures',
        ],
        cons: [
          'Operational complexity (DevOps overhead)',
          'Distributed systems challenges',
          'Network latency and reliability',
          'Slower initial development',
        ],
      },
      {
        id: 'alt-serverless',
        name: 'Serverless Architecture',
        description:
          'Use cloud functions (Lambda, etc.) and managed services for all components.',
        pros: [
          'No server management',
          'Auto-scaling built-in',
          'Pay-per-use pricing',
          'Fast iteration',
        ],
        cons: [
          'Vendor lock-in',
          'Cold start latency',
          'Complex local development',
          'Limited execution time',
        ],
      },
    ],
  },
  config: {
    name: 'Architecture Decision',
    showAlternatives: true,
    expandedByDefault: true,
  },
};

export const tradeoffsCardExamples = [
  restVsGraphQLExample,
  databaseExample,
  architectureExample,
];
