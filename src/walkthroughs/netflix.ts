import type { Walkthrough } from '@/types/walkthrough';

/**
 * Netflix Recommendation System - Interactive Walkthrough
 *
 * A 90-120 minute progressive learning experience that builds understanding
 * of Netflix's recommendation architecture from first principles to production scale.
 *
 * Sources:
 * - Netflix Tech Blog: https://netflixtechblog.com/
 * - Real-Time Distributed Graph: https://netflixtechblog.com/how-and-why-netflix-built-a-real-time-distributed-graph-part-1-ingesting-and-processing-data-80113e124acc
 * - ML Model Consolidation: https://netflixtechblog.medium.com/lessons-learnt-from-consolidating-ml-models-in-a-large-scale-recommendation-system-870c5ea5eb4a
 */

export const netflixWalkthrough: Walkthrough = {
  id: 'netflix-recommendation-walkthrough',
  slug: 'netflix-recommendation',
  title: 'Netflix Recommendation System',
  description:
    'Build understanding of how Netflix recommends content to 200M+ subscribers at scale',
  learningGoals: [
    'Understand collaborative filtering and content-based recommendation approaches',
    'Learn how to scale recommendation systems from prototype to production',
    'Explore trade-offs between caching, freshness, and personalization',
    'Deep dive into ML pipelines, feature engineering, and A/B testing infrastructure',
  ],
  estimatedMinutes: 120,
  difficulty: 'intermediate',
  tags: [
    'machine-learning',
    'recommendation-systems',
    'distributed-systems',
    'data-engineering',
    'real-time-processing',
  ],
  sources: [
    {
      title: 'Netflix Tech Blog',
      url: 'https://netflixtechblog.com/',
    },
    {
      title: 'Real-Time Distributed Graph at Netflix',
      url: 'https://netflixtechblog.com/how-and-why-netflix-built-a-real-time-distributed-graph-part-1-ingesting-and-processing-data-80113e124acc',
    },
    {
      title: 'ML Model Consolidation',
      url: 'https://netflixtechblog.medium.com/lessons-learnt-from-consolidating-ml-models-in-a-large-scale-recommendation-system-870c5ea5eb4a',
    },
  ],

  steps: [
    // ========== PHASE 1: PROBLEM INTRODUCTION (10 min) ==========
    {
      id: 'step-1-intro',
      title: 'The Recommendation Challenge',
      phase: 'intro',
      estimatedMinutes: 5,
      content: `
# Welcome to Netflix's Recommendation System

You're building Netflix. You have:
- **200M+ subscribers** across 190+ countries
- **Thousands of titles** (movies, TV shows, documentaries)
- **Billions of viewing hours** per month
- **Different tastes** across demographics, cultures, and individuals

## The Challenge

Each user opens Netflix and sees a personalized homepage. How do you decide what to show them?

This isn't just an engineering problem—it's a **business-critical** challenge:
- **80% of viewer activity** comes from recommendations (not search!)
- Poor recommendations = increased churn
- Better recommendations = higher engagement + retention
- Small improvements = millions in revenue

## Think First: What Would You Do?

Before we dive into solutions, put yourself in the architect's seat. How would YOU solve this?
      `,
      widgets: [
        {
          type: 'quiz',
          question: 'If you had to build v1 of Netflix recommendations TODAY, what would you start with?',
          options: [
            {
              id: 'popular',
              text: 'Show everyone the same popular content (top 10 trending)',
              correct: false,
              explanation:
                'This is tempting because it\'s simple! But Netflix tried this early on and found engagement was poor. Why? Your taste in sci-fi is different from someone who loves rom-coms. One-size-fits-all doesn\'t work when tastes vary wildly.',
            },
            {
              id: 'random',
              text: 'Show random content from the catalog',
              correct: false,
              explanation:
                'Randomness ensures diversity, but it\'s a terrible user experience. Users would spend more time searching than watching. Netflix found that users abandon after 60-90 seconds of browsing without finding something appealing.',
            },
            {
              id: 'genre',
              text: 'Ask users their favorite genres, then filter by those',
              correct: true,
              explanation:
                'Good thinking! This is exactly where Netflix started. Users select genres during signup, then see content filtered by those preferences. It\'s simple, works reasonably well, and can be built in a few days. The downside? It\'s not very personalized—everyone who likes "Action" sees the same action movies.',
            },
            {
              id: 'ml',
              text: 'Build a machine learning model that predicts what users will like',
              correct: false,
              explanation:
                'You\'re jumping ahead! ML is powerful but requires data you don\'t have yet. What would you train on? For new users with no viewing history, ML models can\'t make predictions. You need simpler approaches first to collect data, THEN build ML models.',
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
              label: 'Server',
              config: {},
            },
          },
          highlight: true,
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-2-quiz-challenges',
      title: 'What Makes This Hard?',
      phase: 'intro',
      estimatedMinutes: 5,
      content: `
# What's the Biggest Challenge?

Before we dive into solutions, think about what makes recommendation systems difficult.

Take the quiz below—there are no wrong answers, but your choice will shape how we explore the problem.
      `,
      canvasOperations: [],
      widgets: [
        {
          type: 'quiz',
          question: 'What do you think is the primary challenge in building Netflix recommendations?',
          options: [
            {
              id: 'scale',
              text: 'Scale - Handling 200M+ users querying concurrently',
              correct: true,
              explanation:
                'Excellent! Scale is critical. Netflix serves billions of personalized requests per day. A naive approach computing recommendations on-demand would collapse under this load. You need caching, pre-computation, and distributed systems.',
            },
            {
              id: 'personalization',
              text: 'Personalization - Every user has unique tastes',
              correct: true,
              explanation:
                'Spot on! Personalization is the heart of the problem. You can\'t just show everyone the same "popular" content. You need to understand user preferences, viewing history, and context (device, time of day, etc.).',
            },
            {
              id: 'cold-start',
              text: 'Cold Start - New users with no viewing history',
              correct: true,
              explanation:
                'Great insight! The cold start problem is real. New users have no viewing history. New titles have no ratings. You need fallback strategies like popularity-based recommendations and quick onboarding flows.',
            },
            {
              id: 'freshness',
              text: 'Freshness - Keeping recommendations up-to-date',
              correct: true,
              explanation:
                'Exactly! If a user just binge-watched a thriller series, you want to immediately reflect that in their recommendations. Pre-computed results get stale. Real-time updates are complex.',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 2: NAIVE APPROACH (15 min) ==========
    {
      id: 'step-3-collaborative-filtering',
      title: 'Collaborative Filtering Basics',
      phase: 'naive',
      estimatedMinutes: 8,
      content: `
# The Naive Solution: Collaborative Filtering

Let's start simple. The core insight:
> **Users who agreed in the past tend to agree in the future.**

If Alice and Bob both loved *Stranger Things* and *The Crown*, and Alice also loved *Breaking Bad*, then Bob will probably like *Breaking Bad* too.

## How It Works

1. **User-Item Matrix**: Rows = users, Columns = shows, Cells = ratings (1-5 stars or implicit like watch time)
2. **Find Similar Users**: Calculate similarity (cosine similarity, Pearson correlation) between users
3. **Recommend Items**: For a target user, find the most similar users and recommend items they liked

## Example: Finding Similar Users

Let's say we have 3 users and their ratings:

| Show | Alice | Bob | Charlie |
|------|-------|-----|---------|
| Stranger Things | 5 | 5 | 2 |
| The Crown | 4 | 4 | 1 |
| Breaking Bad | 5 | ? | 3 |
| Ozark | 3 | 2 | 5 |

**Similarity scores** (using cosine similarity):
- Alice ↔ Bob: **0.95** (very similar!)
- Alice ↔ Charlie: **0.15** (not similar)
- Bob ↔ Charlie: **0.18** (not similar)

Since Alice and Bob are similar, and Alice rated Breaking Bad highly, we recommend it to Bob!

## The Architecture

Let's add the basic components:
- **Users Database**: Store user profiles and viewing history
- **Recommender Engine**: Compute collaborative filtering
- **Shows Database**: Catalog of all content
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Collaborative Filtering Algorithm (Python)',
          language: 'python',
          code: `import numpy as np
from scipy.spatial.distance import cosine

def find_similar_users(user_id, user_item_matrix, k=10):
    """
    Find k most similar users using cosine similarity

    Args:
        user_id: Target user
        user_item_matrix: Rows = users, Cols = items, Values = ratings
        k: Number of similar users to return

    Returns:
        List of (user_id, similarity_score) tuples
    """
    target_vector = user_item_matrix[user_id]
    similarities = []

    for other_id in range(len(user_item_matrix)):
        if other_id == user_id:
            continue

        other_vector = user_item_matrix[other_id]

        # Cosine similarity (1 - cosine distance)
        similarity = 1 - cosine(target_vector, other_vector)
        similarities.append((other_id, similarity))

    # Return top k most similar users
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:k]


def recommend_items(user_id, user_item_matrix, n=10):
    """
    Recommend top n items for a user based on similar users
    """
    # Find similar users
    similar_users = find_similar_users(user_id, user_item_matrix, k=50)

    # Aggregate ratings from similar users (weighted by similarity)
    item_scores = {}
    for other_id, similarity in similar_users:
        for item_id, rating in enumerate(user_item_matrix[other_id]):
            if rating > 0:  # User rated this item
                if item_id not in item_scores:
                    item_scores[item_id] = 0
                item_scores[item_id] += rating * similarity

    # Remove items user already watched
    user_watched = set(np.where(user_item_matrix[user_id] > 0)[0])
    for item_id in user_watched:
        item_scores.pop(item_id, None)

    # Return top n recommendations
    recommendations = sorted(item_scores.items(), key=lambda x: x[1], reverse=True)
    return recommendations[:n]`,
          highlights: [8, 9, 10, 24, 25],
        },
        {
          type: 'quiz',
          question: 'What is the time complexity of finding similar users for ONE user?',
          options: [
            {
              id: 'on',
              text: 'O(N) - linear in number of users',
              correct: false,
              explanation:
                'Close, but not quite. We need to compare ONE user against ALL other users, which is O(N). However, each comparison requires computing similarity across M items (all shows), so it\'s O(N × M).',
            },
            {
              id: 'onm',
              text: 'O(N × M) - N users × M items',
              correct: true,
              explanation:
                'Exactly! To find similar users for one user, we compare against N-1 other users, and each comparison computes similarity across M items (shows). For Netflix: 200M users × 10K shows = 2 trillion operations PER USER. This doesn\'t scale!',
            },
            {
              id: 'on2',
              text: 'O(N²) - quadratic in users',
              correct: false,
              explanation:
                'You\'re thinking of computing similarities for ALL pairs of users, which would indeed be O(N²). But we only need similarities for ONE user at request time, so it\'s O(N × M).',
            },
            {
              id: 'ologn',
              text: 'O(log N) - logarithmic with indexing',
              correct: false,
              explanation:
                'Unfortunately no. Even with clever indexing (like LSH for approximate nearest neighbors), we still need to compute similarity across all M items for each comparison. The fundamental issue is the high dimensionality (M items).',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'users-db',
            type: 'archComponent',
            position: { x: 50, y: 300 },
            data: {
              componentType: 'postgres',
              label: 'Users DB',
              config: {},
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'simple-recommender',
            type: 'archComponent',
            position: { x: 300, y: 200 },
            data: {
              componentType: 'app_server',
              label: 'Collaborative Filtering Engine',
              config: {},
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'shows-db',
            type: 'archComponent',
            position: { x: 550, y: 300 },
            data: {
              componentType: 'postgres',
              label: 'Shows DB',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e1',
            source: 'user-simple',
            target: 'simple-recommender',
            type: 'archEdge',
            data: { label: 'Request' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e2',
            source: 'simple-recommender',
            target: 'users-db',
            type: 'archEdge',
            data: { label: 'Fetch viewing history' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e3',
            source: 'simple-recommender',
            target: 'shows-db',
            type: 'archEdge',
            data: { label: 'Fetch show metadata' },
          },
        },
        {
          type: 'highlight',
          nodeIds: ['simple-recommender'],
          duration: 3000,
          color: '#10b981',
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-4-naive-problems',
      title: 'Scaling Problems',
      phase: 'naive',
      estimatedMinutes: 7,
      content: `
# What Breaks at Scale?

Our naive collaborative filtering works for 1,000 users. But Netflix has **200M+ users**.

## The Math

**User similarity computation**:
- N = number of users
- M = number of shows
- Complexity: O(N² × M)

For 200M users and 10K shows:
- **40 trillion comparisons** per recommendation request
- At 1ms per comparison: **40 million seconds** = **463 days** per request

## The Problems

1. **Computational Cost**: Can't compute similarities on-demand
2. **Memory**: Can't load 200M user profiles into memory
3. **Latency**: Users expect <100ms response times
4. **Data Sparsity**: Most users haven't watched most shows (99%+ sparse matrix)

## What Do We Do?

We need to **pre-compute** and **cache** results. But this creates new trade-offs...
      `,
      canvasOperations: [
        {
          type: 'highlight',
          nodeIds: ['simple-recommender'],
          duration: 5000,
          color: '#ef4444',
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e1',
            source: 'user-simple',
            target: 'simple-recommender',
            type: 'archEdge',
            data: { label: 'Request', simulating: true, status: 'bottleneck' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e2',
            source: 'simple-recommender',
            target: 'users-db',
            type: 'archEdge',
            data: { label: 'Fetch viewing history', simulating: true, status: 'bottleneck' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e3',
            source: 'simple-recommender',
            target: 'shows-db',
            type: 'archEdge',
            data: { label: 'Fetch show metadata', simulating: true, status: 'bottleneck' },
          },
        },
      ],
      widgets: [
        {
          type: 'quiz',
          question: 'How would YOU fix this performance problem? Think about the trade-offs.',
          options: [
            {
              id: 'more-servers',
              text: 'Add more servers and parallelize the computation',
              correct: false,
              explanation:
                'Adding servers helps, but doesn\'t solve the fundamental problem. Even with 1000 servers, you\'d still need millions of CPU cores to handle 200M concurrent users. The cost would be astronomical ($100M+ annually just for compute).',
            },
            {
              id: 'better-algo',
              text: 'Use a better algorithm or data structure',
              correct: true,
              explanation:
                'Good thinking! There ARE better algorithms (like Approximate Nearest Neighbors using LSH or FAISS) that reduce complexity. But even the best algorithms still take seconds for 200M users. You\'d also need to...',
            },
            {
              id: 'precompute',
              text: 'Pre-compute recommendations offline in batch jobs',
              correct: true,
              explanation:
                'Exactly! This is Netflix\'s approach. Run expensive computations ONCE overnight, store results in a cache, then serve them quickly at request time. Batch jobs can take hours—but users see results in milliseconds.',
            },
            {
              id: 'simpler-model',
              text: 'Use a simpler model that\'s less accurate but faster',
              correct: false,
              explanation:
                'This is a valid approach for some systems, but Netflix\'s business depends on recommendation quality. Showing bad recommendations costs them millions in churn. They need BOTH speed AND accuracy.',
            },
          ],
          multiSelect: true,
        },
        {
          type: 'tradeoffs',
          title: 'Pre-computation Trade-offs',
          decision: 'Should we pre-compute recommendations?',
          options: [
            {
              label: 'Real-time computation',
              pros: ['Always fresh', 'Responds to latest user actions', 'No storage overhead'],
              cons: [
                'Too slow (minutes to hours per user)',
                'High compute cost ($100M+ annually)',
                'Doesn\'t scale beyond 1M users',
              ],
            },
            {
              label: 'Pre-compute everything',
              pros: [
                'Fast responses (<100ms)',
                'Predictable latency',
                'Lower compute at request time',
                'Can run expensive algorithms offline',
              ],
              cons: [
                'Stale recommendations (hours to days old)',
                'High storage cost (200M users × 1KB = 200GB)',
                'Batch jobs take hours',
                'Miss real-time signals (just-watched shows)',
              ],
            },
            {
              label: 'Hybrid approach (Netflix)',
              pros: [
                'Cache popular recommendations',
                'Real-time for personalized signals',
                'Best of both worlds',
                'Can refresh cache incrementally',
              ],
              cons: [
                'Complex architecture',
                'Cache invalidation is hard',
                'More infrastructure (cache layer + batch jobs)',
                'Need fallback for cache misses',
              ],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 3: ADDING COMPLEXITY (20 min) ==========
    {
      id: 'step-5-candidate-generation',
      title: 'Multiple Candidate Sources',
      phase: 'complexity',
      estimatedMinutes: 7,
      content: `
# Solution: Multiple Candidate Generators

Netflix doesn't rely on a single algorithm. Instead, they use **multiple strategies** to generate candidate recommendations:

## The Three Pillars

1. **Collaborative Filtering** (User-based)
   - "Users like you watched..."
   - Finds similar users based on viewing patterns
   - Good for discovering unexpected matches

2. **Content-Based Filtering** (Item-based)
   - "Because you watched..."
   - Recommends similar shows based on metadata (genre, actors, director)
   - Solves cold-start problem for new content

3. **Trending/Popular**
   - "Trending now in your region"
   - Shows what's popular globally or regionally
   - Fallback when personalization fails (new users)

## Why Multiple Strategies?

Each approach has strengths and weaknesses. By combining them, Netflix achieves:
- **Coverage**: Every user gets recommendations (even new users with no history)
- **Diversity**: Mix of safe picks and unexpected discoveries
- **Robustness**: If one model fails, others provide fallback

## The Architecture

Each strategy runs independently as a **candidate generator**, producing ~500 candidates each. Then a **ranking layer** scores and combines them into the final top 50.
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'redis-cache',
            type: 'archComponent',
            position: { x: 300, y: 400 },
            data: {
              componentType: 'redis',
              label: 'Redis Cache',
              config: { description: 'Pre-computed recommendations' },
            },
          },
        },
      ],
      widgets: [
        {
          type: 'quiz',
          question: 'A brand new show just launched on Netflix (no user ratings yet). Which approach would work BEST for recommending it?',
          options: [
            {
              id: 'collab',
              text: 'Collaborative filtering - find users with similar tastes',
              correct: false,
              explanation:
                'This won\'t work! Collaborative filtering relies on user ratings/views. A brand new show has ZERO user interactions, so there\'s no data to compute similarity. This is the classic "cold start" problem.',
            },
            {
              id: 'content',
              text: 'Content-based filtering - match by genre, actors, themes',
              correct: true,
              explanation:
                'Perfect! Even if no one has watched the show yet, we know its metadata: genre (sci-fi), actors (Pedro Pascal), director, themes. We can compute similarity to other shows and recommend it to users who liked similar content.',
            },
            {
              id: 'trending',
              text: 'Trending/popularity - show it to everyone',
              correct: false,
              explanation:
                'This could work initially to get early views, but it\'s not personalized. Users who hate sci-fi would see it anyway. Better to use content-based filtering to target relevant users.',
            },
            {
              id: 'random',
              text: 'None of them - you need to wait for user data',
              correct: false,
              explanation:
                'Waiting would be a missed opportunity! Netflix promotes new releases heavily using content-based filtering and editorial curation. They target users most likely to enjoy the show based on metadata.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'timeline',
          title: 'Request Flow with Caching',
          events: [
            {
              label: 'User requests homepage',
              description: 'User opens Netflix app',
              nodeIds: ['user-simple'],
            },
            {
              label: 'Check cache',
              description: 'Recommendation service queries Redis',
              nodeIds: ['simple-recommender', 'redis-cache'],
            },
            {
              label: 'Cache hit - Return results',
              description: 'Serve pre-computed recommendations (~10ms)',
              nodeIds: ['redis-cache'],
            },
            {
              label: 'Cache miss - Compute',
              description: 'Fallback to real-time computation, then cache',
              nodeIds: ['simple-recommender', 'users-db', 'shows-db'],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-6-content-based',
      title: 'Content-Based Filtering',
      phase: 'complexity',
      estimatedMinutes: 7,
      content: `
# Beyond Collaborative Filtering

Collaborative filtering has limitations:
- **Cold start**: Can't recommend new shows (no user ratings yet)
- **Popularity bias**: Tends to recommend only popular content
- **Sparsity**: Most users haven't rated most shows

## Content-Based Filtering

Recommend based on **item similarity**, not user similarity:
- Extract features from shows: genre, actors, director, description
- Compute similarity between shows (cosine similarity of feature vectors)
- If you liked *Stranger Things*, recommend similar shows (sci-fi, thriller, 1980s setting)

## The Hybrid Approach

Netflix uses **both**:
- Collaborative filtering: "Users like you watched..."
- Content-based: "Because you watched..."
- Ensemble models combine signals

Let's add a content-based model to our architecture...
      `,
      canvasOperations: [
        {
          type: 'add-edge',
          edge: {
            id: 'e4',
            source: 'simple-recommender',
            target: 'redis-cache',
            type: 'archEdge',
            data: { label: 'Check cache', simulating: true, status: 'normal' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e1',
            source: 'user-simple',
            target: 'simple-recommender',
            type: 'archEdge',
            data: { label: 'Request', simulating: true, status: 'normal' },
          },
        },
        {
          type: 'highlight',
          nodeIds: ['redis-cache', 'simple-recommender'],
          duration: 3000,
          color: '#10b981',
        },
        {
          type: 'animate-flow',
          path: ['user-simple', 'simple-recommender', 'redis-cache'],
          duration: 800,
          label: 'Cache hit',
        },
        {
          type: 'add-node',
          node: {
            id: 'content-model',
            type: 'archComponent',
            position: { x: 100, y: 500 },
            data: {
              componentType: 'serverless',
              label: 'Content-Based Model',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e5',
            source: 'content-model',
            target: 'simple-recommender',
            type: 'archEdge',
            data: { label: 'Content similarity' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e6',
            source: 'shows-db',
            target: 'content-model',
            type: 'archEdge',
            data: { label: 'Show features' },
          },
        },
      ],
      widgets: [
        {
          type: 'comparison-table',
          title: 'Collaborative vs Content-Based Filtering',
          columns: ['Approach', 'Strengths', 'Weaknesses', 'Use Case'],
          rows: [
            {
              label: 'Collaborative Filtering',
              values: [
                'User similarity',
                'Finds unexpected matches, diverse recommendations',
                'Cold start, popularity bias, sparsity',
                '"Users like you watched..."',
              ],
            },
            {
              label: 'Content-Based',
              values: [
                'Item similarity',
                'Works for new items, no sparsity issues',
                'Limited diversity, filter bubble',
                '"Because you watched..."',
              ],
            },
            {
              label: 'Hybrid (Netflix)',
              values: [
                'Ensemble',
                'Best of both worlds, robust',
                'More complex, higher compute',
                'Multiple recommendation rows',
              ],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-7-ml-pipeline',
      title: 'ML Model Training Pipeline',
      phase: 'complexity',
      estimatedMinutes: 6,
      content: `
# Training the Models

Our models don't magically learn user preferences. We need:
1. **Data collection**: User interactions (plays, pauses, skips, ratings)
2. **Feature engineering**: Extract signals from raw data
3. **Model training**: Use ML frameworks (TensorFlow, PyTorch)
4. **Model deployment**: Serve predictions at scale

## The Training Pipeline

- **Batch processing**: Apache Spark processes TB of historical data
- **Feature store**: S3 stores pre-computed features
- **Model registry**: Versioning and A/B testing of models
- **Scheduled retraining**: Daily or weekly updates

Let's add these components...
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 's3-features',
            type: 'archComponent',
            position: { x: 50, y: 650 },
            data: {
              componentType: 'object_storage',
              label: 'S3 Feature Store',
              config: {},
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'spark-training',
            type: 'archComponent',
            position: { x: 300, y: 600 },
            data: {
              componentType: 'worker',
              label: 'Apache Spark - Training',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e7',
            source: 'users-db',
            target: 'spark-training',
            type: 'archEdge',
            data: { label: 'User events' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e8',
            source: 'spark-training',
            target: 's3-features',
            type: 'archEdge',
            data: { label: 'Computed features' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e9',
            source: 's3-features',
            target: 'content-model',
            type: 'archEdge',
            data: { label: 'Training data' },
          },
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Feature Engineering Example',
          language: 'python',
          code: `# Example: Extract user preference features
def extract_user_features(user_id):
    """
    Generate feature vector for a user based on viewing history
    """
    history = get_viewing_history(user_id)

    features = {
        # Genre preferences (0-1 normalized)
        'action': count_genre(history, 'action') / len(history),
        'comedy': count_genre(history, 'comedy') / len(history),
        'drama': count_genre(history, 'drama') / len(history),

        # Viewing patterns
        'avg_watch_time': np.mean([x.duration for x in history]),
        'completion_rate': np.mean([x.completed for x in history]),

        # Recency signals
        'days_since_last_watch': (now() - history[-1].timestamp).days,
        'active_days_last_30': count_active_days(history, days=30),
    }

    return features`,
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 4: REAL NETFLIX ARCHITECTURE (25 min) ==========
    {
      id: 'step-8-microservices',
      title: 'Microservices Architecture',
      phase: 'real',
      estimatedMinutes: 8,
      content: `
# Netflix's Real Architecture: Microservices

Our simple monolithic "recommender" doesn't scale to Netflix's needs. Instead:

## Service Decomposition

Netflix splits recommendation into specialized microservices:
- **Recommendation Service**: Candidate generation (1000s of candidates)
- **Ranking Service**: Score and rank candidates (ML models)
- **Personalization Service**: Final personalization (A/B tests, context)

## Why Microservices?

- **Independent scaling**: Ranking is more CPU-intensive than recommendation
- **Team autonomy**: Different teams own different services
- **Fault isolation**: If ranking fails, fallback to unranked recommendations
- **Technology diversity**: Use Python for ML, Java for high-throughput services

Let's rebuild our architecture with microservices...
      `,
      canvasOperations: [
        // Remove simple recommender, add microservices
        {
          type: 'add-node',
          node: {
            id: 'api-gateway',
            type: 'archComponent',
            position: { x: 250, y: 150 },
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
            id: 'recommendation-svc',
            type: 'archComponent',
            position: { x: 100, y: 250 },
            data: {
              componentType: 'app_server',
              label: 'Recommendation Service',
              config: {},
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'ranking-svc',
            type: 'archComponent',
            position: { x: 300, y: 250 },
            data: {
              componentType: 'app_server',
              label: 'Ranking Service',
              config: {},
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'personalization-svc',
            type: 'archComponent',
            position: { x: 500, y: 250 },
            data: {
              componentType: 'app_server',
              label: 'Personalization Service',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e10',
            source: 'user-simple',
            target: 'api-gateway',
            type: 'archEdge',
            data: { label: 'Request' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e11',
            source: 'api-gateway',
            target: 'recommendation-svc',
            type: 'archEdge',
            data: { label: 'Get candidates' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e12',
            source: 'recommendation-svc',
            target: 'ranking-svc',
            type: 'archEdge',
            data: { label: '1000s of candidates' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e13',
            source: 'ranking-svc',
            target: 'personalization-svc',
            type: 'archEdge',
            data: { label: 'Ranked top 100' },
          },
        },
      ],
      widgets: [
        {
          type: 'timeline',
          title: 'Recommendation Request Flow',
          events: [
            {
              label: '1. Candidate Generation',
              description: 'Recommendation Service generates 1000s of candidates using multiple strategies (collaborative filtering, content-based, trending)',
              nodeIds: ['recommendation-svc'],
            },
            {
              label: '2. Ranking',
              description: 'Ranking Service scores candidates using ML models (predicted watch time, completion rate)',
              nodeIds: ['ranking-svc'],
            },
            {
              label: '3. Personalization',
              description: 'Personalization Service applies final touches (A/B test variants, context like device, time of day)',
              nodeIds: ['personalization-svc'],
            },
            {
              label: '4. Return to User',
              description: 'API Gateway returns personalized homepage (~50-100ms total)',
              nodeIds: ['api-gateway'],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'If the Ranking Service goes down, what should happen?',
          options: [
            {
              id: 'fail',
              text: 'Return an error to the user - recommendations are broken',
              correct: false,
              explanation:
                'Bad user experience! If ranking fails, users see an error page and can\'t watch anything. This violates Netflix\'s availability goals (99.99% uptime).',
            },
            {
              id: 'fallback',
              text: 'Fallback to unranked candidates or a cached version',
              correct: true,
              explanation:
                'Exactly! Netflix uses graceful degradation. If ranking fails, they serve unranked candidates (still relevant!) or serve a cached ranking. Slightly worse recommendations are better than NO recommendations.',
            },
            {
              id: 'retry',
              text: 'Retry the ranking service until it succeeds',
              correct: false,
              explanation:
                'This could cause cascading failures! If ranking is down due to overload, retrying makes it worse. Better to fallback immediately and serve degraded results.',
            },
            {
              id: 'random',
              text: 'Show random content',
              correct: false,
              explanation:
                'Too extreme! We still have unranked candidates from the recommendation service. Falling back to random content throws away all personalization.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'Monolith vs Microservices',
          decision: 'Should we split into microservices?',
          options: [
            {
              label: 'Monolith',
              pros: [
                'Simpler deployment (single artifact)',
                'Easier local development',
                'No network latency between services',
                'Simpler debugging (single call stack)',
              ],
              cons: [
                'Cannot scale components independently',
                'Single point of failure',
                'Hard to maintain as codebase grows',
                'Team coordination bottlenecks',
              ],
            },
            {
              label: 'Microservices',
              pros: [
                'Independent scaling (scale ranking separately)',
                'Team autonomy (own deployment pipelines)',
                'Fault isolation (ranking failure doesn\'t break candidates)',
                'Technology diversity (Python for ML, Java for throughput)',
              ],
              cons: [
                'Network latency between services',
                'Distributed debugging is harder',
                'More complex infrastructure',
                'Data consistency challenges',
              ],
            },
            {
              label: 'Netflix Choice',
              pros: [
                'Microservices for core paths (recommendation, ranking, personalization)',
                'Monoliths for smaller domains',
                'Balance complexity vs benefits',
              ],
              cons: [
                'Requires strong DevOps culture',
                'High operational overhead',
                'Need service mesh (Istio) for observability',
              ],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-9-kafka-streaming',
      title: 'Real-Time Event Streaming',
      phase: 'real',
      estimatedMinutes: 8,
      content: `
# Real-Time Data with Apache Kafka

Netflix processes **700 billion events per day**:
- User plays a show
- User pauses/resumes
- User skips intro
- User rates a show
- User searches for content

## The Keystone Platform

Netflix's **Keystone** platform uses Kafka to:
- Collect events from all devices (web, mobile, TV, game consoles)
- Stream events to multiple consumers (ML training, analytics, real-time personalization)
- Guarantee delivery and ordering

## Real-Time Distributed Graph (RDG)

Events flow to a real-time graph that powers personalization:
- **5M+ writes per second**
- **Sub-second latency** for updates
- **Billions of nodes and edges** (users, shows, genres, actors)

Let's add Kafka and stream processing...
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'kafka',
            type: 'archComponent',
            position: { x: 300, y: 400 },
            data: {
              componentType: 'kafka',
              label: 'Kafka - Event Stream',
              config: { description: 'Keystone: 700B events/day' },
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'flink',
            type: 'archComponent',
            position: { x: 150, y: 550 },
            data: {
              componentType: 'worker',
              label: 'Apache Flink - Stream Processing',
              config: {},
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'rdg',
            type: 'archComponent',
            position: { x: 450, y: 550 },
            data: {
              componentType: 'worker',
              label: 'Real-Time Distributed Graph',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e14',
            source: 'recommendation-svc',
            target: 'kafka',
            type: 'archEdge',
            data: { label: 'User events' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e15',
            source: 'kafka',
            target: 'flink',
            type: 'archEdge',
            data: { label: 'Event stream' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e16',
            source: 'kafka',
            target: 'rdg',
            type: 'archEdge',
            data: { label: 'Graph updates' },
          },
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Event Schema Example',
          language: 'json',
          code: `{
  "event_type": "video_play",
  "user_id": "user_12345",
  "video_id": "stranger_things_s1e1",
  "timestamp": "2026-02-21T14:30:00Z",
  "device": "roku_tv",
  "location": "US-CA",
  "context": {
    "recommendation_source": "homepage_row_2",
    "ab_test_variant": "control",
    "previous_video": "breaking_bad_s5e16"
  },
  "metadata": {
    "video_position": 0,
    "audio_language": "en",
    "subtitle_language": null
  }
}`,
        },
        {
          type: 'quiz',
          question: 'Netflix processes 700 billion events per day. How many events per second is that?',
          options: [
            {
              id: '700k',
              text: '~700,000 events/second',
              correct: false,
              explanation:
                'Too low! You calculated 700B / (24 * 60 * 60) = 700B / 86,400 ≈ 8M events/second, not 700K.',
            },
            {
              id: '8m',
              text: '~8 million events/second',
              correct: true,
              explanation:
                'Correct! 700 billion events per day = 700B / 86,400 seconds ≈ 8.1 million events/second on average. During peak hours (evenings), this can spike to 20M+ events/second. This is why Netflix needs Kafka - traditional databases cannot handle this write throughput.',
            },
            {
              id: '80m',
              text: '~80 million events/second',
              correct: false,
              explanation:
                'Too high! You\'re off by a factor of 10. The calculation is 700B / 86,400 ≈ 8M events/second.',
            },
            {
              id: '1m',
              text: '~1 million events/second',
              correct: false,
              explanation:
                'Too low! This would only be 86 billion events per day. Netflix processes 700 billion, which is 8M+ events/second.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'Event Streaming Architecture',
          decision: 'How should we handle 8M+ events/second?',
          options: [
            {
              label: 'Synchronous Database Writes',
              pros: ['Simple to implement', 'Strong consistency', 'Easy to query'],
              cons: [
                'Database cannot handle 8M writes/second',
                'Single point of failure',
                'Blocks request until write completes',
                'Expensive to scale vertically',
              ],
            },
            {
              label: 'Kafka Event Streaming',
              pros: [
                'Handles millions of writes/second',
                'Decouples producers from consumers',
                'Multiple consumers can process same events',
                'Events persisted for replay',
              ],
              cons: [
                'Eventual consistency (not immediate)',
                'More complex infrastructure',
                'Consumers must handle out-of-order events',
                'Schema evolution is tricky',
              ],
            },
            {
              label: 'Netflix Keystone (Kafka + Flink)',
              pros: [
                'Kafka for ingestion (8M+ events/sec)',
                'Flink for stream processing (aggregations, joins)',
                'Real-time graph updates (sub-second)',
                'Supports 190+ data pipelines',
              ],
              cons: [
                'Very complex (requires dedicated platform team)',
                'High operational cost',
                'Debugging distributed streams is hard',
                'Schema registry + governance needed',
              ],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-10-full-architecture',
      title: 'The Complete Netflix Architecture',
      phase: 'real',
      estimatedMinutes: 9,
      content: `
# Putting It All Together

We've built up the architecture piece by piece. Here's the complete Netflix recommendation system:

## Key Components

**Client Layer**:
- Web, Mobile, Smart TV apps

**API Layer**:
- API Gateway (routing, rate limiting, auth)

**Microservices**:
- User Profile Service
- Content Catalog Service
- Recommendation Service
- Ranking Service
- Personalization Service

**Data Streaming**:
- Kafka (Keystone platform)
- Apache Flink (stream processing)
- Real-Time Distributed Graph

**Storage**:
- Cassandra (KVDAL - key-value data abstraction layer)
- S3 (feature store)
- PostgreSQL (metadata)

**ML Models**:
- Collaborative Filtering
- Content-Based Model
- Deep Neural Networks
- Multi-Task Foundation Model (2025-2026)

**Caching**:
- Redis (edge cache for pre-computed recommendations)

**Batch Processing**:
- Apache Spark (ML training)

This is what powers recommendations for 200M+ users!
      `,
      canvasOperations: [
        // Final nodes from the real template
        {
          type: 'add-node',
          node: {
            id: 'cassandra',
            type: 'archComponent',
            position: { x: 300, y: 700 },
            data: {
              componentType: 'object_storage',
              label: 'Cassandra - KVDAL',
              config: {},
            },
          },
        },
        {
          type: 'add-node',
          node: {
            id: 'ml-foundation',
            type: 'archComponent',
            position: { x: 500, y: 850 },
            data: {
              componentType: 'serverless',
              label: 'Multi-Task Foundation Model',
              config: { description: '2025-2026: Unified model' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e17',
            source: 'rdg',
            target: 'cassandra',
            type: 'archEdge',
            data: { label: '5M+ writes/sec' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e18',
            source: 'cassandra',
            target: 'personalization-svc',
            type: 'archEdge',
            data: { label: 'Real-time graph' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e19',
            source: 'cassandra',
            target: 'ml-foundation',
            type: 'archEdge',
            data: { label: 'Graph embeddings' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e20',
            source: 'ml-foundation',
            target: 'personalization-svc',
            type: 'archEdge',
            data: { label: 'Multi-task predictions' },
          },
        },
      ],
      widgets: [
        {
          type: 'quiz',
          question: 'Why does Netflix use Cassandra for the Real-Time Distributed Graph instead of PostgreSQL?',
          options: [
            {
              id: 'nosql',
              text: 'Cassandra is NoSQL, which is always better for graphs',
              correct: false,
              explanation:
                'Not quite! NoSQL isn\'t inherently better for graphs. Neo4j (a graph database) would actually be more natural for graph operations. Netflix chose Cassandra for specific engineering reasons.',
            },
            {
              id: 'writes',
              text: 'Cassandra handles 5M+ writes/second with sub-second latency',
              correct: true,
              explanation:
                'Exactly! The Real-Time Distributed Graph receives 5M+ writes/second from Kafka (user events → graph updates). PostgreSQL would fall over at this write throughput. Cassandra is optimized for massive write-heavy workloads with tunable consistency.',
            },
            {
              id: 'graph',
              text: 'Cassandra has built-in graph query support',
              correct: false,
              explanation:
                'Cassandra does NOT have native graph query support. Netflix built a custom graph abstraction layer (KVDAL) on top of Cassandra. They chose Cassandra for write throughput, not graph features.',
            },
            {
              id: 'cheap',
              text: 'Cassandra is cheaper than PostgreSQL',
              correct: false,
              explanation:
                'Cost isn\'t the primary driver at Netflix\'s scale. Both databases require large clusters. Netflix chose Cassandra because it scales horizontally for write-heavy workloads. Operational complexity and performance matter more than cost.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'Database Selection for Real-Time Graph',
          decision: 'Which database should power the real-time distributed graph?',
          options: [
            {
              label: 'PostgreSQL',
              pros: [
                'ACID transactions',
                'Rich query language (SQL)',
                'Strong consistency',
                'Mature ecosystem',
              ],
              cons: [
                'Cannot handle 5M writes/second',
                'Vertical scaling limits (~100K writes/sec)',
                'Joins are expensive at scale',
                'Single-region deployment',
              ],
            },
            {
              label: 'Neo4j (Graph DB)',
              pros: [
                'Native graph query language (Cypher)',
                'Optimized for graph traversals',
                'Built-in graph algorithms',
                'Natural data model for recommendations',
              ],
              cons: [
                'Write throughput limited (~100K writes/sec)',
                'Expensive for Netflix\'s graph size (billions of edges)',
                'Harder to scale horizontally',
                'Young ecosystem compared to Cassandra',
              ],
            },
            {
              label: 'Cassandra + KVDAL',
              pros: [
                'Handles 5M+ writes/second',
                'Linear horizontal scalability',
                'Multi-region deployment',
                'Tunable consistency (eventual → strong)',
              ],
              cons: [
                'No native graph operations (need custom layer)',
                'Eventual consistency by default',
                'Complex operational model',
                'No joins (denormalize everything)',
              ],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 5: HANDS-ON EXERCISE (20 min) ==========
    {
      id: 'step-11-exercise',
      title: 'Exercise: Add a New Ranking Signal',
      phase: 'exercise',
      estimatedMinutes: 15,
      content: `
# Hands-On Challenge

You're a Netflix engineer. Product wants to add a new ranking signal:

**"Watch Time Prediction"**
- Predict how many minutes a user will watch a show
- Prioritize shows with higher predicted watch time
- Goal: Increase total viewing hours

## Your Task

Think through how you would implement this:

1. **Data Collection**: What events do you need?
2. **Feature Engineering**: What features would help predict watch time?
3. **Model Training**: What ML algorithm would you use?
4. **Integration**: How does this fit into the existing architecture?

## Discussion Points

- Where would this model live in the architecture?
- How would you A/B test it against the current ranking?
- What are the risks? (e.g., filter bubble, showing only long content)

Take 10-15 minutes to think through your approach. When ready, click "Next" to see Netflix's solution.
      `,
      canvasOperations: [
        {
          type: 'highlight',
          nodeIds: ['ranking-svc', 'ml-foundation'],
          duration: 10000,
          color: '#f59e0b',
        },
      ],
      widgets: [
        {
          type: 'quiz',
          question: 'Before writing code, what data do you need to train a watch time prediction model?',
          options: [
            {
              id: 'ratings',
              text: 'User ratings (1-5 stars) for each show',
              correct: false,
              explanation:
                'Ratings help, but they don\'t tell you watch time! A user might rate a show 5 stars but only watch 10 minutes. You need actual watch time data from video playback events.',
            },
            {
              id: 'playback',
              text: 'Video playback events (start, progress, stop timestamps)',
              correct: true,
              explanation:
                'Perfect! Watch time = stop_timestamp - start_timestamp. Netflix collects video_progress events every 30 seconds, so they can compute actual watch time for every viewing session. This becomes the training label.',
            },
            {
              id: 'views',
              text: 'Number of views per show (how many people watched)',
              correct: false,
              explanation:
                'Popularity is a useful feature, but it doesn\'t tell you how long users watch. You need individual watch time data (per user per video) to train the model.',
            },
            {
              id: 'metadata',
              text: 'Show metadata only (genre, actors, duration)',
              correct: false,
              explanation:
                'Metadata is important for features, but you also need historical watch time data as the training label. Without actual watch time, you can\'t train a model to predict it!',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'code-block',
          title: 'Starter Code: Watch Time Prediction',
          language: 'python',
          code: `# Your implementation here
def predict_watch_time(user_id, video_id):
    """
    Predict how many minutes a user will watch a video

    Args:
        user_id: User identifier
        video_id: Video identifier

    Returns:
        predicted_minutes: Float (0 to video duration)
    """
    # TODO: Implement your solution
    # Hints:
    # - User features: viewing history, genre preferences, device
    # - Video features: duration, genre, popularity, release date
    # - Contextual features: time of day, day of week

    pass`,
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-12-exercise-solution',
      title: 'Solution: Watch Time Prediction',
      phase: 'exercise',
      estimatedMinutes: 5,
      content: `
# Netflix's Approach

Netflix actually uses **predicted watch time** as a core ranking signal! Here's how:

## Data Collection

Events from Kafka:
- \`video_play\` - User starts watching
- \`video_progress\` - Every 30 seconds (position in video)
- \`video_pause\`, \`video_stop\` - User stops watching

**Label**: Actual watch time = \`stop_timestamp - start_timestamp\`

## Features

**User features**:
- Historical watch time by genre
- Completion rate (how often they finish shows)
- Device (mobile users watch less per session)
- Time of day (evening = longer sessions)

**Video features**:
- Duration
- Episode number (users more invested in later episodes)
- Genre
- Popularity

**Interaction features**:
- User's past engagement with this genre
- Similarity to user's favorite shows

## Model

**Gradient Boosted Trees** (XGBoost or LightGBM):
- Non-linear relationships
- Handles missing data
- Fast inference (<10ms)

## Integration

- Model deployed in **Ranking Service**
- Scores all candidates
- Combined with other signals (predicted rating, diversity)
- A/B tested before rollout

## Results

Netflix saw **significant increases** in total watch time and user satisfaction!
      `,
      canvasOperations: [],
      widgets: [
        {
          type: 'code-block',
          title: 'Production Implementation',
          language: 'python',
          code: `import xgboost as xgb
import numpy as np

class WatchTimePredictor:
    def __init__(self, model_path):
        self.model = xgb.Booster()
        self.model.load_model(model_path)

    def predict(self, user_id, video_id):
        # Fetch features from feature store
        user_feats = get_user_features(user_id)
        video_feats = get_video_features(video_id)
        context_feats = get_context_features()

        # Combine into feature vector
        X = np.array([
            user_feats['avg_watch_time_action'],
            user_feats['completion_rate'],
            video_feats['duration_minutes'],
            video_feats['popularity_score'],
            context_feats['hour_of_day'],
            # ... 50+ more features
        ]).reshape(1, -1)

        # Predict watch time
        dmatrix = xgb.DMatrix(X)
        predicted_minutes = self.model.predict(dmatrix)[0]

        # Clip to valid range [0, video_duration]
        return min(predicted_minutes, video_feats['duration_minutes'])`,
          highlights: [15, 16, 17],
        },
        {
          type: 'quiz',
          question: 'Why does Netflix use Gradient Boosted Trees (XGBoost) instead of Deep Neural Networks for watch time prediction?',
          options: [
            {
              id: 'better',
              text: 'GBTs always perform better than neural networks',
              correct: false,
              explanation:
                'Not true! Neural networks can match or beat GBTs on many tasks, especially with large datasets and complex patterns. The choice depends on the specific requirements.',
            },
            {
              id: 'speed',
              text: 'GBTs have faster inference (<10ms) for ranking 1000s of candidates',
              correct: true,
              explanation:
                'Exactly! The Ranking Service needs to score 1000s of candidates in <100ms total. XGBoost can predict in <1ms per candidate, while deep neural networks take 10-100ms. For real-time ranking at scale, inference speed matters more than a small accuracy gain.',
            },
            {
              id: 'simple',
              text: 'GBTs are simpler to train and deploy',
              correct: false,
              explanation:
                'While GBTs are somewhat easier to train than DNNs, Netflix has the expertise for both. The primary reason is inference speed, not simplicity.',
            },
            {
              id: 'features',
              text: 'GBTs handle missing features better',
              correct: false,
              explanation:
                'GBTs do handle missing data well, but that\'s not the main reason. Netflix\'s feature engineering pipeline ensures features are rarely missing. The key driver is inference latency.',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 6: DEEP DIVE (30 min) ==========
    {
      id: 'step-13-ab-testing',
      title: 'A/B Testing Infrastructure',
      phase: 'deep-dive',
      estimatedMinutes: 10,
      content: `
# How Netflix Validates Changes

Every change to recommendations is **A/B tested**:
- 50% of users see the new model (treatment)
- 50% see the old model (control)
- Measure impact on key metrics

## Metrics

**Primary**:
- **Stream starts**: Did users watch more?
- **Retention**: Did users come back next week?
- **Engagement**: Hours watched per user

**Secondary**:
- Diversity (did users explore new genres?)
- Satisfaction (surveys, ratings)

## The Infrastructure

- **Experiment service**: Assigns users to variants
- **Logging**: Tracks all events with variant ID
- **Analysis pipeline**: Computes statistical significance
- **Decision**: Ship, iterate, or rollback

## Example A/B Test

**Hypothesis**: Watch time prediction improves engagement

**Setup**:
- Control: Current ranking (predicted rating)
- Treatment: New ranking (watch time prediction)
- Duration: 2 weeks
- Sample size: 10M users

**Results**:
- +3% stream starts (p < 0.001) ✅
- +5% hours watched (p < 0.001) ✅
- -2% genre diversity (p < 0.05) ⚠️
- No impact on retention (p = 0.12)

**Decision**: Ship, but monitor diversity
      `,
      canvasOperations: [],
      widgets: [
        {
          type: 'comparison-table',
          title: 'A/B Test Results: Watch Time Model',
          columns: ['Metric', 'Control', 'Treatment', 'Change', 'P-value', 'Decision'],
          rows: [
            {
              label: 'Stream Starts',
              values: ['100 starts/user', '103 starts/user', '+3%', '<0.001', '✅ Significant'],
            },
            {
              label: 'Hours Watched',
              values: ['50 hrs/user', '52.5 hrs/user', '+5%', '<0.001', '✅ Significant'],
            },
            {
              label: 'Genre Diversity',
              values: ['4.2 genres', '4.1 genres', '-2%', '0.03', '⚠️ Slight decline'],
            },
            {
              label: '7-Day Retention',
              values: ['85%', '85.2%', '+0.2%', '0.12', '➖ Not significant'],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'The A/B test shows +5% hours watched but -2% genre diversity. Should Netflix ship this change?',
          options: [
            {
              id: 'ship',
              text: 'Yes - Hours watched is the most important metric',
              correct: false,
              explanation:
                'Too simplistic! While hours watched is important, diversity matters for long-term health. Users stuck in a filter bubble might watch more short-term but churn long-term. Netflix needs to balance engagement with exploration.',
            },
            {
              id: 'no',
              text: 'No - Diversity decline is unacceptable',
              correct: false,
              explanation:
                'Too conservative! A 2% diversity decline is small and might be acceptable for a 5% engagement boost. Netflix would ship this but monitor diversity closely and potentially add a diversity bonus to the ranking.',
            },
            {
              id: 'ship-monitor',
              text: 'Yes, but add diversity as a ranking signal and monitor long-term retention',
              correct: true,
              explanation:
                'Perfect! This is exactly what Netflix would do. Ship the change for immediate engagement gains, but add diversity as a ranking signal (e.g., boost shows from new genres) and monitor long-term metrics (3-month retention). If diversity continues to decline, adjust the model.',
            },
            {
              id: 'extend',
              text: 'Extend the test for another month to get more data',
              correct: false,
              explanation:
                'With 10M users and p < 0.001, statistical significance is already strong. More time won\'t change the results significantly. Better to ship with monitoring than delay.',
            },
          ],
          multiSelect: false,
        },
        {
          type: 'tradeoffs',
          title: 'A/B Testing Trade-offs',
          decision: 'How should Netflix approach A/B testing?',
          options: [
            {
              label: 'Ship Fast (No A/B Tests)',
              pros: [
                'Faster iteration',
                'Lower infrastructure cost',
                'Simpler deployment',
                'Engineers move faster',
              ],
              cons: [
                'No validation of impact',
                'Risk of breaking user experience',
                'Cannot measure ROI',
                'Hard to rollback bad changes',
              ],
            },
            {
              label: 'A/B Test Everything (Netflix)',
              pros: [
                'Validate impact before full rollout',
                'Data-driven decisions',
                'Catch regressions early',
                'Quantify improvement',
              ],
              cons: [
                'Slower deployments (2-week tests)',
                'Complex infrastructure',
                'Interacting experiments (test interference)',
                'Culture requires statistical literacy',
              ],
            },
            {
              label: 'Canary Deployments Only',
              pros: [
                'Faster than full A/B tests',
                'Catch crashes/errors',
                'Gradual rollout (1% → 10% → 100%)',
              ],
              cons: [
                'Cannot measure subtle metric changes',
                'No control group for comparison',
                'Hard to detect 1-2% improvements',
                'Requires good observability',
              ],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-14-ml-consolidation',
      title: 'Model Consolidation',
      phase: 'deep-dive',
      estimatedMinutes: 10,
      content: `
# From Many Models to One Foundation Model

Netflix originally had **100+ specialized models**:
- Watch time prediction
- Rating prediction
- Completion prediction
- Click-through prediction
- Genre affinity
- ...and 95+ more

## The Problem

- **High maintenance**: 100 models to train, deploy, monitor
- **Inconsistent predictions**: Models disagree with each other
- **Resource intensive**: Each model needs dedicated infrastructure

## The Solution: Multi-Task Foundation Model

Netflix consolidated into a **single foundation model** that predicts **multiple objectives simultaneously**:
- Shared architecture (Transformer-based)
- Task-specific heads for each objective
- Trained on all data at once

## Benefits

- **Better performance**: Shared representations improve all tasks
- **Faster training**: Train once, get all predictions
- **Lower latency**: One model inference instead of 100
- **Easier maintenance**: Single codebase and deployment

This is the **2025-2026 direction** for Netflix's ML infrastructure.
      `,
      canvasOperations: [
        {
          type: 'highlight',
          nodeIds: ['ml-foundation'],
          duration: 8000,
          color: '#8b5cf6',
        },
      ],
      widgets: [
        {
          type: 'code-block',
          title: 'Multi-Task Model Architecture',
          language: 'python',
          code: `import torch
import torch.nn as nn

class NetflixFoundationModel(nn.Module):
    """
    Multi-task foundation model for Netflix recommendations

    Predicts multiple objectives simultaneously:
    - Watch time
    - Completion probability
    - Rating
    - Click-through rate
    """
    def __init__(self, embedding_dim=512, num_tasks=10):
        super().__init__()

        # Shared encoder (Transformer)
        self.encoder = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model=embedding_dim, nhead=8),
            num_layers=12
        )

        # Task-specific heads
        self.watch_time_head = nn.Linear(embedding_dim, 1)
        self.completion_head = nn.Linear(embedding_dim, 1)
        self.rating_head = nn.Linear(embedding_dim, 5)
        # ... more task heads

    def forward(self, user_feats, video_feats):
        # Shared encoding
        x = self.encoder(torch.cat([user_feats, video_feats], dim=-1))

        # Multi-task predictions
        predictions = {
            'watch_time': self.watch_time_head(x),
            'completion': torch.sigmoid(self.completion_head(x)),
            'rating': torch.softmax(self.rating_head(x), dim=-1),
            # ... more predictions
        }

        return predictions`,
          highlights: [23, 24, 25],
        },
        {
          type: 'quiz',
          question: 'Why would a SINGLE multi-task model perform BETTER than 100 specialized models?',
          options: [
            {
              id: 'bigger',
              text: 'Single models are always better than multiple models',
              correct: false,
              explanation:
                'Not true! Specialized models can outperform general models if tasks are very different. The key is that Netflix\'s tasks (watch time, completion, rating) are RELATED - they all predict user engagement.',
            },
            {
              id: 'transfer',
              text: 'Shared representations - Learning one task helps predict related tasks',
              correct: true,
              explanation:
                'Exactly! This is called transfer learning. If the model learns that "user loves sci-fi" while predicting ratings, it can use that same knowledge to predict watch time and completion. Shared representations mean each task benefits from data on ALL tasks, not just its own.',
            },
            {
              id: 'faster',
              text: 'Single model is faster to train than 100 models',
              correct: false,
              explanation:
                'While a single model is operationally simpler, the PRIMARY benefit is improved accuracy through shared learning, not training speed. A multi-task model might actually take longer to train than individual models.',
            },
            {
              id: 'data',
              text: 'Single model uses more data',
              correct: false,
              explanation:
                'Both approaches use the same data! The difference is that the multi-task model shares learned representations across tasks, allowing each task to benefit from signals in other tasks\' data.',
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
      estimatedMinutes: 10,
      content: `
# You've Built Netflix's Recommendation System! 🎉

## What You Learned

Over the past ~105 minutes, you've explored:

✅ **Collaborative filtering** and **content-based filtering** fundamentals
✅ **Scaling challenges** from prototype to 200M+ users
✅ **Caching strategies** and latency optimization
✅ **Microservices architecture** for independent scaling
✅ **Real-time event streaming** with Kafka (700B events/day)
✅ **ML pipelines** from feature engineering to production deployment
✅ **A/B testing** infrastructure for validating changes
✅ **Model consolidation** with multi-task foundation models

## The Architecture

You now understand the complete Netflix recommendation system:
- **3 client types** (web, mobile, TV)
- **5 microservices** (API gateway, user profile, content catalog, recommendation, ranking, personalization)
- **Real-time streaming** (Kafka + Flink + RDG)
- **4 storage systems** (Cassandra, S3, PostgreSQL, Redis)
- **4+ ML models** (collaborative, content-based, deep learning, foundation model)
- **Batch processing** (Apache Spark)

## Next Steps

**Want to learn more?**

1. **Read Netflix Tech Blog**: https://netflixtechblog.com/
2. **Explore other walkthroughs**:
   - Stripe Payment Processing
   - Instagram System Design
   - Uber Dispatch System
   - Twitter/X Feed Ranking

3. **Build your own**: Try implementing a simple recommender system in Python

**Share this walkthrough**:
- Tell your colleagues about this learning platform
- Contribute improvements or new examples

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
              label: 'Phase 1: Problem',
              values: ['Problem framing, scale challenges', '10 min', '✅ Complete'],
            },
            {
              label: 'Phase 2: Naive',
              values: ['Collaborative filtering, scaling', '15 min', '✅ Complete'],
            },
            {
              label: 'Phase 3: Complexity',
              values: ['Caching, content-based, ML pipeline', '20 min', '✅ Complete'],
            },
            {
              label: 'Phase 4: Real',
              values: ['Microservices, Kafka, full architecture', '25 min', '✅ Complete'],
            },
            {
              label: 'Phase 5: Exercise',
              values: ['Hands-on watch time prediction', '20 min', '✅ Complete'],
            },
            {
              label: 'Phase 6: Deep Dive',
              values: ['A/B testing, model consolidation', '30 min', '✅ Complete'],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'Reflection: What was the MOST IMPORTANT architectural principle you learned?',
          options: [
            {
              id: 'microservices',
              text: 'Always use microservices for scale',
              correct: false,
              explanation:
                'Microservices are powerful, but they\'re not always the answer! For small-scale systems, a monolith is simpler. The key lesson is: DECOMPOSE when you have independent scaling needs, NOT just because microservices are trendy.',
            },
            {
              id: 'cache',
              text: 'Always cache everything',
              correct: false,
              explanation:
                'Caching helps, but it introduces staleness and complexity. The key lesson is: PRE-COMPUTE expensive operations, but combine with real-time signals for freshness. It\'s about finding the right balance.',
            },
            {
              id: 'iterate',
              text: 'Start simple, add complexity only when needed',
              correct: true,
              explanation:
                'EXACTLY! This is the most important takeaway. We started with collaborative filtering (simple, works), identified bottlenecks (O(N×M) doesn\'t scale), then added complexity layer by layer (caching, microservices, real-time streaming). Netflix didn\'t start with Kafka and Cassandra—they evolved there as needs grew. This is first principles engineering.',
            },
            {
              id: 'ml',
              text: 'Machine learning is essential for recommendations',
              correct: false,
              explanation:
                'ML is powerful, but it\'s not the first step! Netflix started with simple genre filtering and collaborative filtering (rule-based). ML came later once they had data. The key lesson is: solve the problem first, THEN optimize with ML.',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },
  ],
};
