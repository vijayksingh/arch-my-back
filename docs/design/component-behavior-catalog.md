# Component Behavior Catalog

**Version**: 1.0
**Date**: 2026-02-24

TypeScript interface definitions for all behavior models with complete type safety.

---

## Core Behavior Interfaces

### Base Behavior Model

```typescript
/**
 * Base interface for all behavior models
 */
interface BehaviorModel {
  readonly modelType: 'simple' | 'queue-theory' | 'advanced';
  readonly version: string;
}

/**
 * Result types for behavior calculations
 */
interface ThroughputResult {
  throughput: number;      // Actual processed req/sec
  overflow: number;        // Excess req/sec (queue buildup rate)
  utilization: number;     // 0.0-1.0+ (can exceed 1.0)
  queueGrowthRate: number; // req/sec being added to queue
}

interface LatencyResult {
  totalLatency: number;    // ms
  baseLatency: number;     // ms (service time)
  queueDelay: number;      // ms (waiting time)
  networkDelay: number;    // ms (edge latencies)
  breakdown: LatencyBreakdown;
}

interface LatencyBreakdown {
  base: number;
  queue: number;
  network: number;
  percentages: {
    base: number;      // % of total
    queue: number;     // % of total
    network: number;   // % of total
  };
}

type HealthState = 'HEALTHY' | 'DEGRADED' | 'STRESSED' | 'FAILING';

interface UtilizationResult {
  utilization: number;        // 0.0-1.0+
  healthState: HealthState;
  queueGrowing: boolean;
  recommendation: string;     // Human-readable health advice
}
```

---

## MVP Behavior Models

### Simple Throughput Model

```typescript
interface SimpleThroughputModel extends BehaviorModel {
  modelType: 'simple';

  /**
   * Calculate effective throughput considering capacity constraints
   *
   * Formula: throughput = min(incoming_load, node_capacity)
   *
   * @param incomingLoad - Sum of all incoming edge flows [req/sec]
   * @param nodeCapacity - Maximum throughput capacity [req/sec]
   * @returns Throughput calculation results
   */
  calculateThroughput(
    incomingLoad: number,
    nodeCapacity: number
  ): ThroughputResult;

  /**
   * Validate inputs for throughput calculation
   * @throws {Error} if inputs are invalid
   */
  validateInputs(incomingLoad: number, nodeCapacity: number): void;
}

// Example implementation signature
class SimpleThroughputModelImpl implements SimpleThroughputModel {
  readonly modelType = 'simple' as const;
  readonly version = '1.0.0';

  calculateThroughput(
    incomingLoad: number,
    nodeCapacity: number
  ): ThroughputResult {
    this.validateInputs(incomingLoad, nodeCapacity);

    const throughput = Math.min(incomingLoad, nodeCapacity);
    const overflow = Math.max(0, incomingLoad - nodeCapacity);
    const utilization = throughput / nodeCapacity;
    const queueGrowthRate = overflow;

    return {
      throughput,
      overflow,
      utilization,
      queueGrowthRate,
    };
  }

  validateInputs(incomingLoad: number, nodeCapacity: number): void {
    if (incomingLoad < 0) {
      throw new Error(`Invalid incomingLoad: ${incomingLoad} (must be >= 0)`);
    }
    if (nodeCapacity <= 0) {
      throw new Error(`Invalid nodeCapacity: ${nodeCapacity} (must be > 0)`);
    }
  }
}
```

---

### Simple Latency Model

