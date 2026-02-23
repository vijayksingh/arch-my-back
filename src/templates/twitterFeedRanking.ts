import type { DesignTemplate } from '@/types';

/**
 * Real-World Example: Twitter/X Feed Ranking Algorithm
 *
 * A comprehensive example demonstrating Twitter's recommendation system architecture.
 * Covers the full ML pipeline: candidate sourcing, ranking, filtering, and serving.
 *
 * Based on Twitter's open-source recommendation algorithm and engineering blog posts.
 *
 * Note: Widget data structures (Timeline, Comparison Table, Trade-offs Card, Code Block, Code Diff)
 * would be added via the UI when using this template. The architecture diagram below provides
 * the foundation for explaining Twitter's 48M parameter neural network that processes 5B requests/day.
 */

/**
 * Widget content guide for this template (add via UI):
 *
 * Timeline widget data: Feed Ranking Pipeline
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/*
const _feedRankingTimeline: TimelineInput = {
  events: [
    {
      id: 'tweet-ingestion',
      timestamp: 0,
      title: 'Tweet Ingestion',
      description: '5 billion tweets processed daily from global stream',
      type: 'start',
      swimlaneId: 'ingestion',
    },
    {
      id: 'candidate-sourcing-start',
      timestamp: 100,
      title: 'Candidate Sourcing',
      description: 'Fetch ~1500 candidates from hundreds of millions of tweets',
      type: 'event',
      swimlaneId: 'sourcing',
    },
    {
      id: 'in-network-fetch',
      timestamp: 200,
      title: 'In-Network Fetch',
      description: 'Real Graph model ranks tweets from users you follow',
      type: 'event',
      swimlaneId: 'sourcing',
    },
    {
      id: 'out-network-fetch',
      timestamp: 250,
      title: 'Out-of-Network Fetch',
      description: 'Social Graph + Embedding Spaces find relevant tweets outside network',
      type: 'event',
      swimlaneId: 'sourcing',
    },
    {
      id: 'feature-extraction',
      timestamp: 400,
      title: 'Feature Extraction',
      description: 'Extract 1000+ features: engagement, recency, relevance, graph signals',
      type: 'event',
      swimlaneId: 'ml',
    },
    {
      id: 'ranking-model',
      timestamp: 600,
      title: 'Neural Network Ranking',
      description: '48M parameter model scores candidates with 10 engagement probabilities',
      type: 'event',
      swimlaneId: 'ml',
    },
    {
      id: 'filtering',
      timestamp: 800,
      title: 'Heuristics & Filtering',
      description: 'Remove blocked users, NSFW, already-seen tweets',
      type: 'decision',
      swimlaneId: 'filtering',
    },
    {
      id: 'home-mixer',
      timestamp: 1000,
      title: 'Home Mixer',
      description: 'Blend tweets with ads and recommendations',
      type: 'event',
      swimlaneId: 'serving',
    },
    {
      id: 'feed-delivered',
      timestamp: 1200,
      title: 'Feed Delivered',
      description: 'Personalized feed served to user (avg: 1.5s total)',
      type: 'end',
      swimlaneId: 'serving',
    },
  ],
  swimlanes: [
    { id: 'ingestion', label: 'Ingestion' },
    { id: 'sourcing', label: 'Candidate Sourcing' },
    { id: 'ml', label: 'ML Pipeline' },
    { id: 'filtering', label: 'Filtering' },
    { id: 'serving', label: 'Serving' },
  ],
};  */

