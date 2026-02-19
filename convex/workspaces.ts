import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Create a new workspace for the authenticated user
 */
export const createWorkspace = mutation({
  args: {
    title: v.string(),
    viewMode: v.optional(
      v.union(
        v.literal('document'),
        v.literal('both'),
        v.literal('canvas')
      )
    ),
    activeCanvasTool: v.optional(
      v.union(
        v.literal('cursor'),
        v.literal('select'),
        v.literal('rectangle'),
        v.literal('circle'),
        v.literal('text')
      )
    ),
    documentEditorMode: v.optional(
      v.union(v.literal('edit'), v.literal('preview'))
    ),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated: You must be logged in to create a workspace');
    }

    // Validate title
    if (!args.title.trim()) {
      throw new Error('Validation error: Title cannot be empty');
    }

    const now = Date.now();

    // Create workspace with defaults
    const workspaceId = await ctx.db.insert('workspaces', {
      userId: identity.subject,
      title: args.title.trim(),
      viewMode: args.viewMode ?? 'both',
      activeCanvasTool: args.activeCanvasTool ?? 'cursor',
      documentEditorMode: args.documentEditorMode ?? 'edit',
      createdAt: now,
      updatedAt: now,
    });

    return workspaceId;
  },
});

/**
 * Get all workspaces for the authenticated user
 */
export const getWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated: You must be logged in to view workspaces');
    }

    // Query workspaces for this user, ordered by most recently updated
    const workspaces = await ctx.db
      .query('workspaces')
      .withIndex('by_userId_updatedAt', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();

    return workspaces;
  },
});

/**
 * Get a single workspace by ID
 */
export const getWorkspace = query({
  args: {
    workspaceId: v.id('workspaces'),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated: You must be logged in to view a workspace');
    }

    // Get workspace
    const workspace = await ctx.db.get(args.workspaceId);

    if (!workspace) {
      throw new Error('Not found: Workspace does not exist');
    }

    // Check authorization
    if (workspace.userId !== identity.subject) {
      throw new Error('Unauthorized: You do not have access to this workspace');
    }

    return workspace;
  },
});

/**
 * Update a workspace
 */
export const updateWorkspace = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    title: v.optional(v.string()),
    viewMode: v.optional(
      v.union(
        v.literal('document'),
        v.literal('both'),
        v.literal('canvas')
      )
    ),
    activeCanvasTool: v.optional(
      v.union(
        v.literal('cursor'),
        v.literal('select'),
        v.literal('rectangle'),
        v.literal('circle'),
        v.literal('text')
      )
    ),
    documentEditorMode: v.optional(
      v.union(v.literal('edit'), v.literal('preview'))
    ),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated: You must be logged in to update a workspace');
    }

    // Get workspace
    const workspace = await ctx.db.get(args.workspaceId);

    if (!workspace) {
      throw new Error('Not found: Workspace does not exist');
    }

    // Check authorization
    if (workspace.userId !== identity.subject) {
      throw new Error('Unauthorized: You do not have access to this workspace');
    }

    // Validate title if provided
    if (args.title !== undefined && !args.title.trim()) {
      throw new Error('Validation error: Title cannot be empty');
    }

    // Build update object with only provided fields
    const updates: {
      title?: string;
      viewMode?: 'document' | 'both' | 'canvas';
      activeCanvasTool?: 'cursor' | 'select' | 'rectangle' | 'circle' | 'text';
      documentEditorMode?: 'edit' | 'preview';
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title.trim();
    }
    if (args.viewMode !== undefined) {
      updates.viewMode = args.viewMode;
    }
    if (args.activeCanvasTool !== undefined) {
      updates.activeCanvasTool = args.activeCanvasTool;
    }
    if (args.documentEditorMode !== undefined) {
      updates.documentEditorMode = args.documentEditorMode;
    }

    await ctx.db.patch(args.workspaceId, updates);

    return args.workspaceId;
  },
});

/**
 * Delete a workspace
 */
export const deleteWorkspace = mutation({
  args: {
    workspaceId: v.id('workspaces'),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated: You must be logged in to delete a workspace');
    }

    // Get workspace
    const workspace = await ctx.db.get(args.workspaceId);

    if (!workspace) {
      throw new Error('Not found: Workspace does not exist');
    }

    // Check authorization
    if (workspace.userId !== identity.subject) {
      throw new Error('Unauthorized: You do not have access to this workspace');
    }

    // Delete associated designs
    const designs = await ctx.db
      .query('designs')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', args.workspaceId))
      .collect();
    for (const design of designs) {
      await ctx.db.delete(design._id);
    }

    // Delete associated blocks
    const blocks = await ctx.db
      .query('blocks')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', args.workspaceId))
      .collect();
    for (const block of blocks) {
      await ctx.db.delete(block._id);
    }

    // Delete workspace
    await ctx.db.delete(args.workspaceId);

    return { success: true };
  },
});
