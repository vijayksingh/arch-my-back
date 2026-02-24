import { describe, it, expect } from 'vitest';
import {
  createBehaviorRegistry,
  defaultBehavior,
  databaseBehavior,
  cacheBehavior,
  loadBalancerBehavior,
  apiServerBehavior,
} from '../behaviorRegistry';
import type { ComponentState } from '@/types/simulation';
import type { ComponentTypeKey } from '@/types/componentTypes';

/** Helper to create a minimal ComponentState for testing */
function makeState(overrides: Partial<ComponentState> = {}): ComponentState {
  return {
    nodeId: 'test-node',
    componentType: 'postgres' as ComponentTypeKey,
    queueDepth: 0,
    maxQueueDepth: 10_000,
    throughput: 0,
    latency: 5,
    errorRate: 0,
    isHealthy: true,
    behaviorState: {},
    ...overrides,
  };
}

describe('BehaviorRegistry', () => {
  it('should return registered behavior for known component types', () => {
    const registry = createBehaviorRegistry();
    expect(registry.has('postgres' as ComponentTypeKey)).toBe(true);
    expect(registry.has('redis' as ComponentTypeKey)).toBe(true);
    expect(registry.has('load_balancer' as ComponentTypeKey)).toBe(true);
    expect(registry.has('app_server' as ComponentTypeKey)).toBe(true);
  });

  it('should return default behavior for unknown component types', () => {
    const registry = createBehaviorRegistry();
    const behavior = registry.get('unknown_type' as ComponentTypeKey);
    expect(behavior).toBeDefined();
    // Default behavior should cap throughput at capacity
    const throughput = behavior.calculateThroughput({
      incomingLoad: 200,
      capacity: 100,
      currentQueueDepth: 0,
      state: makeState(),
    });
    expect(throughput).toBe(100);
  });

  it('should list all registered types', () => {
    const registry = createBehaviorRegistry();
    const types = registry.getRegisteredTypes();
    expect(types.length).toBeGreaterThan(5);
    expect(types).toContain('postgres');
    expect(types).toContain('redis');
  });
});

describe('defaultBehavior', () => {
  it('should cap throughput at capacity', () => {
    const throughput = defaultBehavior.calculateThroughput({
      incomingLoad: 200,
      capacity: 100,
      currentQueueDepth: 0,
      state: makeState(),
    });
    expect(throughput).toBe(100);
  });

  it('should pass through load below capacity', () => {
    const throughput = defaultBehavior.calculateThroughput({
      incomingLoad: 50,
      capacity: 100,
      currentQueueDepth: 0,
      state: makeState(),
    });
    expect(throughput).toBe(50);
  });

  it('should calculate queue growth when overloaded', () => {
    const delta = defaultBehavior.calculateQueueDepthChange({
      incomingLoad: 200,
      outgoingThroughput: 100,
      deltaTime: 1, // 1 second
      currentQueueDepth: 0,
      maxQueueDepth: 10_000,
    });
    expect(delta).toBe(100); // 200-100 = 100 req/sec * 1sec
  });

  it('should drain queue when capacity exceeds load', () => {
    const delta = defaultBehavior.calculateQueueDepthChange({
      incomingLoad: 50,
      outgoingThroughput: 100,
      deltaTime: 1,
      currentQueueDepth: 500,
      maxQueueDepth: 10_000,
    });
    expect(delta).toBe(-50); // 50-100 = -50 req/sec drain
  });

  it('should not drain queue below zero', () => {
    const delta = defaultBehavior.calculateQueueDepthChange({
      incomingLoad: 0,
      outgoingThroughput: 100,
      deltaTime: 1,
      currentQueueDepth: 10, // only 10 to drain
      maxQueueDepth: 10_000,
    });
    expect(delta).toBe(-10); // clamp to -currentQueueDepth
  });
});