// Comparison Table widget data: Ranking Approaches
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/*
const _rankingApproachesComparison: ComparisonTableInput = {
  columns: [
    {
      id: 'chronological',
      title: 'Chronological',
      description: 'Simple time-based ordering',
    },
    {
      id: 'engagement',
      title: 'Engagement-Based',
      description: 'Sort by likes, retweets, replies',
    },
    {
      id: 'ml-personalized',
      title: 'ML Personalized (Current)',
      description: 'Neural network with 48M parameters',
    },
  ],
  rows: [
    {
      id: 'complexity',
      label: 'Implementation Complexity',
      cells: {
        chronological: 'Low - Simple timestamp sort',
        engagement: 'Medium - Weighted scoring',
        'ml-personalized': 'High - Neural networks, feature engineering',
      },
    },
    {
      id: 'relevance',
      label: 'Personalization',
      cells: {
        chronological: {
          type: 'pros-cons',
          content: 'No personalization',
          pros: ['Predictable', 'Transparent'],
          cons: ['Misses relevant content', 'No learning'],
        },
        engagement: {
          type: 'pros-cons',
          content: 'Basic personalization',
          pros: ['Surface popular content', 'Simple metrics'],
          cons: ['Echo chambers', 'Gaming possible'],
        },
        'ml-personalized': {
          type: 'pros-cons',
          content: 'Deep personalization',
          pros: ['Learns user preferences', 'Multi-signal optimization', 'Diversity control'],
          cons: ['Complex to tune', 'Black box'],
        },
      },
    },
    {
      id: 'signals',
      label: 'Ranking Signals',
      cells: {
        chronological: 'Timestamp only',
        engagement: 'Likes, retweets, replies, views',
        'ml-personalized': '1000+ features: engagement, recency, relevance, graph, multimedia, author signals',
      },
    },
    {
      id: 'latency',
      label: 'Serving Latency',
      cells: {
        chronological: '< 100ms',
        engagement: '~500ms',
        'ml-personalized': '~1.5s (5B requests/day)',
      },
    },
    {
      id: 'scale',
      label: 'Best For',
      cells: {
        chronological: 'Small communities, real-time events',
        engagement: 'Trending topics, viral content',
        'ml-personalized': 'Large-scale social networks with diverse content',
      },
    },
  ],
};  */

// Trade-offs Card widget data: Key Algorithmic Decisions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/*
const _algorithmTradeoffs: TradeoffsCardInput = {
  title: 'Twitter Feed Ranking: Key Architecture Decisions',
  context:
    'Twitter processes 5 billion feed requests daily, serving personalized content to hundreds of millions of users. The system must balance relevance, diversity, recency, and performance while maintaining user trust.',
  pros: [
    'ML-driven personalization learns individual user preferences from engagement patterns',
    '48M parameter neural network optimizes for positive engagement (likes, retweets, replies)',
    'Multi-stage pipeline (candidate sourcing → ranking → filtering) ensures scalability',
    'Open-source algorithm (2023) provides transparency and community trust',
  ],
  cons: [
    'Algorithmic timeline reduces chronological transparency',
    'Risk of filter bubbles and echo chambers from over-optimization',
    'Complex model requires continuous A/B testing and monitoring',
    'Computational cost: 1.5s latency per request with massive infrastructure',
  ],
  decision:
    'Use a hybrid approach: ML-powered "For You" feed as default with chronological "Following" feed as alternative. This gives users choice while leveraging personalization benefits.',
  alternatives: [
    {
      id: 'alt-chronological',
      name: 'Pure Chronological Feed',
      description: 'Show all tweets in reverse chronological order (pre-2016 Twitter)',
      pros: [
        'Complete transparency - users know exactly what they\'re seeing',
        'No algorithmic bias or filter bubbles',
        'Simple implementation, low latency',
        'Real-time updates for breaking news',
      ],
      cons: [
        'Miss important tweets when not online',
        'No quality filtering - spam and low-quality content shown equally',
        'No personalization - same feed structure for all users',
        'Information overload for users following many accounts',
      ],
    },
    {
      id: 'alt-engagement-only',
      name: 'Engagement Score Ranking',
      description: 'Rank by simple engagement metrics (likes + retweets + replies)',
      pros: [
        'Simpler than ML model - easier to understand and debug',
        'Surfaces popular/viral content effectively',
        'Lower computational cost than neural networks',
        'More predictable behavior',
      ],
      cons: [
        'Easy to game with bots and coordinated engagement',
        'Popularity bias - misses niche but relevant content',
        'No personalization - everyone sees same "popular" tweets',
        'Recency not factored in - old viral tweets dominate',
      ],
    },
    {
      id: 'alt-collaborative-filtering',
      name: 'Collaborative Filtering',
      description: 'Recommend based on similar users\' engagement (like Netflix)',
      pros: [
        'Good personalization from user similarity',
        'Explainable recommendations',
        'Works well for content discovery',
        'Handles cold start with demographic info',
      ],
      cons: [
        'Cold start problem for new users/tweets',
        'Scalability challenges with 200M+ users',
        'Slower to adapt to user preference changes',
        'Limited by what similar users have engaged with',
      ],
    },
  ],
};  */

