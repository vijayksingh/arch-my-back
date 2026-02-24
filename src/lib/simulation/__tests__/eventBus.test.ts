import { describe, it, expect, vi } from 'vitest';
import { EventBusImpl } from '../eventBus';
import type { SimulationEvent } from '@/types/simulation';

function makeEvent(
  overrides: Partial<SimulationEvent> = {},
): SimulationEvent {
  return {
    type: 'bottleneck_detected',
    timestamp: 1000,
    nodeId: 'node-1',
    severity: 0.5,
    suggestion: 'Scale up',
    metrics: { throughput: 500, capacity: 600, utilizationPercent: 83 },
    ...overrides,
  } as SimulationEvent;
}

describe('EventBusImpl', () => {
  it('should deliver events to type-specific subscribers', () => {
    const bus = new EventBusImpl();
    const handler = vi.fn();

    bus.subscribe('bottleneck_detected', handler);
    bus.emit(makeEvent());

    // Non-critical events are queued, not immediate
    expect(handler).not.toHaveBeenCalled();

    // After flush, should be delivered
    bus.flush(200); // enough time has passed
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should deliver critical events immediately', () => {
    const bus = new EventBusImpl();
    const handler = vi.fn();

    bus.subscribe('cascading_failure', handler);
    bus.emit({
      type: 'cascading_failure',
      timestamp: 1000,
      rootCauseNodeId: 'db-1',
      affectedNodeIds: ['api-1'],
      propagationPath: ['db-1', 'api-1'],
      explanation: 'Database crashed',
    });

    // Critical events emit immediately
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should deliver events to wildcard subscribers', () => {
    const bus = new EventBusImpl();
    const handler = vi.fn();

    bus.subscribe('*', handler);
    bus.emit({
      type: 'cascading_failure',
      timestamp: 1000,
      rootCauseNodeId: 'db-1',
      affectedNodeIds: [],
      propagationPath: [],
      explanation: 'test',
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support unsubscribe', () => {
    const bus = new EventBusImpl();
    const handler = vi.fn();

    const unsubscribe = bus.subscribe('*', handler);
    unsubscribe();

    bus.emit({
      type: 'cascading_failure',
      timestamp: 1000,
      rootCauseNodeId: 'db-1',
      affectedNodeIds: [],
      propagationPath: [],
      explanation: 'test',
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should throttle non-critical event flushing', () => {
    const bus = new EventBusImpl();
    const handler = vi.fn();

    bus.subscribe('bottleneck_detected', handler);

    // Emit 3 events
    bus.emit(makeEvent());
    bus.emit(makeEvent());
    bus.emit(makeEvent());

    // Flush too soon (< 100ms interval)
    bus.flush(50);
    expect(handler).not.toHaveBeenCalled();

    // Flush after interval
    bus.flush(200);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('should clear all listeners and queued events', () => {
    const bus = new EventBusImpl();
    const handler = vi.fn();

    bus.subscribe('*', handler);
    bus.emit(makeEvent());
    bus.clear();

    bus.flush(200);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should deliver state_change meta-events', () => {
    const bus = new EventBusImpl();
    const handler = vi.fn();

    bus.subscribe('state_change', handler);

    // component_state_change is critical enough to check via state_change
    // but it's not in the critical priority list, so it goes through queue
    bus.emit({
      type: 'component_state_change',
      timestamp: 1000,
      nodeId: 'db-1',
      previousHealth: true,
      currentHealth: false,
      reason: 'Overloaded',
    });

    bus.flush(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
