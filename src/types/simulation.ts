/**
 * Simulation Engine Type Definitions
 *
 * This file defines all types for the simulation system that transforms static
 * architecture diagrams into realistic, educational simulations.
 *
 * Design Philosophy:
 * - Start simple (throughput/latency) but design for extensibility (queue theory, backpressure)
 * - Plugin-based behaviors allow adding complexity without rewriting core engine
 * - Event-driven architecture enables educational hints and timeline integration
 */

import type { CanvasNode, ArchEdge } from './index';
import type { ComponentTypeKey } from './componentTypes';

// ============================================================================
// Simulation State Machine
// ============================================================================

/**
 * Simulation modes define the current state of the simulation engine.
 *
 * Transitions:
 * - paused → running (user clicks play)
 * - running → paused (user clicks pause)
 * - running → broken (system detects failure condition)
 * - broken → teaching (system shows educational explanation)
 * - teaching → paused (user acknowledges lesson, ready to fix)
 * - paused → running (user fixes issue and resumes)
 *
 * Note: 'broken' and 'teaching' auto-pause the simulation to give user time to learn.
 */
export type SimulationMode =
  | { state: 'paused'; reason?: string }
  | { state: 'running'; speed: 1 | 2 | 4 }
  | { state: 'broken'; failure: FailureScenario }
  | { state: 'teaching'; lesson: EducationalHint };

/**
 * Failure scenarios represent realistic system breakage conditions.
 * Each type maps to specific educational content and recovery strategies.
 */
export interface FailureScenario {
  id: string;
  type: 'bottleneck' | 'queue_overflow' | 'cascading_failure' | 'circuit_breaker_open' | 'timeout' | 'resource_exhaustion';
  severity: 'warning' | 'error' | 'critical';
  affectedNodeIds: string[];
  rootCauseNodeId: string;
  detectedAt: number; // timestamp in simulation time
  message: string; // user-facing explanation
  suggestedPattern?: string; // architecture pattern that could solve this
  metrics?: Record<string, number>; // relevant metrics at time of failure
}

/**
 * Educational hints are teaching moments triggered by simulation events.
 * These explain why something happened and how to fix/prevent it.
 */
export interface EducationalHint {
  id: string;
  type: 'pattern_opportunity' | 'best_practice' | 'failure_explanation' | 'success_celebration';
  title: string;
  message: string;
  relatedNodeIds?: string[];
  actionSuggestion?: string; // what user can try next
  learnMoreUrl?: string; // link to deeper explanation
}

// ============================================================================
// Simulation State
// ============================================================================

/**
 * Core simulation state that evolves over time.
 * This is the single source of truth for the simulation engine.
 */
export interface SimulationState {
  mode: SimulationMode;
  currentTime: number; // milliseconds since simulation start
  speed: 1 | 2 | 4; // time multiplier (1x, 2x, 4x)
  isInitialized: boolean;

  // Graph structure (reference to canvas state, NOT duplicated)
  // Simulation reads this, does NOT own it
  graphNodeIds: string[];
  graphEdgeIds: string[];

  // Per-component runtime state
  componentStates: Map<string, ComponentState>; // nodeId -> state

  // Per-edge flow state
  edgeFlowStates: Map<string, EdgeFlowState>; // edgeId -> flow metrics

  // System-wide metrics (aggregated)
  systemMetrics: SystemMetrics;

  // Event log for timeline widget
  events: SimulationEvent[];

  // Failure tracking
  activeFailures: FailureScenario[];

  // Teaching moment queue
  pendingHints: EducationalHint[];
}

/**
 * Runtime state for a single component (node) in the system.
 * Updated every simulation tick based on component behavior plugin.
 */
export interface ComponentState {
  nodeId: string;
  componentType: ComponentTypeKey;

  // Operational metrics
  queueDepth: number; // current number of requests waiting
  maxQueueDepth: number; // configured capacity
  throughput: number; // requests/sec currently being processed
  latency: number; // milliseconds average response time
  errorRate: number; // percentage of failed requests (0-100)

  // Health state
  isHealthy: boolean;
  healthReason?: string; // why unhealthy (if applicable)

  // Resource utilization (future: for advanced modeling)
  cpuUtilization?: number; // percentage (0-100)
  memoryUsage?: number; // percentage (0-100)
  connectionPool?: {
    active: number;
    idle: number;
    max: number;
  };

  // Behavior-specific state (extensible)
  // e.g., circuit breaker might store { state: 'open', openedAt: timestamp }
  behaviorState?: Record<string, unknown>;
}

/**
 * Flow state for a single edge (connection between components).
 * Represents request traffic flowing through the connection.
 */
