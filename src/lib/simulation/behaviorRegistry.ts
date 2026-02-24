/**
 * Behavior Registry — Maps component types to simulation behaviors
 *
 * Each component type has a behavior plugin that defines how it responds to
 * load, calculates throughput/latency, and models queue buildup.
 *
 * Default behavior is used for component types without a registered behavior.
 */

import type {
  ComponentBehavior,
  BehaviorRegistry,
} from '@/types/simulation';
import type { ComponentTypeKey } from '@/types/componentTypes';

// ============================================================================
// Default (Passthrough) Behavior
// ============================================================================

/**
 * Default behavior for unregistered component types.
 * Acts as a simple passthrough: throughput = incoming load, minimal latency.
 */
export const defaultBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity }) {
    return Math.min(incomingLoad, capacity);
  },

  calculateLatency({ queueDepth, serviceTime }) {
    return serviceTime + queueDepth * 0.1;
  },

  calculateQueueDepthChange({
    incomingLoad,
    outgoingThroughput,
    deltaTime,
    currentQueueDepth,
    maxQueueDepth,
  }) {
    const delta = (incomingLoad - outgoingThroughput) * deltaTime;
    // Clamp: can't go below 0 or above max
    return Math.max(-currentQueueDepth, Math.min(delta, maxQueueDepth - currentQueueDepth));
  },
};

// ============================================================================
// MVP Behaviors
// ============================================================================

/**
 * Database behavior (postgres, mysql, mongodb, cassandra, dynamodb, etc.)
 *
 * Formulas from formula-reference-sheet.md:
 * - throughput = min(incomingLoad, capacity)
 * - latency = baseLatency + (queueDepth / serviceRate) * 1000
 * - queueDelta = (incomingLoad - throughput) * deltaTime
 *
 * Error rate increases when queue exceeds 80% capacity.
 */
export const databaseBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity, currentQueueDepth, state }) {
    // If unhealthy, throughput drops to 0
    if (!state.isHealthy) return 0;

    // Throughput degrades as queue fills (connection pool contention)
    const queuePressure = state.maxQueueDepth > 0
      ? currentQueueDepth / state.maxQueueDepth
      : 0;
    // At 100% queue, effective capacity drops to 50%
    const effectiveCapacity = capacity * (1 - queuePressure * 0.5);

    return Math.min(incomingLoad, effectiveCapacity);
  },

  calculateLatency({ queueDepth, serviceTime, state }) {
    if (!state.isHealthy) return Infinity;

    // base latency + queue delay
    // queue_delay = (queueDepth / serviceRate) * 1000
    // serviceRate ≈ capacity in req/sec, serviceTime is ms per request
    const serviceRate = serviceTime > 0 ? 1000 / serviceTime : 1000;
    const queueDelay = serviceRate > 0 ? (queueDepth / serviceRate) * 1000 : 0;

    return serviceTime + queueDelay;
  },

  calculateQueueDepthChange({
    incomingLoad,
    outgoingThroughput,
    deltaTime,
    currentQueueDepth,
    maxQueueDepth,
  }) {
    const delta = (incomingLoad - outgoingThroughput) * deltaTime;
    // Clamp between draining fully and filling to max
    return Math.max(-currentQueueDepth, Math.min(delta, maxQueueDepth - currentQueueDepth));
  },
};

/**
 * Load Balancer behavior
 *
 * Distributes load across backends. Very low added latency (routing overhead).
 * Throughput = sum of what backends can handle (simulation computes backend
 * states separately; LB itself is a passthrough with tiny overhead).
 */
export const loadBalancerBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity, state }) {
    if (!state.isHealthy) return 0;
    // LB can handle high throughput — limited by its own connection handling
    return Math.min(incomingLoad, capacity);
  },

  calculateLatency({ serviceTime, state }) {
    if (!state.isHealthy) return Infinity;
    // LB adds minimal routing overhead (default ~1ms)
    return serviceTime;
  },

  calculateQueueDepthChange({
    incomingLoad,
    outgoingThroughput,
    deltaTime,
    currentQueueDepth,
    maxQueueDepth,
  }) {
    // LB queues are typically small — requests route quickly
    const delta = (incomingLoad - outgoingThroughput) * deltaTime;
    return Math.max(-currentQueueDepth, Math.min(delta, maxQueueDepth - currentQueueDepth));
  },
};

