import type { ComponentTypeConfig } from '@/types';
import { deriveConfigFields, deriveDefaultConfig } from '@/lib/configSchemaUtils';

// Helper to define a component type with derived config
function defineComponentType(
  config: Omit<ComponentTypeConfig, 'defaultConfig' | 'configFields'> & {
    configSchema: { type: 'object'; properties: Record<string, any>; required: string[] };
    labelOverrides?: Record<string, string>;
  }
): ComponentTypeConfig {
  const { labelOverrides, ...rest } = config;
  return {
    ...rest,
    defaultConfig: deriveDefaultConfig(config.configSchema),
    configFields: deriveConfigFields(config.configSchema, labelOverrides ? { labels: labelOverrides } : undefined),
  };
}

export const componentTypes: ComponentTypeConfig[] = [
  // --- Clients ---
  defineComponentType({
    key: 'client_browser',
    label: 'Web Browser',
    category: 'Clients',
    icon: 'Monitor',
    description: 'Web browser / SPA client',
    configSchema: {
      type: 'object',
      properties: {
        framework: { type: 'string', enum: ['React', 'Vue', 'Angular', 'Vanilla'], default: 'React', description: 'Frontend framework' },
        hosting: { type: 'string', enum: ['CDN', 'Static', 'SSR'], default: 'CDN', description: 'Hosting strategy' },
        bundle_size: { type: 'string', default: '500KB', description: 'Initial bundle size' },
      },
      required: ['framework', 'hosting'],
    },
    primaryFields: ['framework', 'hosting'],
  }),
  defineComponentType({
    key: 'client_mobile',
    label: 'Mobile App',
    category: 'Clients',
    icon: 'Smartphone',
    description: 'Mobile app (iOS/Android)',
    configSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['iOS', 'Android', 'iOS/Android'], default: 'iOS/Android', description: 'Target platform' },
        framework: { type: 'string', enum: ['Native', 'React Native', 'Flutter'], default: 'React Native', description: 'Development framework' },
        min_version: { type: 'string', default: 'iOS 14 / Android 10', description: 'Minimum OS version' },
      },
      required: ['platform', 'framework'],
    },
    primaryFields: ['platform', 'framework'],
  }),

  // --- Traffic ---
  defineComponentType({
    key: 'load_balancer',
    label: 'Load Balancer',
    category: 'Traffic',
    icon: 'Scale',
    description: 'Distributes traffic across multiple servers',
    configSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['L4', 'L7'], default: 'L7', description: 'Load balancer type (L4 or L7)' },
        algorithm: { type: 'string', enum: ['round-robin', 'least-connections', 'ip-hash'], default: 'round-robin', description: 'Load balancing algorithm' },
        health_check_interval: { type: 'integer', minimum: 5, maximum: 300, default: 30, description: 'Health check interval in seconds' },
        timeout: { type: 'integer', minimum: 1, maximum: 300, default: 60, description: 'Connection timeout in seconds' },
      },
      required: ['type', 'algorithm'],
    },
    primaryFields: ['algorithm', 'health_check_interval'],
  }),
  defineComponentType({
    key: 'api_gateway',
    label: 'API Gateway',
    category: 'Traffic',
    icon: 'Router',
    description: 'API routing, rate limiting, authentication',
    configSchema: {
      type: 'object',
      properties: {
        rate_limit: { type: 'integer', minimum: 100, maximum: 1000000, default: 10000, description: 'Maximum requests per second' },
        auth_method: { type: 'string', enum: ['none', 'api-key', 'oauth2', 'jwt'], default: 'api-key', description: 'Authentication method' },
        cors_enabled: { type: 'boolean', default: true, description: 'Enable CORS headers' },
        request_validation: { type: 'boolean', default: true, description: 'Validate incoming requests' },
      },
      required: ['rate_limit'],
    },
    labelOverrides: {
      rate_limit: 'Rate Limit (req/s)',
    },
    primaryFields: ['rate_limit', 'auth_method'],
  }),
  defineComponentType({
    key: 'cdn',
    label: 'CDN',
    category: 'Traffic',
    icon: 'Globe',
    description: 'Content delivery network for static assets',
    configSchema: {
      type: 'object',
      properties: {
        cache_ttl: { type: 'integer', minimum: 60, maximum: 31536000, default: 3600, description: 'Cache time-to-live in seconds' },
        origin_protocol: { type: 'string', enum: ['http', 'https', 'match-viewer'], default: 'https', description: 'Protocol to use when fetching from origin' },
        edge_locations: { type: 'string', enum: ['global', 'us-only', 'eu-only', 'apac-only'], default: 'global', description: 'Geographic distribution of edge servers' },
        compression: { type: 'boolean', default: true, description: 'Enable gzip/brotli compression' },
      },
      required: ['cache_ttl'],
    },
    labelOverrides: {
      cache_ttl: 'Cache TTL (s)',
    },
    primaryFields: ['cache_ttl', 'origin_protocol'],
  }),
  defineComponentType({
    key: 'dns',
    label: 'DNS',
    category: 'Traffic',
    icon: 'Globe2',
    description: 'DNS resolver for domain name resolution',
    configSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['Route53', 'CloudFlare', 'Custom'], default: 'Route53', description: 'DNS provider' },
        ttl: { type: 'integer', minimum: 60, maximum: 86400, default: 300, description: 'DNS record TTL in seconds' },
        geolocation: { type: 'boolean', default: false, description: 'Enable geo-based routing' },
      },
      required: ['provider', 'ttl'],
    },
    labelOverrides: {
      ttl: 'TTL (s)',
    },
    primaryFields: ['provider', 'ttl'],
  }),

  // --- Compute ---
  defineComponentType({
    key: 'app_server',
    label: 'App Server',
    category: 'Compute',
    icon: 'Server',
    description: 'Application server running business logic',
    configSchema: {
      type: 'object',
      properties: {
        runtime: { type: 'string', enum: ['node:20', 'python:3.12', 'go:1.22', 'java:21', 'rust:1.77'], default: 'node:20', description: 'Runtime environment' },
        replicas: { type: 'integer', minimum: 1, maximum: 100, default: 2, description: 'Number of instances' },
        cpu: { type: 'string', enum: ['1vCPU', '2vCPU', '4vCPU', '8vCPU'], default: '2vCPU', description: 'CPU allocation per instance' },
        memory: { type: 'string', enum: ['1GB', '2GB', '4GB', '8GB', '16GB'], default: '4GB', description: 'Memory allocation per instance' },
        autoscaling: { type: 'boolean', default: false, description: 'Enable horizontal autoscaling' },
        min_replicas: { type: 'integer', minimum: 1, maximum: 10, default: 1, description: 'Minimum replicas when autoscaling' },
        max_replicas: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Maximum replicas when autoscaling' },
      },
      required: ['runtime', 'replicas', 'cpu', 'memory'],
    },
    labelOverrides: {
      cpu: 'CPU',
    },
    primaryFields: ['runtime', 'replicas', 'cpu'],
  }),
  defineComponentType({
    key: 'worker',
    label: 'Worker',
    category: 'Compute',
    icon: 'Cog',
    description: 'Background job processor',
    configSchema: {
      type: 'object',
      properties: {
        runtime: { type: 'string', enum: ['node:20', 'python:3.12', 'go:1.22', 'java:21'], default: 'python:3.12', description: 'Runtime environment' },
        replicas: { type: 'integer', minimum: 1, maximum: 50, default: 2, description: 'Number of worker instances' },
        concurrency: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Concurrent jobs per worker' },
        queue_type: { type: 'string', enum: ['redis', 'rabbitmq', 'sqs'], default: 'redis', description: 'Job queue backend' },
        retry_attempts: { type: 'integer', minimum: 0, maximum: 10, default: 3, description: 'Number of retry attempts for failed jobs' },
      },
      required: ['runtime', 'replicas', 'concurrency'],
    },
    primaryFields: ['runtime', 'replicas'],
  }),
  defineComponentType({
    key: 'serverless',
    label: 'Serverless Function',
    category: 'Compute',
    icon: 'Zap',
    description: 'Event-driven serverless compute (Lambda/Cloud Functions)',
    configSchema: {
      type: 'object',
      properties: {
        runtime: { type: 'string', enum: ['node:20', 'python:3.12', 'go:1.22'], default: 'node:20', description: 'Runtime environment' },
        memory: { type: 'string', enum: ['128MB', '256MB', '512MB', '1GB', '2GB'], default: '256MB', description: 'Memory allocation' },
        timeout: { type: 'integer', minimum: 1, maximum: 900, default: 30, description: 'Execution timeout in seconds' },
        trigger_type: { type: 'string', enum: ['http', 'event', 'schedule', 'stream'], default: 'http', description: 'Invocation trigger type' },
        reserved_concurrency: { type: 'integer', minimum: 0, maximum: 1000, default: 0, description: 'Reserved concurrent executions (0 = unreserved)' },
      },
      required: ['runtime', 'memory', 'timeout'],
    },
    labelOverrides: {
      timeout: 'Timeout (s)',
    },
    primaryFields: ['runtime', 'memory', 'timeout'],
  }),

  // --- Databases ---
  defineComponentType({

    key: 'postgres',

    label: 'PostgreSQL',

    category: 'Databases',

    icon: 'Database',

    description: 'Relational database with ACID transactions',

    configSchema: {
      type: 'object',
      properties: {
        storage: { type: 'string', enum: ['10GB', '50GB', '100GB', '500GB', '1TB'], default: '100GB', description: 'Storage capacity' },
        replicas: { type: 'integer', minimum: 1, maximum: 10, default: 1, description: 'Number of replicas' },
        mode: { type: 'string', enum: ['single', 'primary-replica', 'multi-primary'], default: 'single', description: 'Replication mode' },
        engine_version: { type: 'string', default: '16', description: 'PostgreSQL engine version' },
        connection_pool_size: { type: 'integer', minimum: 10, maximum: 1000, default: 100, description: 'Maximum connection pool size' },
        backup_retention_days: { type: 'integer', minimum: 1, maximum: 35, default: 7, description: 'Backup retention period in days' },
      },
      required: ['storage', 'replicas', 'mode'],
    },

    primaryFields: ['replicas', 'mode', 'storage'],

  }), 
  defineComponentType({

    key: 'object_storage',

    label: 'Object Storage',

    category: 'Databases',

    icon: 'HardDrive',

    description: 'S3-compatible object/blob storage',

    configSchema: {
      type: 'object',
      properties: {
        versioning: { type: 'boolean', default: false, description: 'Enable object versioning' },
        storage_class: { type: 'string', enum: ['standard', 'infrequent-access', 'glacier', 'deep-archive'], default: 'standard', description: 'Storage tier/class' },
        encryption: { type: 'string', enum: ['none', 'aes256', 'kms'], default: 'aes256', description: 'Encryption method' },
        lifecycle_policy: { type: 'boolean', default: false, description: 'Enable lifecycle management policies' },
        public_access: { type: 'boolean', default: false, description: 'Allow public read access' },
      },
      required: ['versioning'],
    },

    primaryFields: ['storage_class', 'versioning'],

  }), 
  defineComponentType({

    key: 'mysql',

    label: 'MySQL',

    category: 'Databases',

    icon: 'Database',

    description: 'MySQL relational database',

    configSchema: {
      type: 'object',
      properties: {
        storage: { type: 'string', enum: ['10GB', '50GB', '100GB', '500GB', '1TB'], default: '100GB', description: 'Storage capacity' },
        replicas: { type: 'integer', minimum: 1, maximum: 10, default: 1, description: 'Number of replicas' },
        engine_version: { type: 'string', default: '8.0', description: 'MySQL engine version' },
        connection_pool_size: { type: 'integer', minimum: 10, maximum: 1000, default: 100, description: 'Maximum connection pool size' },
      },
      required: ['storage', 'replicas'],
    },

    primaryFields: ['replicas', 'storage'],

  }), 
  defineComponentType({

    key: 'mongodb',

    label: 'MongoDB',

    category: 'Databases',

    icon: 'Database',

    description: 'MongoDB document store',

    configSchema: {
      type: 'object',
      properties: {
        storage: { type: 'string', enum: ['10GB', '50GB', '100GB', '500GB', '1TB'], default: '100GB', description: 'Storage capacity' },
        shards: { type: 'integer', minimum: 1, maximum: 50, default: 1, description: 'Number of shards' },
        replicas_per_shard: { type: 'integer', minimum: 1, maximum: 7, default: 3, description: 'Replicas per shard' },
        engine_version: { type: 'string', default: '7.0', description: 'MongoDB engine version' },
      },
      required: ['storage', 'shards'],
    },

    primaryFields: ['shards', 'storage'],

  }), 
  defineComponentType({

    key: 'cassandra',

    label: 'Cassandra',

    category: 'Databases',

    icon: 'Database',

    description: 'Cassandra wide-column store',

    configSchema: {
      type: 'object',
      properties: {
        nodes: { type: 'integer', minimum: 1, maximum: 100, default: 3, description: 'Number of nodes in cluster' },
        replication_factor: { type: 'integer', minimum: 1, maximum: 5, default: 3, description: 'Data replication factor' },
        consistency_level: { type: 'string', enum: ['ONE', 'QUORUM', 'ALL'], default: 'QUORUM', description: 'Read/write consistency level' },
        storage_per_node: { type: 'string', enum: ['100GB', '500GB', '1TB', '2TB'], default: '500GB', description: 'Storage per node' },
      },
      required: ['nodes', 'replication_factor'],
    },

    primaryFields: ['nodes', 'replication_factor'],

  }), 
  defineComponentType({

    key: 'dynamodb',

    label: 'DynamoDB',

    category: 'Databases',

    icon: 'Database',

    description: 'DynamoDB key-value store',

    configSchema: {
      type: 'object',
      properties: {
        capacity_mode: { type: 'string', enum: ['on-demand', 'provisioned'], default: 'on-demand', description: 'Capacity mode' },
        read_capacity: { type: 'integer', minimum: 1, maximum: 40000, default: 5, description: 'Read capacity units (provisioned mode)' },
        write_capacity: { type: 'integer', minimum: 1, maximum: 40000, default: 5, description: 'Write capacity units (provisioned mode)' },
        stream_enabled: { type: 'boolean', default: false, description: 'Enable DynamoDB Streams' },
      },
      required: ['capacity_mode'],
    },

    primaryFields: ['capacity_mode', 'read_capacity'],

  }), 

  // --- Caching ---
  defineComponentType({
    key: 'redis',
    label: 'Redis',
    category: 'Caching',
    icon: 'MemoryStick',
    description: 'In-memory cache and data store',
    configSchema: {
      type: 'object',
      properties: {
        memory: { type: 'string', enum: ['1GB', '2GB', '4GB', '6GB', '16GB', '32GB'], default: '6GB', description: 'Memory allocation' },
        ttl: { type: 'integer', minimum: 60, maximum: 86400, default: 3600, description: 'Default time-to-live in seconds' },
        eviction_policy: { type: 'string', enum: ['noeviction', 'allkeys-lru', 'volatile-lru', 'allkeys-lfu', 'volatile-lfu'], default: 'allkeys-lru', description: 'Eviction policy when memory is full' },
        persistence: { type: 'string', enum: ['none', 'rdb', 'aof', 'both'], default: 'rdb', description: 'Data persistence strategy' },
        replicas: { type: 'integer', minimum: 0, maximum: 5, default: 1, description: 'Number of read replicas' },
      },
      required: ['memory', 'ttl'],
    },
    labelOverrides: {
      ttl: 'Default TTL (s)',
    },
    primaryFields: ['memory', 'eviction_policy'],
  }), 

  // --- Search & Analytics ---
  defineComponentType({

    key: 'elasticsearch',

    label: 'Elasticsearch',

    category: 'Search & Analytics',

    icon: 'Search',

    description: 'Elasticsearch full-text search engine',

    configSchema: {
      type: 'object',
      properties: {
        nodes: { type: 'integer', minimum: 1, maximum: 50, default: 3, description: 'Number of cluster nodes' },
        storage: { type: 'string', enum: ['100GB', '500GB', '1TB', '5TB'], default: '500GB', description: 'Total storage capacity' },
        shards: { type: 'integer', minimum: 1, maximum: 100, default: 5, description: 'Number of primary shards' },
        replicas: { type: 'integer', minimum: 0, maximum: 5, default: 1, description: 'Number of replicas per shard' },
      },
      required: ['nodes', 'storage'],
    },

    primaryFields: ['nodes', 'storage'],

  }), 
  defineComponentType({

    key: 'data_warehouse',

    label: 'Data Warehouse',

    category: 'Search & Analytics',

    icon: 'Warehouse',

    description: 'Data warehouse / OLAP system',

    configSchema: {
      type: 'object',
      properties: {
        storage: { type: 'string', enum: ['500GB', '1TB', '5TB', '10TB'], default: '1TB', description: 'Storage capacity' },
        compute: { type: 'string', enum: ['Small', 'Medium', 'Large', 'X-Large'], default: 'Medium', description: 'Compute cluster size' },
        warehouse_type: { type: 'string', enum: ['Snowflake', 'Redshift', 'BigQuery'], default: 'Snowflake', description: 'Warehouse platform' },
        auto_suspend: { type: 'boolean', default: true, description: 'Auto-suspend when idle' },
      },
      required: ['storage', 'compute'],
    },

    primaryFields: ['compute', 'storage'],

  }), 

  // --- ML / AI ---
  defineComponentType({

    key: 'ml_model',

    label: 'ML Model',

    category: 'ML / AI',

    icon: 'Brain',

    description: 'ML model serving endpoint',

    configSchema: {
      type: 'object',
      properties: {
        framework: { type: 'string', enum: ['PyTorch', 'TensorFlow', 'ONNX', 'Custom'], default: 'PyTorch', description: 'ML framework' },
        accelerator: { type: 'string', enum: ['CPU', 'GPU', 'TPU'], default: 'GPU', description: 'Hardware accelerator' },
        replicas: { type: 'integer', minimum: 1, maximum: 20, default: 2, description: 'Number of model instances' },
        batch_size: { type: 'integer', minimum: 1, maximum: 128, default: 8, description: 'Inference batch size' },
      },
      required: ['framework', 'accelerator'],
    },

    primaryFields: ['framework', 'accelerator'],

  }), 
  defineComponentType({

    key: 'vector_db',

    label: 'Vector Database',

    category: 'ML / AI',

    icon: 'Waypoints',

    description: 'Vector database for embeddings',

    configSchema: {
      type: 'object',
      properties: {
        dimensions: { type: 'integer', minimum: 128, maximum: 4096, default: 1536, description: 'Vector dimensions' },
        index_type: { type: 'string', enum: ['HNSW', 'IVF', 'Flat'], default: 'HNSW', description: 'Indexing algorithm' },
        similarity_metric: { type: 'string', enum: ['cosine', 'euclidean', 'dot'], default: 'cosine', description: 'Similarity metric' },
        storage: { type: 'string', enum: ['10GB', '50GB', '100GB', '500GB'], default: '100GB', description: 'Storage capacity' },
      },
      required: ['dimensions', 'index_type'],
    },

    primaryFields: ['dimensions', 'index_type'],

  }), 

  // --- Observability ---
  defineComponentType({

    key: 'logging',

    label: 'Logging',

    category: 'Observability',

    icon: 'FileText',

    description: 'Centralized logging (ELK, Datadog)',

    configSchema: {
      type: 'object',
      properties: {
        retention: { type: 'string', enum: ['7d', '30d', '90d', '1y'], default: '30d', description: 'Log retention period' },
        storage: { type: 'string', enum: ['100GB', '500GB', '1TB', '5TB'], default: '500GB', description: 'Storage capacity' },
        ingestion_rate: { type: 'string', default: '1GB/day', description: 'Expected log ingestion rate' },
        provider: { type: 'string', enum: ['ELK', 'Datadog', 'CloudWatch', 'Custom'], default: 'ELK', description: 'Logging provider' },
      },
      required: ['retention', 'storage'],
    },

    primaryFields: ['retention', 'storage'],

  }), 
  defineComponentType({

    key: 'metrics',

    label: 'Metrics',

    category: 'Observability',

    icon: 'Activity',

    description: 'Metrics & monitoring (Prometheus, Grafana)',

    configSchema: {
      type: 'object',
      properties: {
        scrape_interval: { type: 'integer', minimum: 5, maximum: 300, default: 15, description: 'Metrics scrape interval in seconds' },
        retention: { type: 'string', enum: ['7d', '30d', '90d', '1y'], default: '30d', description: 'Metrics retention period' },
        storage: { type: 'string', enum: ['50GB', '100GB', '500GB', '1TB'], default: '100GB', description: 'Storage capacity' },
        provider: { type: 'string', enum: ['Prometheus', 'Datadog', 'CloudWatch', 'Custom'], default: 'Prometheus', description: 'Metrics provider' },
      },
      required: ['scrape_interval', 'retention'],
    },

    primaryFields: ['scrape_interval', 'retention'],
    labelOverrides: {
      scrape_interval: 'Scrape Interval (s)',
    },

  }), 

  // --- Messaging ---
  defineComponentType({

    key: 'kafka',

    label: 'Kafka',

    category: 'Messaging',

    icon: 'ArrowRightLeft',

    description: 'Distributed event streaming platform',

    configSchema: {
      type: 'object',
      properties: {
        partitions: { type: 'integer', minimum: 1, maximum: 100, default: 6, description: 'Number of topic partitions' },
        retention: { type: 'string', enum: ['1d', '3d', '7d', '14d', '30d'], default: '7d', description: 'Message retention period' },
        replication_factor: { type: 'integer', minimum: 1, maximum: 5, default: 3, description: 'Number of replicas per partition' },
        compression: { type: 'string', enum: ['none', 'gzip', 'snappy', 'lz4', 'zstd'], default: 'snappy', description: 'Message compression algorithm' },
        min_insync_replicas: { type: 'integer', minimum: 1, maximum: 5, default: 2, description: 'Minimum in-sync replicas for writes' },
      },
      required: ['partitions', 'retention'],
    },

    primaryFields: ['partitions', 'retention', 'replication_factor'],

  }), 
  defineComponentType({

    key: 'websocket',

    label: 'WebSocket Server',

    category: 'Messaging',

    icon: 'Plug',

    description: 'Real-time bidirectional communication',

    configSchema: {
      type: 'object',
      properties: {
        max_connections: { type: 'integer', minimum: 100, maximum: 100000, default: 10000, description: 'Maximum concurrent connections' },
        heartbeat_interval: { type: 'integer', minimum: 5, maximum: 300, default: 30, description: 'Heartbeat/ping interval in seconds' },
        message_size_limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Maximum message size in MB' },
        idle_timeout: { type: 'integer', minimum: 60, maximum: 3600, default: 300, description: 'Idle connection timeout in seconds' },
        compression: { type: 'boolean', default: true, description: 'Enable per-message compression' },
      },
      required: ['max_connections'],
    },

    primaryFields: ['max_connections', 'heartbeat_interval'],

  }), 
  defineComponentType({

    key: 'message_queue',

    label: 'Message Queue',

    category: 'Messaging',

    icon: 'Inbox',

    description: 'General message queue (RabbitMQ, SQS)',

    configSchema: {
      type: 'object',
      properties: {
        queue_type: { type: 'string', enum: ['RabbitMQ', 'SQS', 'Azure Queue'], default: 'RabbitMQ', description: 'Queue implementation' },
        max_size: { type: 'integer', minimum: 100, maximum: 1000000, default: 10000, description: 'Maximum queue size' },
        retention: { type: 'string', enum: ['1h', '6h', '1d', '7d'], default: '1d', description: 'Message retention period' },
        delivery_mode: { type: 'string', enum: ['at-least-once', 'at-most-once', 'exactly-once'], default: 'at-least-once', description: 'Delivery guarantee' },
      },
      required: ['queue_type', 'max_size'],
    },

    primaryFields: ['queue_type', 'max_size'],

  }), 

  // --- External ---
  defineComponentType({

    key: 'external_api',

    label: 'External API',

    category: 'External',

    icon: 'ExternalLink',

    description: 'Third-party API dependency',

    configSchema: {
      type: 'object',
      properties: {
        base_url: { type: 'string', format: 'uri', default: 'https://api.example.com', description: 'Base URL for API requests' },
        timeout: { type: 'integer', minimum: 100, maximum: 60000, default: 5000, description: 'Request timeout in milliseconds' },
        auth_type: { type: 'string', enum: ['none', 'api-key', 'oauth2', 'basic'], default: 'api-key', description: 'Authentication method' },
        rate_limit: { type: 'integer', minimum: 1, maximum: 10000, default: 100, description: 'Maximum requests per minute' },
        retry_attempts: { type: 'integer', minimum: 0, maximum: 5, default: 3, description: 'Number of retry attempts on failure' },
      },
      required: ['base_url', 'timeout'],
    },

    primaryFields: ['base_url', 'auth_type'],
    labelOverrides: {
      base_url: 'Base URL',
      timeout: 'Timeout (ms)',
    },

  }), 
  defineComponentType({

    key: 'payment_gateway',

    label: 'Payment Gateway',

    category: 'External',

    icon: 'CreditCard',

    description: 'Payment processor (Stripe, PayPal)',

    configSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['Stripe', 'PayPal', 'Square', 'Braintree'], default: 'Stripe', description: 'Payment provider' },
        mode: { type: 'string', enum: ['test', 'live'], default: 'test', description: 'API mode' },
        currencies: { type: 'array', items: { type: 'string' }, default: ['USD'], description: 'Supported currencies' },
        webhook_enabled: { type: 'boolean', default: true, description: 'Enable payment webhooks' },
      },
      required: ['provider', 'mode'],
    },

    primaryFields: ['provider', 'mode'],

  }), 
  defineComponentType({

    key: 'auth_provider',

    label: 'Auth Provider',

    category: 'External',

    icon: 'Shield',

    description: 'Auth/identity provider (OAuth, Auth0)',

    configSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['Auth0', 'Okta', 'Firebase', 'Cognito'], default: 'Auth0', description: 'Identity provider' },
        protocol: { type: 'string', enum: ['OAuth2', 'SAML', 'OpenID'], default: 'OAuth2', description: 'Authentication protocol' },
        mfa_enabled: { type: 'boolean', default: false, description: 'Enable multi-factor authentication' },
        session_timeout: { type: 'integer', minimum: 300, maximum: 86400, default: 3600, description: 'Session timeout in seconds' },
      },
      required: ['provider', 'protocol'],
    },

    primaryFields: ['provider', 'protocol'],

  }), 
];

export const componentTypeMap = new Map(
  componentTypes.map((ct) => [ct.key, ct])
);

export const componentsByCategory = componentTypes.reduce(
  (acc, ct) => {
    if (!acc[ct.category]) acc[ct.category] = [];
    acc[ct.category].push(ct);
    return acc;
  },
  {} as Record<string, ComponentTypeConfig[]>
);
