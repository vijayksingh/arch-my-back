import { ConvexReactClient } from 'convex/react';

/**
 * Convex client configuration
 *
 * The VITE_CONVEX_URL environment variable should be set to your Convex deployment URL.
 * You can find this in the Convex dashboard or by running `npx convex dev`.
 *
 * Example: https://your-deployment.convex.cloud
 */
const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    'Missing VITE_CONVEX_URL environment variable. ' +
      'Create a .env.local file with VITE_CONVEX_URL=<your-convex-url>'
  );
}

export const convex = new ConvexReactClient(convexUrl);
