# Formula Reference Sheet

**Version**: 1.0
**Date**: 2026-02-24

Quick reference for all behavior modeling formulas with real-world citations.

---

## MVP Formulas

### Throughput Model

```
throughput = min(incoming_load, node_capacity)
overflow = max(0, incoming_load - node_capacity)
utilization = throughput / node_capacity
```

**Variables**:
- `incoming_load`: Sum of all incoming edge flows [req/sec]
- `node_capacity`: Maximum throughput capacity [req/sec]
- `throughput`: Actual processed requests [req/sec]
- `overflow`: Excess requests building queue [req/sec]
- `utilization`: Capacity utilization ratio [0.0-1.0+]

**Source**: Basic capacity planning, operations research

---

### Latency Model

```
total_latency = base_latency + queue_delay + network_delay

queue_delay = (queue_depth / service_rate) × 1000

network_delay = Σ(edge_latencies_in_path)
```

**Variables**:
- `base_latency`: Service time per request [ms]
- `queue_depth`: Number of queued requests
- `service_rate`: Processing throughput [req/sec]
- `queue_delay`: Queueing delay [ms]
- `network_delay`: Sum of edge latencies [ms]
- `total_latency`: End-to-end request latency [ms]

**Source**: Queueing delay from basic queueing theory

---

### Resource Utilization Model

```
utilization = current_throughput / max_capacity

States:
- utilization < 0.5:        HEALTHY (green)
- 0.5 ≤ utilization < 0.8:  DEGRADED (yellow)
- 0.8 ≤ utilization < 1.0:  STRESSED (orange)
- utilization ≥ 1.0:        FAILING (red)
```

**Source**: Common SRE practice, Google SRE Book

---

## Queue Theory Formulas

### Little's Law

```
L = λW

Where:
- L = average number in system (requests)
- λ = arrival rate (req/sec)
- W = average time in system (seconds)
```

**Source**: John D.C. Little (1961), "A Proof for the Queuing Formula: L = λW", Operations Research

**Application**: Fundamental relationship between queue length, arrival rate, and wait time.

**Example**:
```
If L = 10 requests, λ = 100 req/sec
Then W = L/λ = 10/100 = 0.1 sec = 100ms
```

---

### M/M/1 Queue (Single Server Queue)

**Notation**: M/M/1
- First M: Markovian (Poisson) arrivals
- Second M: Markovian (exponential) service times
- 1: Single server

**Traffic Intensity**:
```
ρ = λ/μ

Where:
- λ = arrival rate (req/sec)
- μ = service rate (req/sec)
- ρ = utilization (must be < 1 for stability)
```

**Average Number in System**:
```
L = ρ / (1 - ρ)
```

**Average Time in System**:
```
W = 1 / (μ - λ)  [seconds]
```

**Average Number in Queue** (not including service):
```
Lq = ρ² / (1 - ρ)
```

**Average Time in Queue** (not including service):
```
Wq = ρ / (μ - λ)  [seconds]
```

**Probability of n requests in system**:
```
P(n) = (1 - ρ) × ρⁿ
```

**Source**: Agner Krarup Erlang (1909), Kendall's notation (1953)

**Stability Condition**: λ < μ (arrival rate must be less than service rate)

**Example**:
```
Given:
- λ = 80 req/sec (arrivals)
- μ = 100 req/sec (service)

Calculate:
- ρ = 80/100 = 0.8
- L = 0.8/(1-0.8) = 4 requests in system
- W = 1/(100-80) = 0.05 sec = 50ms
- Lq = 0.64/(1-0.8) = 3.2 requests in queue
- Wq = 0.8/(100-80) = 0.04 sec = 40ms

Validation (Little's Law):
- L = λW → 4 = 80 × 0.05 ✓
- Lq = λWq → 3.2 = 80 × 0.04 ✓
```

---

## Backpressure Formulas

### TCP-Inspired Flow Control

```
backpressure_signal = clamp((queue_depth - threshold) / threshold, 0, 1)

adjusted_send_rate = current_rate × (1 - backpressure_signal × damping_factor)

Where:
- threshold = queue_capacity × 0.7
- damping_factor = 0.5 (typical)
```

**Source**: Inspired by TCP congestion control (Jacobson 1988), gRPC flow control

