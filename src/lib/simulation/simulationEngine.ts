/**
 * Simulation Engine — Transforms static architecture diagrams into running simulations
 *
 * Core responsibilities:
 * 1. State machine (paused / running / broken / teaching)
 * 2. requestAnimationFrame loop with delta-time calculations
 * 3. Per-node behavior evaluation via plugin registry
 * 4. Edge flow calculation
 * 5. Failure detection and cascading propagation (event-driven)
 * 6. Visual state updates for canvas rendering
 * 7. Event emission for timeline, metrics, and walkthrough integration
 */

import type {
  ISimulationEngine,
  SimulationState,
  ComponentState,
  SystemMetrics,
  SimulationEvent,
  SimulationEventType,
  SimulationTickResult,
  CanvasVisualUpdate,
  NodeVisualState,
  EdgeVisualState,
  FailureScenario,
  EducationalHint,
  ScheduledFailureEvent,
  BehaviorRegistry,
} from '@/types/simulation';
import type { CanvasNode, ArchEdge, ArchNodeData } from '@/types';
import type { ComponentTypeKey } from '@/types/componentTypes';
import { EventBusImpl } from './eventBus';
import { createBehaviorRegistry, COMPONENT_DEFAULTS } from './behaviorRegistry';

// ============================================================================
// Configuration
// ============================================================================

/** Default simulation parameters */
const DEFAULTS = {
  /** Default capacity for nodes without explicit config */
  nodeCapacity: 500,
  /** Default service time in ms */
  serviceTime: 10,
  /** Default max queue depth */
  maxQueueDepth: 10_000,
  /** Default incoming load for entry nodes (req/sec) */
  entryNodeLoad: 100,
  /** Max delta time to prevent spiral of death (ms) */
  maxDeltaTime: 100,
  /** How often to update system metrics (ms) */
  metricsInterval: 100,
  /** How often to flush batched events (ms) */
  eventFlushInterval: 100,
} as const;

/** Pre-built educational hints for common failure patterns */
const EDUCATIONAL_HINTS: Record<string, (context: { nodeId: string; metrics?: Record<string, number> }) => EducationalHint> = {
  bottleneck: ({ nodeId, metrics }) => ({
    id: `hint-bottleneck-${nodeId}-${Date.now()}`,
    type: 'failure_explanation',
    title: 'Bottleneck Detected',
    message: `Node "${nodeId}" is running at ${metrics?.utilization ? Math.round(metrics.utilization * 100) : '>90'}% capacity. When a component is overloaded, requests queue up, latency increases, and eventually requests start timing out.`,
    relatedNodeIds: [nodeId],
    actionSuggestion: 'Consider adding horizontal scaling (more instances behind a load balancer), implementing caching to reduce load, or optimizing the service to handle more requests per second.',
  }),

  cascading_failure: ({ nodeId }) => ({
    id: `hint-cascade-${nodeId}-${Date.now()}`,
    type: 'failure_explanation',
    title: 'Cascading Failure',
    message: `The failure of "${nodeId}" is propagating to dependent services. Without circuit breakers, a single point of failure can bring down the entire system.`,
    relatedNodeIds: [nodeId],
    actionSuggestion: 'Implement the Circuit Breaker pattern to stop cascading failures. Add health checks and automatic failover to improve resilience.',
  }),

  queue_overflow: ({ nodeId }) => ({
    id: `hint-queue-${nodeId}-${Date.now()}`,
    type: 'failure_explanation',
    title: 'Queue Overflow',
    message: `The request queue for "${nodeId}" has exceeded its capacity. New requests are being dropped, causing errors for users.`,
    relatedNodeIds: [nodeId],
    actionSuggestion: 'Consider implementing backpressure (reject requests early with 503), adding a message queue for async processing, or scaling the service.',
  }),

  high_latency: ({ nodeId, metrics }) => ({
    id: `hint-latency-${nodeId}-${Date.now()}`,
    type: 'best_practice',
    title: 'High Latency Warning',
    message: `Node "${nodeId}" latency has reached ${metrics?.latency ? Math.round(metrics.latency) : 'very high'}ms. Users typically notice delays above 200ms and abandon requests above 3 seconds.`,
    relatedNodeIds: [nodeId],
    actionSuggestion: 'Add a caching layer, optimize database queries, or use a CDN to reduce response times.',
  }),
};

// ============================================================================
// Helpers
// ============================================================================

/** Extract a numeric config value from node data, with fallback */
function getNodeConfig(node: CanvasNode, key: string, fallback: number): number {
  if (node.type !== 'archComponent') return fallback;
  const data = node.data as ArchNodeData;
  const val = data.config?.[key];
  return typeof val === 'number' ? val : fallback;
}

/** Get the component type key from a canvas node */
function getComponentType(node: CanvasNode): ComponentTypeKey | null {
  if (node.type !== 'archComponent') return null;
  return (node.data as ArchNodeData).componentType;
}

