/**
 * Walkthrough mutations and queries
 * Handles interactive learning experiences
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { walkthroughStepValidator } from './validators';

/**
 * Get walkthrough by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const walkthrough = await ctx.db
      .query('walkthroughs')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();

    return walkthrough;
  },
});

/**
 * List all walkthroughs
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const walkthroughs = await ctx.db
      .query('walkthroughs')
      .order('desc')
      .collect();

    return walkthroughs.map((w) => ({
      _id: w._id,
      slug: w.slug,
      title: w.title,
      description: w.description,
      estimatedMinutes: w.estimatedMinutes,
      tags: w.tags,
      stepCount: w.steps.length,
    }));
  },
});

/**
 * Create a new walkthrough
 */
export const create = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    estimatedMinutes: v.number(),
    steps: v.array(walkthroughStepValidator),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const id = await ctx.db.insert('walkthroughs', {
      slug: args.slug,
      title: args.title,
      description: args.description,
      estimatedMinutes: args.estimatedMinutes,
      steps: args.steps,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Get user's progress for a walkthrough
 */
export const getProgress = query({
  args: {
    userId: v.string(),
    walkthroughId: v.id('walkthroughs'),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query('walkthroughProgress')
      .withIndex('by_user', (q) =>
        q.eq('userId', args.userId).eq('walkthroughId', args.walkthroughId)
      )
      .first();

    return progress;
  },
});

/**
 * Save user's progress
 */
export const saveProgress = mutation({
  args: {
    userId: v.string(),
    walkthroughId: v.id('walkthroughs'),
    currentStepId: v.string(),
    completedStepIds: v.array(v.string()),
    quizAnswers: v.optional(v.record(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('walkthroughProgress')
      .withIndex('by_user', (q) =>
        q.eq('userId', args.userId).eq('walkthroughId', args.walkthroughId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentStepId: args.currentStepId,
        completedStepIds: args.completedStepIds,
        quizAnswers: args.quizAnswers,
        lastAccessedAt: now,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert('walkthroughProgress', {
        userId: args.userId,
        walkthroughId: args.walkthroughId,
        currentStepId: args.currentStepId,
        completedStepIds: args.completedStepIds,
        quizAnswers: args.quizAnswers,
        lastAccessedAt: now,
      });
      return id;
    }
  },
});

/**
 * Mark walkthrough as completed
 */
export const markComplete = mutation({
  args: {
    userId: v.string(),
    walkthroughId: v.id('walkthroughs'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('walkthroughProgress')
      .withIndex('by_user', (q) =>
        q.eq('userId', args.userId).eq('walkthroughId', args.walkthroughId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completedAt: Date.now(),
      });
    }
  },
});
