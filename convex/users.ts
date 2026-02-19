import { query } from './_generated/server';

/**
 * Get the current authenticated user's information
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return {
      id: identity.subject,
      email: identity.email ?? identity.name ?? 'Unknown',
      name: identity.name,
    };
  },
});
