import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Sharing operations for designs
 * Handles public share links with slug-based URLs
 */

/**
 * Generate a URL-safe slug from a title
 * Converts to lowercase, replaces spaces with hyphens, removes special chars
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a random suffix for uniqueness
 * Returns 6 alphanumeric characters
 */
function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique share slug for a design
 * Format: {title-slug}-{random-suffix}
 * Example: "netflix-recommendation-system-a1b2c3"
 */
export const generateShareSlug = mutation({
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

    // Generate base slug from title
    const baseSlug = slugify(design.title);
    if (!baseSlug) {
      throw new Error('Cannot generate slug from title');
    }

    // Try to find a unique slug (max 10 attempts)
    let slug = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generate slug with random suffix
      const suffix = generateRandomSuffix();
      slug = `${baseSlug}-${suffix}`;

      // Check if slug already exists
      const existing = await ctx.db
        .query('newDesigns')
        .withIndex('by_shareSlug', (q) => q.eq('shareSlug', slug))
        .first();

      if (!existing) {
        // Slug is unique, we can use it
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique slug after multiple attempts');
    }

    // Update design with the new slug
    await ctx.db.patch(args.designId, {
      shareSlug: slug,
      updatedAt: Date.now(),
    });

    return slug;
  },
});

/**
 * Make a design public and generate a share slug if needed
 */
export const makeDesignPublic = mutation({
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

    // If design already has a slug, just make it public
    if (design.shareSlug) {
      await ctx.db.patch(args.designId, {
        isPublic: true,
        updatedAt: Date.now(),
      });
      return design.shareSlug;
    }

    // Generate a new slug
    const baseSlug = slugify(design.title);
    if (!baseSlug) {
      throw new Error('Cannot generate slug from title');
    }

    // Try to find a unique slug
    let slug = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const suffix = generateRandomSuffix();
      slug = `${baseSlug}-${suffix}`;

      const existing = await ctx.db
        .query('newDesigns')
        .withIndex('by_shareSlug', (q) => q.eq('shareSlug', slug))
        .first();

      if (!existing) {
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique slug');
    }

    // Update design to be public with slug
    await ctx.db.patch(args.designId, {
      isPublic: true,
      shareSlug: slug,
      updatedAt: Date.now(),
    });

    return slug;
  },
});

/**
 * Make a design private (keeps slug for history)
 */
export const makeDesignPrivate = mutation({
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

    // Make design private (keep slug for history)
    await ctx.db.patch(args.designId, {
      isPublic: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get design by share slug (public, no auth required)
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // Find design by slug
    const design = await ctx.db
      .query('newDesigns')
      .withIndex('by_shareSlug', (q) => q.eq('shareSlug', args.slug))
      .first();

    if (!design) {
      throw new Error('Design not found');
    }

    // Check if design is public
    if (!design.isPublic) {
      throw new Error('Design is not public');
    }

    return design;
  },
});

/**
 * Get design canvas by slug (public, no auth required)
 */
export const getCanvasBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // Find design by slug
    const design = await ctx.db
      .query('newDesigns')
      .withIndex('by_shareSlug', (q) => q.eq('shareSlug', args.slug))
      .first();

    if (!design) {
      throw new Error('Design not found');
    }

    // Check if design is public
    if (!design.isPublic) {
      throw new Error('Design is not public');
    }

    // Get canvas data
    const canvas = await ctx.db
      .query('designCanvases')
      .withIndex('by_designId', (q) => q.eq('designId', design._id))
      .first();

    return canvas;
  },
});

/**
 * Get design blocks by slug (public, no auth required)
 */
export const getBlocksBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // Find design by slug
    const design = await ctx.db
      .query('newDesigns')
      .withIndex('by_shareSlug', (q) => q.eq('shareSlug', args.slug))
      .first();

    if (!design) {
      throw new Error('Design not found');
    }

    // Check if design is public
    if (!design.isPublic) {
      throw new Error('Design is not public');
    }

    // Get blocks data
    const blocks = await ctx.db
      .query('designBlocks')
      .withIndex('by_designId', (q) => q.eq('designId', design._id))
      .first();

    return blocks;
  },
});
