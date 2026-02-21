/// <reference types="node" />
import { v } from 'convex/values';
import { action, query, mutation } from './_generated/server';
import { api } from './_generated/api';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { ArchspecDocumentSchema } from '../src/dsl/archspecZodSchema';

/**
 * AI Architecture Generation Action
 *
 * Generates architecture diagrams from natural language prompts using Claude.
 *
 * IMPORTANT: This is a Convex Action (not mutation/query) because it needs to:
 * 1. Make external HTTP calls to Anthropic API
 * 2. Use the AI SDK which requires network access
 *
 * Environment Setup:
 * - REQUIRED: Set ANTHROPIC_API_KEY in Convex dashboard
 * - Steps:
 *   1. Go to Convex dashboard: https://dashboard.convex.dev
 *   2. Select your project
 *   3. Navigate to Settings > Environment Variables
 *   4. Add: ANTHROPIC_API_KEY = sk-ant-api03-...
 *   5. Deploy: `npx convex deploy`
 * - Get API key from: https://console.anthropic.com/settings/keys
 * - API key format: sk-ant-api03-...
 *
 * Rate Limiting: 10 generations per hour per user
 */

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;

/**
 * System prompt with few-shot examples of archspec JSON format
 */
const SYSTEM_PROMPT = `You are an expert software architect. Convert user descriptions into valid archspec JSON format.

The archspec format has this structure:
{
  "version": "1.0",
  "metadata": {
    "title": "System Name",
    "description": "Brief description"
  },
  "components": [
    {
      "id": "unique-id",
      "name": "Component Name",
      "type": "service|database|queue|cache|api|frontend|backend",
      "description": "What this component does",
      "technology": "Tech stack (optional)"
    }
  ],
  "connections": [
    {
      "id": "conn-id",
      "source": "component-id",
      "target": "component-id",
      "protocol": "HTTP|gRPC|WebSocket|etc (optional)",
      "description": "What flows through this connection (optional)"
    }
  ]
}

Example 1 - E-commerce System:
User: "Build an e-commerce platform with React frontend, Node.js API, PostgreSQL database, and Redis cache"
Output:
{
  "version": "1.0",
  "metadata": {
    "title": "E-commerce Platform",
    "description": "Online shopping system with caching"
  },
  "components": [
    {
      "id": "frontend",
      "name": "Web Frontend",
      "type": "frontend",
      "description": "Customer-facing shopping interface",
      "technology": "React"
    },
    {
      "id": "api",
      "name": "API Server",
      "type": "backend",
      "description": "REST API for product catalog and orders",
      "technology": "Node.js + Express"
    },
    {
      "id": "db",
      "name": "Product Database",
      "type": "database",
      "description": "Stores products, orders, and user data",
      "technology": "PostgreSQL"
    },
    {
      "id": "cache",
      "name": "Session Cache",
      "type": "cache",
      "description": "Session storage and product catalog cache",
      "technology": "Redis"
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "source": "frontend",
      "target": "api",
      "protocol": "HTTP",
      "description": "API requests"
    },
    {
      "id": "conn-2",
      "source": "api",
      "target": "db",
      "protocol": "PostgreSQL",
      "description": "Data queries"
    },
    {
      "id": "conn-3",
      "source": "api",
      "target": "cache",
      "protocol": "Redis",
      "description": "Session and cache operations"
    }
  ]
}

Example 2 - Microservices System:
User: "Microservices with user service, payment service, notification service, and a message queue"
Output:
{
  "version": "1.0",
  "metadata": {
    "title": "Microservices Architecture",
    "description": "Event-driven microservices system"
  },
  "components": [
    {
      "id": "user-svc",
      "name": "User Service",
      "type": "service",
      "description": "User authentication and profile management"
    },
    {
      "id": "payment-svc",
      "name": "Payment Service",
      "type": "service",
      "description": "Payment processing and billing"
    },
    {
      "id": "notif-svc",
      "name": "Notification Service",
      "type": "service",
      "description": "Email and push notifications"
    },
    {
      "id": "queue",
      "name": "Message Queue",
      "type": "queue",
      "description": "Event bus for service communication",
      "technology": "RabbitMQ"
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "source": "user-svc",
      "target": "queue",
      "protocol": "AMQP",
      "description": "User events"
    },
    {
      "id": "conn-2",
      "source": "payment-svc",
      "target": "queue",
      "protocol": "AMQP",
      "description": "Payment events"
    },
    {
      "id": "conn-3",
      "source": "queue",
      "target": "notif-svc",
      "protocol": "AMQP",
      "description": "Notification triggers"
    }
  ]
}

Now convert the user's prompt into valid archspec JSON following this format exactly.`;

