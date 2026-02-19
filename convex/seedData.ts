/**
 * Seed Data Script
 *
 * This file contains example workspace templates that can be used to
 * populate a new account with sample data.
 *
 * To use this script, import and call the seed functions from a Convex mutation.
 */

/**
 * Test User Credentials for Development
 *
 * To create a test user:
 * 1. Navigate to http://localhost:5173
 * 2. Click "Sign up"
 * 3. Use these credentials:
 *    - Email: test@example.com
 *    - Password: testpassword123
 *
 * The Convex Auth Password provider will automatically create the user account.
 *
 * Alternatively, you can programmatically sign up using the signIn mutation:
 *
 * ```typescript
 * import { signIn } from "convex/auth";
 *
 * await signIn('password', {
 *   email: 'test@example.com',
 *   password: 'testpassword123',
 *   flow: 'signUp'
 * });
 * ```
 */

import { mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Helper function to seed e-commerce workspace
 */
async function seedEcommerceWorkspaceHandler(ctx: MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const userId = identity.subject;

    // Create workspace
    const workspaceId = await ctx.db.insert('workspaces', {
      userId,
      title: 'E-commerce Architecture',
      viewMode: 'both',
      activeCanvasTool: 'cursor',
      documentEditorMode: 'preview',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create design with nodes and edges
    await ctx.db.insert('designs', {
      workspaceId,
      nodes: [
        // Frontend
        {
          id: 'frontend',
          type: 'archComponent',
          position: { x: 100, y: 100 },
          data: {
            label: 'Web Frontend',
            type: 'frontend',
            technology: 'React + Next.js',
          },
        },
        // API Gateway
        {
          id: 'api-gateway',
          type: 'archComponent',
          position: { x: 400, y: 100 },
          data: {
            label: 'API Gateway',
            type: 'service',
            technology: 'Kong / Nginx',
          },
        },
        // Product Service
        {
          id: 'product-service',
          type: 'archComponent',
          position: { x: 700, y: 50 },
          data: {
            label: 'Product Service',
            type: 'service',
            technology: 'Node.js + Express',
          },
        },
        // Order Service
        {
          id: 'order-service',
          type: 'archComponent',
          position: { x: 700, y: 200 },
          data: {
            label: 'Order Service',
            type: 'service',
            technology: 'Node.js + Express',
          },
        },
        // Product DB
        {
          id: 'product-db',
          type: 'archComponent',
          position: { x: 1000, y: 50 },
          data: {
            label: 'Product DB',
            type: 'database',
            technology: 'PostgreSQL',
          },
        },
        // Order DB
        {
          id: 'order-db',
          type: 'archComponent',
          position: { x: 1000, y: 200 },
          data: {
            label: 'Order DB',
            type: 'database',
            technology: 'PostgreSQL',
          },
        },
        // Message Queue
        {
          id: 'message-queue',
          type: 'archComponent',
          position: { x: 700, y: 350 },
          data: {
            label: 'Message Queue',
            type: 'queue',
            technology: 'RabbitMQ',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'frontend',
          target: 'api-gateway',
          data: { protocol: 'HTTPS', label: 'REST API' },
        },
        {
          id: 'e2',
          source: 'api-gateway',
          target: 'product-service',
          data: { protocol: 'HTTP', label: 'Internal API' },
        },
        {
          id: 'e3',
          source: 'api-gateway',
          target: 'order-service',
          data: { protocol: 'HTTP', label: 'Internal API' },
        },
        {
          id: 'e4',
          source: 'product-service',
          target: 'product-db',
          data: { protocol: 'TCP', port: '5432' },
        },
        {
          id: 'e5',
          source: 'order-service',
          target: 'order-db',
          data: { protocol: 'TCP', port: '5432' },
        },
        {
          id: 'e6',
          source: 'order-service',
          target: 'message-queue',
          data: { protocol: 'AMQP', label: 'Publish Events' },
        },
      ],
      sections: [
        {
          id: 'section-1',
          title: 'Frontend Layer',
          nodeIds: ['frontend'],
          bounds: { x: 50, y: 50, width: 200, height: 150 },
          createdAt: Date.now(),
          linkedBlockId: 'block-frontend',
        },
        {
          id: 'section-2',
          title: 'API Gateway',
          nodeIds: ['api-gateway'],
          bounds: { x: 350, y: 50, width: 200, height: 150 },
          createdAt: Date.now(),
          linkedBlockId: 'block-gateway',
        },
        {
          id: 'section-3',
          title: 'Microservices',
          nodeIds: ['product-service', 'order-service', 'message-queue'],
          bounds: { x: 650, y: 0, width: 250, height: 450 },
          createdAt: Date.now(),
          linkedBlockId: 'block-services',
        },
      ],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create documentation blocks
    await ctx.db.insert('blocks', {
      workspaceId,
      blockId: 'block-frontend',
      type: 'text',
      sectionId: 'section-1',
      data: {
        markdown: `# Frontend Layer

Built with React and Next.js for server-side rendering and optimal performance.

## Key Features
- Server-side rendering (SSR)
- Static site generation (SSG)
- Image optimization
- API routes for BFF pattern

## Communication
- REST API calls to API Gateway
- WebSocket connection for real-time updates
`,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert('blocks', {
      workspaceId,
      blockId: 'block-gateway',
      type: 'api',
      sectionId: 'section-2',
      data: {
        endpoints: [
          {
            method: 'GET',
            path: '/api/products',
            description: 'List all products',
            requestBody: null,
            responseBody: 'Array<Product>',
          },
          {
            method: 'POST',
            path: '/api/orders',
            description: 'Create a new order',
            requestBody: 'CreateOrderRequest',
            responseBody: 'Order',
          },
          {
            method: 'GET',
            path: '/api/orders/:id',
            description: 'Get order by ID',
            requestBody: null,
            responseBody: 'Order',
          },
        ],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert('blocks', {
      workspaceId,
      blockId: 'block-services',
      type: 'lld',
      sectionId: 'section-3',
      data: {
        title: 'Microservices Architecture',
        summary: 'Domain-driven design with independent services',
        content: `## Service Communication

Services communicate via:
1. Synchronous REST APIs for queries
2. Asynchronous message queues for events

## Data Ownership
Each service owns its database:
- Product Service -> Product DB
- Order Service -> Order DB

## Event-Driven Architecture
Order Service publishes events to message queue:
- OrderCreated
- OrderShipped
- OrderDelivered

Other services can subscribe to these events.
`,
        status: 'draft',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { workspaceId, message: 'E-commerce workspace seeded successfully' };
}

/**
 * Example workspace template: E-commerce Architecture
 *
 * A complete microservices architecture for an e-commerce platform
 */
export const seedEcommerceWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    return seedEcommerceWorkspaceHandler(ctx);
  },
});

/**
 * Helper function to seed three-tier workspace
 */
async function seedThreeTierWorkspaceHandler(ctx: MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const userId = identity.subject;

    // Create workspace
    const workspaceId = await ctx.db.insert('workspaces', {
      userId,
      title: 'Three-Tier Web App',
      viewMode: 'both',
      activeCanvasTool: 'cursor',
      documentEditorMode: 'preview',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create design
    await ctx.db.insert('designs', {
      workspaceId,
      nodes: [
        {
          id: 'web-client',
          type: 'archComponent',
          position: { x: 200, y: 50 },
          data: {
            label: 'Web Client',
            type: 'frontend',
            technology: 'React SPA',
          },
        },
        {
          id: 'load-balancer',
          type: 'archComponent',
          position: { x: 200, y: 200 },
          data: {
            label: 'Load Balancer',
            type: 'infrastructure',
            technology: 'AWS ALB',
          },
        },
        {
          id: 'app-server-1',
          type: 'archComponent',
          position: { x: 100, y: 350 },
          data: {
            label: 'App Server 1',
            type: 'service',
            technology: 'Node.js',
          },
        },
        {
          id: 'app-server-2',
          type: 'archComponent',
          position: { x: 300, y: 350 },
          data: {
            label: 'App Server 2',
            type: 'service',
            technology: 'Node.js',
          },
        },
        {
          id: 'cache',
          type: 'archComponent',
          position: { x: 500, y: 350 },
          data: {
            label: 'Redis Cache',
            type: 'cache',
            technology: 'Redis',
          },
        },
        {
          id: 'database',
          type: 'archComponent',
          position: { x: 200, y: 500 },
          data: {
            label: 'Database',
            type: 'database',
            technology: 'PostgreSQL',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'web-client',
          target: 'load-balancer',
          data: { protocol: 'HTTPS' },
        },
        {
          id: 'e2',
          source: 'load-balancer',
          target: 'app-server-1',
          data: { protocol: 'HTTP' },
        },
        {
          id: 'e3',
          source: 'load-balancer',
          target: 'app-server-2',
          data: { protocol: 'HTTP' },
        },
        {
          id: 'e4',
          source: 'app-server-1',
          target: 'cache',
          data: { protocol: 'TCP', port: '6379' },
        },
        {
          id: 'e5',
          source: 'app-server-2',
          target: 'cache',
          data: { protocol: 'TCP', port: '6379' },
        },
        {
          id: 'e6',
          source: 'app-server-1',
          target: 'database',
          data: { protocol: 'TCP', port: '5432' },
        },
        {
          id: 'e7',
          source: 'app-server-2',
          target: 'database',
          data: { protocol: 'TCP', port: '5432' },
        },
      ],
      sections: [
        {
          id: 'presentation',
          title: 'Presentation Tier',
          nodeIds: ['web-client'],
          bounds: { x: 150, y: 0, width: 200, height: 150 },
          createdAt: Date.now(),
        },
        {
          id: 'application',
          title: 'Application Tier',
          nodeIds: ['load-balancer', 'app-server-1', 'app-server-2', 'cache'],
          bounds: { x: 50, y: 150, width: 550, height: 250 },
          createdAt: Date.now(),
        },
        {
          id: 'data',
          title: 'Data Tier',
          nodeIds: ['database'],
          bounds: { x: 150, y: 450, width: 200, height: 150 },
          createdAt: Date.now(),
        },
      ],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create requirements block
    await ctx.db.insert('blocks', {
      workspaceId,
      blockId: 'requirements',
      type: 'requirements',
      sectionId: null,
      data: {
        items: [
          {
            id: 'req-1',
            priority: 'high',
            status: 'completed',
            description: 'Support 10,000 concurrent users',
          },
          {
            id: 'req-2',
            priority: 'high',
            status: 'completed',
            description: 'Response time under 200ms for 95th percentile',
          },
          {
            id: 'req-3',
            priority: 'medium',
            status: 'in-progress',
            description: 'Horizontal scaling for application tier',
          },
          {
            id: 'req-4',
            priority: 'medium',
            status: 'planned',
            description: 'Redis cache for frequently accessed data',
          },
        ],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { workspaceId, message: 'Three-tier workspace seeded successfully' };
}

/**
 * Example workspace template: Three-Tier Web Application
 *
 * A classic three-tier architecture (presentation, business logic, data)
 */
export const seedThreeTierWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    return seedThreeTierWorkspaceHandler(ctx);
  },
});

/**
 * Helper function to seed serverless workspace
 */
async function seedServerlessWorkspaceHandler(ctx: MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const userId = identity.subject;

    // Create workspace
    const workspaceId = await ctx.db.insert('workspaces', {
      userId,
      title: 'Serverless Architecture',
      viewMode: 'canvas',
      activeCanvasTool: 'cursor',
      documentEditorMode: 'edit',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create design
    await ctx.db.insert('designs', {
      workspaceId,
      nodes: [
        {
          id: 'cdn',
          type: 'archComponent',
          position: { x: 100, y: 50 },
          data: {
            label: 'CloudFront CDN',
            type: 'infrastructure',
            technology: 'AWS CloudFront',
          },
        },
        {
          id: 's3',
          type: 'archComponent',
          position: { x: 100, y: 200 },
          data: {
            label: 'S3 Static Hosting',
            type: 'storage',
            technology: 'AWS S3',
          },
        },
        {
          id: 'api-gateway',
          type: 'archComponent',
          position: { x: 400, y: 50 },
          data: {
            label: 'API Gateway',
            type: 'service',
            technology: 'AWS API Gateway',
          },
        },
        {
          id: 'lambda-1',
          type: 'archComponent',
          position: { x: 700, y: 0 },
          data: {
            label: 'User Lambda',
            type: 'function',
            technology: 'AWS Lambda',
          },
        },
        {
          id: 'lambda-2',
          type: 'archComponent',
          position: { x: 700, y: 120 },
          data: {
            label: 'Order Lambda',
            type: 'function',
            technology: 'AWS Lambda',
          },
        },
        {
          id: 'dynamodb',
          type: 'archComponent',
          position: { x: 1000, y: 50 },
          data: {
            label: 'DynamoDB',
            type: 'database',
            technology: 'AWS DynamoDB',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'cdn',
          target: 's3',
          data: { label: 'Static Assets' },
        },
        {
          id: 'e2',
          source: 'cdn',
          target: 'api-gateway',
          data: { label: 'API Calls' },
        },
        {
          id: 'e3',
          source: 'api-gateway',
          target: 'lambda-1',
          data: { label: 'Invoke' },
        },
        {
          id: 'e4',
          source: 'api-gateway',
          target: 'lambda-2',
          data: { label: 'Invoke' },
        },
        {
          id: 'e5',
          source: 'lambda-1',
          target: 'dynamodb',
        },
        {
          id: 'e6',
          source: 'lambda-2',
          target: 'dynamodb',
        },
      ],
      sections: [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { workspaceId, message: 'Serverless workspace seeded successfully' };
}

/**
 * Example workspace template: Serverless Architecture
 */
export const seedServerlessWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    return seedServerlessWorkspaceHandler(ctx);
  },
});

/**
 * Utility function to seed all example workspaces
 */
export const seedAllExamples = mutation({
  args: {},
  handler: async (ctx) => {
    const results = [];

    try {
      const ecommerce = await seedEcommerceWorkspaceHandler(ctx);
      results.push(ecommerce);
    } catch (error) {
      results.push({ error: 'E-commerce seeding failed', details: error });
    }

    try {
      const threeTier = await seedThreeTierWorkspaceHandler(ctx);
      results.push(threeTier);
    } catch (error) {
      results.push({ error: 'Three-tier seeding failed', details: error });
    }

    try {
      const serverless = await seedServerlessWorkspaceHandler(ctx);
      results.push(serverless);
    } catch (error) {
      results.push({ error: 'Serverless seeding failed', details: error });
    }

    return results;
  },
});
