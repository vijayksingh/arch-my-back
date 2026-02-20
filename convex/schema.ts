import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import {
  canvasNodeValidator,
  canvasEdgeValidator,
  canvasSectionValidator,
  viewportValidator,
  blockValidator,
} from './validators';

/**
 * Convex database schema for the architecture design tool.
 *
 * Tables:
 * - users: User accounts
 * - workspaces: User workspaces with view settings (legacy)
 * - designs: Canvas designs with nodes, edges, and sections (legacy)
 * - blocks: Notebook blocks (text, requirements, schema, api, lld) (legacy)
 * - folders: Design organization folders (new)
 * - newDesigns: Design metadata (new - replaces workspace concept)
 * - designCanvases: Canvas data per design (new - heavy data separated)
 * - designBlocks: Document blocks per design (new - heavy data separated)
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

  // --- NEW SCHEMA (domain model refactor) ---

  /**
   * Folders table
   * Organizes designs into flat folders (1 level)
   */
  folders: defineTable({
    ownerId: v.string(),
    title: v.string(),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerId', ['ownerId'])
    .index('by_ownerId_updatedAt', ['ownerId', 'updatedAt']),

  /**
   * New Designs table (metadata only)
   * Replaces workspace concept - design is the primary "file"
   * Note: Named "newDesigns" to avoid conflict with legacy "designs" table during migration
   */
  newDesigns: defineTable({
    ownerId: v.string(),
    folderId: v.optional(v.id('folders')),
    title: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    thumbnailStorageId: v.optional(v.id('_storage')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerId', ['ownerId'])
    .index('by_ownerId_updatedAt', ['ownerId', 'updatedAt'])
    .index('by_folderId', ['folderId'])
    .searchIndex('search_title', { searchField: 'title' }),

  /**
   * Design Canvases table
   * Heavy data - canvas nodes, edges, sections, viewport
   * Loaded on-demand when opening a design
   */
  designCanvases: defineTable({
    designId: v.id('newDesigns'),
    nodes: v.array(canvasNodeValidator),
    edges: v.array(canvasEdgeValidator),
    sections: v.array(canvasSectionValidator),
    viewport: v.optional(viewportValidator),
    version: v.number(),
    updatedAt: v.number(),
  }).index('by_designId', ['designId']),

  /**
   * Design Blocks table
   * Heavy data - document blocks (text, requirements, schema, api, lld)
   * Loaded on-demand when opening a design
   * Stored as single array for simplicity (blocks always loaded together)
   */
  designBlocks: defineTable({
    designId: v.id('newDesigns'),
    blocks: v.array(blockValidator),
    updatedAt: v.number(),
  }).index('by_designId', ['designId']),

  /**
   * AI Generations table
   * Audit trail for AI-generated architecture diagrams
   * Tracks prompts, outputs, token usage, and rate limiting
   */
  aiGenerations: defineTable({
    userId: v.string(), // User who made the request
    prompt: v.string(), // User's natural language prompt
    generatedContent: v.string(), // Generated archspec JSON document
    model: v.string(), // AI model used (e.g., "claude-3-5-sonnet-20241022")
    tokensUsed: v.optional(v.number()), // Token count for billing/analytics
    success: v.boolean(), // Whether generation succeeded
    errorMessage: v.optional(v.string()), // Error details if failed
    createdAt: v.number(), // Unix timestamp
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_creation_time', ['createdAt']),
});
