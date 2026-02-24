/**
 * Event Bus — Pub/sub system for simulation events
 *
 * Handles event distribution with throttling to prevent UI overwhelm.
 * Critical events (failures) emit immediately; info events are batched.
 */

import type {
  SimulationEvent,
  SimulationEventType,
  EventBus,
} from '@/types/simulation';

type Listener = (event: SimulationEvent) => void;

/**
 * Get priority level for an event type.
 * Critical events bypass throttling.
 */
function getEventPriority(event: SimulationEvent): 'critical' | 'normal' {
  switch (event.type) {
    case 'cascading_failure':
    case 'queue_overflow':
      return 'critical';
    default:
      return 'normal';
  }
}

/**
 * Check if an event qualifies as a state change event.
 * Used for the 'state_change' meta subscription.
 */
function isStateChangeEvent(event: SimulationEvent): boolean {
  return event.type === 'component_state_change';
}

export class EventBusImpl implements EventBus {
  private listeners = new Map<SimulationEventType, Set<Listener>>();
  private eventQueue: SimulationEvent[] = [];
  private lastFlushTime = 0;

  /** Max events emitted per flush cycle */
  private readonly maxEventsPerFlush = 10;
  /** Minimum ms between flush cycles for non-critical events */
  private readonly flushInterval = 100;

  emit(event: SimulationEvent): void {
    const priority = getEventPriority(event);

    if (priority === 'critical') {
      this.emitImmediate(event);
    } else {
      this.eventQueue.push(event);
    }
  }

  /**
   * Flush queued events if enough time has passed.
   * Called by the simulation loop each tick.
   */
  flush(timestamp: number): void {
    if (timestamp - this.lastFlushTime < this.flushInterval) return;

    const toEmit = this.eventQueue.splice(0, this.maxEventsPerFlush);
    for (const event of toEmit) {
      this.emitImmediate(event);
    }

    this.lastFlushTime = timestamp;
  }

  subscribe(
    eventType: SimulationEventType,
    listener: Listener,
  ): () => void {
    let set = this.listeners.get(eventType);
    if (!set) {
      set = new Set();
      this.listeners.set(eventType, set);
    }
    set.add(listener);

    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  clear(): void {
    this.listeners.clear();
    this.eventQueue.length = 0;
  }

  /**
   * Bug #9 fix: Clear only the event queue, preserving listeners.
   * Used during reset to avoid breaking external subscriptions.
   */
  clearQueue(): void {
    this.eventQueue.length = 0;
  }

  // --- internal ---

  private emitImmediate(event: SimulationEvent): void {
    // Wildcard listeners
    this.notify('*', event);
    // Type-specific listeners
    this.notify(event.type, event);
    // Meta: state_change
    if (isStateChangeEvent(event)) {
      this.notify('state_change', event);
    }
  }

  private notify(eventType: SimulationEventType, event: SimulationEvent): void {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;
    for (const listener of listeners) {
      listener(event);
    }
  }
}