describe('databaseBehavior', () => {
  it('should return zero throughput when unhealthy', () => {
    const throughput = databaseBehavior.calculateThroughput({
      incomingLoad: 100,
      capacity: 1000,
      currentQueueDepth: 0,
      state: makeState({ isHealthy: false }),
    });
    expect(throughput).toBe(0);
  });

  it('should cap throughput at capacity', () => {
    const throughput = databaseBehavior.calculateThroughput({
      incomingLoad: 2000,
      capacity: 1000,
      currentQueueDepth: 0,
      state: makeState(),
    });
    expect(throughput).toBeLessThanOrEqual(1000);
  });

  it('should degrade throughput as queue fills', () => {
    const normalThroughput = databaseBehavior.calculateThroughput({
      incomingLoad: 1000,
      capacity: 1000,
      currentQueueDepth: 0,
      state: makeState(),
    });

    const degradedThroughput = databaseBehavior.calculateThroughput({
      incomingLoad: 1000,
      capacity: 1000,
      currentQueueDepth: 8000, // 80% full
      state: makeState({ queueDepth: 8000 }),
    });

    expect(degradedThroughput).toBeLessThan(normalThroughput);
  });

  it('should increase latency with queue depth', () => {
    const lowQueueLatency = databaseBehavior.calculateLatency({
      queueDepth: 0,
      serviceTime: 10,
      throughput: 100,
      state: makeState(),
    });

    const highQueueLatency = databaseBehavior.calculateLatency({
      queueDepth: 100,
      serviceTime: 10,
      throughput: 100,
      state: makeState({ queueDepth: 100 }),
    });

    expect(highQueueLatency).toBeGreaterThan(lowQueueLatency);
  });

  it('should return Infinity latency when unhealthy', () => {
    const latency = databaseBehavior.calculateLatency({
      queueDepth: 0,
      serviceTime: 10,
      throughput: 0,
      state: makeState({ isHealthy: false }),
    });
    expect(latency).toBe(Infinity);
  });
});

describe('cacheBehavior', () => {
  it('should return blended latency based on hit ratio', () => {
    const latency = cacheBehavior.calculateLatency({
      queueDepth: 0,
      serviceTime: 50, // backing store latency
      throughput: 100,
      state: makeState({ behaviorState: { hitRatio: 0.8 } }),
    });

    // Expected: 0.8 * 1ms + 0.2 * 50ms = 0.8 + 10 = 10.8ms
    expect(latency).toBeCloseTo(10.8, 1);
  });

  it('should have higher latency with lower hit ratio', () => {
    const highHitLatency = cacheBehavior.calculateLatency({
      queueDepth: 0,
      serviceTime: 50,
      throughput: 100,
      state: makeState({ behaviorState: { hitRatio: 0.9 } }),
    });

    const lowHitLatency = cacheBehavior.calculateLatency({
      queueDepth: 0,
      serviceTime: 50,
      throughput: 100,
      state: makeState({ behaviorState: { hitRatio: 0.3 } }),
    });

    expect(lowHitLatency).toBeGreaterThan(highHitLatency);
  });
});

describe('loadBalancerBehavior', () => {
  it('should add minimal routing overhead', () => {
    const latency = loadBalancerBehavior.calculateLatency({
      queueDepth: 0,
      serviceTime: 1, // ~1ms routing overhead
      throughput: 500,
      state: makeState(),
    });
    expect(latency).toBeLessThanOrEqual(2);
  });

  it('should handle high throughput', () => {
    const throughput = loadBalancerBehavior.calculateThroughput({
      incomingLoad: 10_000,
      capacity: 50_000,
      currentQueueDepth: 0,
      state: makeState(),
    });
    expect(throughput).toBe(10_000);
  });
});

describe('apiServerBehavior', () => {
  it('should increase latency under contention', () => {
    const idleLatency = apiServerBehavior.calculateLatency({
      queueDepth: 0,
      serviceTime: 20,
      throughput: 100,
      state: makeState(),
    });

    const busyLatency = apiServerBehavior.calculateLatency({
      queueDepth: 200,
      serviceTime: 20,
      throughput: 100,
      state: makeState({ queueDepth: 200 }),
    });

    expect(busyLatency).toBeGreaterThan(idleLatency);
  });
});
