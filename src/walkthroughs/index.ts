/**
 * Walkthrough Index
 * Maps Dashboard navigation slugs to walkthrough data
 */

import { netflixWalkthrough } from './netflix';
import { stripeWalkthrough } from './stripe';
import { instagramWalkthrough } from './instagram';
import { uberWalkthrough } from './uber';
import { twitterWalkthrough } from './twitter';
import type { Walkthrough } from '@/types/walkthrough';

/**
 * Map of Dashboard slugs to walkthrough data
 *
 * NOTE: Dashboard uses different slugs than some walkthrough files export.
 * This index maps the Dashboard navigation slugs (from DashboardPage.tsx)
 * to the correct walkthrough data.
 */
export const walkthroughsBySlug: Record<string, Walkthrough> = {
  // Dashboard slug: netflix-recommendation
  'netflix-recommendation': netflixWalkthrough,

  // Dashboard slug: stripe-payments (different from stripe.ts export)
  'stripe-payments': stripeWalkthrough,

  // Dashboard slug: instagram-feed (different from instagram.ts export)
  'instagram-feed': instagramWalkthrough,

  // Dashboard slug: uber-dispatch
  'uber-dispatch': uberWalkthrough,

  // Dashboard slug: twitter-feed (different from twitter.ts export)
  'twitter-feed': twitterWalkthrough,
};

/**
 * Get a walkthrough by its Dashboard navigation slug
 */
export function getWalkthroughBySlug(slug: string): Walkthrough | undefined {
  return walkthroughsBySlug[slug];
}
