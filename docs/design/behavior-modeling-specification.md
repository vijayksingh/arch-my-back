# Behavior Modeling Specification

**Version**: 1.0
**Date**: 2026-02-24
**Status**: Design Draft

## Overview

This document specifies how the system models real-world distributed system behaviors during simulation. The design starts with simple, practical models (MVP) while providing clear extensibility for advanced behaviors (queue theory, backpressure, retry logic).

**Core Principle**: Models must reflect reality using industry-standard formulas, not arbitrary heuristics.

## Design Philosophy

### Start Simple, Scale Complex

- **MVP**: Throughput, latency, and resource utilization models that "just work"
- **Extensible**: Plugin architecture to add queue theory, backpressure, retries WITHOUT rewriting core engine
- **Grounded**: Every formula cites real-world sources (Little's Law, M/M/1 queues, etc.)

### Model Hierarchy

```
BehaviorModel (interface)
├── SimpleBehaviorModel (MVP)
│   ├── ThroughputModel
│   ├── LatencyModel
│   └── ResourceUtilizationModel
└── AdvancedBehaviorModel (Future)
    ├── QueueTheoryModel (M/M/1, Little's Law)
    ├── BackpressureModel (TCP-like flow control)
    ├── RetryModel (exponential backoff, budgets)
    └── ComponentSpecificModel
        ├── LoadBalancerModel
        ├── CacheModel
        ├── DatabaseModel
        └── CircuitBreakerModel
```

---

## Part 1: MVP Behavior Models

### 1.1 Simple Throughput Model

**Purpose**: Calculate effective throughput considering capacity constraints.

**Formula**:
```
throughput = min(incoming_load, node_capacity)

Where:
- incoming_load = Σ(incoming_edge_flows) [req/sec]
- node_capacity = configured max throughput [req/sec]
- overflow = max(0, incoming_load - node_capacity)
```

**Behavior**:
- When `incoming_load ≤ node_capacity`: All requests processed, no queueing
- When `incoming_load > node_capacity`: Throughput capped at capacity, excess queues

**Implementation Notes**:
```typescript
interface ThroughputModel {
  calculateThroughput(incomingLoad: number, nodeCapacity: number): {
    throughput: number;      // Actual processed requests/sec
    overflow: number;        // Excess requests/sec (queue buildup rate)
    utilization: number;     // throughput / nodeCapacity
  };
}
```

**Validation Example**:
```
Input:
- Database capacity: 1000 req/sec
- Incoming load: 1500 req/sec

Expected Output:
- throughput: 1000 req/sec
- overflow: 500 req/sec
- utilization: 1.0 (100%)
```

### 1.2 Simple Latency Model

**Purpose**: Calculate end-to-end request latency including queueing delays.

**Formula**:
```
total_latency = base_latency + queue_delay + network_delay

Where:
- base_latency = service time per request [ms]
- queue_delay = (queue_depth × avg_service_time) / concurrent_workers
- network_delay = Σ(edge_latencies_in_request_path) [ms]
```

**Queueing Delay Calculation**:
```
queue_delay = (queue_depth / service_rate) × 1000  // Convert to ms

Where:
- queue_depth = number of requests waiting
- service_rate = throughput [req/sec]
```

**Implementation Notes**:
```typescript
interface LatencyModel {
  calculateLatency(
    baseLatency: number,      // ms
    queueDepth: number,       // requests
    serviceRate: number,      // req/sec
    networkDelays: number[]   // ms per edge
  ): {
    totalLatency: number;
    baseLatency: number;
    queueDelay: number;
    networkDelay: number;
  };
}
```

**Validation Example**:
```
Input:
- API base_latency: 50ms
- Queue depth: 10 requests
- Service rate: 20 req/sec (avg service time = 50ms)
- Network delays: [5ms, 10ms]

Calculation:
- queue_delay = (10 / 20) × 1000 = 500ms
- network_delay = 5 + 10 = 15ms
- total_latency = 50 + 500 + 15 = 565ms

Expected Output:
- totalLatency: 565ms
- queueDelay: 500ms (dominant factor)
```

### 1.3 Simple Resource Utilization Model

**Purpose**: Classify node health based on capacity utilization.

**Formula**:
```
utilization = current_throughput / max_capacity

States:
- utilization < 0.5        → HEALTHY (green)
- 0.5 ≤ utilization < 0.8  → DEGRADED (yellow)
- 0.8 ≤ utilization < 1.0  → STRESSED (orange)
- utilization ≥ 1.0        → FAILING (red, queue growing)
```

**Implementation Notes**:
```typescript
type HealthState = 'HEALTHY' | 'DEGRADED' | 'STRESSED' | 'FAILING';

interface ResourceUtilizationModel {
  calculateUtilization(currentThroughput: number, maxCapacity: number): {
    utilization: number;      // 0.0 - 1.0+
    healthState: HealthState;
    queueGrowing: boolean;
  };
}
```

**Rationale**:
- **< 50%**: Comfortable headroom for traffic spikes
- **50-80%**: Operating normally but less buffer
- **80-100%**: High risk zone, approaching capacity
- **≥ 100%**: At or over capacity, backlog accumulating

---

## Part 2: Future Behavior Models (Extensibility)

### 2.1 Queue Theory Model (M/M/1)

**Purpose**: Model queueing behavior using established queueing theory.

**Theoretical Foundation**:

**Little's Law**:
```
L = λW

Where:
- L = average number of requests in system (queue + service)
- λ = arrival rate [req/sec]
- W = average time in system [sec]
```

**M/M/1 Queue Formulas**:
```
Assumptions:
- Poisson arrivals (Markovian)
- Exponential service times (Markovian)
- Single server (1)

ρ = λ/μ  (traffic intensity / utilization)
Where:
- λ = arrival rate [req/sec]
- μ = service rate [req/sec]
- Stability condition: λ < μ (else queue explodes)

Average queue length:
L = ρ / (1 - ρ)

Average wait time:
W = 1 / (μ - λ)  [seconds]

Average time in queue (not including service):
Wq = ρ / (μ - λ)
```

**Implementation Interface**:
```typescript
interface QueueTheoryModel {
  /**
   * Calculate M/M/1 queue metrics
   * @throws Error if arrivalRate >= serviceRate (unstable queue)
   */
  calculateQueueMetrics(arrivalRate: number, serviceRate: number): {
    utilization: number;           // ρ = λ/μ
    averageQueueLength: number;    // L = ρ/(1-ρ)
    averageWaitTime: number;       // W = 1/(μ-λ) [seconds]
    averageQueueTime: number;      // Wq = ρ/(μ-λ) [seconds]
    stable: boolean;               // λ < μ
  };

  /**
   * Little's Law validation
   */
  validateLittlesLaw(L: number, lambda: number, W: number): boolean;
}
```

**Example Calculation**:
```
Input:
- Arrival rate (λ): 80 req/sec
- Service rate (μ): 100 req/sec

Calculation:
- ρ = 80/100 = 0.8
- L = 0.8/(1-0.8) = 4 requests average in system
- W = 1/(100-80) = 0.05 sec = 50ms average wait
- Wq = 0.8/(100-80) = 0.04 sec = 40ms average queue time

Validation (Little's Law):
- L = λW → 4 = 80 × 0.05 ✓
```

**Design Notes**:
- Plugin architecture: `registerBehaviorModel('queue-theory', QueueTheoryModel)`
- Falls back to simple model if not enabled
- Warns if arrival rate approaches service rate (ρ > 0.9)

### 2.2 Backpressure Model

**Purpose**: Model flow control mechanisms to prevent queue explosion.

**Inspired By**: TCP congestion control, gRPC flow control

**Concept**:
```
When queue depth exceeds threshold:
1. Send backpressure signal upstream
2. Upstream nodes reduce send rate
3. Prevents cascading queue buildup
```

**Formula**:
```
backpressure_signal = clamp((queue_depth - threshold) / threshold, 0, 1)

adjusted_send_rate = current_rate × (1 - backpressure_signal × damping_factor)

Where:
- damping_factor = 0.5 (reduce by 50% at max backpressure)
- threshold = queue capacity × 0.7 (start signaling at 70% full)
```

**Implementation Interface**:
```typescript
interface BackpressureModel {
  calculateBackpressureSignal(
    queueDepth: number,
    queueCapacity: number,
    threshold: number
  ): number;  // 0.0 (no pressure) to 1.0 (max pressure)

  adjustSendRate(
    currentRate: number,
    backpressureSignal: number,
    dampingFactor: number
  ): number;  // Reduced send rate
}
```

**Example**:
```
Input:
- Queue capacity: 1000 requests
- Threshold: 700 requests (70%)
- Current queue depth: 850 requests
- Current send rate: 1000 req/sec
- Damping factor: 0.5

Calculation:
- backpressure_signal = (850 - 700) / 700 = 0.214
- adjusted_send_rate = 1000 × (1 - 0.214 × 0.5) = 893 req/sec

Effect: Upstream reduces send rate by ~10.7%
```

### 2.3 Retry Logic Model

**Purpose**: Model retry behavior with exponential backoff and budgets.

**Best Practice**: Google SRE "retry budget" pattern

**Exponential Backoff**:
```
delay = min(base_delay × 2^attempt, max_delay) + jitter

Where:
- base_delay = initial retry delay (e.g., 100ms)
- attempt = retry attempt number (0-indexed)
- max_delay = cap to prevent excessive delays (e.g., 30s)
- jitter = random(0, delay × 0.1) to prevent thundering herd
```

**Retry Budget**:
```
budget = max_retries_per_window

Rule: retries < 10% of original requests in window
(Prevents retry storms that worsen outages)
```

**Implementation Interface**:
```typescript
interface RetryModel {
  calculateRetryDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    jitterFactor: number
  ): number;  // ms

  shouldRetry(
    failureCount: number,
    retryBudget: number,
    windowMs: number,
    currentTime: number
  ): boolean;

  /**
   * Prevent retry storms: retries must be < 10% of original requests
   */
  checkRetryBudget(
    originalRequests: number,
    retryCount: number
  ): boolean;
}
```

**Example**:
```
Exponential Backoff:
- Attempt 0: 100ms
- Attempt 1: 200ms
- Attempt 2: 400ms
- Attempt 3: 800ms
- Attempt 4: 1600ms
- Attempt 5: 3200ms (capped at max_delay if < 3200)

Retry Budget:
- Original requests in 1min: 6000 req
- Max allowed retries: 600 req (10%)
- If retry count reaches 600, stop retrying
```

---

## Part 3: Component-Specific Behaviors

### 3.1 Load Balancer Behavior

**Purpose**: Distribute load across healthy backends.

**Algorithms**:

**Round Robin**:
```
backend_index = (request_count % num_healthy_backends)
```

**Least Connections**:
```
selected_backend = argmin(backend.active_connections)
```

**Weighted Round Robin**:
```
Backends have weights: [3, 2, 1]
Distribution: [50%, 33%, 17%]
```

**Interface**:
```typescript
interface LoadBalancerBehavior {
  algorithm: 'round_robin' | 'least_connections' | 'weighted';
  healthCheckInterval: number;  // ms

  distributeLoad(
    incomingLoad: number,
    backends: Backend[]
  ): Map<BackendId, number>;  // Load per backend

  filterHealthyBackends(backends: Backend[]): Backend[];

  handleAllBackendsDown(): {
    statusCode: 503;
    latency: 1;  // Immediate failure
    error: 'all_backends_unhealthy';
  };
}

interface Backend {
  id: string;
  capacity: number;        // req/sec
  currentLoad: number;     // req/sec
  healthy: boolean;
  weight?: number;         // For weighted algorithms
}
```

**Behavior**:
```
IF all backends healthy:
  - Distribute using algorithm
  - Each backend receives: incoming_load / num_backends (round robin)

IF some backends unhealthy:
  - Remove unhealthy from pool
  - Distribute among healthy only
  - Risk: remaining backends may overload

IF all backends unhealthy:
  - Return 503 immediately (no queueing)
  - Latency = 1ms (fast fail)
```

**Example**:
```
Setup:
- LB receives: 3000 req/sec
- 3 backends: [healthy, healthy, unhealthy]
- Algorithm: round_robin

Distribution:
- Backend 1: 1500 req/sec
- Backend 2: 1500 req/sec
- Backend 3: 0 req/sec (excluded)
```

### 3.2 Cache Behavior

**Purpose**: Reduce backend load and latency via caching.

**Hit Ratio Impact**:
```
effective_throughput = backend_capacity / (1 - hit_ratio)

Examples:
- 50% hit ratio → 2x throughput
- 80% hit ratio → 5x throughput
- 90% hit ratio → 10x throughput
```

**Latency Calculation**:
```
For each request:
  IF cache_hit (probability = hit_ratio):
    latency = cache_latency  (typically 1-5ms)
  ELSE:
    latency = cache_latency + backend_latency

Average latency:
avg_latency = hit_ratio × cache_latency + (1 - hit_ratio) × (cache_latency + backend_latency)
```

**Interface**:
```typescript
interface CacheBehavior {
  hitRatio: number;       // 0.0 - 1.0
  cacheLatency: number;   // ms (typically 1-5ms)
  ttl: number;            // seconds

  calculateEffectiveLatency(
    cacheLatency: number,
    backendLatency: number,
    hitRatio: number
  ): number;  // Average latency

  calculateBackendLoad(
    incomingLoad: number,
    hitRatio: number
  ): number;  // Only cache misses hit backend

  calculateThroughputMultiplier(hitRatio: number): number;
}
```

**Example**:
```
Setup:
- Incoming load: 5000 req/sec
- Hit ratio: 80%
- Cache latency: 5ms
- Backend latency: 200ms
- Backend capacity: 1000 req/sec

Calculations:
- Backend load: 5000 × (1 - 0.8) = 1000 req/sec (at capacity!)
- Cache hits: 4000 req/sec @ 5ms = 4000 × 5ms
- Cache misses: 1000 req/sec @ 205ms = 1000 × 205ms
- Average latency: 0.8 × 5 + 0.2 × 205 = 45ms

Without cache:
- Backend would receive 5000 req/sec (5x over capacity)
- Queue would explode
```

### 3.3 Database Behavior

**Purpose**: Model connection pooling and read/write scaling.

**Connection Pool Exhaustion**:
```
IF active_connections >= pool_size:
  - New requests queue
  - Queue delay = (queue_depth / throughput) × 1000  [ms]

Connection pool utilization:
utilization = active_connections / pool_size
```

**Read Replica Scaling**:
```
read_load_per_replica = total_read_load / num_read_replicas

Assumption: Reads can be distributed, writes go to primary only
```

**Interface**:
```typescript
interface DatabaseBehavior {
  connectionPoolSize: number;
  queryLatency: number;          // ms per query
  readReplicaCount: number;

  handlePoolExhaustion(
    queueDepth: number,
    throughput: number
  ): {
    queueing: true;
    waitTime: number;  // ms
  };

  scaleReads(
    readLoad: number,
    replicaCount: number
  ): number;  // Load per replica

  calculateUtilization(
    activeConnections: number,
    poolSize: number
  ): number;
}
```

**Example**:
```
Setup:
- Pool size: 100 connections
- Active connections: 100 (exhausted!)
- Queue depth: 50 requests
- Throughput: 200 req/sec
- Query latency: 50ms

Calculation:
- Pool utilization: 100/100 = 100%
- Queue wait time: (50 / 200) × 1000 = 250ms
- Total latency: 250ms (queue) + 50ms (query) = 300ms

With read replicas:
- Total read load: 1000 req/sec
- 3 read replicas
- Load per replica: 1000 / 3 = 333 req/sec
```

### 3.4 Circuit Breaker Behavior

**Purpose**: Prevent cascading failures by failing fast when downstream is unhealthy.

**State Machine**:
```
CLOSED (normal operation):
  - All requests pass through
  - Track error rate
  - IF error_rate > threshold: transition to OPEN

OPEN (failing fast):
  - Reject all requests immediately (no downstream call)
  - Latency = 1ms (instant failure)
  - After open_duration: transition to HALF_OPEN

HALF_OPEN (testing recovery):
  - Allow N test requests
  - IF all succeed: transition to CLOSED
  - IF any fail: transition to OPEN
```

**Metrics**:
```
error_rate = errors / total_requests (sliding window)

Typical thresholds:
- error_threshold = 0.5 (50% errors)
- open_duration = 30000 (30 seconds)
- half_open_requests = 3
```

**Interface**:
```typescript
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerBehavior {
  state: CircuitState;
  errorThreshold: number;      // 0.5 = 50%
  openDuration: number;        // ms
  halfOpenRequests: number;

  shouldAllowRequest(): boolean;

  recordSuccess(): void;
  recordFailure(): void;

  fastFail(): {
    latency: 1;  // ms
    error: 'circuit_open';
    statusCode: 503;
  };

  calculateErrorRate(
    errors: number,
    total: number
  ): number;
}
```

**Example**:
```
Scenario: Database becomes slow/unavailable

Timeline:
t=0s:
  - Circuit: CLOSED
  - Error rate: 0%

t=10s:
  - Database starts timing out
  - Error rate: 60% (exceeds 50% threshold)
  - Circuit: OPEN
  - All requests now fast-fail @ 1ms latency

t=40s:
  - open_duration (30s) elapsed
  - Circuit: HALF_OPEN
  - Allow 3 test requests through

t=42s:
  - If test requests succeed → Circuit: CLOSED (recovery)
  - If test requests fail → Circuit: OPEN (retry later)

Impact:
- Prevents cascading timeouts upstream
- Protects unhealthy downstream service
- Reduces latency during outages (1ms vs 30s timeout)
```

---

## Part 4: Cross-Reference to REQUIREMENTS_FINAL.md Phase 8

**Preservation of Algorithms**:

From REQUIREMENTS_FINAL.md Phase 8, the following algorithms are preserved in this spec:

1. **Throughput Calculation** → Section 1.1 (Simple Throughput Model)
2. **Queue Depth Evolution** → Section 1.2 (Simple Latency Model - queue_delay)
3. **Cascading Failure Detection** → Section 3.4 (Circuit Breaker Behavior)
4. **Pattern Effectiveness Metrics** → Sections 3.1-3.4 (Component-specific behaviors)

**Extension Points**:

Phase 8 simulation can start with MVP models (Part 1) and progressively enable:
- Queue theory (Part 2.1) for more accurate queueing behavior
- Backpressure (Part 2.2) for flow control simulation
- Retry logic (Part 2.3) for resilience patterns
- Component behaviors (Part 3) for pattern effectiveness

**Implementation Strategy**:

```typescript
// Core simulation engine uses BehaviorModel interface
interface BehaviorModel {
  calculateThroughput(...): ThroughputResult;
  calculateLatency(...): LatencyResult;
  calculateUtilization(...): UtilizationResult;
}

// Start with simple implementation
class SimpleBehaviorModel implements BehaviorModel { ... }

// Later add advanced implementations
class QueueTheoryBehaviorModel extends SimpleBehaviorModel { ... }

// Simulation engine is agnostic to which model is used
const model = config.useQueueTheory
  ? new QueueTheoryBehaviorModel()
  : new SimpleBehaviorModel();
```

---

## Summary

This specification provides:

1. **MVP Models**: Simple, working throughput/latency/utilization models
2. **Extensibility**: Clear path to add queue theory, backpressure, retries
3. **Component Behaviors**: Specific models for LB, cache, DB, circuit breaker
4. **Real-World Grounding**: All formulas cite established theory
5. **Validation**: Test scenarios with expected outputs

**Next Steps**:
1. Implement SimpleBehaviorModel (MVP)
2. Create plugin system for advanced models
3. Validate against test scenarios
4. Integrate with Phase 8 simulation engine

**References**:
- Little's Law: John D.C. Little (1961)
- M/M/1 Queue: Kendall's notation, queueing theory
- Retry budgets: Google SRE Book
- Circuit breaker: Michael Nygard, "Release It!" (2007)
