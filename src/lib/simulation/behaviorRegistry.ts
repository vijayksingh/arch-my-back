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
// Per-Type Default Capacities and Service Times
// ============================================================================

/**
 * Realistic per-component-type defaults based on real-world performance data.
 * Source: formula-reference-sheet.md lines 399-428
 */
export const COMPONENT_DEFAULTS: Record<string, { capacity: number; serviceTime: number }> = {
  postgres:        { capacity: 10000, serviceTime: 5 },     // 10k queries/sec, 5ms
  mysql:           { capacity: 5000,  serviceTime: 8 },     // 5k queries/sec
  mongodb:         { capacity: 15000, serviceTime: 3 },
  redis:           { capacity: 100000, serviceTime: 0.5 },  // 100k ops/sec, sub-ms
  load_balancer:   { capacity: 50000, serviceTime: 1 },     // 50k req/sec, 1ms routing
  api_gateway:     { capacity: 50000, serviceTime: 1 },
  cdn:             { capacity: 100000, serviceTime: 2 },
  app_server:      { capacity: 10000, serviceTime: 10 },    // 10k req/sec, 10ms processing
  worker:          { capacity: 5000,  serviceTime: 20 },
  serverless:      { capacity: 10000, serviceTime: 15 },
  kafka:           { capacity: 100000, serviceTime: 2 },    // 100k msg/sec
  message_queue:   { capacity: 50000, serviceTime: 3 },
};

// ============================================================================
// Default (Passthrough) Behavior
// ============================================================================

/**
 * Default behavior for unregistered component types.
 * Uses M/M/1 queueing model for realistic latency and throughput degradation.
 */
export const defaultBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity, currentQueueDepth: _currentQueueDepth, state }) {
    if (!state.isHealthy) return 0;

    // At high utilization, effective capacity degrades
    const utilization = capacity > 0 ? incomingLoad / capacity : 0;
    let effectiveCapacity = capacity;

    if (utilization > 0.8) {
      // Gradual degradation above 80% — context switching, GC pressure, etc.
      const overloadFactor = (utilization - 0.8) / 0.2; // 0 at 80%, 1 at 100%
      effectiveCapacity = capacity * (1 - overloadFactor * 0.3); // up to 30% degradation
    }

    return Math.min(incomingLoad, effectiveCapacity);
  },

  calculateLatency({ queueDepth: _queueDepth, serviceTime, throughput, state, capacity, incomingLoad: _incomingLoad }) {
    if (!state.isHealthy) return Infinity;

    // M/M/1: W = 1/(μ-λ) where μ=capacity, λ=load
    // Utilization: ρ = throughput/capacity
    const effectiveCapacity = capacity ?? throughput / 0.5; // fallback: assume 50% utilization
    const utilization = effectiveCapacity > 0 ? throughput / effectiveCapacity : 0;

    if (utilization >= 0.99) {
      // At/above saturation — cap at a high but finite value
      return serviceTime * 100; // 100x service time
    }

    // M/M/1 average time in system: W = (1/μ) / (1 - ρ)
    // Which equals: serviceTime / (1 - utilization)
    const mm1Latency = serviceTime / (1 - utilization);

    return Math.min(mm1Latency, serviceTime * 100); // cap to prevent Infinity
  },

  calculateQueueDepthChange({
    incomingLoad,
    outgoingThroughput,
    deltaTime,
    currentQueueDepth,
    maxQueueDepth,
  }) {
    const deterministicDelta = (incomingLoad - outgoingThroughput) * deltaTime;

    // M/M/1 expected queue length: Lq = ρ²/(1-ρ)
    const capacity = maxQueueDepth > 0 ? outgoingThroughput + (maxQueueDepth - currentQueueDepth) / deltaTime : outgoingThroughput;
    const rho = capacity > 0 ? Math.min(incomingLoad / capacity, 0.99) : 0;
    const expectedQueueDepth = rho > 0 ? (rho * rho) / (1 - rho) : 0;

    // Smooth toward expected queue depth (prevents jarring jumps)
    const smoothingFactor = 0.1; // 10% per tick toward expected
    const stochasticDelta = (expectedQueueDepth - currentQueueDepth) * smoothingFactor;

    const combinedDelta = deterministicDelta + stochasticDelta;
    return Math.max(-currentQueueDepth, Math.min(combinedDelta, maxQueueDepth - currentQueueDepth));
  },
};

// ============================================================================
// MVP Behaviors
// ============================================================================

/**
 * Database behavior (postgres, mysql, mongodb, cassandra, dynamodb, etc.)
 *
 * Uses M/M/1 queueing model for realistic latency curves under load.
 * Throughput degrades gradually above 80% utilization due to connection pool contention.
 */