```typescript
interface SimpleLatencyModel extends BehaviorModel {
  modelType: 'simple';

  /**
   * Calculate end-to-end request latency
   *
   * Formula: total = base + queue_delay + network_delay
   * Queue delay: (queue_depth / service_rate) × 1000
   *
   * @param baseLatency - Service time per request [ms]
   * @param queueDepth - Number of queued requests
   * @param serviceRate - Processing throughput [req/sec]
   * @param networkDelays - Edge latencies in request path [ms]
   * @returns Latency calculation with breakdown
   */
  calculateLatency(
    baseLatency: number,
    queueDepth: number,
    serviceRate: number,
    networkDelays: number[]
  ): LatencyResult;

  /**
   * Calculate queueing delay component
   */
  calculateQueueDelay(queueDepth: number, serviceRate: number): number;

  /**
   * Calculate network delay component
   */
  calculateNetworkDelay(edgeLatencies: number[]): number;
}

// Example implementation signature
class SimpleLatencyModelImpl implements SimpleLatencyModel {
  readonly modelType = 'simple' as const;
  readonly version = '1.0.0';

  calculateLatency(
    baseLatency: number,
    queueDepth: number,
    serviceRate: number,
    networkDelays: number[]
  ): LatencyResult {
    const queueDelay = this.calculateQueueDelay(queueDepth, serviceRate);
    const networkDelay = this.calculateNetworkDelay(networkDelays);
    const totalLatency = baseLatency + queueDelay + networkDelay;

    const percentages = {
      base: (baseLatency / totalLatency) * 100,
      queue: (queueDelay / totalLatency) * 100,
      network: (networkDelay / totalLatency) * 100,
    };

    return {
      totalLatency,
      baseLatency,
      queueDelay,
      networkDelay,
      breakdown: {
        base: baseLatency,
        queue: queueDelay,
        network: networkDelay,
        percentages,
      },
    };
  }

  calculateQueueDelay(queueDepth: number, serviceRate: number): number {
    if (serviceRate === 0) return 0;
    return (queueDepth / serviceRate) * 1000; // Convert to ms
  }

  calculateNetworkDelay(edgeLatencies: number[]): number {
    return edgeLatencies.reduce((sum, latency) => sum + latency, 0);
  }
}
```

---

### Simple Resource Utilization Model

```typescript
interface SimpleResourceUtilizationModel extends BehaviorModel {
  modelType: 'simple';

  /**
   * Calculate resource utilization and health state
   *
   * States:
   * - < 0.5: HEALTHY
   * - 0.5-0.8: DEGRADED
   * - 0.8-1.0: STRESSED
   * - >= 1.0: FAILING
   *
   * @param currentThroughput - Current processed req/sec
   * @param maxCapacity - Maximum capacity req/sec
   * @returns Utilization result with health state
   */
  calculateUtilization(
    currentThroughput: number,
    maxCapacity: number
  ): UtilizationResult;

  /**
   * Determine health state from utilization
   */
  getHealthState(utilization: number): HealthState;

  /**
   * Get actionable recommendation based on health
   */
  getRecommendation(healthState: HealthState, utilization: number): string;
}

// Example implementation signature
class SimpleResourceUtilizationModelImpl implements SimpleResourceUtilizationModel {
  readonly modelType = 'simple' as const;
  readonly version = '1.0.0';

  calculateUtilization(
    currentThroughput: number,
    maxCapacity: number
  ): UtilizationResult {
    const utilization = currentThroughput / maxCapacity;
    const healthState = this.getHealthState(utilization);
    const queueGrowing = utilization >= 1.0;
    const recommendation = this.getRecommendation(healthState, utilization);

    return {
      utilization,
      healthState,
      queueGrowing,
      recommendation,
    };
  }

  getHealthState(utilization: number): HealthState {
    if (utilization < 0.5) return 'HEALTHY';
    if (utilization < 0.8) return 'DEGRADED';
    if (utilization < 1.0) return 'STRESSED';
    return 'FAILING';
  }

  getRecommendation(healthState: HealthState, utilization: number): string {
    switch (healthState) {
      case 'HEALTHY':
        return 'System operating normally with good headroom';
      case 'DEGRADED':
        return 'Utilization elevated, monitor for traffic increases';
      case 'STRESSED':
        return `High utilization (${(utilization * 100).toFixed(1)}%), consider scaling`;
      case 'FAILING':
        return `At/over capacity (${(utilization * 100).toFixed(1)}%), queue growing - scale immediately`;
    }
  }
}
```

---

## Advanced Behavior Models

### Queue Theory Model (M/M/1)