/** Determine health color from utilization ratio */
function healthColorFromUtilization(
  utilization: number,
  isHealthy: boolean,
): NodeVisualState['healthColor'] {
  if (!isHealthy) return 'red';
  if (utilization < 0.5) return 'green';
  if (utilization < 0.8) return 'yellow';
  return 'red';
}

/** Format a number for display (e.g., 1200 → "1.2k") */
function formatRate(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k/s`;
  return `${value.toFixed(0)}/s`;
}

function formatLatency(ms: number): string {
  if (!isFinite(ms)) return '∞';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms.toFixed(0)}ms`;
}

// ============================================================================
// Simulation Engine
// ============================================================================

export class SimulationEngine implements ISimulationEngine {
  private state: SimulationState;
  private eventBus: EventBusImpl;
  private behaviorRegistry: BehaviorRegistry;

  // Graph references (read from canvas, not owned)
  private nodes: CanvasNode[] = [];
  private edges: ArchEdge[] = [];
  private nodeMap = new Map<string, CanvasNode>();
  private edgeMap = new Map<string, ArchEdge>();

  // Adjacency: nodeId → inbound edge IDs
  private inboundEdges = new Map<string, string[]>();
  // Adjacency: nodeId → outbound edge IDs
  private outboundEdges = new Map<string, string[]>();
  // Entry nodes (no inbound edges from arch components)
  private entryNodeIds = new Set<string>();
  // Cached topological order (PERF #3 fix)
  private topologicalOrder: string[] = [];

  // RAF loop
  private rafId: number | null = null;
  private lastTimestamp: number | null = null;
  private lastMetricsTime = 0;

  // Scheduled failure events
  private scheduledEvents: Array<{ event: ScheduledFailureEvent; fireAt: number }> = [];

  // Tick listener (for store integration)
  private tickListeners: Array<(result: SimulationTickResult) => void> = [];

  // Teaching cooldown tracker
  private lastTeachingTime = 0;
  private teachingCooldown = 15_000; // Don't teach more than once per 15 simulated seconds

  // PERF #18 fix: Throttle bottleneck events per node (max 2/sec per node)
  private lastBottleneckEventTime = new Map<string, number>();
  // Visual state diffing (Bug #24 fix)
  private prevNodeVisuals = new Map<string, NodeVisualState>();
  private prevEdgeVisuals = new Map<string, EdgeVisualState>();

  // Load control: User-adjustable multiplier for entry traffic (default 1.0 = 100%)
  private entryLoadMultiplier = 1.0;

