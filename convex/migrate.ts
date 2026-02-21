import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

/**
 * Migration from old schema to new schema
 *
 * Old schema:
 * - workspaces: workspace metadata + UI settings
 * - designs: canvas data (nodes, edges, sections) per workspace
 * - blocks: individual block rows per workspace
 *
 * New schema:
 * - newDesigns: design metadata (replaces workspace)
 * - designCanvases: canvas data per design
 * - designBlocks: blocks array per design
 *
 * This migration:
 * 1. Converts each workspace → one newDesign
 * 2. Converts each designs row → one designCanvases row
 * 3. Aggregates blocks per workspace → one designBlocks row
 * 4. Normalizes edge port to number (handles string ports in legacy data)
 */

/**
 * Run the migration
 * This is an action (not mutation) so it can call multiple mutations
 */
export const migrateToNewSchema = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    workspacesMigrated: number;
    canvasesMigrated: number;
    blocksMigrated: number;
    totalWorkspaces: number;
    errors: string[];
  }> => {
    console.log('Starting migration...');

    // Call internal mutations to do the work
    const result = await ctx.runMutation(internal.migrate.runMigration);

    console.log('Migration complete:', result);
    return result;
  },
});

/**
 * Internal mutation that performs the actual migration
 */
export const runMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    let workspacesMigrated = 0;
    let canvasesMigrated = 0;
    let blocksMigrated = 0;
    const errors: string[] = [];

    // Get all workspaces
    const workspaces = await ctx.db.query('workspaces').collect();

    console.log(`Found ${workspaces.length} workspaces to migrate`);

    for (const workspace of workspaces) {
      try {
        // 1. Create newDesign from workspace
        const newDesignId = await ctx.db.insert('newDesigns', {
          ownerId: workspace.userId,
          folderId: undefined, // All designs start at root
          title: workspace.title,
          description: undefined,
          isPublic: false,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        });

        workspacesMigrated++;

        // 2. Migrate canvas data (designs table → designCanvases)
        const oldDesign = await ctx.db
          .query('designs')
          .withIndex('by_workspaceId', (q) => q.eq('workspaceId', workspace._id))
          .first();

        if (oldDesign) {
          // Normalize edge ports to numbers
          const normalizedEdges = oldDesign.edges.map((edge: any) => {
            if (edge.data?.port !== undefined) {
              // Convert string ports to numbers
              const port = typeof edge.data.port === 'string'
                ? parseInt(edge.data.port, 10)
                : edge.data.port;

              return {
                ...edge,
                data: {
                  ...edge.data,
                  port: isNaN(port) ? undefined : port,
                },
              };
            }
            return edge;
          });

          await ctx.db.insert('designCanvases', {
            designId: newDesignId,
            nodes: oldDesign.nodes as any, // Type cast old node format to new format
            edges: normalizedEdges,
            sections: oldDesign.sections,
            viewport: undefined, // Old schema didn't have viewport
            version: oldDesign.version,
            updatedAt: oldDesign.updatedAt,
          });

          canvasesMigrated++;
        }

        // 3. Migrate blocks (blocks table → designBlocks)
        const oldBlocks = await ctx.db
          .query('blocks')
          .withIndex('by_workspaceId', (q) => q.eq('workspaceId', workspace._id))
          .collect();

        if (oldBlocks.length > 0) {
          // Sort by creation order
          const sortedBlocks = oldBlocks.sort((a, b) => a.createdAt - b.createdAt);

          // Convert to new block format
          const newBlocks = sortedBlocks.map((block) => ({
            id: block.blockId,
            type: block.type,
            sectionId: block.sectionId,
            data: block.data,
            createdAt: block.createdAt,
          }));

          await ctx.db.insert('designBlocks', {
            designId: newDesignId,
            blocks: newBlocks,
            updatedAt: Date.now(),
          });

          blocksMigrated++;
        }
      } catch (error) {
        const errorMsg = `Failed to migrate workspace ${workspace._id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      success: true,
      workspacesMigrated,
      canvasesMigrated,
      blocksMigrated,
      totalWorkspaces: workspaces.length,
      errors,
    };
  },
});
