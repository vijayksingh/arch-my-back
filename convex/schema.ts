import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

/**
 * Convex database schema for the architecture design tool.
 *
 * Tables:
 * - users: User accounts
 * - workspaces: User workspaces with view settings
 * - designs: Canvas designs with nodes, edges, and sections
 * - blocks: Notebook blocks (text, requirements, schema, api, lld)
 * - authTables: Authentication tables (sessions, accounts, etc.) from @convex-dev/auth
 */

export default defineSchema({
  ...authTables,
  /**
   * Users table
   * Stores user account information
   * Note: This extends the default Convex Auth users table with optional fields
   */
  users: defineTable({
    userId: v.optional(v.string()), // External auth provider user ID
    name: v.optional(v.string()),
    email: v.string(),
    createdAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_email', ['email']),

  /**
   * Workspaces table
   * Stores workspace settings and view preferences
   */
  workspaces: defineTable({
    userId: v.string(),
    title: v.string(),
    viewMode: v.union(
      v.literal('document'),
      v.literal('both'),
      v.literal('canvas')
    ),
    activeCanvasTool: v.union(
      v.literal('cursor'),
      v.literal('select'),
      v.literal('rectangle'),
      v.literal('circle'),
      v.literal('text')
    ),
    documentEditorMode: v.union(v.literal('edit'), v.literal('preview')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_updatedAt', ['userId', 'updatedAt']),

  /**
   * Designs table
   * Stores canvas data (nodes, edges) and canvas sections
   */
  designs: defineTable({
    workspaceId: v.id('workspaces'),
    // Canvas nodes (architecture components, shapes, section badges)
    nodes: v.array(
      v.object({
        id: v.string(),
        type: v.string(), // 'archComponent' | 'shapeRect' | 'shapeCircle' | 'shapeText' | 'sectionBadge'
        position: v.object({
          x: v.number(),
          y: v.number(),
        }),
        data: v.any(), // Node-specific data (varies by type)
        style: v.optional(v.any()), // Optional style object
        selected: v.optional(v.boolean()),
        dragging: v.optional(v.boolean()),
        measured: v.optional(v.object({ width: v.number(), height: v.number() })),
      })
    ),
    // Canvas edges (connections between nodes)
    edges: v.array(
      v.object({
        id: v.string(),
        source: v.string(),
        target: v.string(),
        type: v.optional(v.string()),
        data: v.optional(v.any()), // Edge-specific data (protocol, port, label)
        selected: v.optional(v.boolean()),
        sourceHandle: v.optional(v.string()),
        targetHandle: v.optional(v.string()),
      })
    ),
    // Canvas sections (groupings of nodes with bounds)
    sections: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        nodeIds: v.array(v.string()),
        bounds: v.object({
          x: v.number(),
          y: v.number(),
          width: v.number(),
          height: v.number(),
        }),
        createdAt: v.number(),
        linkedBlockId: v.optional(v.string()),
      })
    ),
    version: v.number(), // Schema version for migrations
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_updatedAt', ['workspaceId', 'updatedAt']),

  /**
   * Blocks table
   * Stores notebook blocks with type-specific data
   * Types: text, requirements, schema, api, lld
   */
  blocks: defineTable({
    workspaceId: v.id('workspaces'),
    blockId: v.string(), // Client-generated ID for referencing
    type: v.union(
      v.literal('text'),
      v.literal('requirements'),
      v.literal('schema'),
      v.literal('api'),
      v.literal('lld')
    ),
    sectionId: v.union(v.string(), v.null()), // Reference to canvas section
    // Block data structure varies by type:
    // - text: { markdown: string }
    // - requirements: { items: RequirementItem[] }
    // - schema: { tables: SchemaTable[] }
    // - api: { endpoints: ApiEndpoint[] }
    // - lld: { title: string, summary?: string, content: string, status?: string }
    data: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_blockId', ['workspaceId', 'blockId'])
    .index('by_workspaceId_type', ['workspaceId', 'type'])
    .index('by_workspaceId_createdAt', ['workspaceId', 'createdAt']),
});