```typescript
interface QueueTheoryModel extends BehaviorModel {
  modelType: 'queue-theory';

  /**
   * Calculate M/M/1 queue metrics
   *
   * Formulas:
   * - ρ = λ/μ (utilization)
   * - L = ρ/(1-ρ) (avg queue length)
   * - W = 1/(μ-λ) (avg wait time, seconds)
   *
   * @param arrivalRate - λ [req/sec]
   * @param serviceRate - μ [req/sec]
   * @returns Queue metrics
   * @throws {Error} if arrivalRate >= serviceRate (unstable queue)
   */
  calculateQueueMetrics(
    arrivalRate: number,
    serviceRate: number
  ): QueueMetrics;

  /**
   * Validate Little's Law: L = λW
   */
  validateLittlesLaw(L: number, lambda: number, W: number): boolean;

  /**
   * Check if queue is stable (λ < μ)
   */
  isStable(arrivalRate: number, serviceRate: number): boolean;
}

interface QueueMetrics {
  utilization: number;           // ρ = λ/μ
  averageQueueLength: number;    // L = ρ/(1-ρ)
  averageWaitTime: number;       // W = 1/(μ-λ) [seconds]
  averageQueueTime: number;      // Wq = ρ/(μ-λ) [seconds]
  averageSystemSize: number;     // L (same as averageQueueLength)
  stable: boolean;               // λ < μ
  trafficIntensity: number;      // ρ
}

// Example implementation signature
class QueueTheoryModelImpl implements QueueTheoryModel {
  readonly modelType = 'queue-theory' as const;
  readonly version = '1.0.0';

  calculateQueueMetrics(
    arrivalRate: number,
    serviceRate: number
  ): QueueMetrics {
    if (!this.isStable(arrivalRate, serviceRate)) {
      throw new Error(
        `Unstable queue: arrivalRate (${arrivalRate}) >= serviceRate (${serviceRate})`
      );
    }

    const rho = arrivalRate / serviceRate; // Utilization
    const L = rho / (1 - rho);
    const W = 1 / (serviceRate - arrivalRate);
    const Wq = rho / (serviceRate - arrivalRate);

    // Validate Little's Law
    if (!this.validateLittlesLaw(L, arrivalRate, W)) {
      console.warn('Little\'s Law validation failed');
    }

    return {
      utilization: rho,
      averageQueueLength: L,
      averageWaitTime: W,
      averageQueueTime: Wq,
      averageSystemSize: L,
      stable: true,
      trafficIntensity: rho,
    };
  }

  validateLittlesLaw(L: number, lambda: number, W: number): boolean {
    const tolerance = 0.01;
    const expected = lambda * W;
    return Math.abs(L - expected) < tolerance;
  }

  isStable(arrivalRate: number, serviceRate: number): boolean {
    return arrivalRate < serviceRate;
  }
}
```

---

### Backpressure Model

```typescript
interface BackpressureModel extends BehaviorModel {
  modelType: 'advanced';

  /**
   * Calculate backpressure signal when queue exceeds threshold
   *
   * Formula: clamp((queue_depth - threshold) / threshold, 0, 1)
   *
   * @param queueDepth - Current queue size
   * @param queueCapacity - Maximum queue size
   * @param threshold - Fraction of capacity to start signaling (e.g., 0.7)
   * @returns Backpressure signal [0.0-1.0]
   */
  calculateBackpressureSignal(
    queueDepth: number,
    queueCapacity: number,
    threshold: number
  ): number;

  /**
   * Adjust send rate based on backpressure
   *
   * Formula: rate × (1 - signal × damping)
   *
   * @param currentRate - Current send rate [req/sec]
   * @param backpressureSignal - Signal [0.0-1.0]
   * @param dampingFactor - How aggressively to reduce (e.g., 0.5)
   * @returns Adjusted send rate [req/sec]
   */
  adjustSendRate(
    currentRate: number,
    backpressureSignal: number,
    dampingFactor: number
  ): number;
}

interface BackpressureConfig {
  queueCapacity: number;
  threshold: number;       // 0.0-1.0 (fraction of capacity)
  dampingFactor: number;   // 0.0-1.0 (reduction aggressiveness)
}

// Example implementation signature
class BackpressureModelImpl implements BackpressureModel {
  readonly modelType = 'advanced' as const;
  readonly version = '1.0.0';

  calculateBackpressureSignal(
    queueDepth: number,
    queueCapacity: number,
    threshold: number
  ): number {
    const thresholdValue = queueCapacity * threshold;
    if (queueDepth <= thresholdValue) return 0;

    const signal = (queueDepth - thresholdValue) / thresholdValue;
    return Math.min(signal, 1.0); // Clamp to [0, 1]
  }

  adjustSendRate(
    currentRate: number,
    backpressureSignal: number,
    dampingFactor: number
  ): number {
    const reduction = backpressureSignal * dampingFactor;
    return currentRate * (1 - reduction);
  }
}
```

