import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { auth } from './auth';

/**
 * Canvas design operations
 * Handles saving and loading canvas state (nodes, edges, sections)
 */

/**
 * Save or update a design for a workspace
 * Upserts the design data - creates if doesn't exist, updates if it does
 */
export const saveDesign = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    nodes: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        position: v.object({
          x: v.number(),
          y: v.number(),
        }),
        data: v.any(),
        style: v.optional(v.any()),
        selected: v.optional(v.boolean()),
        dragging: v.optional(v.boolean()),
      })
    ),
    edges: v.array(
      v.object({
        id: v.string(),
        source: v.string(),
        target: v.string(),
        type: v.optional(v.string()),
        data: v.optional(v.any()),
        selected: v.optional(v.boolean()),
        sourceHandle: v.optional(v.string()),
        targetHandle: v.optional(v.string()),
      })
    ),
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
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Unauthorized: Must be logged in to save designs');
    }

    // Verify workspace ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    if (workspace.userId !== userId) {
      throw new Error('Unauthorized: Cannot access this workspace');
    }

    // Check if design already exists for this workspace
    const existingDesign = await ctx.db
      .query('designs')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', args.workspaceId))
      .first();

    const now = Date.now();

    if (existingDesign) {
      // Update existing design
      await ctx.db.patch(existingDesign._id, {
        nodes: args.nodes,
        edges: args.edges,
        sections: args.sections,
        updatedAt: now,
      });
      return existingDesign._id;
    } else {
      // Create new design
      const designId = await ctx.db.insert('designs', {
        workspaceId: args.workspaceId,
        nodes: args.nodes,
        edges: args.edges,
        sections: args.sections,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
      return designId;
    }
  },
});

/**
 * Load design data for a workspace
 * Returns canvas nodes, edges, and sections
 */
export const getDesign = query({
  args: {
    workspaceId: v.id('workspaces'),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Unauthorized: Must be logged in to view designs');
    }

    // Verify workspace ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    if (workspace.userId !== userId) {
      throw new Error('Unauthorized: Cannot access this workspace');
    }

    // Get design for workspace
    const design = await ctx.db
      .query('designs')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', args.workspaceId))
      .first();

    if (!design) {
      // Return empty design structure if none exists yet
      return {
        nodes: [],
        edges: [],
        sections: [],
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    return {
      nodes: design.nodes,
      edges: design.edges,
      sections: design.sections,
      version: design.version,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    };
  },
});
