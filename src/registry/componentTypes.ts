import type { ComponentTypeConfig } from '@/types';

export const componentTypes: ComponentTypeConfig[] = [
  // --- Clients ---
  {
    key: 'client_browser',
    label: 'Web Browser',
    category: 'Clients',
    icon: 'Monitor',
    description: 'Web browser / SPA client',
    defaultConfig: { framework: 'React' },
    configFields: [
      { key: 'framework', label: 'Framework', type: 'select', options: ['React', 'Vue', 'Angular', 'Vanilla'], defaultValue: 'React' },
      { key: 'hosting', label: 'Hosting', type: 'select', options: ['CDN', 'Static', 'SSR'], defaultValue: 'CDN' },
    ],
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
  },
  {
    key: 'client_mobile',
    label: 'Mobile App',
    category: 'Clients',
    icon: 'Smartphone',
    description: 'Mobile app (iOS/Android)',
    defaultConfig: { platform: 'iOS/Android' },
    configFields: [
      { key: 'platform', label: 'Platform', type: 'select', options: ['iOS', 'Android', 'iOS/Android'], defaultValue: 'iOS/Android' },
      { key: 'framework', label: 'Framework', type: 'select', options: ['Native', 'React Native', 'Flutter'], defaultValue: 'React Native' },
    ],
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
  },

  // --- Traffic ---
  {
    key: 'load_balancer',
    label: 'Load Balancer',
    category: 'Traffic',
    icon: 'Scale',
    description: 'Distributes traffic across multiple servers',
    defaultConfig: { type: 'L7', algorithm: 'round-robin' },
    configFields: [
      { key: 'type', label: 'Type', type: 'select', options: ['L4', 'L7'], defaultValue: 'L7' },
      { key: 'algorithm', label: 'Algorithm', type: 'select', options: ['round-robin', 'least-connections', 'ip-hash'], defaultValue: 'round-robin' },
    ],
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
  },
  {
    key: 'api_gateway',
    label: 'API Gateway',
    category: 'Traffic',
    icon: 'Router',
    description: 'API routing, rate limiting, authentication',
    defaultConfig: { rate_limit: 10000 },
    configFields: [
      { key: 'rate_limit', label: 'Rate Limit (req/s)', type: 'number', defaultValue: 10000 },
    ],
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
    primaryFields: ['rate_limit', 'auth_method'],
  },
  {
    key: 'cdn',
    label: 'CDN',
    category: 'Traffic',
    icon: 'Globe',
    description: 'Content delivery network for static assets',
    defaultConfig: { cache_ttl: 3600 },
    configFields: [
      { key: 'cache_ttl', label: 'Cache TTL (s)', type: 'number', defaultValue: 3600 },
    ],
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
    primaryFields: ['cache_ttl', 'origin_protocol'],
  },
  {
    key: 'dns',
    label: 'DNS',
    category: 'Traffic',
    icon: 'Globe2',
    description: 'DNS resolver for domain name resolution',
    defaultConfig: { provider: 'Route53', ttl: 300 },
    configFields: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['Route53', 'CloudFlare', 'Custom'], defaultValue: 'Route53' },
      { key: 'ttl', label: 'TTL (s)', type: 'number', defaultValue: 300 },
    ],
    configSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['Route53', 'CloudFlare', 'Custom'], default: 'Route53', description: 'DNS provider' },
        ttl: { type: 'integer', minimum: 60, maximum: 86400, default: 300, description: 'DNS record TTL in seconds' },
        geolocation: { type: 'boolean', default: false, description: 'Enable geo-based routing' },
      },
      required: ['provider', 'ttl'],
    },
    primaryFields: ['provider', 'ttl'],
  },

  // --- Compute ---
  {
    key: 'app_server',
    label: 'App Server',
    category: 'Compute',
    icon: 'Server',
    description: 'Application server running business logic',
    defaultConfig: { runtime: 'node:20', replicas: 2, cpu: '2vCPU', memory: '4GB' },
    configFields: [
      { key: 'runtime', label: 'Runtime', type: 'select', options: ['node:20', 'python:3.12', 'go:1.22', 'java:21', 'rust:1.77'], defaultValue: 'node:20' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 2 },
      { key: 'cpu', label: 'CPU', type: 'select', options: ['1vCPU', '2vCPU', '4vCPU', '8vCPU'], defaultValue: '2vCPU' },
      { key: 'memory', label: 'Memory', type: 'select', options: ['1GB', '2GB', '4GB', '8GB', '16GB'], defaultValue: '4GB' },
    ],
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
    primaryFields: ['runtime', 'replicas', 'cpu'],
  },
  {
    key: 'worker',
    label: 'Worker',
    category: 'Compute',
    icon: 'Cog',
    description: 'Background job processor',
    defaultConfig: { runtime: 'python:3.12', replicas: 2, concurrency: 10 },
    configFields: [
      { key: 'runtime', label: 'Runtime', type: 'select', options: ['node:20', 'python:3.12', 'go:1.22', 'java:21'], defaultValue: 'python:3.12' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 2 },
      { key: 'concurrency', label: 'Concurrency', type: 'number', defaultValue: 10 },
    ],
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
  },
  {
    key: 'serverless',
    label: 'Serverless Function',
    category: 'Compute',
    icon: 'Zap',
    description: 'Event-driven serverless compute (Lambda/Cloud Functions)',
    defaultConfig: { runtime: 'node:20', memory: '256MB', timeout: 30 },
    configFields: [
      { key: 'runtime', label: 'Runtime', type: 'select', options: ['node:20', 'python:3.12', 'go:1.22'], defaultValue: 'node:20' },
      { key: 'memory', label: 'Memory', type: 'select', options: ['128MB', '256MB', '512MB', '1GB', '2GB'], defaultValue: '256MB' },
      { key: 'timeout', label: 'Timeout (s)', type: 'number', defaultValue: 30 },
    ],
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
    primaryFields: ['runtime', 'memory', 'timeout'],
  },

  // --- Databases ---
  {
    key: 'postgres',
    label: 'PostgreSQL',
    category: 'Databases',
    icon: 'Database',
    description: 'Relational database with ACID transactions',
    defaultConfig: { storage: '100GB', replicas: 1, mode: 'single' },
    configFields: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['10GB', '50GB', '100GB', '500GB', '1TB'], defaultValue: '100GB' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 1 },
      { key: 'mode', label: 'Mode', type: 'select', options: ['single', 'primary-replica', 'multi-primary'], defaultValue: 'single' },
    ],
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
  },
  {
    key: 'object_storage',
    label: 'Object Storage',
    category: 'Databases',
    icon: 'HardDrive',
    description: 'S3-compatible object/blob storage',
    defaultConfig: { versioning: false },
    configFields: [
      { key: 'versioning', label: 'Versioning', type: 'select', options: ['true', 'false'], defaultValue: 'false' },
    ],
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
  },
  {
    key: 'mysql',
    label: 'MySQL',
    category: 'Databases',
    icon: 'Database',
    description: 'MySQL relational database',
    defaultConfig: { storage: '100GB', replicas: 1 },
    configFields: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['10GB', '50GB', '100GB', '500GB', '1TB'], defaultValue: '100GB' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 1 },
    ],
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
  },
  {
    key: 'mongodb',
    label: 'MongoDB',
    category: 'Databases',
    icon: 'Database',
    description: 'MongoDB document store',
    defaultConfig: { storage: '100GB', shards: 1 },
    configFields: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['10GB', '50GB', '100GB', '500GB', '1TB'], defaultValue: '100GB' },
      { key: 'shards', label: 'Shards', type: 'number', defaultValue: 1 },
    ],
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
  },
  {
    key: 'cassandra',
    label: 'Cassandra',
    category: 'Databases',
    icon: 'Database',
    description: 'Cassandra wide-column store',
    defaultConfig: { nodes: 3, replication_factor: 3 },
    configFields: [
      { key: 'nodes', label: 'Nodes', type: 'number', defaultValue: 3 },
      { key: 'replication_factor', label: 'Replication Factor', type: 'number', defaultValue: 3 },
    ],
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
  },
  {
    key: 'dynamodb',
    label: 'DynamoDB',
    category: 'Databases',
    icon: 'Database',
    description: 'DynamoDB key-value store',
    defaultConfig: { capacity_mode: 'on-demand' },
    configFields: [
      { key: 'capacity_mode', label: 'Capacity Mode', type: 'select', options: ['on-demand', 'provisioned'], defaultValue: 'on-demand' },
      { key: 'read_capacity', label: 'Read Capacity', type: 'number', defaultValue: 5 },
    ],
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
  },

  // --- Caching ---
  {
    key: 'redis',
    label: 'Redis',
    category: 'Caching',
    icon: 'MemoryStick',
    description: 'In-memory cache and data store',
    defaultConfig: { memory: '6GB', ttl: 3600 },
    configFields: [
      { key: 'memory', label: 'Memory', type: 'select', options: ['1GB', '2GB', '4GB', '6GB', '16GB', '32GB'], defaultValue: '6GB' },
      { key: 'ttl', label: 'Default TTL (s)', type: 'number', defaultValue: 3600 },
    ],
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
    primaryFields: ['memory', 'eviction_policy'],
  },

  // --- Search & Analytics ---
  {
    key: 'elasticsearch',
    label: 'Elasticsearch',
    category: 'Search & Analytics',
    icon: 'Search',
    description: 'Elasticsearch full-text search engine',
    defaultConfig: { nodes: 3, storage: '500GB' },
    configFields: [
      { key: 'nodes', label: 'Nodes', type: 'number', defaultValue: 3 },
      { key: 'storage', label: 'Storage', type: 'select', options: ['100GB', '500GB', '1TB', '5TB'], defaultValue: '500GB' },
    ],
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
  },
  {
    key: 'data_warehouse',
    label: 'Data Warehouse',
    category: 'Search & Analytics',
    icon: 'Warehouse',
    description: 'Data warehouse / OLAP system',
    defaultConfig: { storage: '1TB', compute: 'Medium' },
    configFields: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['500GB', '1TB', '5TB', '10TB'], defaultValue: '1TB' },
      { key: 'compute', label: 'Compute', type: 'select', options: ['Small', 'Medium', 'Large', 'X-Large'], defaultValue: 'Medium' },
    ],
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
  },

  // --- ML / AI ---
  {
    key: 'ml_model',
    label: 'ML Model',
    category: 'ML / AI',
    icon: 'Brain',
    description: 'ML model serving endpoint',
    defaultConfig: { framework: 'PyTorch', accelerator: 'GPU' },
    configFields: [
      { key: 'framework', label: 'Framework', type: 'select', options: ['PyTorch', 'TensorFlow', 'ONNX', 'Custom'], defaultValue: 'PyTorch' },
      { key: 'accelerator', label: 'Accelerator', type: 'select', options: ['CPU', 'GPU', 'TPU'], defaultValue: 'GPU' },
    ],
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
  },
  {
    key: 'vector_db',
    label: 'Vector Database',
    category: 'ML / AI',
    icon: 'Waypoints',
    description: 'Vector database for embeddings',
    defaultConfig: { dimensions: 1536, index_type: 'HNSW' },
    configFields: [
      { key: 'dimensions', label: 'Dimensions', type: 'number', defaultValue: 1536 },
      { key: 'index_type', label: 'Index Type', type: 'select', options: ['HNSW', 'IVF', 'Flat'], defaultValue: 'HNSW' },
    ],
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
  },

  // --- Observability ---
  {
    key: 'logging',
    label: 'Logging',
    category: 'Observability',
    icon: 'FileText',
    description: 'Centralized logging (ELK, Datadog)',
    defaultConfig: { retention: '30d', storage: '500GB' },
    configFields: [
      { key: 'retention', label: 'Retention', type: 'select', options: ['7d', '30d', '90d', '1y'], defaultValue: '30d' },
      { key: 'storage', label: 'Storage', type: 'select', options: ['100GB', '500GB', '1TB', '5TB'], defaultValue: '500GB' },
    ],
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
  },
  {
    key: 'metrics',
    label: 'Metrics',
    category: 'Observability',
    icon: 'Activity',
    description: 'Metrics & monitoring (Prometheus, Grafana)',
    defaultConfig: { scrape_interval: 15, retention: '30d' },
    configFields: [
      { key: 'scrape_interval', label: 'Scrape Interval (s)', type: 'number', defaultValue: 15 },
      { key: 'retention', label: 'Retention', type: 'select', options: ['7d', '30d', '90d', '1y'], defaultValue: '30d' },
    ],
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
  },

  // --- Messaging ---
  {
    key: 'kafka',
    label: 'Kafka',
    category: 'Messaging',
    icon: 'ArrowRightLeft',
    description: 'Distributed event streaming platform',
    defaultConfig: { partitions: 6, retention: '7d' },
    configFields: [
      { key: 'partitions', label: 'Partitions', type: 'number', defaultValue: 6 },
      { key: 'retention', label: 'Retention', type: 'select', options: ['1d', '3d', '7d', '14d', '30d'], defaultValue: '7d' },
    ],
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
  },
  {
    key: 'websocket',
    label: 'WebSocket Server',
    category: 'Messaging',
    icon: 'Plug',
    description: 'Real-time bidirectional communication',
    defaultConfig: { max_connections: 10000 },
    configFields: [
      { key: 'max_connections', label: 'Max Connections', type: 'number', defaultValue: 10000 },
    ],
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
  },
  {
    key: 'message_queue',
    label: 'Message Queue',
    category: 'Messaging',
    icon: 'Inbox',
    description: 'General message queue (RabbitMQ, SQS)',
    defaultConfig: { queue_type: 'RabbitMQ', max_size: 10000 },
    configFields: [
      { key: 'queue_type', label: 'Queue Type', type: 'select', options: ['RabbitMQ', 'SQS', 'Azure Queue'], defaultValue: 'RabbitMQ' },
      { key: 'max_size', label: 'Max Size', type: 'number', defaultValue: 10000 },
    ],
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
  },

  // --- External ---
  {
    key: 'external_api',
    label: 'External API',
    category: 'External',
    icon: 'ExternalLink',
    description: 'Third-party API dependency',
    defaultConfig: { timeout: 5000 },
    configFields: [
      { key: 'base_url', label: 'Base URL', type: 'text', defaultValue: 'https://api.example.com' },
      { key: 'timeout', label: 'Timeout (ms)', type: 'number', defaultValue: 5000 },
    ],
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
  },
  {
    key: 'payment_gateway',
    label: 'Payment Gateway',
    category: 'External',
    icon: 'CreditCard',
    description: 'Payment processor (Stripe, PayPal)',
    defaultConfig: { provider: 'Stripe' },
    configFields: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['Stripe', 'PayPal', 'Square', 'Braintree'], defaultValue: 'Stripe' },
      { key: 'mode', label: 'Mode', type: 'select', options: ['test', 'live'], defaultValue: 'test' },
    ],
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
  },
  {
    key: 'auth_provider',
    label: 'Auth Provider',
    category: 'External',
    icon: 'Shield',
    description: 'Auth/identity provider (OAuth, Auth0)',
    defaultConfig: { provider: 'Auth0', protocol: 'OAuth2' },
    configFields: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['Auth0', 'Okta', 'Firebase', 'Cognito'], defaultValue: 'Auth0' },
      { key: 'protocol', label: 'Protocol', type: 'select', options: ['OAuth2', 'SAML', 'OpenID'], defaultValue: 'OAuth2' },
    ],
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
  },
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
