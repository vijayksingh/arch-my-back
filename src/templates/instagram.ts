import type { DesignTemplate } from '@/types';

/**
 * Instagram System Design - Classic Interview Question
 *
 * Demonstrates a complete photo-sharing platform architecture covering:
 * - Image upload and storage (CDN + S3)
 * - Feed generation (fan-out on write vs read)
 * - Social graph (following/followers)
 * - Scalability patterns (sharding, caching, replication)
 * - Read-heavy optimization strategies
 */
export const instagramTemplate: DesignTemplate = {
  slug: 'instagram',
  title: 'Instagram System Design',
  description: 'Photo-sharing platform with feed generation, image storage, social graph, and scalability patterns for handling billions of photos and users',
  nodes: [
    // Client Layer
    {
      id: 'mobile-client',
      type: 'archComponent',
      position: { x: 50, y: 50 },
      data: {
        componentType: 'client_mobile',
        label: 'Mobile App',
        config: {},
      },
    },
    {
      id: 'web-client',
      type: 'archComponent',
      position: { x: 250, y: 50 },
      data: {
        componentType: 'client_browser',
        label: 'Web Client',
        config: {},
      },
    },

    // CDN Layer
    {
      id: 'cdn',
      type: 'archComponent',
      position: { x: 150, y: 150 },
      data: {
        componentType: 'cdn',
        label: 'CloudFront CDN',
        config: {},
      },
    },

    // Load Balancer
    {
      id: 'lb',
      type: 'archComponent',
      position: { x: 150, y: 250 },
      data: {
        componentType: 'load_balancer',
        label: 'Load Balancer',
        config: {},
      },
    },

    // API Gateway
    {
      id: 'api-gateway',
      type: 'archComponent',
      position: { x: 150, y: 350 },
      data: {
        componentType: 'api_gateway',
        label: 'API Gateway',
        config: {},
      },
    },

    // Service Layer
    {
      id: 'upload-service',
      type: 'archComponent',
      position: { x: 50, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'Upload Service',
        config: {},
      },
    },
    {
      id: 'feed-service',
      type: 'archComponent',
      position: { x: 250, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'Feed Service',
        config: {},
      },
    },
    {
      id: 'user-service',
      type: 'archComponent',
      position: { x: 450, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'User Service',
        config: {},
      },
    },
    {
      id: 'graph-service',
      type: 'archComponent',
      position: { x: 650, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'Graph Service',
        config: {},
      },
    },
    {
      id: 'search-service',
      type: 'archComponent',
      position: { x: 850, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'Search Service',
        config: {},
      },
    },

    // Storage Layer - Images
    {
      id: 's3-images',
      type: 'archComponent',
      position: { x: 50, y: 650 },
      data: {
        componentType: 'object_storage',
        label: 'S3 Images',
        config: {},
      },
    },

    // Storage Layer - Databases
    {
      id: 'user-db',
      type: 'archComponent',
      position: { x: 450, y: 650 },
      data: {
        componentType: 'postgres',
        label: 'User DB (PostgreSQL)',
        config: {},
      },
    },
    {
      id: 'user-db-replica',
      type: 'archComponent',
      position: { x: 450, y: 750 },
      data: {
        componentType: 'postgres',
        label: 'User DB Replica',
        config: {},
      },
    },
    {
      id: 'graph-db',
      type: 'archComponent',
      position: { x: 650, y: 650 },
      data: {
        componentType: 'postgres',
        label: 'Graph DB',
        config: {},
      },
    },

    // Feed Storage - Cassandra for timeline
    {
      id: 'feed-db-1',
      type: 'archComponent',
      position: { x: 250, y: 650 },
      data: {
        componentType: 'cassandra',
        label: 'Feed DB Shard 1',
        config: {},
      },
    },
    {
      id: 'feed-db-2',
      type: 'archComponent',
      position: { x: 250, y: 750 },
      data: {
        componentType: 'cassandra',
        label: 'Feed DB Shard 2',
        config: {},
      },
    },

    // Cache Layer
    {
      id: 'redis-cache',
      type: 'archComponent',
      position: { x: 150, y: 800 },
      data: {
        componentType: 'redis',
        label: 'Redis Cache',
        config: {},
      },
    },

    // Search
    {
      id: 'elasticsearch',
      type: 'archComponent',
      position: { x: 850, y: 650 },
      data: {
        componentType: 'elasticsearch',
        label: 'Elasticsearch',
        config: {},
      },
    },

    // Message Queue
    {
      id: 'kafka',
      type: 'archComponent',
      position: { x: 1050, y: 500 },
      data: {
        componentType: 'kafka',
        label: 'Kafka Events',
        config: {},
      },
    },

    // Background Workers
    {
      id: 'feed-worker',
      type: 'archComponent',
      position: { x: 1050, y: 650 },
      data: {
        componentType: 'app_server',
        label: 'Feed Worker',
        config: {},
      },
    },
    {
      id: 'notification-worker',
      type: 'archComponent',
      position: { x: 1050, y: 750 },
      data: {
        componentType: 'app_server',
        label: 'Notification Worker',
        config: {},
      },
    },

    // Section Badges for explanation
    {
      id: 'section-client',
      type: 'sectionBadge',
      position: { x: 0, y: 0 },
      data: {
        blockId: 'text-client-layer',
        blockType: 'text',
        label: 'Client Layer',
      },
    },
    {
      id: 'section-services',
      type: 'sectionBadge',
      position: { x: 0, y: 450 },
      data: {
        blockId: 'text-services',
        blockType: 'text',
        label: 'Service Layer (Microservices)',
      },
    },
    {
      id: 'section-storage',
      type: 'sectionBadge',
      position: { x: 0, y: 600 },
      data: {
        blockId: 'text-storage',
        blockType: 'text',
        label: 'Storage Layer (Sharded & Replicated)',
      },
    },
  ],
  edges: [
    // Client to CDN
    {
      id: 'e1',
      source: 'mobile-client',
      target: 'cdn',
      type: 'archEdge',
      data: { label: 'HTTPS' },
    },
    {
      id: 'e2',
      source: 'web-client',
      target: 'cdn',
      type: 'archEdge',
      data: { label: 'HTTPS' },
    },

    // CDN to Load Balancer
    {
      id: 'e3',
      source: 'cdn',
      target: 'lb',
      type: 'archEdge',
      data: {},
    },

    // CDN to S3 (cache miss)
    {
      id: 'e4',
      source: 'cdn',
      target: 's3-images',
      type: 'archEdge',
      data: { label: 'Cache Miss' },
    },

    // Load Balancer to API Gateway
    {
      id: 'e5',
      source: 'lb',
      target: 'api-gateway',
      type: 'archEdge',
      data: {},
    },

    // API Gateway to Services
    {
      id: 'e6',
      source: 'api-gateway',
      target: 'upload-service',
      type: 'archEdge',
      data: {},
    },
    {
      id: 'e7',
      source: 'api-gateway',
      target: 'feed-service',
      type: 'archEdge',
      data: {},
    },
    {
      id: 'e8',
      source: 'api-gateway',
      target: 'user-service',
      type: 'archEdge',
      data: {},
    },
    {
      id: 'e9',
      source: 'api-gateway',
      target: 'graph-service',
      type: 'archEdge',
      data: {},
    },
    {
      id: 'e10',
      source: 'api-gateway',
      target: 'search-service',
      type: 'archEdge',
      data: {},
    },

    // Upload Service to S3
    {
      id: 'e11',
      source: 'upload-service',
      target: 's3-images',
      type: 'archEdge',
      data: { label: 'Store Image' },
    },

    // Feed Service to Feed DB Shards
    {
      id: 'e12',
      source: 'feed-service',
      target: 'feed-db-1',
      type: 'archEdge',
      data: {},
    },
    {
      id: 'e13',
      source: 'feed-service',
      target: 'feed-db-2',
      type: 'archEdge',
      data: {},
    },

    // Feed Service to Cache
    {
      id: 'e14',
      source: 'feed-service',
      target: 'redis-cache',
      type: 'archEdge',
      data: { label: 'Cache Feeds' },
    },

    // User Service to User DB
    {
      id: 'e15',
      source: 'user-service',
      target: 'user-db',
      type: 'archEdge',
      data: { label: 'Write' },
    },
    {
      id: 'e16',
      source: 'user-service',
      target: 'user-db-replica',
      type: 'archEdge',
      data: { label: 'Read' },
    },

    // Graph Service to Graph DB
    {
      id: 'e17',
      source: 'graph-service',
      target: 'graph-db',
      type: 'archEdge',
      data: { label: 'Follow/Unfollow' },
    },

    // Search Service to Elasticsearch
    {
      id: 'e18',
      source: 'search-service',
      target: 'elasticsearch',
      type: 'archEdge',
      data: {},
    },

    // Services to Kafka for async processing
    {
      id: 'e19',
      source: 'upload-service',
      target: 'kafka',
      type: 'archEdge',
      data: { label: 'New Photo Event' },
    },
    {
      id: 'e20',
      source: 'graph-service',
      target: 'kafka',
      type: 'archEdge',
      data: { label: 'Follow Event' },
    },

    // Workers consuming from Kafka
    {
      id: 'e21',
      source: 'kafka',
      target: 'feed-worker',
      type: 'archEdge',
      data: { label: 'Fan-out Feed' },
    },
    {
      id: 'e22',
      source: 'kafka',
      target: 'notification-worker',
      type: 'archEdge',
      data: { label: 'Push Notifications' },
    },

    // Feed Worker writes to Feed DB
    {
      id: 'e23',
      source: 'feed-worker',
      target: 'feed-db-1',
      type: 'archEdge',
      data: { label: 'Write Timeline' },
    },
    {
      id: 'e24',
      source: 'feed-worker',
      target: 'feed-db-2',
      type: 'archEdge',
      data: { label: 'Write Timeline' },
    },
  ],
};