**Example**:
```
Given:
- queue_capacity = 1000
- threshold = 700 (70%)
- queue_depth = 850
- current_rate = 1000 req/sec
- damping_factor = 0.5

Calculate:
- backpressure_signal = (850-700)/700 = 0.214
- adjusted_send_rate = 1000 × (1 - 0.214×0.5) = 893 req/sec

Effect: Upstream reduces by ~10.7%
```

---

## Retry Logic Formulas

### Exponential Backoff

```
delay = min(base_delay × 2^attempt, max_delay) + jitter

jitter = random(0, delay × jitter_factor)

Where:
- base_delay = initial delay (e.g., 100ms)
- attempt = retry number (0-indexed)
- max_delay = cap (e.g., 30000ms)
- jitter_factor = 0.1 (10% jitter typical)
```

**Source**: Ethernet collision backoff (1970s), AWS Architecture Blog

**Example**:
```
base_delay = 100ms, max_delay = 10000ms

Attempt 0: 100ms + jitter(0-10ms) = ~105ms
Attempt 1: 200ms + jitter(0-20ms) = ~210ms
Attempt 2: 400ms + jitter(0-40ms) = ~420ms
Attempt 3: 800ms + jitter(0-80ms) = ~840ms
Attempt 4: 1600ms + jitter(0-160ms) = ~1680ms
Attempt 5: 3200ms + jitter(0-320ms) = ~3360ms
Attempt 6: 6400ms + jitter(0-640ms) = ~6720ms
Attempt 7: 10000ms (capped) + jitter(0-1000ms) = ~10500ms
```

---

### Retry Budget

```
max_retries_per_window = original_requests × 0.1

Rule: retry_count < max_retries_per_window

Where:
- original_requests = requests in time window
- 0.1 = 10% budget (industry best practice)
```

**Source**: Google SRE Book (Chapter 21: Handling Overload)

**Rationale**: Retries can amplify load during outages. Limiting to 10% prevents retry storms.

**Example**:
```
Time window: 60 seconds
Original requests: 6000 req/min

max_retries = 6000 × 0.1 = 600 retries/min

If retry count reaches 600 in window, stop retrying.
```

---

## Component-Specific Formulas

### Load Balancer

**Round Robin**:
```
backend_index = request_count % num_healthy_backends
```

**Least Connections**:
```
selected_backend = argmin(backend.active_connections)
```

**Weighted Distribution**:
```
weight_sum = Σ(backend.weight)
backend.traffic_fraction = backend.weight / weight_sum
backend.load = total_load × traffic_fraction
```

**Example (Weighted)**:
```
Backends: [weight=3, weight=2, weight=1]
Total weight: 6
Incoming: 6000 req/sec

Backend 1: 6000 × (3/6) = 3000 req/sec (50%)
Backend 2: 6000 × (2/6) = 2000 req/sec (33%)
Backend 3: 6000 × (1/6) = 1000 req/sec (17%)
```

---

### Cache

**Effective Throughput Multiplier**:
```
effective_throughput = backend_capacity / (1 - hit_ratio)
throughput_multiplier = 1 / (1 - hit_ratio)

Examples:
- hit_ratio = 0.5  → 2x throughput
- hit_ratio = 0.8  → 5x throughput
- hit_ratio = 0.9  → 10x throughput
- hit_ratio = 0.99 → 100x throughput
```

**Backend Load Reduction**:
```
backend_load = incoming_load × (1 - hit_ratio)
```

**Average Latency**:
```
avg_latency = hit_ratio × cache_latency + (1 - hit_ratio) × (cache_latency + backend_latency)
```

**Source**: Cache hit ratio analysis, common caching theory

**Example**:
```
Given:
- incoming_load = 10000 req/sec
- hit_ratio = 0.9
- cache_latency = 2ms
- backend_latency = 100ms
- backend_capacity = 1000 req/sec

Calculate:
- backend_load = 10000 × (1-0.9) = 1000 req/sec
- avg_latency = 0.9×2 + 0.1×(2+100) = 1.8 + 10.2 = 12ms

Without cache:
- backend would receive 10000 req/sec (10x over capacity!)
```

---

### Database Connection Pool

**Utilization**:
```
pool_utilization = active_connections / pool_size
```

**Queue Wait Time** (when pool exhausted):
```
wait_time = (queue_depth / throughput) × 1000  [ms]

Where:
- throughput = queries/sec being processed
```

**Read Replica Scaling**:
```
load_per_replica = total_read_load / num_read_replicas
```

**Example**:
```
Pool size: 100
Active: 100 (exhausted)
Queue: 50 requests
Throughput: 200 queries/sec

wait_time = (50/200) × 1000 = 250ms
```