---

### Retry Model

```typescript
interface RetryModel extends BehaviorModel {
  modelType: 'advanced';

  /**
   * Calculate retry delay with exponential backoff
   *
   * Formula: min(base × 2^attempt, max) + jitter
   *
   * @param attempt - Retry attempt number (0-indexed)
   * @param baseDelay - Initial delay [ms]
   * @param maxDelay - Maximum delay cap [ms]
   * @param jitterFactor - Jitter randomness (e.g., 0.1 for 10%)
   * @returns Delay in milliseconds
   */
  calculateRetryDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    jitterFactor: number
  ): number;

  /**
   * Determine if retry should be attempted
   *
   * Checks retry budget: retries < 10% of original requests
   *
   * @param failureCount - Current failures in window
   * @param retryBudget - Max retries allowed in window
   * @param windowMs - Time window [ms]
   * @param currentTime - Current timestamp [ms]
   * @returns Whether to allow retry
   */
  shouldRetry(
    failureCount: number,
    retryBudget: number,
    windowMs: number,
    currentTime: number
  ): boolean;

  /**
   * Check retry budget constraint
   * Rule: retries < 10% of original requests
   */
  checkRetryBudget(
    originalRequests: number,
    retryCount: number
  ): boolean;
}

interface RetryConfig {
  baseDelay: number;        // ms
  maxDelay: number;         // ms
  maxAttempts: number;
  jitterFactor: number;     // 0.0-1.0
  retryBudgetPercent: number; // e.g., 0.1 for 10%
}

// Example implementation signature
class RetryModelImpl implements RetryModel {
  readonly modelType = 'advanced' as const;
  readonly version = '1.0.0';

  calculateRetryDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    jitterFactor: number
  ): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, maxDelay);
    const jitter = Math.random() * cappedDelay * jitterFactor;
    return Math.floor(cappedDelay + jitter);
  }

  shouldRetry(
    failureCount: number,
    retryBudget: number,
    windowMs: number,
    currentTime: number
  ): boolean {
    return failureCount < retryBudget;
  }

  checkRetryBudget(
    originalRequests: number,
    retryCount: number
  ): boolean {
    const maxRetries = originalRequests * 0.1; // 10% budget
    return retryCount < maxRetries;
  }
}
```

---

## Component-Specific Behaviors

### Load Balancer