export interface EdgeFlowState {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;

  // Traffic metrics
  requestsPerSecond: number; // current flow rate
  averageLatency: number; // time requests spend in transit

  // Congestion indicators
  congestionLevel: number; // 0-1, affects visual rendering (color, thickness)
  isBackpressured: boolean; // downstream can't keep up

  // Visual animation state (drives particle effects on canvas)
  particleCount: number; // number of animated particles to show
  particleSpeed: number; // pixels per second
}

/**
 * System-wide aggregated metrics.
 * Used by metrics dashboard widget.
 */
export interface SystemMetrics {
  totalThroughput: number; // requests/sec across all entry nodes
  averageLatency: number; // ms across all request paths
  errorRate: number; // percentage of failed requests system-wide
  healthyNodeCount: number;
  unhealthyNodeCount: number;
  activeRequestCount: number; // total in-flight requests

  // Peak tracking (for educational comparison)
  peakThroughput: number;
  peakLatency: number;
  peakQueueDepth: number;
}

/** A timestamped snapshot of system metrics for time-series charts */
export interface MetricsSnapshot {
  timestamp: number; // simulation time
  metrics: SystemMetrics;
}

// ============================================================================
// Component Behavior Plugin System
// ============================================================================

/**
 * Behavior plugins define how different component types behave under load.
 *
 * Design Goals:
 * - MVP behaviors are simple (calculateThroughput, calculateLatency)
 * - Optional methods allow extending with complex behaviors (queue theory, backpressure)
 * - Behaviors are registered per component type, can be overridden/extended
 *
 * Extensibility Path:
 * 1. Start: Simple behaviors (throughput = min(load, capacity))
 * 2. Later: Add optional queueing models (M/M/1, M/M/c)
 * 3. Later: Add optional backpressure logic
 * 4. Later: Add optional failure detection heuristics
 */
export interface ComponentBehavior {
  /**
   * Calculate throughput given current load and component capacity.
   * MVP implementation: min(load, capacity)
   * Advanced: Can model queue spillover, load shedding, etc.
   */
  calculateThroughput(params: {
    incomingLoad: number; // requests/sec arriving
    capacity: number; // max requests/sec this component can handle
    currentQueueDepth: number;
    state: ComponentState;
  }): number;

  /**
   * Calculate latency given current queue depth and service time.
   * MVP implementation: baseLatency + (queueDepth * averageServiceTime)
   * Advanced: Can use Little's Law, queue theory formulas
   */
  calculateLatency(params: {
    queueDepth: number;
    serviceTime: number; // ms per request
    throughput: number; // current throughput
    state: ComponentState;
    capacity?: number; // max requests/sec (for M/M/1 utilization)
    incomingLoad?: number; // requests/sec arriving (for M/M/1 utilization)
  }): number;

  /**
   * Calculate queue depth change for this tick.
   * Returns delta to add to current queue depth.
   * MVP implementation: (incomingLoad - throughput) * deltaTime
   */
  calculateQueueDepthChange(params: {
    incomingLoad: number;
    outgoingThroughput: number;
    deltaTime: number; // seconds since last tick
    currentQueueDepth: number;
    maxQueueDepth: number;
  }): number;

  /**
   * [FUTURE] Model queueing behavior using queue theory.
   * Optional method for advanced behaviors (e.g., M/M/1 queue).
   */
  modelQueueing?(params: {
    arrivalRate: number; // λ (lambda)
    serviceRate: number; // μ (mu)
    numServers: number; // c (for M/M/c queues)
  }): QueueState;

  /**
   * [FUTURE] Calculate backpressure effects when queue is near capacity.
   * Optional method for advanced flow control modeling.
   */
  calculateBackpressure?(params: {
    queueDepth: number;
    threshold: number; // queue depth % to trigger backpressure
    downstreamCapacity: number;
  }): BackpressureEffect;

  /**
   * [FUTURE] Detect failure conditions based on current metrics.
   * Optional method for advanced failure scenario modeling.
   * Returns null if no failure detected.
   */
  detectFailureConditions?(params: {
    metrics: ComponentState;
    historicalMetrics?: ComponentState[]; // last N ticks
  }): FailureMode | null;
}

/**
 * [FUTURE] Queue theory state for advanced modeling.
 */
export interface QueueState {
  utilization: number; // ρ = λ/μ (rho)
  averageQueueLength: number; // L (Little's Law)
  averageWaitTime: number; // W (Little's Law)
  probabilityOfQueuing: number; // Erlang C formula
}

/**
 * [FUTURE] Backpressure effects on upstream components.
 */