  constructor(registry?: BehaviorRegistry) {
    this.eventBus = new EventBusImpl();
    this.behaviorRegistry = registry ?? createBehaviorRegistry();
    this.state = this.createInitialState();
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  initialize(graph: { nodes: CanvasNode[]; edges: ArchEdge[] }): void {
    // Bug #20 fix: Only include arch component nodes in simulation
    this.nodes = graph.nodes.filter(n => n.type === 'archComponent');
    this.edges = graph.edges;
    this.buildAdjacency();
    this.initializeComponentStates();
    this.state.isInitialized = true;
    this.state.graphNodeIds = this.nodes.map(n => n.id);
    this.state.graphEdgeIds = this.edges.map(e => e.id);
  }

  start(): void {
    if (!this.state.isInitialized) return;
    this.state.mode = { state: 'running', speed: this.state.speed };
    this.lastTimestamp = null;
    this.scheduleNextTick();
  }

  pause(reason?: string): void {
    this.state.mode = { state: 'paused', reason };
    this.cancelTick();
  }

  resume(): void {
    if (this.state.mode.state === 'teaching') {
      this.resumeFromTeaching();
      return;
    }
    this.start();
  }

  reset(): void {
    this.cancelTick();
    this.state = this.createInitialState();
    this.scheduledEvents = [];
    // Bug #9 fix: Only clear event queue, not listeners
    this.eventBus.clearQueue();
    this.lastTeachingTime = 0;
    this.lastBottleneckEventTime.clear(); // PERF #18 fix: clear bottleneck throttle
    this.edgeMap.clear();
    this.prevNodeVisuals.clear();
    this.prevEdgeVisuals.clear();
    this.topologicalOrder = []; // PERF #3 fix: clear cached order
    this.entryLoadMultiplier = 1.0; // Reset load multiplier to 100%
    if (this.nodes.length > 0) {
      this.initializeComponentStates();
      this.state.isInitialized = true;
      this.state.graphNodeIds = this.nodes.map(n => n.id);
      this.state.graphEdgeIds = this.edges.map(e => e.id);
    }
  }

  // ============================================================================
  // Speed Control
  // ============================================================================

  setSpeed(speed: 1 | 2 | 4): void {
    this.state.speed = speed;
    if (this.state.mode.state === 'running') {
      this.state.mode = { state: 'running', speed };
    }
  }

  getSpeed(): 1 | 2 | 4 {
    return this.state.speed;
  }

  // ============================================================================
  // Load Control
  // ============================================================================

  /**
   * Set the entry load multiplier (10% to 300%).
   * This multiplier is applied to auto-calculated entry load.
   * Default is 1.0 (100%).
   */
  setEntryLoadMultiplier(multiplier: number): void {
    this.entryLoadMultiplier = Math.max(0.1, Math.min(3.0, multiplier));
  }

  // ============================================================================
  // State Access
  // ============================================================================

  getState(): SimulationState {
    return this.state;
  }

  getComponentState(nodeId: string): ComponentState | undefined {
    return this.state.componentStates.get(nodeId);
  }

  getSystemMetrics(): SystemMetrics {
    return this.state.systemMetrics;
  }

  // ============================================================================
  // Event Subscription
  // ============================================================================

  on(event: SimulationEventType, handler: (data: SimulationEvent) => void): () => void {
    return this.eventBus.subscribe(event, handler);
  }

  /**
   * Subscribe to tick results. Used by the simulation store to bridge
   * engine state → React state.
   */
  onTick(handler: (result: SimulationTickResult) => void): () => void {
    this.tickListeners.push(handler);
    return () => {
      const idx = this.tickListeners.indexOf(handler);
      if (idx >= 0) this.tickListeners.splice(idx, 1);
    };
  }

  // ============================================================================
  // Walkthrough Integration
  // ============================================================================

  pauseForTeaching(lesson: EducationalHint): void {
    this.cancelTick();
    this.state.mode = { state: 'teaching', lesson };
    this.state.pendingHints.push(lesson);
  }

  resumeFromTeaching(): void {
    this.state.mode = { state: 'paused' };
    this.state.pendingHints = [];
  }

  // ============================================================================
  // Failure Injection
  // ============================================================================

  triggerFailure(scenario: FailureScenario): void {
    const nodeId = scenario.rootCauseNodeId;
    const compState = this.state.componentStates.get(nodeId);
    if (!compState) return;

    // Mark node as unhealthy immediately
    compState.isHealthy = false;
    compState.healthReason = scenario.message;
    compState.throughput = 0;
    compState.errorRate = 100;

    this.state.activeFailures.push(scenario);

    // Emit component state change event
    this.eventBus.emit({
      type: 'component_state_change',
      timestamp: this.state.currentTime,
      nodeId,
      previousHealth: true,
      currentHealth: false,
      reason: scenario.message,
    });

    // Schedule cascading failure events for downstream nodes
    const downstreamNodeIds = this.findDownstreamNodes(nodeId);

    // FIX 5: Populate affectedNodeIds so recoverFromFailure can heal downstream nodes
    scenario.affectedNodeIds = downstreamNodeIds;

    for (const downstreamId of downstreamNodeIds) {
      // Cascade faster under higher load
      const downstreamState = this.state.componentStates.get(downstreamId);
      const loadFactor = Math.max(1, (downstreamState?.throughput ?? 100) / 100);
      const baseTimeout = 5000 / loadFactor; // faster cascade at higher throughput

      this.scheduledEvents.push(
        { event: { nodeId: downstreamId, event: 'requests_timing_out', delay: baseTimeout }, fireAt: this.state.currentTime + baseTimeout },
        { event: { nodeId: downstreamId, event: 'queue_overflow', delay: baseTimeout + 2000 / loadFactor }, fireAt: this.state.currentTime + baseTimeout + 2000 / loadFactor },
        { event: { nodeId: downstreamId, event: 'circuit_breaker_open', delay: baseTimeout + 5000 / loadFactor }, fireAt: this.state.currentTime + baseTimeout + 5000 / loadFactor },
      );
    }

    // FIX 1: Don't stop the tick loop — let cascading events propagate
    // The teaching overlay will show after cascade completes
    if (this.state.mode.state === 'running') {
      this.state.mode = { state: 'broken', failure: scenario };
      // Don't call cancelTick() — keep the loop running so
      // processScheduledEvents() can fire downstream cascade events
    }
  }

  recoverFromFailure(scenarioId: string): void {
    const failureIdx = this.state.activeFailures.findIndex(f => f.id === scenarioId);
    if (failureIdx === -1) return;

    const failure = this.state.activeFailures[failureIdx];
    this.state.activeFailures.splice(failureIdx, 1);

    // Recover root cause node
    const rootState = this.state.componentStates.get(failure.rootCauseNodeId);
    if (rootState) {
      rootState.isHealthy = true;
      rootState.healthReason = undefined;
      rootState.errorRate = 0;
    }

    // Remove scheduled events for this failure's affected nodes
    const affectedSet = new Set(failure.affectedNodeIds);
    this.scheduledEvents = this.scheduledEvents.filter(
      se => !affectedSet.has(se.event.nodeId),
    );

    // Recover affected nodes
    for (const nodeId of failure.affectedNodeIds) {
      const compState = this.state.componentStates.get(nodeId);
      if (compState) {
        compState.isHealthy = true;
        compState.healthReason = undefined;
        compState.errorRate = 0;
        compState.behaviorState = {};
      }
    }

    // FIX 3: Transition out of broken state when all failures are cleared
    if (this.state.activeFailures.length === 0) {
      this.state.mode = { state: 'paused' };
      this.cancelTick(); // Stop the tick loop since we're now paused
    }
  }

  // ============================================================================
  // Internal: Initialization
  // ============================================================================

  private createInitialState(): SimulationState {
    return {
      mode: { state: 'paused' },
      currentTime: 0,
      speed: 1,
      isInitialized: false,
      graphNodeIds: [],
      graphEdgeIds: [],
      componentStates: new Map(),
      edgeFlowStates: new Map(),
      systemMetrics: {
        totalThroughput: 0,
        averageLatency: 0,
        errorRate: 0,
        healthyNodeCount: 0,
        unhealthyNodeCount: 0,
        activeRequestCount: 0,
        peakThroughput: 0,
        peakLatency: 0,
        peakQueueDepth: 0,
      },
      events: [],
      activeFailures: [],
      pendingHints: [],
    };
  }

  private buildAdjacency(): void {
    this.nodeMap.clear();
    this.edgeMap.clear();
    this.inboundEdges.clear();
    this.outboundEdges.clear();
    this.entryNodeIds.clear();

    for (const node of this.nodes) {
      this.nodeMap.set(node.id, node);
      this.inboundEdges.set(node.id, []);
      this.outboundEdges.set(node.id, []);
    }

    for (const edge of this.edges) {
      this.edgeMap.set(edge.id, edge);
      this.outboundEdges.get(edge.source)?.push(edge.id);
      this.inboundEdges.get(edge.target)?.push(edge.id);
    }

    // Entry nodes have no inbound edges
    for (const node of this.nodes) {
      const inbound = this.inboundEdges.get(node.id) ?? [];
      if (inbound.length === 0) {
        this.entryNodeIds.add(node.id);
      }
    }

    // PERF #3 fix: Compute topological order once after graph is built
    this.topologicalOrder = this.computeTopologicalOrder();
  }

  private initializeComponentStates(): void {
    this.state.componentStates.clear();
    this.state.edgeFlowStates.clear();

    for (const node of this.nodes) {
      const componentType = getComponentType(node);
      if (!componentType) continue; // Skip non-arch nodes (shapes, groups, etc.)

      this.state.componentStates.set(node.id, {
        nodeId: node.id,
        componentType,
        queueDepth: 0,
        maxQueueDepth: getNodeConfig(node, 'maxQueueDepth', DEFAULTS.maxQueueDepth),
        throughput: 0,
        latency: getNodeConfig(node, 'serviceTime', DEFAULTS.serviceTime),
        errorRate: 0,
        isHealthy: true,
        behaviorState: {},
      });
    }

    for (const edge of this.edges) {
      this.state.edgeFlowStates.set(edge.id, {
        edgeId: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        requestsPerSecond: 0,
        averageLatency: 0,
        congestionLevel: 0,
        isBackpressured: false,
        particleCount: 0,
        particleSpeed: 50,
      });
    }
  }

  // ============================================================================
  // Internal: RAF Loop
  // ============================================================================

  private scheduleNextTick(): void {
    this.rafId = requestAnimationFrame(this.tick);
  }

  private cancelTick(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTimestamp = null;
  }

  /**
   * Main simulation tick — bound method for RAF callback.
   */
  private tick = (timestamp: number): void => {
    // Allow tick loop to run in 'running' and 'broken' modes (for cascading events)
    // Only 'paused' and 'teaching' modes should stop the loop
    if (this.state.mode.state === 'paused' || this.state.mode.state === 'teaching') return;

    // Calculate delta time
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      this.scheduleNextTick();
      return;
    }

    const rawDelta = timestamp - this.lastTimestamp;
    // Cap delta to prevent spiral of death
    const cappedDelta = Math.min(rawDelta, DEFAULTS.maxDeltaTime);
    // Apply speed multiplier: 2x speed means 2x simulation time per wall-clock time
    const deltaTime = cappedDelta * this.state.speed;

    this.lastTimestamp = timestamp;
    this.state.currentTime += deltaTime;

    // --- Core simulation step ---
    const newEvents: SimulationEvent[] = [];
    const visualUpdates: CanvasVisualUpdate[] = [];

    // 1. Process scheduled failure events
    this.processScheduledEvents(newEvents);

    // 2. Calculate edge flows (based on source node throughput)
    this.updateEdgeFlows();

    // 3. Update each node's state via behavior plugins
    this.updateNodeStates(deltaTime / 1000); // convert ms → sec for rate calculations

    // 4. Detect failure conditions
    this.detectFailures(newEvents);

    // 5. Compute visual updates
    this.computeVisualUpdates(visualUpdates);

    // 6. Update system metrics (throttled)
    if (timestamp - this.lastMetricsTime > DEFAULTS.metricsInterval) {
      this.updateSystemMetrics();
      this.lastMetricsTime = timestamp;
    }

    // 7. Emit events
    for (const event of newEvents) {
      this.state.events.push(event);
      this.eventBus.emit(event);
    }

    // Cap events array to prevent unbounded memory growth
    // PERF #14: Use splice for in-place mutation instead of slice
    if (this.state.events.length > 500) {
      this.state.events.splice(0, this.state.events.length - 500);
    }

    this.eventBus.flush(timestamp);

    // 7.5. Check for pending teaching moments
    if (this.state.pendingHints.length > 0 && this.state.mode.state === 'running') {
      const hint = this.state.pendingHints.shift()!;
      this.pauseForTeaching(hint);
      return; // Stop this tick — we're now paused for teaching
    }

    // 8. Notify tick listeners
    const tickResult: SimulationTickResult = {
      deltaTime,
      updatedComponentStates: this.state.componentStates,
      updatedEdgeFlowStates: this.state.edgeFlowStates,
      systemMetrics: this.state.systemMetrics,
      newEvents,
      newFailures: [],
      newHints: [],
      visualUpdates,
    };
    for (const listener of this.tickListeners) {
      listener(tickResult);
    }

    // 9. Schedule next tick (if still running OR has pending cascading events)
    const mode = this.state.mode;
    if (mode.state === 'running' || (mode.state === 'broken' && this.scheduledEvents.length > 0)) {
      this.scheduleNextTick();
    }
  };