```typescript
type LoadBalancingAlgorithm = 'round_robin' | 'least_connections' | 'weighted';

interface Backend {
  id: string;
  capacity: number;          // req/sec
  currentLoad: number;       // req/sec
  activeConnections: number;
  healthy: boolean;
  weight?: number;           // For weighted algorithms
  lastHealthCheck: number;   // timestamp
}

interface LoadBalancerBehavior {
  algorithm: LoadBalancingAlgorithm;
  healthCheckInterval: number; // ms

  /**
   * Distribute incoming load across healthy backends
   *
   * @param incomingLoad - Total incoming req/sec
   * @param backends - Available backends
   * @returns Map of backend ID to assigned load
   */
  distributeLoad(
    incomingLoad: number,
    backends: Backend[]
  ): Map<string, number>;

  /**
   * Filter out unhealthy backends
   */
  filterHealthyBackends(backends: Backend[]): Backend[];

  /**
   * Handle all backends down scenario
   */
  handleAllBackendsDown(): FailureResponse;

  /**
   * Round robin distribution
   */
  distributeRoundRobin(load: number, backends: Backend[]): Map<string, number>;

  /**
   * Least connections distribution
   */
  distributeLeastConnections(load: number, backends: Backend[]): Map<string, number>;

  /**
   * Weighted distribution
   */
  distributeWeighted(load: number, backends: Backend[]): Map<string, number>;
}

interface FailureResponse {
  statusCode: number;  // e.g., 503
  latency: number;     // ms (fast fail = 1ms)
  error: string;
}

// Example implementation signature
class LoadBalancerBehaviorImpl implements LoadBalancerBehavior {
  algorithm: LoadBalancingAlgorithm = 'round_robin';
  healthCheckInterval = 5000; // 5 seconds

  distributeLoad(
    incomingLoad: number,
    backends: Backend[]
  ): Map<string, number> {
    const healthy = this.filterHealthyBackends(backends);

    if (healthy.length === 0) {
      throw new Error('All backends unhealthy');
    }

    switch (this.algorithm) {
      case 'round_robin':
        return this.distributeRoundRobin(incomingLoad, healthy);
      case 'least_connections':
        return this.distributeLeastConnections(incomingLoad, healthy);
      case 'weighted':
        return this.distributeWeighted(incomingLoad, healthy);
    }
  }

  filterHealthyBackends(backends: Backend[]): Backend[] {
    return backends.filter(b => b.healthy);
  }

  handleAllBackendsDown(): FailureResponse {
    return {
      statusCode: 503,
      latency: 1, // Fast fail
      error: 'all_backends_unhealthy',
    };
  }

  distributeRoundRobin(load: number, backends: Backend[]): Map<string, number> {
    const loadPerBackend = load / backends.length;
    const distribution = new Map<string, number>();
    backends.forEach(b => distribution.set(b.id, loadPerBackend));
    return distribution;
  }

  distributeLeastConnections(load: number, backends: Backend[]): Map<string, number> {
    // Implementation: assign load to backends with fewest active connections
    // Simplified example - actual implementation would be more sophisticated
    const distribution = new Map<string, number>();
    const sorted = [...backends].sort((a, b) => a.activeConnections - b.activeConnections);
    sorted.forEach(b => distribution.set(b.id, load / backends.length));
    return distribution;
  }

  distributeWeighted(load: number, backends: Backend[]): Map<string, number> {
    const totalWeight = backends.reduce((sum, b) => sum + (b.weight || 1), 0);
    const distribution = new Map<string, number>();
    backends.forEach(b => {
      const weight = b.weight || 1;
      const fraction = weight / totalWeight;
      distribution.set(b.id, load * fraction);
    });
    return distribution;
  }
}
```

---

### Cache Behavior

```typescript
interface CacheBehavior {
  hitRatio: number;       // 0.0-1.0
  cacheLatency: number;   // ms (typically 1-5ms)
  ttl: number;            // seconds

  /**
   * Calculate effective latency with cache
   *
   * Formula: hit_ratio × cache_latency + (1 - hit_ratio) × (cache_latency + backend_latency)
   */
  calculateEffectiveLatency(
    cacheLatency: number,
    backendLatency: number,
    hitRatio: number
  ): number;

  /**
   * Calculate backend load reduction
   *
   * Formula: incoming_load × (1 - hit_ratio)
   */
  calculateBackendLoad(
    incomingLoad: number,
    hitRatio: number
  ): number;

  /**
   * Calculate throughput multiplier
   *
   * Formula: 1 / (1 - hit_ratio)
   */
  calculateThroughputMultiplier(hitRatio: number): number;

  /**
   * Simulate cache hit/miss for a request
   */
  simulateRequest(): { hit: boolean; latency: number };
}

interface CacheMetrics {
  hitRatio: number;
  effectiveLatency: number;
  backendLoad: number;
  throughputMultiplier: number;
  hitCount: number;
  missCount: number;
}

// Example implementation signature
class CacheBehaviorImpl implements CacheBehavior {
  hitRatio = 0.8;
  cacheLatency = 2;  // ms
  ttl = 300;         // 5 minutes

  calculateEffectiveLatency(
    cacheLatency: number,
    backendLatency: number,
    hitRatio: number
  ): number {
    const hitLatency = hitRatio * cacheLatency;
    const missLatency = (1 - hitRatio) * (cacheLatency + backendLatency);
    return hitLatency + missLatency;
  }

  calculateBackendLoad(
    incomingLoad: number,
    hitRatio: number
  ): number {
    return incomingLoad * (1 - hitRatio);
  }

  calculateThroughputMultiplier(hitRatio: number): number {
    return 1 / (1 - hitRatio);
  }

  simulateRequest(): { hit: boolean; latency: number } {
    const hit = Math.random() < this.hitRatio;
    return {
      hit,
      latency: hit ? this.cacheLatency : this.cacheLatency + 100, // Simplified
    };
  }
}
```

