import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
  canvasNodeValidator,
  canvasEdgeValidator,
  canvasSectionValidator,
  viewportValidator,
} from './validators';

/**
 * Design Canvas operations
 * Handles saving and loading canvas data (nodes, edges, sections, viewport)
 */

/**
 * Save or update canvas data for a design
 * Upserts - creates if doesn't exist, updates if it does
 */
export const save = mutation({
  args: {
    designId: v.id('newDesigns'),
    nodes: v.array(canvasNodeValidator),
    edges: v.array(canvasEdgeValidator),
    sections: v.array(canvasSectionValidator),
    viewport: v.optional(viewportValidator),
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

    // Check if canvas already exists for this design
    const existingCanvas = await ctx.db
      .query('designCanvases')
      .withIndex('by_designId', (q) => q.eq('designId', args.designId))
      .first();

    const now = Date.now();

    if (existingCanvas) {
      // Update existing canvas
      await ctx.db.patch(existingCanvas._id, {
        nodes: args.nodes,
        edges: args.edges,
        sections: args.sections,
        viewport: args.viewport,
        updatedAt: now,
      });

      // Update design's updatedAt timestamp
      await ctx.db.patch(args.designId, {
        updatedAt: now,
      });

      return existingCanvas._id;
    } else {
      // Create new canvas
      const canvasId = await ctx.db.insert('designCanvases', {
        designId: args.designId,
        nodes: args.nodes,
        edges: args.edges,
        sections: args.sections,
        viewport: args.viewport,
        version: 1,
        updatedAt: now,
      });

      // Update design's updatedAt timestamp
      await ctx.db.patch(args.designId, {
        updatedAt: now,
      });

      return canvasId;
    }
  },
});

/**
 * Load canvas data for a design
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

    // Get canvas for design
    const canvas = await ctx.db
      .query('designCanvases')
      .withIndex('by_designId', (q) => q.eq('designId', args.designId))
      .first();

    if (!canvas) {
      // Return empty canvas structure if none exists yet
      return {
        nodes: [],
        edges: [],
        sections: [],
        viewport: undefined,
        version: 1,
        updatedAt: 0,
      };
    }

    return {
      nodes: canvas.nodes,
      edges: canvas.edges,
      sections: canvas.sections,
      viewport: canvas.viewport,
      version: canvas.version,
      updatedAt: canvas.updatedAt,
    };
  },
});
