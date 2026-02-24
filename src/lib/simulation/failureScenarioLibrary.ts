/**
 * Failure Scenario Library
 *
 * Pre-built failure scenarios for educational simulation.
 * Each scenario represents a realistic system failure with:
 * - Learning objectives (what the user will understand)
 * - Detailed explanation of what happens
 * - Actionable hints for fixing/preventing the issue
 */

import type { FailureScenario, EducationalHint } from '@/types/simulation';

/**
 * A pre-defined failure scenario with metadata for the scenario picker UI.
 */
export interface ScenarioDefinition {
  id: string;
  label: string;
  description: string;
  category: 'availability' | 'performance' | 'resilience' | 'scalability';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string; // lucide icon name
  learningObjectives: string[];
  whatHappens: string;
  createScenario: (nodeId: string) => FailureScenario;
  educationalHint: (nodeId: string) => EducationalHint;
}

/**
 * Pre-built failure scenarios organized by difficulty.
 */
export const SCENARIO_LIBRARY: ScenarioDefinition[] = [
  // ============================================================================
  // BEGINNER SCENARIOS (3)
  // ============================================================================
  {
    id: 'kill-database',
    label: 'Kill Database',
    description: 'Primary database crashes instantly',
    category: 'availability',
    difficulty: 'beginner',
    icon: 'flame',
    learningObjectives: [
      'Understand cascading failures',
      'Learn circuit breaker pattern',
      'Recognize single points of failure',
    ],
    whatHappens:
      'The primary database crashes instantly. All services that depend on it will start timing out within seconds. Queues will fill up as requests have nowhere to go, leading to a cascading failure across the system.',
    createScenario: (nodeId: string): FailureScenario => ({
      id: `kill-database-${nodeId}-${Date.now()}`,
      type: 'cascading_failure',
      severity: 'critical',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [], // engine computes downstream
      detectedAt: 0, // set by engine
      message: `Database ${nodeId} has crashed. All dependent services are failing.`,
      suggestedPattern: 'Circuit Breaker + Read Replicas',
      metrics: {
        errorRate: 100,
        throughput: 0,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-kill-database-${nodeId}`,
      type: 'failure_explanation',
      title: 'Database Failure: Cascading Impact',
      message: `When a critical database fails, it triggers a cascading failure. Services timeout waiting for responses, queues fill up, and eventually the entire system becomes unresponsive. This is a classic single point of failure.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Add read replicas for redundancy and circuit breakers to prevent cascading timeouts.',
      learnMoreUrl: 'https://martinfowler.com/bliki/CircuitBreaker.html',
    }),
  },

  {
    id: 'traffic-spike',
    label: 'Traffic Spike',
    description: 'Sudden 10x increase in request rate',
    category: 'scalability',
    difficulty: 'beginner',
    icon: 'trending-up',
    learningObjectives: [
      'Understand load saturation',
      'Learn auto-scaling strategies',
      'Recognize queue buildup patterns',
    ],
    whatHappens:
      "Incoming request rate suddenly jumps to 10x normal. The target service can't process requests fast enough, causing its queue to fill rapidly. Latency spikes as requests wait longer and longer.",
    createScenario: (nodeId: string): FailureScenario => ({
      id: `traffic-spike-${nodeId}-${Date.now()}`,
      type: 'bottleneck',
      severity: 'error',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [],
      detectedAt: 0,
      message: `Traffic spike detected at ${nodeId}. Queue is filling rapidly, latency is increasing.`,
      suggestedPattern: 'Auto-scaling + Load Balancer + Rate Limiting',
      metrics: {
        queueDepth: 1000,
        latency: 5000,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-traffic-spike-${nodeId}`,
      type: 'pattern_opportunity',
      title: 'Traffic Spike: Horizontal Scaling Needed',
      message: `A traffic spike overwhelms a single instance. The queue fills faster than it drains, causing latency to increase exponentially. This is a clear sign that you need horizontal scaling and load balancing.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Add auto-scaling to dynamically increase capacity, and a load balancer to distribute traffic.',
      learnMoreUrl: 'https://aws.amazon.com/architecture/well-architected/',
    }),
  },

  {
    id: 'slow-dependency',
    label: 'Slow Dependency',
    description: 'Service responds 10x slower than normal',
    category: 'performance',
    difficulty: 'beginner',
    icon: 'timer',
    learningObjectives: [
      'Understand timeout configuration',
      'Learn async processing patterns',
      'Recognize latency propagation',
    ],
    whatHappens:
      "The target service starts responding 10x slower than normal, but doesn't crash. Upstream services keep sending requests at normal rate, causing thread pool exhaustion and latency to propagate upstream.",
    createScenario: (nodeId: string): FailureScenario => ({
      id: `slow-dependency-${nodeId}-${Date.now()}`,
      type: 'timeout',
      severity: 'warning',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [],
      detectedAt: 0,
      message: `${nodeId} is responding very slowly. Upstream services are experiencing timeout failures.`,
      suggestedPattern: 'Timeouts + Async Processing + Bulkhead Pattern',
      metrics: {
        latency: 10000,
        errorRate: 25,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-slow-dependency-${nodeId}`,
      type: 'best_practice',
      title: 'Slow Dependency: Set Aggressive Timeouts',
      message: `When a dependency slows down, it can tie up threads in upstream services. Without timeouts, threads wait indefinitely, eventually exhausting the thread pool. Always set aggressive timeouts and use async processing where possible.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Configure timeouts, use async request handling, and isolate slow dependencies with the bulkhead pattern.',
    }),
  },

  // ============================================================================
  // INTERMEDIATE SCENARIOS (4)
  // ============================================================================
  {
    id: 'network-partition',
    label: 'Network Partition',
    description: 'Service isolated from dependencies',
    category: 'resilience',
    difficulty: 'intermediate',
    icon: 'unplug',
    learningObjectives: [
      'Understand CAP theorem implications',
      'Learn retry with backoff',
      'Recognize split-brain scenarios',
    ],
    whatHappens:
      'A network partition isolates the target service from its downstream dependencies. It can still receive requests but cannot reach the services it depends on. All outgoing calls fail immediately.',
    createScenario: (nodeId: string): FailureScenario => ({
      id: `network-partition-${nodeId}-${Date.now()}`,
      type: 'timeout',
      severity: 'error',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [],
      detectedAt: 0,
      message: `Network partition detected. ${nodeId} cannot reach its dependencies.`,
      suggestedPattern: 'Retry with Exponential Backoff + Circuit Breaker',
      metrics: {
        errorRate: 100,
        connectionFailures: 50,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-network-partition-${nodeId}`,
      type: 'failure_explanation',
      title: 'Network Partition: CAP Theorem in Action',
      message: `Network partitions are inevitable in distributed systems. During a partition, you must choose between consistency and availability (CAP theorem). Retries with exponential backoff prevent overwhelming the network when it recovers.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Implement retry logic with exponential backoff, circuit breakers to fail fast, and graceful degradation strategies.',
      learnMoreUrl: 'https://en.wikipedia.org/wiki/CAP_theorem',
    }),
  },

  {
    id: 'memory-leak',
    label: 'Memory Leak',
    description: 'Service gradually runs out of memory',
    category: 'availability',
    difficulty: 'intermediate',
    icon: 'memory-stick',
    learningObjectives: [
      'Understand resource exhaustion',
      'Learn health check patterns',
      'Recognize gradual degradation',
    ],
    whatHappens:
      'The service develops a memory leak. Performance gradually degrades over 30 seconds as garbage collection pauses increase. Eventually, the service runs out of memory and crashes.',
    createScenario: (nodeId: string): FailureScenario => ({
      id: `memory-leak-${nodeId}-${Date.now()}`,
      type: 'resource_exhaustion',
      severity: 'error',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [],
      detectedAt: 0,
      message: `Memory leak detected in ${nodeId}. Performance degrading, crash imminent.`,
      suggestedPattern: 'Health Checks + Auto-restart + Resource Limits',
      metrics: {
        memoryUsage: 98,
        gcPauses: 500,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-memory-leak-${nodeId}`,
      type: 'failure_explanation',
      title: 'Memory Leak: Gradual Resource Exhaustion',
      message: `Memory leaks cause gradual degradation. As memory fills, garbage collection pauses increase, slowing down request processing. Eventually, the process crashes with an out-of-memory error. Health checks can detect this before it becomes critical.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Implement health checks that monitor memory usage, set resource limits, and configure auto-restart on unhealthy state.',
    }),
  },

  {
    id: 'queue-overflow',
    label: 'Queue Overflow',
    description: 'Internal queue exceeds maximum capacity',
    category: 'performance',
    difficulty: 'intermediate',
    icon: 'layers',
    learningObjectives: [
      'Understand backpressure mechanisms',
      'Learn message queue patterns',
      'Recognize producer-consumer imbalance',
    ],
    whatHappens:
      "The service's internal request queue exceeds its maximum capacity. New incoming requests are rejected with errors. The producer continues sending at full rate, causing sustained request dropping.",
    createScenario: (nodeId: string): FailureScenario => ({
      id: `queue-overflow-${nodeId}-${Date.now()}`,
      type: 'queue_overflow',
      severity: 'error',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [],
      detectedAt: 0,
      message: `Queue overflow at ${nodeId}. New requests are being rejected.`,
      suggestedPattern: 'Backpressure + Message Queue + Rate Limiting',
      metrics: {
        queueDepth: 10000,
        maxQueueDepth: 10000,
        droppedRequests: 500,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-queue-overflow-${nodeId}`,
      type: 'pattern_opportunity',
      title: 'Queue Overflow: Implement Backpressure',
      message: `When a queue overflows, it means the producer is sending faster than the consumer can process. Without backpressure, requests are dropped. Implement backpressure to slow down producers, or use a message queue with persistence to buffer requests.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Implement backpressure signals to slow down upstream producers, use a persistent message queue, or add rate limiting.',
    }),
  },

  {
    id: 'connection-pool-exhaustion',
    label: 'Connection Pool Exhaustion',
    description: 'All database connections in use',
    category: 'performance',
    difficulty: 'intermediate',
    icon: 'database',
    learningObjectives: [
      'Understand connection pooling',
      'Learn pool sizing strategies',
      'Recognize connection leak patterns',
    ],
    whatHappens:
      'All database connections in the pool are in use. New requests that need a database connection must wait. If wait times exceed the connection timeout, requests fail with connection errors.',
    createScenario: (nodeId: string): FailureScenario => ({
      id: `connection-pool-exhaustion-${nodeId}-${Date.now()}`,
      type: 'resource_exhaustion',
      severity: 'error',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [],
      detectedAt: 0,
      message: `Connection pool exhausted at ${nodeId}. New requests are timing out waiting for connections.`,
      suggestedPattern: 'Connection Pool Sizing + Leak Detection + Timeouts',
      metrics: {
        activeConnections: 50,
        maxConnections: 50,
        waitingRequests: 100,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-connection-pool-exhaustion-${nodeId}`,
      type: 'best_practice',
      title: 'Connection Pool Exhaustion: Tune Pool Size',
      message: `Connection pool exhaustion happens when all connections are in use and new requests must wait. This can be caused by a pool that's too small, connection leaks, or long-running queries. Monitor pool usage and tune pool size based on actual traffic patterns.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Increase pool size, detect and fix connection leaks, set query timeouts, and monitor pool utilization metrics.',
    }),
  },

  // ============================================================================
  // ADVANCED SCENARIOS (3)
  // ============================================================================
  {
    id: 'cascading-timeout',
    label: 'Cascading Timeout',
    description: 'Timeout propagates up the call chain',
    category: 'resilience',
    difficulty: 'advanced',
    icon: 'zap',
    learningObjectives: [
      'Understand timeout propagation',
      'Learn bulkhead pattern',
      'Recognize thread pool starvation',
    ],
    whatHappens:
      "One downstream service slows down. Its callers start timing out, tying up threads. Those callers' callers also time out, propagating the failure up the chain. The entire request path becomes unavailable.",
    createScenario: (nodeId: string): FailureScenario => ({
      id: `cascading-timeout-${nodeId}-${Date.now()}`,
      type: 'cascading_failure',
      severity: 'critical',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [],
      detectedAt: 0,
      message: `Cascading timeout failure. ${nodeId} is slow, causing upstream services to exhaust thread pools.`,
      suggestedPattern: 'Bulkhead Pattern + Separate Thread Pools + Timeout Budgets',
      metrics: {
        latency: 30000,
        threadPoolUtilization: 100,
        errorRate: 80,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-cascading-timeout-${nodeId}`,
      type: 'failure_explanation',
      title: 'Cascading Timeout: Thread Pool Starvation',
      message: `When a slow service ties up threads waiting for timeouts, it can exhaust the thread pool. Upstream services then also timeout, propagating the failure. The bulkhead pattern isolates thread pools so one slow dependency can't take down the entire system.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Use the bulkhead pattern to isolate thread pools for different dependencies, set timeout budgets, and fail fast.',
      learnMoreUrl: 'https://resilience4j.readme.io/docs/bulkhead',
    }),
  },

  {
    id: 'split-brain',
    label: 'Split Brain',
    description: 'Two instances believe they are primary',
    category: 'resilience',
    difficulty: 'advanced',
    icon: 'cloud-off',
    learningObjectives: [
      'Understand distributed consensus',
      'Learn leader election',
      'Recognize data inconsistency risks',
    ],
    whatHappens:
      'A network partition causes two instances of the service to both believe they are the primary. Each processes writes independently, creating conflicting data. When the partition heals, data is inconsistent.',
    createScenario: (nodeId: string): FailureScenario => ({
      id: `split-brain-${nodeId}-${Date.now()}`,
      type: 'circuit_breaker_open',
      severity: 'critical',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [],
      detectedAt: 0,
      message: `Split-brain scenario at ${nodeId}. Multiple primaries detected, data inconsistency likely.`,
      suggestedPattern: 'Leader Election (Raft/Paxos) + Quorum Writes',
      metrics: {
        primaryCount: 2,
        dataConflicts: 15,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-split-brain-${nodeId}`,
      type: 'failure_explanation',
      title: 'Split Brain: Distributed Consensus Required',
      message: `Split-brain occurs when multiple nodes believe they are the primary, often due to network partitions. This causes data conflicts and inconsistency. Use consensus algorithms like Raft or Paxos for leader election, and require quorum for writes.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Implement distributed consensus (Raft/Paxos) for leader election, require quorum-based writes, and have a conflict resolution strategy.',
      learnMoreUrl: 'https://raft.github.io/',
    }),
  },

  {
    id: 'thundering-herd',
    label: 'Thundering Herd',
    description: 'Cache expires, all requests hit DB',
    category: 'scalability',
    difficulty: 'advanced',
    icon: 'server-crash',
    learningObjectives: [
      'Understand cache stampede',
      'Learn cache warming strategies',
      'Recognize load amplification',
    ],
    whatHappens:
      "A frequently-accessed cache key expires. Hundreds of requests simultaneously miss the cache and hit the database directly. The database can't handle the sudden load spike and becomes a bottleneck.",
    createScenario: (nodeId: string): FailureScenario => ({
      id: `thundering-herd-${nodeId}-${Date.now()}`,
      type: 'bottleneck',
      severity: 'critical',
      rootCauseNodeId: nodeId,
      affectedNodeIds: [],
      detectedAt: 0,
      message: `Thundering herd at ${nodeId}. Cache miss caused load spike, database is overwhelmed.`,
      suggestedPattern: 'Cache Warming + Request Coalescing + Staggered TTLs',
      metrics: {
        cacheMissRate: 100,
        databaseLoad: 1000,
        latency: 15000,
      },
    }),
    educationalHint: (nodeId: string): EducationalHint => ({
      id: `hint-thundering-herd-${nodeId}`,
      type: 'pattern_opportunity',
      title: 'Thundering Herd: Prevent Cache Stampede',
      message: `When a hot cache key expires, all concurrent requests miss and hit the database simultaneously, causing a stampede. Prevent this with cache warming (refresh before expiry), request coalescing (only one request fetches on miss), or staggered TTLs.`,
      relatedNodeIds: [nodeId],
      actionSuggestion: 'Implement cache warming to refresh before expiry, use request coalescing to prevent duplicate fetches, or stagger cache TTLs.',
    }),
  },
];