// Code Block widget data: Feature Extraction and Scoring
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/*
const _featureExtractionCode: CodeBlockInput = {
  language: 'python',
  code: `# Twitter Feed Ranking - Feature Extraction and Scoring
# Based on Twitter's open-source algorithm (simplified)

import numpy as np
from typing import Dict, List

class FeedRankingModel:
    """
    Neural network model for ranking tweets in the For You feed.
    48M parameters trained on tweet interactions.
    """

    def extract_features(self, tweet: Dict, user: Dict) -> np.ndarray:
        """
        Extract 1000+ features from tweet, user, and engagement data.

        Features include:
        - Relevance: Topic alignment, content similarity
        - Recency: Time since posted, time decay
        - Engagement: Historical likes, retweets, replies
        - Graph: Author-user connection strength (Real Graph)
        - Multimedia: Has video/image, format type
        - Author signals: Verified, follower count, engagement rate
        """
        features = []

        # Recency features
        time_since_post = (current_time() - tweet['created_at']).seconds
        features.append(np.exp(-time_since_post / 3600))  # Time decay

        # Engagement features
        engagement_rate = (
            tweet['likes'] +
            2 * tweet['retweets'] +  # Retweets weighted higher
            1.5 * tweet['replies']
        ) / max(tweet['impressions'], 1)
        features.append(engagement_rate)

        # Graph features (Real Graph model)
        author_connection = self.real_graph.predict_engagement(
            user_id=user['id'],
            author_id=tweet['author_id']
        )
        features.append(author_connection)

        # Multimedia boost
        if tweet.get('has_video'):
            features.append(2.5)  # 2-4x boost for video
        elif tweet.get('has_image'):
            features.append(1.5)
        else:
            features.append(1.0)

        # Topic relevance (embedding similarity)
        topic_relevance = self.compute_topic_similarity(
            user['interest_embeddings'],
            tweet['content_embeddings']
        )
        features.append(topic_relevance)

        # ... (1000+ more features)

        return np.array(features)

    def score_tweet(self, features: np.ndarray) -> Dict[str, float]:
        """
        48M parameter neural network outputs 10 engagement probabilities:
        - P(like)
        - P(retweet)
        - P(reply)
        - P(profile_visit)
        - P(follow_author)
        - P(video_watch_50%)
        - P(negative_feedback)
        - P(report)
        - P(hide)
        - P(block_author)
        """
        # Neural network forward pass (simplified)
        logits = self.neural_network(features)
        probabilities = softmax(logits)

        # Weighted combination for final score
        score = (
            3.0 * probabilities['like'] +
            5.0 * probabilities['retweet'] +
            10.0 * probabilities['reply'] +
            2.0 * probabilities['profile_visit'] +
            15.0 * probabilities['follow_author'] +
            1.0 * probabilities['video_watch_50%'] +
            -10.0 * probabilities['negative_feedback'] +
            -50.0 * probabilities['report'] +
            -20.0 * probabilities['hide'] +
            -100.0 * probabilities['block_author']
        )

        return {
            'score': score,
            'probabilities': probabilities
        }

    def rank_candidates(self, candidates: List[Dict], user: Dict) -> List[Dict]:
        """
        Rank ~1500 candidates from candidate sourcing stage.
        Average latency: ~800ms for scoring + ranking.
        """
        scored_tweets = []

        for tweet in candidates:
            features = self.extract_features(tweet, user)
            result = self.score_tweet(features)
            tweet['_score'] = result['score']
            tweet['_probabilities'] = result['probabilities']
            scored_tweets.append(tweet)

        # Sort by score (descending)
        ranked = sorted(scored_tweets, key=lambda t: t['_score'], reverse=True)

        # Apply diversity heuristics to prevent repetition
        return self.apply_diversity(ranked, user)

    def apply_diversity(self, tweets: List[Dict], user: Dict) -> List[Dict]:
        """
        Ensure feed diversity:
        - No more than 2 tweets from same author in top 10
        - Mix of In-Network and Out-of-Network content
        - Varied content types (text, images, videos)
        """
        # ... diversity logic ...
        return tweets


# Example usage
model = FeedRankingModel()
user_profile = {'id': 'user_123', 'interest_embeddings': [...]}
candidates = fetch_candidates(user_profile)  # ~1500 tweets

# Rank candidates
ranked_feed = model.rank_candidates(candidates, user_profile)

# Serve top tweets
for i, tweet in enumerate(ranked_feed[:50]):
    print(f"{i+1}. {tweet['text']} (score: {tweet['_score']:.2f})")`,
  runtime: 'browser',
};  */

