import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Folder operations
 * Handles CRUD for design organization folders
 */

/**
 * Create a new folder
 */
export const create = mutation({
  args: {
    title: v.string(),
    color: v.optional(v.string()),
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

    const now = Date.now();

    const folderId = await ctx.db.insert('folders', {
      ownerId: identity.subject,
      title: args.title.trim(),
      color: args.color,
      createdAt: now,
      updatedAt: now,
    });

    return folderId;
  },
});

/**
 * List all folders for the authenticated user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Query folders for this user, ordered by most recently updated
    const folders = await ctx.db
      .query('folders')
      .withIndex('by_ownerId_updatedAt', (q) => q.eq('ownerId', identity.subject))
      .order('desc')
      .collect();

    return folders;
  },
});

/**
 * Rename a folder
 */
export const rename = mutation({
  args: {
    folderId: v.id('folders'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get folder
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Check authorization
    if (folder.ownerId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Validate title
    if (!args.title.trim()) {
      throw new Error('Title cannot be empty');
    }

    await ctx.db.patch(args.folderId, {
      title: args.title.trim(),
      updatedAt: Date.now(),
    });

    return args.folderId;
  },
});

/**
 * Delete a folder
 * Note: This does not cascade delete designs - designs will be moved to root
 */
export const remove = mutation({
  args: {
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get folder
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Check authorization
    if (folder.ownerId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Move designs in this folder to root (folderId = undefined)
    const designsInFolder = await ctx.db
      .query('newDesigns')
      .withIndex('by_folderId', (q) => q.eq('folderId', args.folderId))
      .collect();

    for (const design of designsInFolder) {
      await ctx.db.patch(design._id, {
        folderId: undefined,
        updatedAt: Date.now(),
      });
    }

    // Delete folder
    await ctx.db.delete(args.folderId);

    return { success: true };
  },
});