/**
 * Cache behavior (redis, etc.)
 *
 * Models cache hit ratio: hits are fast (cacheLatency), misses go to backing store.
 * Effective throughput accounts for hit ratio.
 */
export const cacheBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity, state }) {
    if (!state.isHealthy) return 0;
    // Cache can handle very high throughput for hits
    return Math.min(incomingLoad, capacity);
  },

  calculateLatency({ serviceTime, state }) {
    if (!state.isHealthy) return Infinity;
    // Cache latency is very low for hits (~1ms), serviceTime for misses
    const hitRatio = (state.behaviorState?.hitRatio as number) ?? 0.8;
    const cacheHitLatency = 1; // ms
    return hitRatio * cacheHitLatency + (1 - hitRatio) * serviceTime;
  },

  calculateQueueDepthChange({
    incomingLoad,
    outgoingThroughput,
    deltaTime,
    currentQueueDepth,
    maxQueueDepth,
  }) {
    const delta = (incomingLoad - outgoingThroughput) * deltaTime;
    return Math.max(-currentQueueDepth, Math.min(delta, maxQueueDepth - currentQueueDepth));
  },
};

/**
 * API Server / App Server behavior
 *
 * General compute node. Throughput caps at capacity, latency increases
 * under load as requests contend for CPU/memory.
 */
export const apiServerBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity, state }) {
    if (!state.isHealthy) return 0;
    return Math.min(incomingLoad, capacity);
  },

  calculateLatency({ queueDepth, serviceTime, state }) {
    if (!state.isHealthy) return Infinity;
    // Latency increases under contention
    const serviceRate = serviceTime > 0 ? 1000 / serviceTime : 1000;
    const queueDelay = serviceRate > 0 ? (queueDepth / serviceRate) * 1000 : 0;
    return serviceTime + queueDelay;
  },

  calculateQueueDepthChange({
    incomingLoad,
    outgoingThroughput,
    deltaTime,
    currentQueueDepth,
    maxQueueDepth,
  }) {
    const delta = (incomingLoad - outgoingThroughput) * deltaTime;
    return Math.max(-currentQueueDepth, Math.min(delta, maxQueueDepth - currentQueueDepth));
  },
};

// ============================================================================
// Registry Implementation
// ============================================================================

class BehaviorRegistryImpl implements BehaviorRegistry {
  private behaviors = new Map<string, ComponentBehavior>();
  private fallback: ComponentBehavior;

  constructor(fallback: ComponentBehavior) {
    this.fallback = fallback;
  }

  register(componentType: ComponentTypeKey, behavior: ComponentBehavior): void {
    this.behaviors.set(componentType as string, behavior);
  }

  get(componentType: ComponentTypeKey): ComponentBehavior {
    return this.behaviors.get(componentType as string) ?? this.fallback;
  }

  has(componentType: ComponentTypeKey): boolean {
    return this.behaviors.has(componentType as string);
  }

  getRegisteredTypes(): ComponentTypeKey[] {
    return [...this.behaviors.keys()] as ComponentTypeKey[];
  }
}

/**
 * Create a behavior registry pre-loaded with MVP behaviors.
 */
export function createBehaviorRegistry(): BehaviorRegistry {
  const registry = new BehaviorRegistryImpl(defaultBehavior);

  // Database family
  registry.register('postgres' as ComponentTypeKey, databaseBehavior);
  registry.register('mysql' as ComponentTypeKey, databaseBehavior);
  registry.register('mongodb' as ComponentTypeKey, databaseBehavior);
  registry.register('cassandra' as ComponentTypeKey, databaseBehavior);
  registry.register('dynamodb' as ComponentTypeKey, databaseBehavior);

  // Load balancing / traffic
  registry.register('load_balancer' as ComponentTypeKey, loadBalancerBehavior);
  registry.register('api_gateway' as ComponentTypeKey, loadBalancerBehavior);
  registry.register('cdn' as ComponentTypeKey, loadBalancerBehavior);

  // Cache
  registry.register('redis' as ComponentTypeKey, cacheBehavior);

  // Compute
  registry.register('app_server' as ComponentTypeKey, apiServerBehavior);
  registry.register('worker' as ComponentTypeKey, apiServerBehavior);
  registry.register('serverless' as ComponentTypeKey, apiServerBehavior);

  // Messaging (uses default for MVP, specialized behavior later)
  registry.register('kafka' as ComponentTypeKey, defaultBehavior);
  registry.register('message_queue' as ComponentTypeKey, defaultBehavior);

  return registry;
}