  // ============================================================================
  // Internal: Per-tick Calculations
  // ============================================================================

  private processScheduledEvents(newEvents: SimulationEvent[]): void {
    // PERF #10 fix: Early return when no events to avoid allocating arrays
    if (this.scheduledEvents.length === 0) return;

    const currentTime = this.state.currentTime;
    const toFire: Array<{ event: ScheduledFailureEvent; fireAt: number }> = [];
    const remaining: Array<{ event: ScheduledFailureEvent; fireAt: number }> = [];

    for (const scheduled of this.scheduledEvents) {
      if (scheduled.fireAt <= currentTime) {
        toFire.push(scheduled);
      } else {
        remaining.push(scheduled);
      }
    }

    this.scheduledEvents = remaining;

    for (const { event: scheduled } of toFire) {
      this.applyScheduledFailureEvent(scheduled, newEvents);
    }
  }

  private applyScheduledFailureEvent(
    event: ScheduledFailureEvent,
    newEvents: SimulationEvent[],
  ): void {
    const compState = this.state.componentStates.get(event.nodeId);
    if (!compState) return;

    switch (event.event) {
      case 'requests_timing_out':
        compState.errorRate = Math.min(100, compState.errorRate + 30);
        newEvents.push({
          type: 'sla_violation',
          timestamp: this.state.currentTime,
          metric: 'availability',
          target: 99.9,
          actual: 100 - compState.errorRate,
          severity: 'error',
        });
        break;

      case 'queue_overflow':
        compState.queueDepth = compState.maxQueueDepth;
        compState.isHealthy = false;
        compState.healthReason = 'Queue overflow — upstream dependency failed';
        newEvents.push({
          type: 'queue_overflow',
          timestamp: this.state.currentTime,
          nodeId: event.nodeId,
          queueDepth: compState.queueDepth,
          threshold: compState.maxQueueDepth,
        });
        break;

      case 'circuit_breaker_open':
        compState.behaviorState = {
          ...compState.behaviorState,
          circuitBreakerState: 'open',
        };
        compState.throughput = 0;
        newEvents.push({
          type: 'component_state_change',
          timestamp: this.state.currentTime,
          nodeId: event.nodeId,
          previousHealth: compState.isHealthy,
          currentHealth: false,
          reason: 'Circuit breaker opened',
        });
        break;

      case 'node_unhealthy':
        compState.isHealthy = false;
        compState.throughput = 0;
        break;
    }
  }

