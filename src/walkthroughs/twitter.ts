import type { Walkthrough } from '@/types/walkthrough';

/**
 * Twitter/X Feed Ranking - Interactive Walkthrough
 *
 * A 90-120 minute progressive learning experience that builds understanding
 * of how Twitter/X ranks and personalizes feeds for 500M+ users.
 *
 * Sources:
 * - Twitter Engineering Blog: https://blog.twitter.com/engineering
 * - Twitter's Open Source Algorithm (2023): https://github.com/twitter/the-algorithm
 * - "How Twitter Serves the Timeline" talk
 * - Twitter ML Platform documentation
 */

export const twitterWalkthrough: Walkthrough = {
  id: 'twitter-feed-ranking-walkthrough',
  slug: 'twitter-feed-ranking',
  title: 'Twitter/X Feed Ranking System',
  description:
    'Build understanding of how Twitter/X ranks and personalizes the feed for 500M+ daily active users',
  learningGoals: [
    'Understand chronological vs algorithmic feeds and the evolution from one to the other',
    'Learn fan-out strategies (write vs read) for feed generation at massive scale',
    'Explore ML-powered ranking models and feature engineering for engagement prediction',
    'Deep dive into real-time trending topics and personalization signals',
  ],
  estimatedMinutes: 105,
  difficulty: 'intermediate',
  tags: [
    'feed-ranking',
    'machine-learning',
    'distributed-systems',
    'real-time-processing',
    'recommendation-systems',
  ],
  sources: [
    {
      title: 'Twitter Engineering Blog',
      url: 'https://blog.twitter.com/engineering',
    },
    {
      title: "Twitter's Open Source Algorithm (2023)",
      url: 'https://github.com/twitter/the-algorithm',
    },
    {
      title: 'How Twitter Serves the Timeline',
      url: 'https://www.infoq.com/presentations/twitter-timeline/',
    },
  ],

  steps: [
    // ========== PHASE 1: PROBLEM INTRODUCTION (10 min) ==========
    {
      id: 'step-1-intro',
      title: 'The Feed Ranking Challenge',
      phase: 'intro',
      estimatedMinutes: 5,
      content: `
# Welcome to Twitter/X's Feed Ranking System

You're building Twitter/X. You have:
- **500M+ daily active users** posting tweets
- **6,000+ tweets per second** generated globally
- **Billions of feed loads** per day
- **Different interests** across demographics, cultures, topics

## The Challenge

When a user opens Twitter, what should they see?

This isn't just an engineering problem—it's a **product-critical** challenge:
- **Chronological feed** = simple but users miss important content
- **Algorithmic feed** = better engagement but needs complex ML
- Wrong ranking = users leave the platform

## The Evolution

**2006-2016**: Pure chronological feed
- Simple: newest tweets first
- Problem: Users miss tweets from hours ago
- High-volume accounts (news, celebrities) dominate

**2016+**: Algorithmic ranking ("While you were away")
- ML-powered relevance ranking
- Problem: Must compute in <100ms for each user
- Needs to handle 500M+ users with different interests

## Think First: What Would You Do?

Before we dive into solutions, put yourself in the architect's seat. How would YOU decide what tweets to show?
      `,
      widgets: [
        {
          type: 'quiz',
          question:
            "If you had to build Twitter's feed TODAY, what would you start with?",
          options: [
            {
              id: 'chrono',
              text: 'Show newest tweets first (chronological)',
              correct: true,
              explanation:
                'Good thinking! This is exactly where Twitter started. Chronological is simple, works reasonably well, and can be built in days. The downside? Users miss important tweets when they\'re offline. If you follow 1000 accounts, your feed moves too fast.',
            },
            {
              id: 'ml-first',
              text: 'Build a machine learning model to rank tweets by relevance',
              correct: false,
              explanation:
                "You're jumping ahead! ML is powerful but requires data you don't have yet. What would you train on? For new users with no interaction history, ML models can't make predictions. You need simpler approaches first to collect data, THEN build ML models.",
            },
            {
              id: 'popular',
              text: 'Show everyone the same popular trending tweets',
              correct: false,
              explanation:
                'This is tempting because it\'s simple! But Twitter tried this and found engagement was poor. Your interest in tech is different from someone who loves sports. One-size-fits-all doesn\'t work when interests vary wildly.',
            },
            {
              id: 'following',
              text: 'Show tweets only from accounts you follow, ranked by engagement',
              correct: false,
              explanation:
                "Close! Filtering by following is essential. But how do you rank if you're a new user with no engagement data? You'd need to start with chronological first, collect data, then add engagement ranking.",
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'user-simple',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: {
              componentType: 'client_browser',
              label: 'User',
              config: {},
            },
          },
          highlight: true,
        },
        {
          type: 'add-node',
          node: {
            id: 'server-simple',
            type: 'archComponent',
            position: { x: 400, y: 100 },
            data: {
              componentType: 'app_server',
              label: 'Twitter Server',
              config: {},
            },
          },
          highlight: true,
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-user-server',
            source: 'user-simple',
            target: 'server-simple',
            type: 'archEdge',
            data: { label: 'Load feed' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-2-fanout-strategies',
      title: 'Fan-out on Write vs Read',
      phase: 'intro',
      estimatedMinutes: 5,
      content: `
# The Fundamental Trade-off: When to Do the Work?

Before we talk about ranking, we need to answer a more fundamental question: **When do we generate the feed?**

## Two Strategies

**Fan-out on Write** (Push):
- When someone tweets, push it to ALL followers' feeds immediately
- Feed generation happens at write time
- Reading the feed is fast (pre-computed)

**Fan-out on Read** (Pull):
- When someone loads their feed, gather tweets from all followings
- Feed generation happens at read time
- Writing tweets is fast, reading is slower

## The Math

Let's say you have:
- **Alice** with 1M followers
- **Bob** with 100 followers

**Fan-out on Write:**
- Alice tweets → 1M writes (to each follower's feed)
- Bob tweets → 100 writes
- User loads feed → 1 read (fast!)

**Fan-out on Read:**
- Alice tweets → 1 write (just store the tweet)
- Bob tweets → 1 write
- User loads feed → N reads (fetch from all N followings, then rank)

## What's the Right Choice?

It depends on your scale and usage patterns. Think about it...
      `,
      widgets: [
        {
          type: 'quiz',
          question:
            'A celebrity with 100M followers tweets. Which strategy is more efficient?',
          options: [
            {
              id: 'write',
              text: 'Fan-out on Write - Push to all 100M followers immediately',
              correct: false,
              explanation:
                "This would be a disaster! Pushing to 100M feeds at write time would take minutes and crush your infrastructure. At Twitter's scale (6,000 tweets/sec), you'd need to handle 600 BILLION write operations per second for just the top accounts. This doesn't scale.",
            },
            {
              id: 'read',
              text: 'Fan-out on Read - Compute feed at read time',
              correct: true,
              explanation:
                'Exactly! For high-follower accounts, fan-out on read is much more efficient. Instead of 100M writes per tweet, you just store the tweet once and merge it into feeds at read time. Twitter uses a HYBRID approach: fan-out on write for normal users, fan-out on read for celebrities.',
            },
            {
              id: 'cache',
              text: 'Cache the celebrity tweets and skip fan-out',
              correct: false,
              explanation:
                "You're on the right track thinking about caching! But you still need a strategy. Twitter does cache celebrity tweets, but that's an optimization on top of fan-out on read. The fundamental choice is still when to do the work.",
            },
            {
              id: 'batch',
              text: 'Batch the writes and process them in background jobs',
              correct: false,
              explanation:
                'Batching helps, but 100M writes is still 100M writes, even if spread over time. By the time you finish, the celebrity has tweeted 10 more times! Fan-out on read is more scalable for high-follower accounts.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'Fan-out Strategies Comparison',
          decision: 'How should Twitter generate feeds?',
          options: [
            {
              label: 'Fan-out on Write (Push)',
              pros: [
                'Fast read latency (~10ms to load feed)',
                'Feeds are pre-computed and cached',
                'Simple read path - just fetch pre-built feed',
                'Works well for users with few followers',
              ],
              cons: [
                'Expensive writes for high-follower accounts (100M+ writes per tweet)',
                'Write latency can be seconds for celebrity tweets',
                'Wasted work if followers never read the feed',
                "Doesn't scale beyond ~10M followers per account",
              ],
            },
            {
              label: 'Fan-out on Read (Pull)',
              pros: [
                'Fast writes (1 write per tweet)',
                'No wasted work - only compute feeds that are actually read',
                'Scales to any number of followers',
                'Fresh feeds (always up-to-date)',
              ],
              cons: [
                'Slow read latency (must gather from all followings)',
                'Read complexity O(N) where N = number of followings',
                'Heavy read load if user follows 5000 accounts',
                'Harder to cache effectively',
              ],
            },
            {
              label: 'Hybrid (Twitter)',
              pros: [
                'Fan-out on write for normal users (<10M followers)',
                'Fan-out on read for celebrities (>10M followers)',
                'Best of both worlds - fast reads + scalable writes',
                'Can merge both sources at read time',
              ],
              cons: [
                'Complex implementation (two code paths)',
                'Need threshold logic (when to switch strategies)',
                'More infrastructure (both push and pull systems)',
                'Harder to debug and monitor',
              ],
            },
          ],
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'tweet-db',
            type: 'archComponent',
            position: { x: 50, y: 300 },
            data: {
              componentType: 'postgres',
              label: 'Tweets DB',
              config: {},
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'feed-cache',
            type: 'archComponent',
            position: { x: 300, y: 300 },
            data: {
              componentType: 'redis',
              label: 'Feed Cache',
              config: { description: 'Pre-computed feeds (fan-out on write)' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'social-graph',
            type: 'archComponent',
            position: { x: 550, y: 300 },
            data: {
              componentType: 'postgres',
              label: 'Social Graph',
              config: { description: 'Who follows whom' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e1',
            source: 'server-simple',
            target: 'tweet-db',
            type: 'archEdge',
            data: { label: 'Store tweet' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e2',
            source: 'server-simple',
            target: 'feed-cache',
            type: 'archEdge',
            data: { label: 'Fan-out to followers' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e3',
            source: 'server-simple',
            target: 'social-graph',
            type: 'archEdge',
            data: { label: 'Get followers' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 2: NAIVE APPROACH (15 min) ==========
    {
      id: 'step-3-chronological-feed',
      title: 'The Chronological Feed',
      phase: 'naive',
      estimatedMinutes: 7,
      content: `
# Building the Simple Solution

Let's start with Twitter's original approach: **chronological feed**.

## How It Works

1. **User tweets** → Store in database with timestamp
2. **User loads feed** → Fetch tweets from all followings, sorted by timestamp DESC
3. **Show newest first** → Simple!

## The Architecture

**Write path:**
\`\`\`
User tweets → Tweet Service → Tweets DB
\`\`\`

**Read path:**
\`\`\`
User loads feed → Feed Service → Query followings → Merge & sort by time
\`\`\`

## The Query

\`\`\`sql
SELECT tweets.*
FROM tweets
WHERE author_id IN (
  SELECT following_id FROM followers WHERE user_id = ?
)
ORDER BY created_at DESC
LIMIT 50
\`\`\`

Simple, elegant, and... **slow at scale**.
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Chronological Feed Implementation',
          language: 'python',
          code: `def get_chronological_feed(user_id, limit=50):
    """
    Generate chronological feed for a user

    Args:
        user_id: User requesting feed
        limit: Number of tweets to return

    Returns:
        List of tweets sorted by time (newest first)
    """
    # Get list of accounts this user follows
    followings = get_followings(user_id)  # e.g., [123, 456, 789]

    # Fetch recent tweets from all followings
    # This is the SLOW part at scale!
    tweets = []
    for following_id in followings:
        recent_tweets = db.query("""
            SELECT * FROM tweets
            WHERE author_id = %s
            AND created_at > NOW() - INTERVAL '7 days'
            ORDER BY created_at DESC
            LIMIT 100
        """, following_id)
        tweets.extend(recent_tweets)

    # Merge and sort by timestamp
    tweets.sort(key=lambda t: t.created_at, reverse=True)

    return tweets[:limit]`,
          highlights: [15, 16, 17, 18],
        },
        {
          type: 'quiz',
          question:
            'A user follows 5,000 accounts. What is the time complexity of generating their feed?',
          options: [
            {
              id: 'o1',
              text: 'O(1) - constant time',
              correct: false,
              explanation:
                "Unfortunately no. We need to query tweets from all 5,000 followings, which grows linearly with the number of followings. It's at least O(N).",
            },
            {
              id: 'on',
              text: 'O(N) where N = number of followings',
              correct: false,
              explanation:
                "Close! We do query N followings, but we also need to SORT all the tweets. If we fetch 100 tweets per following, that's 500,000 tweets to sort. The sorting dominates, making it O(N × M log M) where M is total tweets.",
            },
            {
              id: 'onlogn',
              text: 'O(N × M log M) where N = followings, M = total tweets fetched',
              correct: true,
              explanation:
                'Exactly! For 5,000 followings × 100 tweets each = 500,000 tweets. Sorting 500K tweets is O(500K log 500K) ≈ 9M operations. At 1ms per operation, that\'s 9 seconds per feed load. This doesn\'t scale!',
            },
            {
              id: 'on2',
              text: 'O(N²) - quadratic time',
              correct: false,
              explanation:
                'Too pessimistic! We\'re not comparing every tweet with every other tweet. The bottleneck is fetching N followings and sorting M tweets, which is O(N × M log M), not quadratic.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'feed-service',
            type: 'archComponent',
            position: { x: 300, y: 150 },
            data: {
              componentType: 'app_server',
              label: 'Feed Service',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e4',
            source: 'user-simple',
            target: 'feed-service',
            type: 'archEdge',
            data: { label: 'Load feed' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e5',
            source: 'feed-service',
            target: 'social-graph',
            type: 'archEdge',
            data: { label: 'Get followings' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e6',
            source: 'feed-service',
            target: 'tweet-db',
            type: 'archEdge',
            data: { label: 'Fetch tweets from followings' },
          },
        },
        {
          type: 'highlight',
          nodeIds: ['feed-service'],
          duration: 3000,
          color: '#10b981',
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-4-scaling-problems',
      title: 'What Breaks at Scale?',
      phase: 'naive',
      estimatedMinutes: 8,
      content: `
# The Problem with Chronological Feeds

Our naive implementation works for 100 users. But Twitter has **500M+ daily active users**.

## The Math

**Average user follows**: 400 accounts
**Fetch per following**: 100 recent tweets
**Total tweets to fetch**: 400 × 100 = 40,000 tweets
**Sort complexity**: O(40,000 log 40,000) ≈ 640,000 operations

At 1µs per operation: **640ms** per feed load
At 100M concurrent feed loads: **64 billion operations/second**

## The Problems

1. **Latency**: Users expect <100ms feed loads, not 640ms
2. **Database load**: 100M users × 400 queries = 40 billion DB queries/second
3. **CPU for sorting**: Sorting millions of tweets consumes massive CPU
4. **Network**: Fetching 40,000 tweets per request = huge data transfer

## What Breaks First?

The database! PostgreSQL can handle ~100K queries/second per instance. You'd need **400,000 database instances** to handle peak load.

## What Do We Do?

We need to **pre-compute** feeds using fan-out on write. But we also need to handle celebrities with millions of followers...
      `,
      widgets: [
        {
          type: 'timeline',
          title: 'Chronological Feed Load (Current)',
          events: [
            {
              label: 'User requests feed',
              description: 'User opens Twitter app',
              nodeIds: ['user-simple'],
            },
            {
              label: 'Query social graph',
              description: 'Fetch list of 400 followings (~10ms)',
              nodeIds: ['feed-service', 'social-graph'],
            },
            {
              label: 'Query tweets from followings',
              description: 'Fetch 100 tweets × 400 followings = 40,000 tweets (~500ms)',
              nodeIds: ['feed-service', 'tweet-db'],
            },
            {
              label: 'Sort and merge',
              description: 'Sort 40,000 tweets by timestamp (~140ms)',
              nodeIds: ['feed-service'],
            },
            {
              label: 'Return top 50',
              description: 'Total: ~650ms (TOO SLOW!)',
              nodeIds: ['feed-service'],
            },
          ],
        },
        {
          type: 'quiz',
          question:
            'How would YOU fix the performance problem? Think about the trade-offs.',
          options: [
            {
              id: 'cache',
              text: 'Cache the chronological feed for each user',
              correct: true,
              explanation:
                'Good thinking! This is exactly what fan-out on write does - it pre-computes and caches feeds. When Alice tweets, push to all her followers\' feed caches. Reading becomes fast (~10ms). The downside is expensive writes for high-follower accounts.',
            },
            {
              id: 'limit-followings',
              text: 'Limit users to 100 followings max',
              correct: false,
              explanation:
                "Product teams wouldn't accept this! Many users follow 1000+ accounts. You can't artificially limit the product to fix a technical problem. Better to solve the technical problem itself.",
            },
            {
              id: 'better-db',
              text: 'Use a faster database or add more database replicas',
              correct: false,
              explanation:
                'Adding replicas helps with read load, but doesn\'t solve the fundamental problem. Even with the fastest database, you still need to fetch and sort 40,000 tweets per request. The issue is the algorithm, not the database.',
            },
            {
              id: 'sample',
              text: 'Sample a subset of followings instead of querying all',
              correct: false,
              explanation:
                "This would break the product! Users expect to see tweets from ALL their followings, not a random sample. You'd miss important tweets. Better to pre-compute the feed than sample.",
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'Feed Generation Strategies',
          decision: 'How should we optimize feed generation?',
          options: [
            {
              label: 'Pull (Current)',
              pros: ['Simple implementation', 'Always fresh', 'Works for any number of followers'],
              cons: [
                '650ms latency per feed load',
                '40 billion DB queries/second at scale',
                'Expensive CPU for sorting',
                "Doesn't scale beyond 1M concurrent users",
              ],
            },
            {
              label: 'Push (Fan-out on Write)',
              pros: [
                'Fast reads (10ms from cache)',
                'Pre-computed feeds',
                'Lower read load',
                'CPU spent at write time, not read time',
              ],
              cons: [
                'Expensive writes for celebrities (millions of cache writes per tweet)',
                'Stale feeds (what if user follows someone new?)',
                'Write amplification (1 tweet → millions of writes)',
                'Cache storage cost (500M users × 50 tweets × 1KB = 25TB)',
              ],
            },
            {
              label: 'Hybrid (Twitter)',
              pros: [
                'Push for normal users (<1M followers)',
                'Pull for celebrities (>1M followers)',
                'Merge at read time (fast cache + few pull queries)',
                'Best of both worlds',
              ],
              cons: [
                'Complex implementation (two code paths)',
                'Need to classify accounts (celebrity threshold)',
                'Merge logic at read time adds latency (~30ms)',
                'More infrastructure (both systems)',
              ],
            },
          ],
        },
      ],
      canvasOperations: [
        {
          type: 'highlight',
          nodeIds: ['feed-service', 'tweet-db'],
          duration: 5000,
          color: '#ef4444',
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 3: ADDING COMPLEXITY (20 min) ==========
    {
      id: 'step-5-hybrid-fanout',
      title: 'The Hybrid Fan-out Strategy',
      phase: 'complexity',
      estimatedMinutes: 7,
      content: `
# Twitter's Solution: Hybrid Fan-out

Twitter uses **both push and pull** depending on the account:

## The Rules

**Fan-out on Write (Push)** for normal users:
- Author has <1M followers
- When they tweet, push to all followers' feed caches
- Followers read from cache (fast!)

**Fan-out on Read (Pull)** for celebrities:
- Author has >1M followers
- Store tweet in database only
- Fetch at read time and merge with cached feed

**Merge at Read Time:**
- Fetch cached feed (pushed tweets) → ~10ms
- Fetch from celebrity followings (pulled tweets) → ~50ms
- Merge and rank → ~20ms
- **Total: ~80ms** ✅ Under 100ms target!

## The Architecture

Let's add the hybrid system to our architecture...
      `,
      widgets: [
        {
          type: 'timeline',
          title: 'Hybrid Feed Load (Optimized)',
          events: [
            {
              label: 'User requests feed',
              description: 'User opens Twitter app',
              nodeIds: ['user-simple'],
            },
            {
              label: 'Fetch cached feed (push)',
              description: 'Read pre-computed feed from cache (~10ms)',
              nodeIds: ['feed-service', 'feed-cache'],
            },
            {
              label: 'Identify celebrity followings',
              description: 'Check which followings are celebrities (~5ms)',
              nodeIds: ['feed-service', 'social-graph'],
            },
            {
              label: 'Fetch celebrity tweets (pull)',
              description: 'Query tweets from celebrity followings (~50ms)',
              nodeIds: ['feed-service', 'tweet-db'],
            },
            {
              label: 'Merge and rank',
              description: 'Merge cached + pulled tweets (~20ms)',
              nodeIds: ['feed-service'],
            },
            {
              label: 'Return feed',
              description: 'Total: ~85ms ✅ Within target!',
              nodeIds: ['feed-service'],
            },
          ],
        },
        {
          type: 'quiz',
          question:
            'Why does Twitter set the celebrity threshold at 1M followers, not 10M?',
          options: [
            {
              id: 'arbitrary',
              text: "It's arbitrary - could be any number",
              correct: false,
              explanation:
                "Not arbitrary! There's math behind it. The threshold balances write cost vs read cost. At 1M followers, fan-out on write would create 1M cache writes per tweet. For an account tweeting 100 times/day, that's 100M writes/day, which is expensive.",
            },
            {
              id: 'write-cost',
              text: 'To limit write amplification - 1M writes per tweet is the sweet spot',
              correct: true,
              explanation:
                'Exactly! At 1M followers, each tweet creates 1M cache writes. That\'s the point where write cost exceeds read cost. For fewer followers, push is cheaper. For more followers, pull is cheaper. The threshold is where the costs cross over.',
            },
            {
              id: 'famous',
              text: 'Only very famous people have 1M+ followers',
              correct: false,
              explanation:
                'While true, the threshold is based on cost, not fame. If write infrastructure got cheaper, Twitter could raise the threshold to 10M. The number is driven by economics, not celebrity status.',
            },
            {
              id: 'performance',
              text: 'Pull is faster than push for accounts over 1M',
              correct: false,
              explanation:
                'Actually, push is FASTER for reads (cache hit vs database query). The threshold is about write cost, not read speed. Push costs too much at 1M+ followers, so we switch to pull despite slower reads.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'code-block',
          title: 'Hybrid Fan-out Implementation',
          language: 'python',
          code: `CELEBRITY_THRESHOLD = 1_000_000  # 1M followers

def get_hybrid_feed(user_id, limit=50):
    """
    Generate feed using hybrid fan-out strategy

    Push (cache) for normal users, pull (query) for celebrities
    """
    # 1. Fetch pre-computed feed from cache (pushed tweets)
    cached_feed = redis.get(f"feed:{user_id}")  # ~10ms

    # 2. Identify celebrity followings (accounts with >1M followers)
    followings = get_followings(user_id)
    celebrity_followings = [
        f for f in followings
        if get_follower_count(f) > CELEBRITY_THRESHOLD
    ]

    # 3. Fetch tweets from celebrities (pull)
    celebrity_tweets = []
    if celebrity_followings:
        celebrity_tweets = db.query("""
            SELECT * FROM tweets
            WHERE author_id IN %s
            AND created_at > NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
            LIMIT 500
        """, tuple(celebrity_followings))  # ~50ms

    # 4. Merge cached feed + celebrity tweets
    all_tweets = cached_feed + celebrity_tweets
    all_tweets.sort(key=lambda t: t.created_at, reverse=True)

    return all_tweets[:limit]  # Total: ~85ms`,
          highlights: [9, 10, 22, 23, 24, 29, 30],
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'fanout-service',
            type: 'archComponent',
            position: { x: 150, y: 450 },
            data: {
              componentType: 'worker',
              label: 'Fan-out Service',
              config: { description: 'Handles push to followers' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e7',
            source: 'server-simple',
            target: 'fanout-service',
            type: 'archEdge',
            data: { label: 'New tweet' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e8',
            source: 'fanout-service',
            target: 'feed-cache',
            type: 'archEdge',
            data: { label: 'Push to followers (if <1M)' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e9',
            source: 'fanout-service',
            target: 'social-graph',
            type: 'archEdge',
            data: { label: 'Get follower count' },
          },
        },
        {
          type: 'animate-flow',
          path: ['user-simple', 'feed-service', 'feed-cache'],
          duration: 800,
          label: 'Fast read from cache',
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-6-ranking-signals',
      title: 'From Chronological to Ranked Feed',
      phase: 'complexity',
      estimatedMinutes: 7,
      content: `
# Adding Intelligence: Ranking by Relevance

Hybrid fan-out solves speed, but users still see **chronological feeds**. Problem: they miss important tweets from hours ago.

## The 2016 Shift: Algorithmic Ranking

Twitter introduced ML-powered ranking to show **most relevant tweets first**, not just newest.

## Ranking Signals

**Engagement signals:**
- Likes, retweets, replies, quote tweets
- Video watch time
- Click-through rate on links

**Author signals:**
- How often user interacts with this author
- Author's follower count (authority)
- Account verification status

**Content signals:**
- Tweet length
- Media type (image/video)
- Hashtags and mentions
- Language and sentiment

**Recency:**
- Tweet age (newer = higher weight)
- But not pure chronological!

**Personal signals:**
- User's past interactions
- Topics user engages with
- Time of day user is active

## The Goal

Predict: **"Will this user engage with this tweet?"**
      `,
      widgets: [
        {
          type: 'comparison-table',
          title: 'Chronological vs Algorithmic Feed',
          columns: ['Approach', 'Pros', 'Cons', 'When to Use'],
          rows: [
            {
              label: 'Chronological',
              values: [
                'Time-based only',
                'Simple, transparent, real-time',
                'Users miss important older tweets, high-volume accounts dominate',
                'Breaking news, live events',
              ],
            },
            {
              label: 'Algorithmic (ML)',
              values: [
                'Relevance-based',
                'Surfaces important content, reduces FOMO, higher engagement',
                'Less transparent, filter bubble risk, complex to build',
                'Social networks, content discovery',
              ],
            },
            {
              label: 'Hybrid (Twitter)',
              values: [
                'ML with recency bias',
                'Relevant + timely, user control (toggle to chronological)',
                'Complexity of both approaches',
                'Twitter, LinkedIn, Instagram',
              ],
            },
          ],
        },
        {
          type: 'quiz',
          question:
            'Which signal is MOST predictive of whether a user will engage with a tweet?',
          options: [
            {
              id: 'followers',
              text: "Author's follower count",
              correct: false,
              explanation:
                "Follower count indicates authority but isn't the strongest predictor. A celebrity tweet might be popular globally but irrelevant to YOU specifically. Personal interaction history is more predictive.",
            },
            {
              id: 'recency',
              text: 'Tweet recency (how new it is)',
              correct: false,
              explanation:
                "Recency is important but not the strongest signal. A brand-new tweet from someone you never interact with won't engage you. Past interaction patterns are more predictive.",
            },
            {
              id: 'interaction',
              text: 'Past interactions with this author',
              correct: true,
              explanation:
                'Exactly! If you frequently like, retweet, or reply to Alice, you\'re very likely to engage with her next tweet. This is the strongest signal. Twitter\'s ML models weight this heavily - it\'s called "affinity."',
            },
            {
              id: 'likes',
              text: 'Number of likes the tweet already has',
              correct: false,
              explanation:
                'Global popularity helps (social proof), but personal affinity matters more. You might not care about a tweet with 100K likes if it\'s about a topic you never engage with.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'code-block',
          title: 'Feature Engineering for Ranking',
          language: 'python',
          code: `def extract_ranking_features(user, tweet, author):
    """
    Extract features for ML ranking model

    Returns:
        Feature vector for scoring this (user, tweet) pair
    """
    features = {}

    # Author affinity (strongest signal)
    features['user_author_interactions_30d'] = count_interactions(user, author, days=30)
    features['user_author_interaction_rate'] = (
        features['user_author_interactions_30d'] / max(1, author.tweets_30d)
    )

    # Engagement signals (from tweet metadata)
    features['tweet_likes'] = tweet.likes
    features['tweet_retweets'] = tweet.retweets
    features['tweet_replies'] = tweet.replies
    features['engagement_rate'] = (
        (tweet.likes + tweet.retweets + tweet.replies) /
        max(1, author.followers)
    )

    # Content features
    features['tweet_length'] = len(tweet.text)
    features['has_media'] = 1 if tweet.has_image or tweet.has_video else 0
    features['has_link'] = 1 if tweet.has_url else 0
    features['num_hashtags'] = len(tweet.hashtags)

    # Recency (decay function)
    age_hours = (now() - tweet.created_at).total_seconds() / 3600
    features['recency_score'] = 1.0 / (1.0 + age_hours / 24)  # Decay over 24h

    # User context
    features['user_follows_author'] = 1 if user.follows(author) else 0
    features['hour_of_day'] = now().hour
    features['day_of_week'] = now().weekday()

    return features`,
          highlights: [10, 11, 12, 13, 31],
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'ranking-service',
            type: 'archComponent',
            position: { x: 500, y: 150 },
            data: {
              componentType: 'app_server',
              label: 'Ranking Service',
              config: { description: 'ML-powered tweet ranking' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e10',
            source: 'feed-service',
            target: 'ranking-service',
            type: 'archEdge',
            data: { label: 'Candidate tweets' },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'ml-models',
            type: 'archComponent',
            position: { x: 500, y: 300 },
            data: {
              componentType: 'serverless',
              label: 'ML Models',
              config: { description: 'Engagement prediction' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e11',
            source: 'ranking-service',
            target: 'ml-models',
            type: 'archEdge',
            data: { label: 'Score tweets' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-7-trending-topics',
      title: 'Real-Time Trending Topics',
      phase: 'complexity',
      estimatedMinutes: 6,
      content: `
# Discovering What's Trending

Beyond personalized ranking, Twitter also surfaces **trending topics** - what's popular RIGHT NOW.

## The Challenge

- **Real-time**: Detect trends within minutes of emergence
- **Global + Local**: Different trends in different regions
- **Spam-resistant**: Bots shouldn't manipulate trends
- **Context-aware**: Show relevant trends to each user

## How It Works

**1. Count tweet volume by topic:**
- Extract hashtags, entities, phrases
- Count mentions over time windows (1min, 5min, 1hr)
- Compare current volume to historical baseline

**2. Detect spikes:**
- Normal: #MondayMotivation gets 10K tweets/hr every Monday
- Trending: #BreakingNews goes from 100 → 50K tweets/hr ← **SPIKE**

**3. Score trends:**
- Volume (how many tweets)
- Velocity (how fast it's growing)
- Diversity (how many unique users)
- Recency (when did it start)

**4. Personalize:**
- Filter by user's location
- Boost topics related to user's interests
- Suppress topics user has muted

## The Infrastructure

This requires **real-time stream processing** - we can't batch this overnight!
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Trending Topic Detection',
          language: 'python',
          code: `from collections import defaultdict
import time

class TrendingDetector:
    """
    Real-time trending topic detection using stream processing
    """

    def __init__(self):
        self.topic_counts = defaultdict(lambda: {
            '1m': 0, '5m': 0, '1h': 0, 'baseline': 0
        })
        self.topic_users = defaultdict(set)  # Unique users per topic

    def process_tweet(self, tweet):
        """
        Process incoming tweet and update topic counts
        """
        topics = extract_topics(tweet)  # Hashtags, entities, phrases

        for topic in topics:
            # Increment counters
            self.topic_counts[topic]['1m'] += 1
            self.topic_counts[topic]['5m'] += 1
            self.topic_counts[topic]['1h'] += 1

            # Track unique users (diversity)
            self.topic_users[topic].add(tweet.user_id)

    def get_trending(self, location=None, limit=10):
        """
        Get current trending topics
        """
        trends = []

        for topic, counts in self.topic_counts.items():
            # Calculate trend score
            volume = counts['1h']
            velocity = counts['1m'] / max(1, counts['5m'])  # Acceleration
            diversity = len(self.topic_users[topic])
            baseline = counts['baseline']  # Historical avg

            # Spike detection: current volume vs baseline
            spike = volume / max(1, baseline)

            # Combined score
            score = spike * velocity * (diversity ** 0.5)

            trends.append({
                'topic': topic,
                'score': score,
                'volume': volume,
                'velocity': velocity,
                'diversity': diversity
            })

        # Sort by score and return top N
        trends.sort(key=lambda x: x['score'], reverse=True)
        return trends[:limit]`,
          highlights: [41, 42, 43, 44, 45, 46],
        },
        {
          type: 'quiz',
          question:
            'Why does Twitter track "diversity" (unique users) for trending topics?',
          options: [
            {
              id: 'spam',
              text: 'To detect and suppress bot-driven spam campaigns',
              correct: true,
              explanation:
                'Exactly! A real trend has many unique users tweeting about it. A spam campaign might have 100K tweets but only 100 bots (same users tweeting repeatedly). Diversity filtering prevents bot manipulation of trends.',
            },
            {
              id: 'privacy',
              text: 'For privacy reasons - to anonymize who is tweeting',
              correct: false,
              explanation:
                'Diversity tracking is not about privacy. Twitter still knows who is tweeting. Diversity is used to detect spam - real trends have high user diversity, spam campaigns have low diversity.',
            },
            {
              id: 'popularity',
              text: 'More users = more popular topic',
              correct: false,
              explanation:
                'Close, but not the main reason! Popularity is measured by tweet volume. Diversity specifically helps detect spam. A topic with 10K tweets from 10K users is more legitimate than 10K tweets from 100 bots.',
            },
            {
              id: 'regional',
              text: 'To show different trends in different regions',
              correct: false,
              explanation:
                'Regional filtering is done separately using location metadata. Diversity tracking is about spam prevention - ensuring trends are driven by real users, not bots.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'kafka',
            type: 'archComponent',
            position: { x: 300, y: 500 },
            data: {
              componentType: 'kafka',
              label: 'Kafka - Tweet Stream',
              config: { description: '6,000 tweets/sec' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'trending-service',
            type: 'archComponent',
            position: { x: 500, y: 500 },
            data: {
              componentType: 'worker',
              label: 'Trending Service',
              config: { description: 'Real-time trend detection' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e12',
            source: 'server-simple',
            target: 'kafka',
            type: 'archEdge',
            data: { label: 'Publish tweets' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e13',
            source: 'kafka',
            target: 'trending-service',
            type: 'archEdge',
            data: { label: 'Stream processing' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 4: REAL TWITTER ARCHITECTURE (25 min) ==========
    {
      id: 'step-8-full-architecture',
      title: "Twitter's Real Production Architecture",
      phase: 'real',
      estimatedMinutes: 8,
      content: `
# The Complete Twitter Feed System

We've built up the pieces. Here's the full production architecture Twitter uses:

## Key Components

**Ingestion Layer:**
- Tweet Service (handles tweet creation)
- Media Upload Service (images, videos)
- Kafka (event stream - 6K tweets/sec)

**Storage:**
- Tweets DB (Manhattan - distributed key-value store)
- Social Graph DB (FlockDB - relationships)
- Feed Cache (Redis - pre-computed feeds)

**Feed Generation:**
- Fan-out Service (push to followers)
- Feed Service (pull for celebrities, merge)
- Ranking Service (ML-powered relevance)

**ML & Analytics:**
- Feature Store (user/tweet features)
- ML Models (engagement prediction)
- Trending Service (real-time topic detection)

**Serving:**
- API Gateway (rate limiting, auth)
- CDN (static assets)

This is what powers feeds for 500M+ users!
      `,
      widgets: [
        {
          type: 'timeline',
          title: 'Complete Tweet → Feed Flow',
          events: [
            {
              label: '1. User tweets',
              description: 'Tweet Service receives tweet',
              nodeIds: ['server-simple'],
            },
            {
              label: '2. Store tweet',
              description: 'Save to Tweets DB (Manhattan)',
              nodeIds: ['tweet-db'],
            },
            {
              label: '3. Publish to stream',
              description: 'Kafka event (for trending, analytics)',
              nodeIds: ['kafka'],
            },
            {
              label: '4. Fan-out decision',
              description: 'Check follower count → push or pull',
              nodeIds: ['fanout-service'],
            },
            {
              label: '5a. Push to followers (if <1M)',
              description: 'Write to feed caches',
              nodeIds: ['feed-cache'],
            },
            {
              label: '5b. Skip push (if >1M)',
              description: 'Will pull at read time',
              nodeIds: ['fanout-service'],
            },
            {
              label: '6. User loads feed',
              description: 'Feed Service merges push + pull',
              nodeIds: ['feed-service'],
            },
            {
              label: '7. Ranking',
              description: 'ML model scores tweets by relevance',
              nodeIds: ['ranking-service'],
            },
            {
              label: '8. Return feed',
              description: 'Ranked tweets shown to user (~80ms total)',
              nodeIds: ['feed-service'],
            },
          ],
        },
        {
          type: 'quiz',
          question:
            'Why does Twitter use Manhattan (key-value store) instead of PostgreSQL for tweets?',
          options: [
            {
              id: 'nosql',
              text: 'NoSQL is always better than SQL',
              correct: false,
              explanation:
                "NoSQL isn't universally better. PostgreSQL works great for many use cases. Twitter chose Manhattan for specific reasons related to their scale and access patterns.",
            },
            {
              id: 'scalability',
              text: 'Horizontal scalability - can scale to billions of tweets across many servers',
              correct: true,
              explanation:
                'Exactly! Twitter stores billions of tweets. PostgreSQL scales vertically (bigger servers) but hits limits around 10TB per instance. Manhattan (key-value store) scales horizontally - add more servers to handle more data. At Twitter\'s scale (1TB+ new data per day), horizontal scaling is essential.',
            },
            {
              id: 'performance',
              text: 'Key-value stores are faster than SQL databases',
              correct: false,
              explanation:
                'For simple key lookups (get tweet by ID), key-value stores are fast. But for complex queries (find all tweets by user in date range), SQL can be faster with proper indexes. The choice is about scalability, not just speed.',
            },
            {
              id: 'cost',
              text: 'Manhattan is cheaper than PostgreSQL',
              correct: false,
              explanation:
                "Cost isn't the primary driver at Twitter's scale. Both systems require massive infrastructure. The choice is about scalability and operational simplicity at billion-tweet scale.",
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'api-gateway',
            type: 'archComponent',
            position: { x: 300, y: 50 },
            data: {
              componentType: 'api_gateway',
              label: 'API Gateway',
              config: {},
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'feature-store',
            type: 'archComponent',
            position: { x: 700, y: 300 },
            data: {
              componentType: 'object_storage',
              label: 'Feature Store',
              config: { description: 'User/tweet features for ML' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e14',
            source: 'user-simple',
            target: 'api-gateway',
            type: 'archEdge',
            data: { label: 'API request' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e15',
            source: 'api-gateway',
            target: 'feed-service',
            type: 'archEdge',
            data: { label: 'Route to feed service' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e16',
            source: 'ranking-service',
            target: 'feature-store',
            type: 'archEdge',
            data: { label: 'Fetch features' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-9-ml-pipeline',
      title: 'The ML Training Pipeline',
      phase: 'real',
      estimatedMinutes: 9,
      content: `
# Training the Ranking Models

Our ML models don't magically predict engagement. We need:

1. **Data collection**: User interactions (likes, retweets, dwell time, clicks)
2. **Feature engineering**: Extract signals from raw data
3. **Model training**: Use ML frameworks (TensorFlow, PyTorch)
4. **Online serving**: Deploy models for real-time prediction

## The Training Loop

**Batch processing (daily):**
- Collect 24 hours of user interaction data
- Label examples: engagement = 1, no engagement = 0
- Extract features for each (user, tweet) pair
- Train model on millions of examples
- Validate on held-out test set
- Deploy new model if performance improves

**Real-time features:**
- Some features must be computed at serving time
- Tweet engagement count (likes accumulate in real-time)
- User's recent activity (what they just looked at)
- Time of day, day of week

## The Model

Twitter uses **gradient boosted trees** (LightGBM) for ranking:
- Fast inference (<1ms per tweet)
- Handles missing features gracefully
- Interpretable feature importance
- Good performance on tabular data

Deep learning models are used for:
- Image/video understanding
- Text embedding (semantic similarity)
- User embedding (taste representation)
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Model Training Pipeline',
          language: 'python',
          code: `import lightgbm as lgb
from sklearn.model_selection import train_test_split

def train_engagement_model():
    """
    Train LightGBM model to predict tweet engagement
    """
    # 1. Load training data from data warehouse
    # (user_id, tweet_id, features, label)
    data = load_training_data(
        start_date='2024-02-20',
        end_date='2024-02-21',
        sample_rate=0.1  # 10% sample = millions of examples
    )

    # 2. Extract features
    X = data[['user_author_affinity', 'tweet_likes', 'recency_score',
              'has_media', 'hour_of_day', ... ]]  # 100+ features
    y = data['engaged']  # Binary: 1 = liked/retweeted, 0 = skipped

    # 3. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 4. Train model
    model = lgb.LGBMClassifier(
        objective='binary',
        metric='auc',
        num_leaves=64,
        learning_rate=0.1,
        n_estimators=1000
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        early_stopping_rounds=50,
        verbose=100
    )

    # 5. Validate
    test_auc = model.score(X_test, y_test)
    print(f"Test AUC: {test_auc:.4f}")

    # 6. Deploy if better than current model
    current_auc = get_production_model_auc()
    if test_auc > current_auc + 0.001:  # 0.1% improvement threshold
        deploy_model(model, version=get_next_version())
        print(f"Deployed new model (AUC: {test_auc:.4f})")
    else:
        print("No improvement - keeping current model")

    return model`,
          highlights: [19, 20, 47, 48, 49],
        },
        {
          type: 'quiz',
          question:
            'Twitter trains models daily. Why not retrain every hour for fresher models?',
          options: [
            {
              id: 'cost',
              text: 'Training is too expensive to run every hour',
              correct: false,
              explanation:
                'While hourly training would be more expensive, cost is not the primary blocker at Twitter\'s scale. The real issue is that models need sufficient data to detect meaningful patterns. Hourly data is too noisy.',
            },
            {
              id: 'data',
              text: 'Hourly data is too noisy - models need 24h of data to learn stable patterns',
              correct: true,
              explanation:
                'Exactly! User behavior varies by hour (morning commute, lunch, evening). Training on just 1 hour might overfit to those patterns. Daily training captures full behavioral cycles. Also, models need millions of examples to train well - hourly data might not have enough.',
            },
            {
              id: 'deploy',
              text: 'Deploying models hourly would cause too many rollouts',
              correct: false,
              explanation:
                "Deployment frequency isn't the bottleneck. Twitter could deploy hourly if models improved hourly. The issue is that models trained on tiny data slices (1 hour) would be noisy and unreliable. Daily training balances freshness with stability.",
            },
            {
              id: 'latency',
              text: 'Training takes 24 hours to complete',
              correct: false,
              explanation:
                "Training actually completes in 1-2 hours with distributed systems. The choice of daily cadence is about data quality, not training time. You need 24h of user interactions to capture full behavioral patterns.",
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'Model Training Frequency',
          decision: 'How often should Twitter retrain ranking models?',
          options: [
            {
              label: 'Weekly',
              pros: [
                'Stable models (less overfitting to daily noise)',
                'Lower training cost',
                'Easier to validate changes',
                'Simpler operational overhead',
              ],
              cons: [
                'Stale models (1 week old data)',
                "Can't respond to rapid trend changes",
                'Misses recent user behavior shifts',
                'Lower engagement (older models = worse predictions)',
              ],
            },
            {
              label: 'Daily (Twitter)',
              pros: [
                'Fresh models (captures yesterday\'s trends)',
                'Responds to behavioral changes quickly',
                'Higher engagement (better predictions)',
                'Balances stability and freshness',
              ],
              cons: [
                'Higher training cost',
                'More deployments (operational complexity)',
                'Risk of overfitting to recent noise',
                'Need robust validation to catch bad models',
              ],
            },
            {
              label: 'Hourly',
              pros: [
                'Ultra-fresh models',
                'Immediate response to trends',
                'Captures intra-day patterns',
              ],
              cons: [
                'Too noisy (models overfit to hourly fluctuations)',
                'Insufficient data per training cycle',
                'Very high cost and complexity',
                'Unlikely to improve over daily',
              ],
            },
          ],
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'spark-training',
            type: 'archComponent',
            position: { x: 700, y: 500 },
            data: {
              componentType: 'worker',
              label: 'Apache Spark - ML Training',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e17',
            source: 'kafka',
            target: 'spark-training',
            type: 'archEdge',
            data: { label: 'Interaction events' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e18',
            source: 'spark-training',
            target: 'feature-store',
            type: 'archEdge',
            data: { label: 'Computed features' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e19',
            source: 'feature-store',
            target: 'ml-models',
            type: 'archEdge',
            data: { label: 'Training data' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-10-open-source',
      title: "Twitter's Open Source Algorithm (2023)",
      phase: 'real',
      estimatedMinutes: 8,
      content: `
# Behind the Curtain: The Open Source Release

In March 2023, Twitter open-sourced parts of their recommendation algorithm!

## What Was Released

**Candidate generation:**
- In-Network candidates (from people you follow)
- Out-of-Network candidates (from people you don't follow)
- Candidate scoring and filtering

**Ranking model:**
- Heavy Ranker (LightGBM model)
- Features used for ranking
- Model serving infrastructure

**What Wasn't Released:**
- User data and interaction logs
- Internal tooling and infrastructure
- Full training pipeline
- Trending topic algorithms

## Key Insights from the Code

**Multi-stage ranking:**
1. Candidate sourcing (~1500 tweets)
2. Light ranker (filter to ~500 tweets)
3. Heavy ranker (score all 500)
4. Diversity and heuristics (filter to 50 final tweets)

**Feature groups:**
- Author features (53 features)
- Tweet features (32 features)
- User-author engagement (97 features)
- User-tweet engagement (111 features)
- **Total: 293 features!**

**Optimization goal:**
Maximize expected engagement (weighted sum of likes, retweets, replies, dwell time)
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Twitter Open Source Ranking (Simplified)',
          language: 'scala',
          code: `// From: https://github.com/twitter/the-algorithm
// Simplified for educational purposes

object HeavyRanker {
  // Feature groups
  val AUTHOR_FEATURES = 53
  val TWEET_FEATURES = 32
  val USER_AUTHOR_ENGAGEMENT = 97
  val USER_TWEET_ENGAGEMENT = 111
  val TOTAL_FEATURES = 293

  // Engagement weights (tuned via A/B testing)
  val LIKE_WEIGHT = 0.5
  val RETWEET_WEIGHT = 1.0
  val REPLY_WEIGHT = 13.5  // Replies weighted MUCH higher!
  val VIDEO_PLAYBACK_WEIGHT = 0.005
  val PROFILE_CLICK_WEIGHT = 12.0

  def score(tweet: Tweet, user: User): Double = {
    // Extract 293 features
    val features = extractFeatures(tweet, user)

    // LightGBM model prediction
    val predictions = model.predict(features)

    // Weighted engagement score
    val score = (
      predictions.like * LIKE_WEIGHT +
      predictions.retweet * RETWEET_WEIGHT +
      predictions.reply * REPLY_WEIGHT +
      predictions.videoPlayback * VIDEO_PLAYBACK_WEIGHT +
      predictions.profileClick * PROFILE_CLICK_WEIGHT
    )

    return score
  }

  def rank(candidates: Seq[Tweet], user: User): Seq[Tweet] = {
    // Score all candidates
    val scored = candidates.map { tweet =>
      (tweet, score(tweet, user))
    }

    // Sort by score (descending)
    val ranked = scored.sortBy(-_._2)

    // Apply diversity heuristics (no more than 2 from same author)
    val diversified = applyDiversityFilters(ranked, user)

    return diversified.take(50)
  }
}`,
          highlights: [13, 14, 15],
        },
        {
          type: 'quiz',
          question:
            'Why does Twitter weight REPLIES 27x higher than LIKES (13.5 vs 0.5)?',
          options: [
            {
              id: 'rare',
              text: 'Replies are rarer than likes, so need higher weight',
              correct: false,
              explanation:
                "While replies ARE rarer, that's not the primary reason. The weight reflects VALUE, not rarity. Twitter's business goal is deeper engagement. Replies indicate conversation, which is more valuable than passive likes.",
            },
            {
              id: 'engagement',
              text: 'Replies indicate deeper engagement and conversation - more valuable to Twitter',
              correct: true,
              explanation:
                'Exactly! A like is a passive signal (0.5 seconds of attention). A reply requires thought, typing, and creates conversation - much more valuable for platform health. Twitter optimizes for engagement quality, not quantity. 1 reply > 27 likes in terms of value.',
            },
            {
              id: 'spam',
              text: 'Likes are easy to spam, replies are harder',
              correct: false,
              explanation:
                "While spam resistance is a consideration, it's not the main reason for the weight difference. Twitter has separate spam detection systems. The weight reflects the VALUE of replies (conversation) vs likes (passive engagement).",
            },
            {
              id: 'revenue',
              text: 'Replies generate more ad revenue',
              correct: false,
              explanation:
                "Revenue is indirectly related, but not the direct reason. Replies don't generate more ad impressions than likes. The weight reflects engagement QUALITY - replies create conversations that keep users on the platform longer.",
            },
          ],
          multiSelect: false,
        },
        {
          type: 'comparison-table',
          title: 'Engagement Signal Weights',
          columns: ['Action', 'Weight', 'Why', 'Implication'],
          rows: [
            {
              label: 'Like',
              values: [
                '0.5',
                'Passive, easy, common',
                'Optimize for likes = clickbait',
              ],
            },
            {
              label: 'Retweet',
              values: [
                '1.0',
                'Endorsement, amplification',
                'Shows strong agreement',
              ],
            },
            {
              label: 'Reply',
              values: [
                '13.5',
                'Deep engagement, conversation',
                'Optimize for replies = discussions',
              ],
            },
            {
              label: 'Video Playback',
              values: [
                '0.005',
                'Low threshold (3s watch)',
                'Noisy signal',
              ],
            },
            {
              label: 'Profile Click',
              values: [
                '12.0',
                'Interest in author',
                'Likely to follow',
              ],
            },
          ],
        },
      ],
      canvasOperations: [],
      nextCondition: 'click-next',
    },

    // ========== PHASE 5: HANDS-ON EXERCISE (20 min) ==========
    {
      id: 'step-11-exercise',
      title: 'Exercise: Add Topics Feature',
      phase: 'exercise',
      estimatedMinutes: 15,
      content: `
# Hands-On Challenge

You're a Twitter engineer. Product wants a new feature: **Topic Preferences**.

## The Feature

Users can select topics they're interested in (e.g., "AI/ML", "Sports", "Gaming").
Feed should show more tweets about their chosen topics.

## Your Task

Think through how you would implement this:

1. **Data model**: How do you store user topic preferences?
2. **Tweet classification**: How do you determine what topics a tweet belongs to?
3. **Integration**: How does this fit into the existing ranking model?
4. **Bootstrapping**: What do you show users who haven't selected topics yet?

## Discussion Points

- Should topics be extracted from hashtags, or use ML classification?
- How do you balance topic preferences with other signals (author affinity, recency)?
- What if a user selects 20 topics? Do you boost all equally?
- How do you prevent filter bubbles (users only seeing one topic)?

Take 10-15 minutes to think through your approach. When ready, click "Next" to see Twitter's solution.
      `,
      widgets: [
        {
          type: 'quiz',
          question:
            'How would you classify tweets into topics? What approach is most scalable?',
          options: [
            {
              id: 'hashtags',
              text: 'Use hashtags as topics (e.g., #AI → AI topic)',
              correct: false,
              explanation:
                'Simple but limited! Only ~10% of tweets have hashtags. You\'d miss 90% of content. Also, hashtags are user-generated and inconsistent (#ML vs #MachineLearning vs #AI). Better to use ML classification.',
            },
            {
              id: 'keywords',
              text: 'Keyword matching (if tweet contains "AI", classify as AI topic)',
              correct: false,
              explanation:
                'Better than hashtags but still brittle. What about "artificial intelligence" or "machine learning"? What if "AI" appears in a different context ("AI is overrated")? ML models handle nuance better.',
            },
            {
              id: 'ml',
              text: 'Train a text classification model (tweet text → topic probabilities)',
              correct: true,
              explanation:
                'Exactly! Train a BERT-style model that outputs probabilities for each topic. Input: tweet text, Output: [Sports: 0.05, AI/ML: 0.92, Gaming: 0.03]. This handles synonyms, context, and works on all tweets. Can assign multiple topics per tweet.',
            },
            {
              id: 'manual',
              text: 'Manual tagging by human reviewers',
              correct: false,
              explanation:
                "Doesn't scale! Twitter processes 6,000 tweets per second = 500M+ tweets per day. Manual tagging is impossible at this scale. ML classification is the only viable approach.",
            },
          ],
          multiSelect: false,
        },
        {
          type: 'code-block',
          title: 'Starter Code: Topic-Based Ranking',
          language: 'python',
          code: `def integrate_topic_preferences(user, tweet, base_score):
    """
    Adjust ranking score based on user's topic preferences

    Args:
        user: User object with topic_preferences
        tweet: Tweet object with topic_scores
        base_score: Score from existing ranking model

    Returns:
        Adjusted score incorporating topic preferences
    """
    # TODO: Implement your solution
    # Hints:
    # - user.topic_preferences = {'AI/ML': 0.9, 'Sports': 0.3, ...}
    # - tweet.topic_scores = {'AI/ML': 0.92, 'Sports': 0.05, ...}
    # - How do you combine topic match with base score?
    # - Should topic boost be additive or multiplicative?
    # - How do you prevent filter bubbles?

    pass`,
        },
      ],
      canvasOperations: [
        {
          type: 'highlight',
          nodeIds: ['ranking-service', 'ml-models'],
          duration: 10000,
          color: '#f59e0b',
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-12-exercise-solution',
      title: 'Solution: Topic Preferences',
      phase: 'exercise',
      estimatedMinutes: 5,
      content: `
# Twitter's Implementation

Twitter actually rolled out Topics in 2019! Here's how they did it:

## 1. Data Model

**User topic preferences:**
\`\`\`json
{
  "user_id": 12345,
  "followed_topics": ["AI/ML", "Startups", "Sports"],
  "topic_weights": {
    "AI/ML": 1.0,      // Explicitly followed
    "Startups": 1.0,
    "Sports": 0.3       // Implicitly inferred from engagement
  }
}
\`\`\`

**Tweet classification:**
- BERT-based text classifier
- Outputs probability distribution over 300+ topics
- Runs at ingestion time (when tweet is posted)
- Stored in tweet metadata

## 2. Integration with Ranking

**Feature addition:**
- Add topic match score to existing 293 features
- Feature = dot product of user topic weights × tweet topic scores

**Example:**
\`\`\`
User: {AI/ML: 1.0, Sports: 0.3}
Tweet: {AI/ML: 0.92, Sports: 0.05, Gaming: 0.03}

Topic score = (1.0 × 0.92) + (0.3 × 0.05) = 0.935
\`\`\`

## 3. Bootstrapping Cold Start

**New users (no topic preferences):**
- Onboarding flow: "Pick 3+ topics you're interested in"
- Default topics based on location (Sports in US, Football in UK)
- Learn from early interactions (if user likes AI tweets, boost AI)

## 4. Filter Bubble Prevention

**Diversity mechanisms:**
- Even if user follows AI/ML, show some non-AI tweets (serendipity)
- Limit: Max 60% of feed from followed topics
- Exploration bonus: Boost new topics user hasn't seen
- "Not interested" feedback loop
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Production Implementation',
          language: 'python',
          code: `import numpy as np

def integrate_topic_preferences(user, tweet, base_score):
    """
    Adjust ranking score based on topic preferences
    """
    # Compute topic match score
    topic_match = 0.0
    for topic, user_weight in user.topic_weights.items():
        tweet_score = tweet.topic_scores.get(topic, 0.0)
        topic_match += user_weight * tweet_score

    # Normalize to [0, 1]
    topic_match = min(1.0, topic_match)

    # Multiplicative boost (1.0 = no change, 2.0 = double score)
    topic_boost = 1.0 + topic_match

    # Cap boost to prevent filter bubbles
    max_boost = 1.5  # Max 50% increase
    topic_boost = min(topic_boost, max_boost)

    # Apply boost to base score
    adjusted_score = base_score * topic_boost

    # Exploration bonus for new topics (reduce filter bubble)
    if should_explore(user):  # Random 10% of time
        # Boost random non-followed topic
        novel_topic_boost = 1.2
        adjusted_score *= novel_topic_boost

    return adjusted_score


def should_explore(user):
    """
    Decide whether to show non-followed topics for serendipity
    """
    # 10% of feed slots reserved for exploration
    return np.random.random() < 0.1`,
          highlights: [6, 7, 8, 9, 14, 15, 18, 19],
        },
        {
          type: 'quiz',
          question:
            'Why does Twitter CAP the topic boost at 1.5x (max 50% increase)?',
          options: [
            {
              id: 'filter',
              text: 'To prevent filter bubbles - users should see diverse content',
              correct: true,
              explanation:
                'Exactly! Without a cap, users would ONLY see tweets about their followed topics. This creates echo chambers. Capping at 1.5x ensures topic preferences influence ranking but don\'t dominate it. Other signals (author affinity, engagement) still matter.',
            },
            {
              id: 'performance',
              text: 'Performance reasons - large boosts would skew ranking too much',
              correct: false,
              explanation:
                "Performance isn't the issue - boosting by 2x vs 1.5x has no performance impact. The cap is about product quality and diversity, not technical constraints.",
            },
            {
              id: 'accuracy',
              text: "Topic classification isn't accurate enough to justify higher boosts",
              correct: false,
              explanation:
                "While topic models aren't perfect, modern BERT-based classifiers are quite accurate (>90%). The cap is about preventing filter bubbles, not model accuracy.",
            },
            {
              id: 'spam',
              text: 'To prevent spammers from gaming the system',
              correct: false,
              explanation:
                "Spam prevention is handled separately. The cap is about user experience - ensuring diverse content even for users with strong topic preferences.",
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [],
      nextCondition: 'click-next',
    },

    // ========== PHASE 6: DEEP DIVE (30 min) ==========
    {
      id: 'step-13-ab-testing',
      title: 'A/B Testing Feed Changes',
      phase: 'deep-dive',
      estimatedMinutes: 10,
      content: `
# How Twitter Validates Changes

Every change to feed ranking is **A/B tested**:
- 50% of users see the new ranking (treatment)
- 50% see the old ranking (control)
- Measure impact on key metrics

## Metrics

**Primary (North Star):**
- **DAU (Daily Active Users)**: Did users come back?
- **Engagement rate**: % of feed loads that result in engagement
- **Time spent**: Hours per DAU

**Secondary:**
- Like rate, retweet rate, reply rate
- Profile clicks
- Tweet impressions
- Follower growth

**Guardrail metrics:**
- Diversity (topics, authors)
- Negative feedback (mutes, blocks, "not interested")
- Report rate (spam, harassment)

## Example A/B Test

**Hypothesis**: Topic preferences increase engagement

**Setup:**
- Control: Current ranking (no topic boost)
- Treatment: Topic-boosted ranking (1.5x boost)
- Duration: 2 weeks
- Sample size: 50M users

**Results:**
- +2% DAU (p < 0.001) ✅
- +4% engagement rate (p < 0.001) ✅
- -5% topic diversity (p < 0.01) ⚠️
- No impact on time spent (p = 0.23)

**Decision**: Ship with diversity safeguards
      `,
      widgets: [
        {
          type: 'comparison-table',
          title: 'A/B Test Results: Topic Preferences',
          columns: ['Metric', 'Control', 'Treatment', 'Change', 'P-value', 'Decision'],
          rows: [
            {
              label: 'DAU',
              values: [
                '100M users',
                '102M users',
                '+2%',
                '<0.001',
                '✅ Significant',
              ],
            },
            {
              label: 'Engagement Rate',
              values: ['15%', '15.6%', '+4%', '<0.001', '✅ Significant'],
            },
            {
              label: 'Topic Diversity',
              values: ['4.2 topics', '4.0 topics', '-5%', '0.008', '⚠️ Decline'],
            },
            {
              label: 'Time Spent',
              values: ['30 min/day', '30.1 min/day', '+0.3%', '0.23', '➖ Not sig'],
            },
          ],
        },
        {
          type: 'quiz',
          question:
            'The test shows +4% engagement but -5% topic diversity. Should Twitter ship?',
          options: [
            {
              id: 'ship',
              text: 'Yes - Engagement is the most important metric',
              correct: false,
              explanation:
                "Too simplistic! While engagement matters, diversity is critical for long-term health. Users in filter bubbles might engage short-term but churn long-term. Twitter needs to balance both.",
            },
            {
              id: 'no',
              text: 'No - Diversity decline is unacceptable',
              correct: false,
              explanation:
                "Too conservative! A 5% diversity decline is noticeable but not catastrophic. Twitter would ship this with safeguards: exploration bonuses, diversity requirements, and monitoring.",
            },
            {
              id: 'ship-monitor',
              text: 'Yes, but add diversity safeguards (10% exploration slots) and monitor long-term retention',
              correct: true,
              explanation:
                'Perfect! Twitter would ship this change but add mechanisms to preserve diversity: reserve 10% of feed slots for exploration (non-followed topics), monitor 3-month retention to catch filter bubble effects, and add "Not interested" feedback. Short-term engagement gain with long-term health safeguards.',
            },
            {
              id: 'extend',
              text: 'Extend test to 3 months to measure long-term retention',
              correct: false,
              explanation:
                "While long-term data is valuable, 3 months is too long to make a decision. Twitter would ship with monitoring instead of delaying. If long-term metrics decline, they can adjust or rollback.",
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'A/B Testing Strategies',
          decision: 'How should Twitter approach experimentation?',
          options: [
            {
              label: 'Ship Fast (No A/B Tests)',
              pros: [
                'Faster iteration',
                'Lower infrastructure cost',
                'Engineers move faster',
                'Simpler deployment',
              ],
              cons: [
                'No validation of impact',
                'Risk breaking user experience',
                'Hard to rollback bad changes',
                "Can't measure ROI",
              ],
            },
            {
              label: 'A/B Test Everything (Twitter)',
              pros: [
                'Validate impact before rollout',
                'Data-driven decisions',
                'Catch regressions early',
                'Quantify improvement',
              ],
              cons: [
                'Slower deployments (2-week tests)',
                'Complex infrastructure',
                'Experiment interference (tests overlap)',
                'Requires statistical expertise',
              ],
            },
            {
              label: 'Canary Rollouts Only',
              pros: [
                'Faster than full A/B tests',
                'Catch crashes/errors',
                'Gradual rollout (1% → 100%)',
              ],
              cons: [
                "Can't measure subtle metric changes",
                'No control group',
                'Hard to detect 1-2% improvements',
                'Requires excellent observability',
              ],
            },
          ],
        },
      ],
      canvasOperations: [],
      nextCondition: 'click-next',
    },

    {
      id: 'step-14-scaling-challenges',
      title: 'Operating at Twitter Scale',
      phase: 'deep-dive',
      estimatedMinutes: 10,
      content: `
# The Operational Challenges

Running Twitter's feed at 500M+ users creates unique challenges:

## 1. Thundering Herd Problem

**The problem:**
- Celebrity with 100M followers tweets
- 100M feed caches need updating
- All updates hit database simultaneously
- Database crashes under load

**The solution:**
- Rate limiting: Spread updates over 30 seconds
- Priority queue: Update most-active users first
- Fallback: If update fails, serve stale cache + pull at read time

## 2. Cache Consistency

**The problem:**
- User follows someone new
- Their feed cache is now incomplete
- How do you invalidate and rebuild?

**The solution:**
- Eventual consistency: Cache refreshes every 5 minutes
- Hybrid read: Merge cache + pull from new followings
- "Following pulse": Bump cache version when user follows someone

## 3. Model Deployment

**The problem:**
- New ranking model trained daily
- Need to deploy to 10,000+ servers
- Zero downtime during deployment

**The solution:**
- Blue-green deployment: Keep old model running
- Gradual rollout: 1% → 10% → 50% → 100%
- Canary metrics: Monitor latency, error rate during rollout
- Instant rollback if issues detected

## 4. Feature Store Latency

**The problem:**
- Ranking needs 293 features per tweet
- Features stored in distributed database
- Fetching features adds latency

**The solution:**
- Cache hot features (for active users)
- Batch feature fetches (get 500 tweets' features in 1 query)
- Pre-compute slow features offline
- Approximate features if fetch times out
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Thundering Herd Rate Limiting',
          language: 'python',
          code: `import time
from queue import PriorityQueue

class RateLimitedFanout:
    """
    Prevent thundering herd when celebrity tweets

    Spreads fan-out updates over time instead of all at once
    """

    def __init__(self, max_writes_per_sec=100000):
        self.max_writes_per_sec = max_writes_per_sec
        self.queue = PriorityQueue()

    def fanout_tweet(self, tweet, followers):
        """
        Fan-out tweet to followers with rate limiting
        """
        if len(followers) < 1_000_000:
            # Normal user - fan-out immediately
            for follower_id in followers:
                push_to_feed_cache(follower_id, tweet)
        else:
            # Celebrity - rate limit to prevent thundering herd
            print(f"Celebrity tweet ({len(followers)} followers) - rate limiting")

            # Prioritize active users (they're more likely to read feed)
            followers_by_priority = sorted(
                followers,
                key=lambda f: get_activity_score(f),
                reverse=True
            )

            # Add to priority queue
            for i, follower_id in enumerate(followers_by_priority):
                priority = i  # Lower = higher priority
                self.queue.put((priority, follower_id, tweet))

            # Process queue with rate limiting
            self._process_queue()

    def _process_queue(self):
        """
        Process queue at max_writes_per_sec rate
        """
        writes_this_second = 0
        second_start = time.time()

        while not self.queue.empty():
            # Rate limit: max N writes per second
            if writes_this_second >= self.max_writes_per_sec:
                elapsed = time.time() - second_start
                if elapsed < 1.0:
                    time.sleep(1.0 - elapsed)  # Wait until next second
                writes_this_second = 0
                second_start = time.time()

            # Process next follower
            priority, follower_id, tweet = self.queue.get()
            push_to_feed_cache(follower_id, tweet)
            writes_this_second += 1`,
          highlights: [18, 19, 20, 27, 28, 29, 30, 47, 48, 49],
        },
        {
          type: 'quiz',
          question:
            'Twitter processes 6,000 tweets/sec. A celebrity with 100M followers tweets. How long does fan-out take at 100K writes/sec?',
          options: [
            {
              id: '10s',
              text: '10 seconds',
              correct: false,
              explanation:
                'Too optimistic! 100M followers / 100K writes per second = 1,000 seconds. You calculated 100M / 10M perhaps?',
            },
            {
              id: '100s',
              text: '100 seconds (~1.5 minutes)',
              correct: false,
              explanation:
                "Still too fast. Let's do the math: 100,000,000 followers ÷ 100,000 writes/sec = 1,000 seconds.",
            },
            {
              id: '1000s',
              text: '1,000 seconds (~16 minutes)',
              correct: true,
              explanation:
                "Exactly! 100M writes at 100K writes/sec = 1,000 seconds ≈ 16 minutes. This is why Twitter doesn't fan-out celebrity tweets to ALL followers. They use hybrid approach: skip fan-out, pull at read time instead.",
            },
            {
              id: '10000s',
              text: '10,000 seconds (~2.8 hours)',
              correct: false,
              explanation:
                'Too slow. 100M / 100K = 1,000 seconds, not 10,000. You might have calculated at 10K writes/sec instead of 100K.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [],
      nextCondition: 'click-next',
    },

    {
      id: 'step-15-conclusion',
      title: 'Conclusion & Next Steps',
      phase: 'deep-dive',
      estimatedMinutes: 10,
      content: `
# You've Built Twitter's Feed Ranking System! 🎉

## What You Learned

Over the past ~105 minutes, you've explored:

✅ **Fan-out strategies** (push vs pull, hybrid approach)
✅ **Chronological vs algorithmic feeds** and the evolution
✅ **Hybrid fan-out** for scalability (push for normal users, pull for celebrities)
✅ **ML-powered ranking** with 293 features
✅ **Real-time trending topics** with spike detection
✅ **Twitter's open source algorithm** (2023 release insights)
✅ **Topic preferences** and filter bubble prevention
✅ **A/B testing infrastructure** for validating changes
✅ **Operational challenges** at 500M+ user scale

## The Architecture

You now understand the complete Twitter feed system:
- **Hybrid fan-out** (push + pull)
- **ML ranking** (LightGBM with 293 features)
- **Real-time streaming** (Kafka, trending detection)
- **Storage** (Manhattan, FlockDB, Redis)
- **Multi-stage ranking** (candidate sourcing → light ranker → heavy ranker → diversity)

## The Numbers

- **500M+ daily active users**
- **6,000 tweets per second**
- **100M+ feed loads per day**
- **293 features** in ranking model
- **1M followers** threshold for fan-out strategy switch
- **<100ms** target feed latency

## Next Steps

**Want to learn more?**

1. **Read the open source code**: https://github.com/twitter/the-algorithm
2. **Twitter Engineering Blog**: https://blog.twitter.com/engineering
3. **Explore other walkthroughs**:
   - Netflix Recommendation System
   - Instagram Feed Ranking
   - Uber Real-Time Dispatch
   - Stripe Payment Processing

4. **Build your own**: Try implementing a simple feed ranking system!

**Share this walkthrough**:
- Tell your colleagues about this learning platform
- Contribute improvements or new examples

Thank you for learning with us! 🚀
      `,
      widgets: [
        {
          type: 'comparison-table',
          title: 'Your Learning Journey',
          columns: ['Phase', 'Topics', 'Duration', 'Status'],
          rows: [
            {
              label: 'Phase 1: Problem',
              values: ['Fan-out strategies, chronological feed', '10 min', '✅ Complete'],
            },
            {
              label: 'Phase 2: Naive',
              values: ['Chronological implementation, scaling issues', '15 min', '✅ Complete'],
            },
            {
              label: 'Phase 3: Complexity',
              values: ['Hybrid fan-out, ML ranking, trending topics', '20 min', '✅ Complete'],
            },
            {
              label: 'Phase 4: Real',
              values: [
                'Full architecture, ML pipeline, open source algorithm',
                '25 min',
                '✅ Complete',
              ],
            },
            {
              label: 'Phase 5: Exercise',
              values: ['Hands-on: Add topic preferences', '20 min', '✅ Complete'],
            },
            {
              label: 'Phase 6: Deep Dive',
              values: ['A/B testing, scaling challenges', '20 min', '✅ Complete'],
            },
          ],
        },
      ],
      canvasOperations: [],
      nextCondition: 'click-next',
    },
  ],
};