---

### Database Behavior

```typescript
interface DatabaseBehavior {
  connectionPoolSize: number;
  queryLatency: number;      // ms per query
  readReplicaCount: number;

  /**
   * Handle connection pool exhaustion
   */
  handlePoolExhaustion(
    queueDepth: number,
    throughput: number
  ): PoolExhaustionResult;

  /**
   * Scale read load across replicas
   */
  scaleReads(
    readLoad: number,
    replicaCount: number
  ): number;  // Load per replica

  /**
   * Calculate pool utilization
   */
  calculateUtilization(
    activeConnections: number,
    poolSize: number
  ): number;

  /**
   * Estimate wait time for connection
   */
  estimateConnectionWaitTime(
    queueDepth: number,
    throughput: number
  ): number;  // ms
}

interface PoolExhaustionResult {
  queueing: boolean;
  waitTime: number;  // ms
  poolUtilization: number;
}

// Example implementation signature
class DatabaseBehaviorImpl implements DatabaseBehavior {
  connectionPoolSize = 100;
  queryLatency = 50;  // ms
  readReplicaCount = 3;

  handlePoolExhaustion(
    queueDepth: number,
    throughput: number
  ): PoolExhaustionResult {
    const waitTime = this.estimateConnectionWaitTime(queueDepth, throughput);
    return {
      queueing: true,
      waitTime,
      poolUtilization: 1.0, // 100% when exhausted
    };
  }

  scaleReads(
    readLoad: number,
    replicaCount: number
  ): number {
    return readLoad / replicaCount;
  }

  calculateUtilization(
    activeConnections: number,
    poolSize: number
  ): number {
    return activeConnections / poolSize;
  }

  estimateConnectionWaitTime(
    queueDepth: number,
    throughput: number
  ): number {
    if (throughput === 0) return 0;
    return (queueDepth / throughput) * 1000; // Convert to ms
  }
}
```

---

### Circuit Breaker Behavior