/**
 * Generate architecture from natural language prompt
 */
export const generateArchitecture = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const userId = identity.subject;

    // 2. Validate prompt
    if (!args.prompt.trim() || args.prompt.trim().length < 10) {
      throw new Error('Prompt must be at least 10 characters');
    }

    // 3. Rate limiting check
    const oneHourAgo = Date.now() - RATE_LIMIT_WINDOW_MS;
    const recentGenerations = await ctx.runQuery(api.aiGeneration.countRecentGenerations, {
      userId,
      since: oneHourAgo,
    });

    if (recentGenerations >= RATE_LIMIT_MAX) {
      const errorMsg = `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} generations per hour.`;

      // Log the failed attempt
      await ctx.runMutation(api.aiGeneration.logGeneration, {
        userId,
        prompt: args.prompt.trim(),
        generatedContent: '',
        model: 'claude-3-5-sonnet-20241022',
        success: false,
        errorMessage: errorMsg,
      });

      throw new Error(errorMsg);
    }

    // 4. Call AI SDK to generate architecture
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment variables');
    }

    let generatedContent = '';
    let success = false;
    let errorMessage: string | undefined;
    let tokensUsed: number | undefined;

    try {
      const result = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: SYSTEM_PROMPT,
        prompt: args.prompt.trim(),
        temperature: 0.7,
        maxOutputTokens: 2000,
      });

      generatedContent = result.text;
      tokensUsed = result.usage.totalTokens;

      // 5. Validate against Zod schema
      const parsed = JSON.parse(generatedContent);
      const validated = ArchspecDocumentSchema.parse(parsed);

      // Re-stringify the validated object to ensure clean JSON
      generatedContent = JSON.stringify(validated, null, 2);
      success = true;

    } catch (error: any) {
      success = false;
      errorMessage = error.message || 'Unknown error during generation';

      // If it's a validation error, provide more context
      if (error.name === 'ZodError') {
        errorMessage = `Generated content failed validation: ${error.message}`;
      }
    }

    // 6. Log to audit trail
    await ctx.runMutation(api.aiGeneration.logGeneration, {
      userId,
      prompt: args.prompt.trim(),
      generatedContent,
      model: 'claude-3-5-sonnet-20241022',
      tokensUsed,
      success,
      errorMessage,
    });

    // 7. Return result or throw error
    if (!success) {
      throw new Error(errorMessage || 'Generation failed');
    }

    return {
      content: generatedContent,
      tokensUsed,
    };
  },
});

/**
 * Query: Count recent generations for rate limiting
 */
export const countRecentGenerations = query({
  args: {
    userId: v.string(),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    const generations = await ctx.db
      .query('aiGenerations')
      .withIndex('by_user', (q) =>
        q.eq('userId', args.userId).gt('createdAt', args.since)
      )
      .collect();

    return generations.length;
  },
});

/**
 * Mutation: Log AI generation to audit trail
 */
export const logGeneration = mutation({
  args: {
    userId: v.string(),
    prompt: v.string(),
    generatedContent: v.string(),
    model: v.string(),
    tokensUsed: v.optional(v.number()),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('aiGenerations', {
      userId: args.userId,
      prompt: args.prompt,
      generatedContent: args.generatedContent,
      model: args.model,
      tokensUsed: args.tokensUsed,
      success: args.success,
      errorMessage: args.errorMessage,
      createdAt: Date.now(),
    });
  },
});
