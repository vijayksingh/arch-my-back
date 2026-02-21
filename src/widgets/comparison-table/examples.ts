import type { WidgetExample } from '../types';
import type { ComparisonTableInput, ComparisonTableConfig } from './ComparisonTable';

/**
 * Example 1: AWS vs GCP vs Azure comparison
 */
export const cloudProvidersExample: WidgetExample<
  ComparisonTableInput,
  ComparisonTableConfig
> = {
  name: 'Cloud Providers Comparison',
  description: 'Compare AWS, GCP, and Azure across key features',
  input: {
    columns: [
      {
        id: 'aws',
        title: 'AWS',
        description: 'Amazon Web Services',
      },
      {
        id: 'gcp',
        title: 'GCP',
        description: 'Google Cloud Platform',
      },
      {
        id: 'azure',
        title: 'Azure',
        description: 'Microsoft Azure',
      },
    ],
    rows: [
      {
        id: 'compute',
        label: 'Compute',
        cells: {
          aws: 'EC2, Lambda, ECS',
          gcp: 'Compute Engine, Cloud Functions, GKE',
          azure: 'Virtual Machines, Functions, AKS',
        },
      },
      {
        id: 'storage',
        label: 'Storage',
        cells: {
          aws: 'S3, EBS, EFS',
          gcp: 'Cloud Storage, Persistent Disk',
          azure: 'Blob Storage, Disk Storage',
        },
      },
      {
        id: 'database',
        label: 'Database',
        cells: {
          aws: 'RDS, DynamoDB, Aurora',
          gcp: 'Cloud SQL, Firestore, Spanner',
          azure: 'SQL Database, Cosmos DB',
        },
      },
      {
        id: 'pricing',
        label: 'Pricing Model',
        cells: {
          aws: {
            type: 'pros-cons',
            content: 'Pay-as-you-go',
            pros: ['Flexible', 'No upfront cost'],
            cons: ['Can be expensive at scale'],
          },
          gcp: {
            type: 'pros-cons',
            content: 'Sustained use discounts',
            pros: ['Auto discounts', 'Committed use'],
            cons: ['Complex pricing'],
          },
          azure: {
            type: 'pros-cons',
            content: 'Pay-as-you-go + Reserved',
            pros: ['Hybrid options', 'Enterprise discounts'],
            cons: ['Requires planning'],
          },
        },
      },
      {
        id: 'docs',
        label: 'Documentation',
        cells: {
          aws: {
            type: 'link',
            content: 'AWS Documentation',
            url: 'https://docs.aws.amazon.com/',
          },
          gcp: {
            type: 'link',
            content: 'GCP Documentation',
            url: 'https://cloud.google.com/docs',
          },
          azure: {
            type: 'link',
            content: 'Azure Documentation',
            url: 'https://docs.microsoft.com/azure/',
          },
        },
      },
    ],
  },
  config: {
    name: 'Cloud Providers Comparison',
    striped: true,
    highlightOnHover: true,
    sortable: false,
  },
};

/**
 * Example 2: REST vs GraphQL vs gRPC comparison
 */
export const apiPatternsExample: WidgetExample<
  ComparisonTableInput,
  ComparisonTableConfig
> = {
  name: 'API Patterns Comparison',
  description: 'Compare REST, GraphQL, and gRPC API patterns',
  input: {
    columns: [
      {
        id: 'rest',
        title: 'REST',
        description: 'REpresentational State Transfer',
      },
      {
        id: 'graphql',
        title: 'GraphQL',
        description: 'Query Language for APIs',
      },
      {
        id: 'grpc',
        title: 'gRPC',
        description: 'Google Remote Procedure Call',
      },
    ],
    rows: [
      {
        id: 'protocol',
        label: 'Protocol',
        cells: {
          rest: 'HTTP/HTTPS',
          graphql: 'HTTP/HTTPS',
          grpc: 'HTTP/2',
        },
      },
      {
        id: 'format',
        label: 'Data Format',
        cells: {
          rest: 'JSON, XML',
          graphql: 'JSON',
          grpc: 'Protocol Buffers',
        },
      },
      {
        id: 'strengths',
        label: 'Strengths',
        cells: {
          rest: {
            type: 'pros-cons',
            content: 'REST',
            pros: ['Simple', 'Cacheable', 'Well understood'],
            cons: ['Over/under-fetching', 'Multiple endpoints'],
          },
          graphql: {
            type: 'pros-cons',
            content: 'GraphQL',
            pros: ['Precise queries', 'Single endpoint', 'Type system'],
            cons: ['Complexity', 'Caching harder'],
          },
          grpc: {
            type: 'pros-cons',
            content: 'gRPC',
            pros: ['Fast', 'Bi-directional streaming', 'Type-safe'],
            cons: ['Browser support', 'Learning curve'],
          },
        },
      },
      {
        id: 'use-case',
        label: 'Best For',
        cells: {
          rest: 'Public APIs, CRUD operations, simple services',
          graphql: 'Complex data requirements, mobile apps, aggregation',
          grpc: 'Microservices, real-time communication, internal APIs',
        },
      },
      {
        id: 'example',
        label: 'Example',
        cells: {
          rest: {
            type: 'code',
            content: 'GET /users/123\nPOST /users',
          },
          graphql: {
            type: 'code',
            content: 'query { user(id: 123) { name email } }',
          },
          grpc: {
            type: 'code',
            content: 'service UserService {\n  rpc GetUser(UserRequest) returns (User);\n}',
          },
        },
      },
    ],
  },
  config: {
    name: 'API Patterns',
    striped: true,
    highlightOnHover: true,
    sortable: false,
    maxWidth: '1200px',
  },
};

/**
 * Example 3: Frontend Framework Comparison
 */
export const frontendFrameworksExample: WidgetExample<
  ComparisonTableInput,
  ComparisonTableConfig
> = {
  name: 'Frontend Frameworks',
  description: 'Compare React, Vue, and Svelte',
  input: {
    columns: [
      {
        id: 'react',
        title: 'React',
        description: 'Meta (Facebook)',
      },
      {
        id: 'vue',
        title: 'Vue',
        description: 'Evan You',
      },
      {
        id: 'svelte',
        title: 'Svelte',
        description: 'Rich Harris',
      },
    ],
    rows: [
      {
        id: 'paradigm',
        label: 'Paradigm',
        cells: {
          react: 'Component-based, Functional',
          vue: 'Component-based, Progressive',
          svelte: 'Compiler-based, Reactive',
        },
      },
      {
        id: 'learning',
        label: 'Learning Curve',
        cells: {
          react: {
            type: 'pros-cons',
            content: 'React',
            pros: ['Simple core', 'Large ecosystem'],
            cons: ['JSX syntax', 'Hooks complexity'],
          },
          vue: {
            type: 'pros-cons',
            content: 'Vue',
            pros: ['Gentle curve', 'Good docs'],
            cons: ['Multiple ways to do things'],
          },
          svelte: {
            type: 'pros-cons',
            content: 'Svelte',
            pros: ['Less boilerplate', 'Familiar syntax'],
            cons: ['Smaller ecosystem'],
          },
        },
      },
      {
        id: 'bundle',
        label: 'Bundle Size',
        cells: {
          react: '~40KB (React + ReactDOM)',
          vue: '~33KB',
          svelte: '~2KB (compiled)',
        },
      },
    ],
  },
  config: {
    name: 'Frontend Frameworks',
    striped: false,
    highlightOnHover: true,
    sortable: false,
  },
};

export const comparisonTableExamples = [
  cloudProvidersExample,
  apiPatternsExample,
  frontendFrameworksExample,
];
