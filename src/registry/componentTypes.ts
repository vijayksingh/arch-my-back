import type { ComponentTypeConfig } from '@/types';

export const componentTypes: ComponentTypeConfig[] = [
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

  // --- Storage ---
  {
    key: 'postgres',
    label: 'PostgreSQL',
    category: 'Storage',
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
    category: 'Storage',
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