export interface BackpressureEffect {
  type: 'slow_down' | 'shed_load' | 'circuit_break';
  intensity: number; // 0-1, how much to reduce throughput
  message: string; // explanation for educational purposes
}

/**
 * [FUTURE] Failure modes detected by behavior plugins.
 */
export interface FailureMode {
  type: 'overload' | 'timeout' | 'circuit_open' | 'resource_exhausted';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  suggestedAction?: string;
}

/**
 * Behavior registry manages component type → behavior mappings.
 * Allows overriding default behaviors for testing/extensibility.
 */
export interface BehaviorRegistry {
  /**
   * Register a behavior for a component type.
   * Overwrites existing behavior if already registered.
   */
  register(componentType: ComponentTypeKey, behavior: ComponentBehavior): void;

  /**
   * Get behavior for a component type.
   * Returns default behavior if none registered.
   */
  get(componentType: ComponentTypeKey): ComponentBehavior;

  /**
   * Check if a component type has a registered behavior.
   */
  has(componentType: ComponentTypeKey): boolean;

  /**
   * Get all registered component types.
   */
  getRegisteredTypes(): ComponentTypeKey[];
}

// ============================================================================
// Simulation Loop & Engine Interface
// ============================================================================

/**
 * Tick result contains all state changes from a single simulation tick.
 * Returned by the simulation loop to update stores/UI.
 */
export interface SimulationTickResult {
  deltaTime: number; // actual time elapsed (ms) accounting for speed multiplier
  updatedComponentStates: Map<string, ComponentState>;
  updatedEdgeFlowStates: Map<string, EdgeFlowState>;
  systemMetrics: SystemMetrics;
  newEvents: SimulationEvent[];
  newFailures: FailureScenario[];
  newHints: EducationalHint[];
  visualUpdates: CanvasVisualUpdate[];
}

/**
 * Visual updates to apply to canvas nodes/edges.
 * Simulation engine produces these, canvas consumes them.
 */
export type CanvasVisualUpdate =
  | { type: 'node'; id: string; visualState: NodeVisualState }
  | { type: 'edge'; id: string; visualState: EdgeVisualState };

/**
 * Visual state for a node on the canvas.
 * Written to node.data by simulation, read by node renderers.
 */
export interface NodeVisualState {
  // Pulsing animation intensity (0-1)
  pulseIntensity: number;

  // Utilization ratio (0-1): incomingLoad / capacity
  // Used for breathing animation speed
  utilization?: number;

  // Health color indicator
  healthColor: 'green' | 'yellow' | 'red' | 'gray';

  // Queue visualization (optional, for nodes with visible queues)
  queueVisualization?: {
    depth: number;
    maxDepth: number;
    percentFull: number; // 0-100
  };

  // Metrics overlay (optional, shown on hover or always)
  metricsOverlay?: {
    throughput: string; // formatted e.g., "1.2k/s"
    latency: string; // formatted e.g., "45ms"
    errorRate?: string; // formatted e.g., "2.3%"
  };

  // Status message (optional, explains current health state)
  statusMessage?: string; // e.g., "Database killed", "High queue pressure"
}

/**
 * Visual state for an edge on the canvas.
 * Written to edge properties by simulation, read by edge renderers.
 */
export interface EdgeVisualState {
  // Particle flow animation
  particleFlow: {
    count: number; // number of particles to render
    speed: number; // animation speed (pixels/sec)
  };

  // Congestion visual indicator
  congestionLevel: number; // 0-1, affects edge color/thickness

  // Backpressure indicator (optional)
  isBackpressured?: boolean;
}

/**
 * Main simulation engine interface.
 * This is what canvas, walkthrough, and widgets interact with.
 */
export interface ISimulationEngine {
  // Lifecycle
  initialize(graph: { nodes: CanvasNode[]; edges: ArchEdge[] }): void;
  start(): void;
  pause(reason?: string): void;
  resume(): void;
  reset(): void;

  // Speed control
  setSpeed(speed: 1 | 2 | 4): void;
  getSpeed(): 1 | 2 | 4;

  // State access
  getState(): SimulationState;
  getComponentState(nodeId: string): ComponentState | undefined;
  getSystemMetrics(): SystemMetrics;

  // Event subscription
  on(event: SimulationEventType, handler: (data: unknown) => void): () => void;

  // Walkthrough integration
  pauseForTeaching(lesson: EducationalHint): void;
  resumeFromTeaching(): void;

  // Manual scenario triggering (for testing/walkthrough demos)
  triggerFailure(scenario: FailureScenario): void;
  recoverFromFailure(scenarioId: string): void;
}

