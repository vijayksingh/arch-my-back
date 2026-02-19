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

    // Try to get a display name/email from the identity
    // Priority: email > name > extract from tokenIdentifier/subject
    let displayEmail = identity.email ?? identity.name;

    if (!displayEmail) {
      // Try to extract email from tokenIdentifier (format: "https://provider.com|user@example.com")
      const tokenId = identity.tokenIdentifier;
      if (tokenId && tokenId.includes('|')) {
        const extracted = tokenId.split('|')[1];
        if (extracted) displayEmail = extracted;
      }

      // Last fallback: use subject (but make it cleaner if it's a UUID or ID)
      if (!displayEmail) {
        displayEmail = identity.subject;
      }
    }

    return {
      id: identity.subject,
      email: displayEmail,
      name: identity.name,
    };
  },
});