  private updateEdgeFlows(): void {
    for (const edge of this.edges) {
      const sourceState = this.state.componentStates.get(edge.source);
      const flowState = this.state.edgeFlowStates.get(edge.id);
      if (!flowState) continue;

      // Edge flow rate = source node's throughput distributed across outbound edges
      const outboundIds = this.outboundEdges.get(edge.source) ?? [];
      const numOutbound = outboundIds.length || 1;
      const sourceThroughput = sourceState?.throughput ?? 0;

      const rawFlow = sourceThroughput / numOutbound;
      // Apply backpressure from target — TCP-inspired (formula-reference-sheet.md line 164-172)
      const targetState = this.state.componentStates.get(edge.target);
      if (targetState && targetState.maxQueueDepth > 0) {
        const threshold = targetState.maxQueueDepth * 0.7;
        if (targetState.queueDepth > threshold) {
          const backpressureSignal = Math.min(1, (targetState.queueDepth - threshold) / threshold);
          const dampingFactor = 0.5;
          flowState.requestsPerSecond = rawFlow * (1 - backpressureSignal * dampingFactor);
        } else {
          flowState.requestsPerSecond = rawFlow;
        }
      } else {
        flowState.requestsPerSecond = rawFlow;
      }
      flowState.averageLatency = sourceState?.latency ?? 0;

      // Congestion level based on how loaded the target is
      if (targetState && targetState.maxQueueDepth > 0) {
        flowState.congestionLevel = Math.min(1, targetState.queueDepth / targetState.maxQueueDepth);
      } else {
        flowState.congestionLevel = 0;
      }
      flowState.isBackpressured = flowState.congestionLevel > 0.8;

      // Particle animation: more traffic → more particles, faster
      flowState.particleCount = Math.min(10, Math.ceil(flowState.requestsPerSecond / 100));
      flowState.particleSpeed = 30 + flowState.requestsPerSecond * 0.05;
    }
  }

