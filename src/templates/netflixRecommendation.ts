import type { DesignTemplate } from '@/types';

/**
 * Netflix Recommendation System Template
 *
 * Real-world example showcasing Netflix's recommendation architecture
 * based on research from Netflix Tech Blog and system design resources.
 *
 * Architecture highlights:
 * - Microservices-based recommendation system
 * - Real-time data processing with Apache Kafka
 * - Hybrid ML approach (collaborative filtering + content-based + deep learning)
 * - Multi-task AI foundation models (2025-2026)
 * - Real-time distributed graph for personalization
 *
 * Sources:
 * - Netflix Tech Blog: https://netflixtechblog.com/
 * - Real-Time Distributed Graph: https://netflixtechblog.com/how-and-why-netflix-built-a-real-time-distributed-graph-part-1-ingesting-and-processing-data-80113e124acc
 * - ML Model Consolidation: https://netflixtechblog.medium.com/lessons-learnt-from-consolidating-ml-models-in-a-large-scale-recommendation-system-870c5ea5eb4a
 */
export const netflixRecommendationTemplate: DesignTemplate = {
  slug: 'netflix-recommendation',
  title: 'Netflix Recommendation System',
  description:
    'Real-world architecture of Netflix\'s recommendation system with microservices, real-time data processing, and ML models',
  nodes: [
    // Client Layer
    {
      id: 'client-web',
      type: 'archComponent',
      position: { x: 50, y: 50 },
      data: {
        componentType: 'client_browser',
        label: 'Web Client',
        config: { base_url: 'https://www.netflix.com', timeout: 5000 },
      },
    },
    {
      id: 'client-mobile',
      type: 'archComponent',
      position: { x: 250, y: 50 },
      data: {
        componentType: 'client_mobile',
        label: 'Mobile App',
        config: { base_url: 'https://api.netflix.com', timeout: 5000 },
      },
    },
    {
      id: 'client-tv',
      type: 'archComponent',
      position: { x: 450, y: 50 },
      data: {
        componentType: 'client_mobile',
        label: 'Smart TV',
        config: { base_url: 'https://api.netflix.com', timeout: 5000 },
      },
    },

    // API Gateway
    {
      id: 'api-gateway',
      type: 'archComponent',
      position: { x: 250, y: 200 },
      data: {
        componentType: 'api_gateway',
        label: 'API Gateway',
        config: {},
      },
    },

    // Microservices Layer
    {
      id: 'user-profile-svc',
      type: 'archComponent',
      position: { x: 50, y: 350 },
      data: {
        componentType: 'app_server',
        label: 'User Profile Service',
        config: {},
      },
    },
    {
      id: 'content-catalog-svc',
      type: 'archComponent',
      position: { x: 250, y: 350 },
      data: {
        componentType: 'app_server',
        label: 'Content Catalog Service',
        config: {},
      },
    },
    {
      id: 'recommendation-svc',
      type: 'archComponent',
      position: { x: 450, y: 350 },
      data: {
        componentType: 'app_server',
        label: 'Recommendation Service',
        config: {},
      },
    },
    {
      id: 'ranking-svc',
      type: 'archComponent',
      position: { x: 650, y: 350 },
      data: {
        componentType: 'app_server',
        label: 'Ranking Service',
        config: {},
      },
    },
    {
      id: 'personalization-svc',
      type: 'archComponent',
      position: { x: 850, y: 350 },
      data: {
        componentType: 'app_server',
        label: 'Personalization Service',
        config: {},
      },
    },

    // Data Streaming Layer (Keystone)
    {
      id: 'kafka-events',
      type: 'archComponent',
      position: { x: 450, y: 500 },
      data: {
        componentType: 'kafka',
        label: 'Kafka - Event Stream',
        config: {
          description: 'Keystone: 700B+ events/day',
        },
      },
    },

    // Stream Processing
    {
      id: 'flink-processor',
      type: 'archComponent',
      position: { x: 250, y: 650 },
      data: {
        componentType: 'worker',
        label: 'Apache Flink - Stream Processing',
        config: {},
      },
    },

    // Real-Time Distributed Graph (RDG)
    {
      id: 'rdg-ingestion',
      type: 'archComponent',
      position: { x: 650, y: 650 },
      data: {
        componentType: 'worker',
        label: 'RDG Ingestion Layer',
        config: {},
      },
    },

    // Storage Layer
    {
      id: 'cassandra-kvdal',
      type: 'archComponent',
      position: { x: 450, y: 800 },
      data: {
        componentType: 'object_storage',
        label: 'Cassandra - KVDAL',
        config: {
          versioning: true,
          storage_class: 'standard',
        },
      },
    },
    {
      id: 's3-feature-store',
      type: 'archComponent',
      position: { x: 50, y: 800 },
      data: {
        componentType: 'object_storage',
        label: 'S3 - Feature Store',
        config: {},
      },
    },
    {
      id: 'postgres-metadata',
      type: 'archComponent',
      position: { x: 850, y: 800 },
      data: {
        componentType: 'postgres',
        label: 'Metadata DB',
        config: {},
      },
    },

    // ML Model Layer
    {
      id: 'ml-collaborative',
      type: 'archComponent',
      position: { x: 50, y: 950 },
      data: {
        componentType: 'serverless',
        label: 'Collaborative Filtering',
        config: {},
      },
    },
    {
      id: 'ml-content-based',
      type: 'archComponent',
      position: { x: 250, y: 950 },
      data: {
        componentType: 'serverless',
        label: 'Content-Based Model',
        config: {},
      },
    },
    {
      id: 'ml-deep-learning',
      type: 'archComponent',
      position: { x: 450, y: 950 },
      data: {
        componentType: 'serverless',
        label: 'Deep Neural Networks',
        config: {},
      },
    },
    {
      id: 'ml-foundation',
      type: 'archComponent',
      position: { x: 650, y: 950 },
      data: {
        componentType: 'serverless',
        label: 'Multi-Task Foundation Model',
        config: {
          description: '2025-2026: Unified model',
        },
      },
    },

    // Caching Layer
    {
      id: 'redis-cache',
      type: 'archComponent',
      position: { x: 850, y: 500 },
      data: {
        componentType: 'redis',
        label: 'Redis - Edge Cache',
        config: {
          description: 'Pre-computed recommendations',
        },
      },
    },

    // ML Data Lake
    {
      id: 'lancedb-media',
      type: 'archComponent',
      position: { x: 850, y: 950 },
      data: {
        componentType: 'object_storage',
        label: 'LanceDB - Media Data Lake',
        config: {
          description: 'ML-first multimodal embeddings',
        },
      },
    },

    // Analytics & Monitoring
    {
      id: 'spark-analytics',
      type: 'archComponent',
      position: { x: 50, y: 1100 },
      data: {
        componentType: 'worker',
        label: 'Apache Spark - Batch ML',
        config: {},
      },
    },
  ],

  edges: [
    // Clients to API Gateway
    { id: 'e1', source: 'client-web', target: 'api-gateway', type: 'archEdge', data: {} },
    { id: 'e2', source: 'client-mobile', target: 'api-gateway', type: 'archEdge', data: {} },
    { id: 'e3', source: 'client-tv', target: 'api-gateway', type: 'archEdge', data: {} },

    // API Gateway to Microservices
    {
      id: 'e4',
      source: 'api-gateway',
      target: 'user-profile-svc',
      type: 'archEdge',
      data: { label: 'User data' },
    },
    {
      id: 'e5',
      source: 'api-gateway',
      target: 'content-catalog-svc',
      type: 'archEdge',
      data: { label: 'Content metadata' },
    },
    {
      id: 'e6',
      source: 'api-gateway',
      target: 'recommendation-svc',
      type: 'archEdge',
      data: { label: 'Get recommendations' },
    },

    // Microservices to Kafka
    {
      id: 'e7',
      source: 'user-profile-svc',
      target: 'kafka-events',
      type: 'archEdge',
      data: { label: 'User events' },
    },
    {
      id: 'e8',
      source: 'recommendation-svc',
      target: 'kafka-events',
      type: 'archEdge',
      data: { label: 'View/click events' },
    },

    // Recommendation Service Flow
    {
      id: 'e9',
      source: 'recommendation-svc',
      target: 'ranking-svc',
      type: 'archEdge',
      data: { label: 'Candidate list' },
    },
    {
      id: 'e10',
      source: 'ranking-svc',
      target: 'personalization-svc',
      type: 'archEdge',
      data: { label: 'Ranked results' },
    },
    {
      id: 'e11',
      source: 'personalization-svc',
      target: 'redis-cache',
      type: 'archEdge',
      data: { label: 'Cache results' },
    },

    // Kafka to Stream Processing
    {
      id: 'e12',
      source: 'kafka-events',
      target: 'flink-processor',
      type: 'archEdge',
      data: { label: 'Event stream' },
    },
    {
      id: 'e13',
      source: 'kafka-events',
      target: 'rdg-ingestion',
      type: 'archEdge',
      data: { label: 'Graph updates' },
    },

    // Stream Processing to Storage
    {
      id: 'e14',
      source: 'flink-processor',
      target: 's3-feature-store',
      type: 'archEdge',
      data: { label: 'Features' },
    },
    {
      id: 'e15',
      source: 'rdg-ingestion',
      target: 'cassandra-kvdal',
      type: 'archEdge',
      data: { label: '5M+ writes/sec' },
    },

    // ML Models to Services
    {
      id: 'e16',
      source: 'ml-collaborative',
      target: 'recommendation-svc',
      type: 'archEdge',
      data: { label: 'User similarity' },
    },
    {
      id: 'e17',
      source: 'ml-content-based',
      target: 'recommendation-svc',
      type: 'archEdge',
      data: { label: 'Content similarity' },
    },
    {
      id: 'e18',
      source: 'ml-deep-learning',
      target: 'ranking-svc',
      type: 'archEdge',
      data: { label: 'Ranking scores' },
    },
    {
      id: 'e19',
      source: 'ml-foundation',
      target: 'personalization-svc',
      type: 'archEdge',
      data: { label: 'Multi-task predictions' },
    },

    // Data to ML Models
    {
      id: 'e20',
      source: 's3-feature-store',
      target: 'ml-collaborative',
      type: 'archEdge',
      data: { label: 'User features' },
    },
    {
      id: 'e21',
      source: 's3-feature-store',
      target: 'ml-content-based',
      type: 'archEdge',
      data: { label: 'Content features' },
    },
    {
      id: 'e22',
      source: 's3-feature-store',
      target: 'ml-deep-learning',
      type: 'archEdge',
      data: { label: 'Training data' },
    },
    {
      id: 'e23',
      source: 'cassandra-kvdal',
      target: 'ml-foundation',
      type: 'archEdge',
      data: { label: 'Graph embeddings' },
    },

    // Cassandra to Services
    {
      id: 'e24',
      source: 'cassandra-kvdal',
      target: 'personalization-svc',
      type: 'archEdge',
      data: { label: 'Real-time graph' },
    },

    // Metadata DB connections
    {
      id: 'e25',
      source: 'content-catalog-svc',
      target: 'postgres-metadata',
      type: 'archEdge',
      data: {},
    },
    {
      id: 'e26',
      source: 'user-profile-svc',
      target: 'postgres-metadata',
      type: 'archEdge',
      data: {},
    },

    // Media Data Lake
    {
      id: 'e27',
      source: 'lancedb-media',
      target: 'ml-foundation',
      type: 'archEdge',
      data: { label: 'Multimodal embeddings' },
    },

    // Spark Analytics
    {
      id: 'e28',
      source: 's3-feature-store',
      target: 'spark-analytics',
      type: 'archEdge',
      data: { label: 'Historical data' },
    },
    {
      id: 'e29',
      source: 'spark-analytics',
      target: 'ml-collaborative',
      type: 'archEdge',
      data: { label: 'Retrain models' },
    },
    {
      id: 'e30',
      source: 'spark-analytics',
      target: 'ml-content-based',
      type: 'archEdge',
      data: { label: 'Retrain models' },
    },
  ],
};
