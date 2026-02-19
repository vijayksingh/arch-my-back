import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { auth } from './auth';

/**
 * Notebook block operations
 * Handles CRUD for text, requirements, schema, api, and lld blocks
 */

/**
 * Create a new notebook block
 */
export const createBlock = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    blockId: v.string(),
    type: v.union(
      v.literal('text'),
      v.literal('requirements'),
      v.literal('schema'),
      v.literal('api'),
      v.literal('lld')
    ),
    sectionId: v.union(v.string(), v.null()),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Unauthorized: Must be logged in to create blocks');
    }

    // Verify workspace ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    if (workspace.userId !== userId) {
      throw new Error('Unauthorized: Cannot access this workspace');
    }

    // Check if block with this blockId already exists
    const existing = await ctx.db
      .query('blocks')
      .withIndex('by_workspaceId_blockId', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('blockId', args.blockId)
      )
      .first();

    if (existing) {
      throw new Error('Block with this ID already exists');
    }

    const now = Date.now();

    // Create block
    const id = await ctx.db.insert('blocks', {
      workspaceId: args.workspaceId,
      blockId: args.blockId,
      type: args.type,
      sectionId: args.sectionId,
      data: args.data,
      createdAt: now,
      updatedAt: now,
    });

    return { id, blockId: args.blockId };
  },
});

/**
 * Update an existing notebook block
 */
export const updateBlock = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    blockId: v.string(),
    data: v.optional(v.any()),
    sectionId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Unauthorized: Must be logged in to update blocks');
    }

    // Verify workspace ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    if (workspace.userId !== userId) {
      throw new Error('Unauthorized: Cannot access this workspace');
    }

    // Find block
    const block = await ctx.db
      .query('blocks')
      .withIndex('by_workspaceId_blockId', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('blockId', args.blockId)
      )
      .first();

    if (!block) {
      throw new Error('Block not found');
    }

    // Update block
    const updates: {
      data?: any;
      sectionId?: string | null;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.data !== undefined) {
      updates.data = args.data;
    }
    if (args.sectionId !== undefined) {
      updates.sectionId = args.sectionId;
    }

    await ctx.db.patch(block._id, updates);

    return { success: true, blockId: args.blockId };
  },
});

/**
 * Delete a notebook block
 */
export const deleteBlock = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    blockId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Unauthorized: Must be logged in to delete blocks');
    }

    // Verify workspace ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    if (workspace.userId !== userId) {
      throw new Error('Unauthorized: Cannot access this workspace');
    }

    // Find block
    const block = await ctx.db
      .query('blocks')
      .withIndex('by_workspaceId_blockId', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('blockId', args.blockId)
      )
      .first();

    if (!block) {
      throw new Error('Block not found');
    }

    // Delete block
    await ctx.db.delete(block._id);

    return { success: true, blockId: args.blockId };
  },
});

/**
 * Get all blocks for a workspace
 * Optionally filter by type
 */
export const getBlocks = query({
  args: {
    workspaceId: v.id('workspaces'),
    type: v.optional(
      v.union(
        v.literal('text'),
        v.literal('requirements'),
        v.literal('schema'),
        v.literal('api'),
        v.literal('lld')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Unauthorized: Must be logged in to view blocks');
    }

    // Verify workspace ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    if (workspace.userId !== userId) {
      throw new Error('Unauthorized: Cannot access this workspace');
    }

    // Query blocks
    let blocks;
    if (args.type !== undefined) {
      // Filter by type if specified
      blocks = await ctx.db
        .query('blocks')
        .withIndex('by_workspaceId_type', (q) =>
          q.eq('workspaceId', args.workspaceId).eq('type', args.type!)
        )
        .collect();
    } else {
      // Get all blocks for workspace
      blocks = await ctx.db
        .query('blocks')
        .withIndex('by_workspaceId', (q) =>
          q.eq('workspaceId', args.workspaceId)
        )
        .collect();
    }

    // Return blocks in creation order
    return blocks
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((block) => ({
        id: block._id,
        blockId: block.blockId,
        type: block.type,
        sectionId: block.sectionId,
        data: block.data,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      }));
  },
});

/**
 * Get a single block by blockId
 */
export const getBlock = query({
  args: {
    workspaceId: v.id('workspaces'),
    blockId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Unauthorized: Must be logged in to view blocks');
    }

    // Verify workspace ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    if (workspace.userId !== userId) {
      throw new Error('Unauthorized: Cannot access this workspace');
    }

    // Find block
    const block = await ctx.db
      .query('blocks')
      .withIndex('by_workspaceId_blockId', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('blockId', args.blockId)
      )
      .first();

    if (!block) {
      return null;
    }

    return {
      id: block._id,
      blockId: block.blockId,
      type: block.type,
      sectionId: block.sectionId,
      data: block.data,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    };
  },
});