export const databaseBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity, currentQueueDepth: _currentQueueDepth, state }) {
    if (!state.isHealthy) return 0;

    // At high utilization, effective capacity degrades
    const utilization = capacity > 0 ? incomingLoad / capacity : 0;
    let effectiveCapacity = capacity;

    if (utilization > 0.8) {
      // Gradual degradation above 80% — connection pool contention, lock waits
      const overloadFactor = (utilization - 0.8) / 0.2; // 0 at 80%, 1 at 100%
      effectiveCapacity = capacity * (1 - overloadFactor * 0.3); // up to 30% degradation
    }

    return Math.min(incomingLoad, effectiveCapacity);
  },

  calculateLatency({ queueDepth: _queueDepth, serviceTime, throughput, state, capacity, incomingLoad: _incomingLoad }) {
    if (!state.isHealthy) return Infinity;

    // M/M/1: W = 1/(μ-λ) where μ=capacity, λ=load
    // Utilization: ρ = throughput/capacity
    const effectiveCapacity = capacity ?? throughput / 0.5; // fallback: assume 50% utilization
    const utilization = effectiveCapacity > 0 ? throughput / effectiveCapacity : 0;

    if (utilization >= 0.99) {
      // At/above saturation — cap at a high but finite value
      return serviceTime * 100; // 100x service time
    }

    // M/M/1 average time in system: W = (1/μ) / (1 - ρ)
    // Which equals: serviceTime / (1 - utilization)
    const mm1Latency = serviceTime / (1 - utilization);

    return Math.min(mm1Latency, serviceTime * 100); // cap to prevent Infinity
  },

  calculateQueueDepthChange({
    incomingLoad,
    outgoingThroughput,
    deltaTime,
    currentQueueDepth,
    maxQueueDepth,
  }) {
    const deterministicDelta = (incomingLoad - outgoingThroughput) * deltaTime;

    // M/M/1 expected queue length: Lq = ρ²/(1-ρ)
    const capacity = maxQueueDepth > 0 ? outgoingThroughput + (maxQueueDepth - currentQueueDepth) / deltaTime : outgoingThroughput;
    const rho = capacity > 0 ? Math.min(incomingLoad / capacity, 0.99) : 0;
    const expectedQueueDepth = rho > 0 ? (rho * rho) / (1 - rho) : 0;

    // Smooth toward expected queue depth (prevents jarring jumps)
    const smoothingFactor = 0.1; // 10% per tick toward expected
    const stochasticDelta = (expectedQueueDepth - currentQueueDepth) * smoothingFactor;

    const combinedDelta = deterministicDelta + stochasticDelta;
    return Math.max(-currentQueueDepth, Math.min(combinedDelta, maxQueueDepth - currentQueueDepth));
  },
};

/**
 * Load Balancer behavior
 *
 * Distributes load across backends. Very low added latency (routing overhead only).
 * LB doesn't queue — just routes immediately.
 */
export const loadBalancerBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity, state }) {
    if (!state.isHealthy) return 0;

    // At high utilization, effective capacity degrades
    const utilization = capacity > 0 ? incomingLoad / capacity : 0;
    let effectiveCapacity = capacity;

    if (utilization > 0.8) {
      // Gradual degradation above 80% — connection handling overhead
      const overloadFactor = (utilization - 0.8) / 0.2; // 0 at 80%, 1 at 100%
      effectiveCapacity = capacity * (1 - overloadFactor * 0.3); // up to 30% degradation
    }

    return Math.min(incomingLoad, effectiveCapacity);
  },

  calculateLatency({ serviceTime, state }) {
    if (!state.isHealthy) return Infinity;
    // LB adds minimal routing overhead only — no queueing
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
 * Models cache hit ratio: hits are fast (~1ms), misses use M/M/1 queueing.
 * Very high throughput for hits.
 */
export const cacheBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity, state }) {
    if (!state.isHealthy) return 0;

    // At high utilization, effective capacity degrades
    const utilization = capacity > 0 ? incomingLoad / capacity : 0;
    let effectiveCapacity = capacity;

    if (utilization > 0.8) {
      // Gradual degradation above 80% — even caches slow down under extreme load
      const overloadFactor = (utilization - 0.8) / 0.2; // 0 at 80%, 1 at 100%
      effectiveCapacity = capacity * (1 - overloadFactor * 0.3); // up to 30% degradation
    }

    return Math.min(incomingLoad, effectiveCapacity);
  },

  calculateLatency({ queueDepth: _queueDepth, serviceTime, throughput, state, capacity, incomingLoad: _incomingLoad }) {
    if (!state.isHealthy) return Infinity;

    const hitRatio = (state.behaviorState?.hitRatio as number) ?? 0.8;
    const cacheLatency = 1; // 1ms for cache hit

    // Miss path gets M/M/1 treatment
    const effectiveCapacity = capacity ?? throughput / 0.5; // fallback: assume 50% utilization
    const utilization = effectiveCapacity > 0 ? throughput / effectiveCapacity : 0;
    const clampedUtil = Math.min(utilization, 0.99);
    const missLatency = serviceTime / (1 - clampedUtil);

    return hitRatio * cacheLatency + (1 - hitRatio) * Math.min(missLatency, serviceTime * 100);
  },

  calculateQueueDepthChange({
    incomingLoad,
    outgoingThroughput,
    deltaTime,
    currentQueueDepth,
    maxQueueDepth,
  }) {
    const deterministicDelta = (incomingLoad - outgoingThroughput) * deltaTime;

    // M/M/1 expected queue length: Lq = ρ²/(1-ρ)
    const capacity = maxQueueDepth > 0 ? outgoingThroughput + (maxQueueDepth - currentQueueDepth) / deltaTime : outgoingThroughput;
    const rho = capacity > 0 ? Math.min(incomingLoad / capacity, 0.99) : 0;
    const expectedQueueDepth = rho > 0 ? (rho * rho) / (1 - rho) : 0;

    // Smooth toward expected queue depth (prevents jarring jumps)
    const smoothingFactor = 0.1; // 10% per tick toward expected
    const stochasticDelta = (expectedQueueDepth - currentQueueDepth) * smoothingFactor;

    const combinedDelta = deterministicDelta + stochasticDelta;
    return Math.max(-currentQueueDepth, Math.min(combinedDelta, maxQueueDepth - currentQueueDepth));
  },
};

