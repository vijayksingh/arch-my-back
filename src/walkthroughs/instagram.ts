import type { Walkthrough } from '@/types/walkthrough';

/**
 * Instagram System Design - Interactive Walkthrough
 *
 * A comprehensive 90-120 minute progressive learning experience that builds understanding
 * of Instagram's architecture from first principles to production scale.
 *
 * Sources:
 * - Instagram Engineering Blog: https://instagram-engineering.com/
 * - "Scaling Instagram Infrastructure" - Instagram Engineering Team
 * - Cassandra at Instagram: https://instagram-engineering.com/open-sourcing-a-more-efficient-lightweight-client-for-cassandra-586f6e8e340e
 * - Instagram Feed Ranking: https://instagram-engineering.com/powered-by-ai-instagrams-explore-recommender-system-7ca901d2a882
 */

export const instagramWalkthrough: Walkthrough = {
  id: 'instagram-system-design-walkthrough',
  slug: 'instagram-system-design',
  title: 'Instagram System Design',
  description:
    'Build understanding of how Instagram serves 1B+ users with photos, feeds, and real-time interactions at massive scale',
  learningGoals: [
    'Understand feed generation strategies: push model, pull model, and hybrid approaches',
    'Learn image storage architecture with CDN and geo-replication',
    'Explore graph database design for social relationships',
    'Deep dive into real-time systems and eventual consistency trade-offs',
  ],
  estimatedMinutes: 120,
  difficulty: 'intermediate',
  tags: [
    'system-design',
    'distributed-systems',
    'social-networks',
    'image-storage',
    'feed-generation',
    'cassandra',
  ],
  sources: [
    {
      title: 'Instagram Engineering Blog',
      url: 'https://instagram-engineering.com/',
    },
    {
      title: 'Scaling Instagram Infrastructure',
      url: 'https://instagram-engineering.com/tagged/infrastructure',
    },
    {
      title: 'Cassandra at Instagram',
      url: 'https://instagram-engineering.com/open-sourcing-a-more-efficient-lightweight-client-for-cassandra-586f6e8e340e',
    },
    {
      title: "Instagram's Explore Recommender System",
      url: 'https://instagram-engineering.com/powered-by-ai-instagrams-explore-recommender-system-7ca901d2a882',
    },
  ],

  steps: [
    // ========== PHASE 1: PROBLEM INTRODUCTION (10 min) ==========
    {
      id: 'step-1-intro',
      title: 'Building Instagram at Scale',
      phase: 'intro',
      estimatedMinutes: 5,
      content: `
# Welcome to Instagram System Design

You're building Instagram. The requirements:
- **1 billion+ active users** worldwide
- **100 million photos uploaded per day**
- **Users expect instant feed updates** (< 200ms load time)
- **Core features**:
  - Upload photos/videos
  - Follow users
  - Like and comment on posts
  - View personalized feed
  - Stories (24-hour ephemeral content)

## The Scale Challenge

Instagram started as a simple photo-sharing app built by 2 engineers in 2010. Within 2 years, they had:
- **30 million users**
- **5 billion photos**
- Acquired by Facebook for $1 billion

Today's numbers are staggering:
- **500 million daily active users**
- **100 million photos/videos per day**
- **4.2 billion likes per day**
- Average feed load time: **<200ms**

## Think First: What's Hard?

Before we dive into solutions, consider the challenges you'll face...
      `,
      widgets: [
        {
          type: 'quiz',
          question: 'If you were building Instagram v1 (MVP with 1,000 users), what would you focus on FIRST?',
          options: [
            {
              id: 'scale',
              text: 'Build for scale from day one - use Cassandra, Kafka, microservices',
              correct: false,
              explanation:
                'This is over-engineering! With 1,000 users, a simple monolith with PostgreSQL can handle millions of requests per day. Premature optimization wastes time. Instagram actually started with Django + PostgreSQL and only scaled later.',
            },
            {
              id: 'simple',
              text: 'Build the simplest thing that works - monolith with SQL database',
              correct: true,
              explanation:
                'Perfect! Instagram started exactly this way: Django (Python) + PostgreSQL + S3 for images. This served millions of users before they needed to scale. The lesson: start simple, validate product-market fit, THEN scale.',
            },
            {
              id: 'features',
              text: 'Add as many features as possible to attract users',
              correct: false,
              explanation:
                'Feature bloat kills startups! Instagram launched with ONE core feature: upload a square photo with a filter. That\'s it. No comments, no videos, no stories. Focus beats complexity.',
            },
            {
              id: 'ml',
              text: 'Build ML-powered personalized feeds from the start',
              correct: false,
              explanation:
                'You need data to train ML models! With 1,000 users, you don\'t have enough data for meaningful personalization. Start with simple chronological feeds, collect data, THEN add ML.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'user-mobile',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: {
              componentType: 'client_mobile',
              label: 'Mobile User',
              config: {},
            },
          },
          highlight: true,
        },
        {
          type: 'add-node',
          node: {
            id: 'instagram-server',
            type: 'archComponent',
            position: { x: 400, y: 100 },
            data: {
              componentType: 'app_server',
              label: 'Instagram Server',
              config: {},
            },
          },
          highlight: true,
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-user-server',
            source: 'user-mobile',
            target: 'instagram-server',
            type: 'archEdge',
            data: { label: 'Upload photo / View feed' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-2-core-challenges',
      title: 'The Three Core Challenges',
      phase: 'intro',
      estimatedMinutes: 5,
      content: `
# What Makes Instagram Hard?

Three fundamental challenges define Instagram's architecture:

## 1. Feed Generation at Scale

**The Problem**: When a user opens Instagram, show them a personalized feed of recent posts from people they follow.

**The Math**:
- 1 billion users
- Average user follows 500 people
- Each followed user posts 2 times per day
- Feed query: "Get latest 50 posts from 500 followed users"

**Naive approach**: SQL JOIN on every feed request
\`\`\`sql
SELECT * FROM posts
WHERE user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?)
ORDER BY created_at DESC
LIMIT 50
\`\`\`

**Problem**: This query scans 500 users × 100 posts each = **50,000 rows** per request. With 500M daily active users, that's **25 trillion rows scanned per day**. Your database explodes.

## 2. Image Storage & Delivery

**The Problem**: Store and serve 100 million photos per day to users worldwide with <200ms latency.

**The Math**:
- Average photo size: 2MB (original) + 200KB (compressed)
- 100M photos/day × 2MB = **200TB of new data per day**
- Total storage: **5 billion photos** × 2MB = **10 petabytes**
- Peak load: **50,000 image requests per second**

**Naive approach**: Store images in your database or on local disk.

**Problem**: Databases aren't designed for blob storage. Disk I/O limits you to ~100 requests/second. You need distributed object storage and CDNs.

## 3. Social Graph at Scale

**The Problem**: Store relationships (who follows whom) and query them efficiently.

**The Math**:
- 1 billion users
- Average user follows 500 people
- Total edges: **500 billion relationships**
- Common queries:
  - "Get all followers of user X" (500 rows)
  - "Do users A and B follow each other?" (2 lookups)
  - "Find mutual friends" (complex graph traversal)

**Naive approach**: SQL table with (follower_id, followee_id).

**Problem**: At 500 billion rows, SQL JOIN queries become too slow. You need a database optimized for graph operations.

Let's start solving these...
      `,
      canvasOperations: [],
      widgets: [
        {
          type: 'quiz',
          question: 'Which challenge is the HARDEST to solve at Instagram\'s scale?',
          options: [
            {
              id: 'storage',
              text: 'Image storage - 10 petabytes is a lot of data',
              correct: false,
              explanation:
                'Storage is expensive but straightforward - just buy more S3 storage! The real challenge is DELIVERY (latency). S3 + CloudFront CDN solves this. Storage is a "throw money at it" problem.',
            },
            {
              id: 'feed',
              text: 'Feed generation - computing feeds in real-time for 1B users',
              correct: true,
              explanation:
                'Exactly! Feed generation is the hardest problem. You can\'t compute feeds on-demand (too slow). You can\'t pre-compute all feeds (too much storage). Instagram uses a HYBRID approach: pre-compute for power users, compute on-demand for others. This requires careful engineering.',
            },
            {
              id: 'graph',
              text: 'Social graph - 500 billion relationships to query',
              correct: false,
              explanation:
                'The graph is large but queries are simple (get followers, check relationship). Cassandra handles this well with denormalized tables. Feed generation is harder because it combines graph queries + post ranking + real-time updates.',
            },
            {
              id: 'all',
              text: 'All three are equally hard',
              correct: false,
              explanation:
                'They\'re all challenging, but feed generation is the bottleneck. Image storage and graph queries are "solved problems" with known solutions (S3+CDN, Cassandra). Feed generation requires custom architecture balancing latency, freshness, and cost.',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 2: NAIVE APPROACH (15 min) ==========
    {
      id: 'step-3-naive-architecture',
      title: 'The Naive Instagram (v1)',
      phase: 'naive',
      estimatedMinutes: 8,
      content: `
# Building Instagram v1: The Simplest Thing That Works

Instagram actually started this way in 2010. Let's build the MVP:

## The Stack

- **Backend**: Django (Python web framework)
- **Database**: PostgreSQL
- **Image Storage**: Amazon S3
- **Web Server**: Nginx
- **Hosting**: AWS EC2

## The Data Model

Three simple tables:

**Users**
\`\`\`sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

**Posts**
\`\`\`sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  image_url TEXT NOT NULL,  -- S3 URL
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
\`\`\`

**Follows**
\`\`\`sql
CREATE TABLE follows (
  follower_id INTEGER REFERENCES users(id),
  followee_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_followee ON follows(followee_id);
\`\`\`

## Feed Generation (Naive)

When a user opens the app, run this query:

\`\`\`sql
-- Get latest 50 posts from people I follow
SELECT posts.* FROM posts
JOIN follows ON posts.user_id = follows.followee_id
WHERE follows.follower_id = <current_user_id>
ORDER BY posts.created_at DESC
LIMIT 50;
\`\`\`

**How it works**:
1. Find all users current user follows (from \`follows\` table)
2. Get posts from those users (JOIN)
3. Sort by timestamp (ORDER BY)
4. Return top 50

This works perfectly for 1,000 users!
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'postgres',
            type: 'archComponent',
            position: { x: 400, y: 250 },
            data: {
              componentType: 'postgres',
              label: 'PostgreSQL',
              config: { description: 'Users, Posts, Follows' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 's3-simple',
            type: 'archComponent',
            position: { x: 600, y: 250 },
            data: {
              componentType: 'object_storage',
              label: 'S3 - Images',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e1',
            source: 'instagram-server',
            target: 'postgres',
            type: 'archEdge',
            data: { label: 'Store user data, posts, follows' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e2',
            source: 'instagram-server',
            target: 's3-simple',
            type: 'archEdge',
            data: { label: 'Store/retrieve images' },
          },
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Django View - Feed Generation (Naive)',
          language: 'python',
          code: `from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import Post, Follow

@login_required
def feed(request):
    """
    Generate feed for the current user
    Simple approach: JOIN posts with follows table
    """
    # Get current user
    user = request.user

    # SQL equivalent:
    # SELECT posts.* FROM posts
    # JOIN follows ON posts.user_id = follows.followee_id
    # WHERE follows.follower_id = user.id
    # ORDER BY posts.created_at DESC
    # LIMIT 50

    posts = Post.objects.filter(
        user__in=Follow.objects.filter(
            follower=user
        ).values_list('followee', flat=True)
    ).order_by('-created_at')[:50]

    return render(request, 'feed.html', {'posts': posts})`,
          highlights: [14, 15, 16, 17, 18, 19],
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-4-naive-breaks',
      title: 'When the Naive Approach Breaks',
      phase: 'naive',
      estimatedMinutes: 7,
      content: `
# Scaling Pains: From 10K to 10M Users

Instagram hit 10,000 users in the first week. By month 2, they had 1 million. The naive approach started breaking:

## Problem 1: Feed Query Performance

**At 10K users**:
- Average user follows 50 people
- Feed query scans 50 × 100 posts = 5,000 rows
- Query time: ~50ms ✅

**At 1M users**:
- Average user follows 200 people
- Feed query scans 200 × 500 posts = 100,000 rows
- Query time: ~2 seconds ❌

**At 100M users**:
- Average user follows 500 people
- Feed query scans 500 × 1000 posts = 500,000 rows
- Query time: **10+ seconds** 💥

The JOIN becomes impossibly slow. PostgreSQL indexes can't save you—the query is fundamentally O(N × M) where N = followed users, M = posts per user.

## Problem 2: Database Hotspots

Celebrity accounts create hotspots:
- Cristiano Ronaldo: **500M followers**
- When he posts, 500M feed queries hit the database
- Each query: "Get latest post from Ronaldo"
- Database: **overwhelmed**

The \`posts\` table for high-profile users gets hammered. Indexes help, but not enough.

## Problem 3: Storage Growth

**At 1M daily active users**:
- 10M photos uploaded per day
- 10M × 2MB = **20TB per day**
- Monthly storage: **600TB**
- Annual storage: **7.3 petabytes**

PostgreSQL is not designed for petabytes of blob data. You need distributed object storage.

## What Instagram Did

In 2011, at 10M users, Instagram made three architectural changes:
1. **Feed Generation**: Switch to fanout-on-write (pre-compute feeds)
2. **Image Storage**: Move to S3 + CloudFront CDN
3. **Social Graph**: Move to Cassandra for follows

Let's explore each solution...
      `,
      canvasOperations: [
        {
          type: 'highlight',
          nodeIds: ['postgres'],
          duration: 5000,
          color: '#ef4444',
        },
      ],
      widgets: [
        {
          type: 'quiz',
          question: 'At what scale does the naive SQL JOIN approach become too slow?',
          options: [
            {
              id: '1k',
              text: '1,000 users - SQL can\'t handle this scale',
              correct: false,
              explanation:
                'SQL handles 1,000 users easily! Even scanning 50K rows for feed generation takes <50ms. PostgreSQL can handle millions of simple queries per second.',
            },
            {
              id: '100k',
              text: '100,000 users - queries start taking 500ms+',
              correct: true,
              explanation:
                'Correct! Around 100K users, feed queries start degrading. Each query scans 100K-500K rows, taking 500ms-2s. This is too slow for real-time feeds. Instagram hit this limit around month 6.',
            },
            {
              id: '1m',
              text: '1M users - database completely fails',
              correct: false,
              explanation:
                'The database doesn\'t fail at 1M users, but queries become painfully slow (2-10 seconds). Instagram switched to fanout-on-write BEFORE hitting complete failure.',
            },
            {
              id: 'never',
              text: 'Never - you can always scale SQL with better hardware',
              correct: false,
              explanation:
                'Vertical scaling has limits! Even the largest PostgreSQL instance (100+ cores, 1TB RAM) can\'t handle 100M users querying feeds. The query complexity is the bottleneck, not the hardware.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'Feed Generation Approaches',
          decision: 'How should Instagram generate feeds?',
          options: [
            {
              label: 'Pull Model (Fanout-on-Read)',
              pros: [
                'Simple implementation (SQL JOIN)',
                'Always fresh (real-time)',
                'No storage overhead',
                'Works great for <100K users',
              ],
              cons: [
                'Slow for users following many people (500ms-10s)',
                'Expensive at scale (billions of queries per day)',
                'Celebrity posts create database hotspots',
                'Can\'t scale beyond 1M users',
              ],
            },
            {
              label: 'Push Model (Fanout-on-Write)',
              pros: [
                'Fast reads (pre-computed feeds)',
                'No query complexity (simple cache lookup)',
                'Scales to billions of users',
                'Consistent latency (<50ms)',
              ],
              cons: [
                'Slow writes for celebrities (push to 500M followers)',
                'High storage cost (500M feeds × 50 posts each)',
                'Stale data (eventual consistency)',
                'Complex implementation',
              ],
            },
            {
              label: 'Hybrid (Instagram)',
              pros: [
                'Push for most users (fast reads)',
                'Pull for celebrities (avoid slow writes)',
                'Best of both worlds',
                'Tunable per user',
              ],
              cons: [
                'Very complex (two code paths)',
                'Need heuristics (who is a celebrity?)',
                'Harder to debug',
                'Requires sophisticated infrastructure',
              ],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 3: FEED GENERATION STRATEGIES (20 min) ==========
    {
      id: 'step-5-fanout-on-write',
      title: 'Fanout-on-Write (Push Model)',
      phase: 'complexity',
      estimatedMinutes: 7,
      content: `
# Solution 1: Pre-Compute Feeds (Fanout-on-Write)

Instead of computing feeds at read time, **pre-compute them when a post is created**.

## How It Works

**When a user posts**:
1. User A posts a photo
2. Find all of User A's followers (500 people)
3. For each follower, insert the post into their pre-computed feed
4. Store feeds in Redis (fast key-value store)

**When a user opens the app**:
1. User B requests feed
2. Lookup: \`REDIS GET feed:user_B\`
3. Return pre-computed list (instant!)

## The Architecture

\`\`\`
User A posts photo
    ↓
Get A's followers: [B, C, D, ..., 500 users]
    ↓
For each follower:
  REDIS LPUSH feed:B <post_id>
  REDIS LPUSH feed:C <post_id>
  REDIS LPUSH feed:D <post_id>
    ↓
Done (async, background job)
\`\`\`

**Read time**:
\`\`\`
User B opens app
    ↓
REDIS LRANGE feed:B 0 49  (get top 50 post IDs)
    ↓
Fetch post details from DB
    ↓
Return feed (50ms)
\`\`\`

## The Trade-offs

✅ **Pros**:
- Feed reads are **instant** (just a cache lookup)
- Scales to billions of users
- Consistent latency (<50ms)

❌ **Cons**:
- Slow for celebrity posts (must push to 500M followers)
- High storage (500M users × 50 posts × 8 bytes = 200GB in Redis)
- Eventual consistency (posts appear after ~1 second)
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'redis-feed',
            type: 'archComponent',
            position: { x: 400, y: 400 },
            data: {
              componentType: 'redis',
              label: 'Redis - Feed Cache',
              config: { description: 'Pre-computed feeds' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'celery-worker',
            type: 'archComponent',
            position: { x: 200, y: 400 },
            data: {
              componentType: 'worker',
              label: 'Celery Workers',
              config: { description: 'Fanout background jobs' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e3',
            source: 'instagram-server',
            target: 'celery-worker',
            type: 'archEdge',
            data: { label: 'Enqueue fanout job' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e4',
            source: 'celery-worker',
            target: 'redis-feed',
            type: 'archEdge',
            data: { label: 'Write to feeds' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e5',
            source: 'celery-worker',
            target: 'postgres',
            type: 'archEdge',
            data: { label: 'Get followers' },
          },
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Fanout-on-Write Implementation',
          language: 'python',
          code: `import redis
from celery import shared_task

# Redis client
redis_client = redis.Redis(host='localhost', port=6379)

@shared_task
def fanout_post_to_followers(post_id, author_id):
    """
    Background job: Push new post to all followers' feeds

    This runs asynchronously after a user posts
    """
    # 1. Get all followers of the author
    followers = Follow.objects.filter(
        followee_id=author_id
    ).values_list('follower_id', flat=True)

    # 2. Push post to each follower's feed (in Redis)
    for follower_id in followers:
        feed_key = f"feed:{follower_id}"

        # Add post to beginning of feed list
        redis_client.lpush(feed_key, post_id)

        # Trim feed to latest 500 posts (save memory)
        redis_client.ltrim(feed_key, 0, 499)

    print(f"Fanned out post {post_id} to {len(followers)} followers")


# When a user requests their feed:
def get_user_feed(user_id, limit=50):
    """
    Get pre-computed feed from Redis (fast!)
    """
    feed_key = f"feed:{user_id}"

    # Get post IDs from Redis (O(1) lookup)
    post_ids = redis_client.lrange(feed_key, 0, limit - 1)

    # Fetch full post objects from database
    posts = Post.objects.filter(id__in=post_ids)

    return posts`,
          highlights: [13, 14, 15, 21, 22, 23, 24],
        },
        {
          type: 'timeline',
          title: 'Fanout-on-Write: Post Flow',
          events: [
            {
              label: '1. User posts photo',
              description: 'User A uploads a photo to Instagram',
              nodeIds: ['user-mobile', 'instagram-server'],
            },
            {
              label: '2. Save post to database',
              description: 'Store post metadata in PostgreSQL, image in S3',
              nodeIds: ['postgres', 's3-simple'],
            },
            {
              label: '3. Enqueue fanout job',
              description: 'Add background job to Celery queue',
              nodeIds: ['celery-worker'],
            },
            {
              label: '4. Get followers',
              description: 'Worker queries database for all followers of User A (500 users)',
              nodeIds: ['celery-worker', 'postgres'],
            },
            {
              label: '5. Push to feeds',
              description: 'Worker pushes post ID to 500 Redis lists (one per follower)',
              nodeIds: ['celery-worker', 'redis-feed'],
            },
            {
              label: '6. Followers see post',
              description: 'Next time followers open app, post appears instantly from Redis',
              nodeIds: ['redis-feed'],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-6-fanout-on-read',
      title: 'Fanout-on-Read (Pull Model)',
      phase: 'complexity',
      estimatedMinutes: 6,
      content: `
# Solution 2: Compute Feeds On-Demand (Fanout-on-Read)

Alternative approach: **compute feeds when users request them** (our original naive approach, but optimized).

## How It Works

**When a user opens the app**:
1. User B requests feed
2. Get list of people User B follows (from Cassandra)
3. For each followed user, get their latest posts (from Cassandra)
4. Merge and sort by timestamp
5. Return top 50

**No pre-computation!** Everything happens at read time.

## Optimizations

To make this fast enough:
- **Cassandra** instead of PostgreSQL (optimized for reads)
- **Denormalized data** (no JOINs)
- **Caching** (cache recent posts per user)
- **Parallel queries** (fetch from 500 users concurrently)

Even with optimizations, this is slower than fanout-on-write (~200ms vs ~50ms).

## When to Use This

**Fanout-on-read is better for**:
- **Celebrities**: Avoid pushing to 500M followers
- **Inactive users**: Don't waste compute if they rarely open app
- **Real-time freshness**: Always get latest posts

**Instagram uses fanout-on-read for**:
- Users with >1M followers (too expensive to fanout)
- Users who haven't opened app in 30+ days

## The Trade-offs

✅ **Pros**:
- No write amplification (1 post = 1 write)
- Always fresh (real-time)
- No storage overhead

❌ **Cons**:
- Slower reads (200ms vs 50ms)
- More compute at request time
- Query complexity (merge posts from 500 users)
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'cassandra-posts',
            type: 'archComponent',
            position: { x: 300, y: 550 },
            data: {
              componentType: 'object_storage',
              label: 'Cassandra - Posts',
              config: { description: 'Denormalized post storage' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e6',
            source: 'instagram-server',
            target: 'cassandra-posts',
            type: 'archEdge',
            data: { label: 'Query posts from followed users' },
          },
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Fanout-on-Read Implementation',
          language: 'python',
          code: `import asyncio
from cassandra.cluster import Cluster

# Cassandra connection
cassandra_cluster = Cluster(['cassandra-1', 'cassandra-2'])
cassandra_session = cassandra_cluster.connect('instagram')

async def get_user_feed_pull_model(user_id, limit=50):
    """
    Compute feed on-demand (fanout-on-read)

    This is SLOWER than fanout-on-write but avoids
    write amplification for celebrities
    """
    # 1. Get list of followed users
    followed_users = get_followed_users(user_id)  # 500 users

    # 2. For each followed user, get their latest posts
    #    (Query in parallel for speed)
    tasks = [
        get_recent_posts(followed_user_id, limit=10)
        for followed_user_id in followed_users
    ]

    all_posts_lists = await asyncio.gather(*tasks)

    # 3. Merge all posts
    all_posts = []
    for posts in all_posts_lists:
        all_posts.extend(posts)

    # 4. Sort by timestamp (most recent first)
    all_posts.sort(key=lambda p: p.created_at, reverse=True)

    # 5. Return top 50
    return all_posts[:limit]


async def get_recent_posts(user_id, limit=10):
    """
    Get recent posts for a single user (Cassandra query)
    """
    query = "SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
    rows = await cassandra_session.execute_async(query, (user_id, limit))
    return rows`,
          highlights: [19, 20, 21, 22, 23, 25, 29, 30, 34, 35],
        },
        {
          type: 'comparison-table',
          title: 'Fanout-on-Write vs Fanout-on-Read',
          columns: ['Aspect', 'Fanout-on-Write (Push)', 'Fanout-on-Read (Pull)'],
          rows: [
            {
              label: 'Read Latency',
              values: ['Fast (~50ms)', 'Slower (~200ms)'],
            },
            {
              label: 'Write Latency',
              values: ['Slow for celebrities (minutes)', 'Fast (instant)'],
            },
            {
              label: 'Storage Cost',
              values: ['High (500M feeds × 50 posts)', 'Low (store once)'],
            },
            {
              label: 'Freshness',
              values: ['Eventual consistency (~1s delay)', 'Real-time'],
            },
            {
              label: 'Best For',
              values: ['Most users (<1M followers)', 'Celebrities (>1M followers)'],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-7-hybrid-approach',
      title: 'Hybrid Model (Instagram Production)',
      phase: 'complexity',
      estimatedMinutes: 7,
      content: `
# Instagram's Hybrid Approach

Instagram uses **both** fanout-on-write and fanout-on-read, choosing dynamically per user.

## The Heuristic

**Use fanout-on-write (push) if**:
- User has <1M followers
- User is active (opened app in last 7 days)
- User follows <1000 people

**Use fanout-on-read (pull) if**:
- User has >1M followers (celebrity)
- User is inactive (hasn't opened app in 30+ days)
- Explicit request for real-time feed

## How It Works

**When Cristiano Ronaldo posts**:
1. Save post to database
2. Check: Does he have >1M followers? **Yes**
3. **Skip fanout** (don't push to 500M feeds)
4. When followers open app, pull his latest posts on-demand

**When a regular user posts**:
1. Save post to database
2. Check: Does she have <1M followers? **Yes**
3. **Fanout-on-write**: Push to all followers' feeds
4. Followers see post instantly (from cache)

**When you open Instagram**:
1. Request feed
2. Check: Do you follow any celebrities?
3. **Hybrid merge**:
   - Get pre-computed feed from Redis (regular users)
   - Query latest posts from celebrities (on-demand)
   - Merge and sort by timestamp
4. Return combined feed

## The Benefits

✅ **Fast for most users** (fanout-on-write)
✅ **Handles celebrities** (fanout-on-read)
✅ **Saves compute for inactive users** (don't fanout if they won't see it)
✅ **Real-time when needed** (pull model for latest posts)

This is the **production approach at Instagram, Twitter, and Facebook**.
      `,
      canvasOperations: [
        {
          type: 'animate-flow',
          path: ['user-mobile', 'instagram-server', 'redis-feed'],
          duration: 800,
          label: 'Regular user: read from cache',
        },
        {
          type: 'animate-flow',
          path: ['user-mobile', 'instagram-server', 'cassandra-posts'],
          duration: 800,
          label: 'Celebrity posts: query on-demand',
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Hybrid Feed Generation',
          language: 'python',
          code: `async def get_user_feed_hybrid(user_id, limit=50):
    """
    Hybrid approach: Mix fanout-on-write and fanout-on-read

    This is Instagram's production strategy
    """
    # 1. Get list of followed users
    followed_users = get_followed_users(user_id)

    # 2. Partition followed users into two groups
    regular_users = []
    celebrities = []

    for followed_user_id in followed_users:
        follower_count = get_follower_count(followed_user_id)

        if follower_count > 1_000_000:
            celebrities.append(followed_user_id)
        else:
            regular_users.append(followed_user_id)

    # 3. For regular users: Get pre-computed feed from Redis (fast!)
    cached_feed_ids = redis_client.lrange(f"feed:{user_id}", 0, limit * 2)
    cached_posts = Post.objects.filter(id__in=cached_feed_ids)

    # 4. For celebrities: Query latest posts on-demand (slower)
    celebrity_posts_tasks = [
        get_recent_posts(celeb_id, limit=5)
        for celeb_id in celebrities
    ]
    celebrity_posts_lists = await asyncio.gather(*celebrity_posts_tasks)
    celebrity_posts = [p for posts in celebrity_posts_lists for p in posts]

    # 5. Merge both sources
    all_posts = list(cached_posts) + celebrity_posts

    # 6. Sort by timestamp (Instagram's default)
    #    (In practice, Instagram uses ML ranking, not just timestamp)
    all_posts.sort(key=lambda p: p.created_at, reverse=True)

    # 7. Return top N
    return all_posts[:limit]`,
          highlights: [10, 11, 12, 16, 17, 18, 19, 23, 24, 27, 28, 29, 30, 34, 35],
        },
        {
          type: 'quiz',
          question: 'Why does Instagram skip fanout-on-write for celebrities (>1M followers)?',
          options: [
            {
              id: 'slow',
              text: 'Fanout-on-write would take too long (minutes to hours)',
              correct: true,
              explanation:
                'Exactly! Pushing a post to 500M followers means 500M Redis writes. Even at 100K writes/second, that\'s 5,000 seconds = 83 minutes. Users would wait over an hour to see celebrity posts. Pulling on-demand is faster.',
            },
            {
              id: 'storage',
              text: 'Storing 500M feeds would cost too much',
              correct: false,
              explanation:
                'Storage is cheap! 500M feeds × 50 posts × 8 bytes = 200GB in Redis, which costs ~$50/month. The real issue is write latency, not storage cost.',
            },
            {
              id: 'fairness',
              text: 'Instagram wants to be fair and not favor celebrities',
              correct: false,
              explanation:
                'This isn\'t about fairness—it\'s about engineering constraints. Fanout-on-write physically cannot handle 500M followers without massive delays.',
            },
            {
              id: 'freshness',
              text: 'Fanout-on-read gives more real-time results',
              correct: false,
              explanation:
                'While fanout-on-read is more real-time, that\'s not the primary reason for celebrities. The main driver is avoiding slow writes that would delay post delivery.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'Hybrid Approach Trade-offs',
          decision: 'Should Instagram use a hybrid feed generation strategy?',
          options: [
            {
              label: 'Fanout-on-Write Only',
              pros: [
                'Simplest implementation (one code path)',
                'Consistent latency for all users',
                'Easy to reason about',
              ],
              cons: [
                'Breaks for celebrities (83 min to fanout)',
                'Wastes compute for inactive users',
                'High storage cost',
              ],
            },
            {
              label: 'Fanout-on-Read Only',
              pros: [
                'No write amplification',
                'Always real-time',
                'Low storage cost',
              ],
              cons: [
                'Slow reads for all users (200ms)',
                'High query complexity',
                'Database hotspots',
              ],
            },
            {
              label: 'Hybrid (Instagram)',
              pros: [
                'Fast reads for most users (~50ms)',
                'Handles celebrities gracefully',
                'Optimizes for inactive users',
                'Best of both worlds',
              ],
              cons: [
                'Complex implementation (two code paths)',
                'Need heuristics (who is a celebrity?)',
                'Harder to debug and maintain',
                'Requires sophisticated infrastructure',
              ],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 4: REAL INSTAGRAM ARCHITECTURE (25 min) ==========
    {
      id: 'step-8-image-storage-cdn',
      title: 'Image Storage and CDN',
      phase: 'real',
      estimatedMinutes: 8,
      content: `
# Storing and Serving 100M Photos Per Day

Instagram's bread and butter is images. Let's design the storage layer.

## The Requirements

- **100M photos uploaded per day**
- **5 billion total photos** (10 petabytes)
- **Serve globally** with <200ms latency
- **Multiple resolutions**: Original (2MB), Large (500KB), Thumbnail (50KB)

## The Architecture

**Storage**: Amazon S3 (object storage)
- Infinite scale (no limits)
- Cheap ($0.023/GB/month)
- Durable (99.999999999% - eleven 9's)

**Delivery**: CloudFront CDN (content delivery network)
- 400+ edge locations worldwide
- Caches images close to users
- 200ms latency anywhere in the world

**Processing**: Image pipeline
- User uploads original (2MB JPEG)
- Resize to 5 sizes: Original, XL, L, M, S
- Compress (reduce quality 10%, halve file size)
- Store all versions in S3
- Serve via CDN

## The Upload Flow

1. **User uploads photo** (mobile app)
2. **Upload to S3 directly** (signed URL, no server involved)
3. **S3 triggers Lambda** (serverless function)
4. **Lambda resizes & compresses** (creates 5 versions)
5. **Store results in S3**
6. **Save metadata to database** (image URLs, dimensions)
7. **Return to user** (post created!)

## The Retrieval Flow

1. **User requests feed**
2. **Server returns image URLs** (S3 URLs via CloudFront)
3. **Client requests images from CDN**
4. **CloudFront checks cache**:
   - Cache HIT: Return image (1ms) ✅
   - Cache MISS: Fetch from S3 (50ms), cache, return
5. **User sees images**

## Cache Hit Rate

Instagram achieves **95% cache hit rate**:
- Popular images (trending posts) always cached
- Long tail (old posts) fetched from S3

95% of requests = 1ms latency
5% of requests = 50ms latency
**Average: 3.5ms** 🚀
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 's3-photos',
            type: 'archComponent',
            position: { x: 600, y: 100 },
            data: {
              componentType: 'object_storage',
              label: 'S3 - Photo Storage',
              config: { description: '10 petabytes' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'cloudfront',
            type: 'archComponent',
            position: { x: 800, y: 100 },
            data: {
              componentType: 'cdn',
              label: 'CloudFront CDN',
              config: { description: '400+ edge locations' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'lambda-resize',
            type: 'archComponent',
            position: { x: 700, y: 250 },
            data: {
              componentType: 'serverless',
              label: 'Lambda - Image Processing',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e7',
            source: 'user-mobile',
            target: 's3-photos',
            type: 'archEdge',
            data: { label: 'Upload original photo' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e8',
            source: 's3-photos',
            target: 'lambda-resize',
            type: 'archEdge',
            data: { label: 'Trigger resize job' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e9',
            source: 'lambda-resize',
            target: 's3-photos',
            type: 'archEdge',
            data: { label: 'Store resized versions' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e10',
            source: 's3-photos',
            target: 'cloudfront',
            type: 'archEdge',
            data: { label: 'Origin' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e11',
            source: 'cloudfront',
            target: 'user-mobile',
            type: 'archEdge',
            data: { label: 'Serve cached images' },
          },
        },
      ],
      widgets: [
        {
          type: 'timeline',
          title: 'Photo Upload & Processing Flow',
          events: [
            {
              label: '1. User uploads photo',
              description: 'Mobile app uploads 2MB JPEG directly to S3 (no server)',
              nodeIds: ['user-mobile', 's3-photos'],
            },
            {
              label: '2. S3 triggers Lambda',
              description: 'S3 event notification invokes serverless function',
              nodeIds: ['s3-photos', 'lambda-resize'],
            },
            {
              label: '3. Lambda processes image',
              description: 'Resize to 5 sizes, compress, optimize',
              nodeIds: ['lambda-resize'],
            },
            {
              label: '4. Store versions in S3',
              description: 'Save Original, XL, L, M, S to S3 (6 files total)',
              nodeIds: ['lambda-resize', 's3-photos'],
            },
            {
              label: '5. Save metadata to DB',
              description: 'Store image URLs, dimensions, post ID in PostgreSQL',
              nodeIds: ['postgres'],
            },
            {
              label: '6. Fanout to followers',
              description: 'Enqueue fanout job (push to feeds)',
              nodeIds: ['celery-worker', 'redis-feed'],
            },
          ],
        },
        {
          type: 'code-block',
          title: 'Image Processing Lambda',
          language: 'python',
          code: `import boto3
from PIL import Image
import io

s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Triggered when a new photo is uploaded to S3

    Process:
    1. Download original image
    2. Resize to 5 sizes
    3. Compress
    4. Upload back to S3
    """
    # Get bucket and key from S3 event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    # Download original image
    response = s3.get_object(Bucket=bucket, Key=key)
    image_data = response['Body'].read()
    image = Image.open(io.BytesIO(image_data))

    # Define sizes: (width, suffix)
    sizes = [
        (1080, 'xl'),   # Large display
        (640, 'l'),     # Phone display
        (320, 'm'),     # Thumbnail
        (150, 's'),     # Profile picture
    ]

    # Resize and upload each version
    for width, suffix in sizes:
        # Resize maintaining aspect ratio
        resized = image.copy()
        resized.thumbnail((width, width), Image.LANCZOS)

        # Compress (quality 85 = good balance)
        buffer = io.BytesIO()
        resized.save(buffer, format='JPEG', quality=85, optimize=True)
        buffer.seek(0)

        # Upload to S3
        new_key = key.replace('.jpg', f'_{suffix}.jpg')
        s3.put_object(
            Bucket=bucket,
            Key=new_key,
            Body=buffer,
            ContentType='image/jpeg'
        )

    return {'statusCode': 200, 'body': 'Processed'}`,
          highlights: [27, 28, 29, 30, 31, 32, 35, 36, 37, 38],
        },
        {
          type: 'quiz',
          question: 'Why does Instagram use a CDN (CloudFront) instead of serving images directly from S3?',
          options: [
            {
              id: 'cost',
              text: 'CDN is cheaper than S3 bandwidth',
              correct: false,
              explanation:
                'CDN is actually MORE expensive than S3 bandwidth ($0.085/GB vs $0.09/GB). The real benefit is LATENCY. CDN caches images close to users (1ms vs 200ms).',
            },
            {
              id: 'latency',
              text: 'CDN reduces latency from 200ms to 1ms for cached images',
              correct: true,
              explanation:
                'Exactly! S3 is in one AWS region (e.g., us-east-1). A user in Tokyo querying us-east-1 S3 sees 200ms latency. CloudFront caches the image in Tokyo (1ms away), so subsequent requests are instant. 95% cache hit rate = 95% of images load in 1ms!',
            },
            {
              id: 'scale',
              text: 'S3 cannot handle Instagram\'s traffic',
              correct: false,
              explanation:
                'S3 can handle virtually unlimited traffic (100K+ requests/second per bucket). Instagram uses CDN for latency, not scale.',
            },
            {
              id: 'security',
              text: 'CDN provides better security than S3',
              correct: false,
              explanation:
                'Security isn\'t the primary driver. Both S3 and CloudFront support HTTPS, DDoS protection, and access controls. The main benefit is latency.',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-9-cassandra-social-graph',
      title: 'Cassandra for Social Graph',
      phase: 'real',
      estimatedMinutes: 9,
      content: `
# Storing the Social Graph at Billion-User Scale

The social graph (who follows whom) is critical for feed generation. Let's design it.

## The Requirements

- **1 billion users**
- **500 billion follow relationships** (avg user follows 500 people)
- **Queries**:
  - Get followers of user X (500 rows)
  - Get users followed by user X (500 rows)
  - Check if user A follows user B (1 row)

## Why Not PostgreSQL?

At 500 billion rows, PostgreSQL struggles:
- **Index size**: 500GB+ just for indexes
- **Write throughput**: Limited to ~100K writes/second
- **Scaling**: Vertical scaling only (expensive)

## Why Cassandra?

Cassandra is designed for this workload:
- **Write throughput**: Millions of writes/second
- **Horizontal scaling**: Add nodes to increase capacity
- **No single point of failure**: Replicated across data centers
- **Tunable consistency**: Choose between speed and consistency

## Data Model: Denormalization

Cassandra requires **denormalized tables**. Instead of one \`follows\` table, we create TWO:

**Table 1: Followers (who follows me?)**
\`\`\`cql
CREATE TABLE followers (
  followee_id UUID,        -- User being followed
  follower_id UUID,        -- User who follows
  created_at TIMESTAMP,
  PRIMARY KEY (followee_id, follower_id)
);
\`\`\`

**Table 2: Following (who do I follow?)**
\`\`\`cql
CREATE TABLE following (
  follower_id UUID,        -- User who follows
  followee_id UUID,        -- User being followed
  created_at TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id)
);
\`\`\`

**Why two tables?** Cassandra partitions data by the FIRST column in PRIMARY KEY. To query both "followers of X" and "following of X" efficiently, we need separate tables.

## The Queries

**Get followers of user X**:
\`\`\`cql
SELECT follower_id FROM followers WHERE followee_id = ?;
-- Returns 500 rows in 10ms (single partition read)
\`\`\`

**Get users followed by user X**:
\`\`\`cql
SELECT followee_id FROM following WHERE follower_id = ?;
-- Returns 500 rows in 10ms (single partition read)
\`\`\`

**Check if A follows B**:
\`\`\`cql
SELECT * FROM following WHERE follower_id = ? AND followee_id = ?;
-- Returns 0 or 1 row in 5ms
\`\`\`

## Write Amplification

When user A follows user B, Instagram writes to BOTH tables:
\`\`\`
INSERT INTO followers (followee_id, follower_id) VALUES (B, A);
INSERT INTO following (follower_id, followee_id) VALUES (A, B);
\`\`\`

This is **write amplification** (1 action = 2 writes). The trade-off:
- ✅ Fast reads (no JOINs)
- ❌ Slower writes (2× cost)

For Instagram, reads vastly outnumber writes (100:1 ratio), so this trade-off is worth it.
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'cassandra-graph',
            type: 'archComponent',
            position: { x: 400, y: 700 },
            data: {
              componentType: 'object_storage',
              label: 'Cassandra - Social Graph',
              config: { description: '500B relationships' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e12',
            source: 'instagram-server',
            target: 'cassandra-graph',
            type: 'archEdge',
            data: { label: 'Follow/unfollow' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e13',
            source: 'celery-worker',
            target: 'cassandra-graph',
            type: 'archEdge',
            data: { label: 'Get followers for fanout' },
          },
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Cassandra Queries for Social Graph',
          language: 'python',
          code: `from cassandra.cluster import Cluster

# Connect to Cassandra cluster
cluster = Cluster(['cassandra-1', 'cassandra-2', 'cassandra-3'])
session = cluster.connect('instagram')

def follow_user(follower_id, followee_id):
    """
    User A follows user B

    Write to BOTH tables (denormalization)
    """
    # Write to followers table
    session.execute(
        "INSERT INTO followers (followee_id, follower_id, created_at) VALUES (?, ?, toTimestamp(now()))",
        (followee_id, follower_id)
    )

    # Write to following table
    session.execute(
        "INSERT INTO following (follower_id, followee_id, created_at) VALUES (?, ?, toTimestamp(now()))",
        (follower_id, followee_id)
    )


def get_followers(user_id):
    """
    Get all followers of a user (who follows me?)

    Fast query: Single partition read
    """
    rows = session.execute(
        "SELECT follower_id FROM followers WHERE followee_id = ?",
        (user_id,)
    )
    return [row.follower_id for row in rows]


def get_following(user_id):
    """
    Get all users followed by a user (who do I follow?)

    Fast query: Single partition read
    """
    rows = session.execute(
        "SELECT followee_id FROM following WHERE follower_id = ?",
        (user_id,)
    )
    return [row.followee_id for row in rows]


def is_following(follower_id, followee_id):
    """
    Check if user A follows user B

    Fast query: Single row lookup
    """
    row = session.execute(
        "SELECT * FROM following WHERE follower_id = ? AND followee_id = ?",
        (follower_id, followee_id)
    ).one()
    return row is not None`,
          highlights: [13, 14, 15, 19, 20, 21, 33, 34, 35, 45, 46, 47],
        },
        {
          type: 'comparison-table',
          title: 'PostgreSQL vs Cassandra for Social Graph',
          columns: ['Feature', 'PostgreSQL', 'Cassandra'],
          rows: [
            {
              label: 'Write Throughput',
              values: ['~100K writes/sec', '~1M+ writes/sec'],
            },
            {
              label: 'Read Latency',
              values: ['10-50ms (with JOINs)', '5-10ms (denormalized)'],
            },
            {
              label: 'Scaling',
              values: ['Vertical (single node)', 'Horizontal (add nodes)'],
            },
            {
              label: 'Consistency',
              values: ['Strong (ACID)', 'Tunable (eventual or strong)'],
            },
            {
              label: 'Best For',
              values: ['<10M rows, complex queries', '>1B rows, simple queries'],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'Why does Instagram use TWO Cassandra tables (followers + following) instead of one?',
          options: [
            {
              id: 'backup',
              text: 'Redundancy - if one table fails, the other is a backup',
              correct: false,
              explanation:
                'Cassandra already provides redundancy via replication (data is stored on 3+ nodes). The two tables aren\'t backups of each other—they have different partition keys!',
            },
            {
              id: 'partition',
              text: 'Cassandra partitions by first column - need separate tables for different queries',
              correct: true,
              explanation:
                'Exactly! Cassandra partitions data by the first column in PRIMARY KEY. \n- To query "followers of X", partition by followee_id (followers table)\n- To query "following of X", partition by follower_id (following table)\nWithout two tables, one query would require a full table scan (slow!).',
            },
            {
              id: 'speed',
              text: 'Two smaller tables are faster than one large table',
              correct: false,
              explanation:
                'Table size doesn\'t matter in Cassandra—queries only scan the relevant partition. The real reason is query efficiency: each table is optimized for a different access pattern.',
            },
            {
              id: 'consistency',
              text: 'Two tables allow different consistency levels',
              correct: false,
              explanation:
                'While Cassandra does support per-query consistency levels, Instagram uses the same level for both tables. The reason is query performance, not consistency.',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-10-full-architecture',
      title: 'The Complete Instagram Architecture',
      phase: 'real',
      estimatedMinutes: 8,
      content: `
# Putting It All Together: Instagram at Scale

We've built up the architecture piece by piece. Here's the complete system:

## The Stack

**Frontend**:
- iOS/Android apps
- React web app

**API Layer**:
- Django (Python) - monolith for core features
- API Gateway (rate limiting, auth)

**Feed Generation**:
- Hybrid fanout (push for most users, pull for celebrities)
- Redis for feed cache
- Celery workers for async fanout jobs

**Image Storage**:
- S3 for object storage (10 petabytes)
- CloudFront CDN (400+ edge locations)
- Lambda for image processing

**Social Graph**:
- Cassandra for follows/followers (500B relationships)
- Denormalized tables for fast queries

**Metadata Storage**:
- PostgreSQL for user profiles, post metadata
- Read replicas for scaling reads

**Caching**:
- Redis for feeds, user sessions
- Memcached for database query results

**Real-Time**:
- WebSockets for live updates (likes, comments)
- Apache Kafka for event streaming

**Search**:
- Elasticsearch for user/hashtag search

This architecture serves **1 billion users** with **<200ms latency** worldwide!
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'api-gateway',
            type: 'archComponent',
            position: { x: 200, y: 150 },
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
            id: 'websocket',
            type: 'archComponent',
            position: { x: 100, y: 300 },
            data: {
              componentType: 'app_server',
              label: 'WebSocket Server',
              config: { description: 'Real-time updates' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'elasticsearch',
            type: 'archComponent',
            position: { x: 600, y: 700 },
            data: {
              componentType: 'worker',
              label: 'Elasticsearch',
              config: { description: 'User/hashtag search' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e14',
            source: 'user-mobile',
            target: 'api-gateway',
            type: 'archEdge',
            data: { label: 'HTTP/HTTPS' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e15',
            source: 'api-gateway',
            target: 'instagram-server',
            type: 'archEdge',
            data: { label: 'Route requests' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e16',
            source: 'user-mobile',
            target: 'websocket',
            type: 'archEdge',
            data: { label: 'Real-time connection' },
          },
        },
      ],
      widgets: [
        {
          type: 'timeline',
          title: 'Feed Request Flow - Complete System',
          events: [
            {
              label: '1. User opens app',
              description: 'Mobile app connects to API Gateway',
              nodeIds: ['user-mobile', 'api-gateway'],
            },
            {
              label: '2. Authenticate user',
              description: 'API Gateway validates JWT token, routes to Django server',
              nodeIds: ['api-gateway', 'instagram-server'],
            },
            {
              label: '3. Check Redis cache',
              description: 'Django checks Redis for pre-computed feed',
              nodeIds: ['instagram-server', 'redis-feed'],
            },
            {
              label: '4. Query celebrities',
              description: 'For followed celebrities, query Cassandra for latest posts',
              nodeIds: ['instagram-server', 'cassandra-posts'],
            },
            {
              label: '5. Merge feeds',
              description: 'Merge cached feed + celebrity posts, sort by timestamp',
              nodeIds: ['instagram-server'],
            },
            {
              label: '6. Fetch post metadata',
              description: 'Get post details from PostgreSQL',
              nodeIds: ['instagram-server', 'postgres'],
            },
            {
              label: '7. Return feed',
              description: 'Send JSON response with image URLs (CloudFront)',
              nodeIds: ['instagram-server', 'user-mobile'],
            },
            {
              label: '8. Load images',
              description: 'Client requests images from CloudFront CDN (1ms)',
              nodeIds: ['user-mobile', 'cloudfront'],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'Instagram uses BOTH PostgreSQL and Cassandra. Why not just use one database?',
          options: [
            {
              id: 'redundancy',
              text: 'Redundancy - if one database fails, use the other',
              correct: false,
              explanation:
                'They serve different purposes, not backups! PostgreSQL stores user profiles and post metadata. Cassandra stores the social graph. They\'re complementary.',
            },
            {
              id: 'strengths',
              text: 'Each database is optimized for different access patterns',
              correct: true,
              explanation:
                'Exactly! PostgreSQL excels at complex queries with JOINs (user profiles, posts with filters). Cassandra excels at simple, high-volume queries (get followers, write follows). Use the right tool for each job.',
            },
            {
              id: 'scale',
              text: 'Cassandra handles more users than PostgreSQL',
              correct: false,
              explanation:
                'Both can scale to billions of rows with the right architecture. The difference is ACCESS PATTERNS, not scale. PostgreSQL is better for complex queries, Cassandra for simple high-volume queries.',
            },
            {
              id: 'cost',
              text: 'Cassandra is cheaper than PostgreSQL at scale',
              correct: false,
              explanation:
                'Cassandra can be more expensive (requires larger clusters for redundancy). Instagram uses both because they solve different problems, not for cost reasons.',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 5: HANDS-ON EXERCISE (20 min) ==========
    {
      id: 'step-11-stories-exercise',
      title: 'Exercise: Add Stories Feature',
      phase: 'exercise',
      estimatedMinutes: 12,
      content: `
# Hands-On Challenge: Instagram Stories

You're an Instagram engineer. Product wants to add **Stories**:
- 24-hour ephemeral content (auto-deletes after 24 hours)
- Vertical photos/videos (full screen on mobile)
- Real-time updates (see new stories immediately)
- High engagement (500M daily active users)

## Your Task

Design the Stories architecture. Think through:

1. **Storage**: Where do you store stories?
2. **Expiration**: How do you auto-delete after 24 hours?
3. **Feed**: How do you show stories at the top of the feed?
4. **Real-time**: How do users see new stories immediately?

## Constraints

- **100M stories posted per day**
- **Stories load in <100ms**
- **Auto-delete after exactly 24 hours**
- **Real-time delivery** (no 10-minute delays)

## Discussion Points

- Can you reuse the existing feed architecture?
- Should you use fanout-on-write or fanout-on-read?
- How do you handle the 24-hour TTL (time-to-live)?
- What about analytics (who viewed my story)?

Take 10-12 minutes to design your solution. When ready, click "Next" to see Instagram's approach.
      `,
      canvasOperations: [
        {
          type: 'highlight',
          nodeIds: ['redis-feed', 'cassandra-posts', 's3-photos'],
          duration: 12000,
          color: '#f59e0b',
        },
      ],
      widgets: [
        {
          type: 'quiz',
          question: 'Stories auto-delete after 24 hours. What\'s the BEST way to implement this?',
          options: [
            {
              id: 'cron',
              text: 'Run a cron job every hour to delete expired stories',
              correct: false,
              explanation:
                'This works but is inefficient! You\'d scan 100M stories every hour to find expired ones. With TTL, the database automatically deletes them—no scanning needed.',
            },
            {
              id: 'ttl',
              text: 'Use Redis/Cassandra TTL (time-to-live) for automatic expiration',
              correct: true,
              explanation:
                'Perfect! Redis and Cassandra both support TTL on keys/rows. Set TTL=24 hours when storing the story, and the database automatically deletes it. No cron jobs, no manual cleanup. Instagram uses Redis TTL for stories.',
            },
            {
              id: 'timestamp',
              text: 'Store a timestamp and filter at query time',
              correct: false,
              explanation:
                'This clutters the database with expired stories forever! You\'d need to add "WHERE created_at > NOW() - 24 hours" to every query. TTL is cleaner—expired data is automatically removed.',
            },
            {
              id: 'lambda',
              text: 'Trigger a Lambda function 24 hours after posting',
              correct: false,
              explanation:
                'This is complex and error-prone. What if Lambda fails? You\'d leak stories. TTL is simpler and more reliable—the database guarantees deletion.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'code-block',
          title: 'Starter Code: Stories Storage',
          language: 'python',
          code: `import redis

redis_client = redis.Redis(host='localhost', port=6379)

def post_story(user_id, story_data):
    """
    Post a new story (ephemeral, 24-hour TTL)

    Your implementation here:
    - Where do you store the story?
    - How do you set 24-hour expiration?
    - How do you notify followers in real-time?
    """
    # TODO: Implement your solution
    pass


def get_stories_feed(user_id):
    """
    Get stories from users I follow

    Your implementation here:
    - Pull or push model?
    - How do you order stories?
    - How do you exclude expired stories?
    """
    # TODO: Implement your solution
    pass`,
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-12-stories-solution',
      title: 'Solution: Instagram Stories Architecture',
      phase: 'exercise',
      estimatedMinutes: 8,
      content: `
# Instagram's Stories Implementation

Instagram launched Stories in 2016. Here's how they built it:

## Storage: Redis with TTL

Stories are stored in **Redis** with 24-hour TTL:
- Redis key: \`stories:user_<user_id>\`
- Value: List of story IDs
- TTL: 86400 seconds (24 hours)

When TTL expires, Redis automatically deletes the key. No cleanup needed!

## Feed Model: Fanout-on-Read (Pull)

Instagram uses **fanout-on-read** for stories:
- When you post a story, write to Redis once
- When followers open app, pull your latest stories

**Why pull instead of push?**
- Stories are less frequent than posts (1-2 per day vs 10 posts)
- Pulling is acceptable (<100ms)
- Avoids write amplification (no push to 500M followers)

## Real-Time Updates: WebSockets

When a user posts a story:
1. Save to Redis with TTL
2. Send WebSocket event to all online followers
3. Followers' apps refresh stories section

Offline followers see the story when they open the app (pull from Redis).

## View Tracking

Instagram tracks who viewed your story:
- Separate Redis set: \`story_views:<story_id>\`
- Add viewer to set: \`SADD story_views:<story_id> <viewer_id>\`
- Get viewer list: \`SMEMBERS story_views:<story_id>\`
- TTL: 24 hours (same as story)

## The Complete Flow

**Posting a story**:
1. Upload media to S3
2. Save story to Redis: \`SETEX stories:user_123 86400 <story_data>\`
3. Publish WebSocket event: "user_123 posted a story"
4. Online followers see notification

**Viewing stories**:
1. Get users I follow from Cassandra
2. For each followed user, check Redis: \`GET stories:user_<id>\`
3. Merge all stories, sort by timestamp
4. Record view: \`SADD story_views:<story_id> <my_user_id>\`
5. Display stories

**Expiration**:
- Redis automatically deletes after 24 hours (TTL)
- No cron jobs needed!
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'redis-stories',
            type: 'archComponent',
            position: { x: 500, y: 400 },
            data: {
              componentType: 'redis',
              label: 'Redis - Stories (TTL=24h)',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e17',
            source: 'instagram-server',
            target: 'redis-stories',
            type: 'archEdge',
            data: { label: 'Store stories with TTL' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e18',
            source: 'websocket',
            target: 'user-mobile',
            type: 'archEdge',
            data: { label: 'Notify followers' },
          },
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Stories Implementation (Production)',
          language: 'python',
          code: `import redis
import json

redis_client = redis.Redis(host='localhost', port=6379)

def post_story(user_id, media_url):
    """
    Post a new story with 24-hour expiration
    """
    story_id = generate_id()
    story_data = {
        'id': story_id,
        'user_id': user_id,
        'media_url': media_url,
        'created_at': time.time(),
    }

    # Store story in Redis with 24-hour TTL
    key = f"stories:user_{user_id}"
    redis_client.lpush(key, json.dumps(story_data))
    redis_client.expire(key, 86400)  # 24 hours

    # Notify followers via WebSocket
    notify_followers_realtime(user_id, story_id)

    return story_id


def get_stories_feed(user_id):
    """
    Get stories from users I follow (fanout-on-read)
    """
    # Get users I follow
    following = get_following(user_id)  # Cassandra query

    stories = []

    # For each followed user, check if they have active stories
    for followed_user_id in following:
        key = f"stories:user_{followed_user_id}"

        # Get stories from Redis (may be empty if expired)
        story_data_list = redis_client.lrange(key, 0, -1)

        for story_data in story_data_list:
            story = json.loads(story_data)
            stories.append(story)

    # Sort by timestamp (most recent first)
    stories.sort(key=lambda s: s['created_at'], reverse=True)

    return stories


def track_story_view(story_id, viewer_id):
    """
    Record that viewer_id viewed story_id
    """
    key = f"story_views:{story_id}"

    # Add viewer to set
    redis_client.sadd(key, viewer_id)

    # Set same TTL as story (24 hours)
    redis_client.expire(key, 86400)


def get_story_viewers(story_id):
    """
    Get list of users who viewed this story
    """
    key = f"story_views:{story_id}"
    viewer_ids = redis_client.smembers(key)
    return list(viewer_ids)`,
          highlights: [18, 19, 20, 39, 40, 41, 42, 58, 59, 61, 62],
        },
        {
          type: 'comparison-table',
          title: 'Posts vs Stories: Architectural Differences',
          columns: ['Feature', 'Posts', 'Stories'],
          rows: [
            {
              label: 'Lifespan',
              values: ['Permanent', '24 hours (ephemeral)'],
            },
            {
              label: 'Storage',
              values: ['PostgreSQL + S3', 'Redis (TTL) + S3'],
            },
            {
              label: 'Feed Model',
              values: ['Hybrid (push + pull)', 'Pull only (fanout-on-read)'],
            },
            {
              label: 'Real-time',
              values: ['Eventual (~1s delay)', 'Instant (WebSocket)'],
            },
            {
              label: 'Expiration',
              values: ['Never', 'Automatic (Redis TTL)'],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 6: DEEP DIVE (20 min) ==========
    {
      id: 'step-13-sharding',
      title: 'Sharding Strategy',
      phase: 'deep-dive',
      estimatedMinutes: 7,
      content: `
# Scaling Databases: Sharding

At Instagram's scale, a single database instance can't handle the load. Solution: **sharding** (horizontal partitioning).

## What is Sharding?

Split data across multiple database instances:
- Shard 1: Users 0-99M
- Shard 2: Users 100M-199M
- Shard 3: Users 200M-299M
- ...

Each shard is independent. Queries hit only the relevant shard.

## Sharding Key

Choose a column to partition by (sharding key). Instagram uses **user_id**:
- All data for user 12345 lives on the same shard
- Queries for user 12345 hit only one shard (fast!)

**Hash function**:
\`\`\`python
shard_id = hash(user_id) % num_shards
\`\`\`

Example with 10 shards:
- user_id = 12345 → hash(12345) % 10 = 5 → **Shard 5**
- user_id = 67890 → hash(67890) % 10 = 0 → **Shard 0**

## Challenges

❌ **Rebalancing**: Adding shards requires re-hashing and moving data
❌ **Cross-shard queries**: "Get all posts with hashtag #sunset" hits ALL shards
❌ **Hotspots**: Celebrity users create unbalanced shards

## Instagram's Approach

Instagram uses **consistent hashing** to minimize rebalancing:
- Virtual nodes (1000 per physical shard)
- When adding a shard, only move 1/N data (not 50%)

For cross-shard queries (hashtags, search), Instagram uses **Elasticsearch** (separate index).

For celebrity hotspots, Instagram **over-provisions** shards (more replicas for hot data).
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'postgres-shard-1',
            type: 'archComponent',
            position: { x: 300, y: 250 },
            data: {
              componentType: 'postgres',
              label: 'PostgreSQL Shard 1',
              config: { description: 'Users 0-99M' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'postgres-shard-2',
            type: 'archComponent',
            position: { x: 400, y: 250 },
            data: {
              componentType: 'postgres',
              label: 'PostgreSQL Shard 2',
              config: { description: 'Users 100M-199M' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'postgres-shard-3',
            type: 'archComponent',
            position: { x: 500, y: 250 },
            data: {
              componentType: 'postgres',
              label: 'PostgreSQL Shard 3',
              config: { description: 'Users 200M-299M' },
            },
          },
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Sharding Implementation',
          language: 'python',
          code: `import hashlib

# Database shard connections
shards = [
    connect_to_db('postgres-shard-1'),
    connect_to_db('postgres-shard-2'),
    connect_to_db('postgres-shard-3'),
    # ... more shards
]

def get_shard_for_user(user_id):
    """
    Determine which shard to use for a given user

    Uses consistent hashing to minimize rebalancing
    """
    # Hash user_id to get a consistent number
    hash_value = int(hashlib.md5(str(user_id).encode()).hexdigest(), 16)

    # Modulo by number of shards
    shard_id = hash_value % len(shards)

    return shards[shard_id]


def get_user_posts(user_id):
    """
    Get posts for a user (single shard query)
    """
    # Route to the correct shard
    shard = get_shard_for_user(user_id)

    # Query only this shard (not all shards)
    return shard.execute(
        "SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )


def get_posts_by_hashtag(hashtag):
    """
    Get all posts with a hashtag (cross-shard query)

    Problem: Must query ALL shards!
    Solution: Use Elasticsearch instead
    """
    all_posts = []

    # Query each shard (expensive!)
    for shard in shards:
        posts = shard.execute(
            "SELECT * FROM posts WHERE caption LIKE ?",
            (f"%#{hashtag}%",)
        )
        all_posts.extend(posts)

    # Merge and sort
    all_posts.sort(key=lambda p: p.created_at, reverse=True)

    return all_posts`,
          highlights: [17, 18, 20, 21, 31, 32, 47, 48, 49, 50, 51, 52],
        },
        {
          type: 'quiz',
          question: 'Instagram wants to add a feature: "Get all posts from users in New York." How should they implement this?',
          options: [
            {
              id: 'shard-all',
              text: 'Query all shards and merge results',
              correct: false,
              explanation:
                'This would work but is SLOW! Querying 100 shards takes 100× longer than querying 1. For real-time queries, this doesn\'t scale.',
            },
            {
              id: 'reshard',
              text: 'Re-shard the database by location instead of user_id',
              correct: false,
              explanation:
                'Bad idea! Re-sharding is extremely expensive (move petabytes of data). Also, user_id sharding is critical for other queries. Don\'t break existing functionality.',
            },
            {
              id: 'secondary-index',
              text: 'Use a secondary index like Elasticsearch',
              correct: true,
              explanation:
                'Perfect! Elasticsearch is designed for cross-shard queries. Instagram indexes posts by location in Elasticsearch, then queries ES for "posts in New York." This is fast and doesn\'t require querying all DB shards.',
            },
            {
              id: 'cache',
              text: 'Pre-compute and cache results in Redis',
              correct: false,
              explanation:
                'Pre-computing "all posts in every city" is impractical (billions of combinations). Better to use Elasticsearch for on-demand queries.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'Sharding Trade-offs',
          decision: 'Should Instagram shard PostgreSQL?',
          options: [
            {
              label: 'Single Database (No Sharding)',
              pros: [
                'Simple queries (no routing logic)',
                'Easy cross-entity queries',
                'Simpler operations',
                'No data migration',
              ],
              cons: [
                'Limited to ~10M users (vertical scaling limit)',
                'Single point of failure',
                'Expensive hardware',
                'Cannot handle Instagram\'s scale',
              ],
            },
            {
              label: 'Sharded Database (Instagram)',
              pros: [
                'Horizontal scaling (add shards as needed)',
                'Fast single-user queries',
                'Reduced blast radius (one shard fails, not all)',
                'Handles billions of users',
              ],
              cons: [
                'Cross-shard queries are slow',
                'Complex routing logic',
                'Rebalancing is hard',
                'Need secondary indexes (Elasticsearch)',
              ],
            },
            {
              label: 'NoSQL Only (No Sharding Needed)',
              pros: [
                'NoSQL (Cassandra) handles sharding automatically',
                'No manual routing',
                'Easier to scale',
              ],
              cons: [
                'No JOINs or complex queries',
                'Eventual consistency',
                'Must denormalize everything',
                'Instagram needs BOTH SQL and NoSQL',
              ],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-14-real-time-notifications',
      title: 'Real-Time Notifications',
      phase: 'deep-dive',
      estimatedMinutes: 7,
      content: `
# Real-Time Updates: Likes, Comments, Notifications

Instagram feels real-time. When someone likes your post, you see it instantly. How?

## The Requirements

- **Instant delivery**: Notification appears within 1 second
- **High volume**: Millions of likes per second
- **Persistent**: If offline, see notification when you return

## WebSockets vs Server-Sent Events (SSE) vs Polling

**Polling** (Old approach):
- Client asks server "any updates?" every 10 seconds
- Wasteful (99% of requests return "no updates")
- High latency (up to 10-second delay)

**Server-Sent Events (SSE)**:
- Server pushes updates to client over HTTP
- One-way (server → client)
- Simple but limited

**WebSockets** (Instagram's choice):
- Bi-directional communication (client ↔ server)
- Low latency (<100ms)
- Persistent connection

## Instagram's Architecture

**When user A likes user B's post**:
1. Client sends LIKE request (HTTP POST)
2. Server writes to database
3. Server publishes event to **Redis Pub/Sub**:
   \`\`\`
   PUBLISH notifications:user_B "user_A liked your post"
   \`\`\`
4. WebSocket server (subscribed to Redis) receives event
5. WebSocket server pushes to user B's device
6. User B sees notification (instant!)

**If user B is offline**:
- Notification saved to database
- When user B reconnects, server sends queued notifications

## Scaling WebSockets

Challenge: **Stateful connections** (can't load balance easily)

Instagram's solution:
- **Connection pooling**: Each WebSocket server handles 100K connections
- **Consistent hashing**: Route user to same server (based on user_id)
- **Redis Pub/Sub**: Servers communicate via Redis

Example:
- User B connects to WebSocket Server 3
- User A triggers notification (handled by Django Server 1)
- Django publishes to Redis
- WebSocket Server 3 (subscribed) receives and forwards to user B
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'redis-pubsub',
            type: 'archComponent',
            position: { x: 300, y: 500 },
            data: {
              componentType: 'redis',
              label: 'Redis Pub/Sub',
              config: { description: 'Notification events' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e19',
            source: 'instagram-server',
            target: 'redis-pubsub',
            type: 'archEdge',
            data: { label: 'Publish notification' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e20',
            source: 'redis-pubsub',
            target: 'websocket',
            type: 'archEdge',
            data: { label: 'Subscribe to events' },
          },
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Real-Time Notifications with WebSockets',
          language: 'python',
          code: `import asyncio
import websockets
import redis
import json

# Redis Pub/Sub for notifications
redis_client = redis.Redis(host='localhost', port=6379)
pubsub = redis_client.pubsub()

# Track active WebSocket connections
connections = {}  # user_id -> websocket

async def handle_websocket(websocket, user_id):
    """
    Handle WebSocket connection for a user
    """
    # Register connection
    connections[user_id] = websocket

    # Subscribe to user's notification channel
    channel = f"notifications:user_{user_id}"
    pubsub.subscribe(channel)

    try:
        # Listen for messages from Redis Pub/Sub
        for message in pubsub.listen():
            if message['type'] == 'message':
                # Forward notification to user's WebSocket
                notification = message['data'].decode('utf-8')
                await websocket.send(notification)

    finally:
        # Cleanup on disconnect
        pubsub.unsubscribe(channel)
        del connections[user_id]


def publish_notification(user_id, notification_data):
    """
    Publish a notification to a user (called by Django)

    Example: User A likes User B's post
    """
    channel = f"notifications:user_{user_id}"

    notification_json = json.dumps({
        'type': 'like',
        'from_user_id': notification_data['from_user_id'],
        'post_id': notification_data['post_id'],
        'timestamp': time.time(),
    })

    # Publish to Redis (WebSocket server will receive)
    redis_client.publish(channel, notification_json)

    # Also save to database (for offline users)
    save_notification_to_db(user_id, notification_json)


# Example: User A likes User B's post
def like_post(post_id, liker_user_id):
    """
    Like a post and send real-time notification
    """
    # 1. Write to database
    db.execute("INSERT INTO likes (post_id, user_id) VALUES (?, ?)",
               (post_id, liker_user_id))

    # 2. Get post owner
    post = db.execute("SELECT user_id FROM posts WHERE id = ?", (post_id,)).one()
    post_owner_id = post.user_id

    # 3. Send notification to post owner
    publish_notification(post_owner_id, {
        'from_user_id': liker_user_id,
        'post_id': post_id,
    })`,
          highlights: [20, 21, 24, 25, 26, 27, 28, 51, 52, 53, 73, 74, 75, 76],
        },
        {
          type: 'timeline',
          title: 'Real-Time Notification Flow',
          events: [
            {
              label: '1. User A likes post',
              description: 'Mobile app sends LIKE request to Django server',
              nodeIds: ['user-mobile', 'instagram-server'],
            },
            {
              label: '2. Save like to database',
              description: 'Django writes to PostgreSQL',
              nodeIds: ['instagram-server', 'postgres'],
            },
            {
              label: '3. Publish notification event',
              description: 'Django publishes to Redis Pub/Sub channel',
              nodeIds: ['instagram-server', 'redis-pubsub'],
            },
            {
              label: '4. WebSocket server receives event',
              description: 'WebSocket server (subscribed to channel) gets notification',
              nodeIds: ['redis-pubsub', 'websocket'],
            },
            {
              label: '5. Push to user B',
              description: 'WebSocket server sends notification to user B\'s device',
              nodeIds: ['websocket', 'user-mobile'],
            },
            {
              label: '6. User B sees notification',
              description: 'Mobile app displays "User A liked your post" (< 1 second)',
              nodeIds: ['user-mobile'],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'Why does Instagram use Redis Pub/Sub instead of directly pushing from Django to WebSocket?',
          options: [
            {
              id: 'scale',
              text: 'Redis Pub/Sub scales better than direct connections',
              correct: false,
              explanation:
                'Not really—both can scale horizontally. The real reason is DECOUPLING. Django servers don\'t know which WebSocket server handles user B. Redis Pub/Sub acts as a message bus.',
            },
            {
              id: 'decouple',
              text: 'Decouples Django servers from WebSocket servers (they don\'t need to know about each other)',
              correct: true,
              explanation:
                'Exactly! Django server handles the LIKE request but doesn\'t know which WebSocket server user B is connected to. By publishing to Redis, any WebSocket server (subscribed to that channel) can receive and forward the notification. This decoupling allows independent scaling.',
            },
            {
              id: 'persistent',
              text: 'Redis Pub/Sub persists messages for offline users',
              correct: false,
              explanation:
                'Redis Pub/Sub does NOT persist messages! If no subscriber is listening, the message is lost. Instagram separately saves notifications to PostgreSQL for offline users. Pub/Sub is only for real-time delivery.',
            },
            {
              id: 'cost',
              text: 'Redis Pub/Sub is cheaper than direct WebSocket connections',
              correct: false,
              explanation:
                'Cost isn\'t the driver. Both approaches require infrastructure. The benefit is architectural—decoupling Django from WebSocket servers.',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-15-conclusion',
      title: 'Conclusion & Next Steps',
      phase: 'deep-dive',
      estimatedMinutes: 6,
      content: `
# You've Built Instagram at Scale! 🎉

## What You Learned

Over the past ~115 minutes, you've explored:

✅ **Feed generation strategies**: Push, pull, and hybrid models
✅ **Image storage & CDN**: S3 + CloudFront for global delivery
✅ **Social graph at scale**: Cassandra with 500B relationships
✅ **Real-time systems**: WebSockets + Redis Pub/Sub
✅ **Ephemeral content**: Stories with 24-hour TTL
✅ **Sharding strategies**: Horizontal scaling for PostgreSQL
✅ **System design trade-offs**: Consistency, latency, cost

## The Complete Architecture

You now understand Instagram's production system:
- **1 billion users**
- **100 million photos per day**
- **<200ms latency** worldwide
- **99.99% uptime**

**Key Components**:
- Django (Python) monolith
- PostgreSQL (sharded) for metadata
- Cassandra for social graph
- Redis for caching (feeds, stories)
- S3 + CloudFront for images
- WebSockets for real-time updates
- Celery for background jobs
- Elasticsearch for search

## Real-World Learnings

**Start simple, scale later**:
- Instagram began with Django + PostgreSQL
- Only added Cassandra, Redis, sharding when needed
- Don't over-engineer early

**Use the right tool for each job**:
- PostgreSQL for complex queries
- Cassandra for high-volume simple queries
- Redis for caching and real-time data
- S3 for blob storage

**Hybrid approaches work**:
- Feed generation: push + pull
- Consistency: strong for some data, eventual for others
- Caching: aggressive caching with smart invalidation

## Next Steps

**Want to learn more?**

1. **Read Instagram Engineering Blog**: https://instagram-engineering.com/
2. **Explore other walkthroughs**:
   - Twitter/X Feed Ranking
   - Netflix Recommendation System
   - Uber Dispatch System
   - Stripe Payment Processing

3. **Build it yourself**: Try implementing a mini Instagram with Python + PostgreSQL

**System design interviews**:
- Practice with this walkthrough
- Focus on trade-offs (not perfect solutions)
- Explain your reasoning clearly

Thank you for learning with us! 🚀
      `,
      canvasOperations: [],
      widgets: [
        {
          type: 'comparison-table',
          title: 'Your Learning Journey',
          columns: ['Phase', 'Topics', 'Duration', 'Status'],
          rows: [
            {
              label: 'Phase 1: Introduction',
              values: ['Problem framing, core challenges', '10 min', '✅ Complete'],
            },
            {
              label: 'Phase 2: Naive Approach',
              values: ['Simple SQL, scaling pains', '15 min', '✅ Complete'],
            },
            {
              label: 'Phase 3: Feed Strategies',
              values: ['Push, pull, hybrid feed generation', '20 min', '✅ Complete'],
            },
            {
              label: 'Phase 4: Real Architecture',
              values: ['Images, CDN, Cassandra, full stack', '25 min', '✅ Complete'],
            },
            {
              label: 'Phase 5: Stories Exercise',
              values: ['Hands-on: ephemeral content with TTL', '20 min', '✅ Complete'],
            },
            {
              label: 'Phase 6: Deep Dive',
              values: ['Sharding, real-time notifications', '20 min', '✅ Complete'],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'Final reflection: What was the HARDEST problem to solve at Instagram\'s scale?',
          options: [
            {
              id: 'storage',
              text: 'Image storage - 10 petabytes is a lot',
              correct: false,
              explanation:
                'Storage is expensive but straightforward (S3 + CDN). It\'s a "throw money at it" problem. Feed generation required more creative engineering.',
            },
            {
              id: 'feed',
              text: 'Feed generation - balancing latency, freshness, and cost',
              correct: true,
              explanation:
                'Exactly! Feed generation required inventing a hybrid approach (push for most, pull for celebrities). This involved deep trade-offs between write amplification, read latency, storage cost, and real-time freshness. It\'s the most creative problem Instagram solved.',
            },
            {
              id: 'graph',
              text: 'Social graph - 500 billion relationships',
              correct: false,
              explanation:
                'The graph is large, but Cassandra handles it well with denormalized tables. Feed generation is harder because it combines graph queries + ranking + real-time updates.',
            },
            {
              id: 'realtime',
              text: 'Real-time notifications - WebSockets at scale',
              correct: false,
              explanation:
                'Real-time is challenging but well-understood (WebSockets + Redis Pub/Sub). Feed generation required more novel solutions (hybrid push/pull).',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },
  ],
};