---

### Circuit Breaker

**Error Rate** (sliding window):
```
error_rate = error_count / total_requests

Typical threshold: 0.5 (50%)
```

**State Transitions**:
```
CLOSED → OPEN:  when error_rate > error_threshold
OPEN → HALF_OPEN:  after open_duration elapsed
HALF_OPEN → CLOSED:  when test_requests succeed
HALF_OPEN → OPEN:  when test_requests fail
```

**Fast Fail Latency**:
```
latency_when_open = 1ms  (immediate rejection)

vs.

latency_when_closed_but_failing = timeout_duration (e.g., 30000ms)

Improvement: 30000x faster failure detection
```

**Source**: Michael Nygard, "Release It!" (2007)

---

## Performance Characteristics Lookup

### Typical Latencies (for reference)

| Component | Typical Latency |
|-----------|----------------|
| L1 cache | 0.5 ns |
| L2 cache | 7 ns |
| RAM | 100 ns |
| SSD read | 16 μs |
| Network within datacenter | 0.5 ms |
| SSD write | 1 ms |
| Network cross-region | 50-100 ms |
| HDD seek | 10 ms |
| Internet round-trip | 150 ms |

**Source**: Jeff Dean, "Numbers Everyone Should Know"

### Typical Throughputs

| Component | Typical Throughput |
|-----------|-------------------|
| Redis | 100k ops/sec |
| In-memory cache | 1M ops/sec |
| PostgreSQL | 10k queries/sec |
| MySQL | 5k queries/sec |
| Nginx | 50k req/sec |
| Node.js API | 10k req/sec |

**Note**: These are representative. Actual values vary by hardware, configuration, query complexity.

---

## Validation Formulas

### Little's Law Validation

```
L = λW

Check: |L - λW| < ε  (where ε = tolerance, e.g., 0.01)
```

### Queue Stability Check

```
stable = (λ < μ)

If λ ≥ μ: queue will grow unbounded
```

### Utilization Bounds

```
0 ≤ utilization ≤ ∞

Practical:
- utilization < 1.0: stable
- utilization ≥ 1.0: unstable (queue growing)
```

---

## References

1. **Little's Law**: Little, J. D. C. (1961). "A Proof for the Queuing Formula: L = λW". Operations Research, 9(3), 383-387.

2. **M/M/1 Queue**: Kendall, D. G. (1953). "Stochastic Processes Occurring in the Theory of Queues and their Analysis by the Method of the Imbedded Markov Chain". The Annals of Mathematical Statistics, 24(3), 338-354.

3. **Queueing Theory**: Erlang, A. K. (1909). "The Theory of Probabilities and Telephone Conversations".

4. **Retry Budgets**: Beyer, B., Jones, C., Petoff, J., & Murphy, N. R. (2016). "Site Reliability Engineering: How Google Runs Production Systems". O'Reilly Media.

5. **Circuit Breaker**: Nygard, M. (2007). "Release It!: Design and Deploy Production-Ready Software". Pragmatic Bookshelf.

6. **Exponential Backoff**: Metcalfe, R. M. & Boggs, D. R. (1976). "Ethernet: Distributed Packet Switching for Local Computer Networks". Communications of the ACM.

7. **TCP Congestion Control**: Jacobson, V. (1988). "Congestion Avoidance and Control". ACM SIGCOMM.

8. **Latency Numbers**: Dean, J. (2009). "Designs, Lessons and Advice from Building Large Distributed Systems". Keynote at LADIS.

---

## Quick Formula Index

| Need | Formula | Section |
|------|---------|---------|
| Throughput limit | `min(load, capacity)` | MVP Throughput |
| Queue delay | `(depth / rate) × 1000` | MVP Latency |
| Utilization | `throughput / capacity` | MVP Utilization |
| Queue length | `L = ρ/(1-ρ)` | M/M/1 Queue |
| Wait time | `W = 1/(μ-λ)` | M/M/1 Queue |
| Little's Law | `L = λW` | Queue Theory |
| Backpressure | `(depth - threshold) / threshold` | Backpressure |
| Retry delay | `base × 2^attempt + jitter` | Retry Logic |
| Cache multiplier | `1 / (1 - hit_ratio)` | Cache |
| Error rate | `errors / total` | Circuit Breaker |

---

**Last Updated**: 2026-02-24
**Maintainer**: Keep formulas synchronized with behavior-modeling-specification.md
