import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Design operations (metadata)
 * Handles CRUD for design files (the central "file" concept)
 */

/**
 * Create a new design
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    folderId: v.optional(v.id('folders')),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Validate title
    if (!args.title.trim()) {
      throw new Error('Title cannot be empty');
    }

    // If folderId provided, verify it exists and is owned by user
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }
      if (folder.ownerId !== identity.subject) {
        throw new Error('Unauthorized: folder does not belong to you');
      }
    }

    const now = Date.now();

    const designId = await ctx.db.insert('newDesigns', {
      ownerId: identity.subject,
      folderId: args.folderId,
      title: args.title.trim(),
      description: args.description,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });

    return designId;
  },
});

/**
 * Get a single design by ID
 */
export const get = query({
  args: {
    designId: v.id('newDesigns'),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get design
    const design = await ctx.db.get(args.designId);
    if (!design) {
      throw new Error('Design not found');
    }

    // Check authorization (owner or public)
    if (design.ownerId !== identity.subject && !design.isPublic) {
      throw new Error('Unauthorized');
    }

    return design;
  },
});

/**
 * List all designs for the authenticated user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Query designs for this user, ordered by most recently updated
    const designs = await ctx.db
      .query('newDesigns')
      .withIndex('by_ownerId_updatedAt', (q) => q.eq('ownerId', identity.subject))
      .order('desc')
      .collect();

    return designs;
  },
});

/**
 * List designs in a specific folder
 */
export const listByFolder = query({
  args: {
    folderId: v.union(v.id('folders'), v.null()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // If folderId provided, verify it exists and is owned by user
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }
      if (folder.ownerId !== identity.subject) {
        throw new Error('Unauthorized');
      }
    }

    // Query designs in this folder
    const designs = await ctx.db
      .query('newDesigns')
      .withIndex('by_folderId', (q) => q.eq('folderId', args.folderId ?? undefined))
      .collect();

    // Filter by owner (since folder can be null for root)
    return designs
      .filter((d) => d.ownerId === identity.subject)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Update design metadata (title, description)
 */
export const update = mutation({
  args: {
    designId: v.id('newDesigns'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get design
    const design = await ctx.db.get(args.designId);
    if (!design) {
      throw new Error('Design not found');
    }

    // Check authorization
    if (design.ownerId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Validate title if provided
    if (args.title !== undefined && !args.title.trim()) {
      throw new Error('Title cannot be empty');
    }

    // Build update object
    const updates: {
      title?: string;
      description?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title.trim();
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }

    await ctx.db.patch(args.designId, updates);

    return args.designId;
  },
});

/**
 * Move design to a different folder (or to root)
 */
export const moveToFolder = mutation({
  args: {
    designId: v.id('newDesigns'),
    folderId: v.union(v.id('folders'), v.null()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get design
    const design = await ctx.db.get(args.designId);
    if (!design) {
      throw new Error('Design not found');
    }

    // Check authorization
    if (design.ownerId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // If folderId provided, verify it exists and is owned by user
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }
      if (folder.ownerId !== identity.subject) {
        throw new Error('Unauthorized: folder does not belong to you');
      }
    }

    await ctx.db.patch(args.designId, {
      folderId: args.folderId ?? undefined,
      updatedAt: Date.now(),
    });

    return args.designId;
  },
});

/**
 * Duplicate a design (copies metadata + canvas + blocks)
 */
export const duplicate = mutation({
  args: {
    designId: v.id('newDesigns'),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get original design
    const original = await ctx.db.get(args.designId);
    if (!original) {
      throw new Error('Design not found');
    }

    // Check authorization
    if (original.ownerId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    const now = Date.now();

    // Create new design metadata
    const newDesignId = await ctx.db.insert('newDesigns', {
      ownerId: identity.subject,
      folderId: original.folderId,
      title: args.title ?? `${original.title} (Copy)`,
      description: original.description,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });

    // Copy canvas data if exists
    const originalCanvas = await ctx.db
      .query('designCanvases')
      .withIndex('by_designId', (q) => q.eq('designId', args.designId))
      .first();

    if (originalCanvas) {
      await ctx.db.insert('designCanvases', {
        designId: newDesignId,
        nodes: originalCanvas.nodes,
        edges: originalCanvas.edges,
        sections: originalCanvas.sections,
        viewport: originalCanvas.viewport,
        version: originalCanvas.version,
        updatedAt: now,
      });
    }

    // Copy blocks if exist
    const originalBlocks = await ctx.db
      .query('designBlocks')
      .withIndex('by_designId', (q) => q.eq('designId', args.designId))
      .first();

    if (originalBlocks) {
      await ctx.db.insert('designBlocks', {
        designId: newDesignId,
        blocks: originalBlocks.blocks,
        updatedAt: now,
      });
    }

    return newDesignId;
  },
});

/**
 * Delete a design (cascades to canvas and blocks)
 */
export const remove = mutation({
  args: {
    designId: v.id('newDesigns'),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get design
    const design = await ctx.db.get(args.designId);
    if (!design) {
      throw new Error('Design not found');
    }

    // Check authorization
    if (design.ownerId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Delete canvas data
    const canvas = await ctx.db
      .query('designCanvases')
      .withIndex('by_designId', (q) => q.eq('designId', args.designId))
      .first();
    if (canvas) {
      await ctx.db.delete(canvas._id);
    }

    // Delete blocks
    const blocks = await ctx.db
      .query('designBlocks')
      .withIndex('by_designId', (q) => q.eq('designId', args.designId))
      .first();
    if (blocks) {
      await ctx.db.delete(blocks._id);
    }

    // Delete design metadata
    await ctx.db.delete(args.designId);

    return { success: true };
  },
});
