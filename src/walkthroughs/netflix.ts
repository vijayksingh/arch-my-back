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
  estimatedMinutes: 105,
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
- 80% of viewer activity comes from recommendations
- Poor recommendations = increased churn
- Better recommendations = higher engagement + retention

## Your Mission

Over the next 90 minutes, you'll build understanding from first principles:
1. Start with a naive approach
2. Identify scaling bottlenecks
3. Add complexity layer by layer
4. Arrive at Netflix's real production architecture

Let's begin with the simplest possible solution...
      `,
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'user-simple',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: {
              componentType: 'external_api',
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
        {
          type: 'add-edge',
          edge: {
            id: 'e-user-server',
            source: 'user-simple',
            target: 'server-simple',
            type: 'archEdge',
            data: { label: 'Request recommendations' },
          },
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
      userAction: {
        type: 'answer-quiz',
        correctAnswerIds: ['scale', 'personalization', 'cold-start', 'freshness'],
      },
      nextCondition: 'quiz-correct',
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

## The Architecture

Let's add the basic components:
- **Users Database**: Store user profiles and viewing history
- **Recommender Engine**: Compute collaborative filtering
- **Shows Database**: Catalog of all content

Click "Next" to see this in action...
      `,
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
      ],
      widgets: [
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
                'High compute cost',
                'Doesn\'t scale',
              ],
            },
            {
              label: 'Pre-compute everything',
              pros: ['Fast responses (<100ms)', 'Predictable latency', 'Lower compute at request time'],
              cons: [
                'Stale recommendations (hours to days old)',
                'High storage cost',
                'Batch jobs take hours',
              ],
            },
            {
              label: 'Hybrid approach',
              pros: [
                'Cache popular recommendations',
                'Real-time for personalized signals',
                'Best of both worlds',
              ],
              cons: ['Complex architecture', 'Cache invalidation is hard', 'More infrastructure'],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 3: ADDING COMPLEXITY (20 min) ==========
    {
      id: 'step-5-add-cache',
      title: 'Adding a Cache Layer',
      phase: 'complexity',
      estimatedMinutes: 7,
      content: `
# Solution: Caching Pre-computed Recommendations

Let's add **Redis** as a caching layer:
- **Batch job** runs daily/hourly to pre-compute recommendations
- Results stored in Redis with user_id as key
- Recommendation service fetches from cache
- Fallback to real-time if cache miss

## Request Flow

1. User requests recommendations
2. Check Redis cache
3. **Cache hit**: Return immediately (~10ms)
4. **Cache miss**: Compute on-demand + update cache

Watch the flow animation below...
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
        {
          type: 'add-edge',
          edge: {
            id: 'e4',
            source: 'simple-recommender',
            target: 'redis-cache',
            type: 'archEdge',
            data: { label: 'Check cache' },
          },
        },
        {
          type: 'animate-flow',
          path: ['user-simple', 'simple-recommender', 'redis-cache'],
          duration: 800,
          label: 'Cache hit',
        },
      ],
      widgets: [
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
      ],
      nextCondition: 'click-next',
    },
  ],
};