// Code Diff widget data: Algorithm Evolution
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/*
const _algorithmEvolution: CodeDiffInput = {
  language: 'python',
  filename: 'ranking_model.py',
  oldCode: `# Pre-2023: Closed-source algorithm with hand-engineered features

def score_tweet(tweet, user):
    """
    Original algorithm with manual feature engineering.
    Limited to ~100 hand-crafted features.
    """
    score = 0.0

    # Simple engagement scoring
    score += tweet['likes'] * 1.0
    score += tweet['retweets'] * 2.0
    score += tweet['replies'] * 1.5

    # Recency bonus (manual decay)
    hours_old = (now() - tweet['created_at']).hours
    if hours_old < 1:
        score *= 2.0
    elif hours_old < 6:
        score *= 1.5
    elif hours_old < 24:
        score *= 1.2

    # Author reputation
    if tweet['author']['verified']:
        score *= 1.3

    # Basic content type boost
    if tweet.get('has_image'):
        score *= 1.2

    return score`,
  newCode: `# 2024-2025: Grok-powered transformer architecture (open source)

class GrokRankingModel:
    """
    New recommendation algorithm built on xAI's Grok transformer.
    End-to-end ML system with 48M parameters.
    Replaces ALL hand-engineered ranking features.
    """

    def __init__(self):
        self.transformer = GrokTransformer(
            num_layers=12,
            hidden_size=768,
            num_heads=12,
            vocab_size=50000
        )
        # 48M trainable parameters

    def score_tweet(self, tweet, user, context):
        """
        Neural network learns ALL features from data.
        Outputs 10 engagement probability predictions.
        """
        # Encode tweet content with transformer
        tweet_embedding = self.transformer.encode(tweet['text'])

        # Encode user interests
        user_embedding = self.get_user_embedding(user)

        # Contextual features (what user engaged with recently)
        context_embedding = self.encode_context(context)

        # Combined representation
        combined = concatenate([
            tweet_embedding,
            user_embedding,
            context_embedding,
            self.encode_metadata(tweet)
        ])

        # Multi-task prediction head
        # Outputs: P(like), P(retweet), P(reply), P(video_watch), etc.
        probabilities = self.prediction_head(combined)

        # Weighted combination for final score
        score = self.compute_weighted_score(probabilities)

        return {
            'score': score,
            'probabilities': probabilities,
            'explanation': self.generate_explanation(probabilities)
        }

    def get_user_embedding(self, user):
        """
        Dense representation learned from engagement history.
        Captures interests, preferences, patterns.
        """
        return self.user_encoder(user['engagement_history'])`,
};  */