// ============================================================================
// Event System
// ============================================================================

/**
 * Simulation events are emitted by the engine for UI widgets to consume.
 *
 * Consumers:
 * - Timeline widget displays event log
 * - Metrics dashboard shows event markers on charts
 * - Walkthrough system pauses and explains failures
 * - Hint UI shows callout bubbles on canvas nodes
 */
export type SimulationEvent =
  | BottleneckDetectedEvent
  | QueueOverflowEvent
  | CascadingFailureEvent
  | PatternOpportunityEvent
  | SlaViolationEvent
  | SuccessEvent
  | ComponentStateChangeEvent;

export interface BottleneckDetectedEvent {
  type: 'bottleneck_detected';
  timestamp: number; // simulation time
  nodeId: string;
  severity: number; // 0-1
  suggestion: string; // e.g., "Add caching layer to reduce load"
  metrics: {
    throughput: number;
    capacity: number;
    utilizationPercent: number;
  };
}

export interface QueueOverflowEvent {
  type: 'queue_overflow';
  timestamp: number;
  nodeId: string;
  queueDepth: number;
  threshold: number;
  droppedRequests?: number; // if modeling request dropping
}

export interface CascadingFailureEvent {
  type: 'cascading_failure';
  timestamp: number;
  rootCauseNodeId: string;
  affectedNodeIds: string[];
  propagationPath: string[]; // ordered list of nodes in failure chain
  explanation: string;
}

export interface PatternOpportunityEvent {
  type: 'pattern_opportunity';
  timestamp: number;
  pattern: string; // e.g., "Circuit Breaker", "Load Balancer", "Cache-Aside"
  benefit: string; // e.g., "Prevent cascading failures"
  relatedNodeIds: string[];
}

export interface SlaViolationEvent {
  type: 'sla_violation';
  timestamp: number;
  metric: 'latency' | 'throughput' | 'availability';
  target: number;
  actual: number;
  severity: 'warning' | 'error';
}

export interface SuccessEvent {
  type: 'success';
  timestamp: number;
  message: string; // e.g., "System handled 10k requests without failures!"
  celebration: true;
}

export interface ComponentStateChangeEvent {
  type: 'component_state_change';
  timestamp: number;
  nodeId: string;
  previousHealth: boolean;
  currentHealth: boolean;
  reason?: string;
}

/**
 * Event types for subscription system.
 */
export type SimulationEventType = SimulationEvent['type'] | 'tick' | 'state_change' | '*';

/**
 * Event bus for publishing/subscribing to simulation events.
 */
export interface EventBus {
  emit(event: SimulationEvent): void;
  subscribe(eventType: SimulationEventType, listener: (event: SimulationEvent) => void): () => void;
  clear(): void;
}

// ============================================================================
// Integration Contracts
// ============================================================================

/**
 * Contract between simulation engine and canvas.
 * Canvas reads this state to render visual updates.
 */
export interface CanvasSimulationState {
  // Visual state for each node
  nodeVisualStates: Map<string, NodeVisualState>;

  // Visual state for each edge
  edgeVisualStates: Map<string, EdgeVisualState>;

  // Highlighted nodes (for teaching moments)
  highlightedNodeIds: string[];

  // Animated edges (for flow visualization)
  animatedEdgeIds: string[];
}

/**
 * Contract between simulation engine and metrics dashboard widget.
 * Dashboard polls this or subscribes to updates.
 */
export interface SimulationMetricsExport {
  // Current metrics snapshot
  current: SystemMetrics;

  // Per-node metrics (for detail view)
  nodeMetrics: Map<string, {
    throughput: number;
    latency: number;
    queueDepth: number;
    errorRate: number;
    isHealthy: boolean;
  }>;

  // Time series data (for charts)
  // Last N seconds of data points
  timeSeries?: {
    timestamps: number[];
    throughput: number[];
    latency: number[];
    errorRate: number[];
  };
}

/**
 * Contract between simulation engine and timeline widget.
 * Timeline reads event log from simulation state.
 */
export interface SimulationTimelineExport {
  events: Array<{
    timestamp: number;
    type: SimulationEvent['type'];
    nodeId?: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    metadata?: Record<string, unknown>;
  }>;

  // How many events to keep in memory
  maxEvents: number;

  // Current simulation time (for relative timestamps)
  currentTime: number;
}

/**
 * Contract between simulation engine and walkthrough system.
 * Defines how simulation and walkthrough coordinate.
 */