/**
 * API Server / App Server behavior
 *
 * General compute node. Uses M/M/1 queueing model for realistic latency
 * increases under load (CPU/memory contention).
 */
export const apiServerBehavior: ComponentBehavior = {
  calculateThroughput({ incomingLoad, capacity, state }) {
    if (!state.isHealthy) return 0;

    // At high utilization, effective capacity degrades
    const utilization = capacity > 0 ? incomingLoad / capacity : 0;
    let effectiveCapacity = capacity;

    if (utilization > 0.8) {
      // Gradual degradation above 80% — CPU/memory contention, GC pressure
      const overloadFactor = (utilization - 0.8) / 0.2; // 0 at 80%, 1 at 100%
      effectiveCapacity = capacity * (1 - overloadFactor * 0.3); // up to 30% degradation
    }

    return Math.min(incomingLoad, effectiveCapacity);
  },

  calculateLatency({ queueDepth: _queueDepth, serviceTime, throughput, state, capacity, incomingLoad: _incomingLoad }) {
    if (!state.isHealthy) return Infinity;

    // M/M/1: W = 1/(μ-λ) where μ=capacity, λ=load
    // Utilization: ρ = throughput/capacity
    const effectiveCapacity = capacity ?? throughput / 0.5; // fallback: assume 50% utilization
    const utilization = effectiveCapacity > 0 ? throughput / effectiveCapacity : 0;

    if (utilization >= 0.99) {
      // At/above saturation — cap at a high but finite value
      return serviceTime * 100; // 100x service time
    }

    // M/M/1 average time in system: W = (1/μ) / (1 - ρ)
    // Which equals: serviceTime / (1 - utilization)
    const mm1Latency = serviceTime / (1 - utilization);

    return Math.min(mm1Latency, serviceTime * 100); // cap to prevent Infinity
  },

  calculateQueueDepthChange({
    incomingLoad,
    outgoingThroughput,
    deltaTime,
    currentQueueDepth,
    maxQueueDepth,
  }) {
    const deterministicDelta = (incomingLoad - outgoingThroughput) * deltaTime;

    // M/M/1 expected queue length: Lq = ρ²/(1-ρ)
    const capacity = maxQueueDepth > 0 ? outgoingThroughput + (maxQueueDepth - currentQueueDepth) / deltaTime : outgoingThroughput;
    const rho = capacity > 0 ? Math.min(incomingLoad / capacity, 0.99) : 0;
    const expectedQueueDepth = rho > 0 ? (rho * rho) / (1 - rho) : 0;

    // Smooth toward expected queue depth (prevents jarring jumps)
    const smoothingFactor = 0.1; // 10% per tick toward expected
    const stochasticDelta = (expectedQueueDepth - currentQueueDepth) * smoothingFactor;

    const combinedDelta = deterministicDelta + stochasticDelta;
    return Math.max(-currentQueueDepth, Math.min(combinedDelta, maxQueueDepth - currentQueueDepth));
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