export const twitterFeedRankingTemplate: DesignTemplate = {
  slug: 'twitter-feed-ranking',
  title: 'Twitter/X Feed Ranking Algorithm',
  description: 'Real-world example: ML-powered recommendation system with candidate sourcing, neural network ranking, and personalization. Demonstrates Twitter\'s 5B req/day feed algorithm using Timeline, Comparison Table, Trade-offs Card, Code Block, and Code Diff widgets.',

  // Canvas Architecture Diagram
  nodes: [
    {
      id: 'user-request',
      type: 'archComponent',
      position: { x: 50, y: 50 },
      data: {
        componentType: 'client_browser',
        label: 'User Device',
        config: {},
      },
    },
    {
      id: 'api-gateway',
      type: 'archComponent',
      position: { x: 50, y: 200 },
      data: {
        componentType: 'api_gateway',
        label: 'API Gateway',
        config: {},
      },
    },
    {
      id: 'home-mixer',
      type: 'archComponent',
      position: { x: 250, y: 200 },
      data: {
        componentType: 'app_server',
        label: 'Home Mixer',
        config: {},
      },
    },

    // Candidate Sourcing
    {
      id: 'candidate-sourcing',
      type: 'archComponent',
      position: { x: 450, y: 100 },
      data: {
        componentType: 'app_server',
        label: 'Candidate Sourcing',
        config: {},
      },
    },
    {
      id: 'in-network-service',
      type: 'archComponent',
      position: { x: 650, y: 50 },
      data: {
        componentType: 'app_server',
        label: 'In-Network Service',
        config: {},
      },
    },
    {
      id: 'out-network-service',
      type: 'archComponent',
      position: { x: 650, y: 150 },
      data: {
        componentType: 'app_server',
        label: 'Out-of-Network Service',
        config: {},
      },
    },
    {
      id: 'real-graph',
      type: 'archComponent',
      position: { x: 850, y: 50 },
      data: {
        componentType: 'ml_model',
        label: 'Real Graph',
        config: {},
      },
    },
    {
      id: 'social-graph',
      type: 'archComponent',
      position: { x: 850, y: 120 },
      data: {
        componentType: 'ml_model',
        label: 'Social Graph',
        config: {},
      },
    },
    {
      id: 'embedding-space',
      type: 'archComponent',
      position: { x: 850, y: 190 },
      data: {
        componentType: 'ml_model',
        label: 'Embedding Space',
        config: {},
      },
    },

    // Ranking Layer
    {
      id: 'ranking-service',
      type: 'archComponent',
      position: { x: 450, y: 300 },
      data: {
        componentType: 'app_server',
        label: 'Ranking Service',
        config: {},
      },
    },
    {
      id: 'feature-extractor',
      type: 'archComponent',
      position: { x: 650, y: 300 },
      data: {
        componentType: 'worker',
        label: 'Feature Extractor',
        config: {},
      },
    },
    {
      id: 'neural-network',
      type: 'archComponent',
      position: { x: 850, y: 300 },
      data: {
        componentType: 'ml_model',
        label: '48M Param NN',
        config: {},
      },
    },

    // Filtering and Serving
    {
      id: 'filter-service',
      type: 'archComponent',
      position: { x: 450, y: 450 },
      data: {
        componentType: 'app_server',
        label: 'Filter Service',
        config: {},
      },
    },

    // Data Stores
    {
      id: 'tweet-store',
      type: 'archComponent',
      position: { x: 50, y: 400 },
      data: {
        componentType: 'cassandra',
        label: 'Tweet Store',
        config: {},
      },
    },
    {
      id: 'user-graph-db',
      type: 'archComponent',
      position: { x: 1050, y: 100 },
      data: {
        componentType: 'cassandra',
        label: 'User Graph DB',
        config: {},
      },
    },
    {
      id: 'redis-cache',
      type: 'archComponent',
      position: { x: 250, y: 400 },
      data: {
        componentType: 'redis',
        label: 'Redis Cache',
        config: {},
      },
    },
    {
      id: 'kafka-stream',
      type: 'archComponent',
      position: { x: 450, y: 600 },
      data: {
        componentType: 'kafka',
        label: 'Tweet Stream',
        config: {},
      },
    },
  ],

  edges: [
    // User to API Gateway
    { id: 'e1', source: 'user-request', target: 'api-gateway', type: 'archEdge', data: {} },
    { id: 'e2', source: 'api-gateway', target: 'home-mixer', type: 'archEdge', data: {} },

    // Home Mixer to Candidate Sourcing
    { id: 'e3', source: 'home-mixer', target: 'candidate-sourcing', type: 'archEdge', data: {} },

    // Candidate Sourcing to In/Out Network
    { id: 'e4', source: 'candidate-sourcing', target: 'in-network-service', type: 'archEdge', data: {} },
    { id: 'e5', source: 'candidate-sourcing', target: 'out-network-service', type: 'archEdge', data: {} },

    // In-Network to Real Graph
    { id: 'e6', source: 'in-network-service', target: 'real-graph', type: 'archEdge', data: {} },

    // Out-Network to Social Graph and Embeddings
    { id: 'e7', source: 'out-network-service', target: 'social-graph', type: 'archEdge', data: {} },
    { id: 'e8', source: 'out-network-service', target: 'embedding-space', type: 'archEdge', data: {} },

    // Graph models to User Graph DB
    { id: 'e9', source: 'real-graph', target: 'user-graph-db', type: 'archEdge', data: {} },
    { id: 'e10', source: 'social-graph', target: 'user-graph-db', type: 'archEdge', data: {} },
    { id: 'e11', source: 'embedding-space', target: 'user-graph-db', type: 'archEdge', data: {} },

    // Candidate Sourcing to Ranking
    { id: 'e12', source: 'candidate-sourcing', target: 'ranking-service', type: 'archEdge', data: {} },

    // Ranking pipeline
    { id: 'e13', source: 'ranking-service', target: 'feature-extractor', type: 'archEdge', data: {} },
    { id: 'e14', source: 'feature-extractor', target: 'neural-network', type: 'archEdge', data: {} },

    // Ranking to Filtering
    { id: 'e15', source: 'ranking-service', target: 'filter-service', type: 'archEdge', data: {} },

    // Filter to Home Mixer
    { id: 'e16', source: 'filter-service', target: 'home-mixer', type: 'archEdge', data: {} },

    // Data stores
    { id: 'e17', source: 'home-mixer', target: 'tweet-store', type: 'archEdge', data: {} },
    { id: 'e18', source: 'home-mixer', target: 'redis-cache', type: 'archEdge', data: {} },
    { id: 'e19', source: 'kafka-stream', target: 'tweet-store', type: 'archEdge', data: {} },
    { id: 'e20', source: 'kafka-stream', target: 'ranking-service', type: 'archEdge', data: {} },
  ],

  // Note: Widgets (timeline, comparisonTable, etc.) would be added via the UI
  // The widget data structures are defined above for reference
  // metadata: {
  //   widgets: {
  //     timeline: feedRankingTimeline,
  //     comparisonTable: rankingApproachesComparison,
  //     tradeoffsCard: algorithmTradeoffs,
  //     codeBlock: featureExtractionCode,
  //     codeDiff: algorithmEvolution,
  //   },
  //   annotations: [
  //     {
  //       nodeId: 'neural-network',
  //       text: 'Continuously trained on tweet interactions to optimize for positive engagement (likes, retweets, replies). Outputs 10 engagement probability labels.',
  //     },
  //     {
  //       nodeId: 'real-graph',
  //       text: 'Predicts likelihood of engagement between two users. Most important signal for In-Network ranking.',
  //     },
  //     {
  //       nodeId: 'embedding-space',
  //       text: 'Computes numerical representations of users\' interests and tweets\' content for similarity matching.',
  //     },
  //     {
  //       nodeId: 'kafka-stream',
  //       text: 'Processes 5 billion requests per day with average 1.5s latency.',
  //     },
  //   ],
  // },
};
