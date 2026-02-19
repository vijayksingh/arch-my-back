import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { blockValidator } from './validators';

/**
 * Design Blocks operations
 * Handles saving and loading document blocks (text, requirements, schema, api, lld)
 */

/**
 * Save or update blocks for a design
 * Upserts - creates if doesn't exist, updates if it does
 * All blocks are saved together as a single array
 */
export const save = mutation({
  args: {
    designId: v.id('newDesigns'),
    blocks: v.array(blockValidator),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify design ownership
    const design = await ctx.db.get(args.designId);
    if (!design) {
      throw new Error('Design not found');
    }
    if (design.ownerId !== identity.subject) {
      throw new Error('Unauthorized');
    }

    // Check if blocks already exist for this design
    const existingBlocks = await ctx.db
      .query('designBlocks')
      .withIndex('by_designId', (q) => q.eq('designId', args.designId))
      .first();

    const now = Date.now();

    if (existingBlocks) {
      // Update existing blocks
      await ctx.db.patch(existingBlocks._id, {
        blocks: args.blocks,
        updatedAt: now,
      });

      // Update design's updatedAt timestamp
      await ctx.db.patch(args.designId, {
        updatedAt: now,
      });

      return existingBlocks._id;
    } else {
      // Create new blocks document
      const blocksId = await ctx.db.insert('designBlocks', {
        designId: args.designId,
        blocks: args.blocks,
        updatedAt: now,
      });

      // Update design's updatedAt timestamp
      await ctx.db.patch(args.designId, {
        updatedAt: now,
      });

      return blocksId;
    }
  },
});

/**
 * Load blocks for a design
 */
export const load = query({
  args: {
    designId: v.id('newDesigns'),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify design ownership
    const design = await ctx.db.get(args.designId);
    if (!design) {
      throw new Error('Design not found');
    }
    if (design.ownerId !== identity.subject && !design.isPublic) {
      throw new Error('Unauthorized');
    }

    // Get blocks for design
    const blocksDoc = await ctx.db
      .query('designBlocks')
      .withIndex('by_designId', (q) => q.eq('designId', args.designId))
      .first();

    if (!blocksDoc) {
      // Return empty blocks array if none exists yet
      return {
        blocks: [],
        updatedAt: 0,
      };
    }

    return {
      blocks: blocksDoc.blocks,
      updatedAt: blocksDoc.updatedAt,
    };
  },
});