  /**
   * PERF #3 fix: Compute topological order via DFS.
   * This is called once in buildAdjacency(), not every tick.
   */
  private computeTopologicalOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Visit upstream nodes first
      const inbound = this.inboundEdges.get(nodeId) ?? [];
      for (const edgeId of inbound) {
        const edge = this.edgeMap.get(edgeId);
        if (edge) visit(edge.source);
      }

      order.push(nodeId);
    };

    for (const node of this.nodes) {
      visit(node.id);
    }

    return order;
  }

  private updateNodeStates(deltaTimeSec: number): void {
    // Process nodes in topological order (entry nodes first)
    // This ensures upstream throughput is calculated before downstream incoming load
    // PERF #3 fix: Use cached topological order instead of computing DFS every tick
    for (const nodeId of this.topologicalOrder) {
      const node = this.nodeMap.get(nodeId);
      if (!node) continue;

      const componentType = getComponentType(node);
      if (!componentType) continue;

      const compState = this.state.componentStates.get(nodeId);
      if (!compState) continue;

      // Skip nodes with open circuit breakers
      if (compState.behaviorState?.circuitBreakerState === 'open') {
        compState.throughput = 0;
        continue;
      }

      const behavior = this.behaviorRegistry.get(componentType);

      // Calculate incoming load
      const incomingLoad = this.calculateIncomingLoad(nodeId);

      // Use per-type defaults for capacity and serviceTime
      const typeDefaults = COMPONENT_DEFAULTS[componentType] ?? { capacity: DEFAULTS.nodeCapacity, serviceTime: DEFAULTS.serviceTime };
      const capacity = getNodeConfig(node, 'capacity', typeDefaults.capacity);
      const serviceTime = getNodeConfig(node, 'serviceTime', typeDefaults.serviceTime);

      // Calculate new throughput
      const newThroughput = behavior.calculateThroughput({
        incomingLoad,
        capacity,
        currentQueueDepth: compState.queueDepth,
        state: compState,
      });

      // Calculate queue depth change
      const queueDelta = behavior.calculateQueueDepthChange({
        incomingLoad,
        outgoingThroughput: newThroughput,
        deltaTime: deltaTimeSec,
        currentQueueDepth: compState.queueDepth,
        maxQueueDepth: compState.maxQueueDepth,
      });

      const newQueueDepth = Math.max(0, compState.queueDepth + queueDelta);

      // Calculate new latency
      const newLatency = behavior.calculateLatency({
        queueDepth: newQueueDepth,
        serviceTime,
        throughput: newThroughput,
        state: compState,
        capacity, // M/M/1 needs capacity for utilization
        incomingLoad, // M/M/1 needs arrival rate
      });

      // Update state
      compState.throughput = newThroughput;
      compState.queueDepth = newQueueDepth;
      compState.latency = isFinite(newLatency) ? newLatency : 9999;

      // Error rate based on utilization — starts gradually at 80%, accelerates near 100%
      const utilization = capacity > 0 ? incomingLoad / capacity : 0;
      const queueRatio = compState.maxQueueDepth > 0 ? compState.queueDepth / compState.maxQueueDepth : 0;

      if (utilization > 0.8 || queueRatio > 0.8) {
        // Errors start at 80% utilization, grow exponentially
        const stress = Math.max(utilization, queueRatio);
        const errorGrowthRate = Math.pow((stress - 0.8) / 0.2, 2) * 20; // 0 at 80%, 20%/sec at 100%
        compState.errorRate = Math.min(100, compState.errorRate + errorGrowthRate * deltaTimeSec);
      } else if (compState.errorRate > 0 && compState.isHealthy) {
        // Slowly recover error rate
        compState.errorRate = Math.max(0, compState.errorRate - 10 * deltaTimeSec);
      }
    }
  }

  private calculateIncomingLoad(nodeId: string): number {
    // Entry nodes generate synthetic load
    if (this.entryNodeIds.has(nodeId)) {
      const node = this.nodeMap.get(nodeId);
      // Scale entry load based on downstream capacity so simulation shows realistic utilization
      // Default to enough load to create ~70% utilization on the weakest downstream path
      const configuredLoad = getNodeConfig(node!, 'load', 0);
      const baseLoad = configuredLoad > 0 ? configuredLoad : this.calculateAutoEntryLoad(nodeId);
      // Apply user-controlled load multiplier
      return baseLoad * this.entryLoadMultiplier;
    }

    // Sum of flow from all inbound edges
    const inbound = this.inboundEdges.get(nodeId) ?? [];
    let total = 0;
    for (const edgeId of inbound) {
      const flowState = this.state.edgeFlowStates.get(edgeId);
      if (flowState) {
        total += flowState.requestsPerSecond;
      }
    }
    return total;
  }

  private calculateAutoEntryLoad(entryNodeId: string): number {
    // Find the minimum capacity among direct downstream nodes
    const outbound = this.outboundEdges.get(entryNodeId) ?? [];
    let minDownstreamCapacity = Infinity;
    for (const edgeId of outbound) {
      const edge = this.edges.find(e => e.id === edgeId);
      if (!edge) continue;
      const node = this.nodeMap.get(edge.target);
      if (!node) continue;
      const componentType = getComponentType(node);
      const typeDefaults = COMPONENT_DEFAULTS[componentType ?? ''] ?? { capacity: DEFAULTS.nodeCapacity };
      const capacity = getNodeConfig(node, 'capacity', typeDefaults.capacity);
      minDownstreamCapacity = Math.min(minDownstreamCapacity, capacity);
    }
    if (!isFinite(minDownstreamCapacity)) return DEFAULTS.entryNodeLoad;
    // Target 70% utilization on the weakest link
    return Math.round(minDownstreamCapacity * 0.7);
  }

  private detectFailures(newEvents: SimulationEvent[]): void {
    for (const [nodeId, compState] of this.state.componentStates) {
      const node = this.nodeMap.get(nodeId);
      if (node) {
        const nodeCapacity = getNodeConfig(node, 'capacity', DEFAULTS.nodeCapacity);

        // Bottleneck detection: utilization > 90%
        if (compState.isHealthy && compState.throughput > 0) {
          const utilization = compState.throughput / nodeCapacity;
          if (utilization > 0.9) {
            // PERF #18 fix: Throttle bottleneck events to max 2/sec per node
            const lastTime = this.lastBottleneckEventTime.get(nodeId) ?? 0;
            if (this.state.currentTime - lastTime >= 500) {
              this.lastBottleneckEventTime.set(nodeId, this.state.currentTime);
              newEvents.push({
                type: 'bottleneck_detected',
                timestamp: this.state.currentTime,
                nodeId,
                severity: utilization > 0.95 ? 0.9 : 0.6,
                suggestion: 'Consider adding a cache, load balancer, or scaling horizontally',
                metrics: {
                  throughput: compState.throughput,
                  capacity: nodeCapacity,
                  utilizationPercent: utilization * 100,
                },
              });
            }

            // Auto-teach on severe bottlenecks (>95% utilization)
            if (utilization > 0.95 && this.state.mode.state === 'running') {
              // Check cooldown (scaled by speed so it's ~15 real seconds regardless of sim speed)
              if (this.state.currentTime - this.lastTeachingTime > this.teachingCooldown * this.state.speed) {
                this.lastTeachingTime = this.state.currentTime;
                const hint = EDUCATIONAL_HINTS.bottleneck({
                  nodeId,
                  metrics: { utilization },
                });
                // Don't pause immediately — push to pending hints
                // The next tick check will handle the transition
                this.state.pendingHints.push(hint);
              }
            }
          }
        }

        // Queue overflow detection
        if (compState.isHealthy && compState.queueDepth > 0) {
          const maxQueue = getNodeConfig(node, 'maxQueueDepth', DEFAULTS.maxQueueDepth);
          // Bug #7 fix: Guard against division by zero
          if (maxQueue > 0) {
            const queueRatio = compState.queueDepth / maxQueue;
            if (queueRatio > 0.9) {
            newEvents.push({
              type: 'queue_overflow',
              timestamp: this.state.currentTime,
              nodeId,
              queueDepth: compState.queueDepth,
              threshold: maxQueue,
              droppedRequests: Math.max(0, compState.queueDepth - maxQueue),
            });

            // Auto-teach on first queue overflow
            if (this.state.mode.state === 'running' &&
                this.state.currentTime - this.lastTeachingTime > this.teachingCooldown * this.state.speed) {
              this.lastTeachingTime = this.state.currentTime;
              this.state.pendingHints.push(
                EDUCATIONAL_HINTS.queue_overflow({ nodeId })
              );
            }
            }
          }
        }
      }
    }
  }

  private computeVisualUpdates(updates: CanvasVisualUpdate[]): void {
    // Node visuals
    for (const [nodeId, compState] of this.state.componentStates) {
      const node = this.nodeMap.get(nodeId);
      const capacity = node ? getNodeConfig(node, 'capacity', DEFAULTS.nodeCapacity) : DEFAULTS.nodeCapacity;
      const utilization = capacity > 0 ? compState.throughput / capacity : 0;

      // PERF #4: Compute lightweight values first, check against prev before building full object
      const pulseIntensity = Math.min(1, utilization);
      const healthColor = healthColorFromUtilization(utilization, compState.isHealthy);
      const queueDepth = Math.round(compState.queueDepth);
      const queuePercentFull = compState.maxQueueDepth > 0
        ? (compState.queueDepth / compState.maxQueueDepth) * 100
        : 0;

      const prev = this.prevNodeVisuals.get(nodeId);
      if (prev &&
          prev.healthColor === healthColor &&
          prev.pulseIntensity === pulseIntensity &&
          prev.utilization === utilization &&
          prev.queueVisualization?.depth === queueDepth &&
          prev.queueVisualization?.percentFull === queuePercentFull) {
        continue; // Skip full object construction — nothing changed
      }

      // Only construct the full object with expensive string formatting if something changed
      const visualState: NodeVisualState = {
        pulseIntensity,
        utilization, // Add utilization for breathing animation
        healthColor,
        queueVisualization: compState.maxQueueDepth > 0
          ? {
              depth: queueDepth,
              maxDepth: compState.maxQueueDepth,
              percentFull: queuePercentFull,
            }
          : undefined,
        metricsOverlay: {
          throughput: formatRate(compState.throughput),
          latency: formatLatency(compState.latency),
          errorRate: compState.errorRate > 0 ? `${compState.errorRate.toFixed(1)}%` : undefined,
        },
        statusMessage: compState.healthReason,
      };

      updates.push({ type: 'node', id: nodeId, visualState });
      this.prevNodeVisuals.set(nodeId, visualState);
    }

    // Edge visuals
    for (const [edgeId, flowState] of this.state.edgeFlowStates) {
      // PERF #4: Compare values before constructing object
      const congestionLevel = flowState.congestionLevel;
      const particleCount = flowState.particleCount;
      const particleSpeed = flowState.particleSpeed;
      const isBackpressured = flowState.isBackpressured;

      const prev = this.prevEdgeVisuals.get(edgeId);
      if (prev &&
          prev.congestionLevel === congestionLevel &&
          prev.particleFlow?.count === particleCount &&
          prev.particleFlow?.speed === particleSpeed &&
          prev.isBackpressured === isBackpressured) {
        continue; // Skip object construction
      }

      const visualState: EdgeVisualState = {
        particleFlow: {
          count: particleCount,
          speed: particleSpeed,
        },
        congestionLevel,
        isBackpressured,
      };

      updates.push({ type: 'edge', id: edgeId, visualState });
      this.prevEdgeVisuals.set(edgeId, visualState);
    }
  }

  private updateSystemMetrics(): void {
    const metrics = this.state.systemMetrics;
    const nodeCount = this.state.componentStates.size;

    if (nodeCount === 0) return;

    // PERF #11 fix: Single loop over Map iterator instead of spreading to array + multiple reduces
    let totalThroughput = 0;
    let totalLatency = 0;
    let totalErrors = 0;
    let healthyCount = 0;
    let totalQueueDepth = 0;

    // Only count entry nodes for total throughput (avoids double-counting)
    for (const nodeId of this.entryNodeIds) {
      const cs = this.state.componentStates.get(nodeId);
      if (cs) totalThroughput += cs.throughput;
    }

    // Accumulate all other metrics in one pass
    for (const s of this.state.componentStates.values()) {
      totalLatency += isFinite(s.latency) ? s.latency : 0;
      totalErrors += s.errorRate;
      if (s.isHealthy) healthyCount++;
      totalQueueDepth += s.queueDepth;
    }

    metrics.totalThroughput = totalThroughput;
    metrics.averageLatency = nodeCount > 0 ? totalLatency / nodeCount : 0;
    metrics.errorRate = nodeCount > 0 ? totalErrors / nodeCount : 0;
    metrics.healthyNodeCount = healthyCount;
    metrics.unhealthyNodeCount = nodeCount - healthyCount;
    metrics.activeRequestCount = Math.round(totalQueueDepth);

    // Track peaks
    metrics.peakThroughput = Math.max(metrics.peakThroughput, metrics.totalThroughput);
    metrics.peakLatency = Math.max(metrics.peakLatency, metrics.averageLatency);
    metrics.peakQueueDepth = Math.max(metrics.peakQueueDepth, totalQueueDepth);
  }

  // ============================================================================
  // Internal: Graph Traversal
  // ============================================================================

  /**
   * Find all nodes downstream of a given node (BFS on outbound edges).
   */
  private findDownstreamNodes(nodeId: string): string[] {
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const outbound = this.outboundEdges.get(current) ?? [];
      for (const edgeId of outbound) {
        const edge = this.edgeMap.get(edgeId);
        if (edge && !visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    return [...visited];
  }
}