export interface WalkthroughSimulationSync {
  /**
   * Called when walkthrough changes step.
   * Simulation may need to reset, pause, or configure for new step.
   */
  onStepChange(stepId: string, stepConfig?: {
    autoStart?: boolean;
    initialSpeed?: 1 | 2 | 4;
    scenarioToTrigger?: string;
  }): void;

  /**
   * Called when simulation detects a failure.
   * Returns true if walkthrough wants to handle it (pause and explain),
   * false if simulation should handle normally.
   */
  onFailureDetected(failure: FailureScenario): boolean;

  /**
   * Called when simulation has a teaching moment.
   * Walkthrough may display hint or continue step narration.
   */
  onTeachingMoment(hint: EducationalHint): void;

  /**
   * Walkthrough can control simulation speed.
   * e.g., slow down to 0.5x for detailed explanation
   */
  setSimulationSpeed(speed: number): void;

  /**
   * Walkthrough can inject synthetic load patterns.
   * e.g., "simulate traffic spike at t=10s"
   */
  injectLoadPattern?(pattern: LoadPattern): void;
}

/**
 * Load patterns for walkthrough-driven scenarios.
 */
export interface LoadPattern {
  type: 'constant' | 'spike' | 'ramp' | 'sine_wave';
  startTime: number; // simulation time
  duration: number; // how long pattern lasts
  baseLoad: number; // requests/sec baseline
  peakLoad?: number; // for spike/ramp patterns
  period?: number; // for sine_wave pattern
}

// ============================================================================
// Failure Propagation & Recovery
// ============================================================================

/**
 * Failure propagation model for cascading failures.
 * Two approaches documented:
 * 1. Graph traversal (analyze dependencies, compute downstream impact)
 * 2. Event-driven (emit failure events, components react)
 *
 * Recommended: Event-driven for extensibility and testability.
 */
export interface FailurePropagation {
  /**
   * Compute which nodes will be affected by a node failure.
   * Uses graph traversal to find downstream dependencies.
   *
   * Returns set of node IDs that will experience degradation/failure.
   */
  computeDownstreamImpact(
    failedNodeId: string,
    graph: { nodes: CanvasNode[]; edges: ArchEdge[] }
  ): Set<string>;

  /**
   * Calculate how long it will take for a failure to propagate.
   * Based on timeout configurations, retry policies, circuit breaker thresholds.
   */
  estimatePropagationTime(
    failedNodeId: string,
    affectedNodeIds: Set<string>
  ): Map<string, number>; // nodeId -> time until affected (ms)

  /**
   * Compute recovery timeline.
   * When failed node comes back, how long until dependent nodes recover?
   */
  estimateRecoveryTime(
    recoveredNodeId: string,
    previouslyAffectedNodeIds: Set<string>
  ): Map<string, number>; // nodeId -> time until recovered (ms)
}

/**
 * Event-driven failure propagation (recommended approach).
 * Failures emit events, components listen and react.
 */
export interface FailureEventChain {
  /**
   * When a node fails, generate a chain of failure events.
   * Each event has a timestamp offset (when it will occur).
   * Simulation engine schedules these events.
   */
  generateFailureEvents(
    failedNodeId: string,
    graph: { nodes: CanvasNode[]; edges: ArchEdge[] }
  ): ScheduledFailureEvent[];
}

export interface ScheduledFailureEvent {
  nodeId: string;
  event: 'requests_timing_out' | 'queue_overflow' | 'circuit_breaker_open' | 'node_unhealthy';
  delay: number; // ms after initial failure
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Behavior Examples (Type Definitions Only)
// ============================================================================

/**
 * Simple database behavior parameters.
 * Used to configure a database component in the simulation.
 */
export interface SimpleDatabaseBehavior {
  baseLatency: number; // ms for query with empty queue
  capacity: number; // max queries/sec
  queueLatencyMultiplier: number; // ms added per request in queue
  connectionPoolSize: number; // max concurrent connections
}

/**
 * Load balancer behavior parameters.
 * Distributes load across multiple backend nodes.
 */
export interface LoadBalancerBehavior {
  algorithm: 'round_robin' | 'least_connections' | 'random';
  healthCheckInterval: number; // ms between health checks
  backendNodeIds: string[]; // which nodes to balance across
  baseLatency: number; // overhead of load balancer itself (ms)
}

/**
 * Cache behavior parameters.
 * Models cache hit ratio and reduced load on backing store.
 */
export interface CacheBehavior {
  hitRatio: number; // 0-1, percentage of requests served from cache
  cacheLatency: number; // ms for cache hit
  backingStoreNodeId: string; // where to forward cache misses
  evictionPolicy: 'lru' | 'lfu' | 'ttl';
  maxSize: number; // number of items cache can hold
}