```typescript
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerBehavior {
  state: CircuitState;
  errorThreshold: number;      // 0.0-1.0 (e.g., 0.5 = 50%)
  openDuration: number;        // ms
  halfOpenRequests: number;    // Test requests in HALF_OPEN state

  /**
   * Determine if request should be allowed
   */
  shouldAllowRequest(): boolean;

  /**
   * Record successful request
   */
  recordSuccess(): void;

  /**
   * Record failed request
   */
  recordFailure(): void;

  /**
   * Fast fail when circuit is OPEN
   */
  fastFail(): FastFailResponse;

  /**
   * Calculate error rate from sliding window
   */
  calculateErrorRate(
    errors: number,
    total: number
  ): number;

  /**
   * Transition circuit state
   */
  transitionState(newState: CircuitState): void;
}

interface FastFailResponse {
  latency: number;      // 1ms (immediate)
  error: string;        // 'circuit_open'
  statusCode: number;   // 503
}

interface CircuitBreakerMetrics {
  state: CircuitState;
  errorRate: number;
  requestCount: number;
  errorCount: number;
  successCount: number;
  lastStateChange: number;  // timestamp
}

// Example implementation signature
class CircuitBreakerBehaviorImpl implements CircuitBreakerBehavior {
  state: CircuitState = 'CLOSED';
  errorThreshold = 0.5;     // 50%
  openDuration = 30000;     // 30 seconds
  halfOpenRequests = 3;

  private errorCount = 0;
  private totalCount = 0;
  private lastStateChange = Date.now();

  shouldAllowRequest(): boolean {
    switch (this.state) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        // Check if open duration elapsed
        if (Date.now() - this.lastStateChange > this.openDuration) {
          this.transitionState('HALF_OPEN');
          return true; // Allow test request
        }
        return false;
      case 'HALF_OPEN':
        return this.totalCount < this.halfOpenRequests;
    }
  }

  recordSuccess(): void {
    this.totalCount++;

    if (this.state === 'HALF_OPEN') {
      // All test requests succeeded, close circuit
      if (this.totalCount >= this.halfOpenRequests) {
        this.transitionState('CLOSED');
      }
    }
  }

  recordFailure(): void {
    this.errorCount++;
    this.totalCount++;

    const errorRate = this.calculateErrorRate(this.errorCount, this.totalCount);

    if (this.state === 'CLOSED' && errorRate > this.errorThreshold) {
      this.transitionState('OPEN');
    } else if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN → back to OPEN
      this.transitionState('OPEN');
    }
  }

  fastFail(): FastFailResponse {
    return {
      latency: 1,
      error: 'circuit_open',
      statusCode: 503,
    };
  }

  calculateErrorRate(errors: number, total: number): number {
    if (total === 0) return 0;
    return errors / total;
  }

  transitionState(newState: CircuitState): void {
    this.state = newState;
    this.lastStateChange = Date.now();

    if (newState === 'CLOSED' || newState === 'HALF_OPEN') {
      // Reset counters
      this.errorCount = 0;
      this.totalCount = 0;
    }
  }
}
```

---

## Plugin Architecture

### Behavior Model Registry

```typescript
/**
 * Plugin system for registering behavior models
 */
class BehaviorModelRegistry {
  private models = new Map<string, BehaviorModel>();

  /**
   * Register a behavior model
   */
  register(name: string, model: BehaviorModel): void {
    if (this.models.has(name)) {
      throw new Error(`Model already registered: ${name}`);
    }
    this.models.set(name, model);
  }

  /**
   * Get a registered model
   */
  get(name: string): BehaviorModel | undefined {
    return this.models.get(name);
  }

  /**
   * Check if model is registered
   */
  has(name: string): boolean {
    return this.models.has(name);
  }

  /**
   * List all registered models
   */
  list(): string[] {
    return Array.from(this.models.keys());
  }
}

// Global registry instance
export const behaviorRegistry = new BehaviorModelRegistry();

// Usage:
behaviorRegistry.register('simple-throughput', new SimpleThroughputModelImpl());
behaviorRegistry.register('queue-theory', new QueueTheoryModelImpl());
behaviorRegistry.register('backpressure', new BackpressureModelImpl());
```

---

## Type Exports

```typescript
// Export all interfaces for use in simulation engine
export {
  // Base types
  BehaviorModel,
  ThroughputResult,
  LatencyResult,
  UtilizationResult,
  HealthState,

  // MVP models
  SimpleThroughputModel,
  SimpleLatencyModel,
  SimpleResourceUtilizationModel,

  // Advanced models
  QueueTheoryModel,
  QueueMetrics,
  BackpressureModel,
  BackpressureConfig,
  RetryModel,
  RetryConfig,

  // Component behaviors
  LoadBalancerBehavior,
  Backend,
  LoadBalancingAlgorithm,
  CacheBehavior,
  CacheMetrics,
  DatabaseBehavior,
  PoolExhaustionResult,
  CircuitBreakerBehavior,
  CircuitState,
  CircuitBreakerMetrics,

  // Utilities
  BehaviorModelRegistry,
  behaviorRegistry,
};
```

---

**Last Updated**: 2026-02-24
**Maintainer**: Keep interfaces synchronized with behavior-modeling-specification.md
