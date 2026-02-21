import { mutation } from './_generated/server';

/**
 * Seed Example Designs
 * Creates 5 real-world example templates as viewable designs in the database.
 * This mutation is idempotent - it deletes existing examples before creating new ones.
 */
export const seedExampleDesigns = mutation({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Must be authenticated to seed examples');
    }

    // Check if examples already exist
    const existing = await ctx.db
      .query('newDesigns')
      .filter((q) => q.eq(q.field('isExample'), true))
      .collect();

    // Delete old examples for re-seeding
    for (const design of existing) {
      // Delete canvas data
      const canvas = await ctx.db
        .query('designCanvases')
        .withIndex('by_designId', (q) => q.eq('designId', design._id))
        .first();
      if (canvas) {
        await ctx.db.delete(canvas._id);
      }

      // Delete blocks if any
      const blocks = await ctx.db
        .query('designBlocks')
        .withIndex('by_designId', (q) => q.eq('designId', design._id))
        .first();
      if (blocks) {
        await ctx.db.delete(blocks._id);
      }

      // Delete design
      await ctx.db.delete(design._id);
    }

    const now = Date.now();
    const createdIds = [];

    // Example 1: Netflix Recommendation System
    const netflixId = await ctx.db.insert('newDesigns', {
      ownerId: identity.subject,
      title: 'Netflix Recommendation System',
      description: "Real-world architecture of Netflix's recommendation system with microservices, real-time data processing, and ML models",
      isPublic: false,
      isExample: true,
      templateSlug: 'netflix-recommendation',
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('designCanvases', {
      designId: netflixId,
      nodes: [
        // Client Layer
        { id: 'client-web', type: 'archComponent', position: { x: 50, y: 50 }, data: { componentType: 'external_api', label: 'Web Client', config: { base_url: 'https://www.netflix.com', timeout: 5000 } } },
        { id: 'client-mobile', type: 'archComponent', position: { x: 250, y: 50 }, data: { componentType: 'external_api', label: 'Mobile App', config: { base_url: 'https://api.netflix.com', timeout: 5000 } } },
        { id: 'client-tv', type: 'archComponent', position: { x: 450, y: 50 }, data: { componentType: 'external_api', label: 'Smart TV', config: { base_url: 'https://api.netflix.com', timeout: 5000 } } },
        // API Gateway
        { id: 'api-gateway', type: 'archComponent', position: { x: 250, y: 200 }, data: { componentType: 'api_gateway', label: 'API Gateway', config: {} } },
        // Microservices Layer
        { id: 'user-profile-svc', type: 'archComponent', position: { x: 50, y: 350 }, data: { componentType: 'app_server', label: 'User Profile Service', config: {} } },
        { id: 'content-catalog-svc', type: 'archComponent', position: { x: 250, y: 350 }, data: { componentType: 'app_server', label: 'Content Catalog Service', config: {} } },
        { id: 'recommendation-svc', type: 'archComponent', position: { x: 450, y: 350 }, data: { componentType: 'app_server', label: 'Recommendation Service', config: {} } },
        { id: 'ranking-svc', type: 'archComponent', position: { x: 650, y: 350 }, data: { componentType: 'app_server', label: 'Ranking Service', config: {} } },
        { id: 'personalization-svc', type: 'archComponent', position: { x: 850, y: 350 }, data: { componentType: 'app_server', label: 'Personalization Service', config: {} } },
        // Data Streaming Layer
        { id: 'kafka-events', type: 'archComponent', position: { x: 450, y: 500 }, data: { componentType: 'kafka', label: 'Kafka - Event Stream', config: { description: 'Keystone: 700B+ events/day' } } },
        // Stream Processing
        { id: 'flink-processor', type: 'archComponent', position: { x: 250, y: 650 }, data: { componentType: 'worker', label: 'Apache Flink - Stream Processing', config: {} } },
        { id: 'rdg-ingestion', type: 'archComponent', position: { x: 650, y: 650 }, data: { componentType: 'worker', label: 'RDG Ingestion Layer', config: {} } },
        // Storage Layer
        { id: 'cassandra-kvdal', type: 'archComponent', position: { x: 450, y: 800 }, data: { componentType: 'object_storage', label: 'Cassandra - KVDAL', config: { versioning: true, storage_class: 'standard' } } },
        { id: 's3-feature-store', type: 'archComponent', position: { x: 50, y: 800 }, data: { componentType: 'object_storage', label: 'S3 - Feature Store', config: {} } },
        { id: 'postgres-metadata', type: 'archComponent', position: { x: 850, y: 800 }, data: { componentType: 'postgres', label: 'Metadata DB', config: {} } },
        // ML Model Layer
        { id: 'ml-collaborative', type: 'archComponent', position: { x: 50, y: 950 }, data: { componentType: 'serverless', label: 'Collaborative Filtering', config: {} } },
        { id: 'ml-content-based', type: 'archComponent', position: { x: 250, y: 950 }, data: { componentType: 'serverless', label: 'Content-Based Model', config: {} } },
        { id: 'ml-deep-learning', type: 'archComponent', position: { x: 450, y: 950 }, data: { componentType: 'serverless', label: 'Deep Neural Networks', config: {} } },
        { id: 'ml-foundation', type: 'archComponent', position: { x: 650, y: 950 }, data: { componentType: 'serverless', label: 'Multi-Task Foundation Model', config: { description: '2025-2026: Unified model' } } },
        // Caching Layer
        { id: 'redis-cache', type: 'archComponent', position: { x: 850, y: 500 }, data: { componentType: 'redis', label: 'Redis - Edge Cache', config: { description: 'Pre-computed recommendations' } } },
        // ML Data Lake
        { id: 'lancedb-media', type: 'archComponent', position: { x: 850, y: 950 }, data: { componentType: 'object_storage', label: 'LanceDB - Media Data Lake', config: { description: 'ML-first multimodal embeddings' } } },
        // Analytics
        { id: 'spark-analytics', type: 'archComponent', position: { x: 50, y: 1100 }, data: { componentType: 'worker', label: 'Apache Spark - Batch ML', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 'client-web', target: 'api-gateway', type: 'archEdge', data: {} },
        { id: 'e2', source: 'client-mobile', target: 'api-gateway', type: 'archEdge', data: {} },
        { id: 'e3', source: 'client-tv', target: 'api-gateway', type: 'archEdge', data: {} },
        { id: 'e4', source: 'api-gateway', target: 'user-profile-svc', type: 'archEdge', data: { label: 'User data' } },
        { id: 'e5', source: 'api-gateway', target: 'content-catalog-svc', type: 'archEdge', data: { label: 'Content metadata' } },
        { id: 'e6', source: 'api-gateway', target: 'recommendation-svc', type: 'archEdge', data: { label: 'Get recommendations' } },
        { id: 'e7', source: 'user-profile-svc', target: 'kafka-events', type: 'archEdge', data: { label: 'User events' } },
        { id: 'e8', source: 'recommendation-svc', target: 'kafka-events', type: 'archEdge', data: { label: 'View/click events' } },
        { id: 'e9', source: 'recommendation-svc', target: 'ranking-svc', type: 'archEdge', data: { label: 'Candidate list' } },
        { id: 'e10', source: 'ranking-svc', target: 'personalization-svc', type: 'archEdge', data: { label: 'Ranked results' } },
        { id: 'e11', source: 'personalization-svc', target: 'redis-cache', type: 'archEdge', data: { label: 'Cache results' } },
        { id: 'e12', source: 'kafka-events', target: 'flink-processor', type: 'archEdge', data: { label: 'Event stream' } },
        { id: 'e13', source: 'kafka-events', target: 'rdg-ingestion', type: 'archEdge', data: { label: 'Graph updates' } },
        { id: 'e14', source: 'flink-processor', target: 's3-feature-store', type: 'archEdge', data: { label: 'Features' } },
        { id: 'e15', source: 'rdg-ingestion', target: 'cassandra-kvdal', type: 'archEdge', data: { label: '5M+ writes/sec' } },
        { id: 'e16', source: 'ml-collaborative', target: 'recommendation-svc', type: 'archEdge', data: { label: 'User similarity' } },
        { id: 'e17', source: 'ml-content-based', target: 'recommendation-svc', type: 'archEdge', data: { label: 'Content similarity' } },
        { id: 'e18', source: 'ml-deep-learning', target: 'ranking-svc', type: 'archEdge', data: { label: 'Ranking scores' } },
        { id: 'e19', source: 'ml-foundation', target: 'personalization-svc', type: 'archEdge', data: { label: 'Multi-task predictions' } },
        { id: 'e20', source: 's3-feature-store', target: 'ml-collaborative', type: 'archEdge', data: { label: 'User features' } },
        { id: 'e21', source: 's3-feature-store', target: 'ml-content-based', type: 'archEdge', data: { label: 'Content features' } },
        { id: 'e22', source: 's3-feature-store', target: 'ml-deep-learning', type: 'archEdge', data: { label: 'Training data' } },
        { id: 'e23', source: 'cassandra-kvdal', target: 'ml-foundation', type: 'archEdge', data: { label: 'Graph embeddings' } },
        { id: 'e24', source: 'cassandra-kvdal', target: 'personalization-svc', type: 'archEdge', data: { label: 'Real-time graph' } },
        { id: 'e25', source: 'content-catalog-svc', target: 'postgres-metadata', type: 'archEdge', data: {} },
        { id: 'e26', source: 'user-profile-svc', target: 'postgres-metadata', type: 'archEdge', data: {} },
        { id: 'e27', source: 'lancedb-media', target: 'ml-foundation', type: 'archEdge', data: { label: 'Multimodal embeddings' } },
        { id: 'e28', source: 's3-feature-store', target: 'spark-analytics', type: 'archEdge', data: { label: 'Historical data' } },
        { id: 'e29', source: 'spark-analytics', target: 'ml-collaborative', type: 'archEdge', data: { label: 'Retrain models' } },
        { id: 'e30', source: 'spark-analytics', target: 'ml-content-based', type: 'archEdge', data: { label: 'Retrain models' } },
      ],
      sections: [],
      version: 1,
      updatedAt: now,
    });

    createdIds.push(netflixId);

    // Example 2: Stripe Payment Processing
    const stripeId = await ctx.db.insert('newDesigns', {
      ownerId: identity.subject,
      title: 'Stripe Payment Processing',
      description: 'Real-world payment architecture with state machine, fraud detection, and ledger system. Demonstrates authorization → capture → settlement flow with idempotency patterns.',
      isPublic: false,
      isExample: true,
      templateSlug: 'stripe-payments',
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('designCanvases', {
      designId: stripeId,
      nodes: [
        // Entry point
        { id: 'client-web', type: 'archComponent', position: { x: 50, y: 50 }, data: { componentType: 'app_server', label: 'Web Client', config: { description: 'E-commerce website with Stripe.js integration' } } },
        { id: 'client-mobile', type: 'archComponent', position: { x: 50, y: 200 }, data: { componentType: 'app_server', label: 'Mobile App', config: { description: 'iOS/Android with Stripe mobile SDK' } } },
        // Multi-region API Gateway
        { id: 'api-gateway-us', type: 'archComponent', position: { x: 300, y: 50 }, data: { componentType: 'api_gateway', label: 'API Gateway (US)', config: { description: 'Regional gateway with isolated failure domains' } } },
        { id: 'api-gateway-eu', type: 'archComponent', position: { x: 300, y: 150 }, data: { componentType: 'api_gateway', label: 'API Gateway (EU)', config: { description: 'European region for GDPR compliance' } } },
        { id: 'api-gateway-asia', type: 'archComponent', position: { x: 300, y: 250 }, data: { componentType: 'api_gateway', label: 'API Gateway (Asia)', config: { description: 'Asia-Pacific region for low latency' } } },
        // Core services
        { id: 'payment-intent-service', type: 'archComponent', position: { x: 550, y: 150 }, data: { componentType: 'app_server', label: 'PaymentIntent Service', config: { description: 'State machine: requires_payment_method → requires_confirmation → processing → requires_capture → succeeded' } } },
        { id: 'radar-ml', type: 'archComponent', position: { x: 800, y: 50 }, data: { componentType: 'app_server', label: 'Stripe Radar', config: { description: 'ML fraud detection trained on billions of transactions. 92% card recognition rate' } } },
        { id: 'radar-db', type: 'archComponent', position: { x: 800, y: 200 }, data: { componentType: 'postgres', label: 'Fraud Signals DB', config: { description: 'Device fingerprints, IP addresses, card metadata' } } },
        { id: 'idempotency-cache', type: 'archComponent', position: { x: 550, y: 0 }, data: { componentType: 'redis', label: 'Idempotency Keys', config: { description: '24-hour cache of request IDs and responses. Prevents duplicate charges' } } },
        { id: 'authorization-service', type: 'archComponent', position: { x: 550, y: 300 }, data: { componentType: 'app_server', label: 'Authorization Service', config: { description: 'Places hold on payment method. 7-day validity window' } } },
        { id: 'capture-service', type: 'archComponent', position: { x: 800, y: 350 }, data: { componentType: 'app_server', label: 'Capture Service', config: { description: 'Initiates fund movement from customer to merchant' } } },
        { id: 'ledger-service', type: 'archComponent', position: { x: 1050, y: 150 }, data: { componentType: 'app_server', label: 'Ledger Service', config: { description: 'Double-entry bookkeeping. Processes 5B events/day with 99.99% accuracy' } } },
        { id: 'ledger-db', type: 'archComponent', position: { x: 1050, y: 300 }, data: { componentType: 'postgres', label: 'Ledger DB', config: { description: 'Immutable audit log. Every transaction balances to zero' } } },
        { id: 'settlement-service', type: 'archComponent', position: { x: 1050, y: 0 }, data: { componentType: 'app_server', label: 'Settlement Service', config: { description: 'Transfers funds to merchant accounts. 1-3 business days' } } },
        { id: 'kafka-events', type: 'archComponent', position: { x: 800, y: 500 }, data: { componentType: 'kafka', label: 'Event Stream', config: { description: 'Payment events, webhooks, async reconciliation' } } },
        // External integrations
        { id: 'card-networks', type: 'archComponent', position: { x: 1300, y: 150 }, data: { componentType: 'external_api', label: 'Card Networks', config: { description: 'Visa, Mastercard, Amex. Authorization requests' } } },
        { id: 'issuing-banks', type: 'archComponent', position: { x: 1300, y: 300 }, data: { componentType: 'external_api', label: 'Issuing Banks', config: { description: 'Customer banks. Approve/decline authorization' } } },
        { id: 'acquiring-banks', type: 'archComponent', position: { x: 1300, y: 0 }, data: { componentType: 'external_api', label: 'Acquiring Banks', config: { description: 'Merchant banks. Receive settled funds' } } },
        { id: 'monitoring', type: 'archComponent', position: { x: 550, y: 500 }, data: { componentType: 'app_server', label: 'Monitoring', config: { description: 'Real-time payment tracking, alerts, SLO monitoring' } } },
      ],
      edges: [
        { id: 'e1', source: 'client-web', target: 'api-gateway-us', type: 'archEdge', data: { protocol: 'HTTPS', label: 'POST /v1/payment_intents' } },
        { id: 'e2', source: 'client-mobile', target: 'api-gateway-us', type: 'archEdge', data: { protocol: 'HTTPS' } },
        { id: 'e3', source: 'client-web', target: 'api-gateway-eu', type: 'archEdge', data: { protocol: 'HTTPS' } },
        { id: 'e4', source: 'client-mobile', target: 'api-gateway-asia', type: 'archEdge', data: { protocol: 'HTTPS' } },
        { id: 'e5', source: 'api-gateway-us', target: 'payment-intent-service', type: 'archEdge', data: { label: 'Route request' } },
        { id: 'e6', source: 'api-gateway-eu', target: 'payment-intent-service', type: 'archEdge', data: {} },
        { id: 'e7', source: 'api-gateway-asia', target: 'payment-intent-service', type: 'archEdge', data: {} },
        { id: 'e8', source: 'payment-intent-service', target: 'idempotency-cache', type: 'archEdge', data: { label: 'Check idempotency key' } },
        { id: 'e9', source: 'payment-intent-service', target: 'radar-ml', type: 'archEdge', data: { label: 'Risk scoring' } },
        { id: 'e10', source: 'radar-ml', target: 'radar-db', type: 'archEdge', data: { label: 'Query fraud signals' } },
        { id: 'e11', source: 'payment-intent-service', target: 'authorization-service', type: 'archEdge', data: { label: 'State: requires_confirmation' } },
        { id: 'e12', source: 'authorization-service', target: 'card-networks', type: 'archEdge', data: { label: 'Authorization request' } },
        { id: 'e13', source: 'card-networks', target: 'issuing-banks', type: 'archEdge', data: { label: 'Approve/decline' } },
        { id: 'e14', source: 'payment-intent-service', target: 'capture-service', type: 'archEdge', data: { label: 'State: requires_capture' } },
        { id: 'e15', source: 'capture-service', target: 'card-networks', type: 'archEdge', data: { label: 'Capture request' } },
        { id: 'e16', source: 'authorization-service', target: 'ledger-service', type: 'archEdge', data: { label: 'Record authorization' } },
        { id: 'e17', source: 'capture-service', target: 'ledger-service', type: 'archEdge', data: { label: 'Record capture' } },
        { id: 'e18', source: 'ledger-service', target: 'ledger-db', type: 'archEdge', data: { label: 'Append-only log' } },
        { id: 'e19', source: 'ledger-service', target: 'settlement-service', type: 'archEdge', data: { label: 'Trigger settlement' } },
        { id: 'e20', source: 'settlement-service', target: 'acquiring-banks', type: 'archEdge', data: { label: 'Transfer funds' } },
        { id: 'e21', source: 'payment-intent-service', target: 'kafka-events', type: 'archEdge', data: { label: 'Publish events' } },
        { id: 'e22', source: 'ledger-service', target: 'kafka-events', type: 'archEdge', data: { label: 'Reconciliation events' } },
        { id: 'e23', source: 'kafka-events', target: 'monitoring', type: 'archEdge', data: { label: 'Metrics & alerts' } },
      ],
      sections: [],
      version: 1,
      updatedAt: now,
    });

    createdIds.push(stripeId);

    // Example 3: Instagram System Design
    const instagramId = await ctx.db.insert('newDesigns', {
      ownerId: identity.subject,
      title: 'Instagram System Design',
      description: 'Photo-sharing platform with feed generation, image storage, social graph, and scalability patterns for handling billions of photos and users',
      isPublic: false,
      isExample: true,
      templateSlug: 'instagram',
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('designCanvases', {
      designId: instagramId,
      nodes: [
        // Client Layer
        { id: 'mobile-client', type: 'archComponent', position: { x: 50, y: 50 }, data: { componentType: 'client', label: 'Mobile App', config: {} } },
        { id: 'web-client', type: 'archComponent', position: { x: 250, y: 50 }, data: { componentType: 'client', label: 'Web Client', config: {} } },
        // CDN & LB
        { id: 'cdn', type: 'archComponent', position: { x: 150, y: 150 }, data: { componentType: 'cdn', label: 'CloudFront CDN', config: {} } },
        { id: 'lb', type: 'archComponent', position: { x: 150, y: 250 }, data: { componentType: 'load_balancer', label: 'Load Balancer', config: {} } },
        { id: 'api-gateway', type: 'archComponent', position: { x: 150, y: 350 }, data: { componentType: 'api_gateway', label: 'API Gateway', config: {} } },
        // Services
        { id: 'upload-service', type: 'archComponent', position: { x: 50, y: 500 }, data: { componentType: 'app_server', label: 'Upload Service', config: {} } },
        { id: 'feed-service', type: 'archComponent', position: { x: 250, y: 500 }, data: { componentType: 'app_server', label: 'Feed Service', config: {} } },
        { id: 'user-service', type: 'archComponent', position: { x: 450, y: 500 }, data: { componentType: 'app_server', label: 'User Service', config: {} } },
        { id: 'graph-service', type: 'archComponent', position: { x: 650, y: 500 }, data: { componentType: 'app_server', label: 'Graph Service', config: {} } },
        { id: 'search-service', type: 'archComponent', position: { x: 850, y: 500 }, data: { componentType: 'app_server', label: 'Search Service', config: {} } },
        // Storage
        { id: 's3-images', type: 'archComponent', position: { x: 50, y: 650 }, data: { componentType: 'object_storage', label: 'S3 Images', config: {} } },
        { id: 'user-db', type: 'archComponent', position: { x: 450, y: 650 }, data: { componentType: 'postgres', label: 'User DB (PostgreSQL)', config: {} } },
        { id: 'user-db-replica', type: 'archComponent', position: { x: 450, y: 750 }, data: { componentType: 'postgres', label: 'User DB Replica', config: {} } },
        { id: 'graph-db', type: 'archComponent', position: { x: 650, y: 650 }, data: { componentType: 'postgres', label: 'Graph DB', config: {} } },
        { id: 'feed-db-1', type: 'archComponent', position: { x: 250, y: 650 }, data: { componentType: 'cassandra', label: 'Feed DB Shard 1', config: {} } },
        { id: 'feed-db-2', type: 'archComponent', position: { x: 250, y: 750 }, data: { componentType: 'cassandra', label: 'Feed DB Shard 2', config: {} } },
        { id: 'redis-cache', type: 'archComponent', position: { x: 150, y: 800 }, data: { componentType: 'redis', label: 'Redis Cache', config: {} } },
        { id: 'elasticsearch', type: 'archComponent', position: { x: 850, y: 650 }, data: { componentType: 'elasticsearch', label: 'Elasticsearch', config: {} } },
        // Workers
        { id: 'kafka', type: 'archComponent', position: { x: 1050, y: 500 }, data: { componentType: 'kafka', label: 'Kafka Events', config: {} } },
        { id: 'feed-worker', type: 'archComponent', position: { x: 1050, y: 650 }, data: { componentType: 'app_server', label: 'Feed Worker', config: {} } },
        { id: 'notification-worker', type: 'archComponent', position: { x: 1050, y: 750 }, data: { componentType: 'app_server', label: 'Notification Worker', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 'mobile-client', target: 'cdn', type: 'archEdge', data: { label: 'HTTPS' } },
        { id: 'e2', source: 'web-client', target: 'cdn', type: 'archEdge', data: { label: 'HTTPS' } },
        { id: 'e3', source: 'cdn', target: 'lb', type: 'archEdge', data: {} },
        { id: 'e4', source: 'cdn', target: 's3-images', type: 'archEdge', data: { label: 'Cache Miss' } },
        { id: 'e5', source: 'lb', target: 'api-gateway', type: 'archEdge', data: {} },
        { id: 'e6', source: 'api-gateway', target: 'upload-service', type: 'archEdge', data: {} },
        { id: 'e7', source: 'api-gateway', target: 'feed-service', type: 'archEdge', data: {} },
        { id: 'e8', source: 'api-gateway', target: 'user-service', type: 'archEdge', data: {} },
        { id: 'e9', source: 'api-gateway', target: 'graph-service', type: 'archEdge', data: {} },
        { id: 'e10', source: 'api-gateway', target: 'search-service', type: 'archEdge', data: {} },
        { id: 'e11', source: 'upload-service', target: 's3-images', type: 'archEdge', data: { label: 'Store Image' } },
        { id: 'e12', source: 'feed-service', target: 'feed-db-1', type: 'archEdge', data: {} },
        { id: 'e13', source: 'feed-service', target: 'feed-db-2', type: 'archEdge', data: {} },
        { id: 'e14', source: 'feed-service', target: 'redis-cache', type: 'archEdge', data: { label: 'Cache Feeds' } },
        { id: 'e15', source: 'user-service', target: 'user-db', type: 'archEdge', data: { label: 'Write' } },
        { id: 'e16', source: 'user-service', target: 'user-db-replica', type: 'archEdge', data: { label: 'Read' } },
        { id: 'e17', source: 'graph-service', target: 'graph-db', type: 'archEdge', data: { label: 'Follow/Unfollow' } },
        { id: 'e18', source: 'search-service', target: 'elasticsearch', type: 'archEdge', data: {} },
        { id: 'e19', source: 'upload-service', target: 'kafka', type: 'archEdge', data: { label: 'New Photo Event' } },
        { id: 'e20', source: 'graph-service', target: 'kafka', type: 'archEdge', data: { label: 'Follow Event' } },
        { id: 'e21', source: 'kafka', target: 'feed-worker', type: 'archEdge', data: { label: 'Fan-out Feed' } },
        { id: 'e22', source: 'kafka', target: 'notification-worker', type: 'archEdge', data: { label: 'Push Notifications' } },
        { id: 'e23', source: 'feed-worker', target: 'feed-db-1', type: 'archEdge', data: { label: 'Write Timeline' } },
        { id: 'e24', source: 'feed-worker', target: 'feed-db-2', type: 'archEdge', data: { label: 'Write Timeline' } },
      ],
      sections: [],
      version: 1,
      updatedAt: now,
    });

    createdIds.push(instagramId);

    // Example 4: Uber Real-Time Dispatch
    const uberId = await ctx.db.insert('newDesigns', {
      ownerId: identity.subject,
      title: 'Uber Real-Time Dispatch System',
      description: 'Real-world dispatch architecture featuring H3 geospatial indexing, bipartite graph matching, DeepETA routing engine, and surge pricing. Handles 1M+ requests/second with <3s matching latency.',
      isPublic: false,
      isExample: true,
      templateSlug: 'uber-dispatch',
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('designCanvases', {
      designId: uberId,
      nodes: [
        // Client Layer
        { id: 'rider-app', type: 'archComponent', position: { x: 50, y: 50 }, data: { componentType: 'app_server', label: 'Rider App', config: { runtime: 'mobile', replicas: 1 } } },
        { id: 'driver-app', type: 'archComponent', position: { x: 350, y: 50 }, data: { componentType: 'app_server', label: 'Driver App', config: { runtime: 'mobile', replicas: 1 } } },
        // API Gateway
        { id: 'api-gateway', type: 'archComponent', position: { x: 200, y: 200 }, data: { componentType: 'api_gateway', label: 'API Gateway', config: { rate_limit: 1000000, auth_method: 'jwt' } } },
        { id: 'websocket-lb', type: 'archComponent', position: { x: 200, y: 350 }, data: { componentType: 'load_balancer', label: 'WebSocket LB (Ringpop)', config: { type: 'L7', algorithm: 'ip-hash' } } },
        // Core Services
        { id: 'dispatch-service', type: 'archComponent', position: { x: 50, y: 500 }, data: { componentType: 'app_server', label: 'Dispatch Service (NodeJS)', config: { runtime: 'node:20', replicas: 50, cpu: '4vCPU', memory: '8GB', autoscaling: true } } },
        { id: 'matching-engine', type: 'archComponent', position: { x: 300, y: 500 }, data: { componentType: 'app_server', label: 'Matching Engine', config: { runtime: 'go:1.22', replicas: 30, cpu: '8vCPU', memory: '16GB' } } },
        { id: 'geospatial-service', type: 'archComponent', position: { x: 550, y: 500 }, data: { componentType: 'app_server', label: 'Geospatial Service (H3)', config: { runtime: 'go:1.22', replicas: 40, cpu: '4vCPU', memory: '16GB' } } },
        { id: 'eta-service', type: 'archComponent', position: { x: 800, y: 500 }, data: { componentType: 'app_server', label: 'ETA Service (Gurafu)', config: { runtime: 'rust:1.77', replicas: 20, cpu: '8vCPU', memory: '16GB' } } },
        { id: 'surge-pricing', type: 'archComponent', position: { x: 1050, y: 500 }, data: { componentType: 'app_server', label: 'Surge Pricing Service', config: { runtime: 'python:3.12', replicas: 10, cpu: '4vCPU', memory: '8GB' } } },
        // Data Layer
        { id: 'redis-locations', type: 'archComponent', position: { x: 550, y: 700 }, data: { componentType: 'redis', label: 'Redis (Driver Locations)', config: { memory: '256GB', persistence: 'aof', cluster: true } } },
        { id: 'cassandra-trips', type: 'archComponent', position: { x: 50, y: 700 }, data: { componentType: 'object_storage', label: 'Cassandra (Trip Data)', config: { versioning: 'false' } } },
        { id: 'postgres-users', type: 'archComponent', position: { x: 300, y: 700 }, data: { componentType: 'postgres', label: 'PostgreSQL (User/Driver DB)', config: { replicas: 3 } } },
        { id: 'graph-cache', type: 'archComponent', position: { x: 800, y: 700 }, data: { componentType: 'redis', label: 'Redis (Road Network Graph)', config: { memory: '128GB', persistence: 'none', cluster: true } } },
        // ML & Analytics
        { id: 'ml-model-service', type: 'archComponent', position: { x: 300, y: 850 }, data: { componentType: 'app_server', label: 'ML Model Service (DeepETA)', config: { runtime: 'python:3.12', replicas: 15, cpu: '8vCPU', memory: '32GB' } } },
        { id: 'demand-predictor', type: 'archComponent', position: { x: 1050, y: 700 }, data: { componentType: 'app_server', label: 'Demand Prediction', config: { runtime: 'python:3.12', replicas: 5, cpu: '4vCPU', memory: '16GB' } } },
        // Streaming
        { id: 'kafka-events', type: 'archComponent', position: { x: 550, y: 850 }, data: { componentType: 'kafka', label: 'Kafka (Location Stream)', config: { partitions: 100, replication: 3 } } },
        // External
        { id: 'maps-api', type: 'archComponent', position: { x: 1050, y: 350 }, data: { componentType: 'external_api', label: 'Maps/Traffic API', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 'rider-app', target: 'api-gateway', type: 'archEdge', data: { label: 'HTTPS/REST' } },
        { id: 'e2', source: 'driver-app', target: 'api-gateway', type: 'archEdge', data: { label: 'HTTPS/REST' } },
        { id: 'e3', source: 'api-gateway', target: 'websocket-lb', type: 'archEdge', data: { label: 'Route' } },
        { id: 'e4', source: 'websocket-lb', target: 'dispatch-service', type: 'archEdge', data: { label: 'WebSocket' } },
        { id: 'e5', source: 'dispatch-service', target: 'matching-engine', type: 'archEdge', data: { label: 'Match Request' } },
        { id: 'e6', source: 'dispatch-service', target: 'cassandra-trips', type: 'archEdge', data: { label: 'Write Trip' } },
        { id: 'e7', source: 'matching-engine', target: 'geospatial-service', type: 'archEdge', data: { label: 'Find Drivers' } },
        { id: 'e8', source: 'matching-engine', target: 'eta-service', type: 'archEdge', data: { label: 'Get ETAs' } },
        { id: 'e9', source: 'matching-engine', target: 'surge-pricing', type: 'archEdge', data: { label: 'Get Price' } },
        { id: 'e10', source: 'matching-engine', target: 'postgres-users', type: 'archEdge', data: { label: 'Get Ratings' } },
        { id: 'e11', source: 'geospatial-service', target: 'redis-locations', type: 'archEdge', data: { label: 'H3 Query' } },
        { id: 'e12', source: 'driver-app', target: 'kafka-events', type: 'archEdge', data: { label: 'GPS Stream' } },
        { id: 'e13', source: 'kafka-events', target: 'geospatial-service', type: 'archEdge', data: { label: 'Consume' } },
        { id: 'e14', source: 'eta-service', target: 'graph-cache', type: 'archEdge', data: { label: 'Road Graph' } },
        { id: 'e15', source: 'eta-service', target: 'ml-model-service', type: 'archEdge', data: { label: 'Post-Process' } },
        { id: 'e16', source: 'eta-service', target: 'maps-api', type: 'archEdge', data: { label: 'Traffic Data' } },
        { id: 'e17', source: 'surge-pricing', target: 'demand-predictor', type: 'archEdge', data: { label: 'Predictions' } },
        { id: 'e18', source: 'surge-pricing', target: 'redis-locations', type: 'archEdge', data: { label: 'Supply Count' } },
        { id: 'e19', source: 'ml-model-service', target: 'cassandra-trips', type: 'archEdge', data: { label: 'Training Data' } },
      ],
      sections: [],
      version: 1,
      updatedAt: now,
    });

    createdIds.push(uberId);

    // Example 5: Twitter/X Feed Ranking
    const twitterId = await ctx.db.insert('newDesigns', {
      ownerId: identity.subject,
      title: 'Twitter/X Feed Ranking Algorithm',
      description: "Real-world example: ML-powered recommendation system with candidate sourcing, neural network ranking, and personalization. Demonstrates Twitter's 5B req/day feed algorithm.",
      isPublic: false,
      isExample: true,
      templateSlug: 'twitter-feed-ranking',
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('designCanvases', {
      designId: twitterId,
      nodes: [
        { id: 'user-request', type: 'archComponent', position: { x: 50, y: 50 }, data: { componentType: 'external_api', label: 'User Device', config: {} } },
        { id: 'api-gateway', type: 'archComponent', position: { x: 50, y: 200 }, data: { componentType: 'api_gateway', label: 'API Gateway', config: {} } },
        { id: 'home-mixer', type: 'archComponent', position: { x: 250, y: 200 }, data: { componentType: 'app_server', label: 'Home Mixer', config: {} } },
        // Candidate Sourcing
        { id: 'candidate-sourcing', type: 'archComponent', position: { x: 450, y: 100 }, data: { componentType: 'app_server', label: 'Candidate Sourcing', config: {} } },
        { id: 'in-network-service', type: 'archComponent', position: { x: 650, y: 50 }, data: { componentType: 'app_server', label: 'In-Network Service', config: {} } },
        { id: 'out-network-service', type: 'archComponent', position: { x: 650, y: 150 }, data: { componentType: 'app_server', label: 'Out-of-Network Service', config: {} } },
        { id: 'real-graph', type: 'archComponent', position: { x: 850, y: 50 }, data: { componentType: 'ml_model', label: 'Real Graph', config: {} } },
        { id: 'social-graph', type: 'archComponent', position: { x: 850, y: 120 }, data: { componentType: 'ml_model', label: 'Social Graph', config: {} } },
        { id: 'embedding-space', type: 'archComponent', position: { x: 850, y: 190 }, data: { componentType: 'ml_model', label: 'Embedding Space', config: {} } },
        // Ranking Layer
        { id: 'ranking-service', type: 'archComponent', position: { x: 450, y: 300 }, data: { componentType: 'app_server', label: 'Ranking Service', config: {} } },
        { id: 'feature-extractor', type: 'archComponent', position: { x: 650, y: 300 }, data: { componentType: 'worker', label: 'Feature Extractor', config: {} } },
        { id: 'neural-network', type: 'archComponent', position: { x: 850, y: 300 }, data: { componentType: 'ml_model', label: '48M Param NN', config: {} } },
        // Filtering
        { id: 'filter-service', type: 'archComponent', position: { x: 450, y: 450 }, data: { componentType: 'app_server', label: 'Filter Service', config: {} } },
        // Data Stores
        { id: 'tweet-store', type: 'archComponent', position: { x: 50, y: 400 }, data: { componentType: 'cassandra', label: 'Tweet Store', config: {} } },
        { id: 'user-graph-db', type: 'archComponent', position: { x: 1050, y: 100 }, data: { componentType: 'graph_db', label: 'User Graph DB', config: {} } },
        { id: 'redis-cache', type: 'archComponent', position: { x: 250, y: 400 }, data: { componentType: 'redis', label: 'Redis Cache', config: {} } },
        { id: 'kafka-stream', type: 'archComponent', position: { x: 450, y: 600 }, data: { componentType: 'kafka', label: 'Tweet Stream', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 'user-request', target: 'api-gateway', type: 'archEdge', data: {} },
        { id: 'e2', source: 'api-gateway', target: 'home-mixer', type: 'archEdge', data: {} },
        { id: 'e3', source: 'home-mixer', target: 'candidate-sourcing', type: 'archEdge', data: {} },
        { id: 'e4', source: 'candidate-sourcing', target: 'in-network-service', type: 'archEdge', data: {} },
        { id: 'e5', source: 'candidate-sourcing', target: 'out-network-service', type: 'archEdge', data: {} },
        { id: 'e6', source: 'in-network-service', target: 'real-graph', type: 'archEdge', data: {} },
        { id: 'e7', source: 'out-network-service', target: 'social-graph', type: 'archEdge', data: {} },
        { id: 'e8', source: 'out-network-service', target: 'embedding-space', type: 'archEdge', data: {} },
        { id: 'e9', source: 'real-graph', target: 'user-graph-db', type: 'archEdge', data: {} },
        { id: 'e10', source: 'social-graph', target: 'user-graph-db', type: 'archEdge', data: {} },
        { id: 'e11', source: 'embedding-space', target: 'user-graph-db', type: 'archEdge', data: {} },
        { id: 'e12', source: 'candidate-sourcing', target: 'ranking-service', type: 'archEdge', data: {} },
        { id: 'e13', source: 'ranking-service', target: 'feature-extractor', type: 'archEdge', data: {} },
        { id: 'e14', source: 'feature-extractor', target: 'neural-network', type: 'archEdge', data: {} },
        { id: 'e15', source: 'ranking-service', target: 'filter-service', type: 'archEdge', data: {} },
        { id: 'e16', source: 'filter-service', target: 'home-mixer', type: 'archEdge', data: {} },
        { id: 'e17', source: 'home-mixer', target: 'tweet-store', type: 'archEdge', data: {} },
        { id: 'e18', source: 'home-mixer', target: 'redis-cache', type: 'archEdge', data: {} },
        { id: 'e19', source: 'kafka-stream', target: 'tweet-store', type: 'archEdge', data: {} },
        { id: 'e20', source: 'kafka-stream', target: 'ranking-service', type: 'archEdge', data: {} },
      ],
      sections: [],
      version: 1,
      updatedAt: now,
    });

    createdIds.push(twitterId);

    return {
      success: true,
      message: `Successfully created ${createdIds.length} example designs`,
      count: createdIds.length,
      designs: createdIds,
    };
  },
});
