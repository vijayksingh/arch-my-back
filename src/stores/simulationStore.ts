/**
 * Simulation Store — Bridges SimulationEngine → React state
 *
 * The engine runs in imperative RAF loop. This store subscribes to tick results
 * and exposes reactive state for React components to consume via selectors.
 *
 * Usage:
 *   const isRunning = useSimulationStore(s => s.isRunning);
 *   const metrics = useSimulationStore(s => s.systemMetrics);
 *   const { start, pause, reset } = useSimulationStore(s => s.actions);
 */

import { create } from 'zustand';
import type {
  SystemMetrics,
  MetricsSnapshot,
  NodeVisualState,
  EdgeVisualState,
  FailureScenario,
  EducationalHint,
} from '@/types/simulation';
import type { CanvasNode, ArchEdge } from '@/types';
import { SimulationEngine } from '@/lib/simulation';

// ============================================================================
// Store State
// ============================================================================

interface SimulationStoreState {
  // Derived from engine state (updated on tick)
  isInitialized: boolean;
  isRunning: boolean;
  isPaused: boolean;
  isBroken: boolean;
  isTeaching: boolean;
  speed: 1 | 2 | 4;
  currentTime: number;

  // System metrics (updated at ~10fps)
  systemMetrics: SystemMetrics;

  // Metrics history for time-series charts (ring buffer, max 300 entries)
  metricsHistory: MetricsSnapshot[];

  // Visual states for canvas rendering
  nodeVisualStates: Map<string, NodeVisualState>;
  edgeVisualStates: Map<string, EdgeVisualState>;

  // Active failures and hints
  activeFailures: FailureScenario[];
  currentLesson: EducationalHint | null;

  // Actions
  actions: {
    initialize: (nodes: CanvasNode[], edges: ArchEdge[]) => void;
    start: () => void;
    pause: () => void;
    reset: () => void;
    setSpeed: (speed: 1 | 2 | 4) => void;
    triggerFailure: (scenario: FailureScenario) => void;
    recoverFromFailure: (scenarioId: string) => void;
    acknowledgeLesson: () => void;
    triggerTeachingMode: (lesson: EducationalHint) => void;
    triggerFailureWithTeaching: (scenario: FailureScenario, hint: EducationalHint) => void;
    fixAndResume: () => void;
  };
}

// ============================================================================
// Engine Singleton
// ============================================================================

// The engine is a singleton — only one simulation runs at a time (MVP)
let engine: SimulationEngine | null = null;
let tickUnsubscribe: (() => void) | null = null;
let lastSnapshotTime = 0;

function getOrCreateEngine(): SimulationEngine {
  if (!engine) {
    engine = new SimulationEngine();
  }
  return engine;
}

// ============================================================================
// Store
// ============================================================================

export const useSimulationStore = create<SimulationStoreState>((set) => {
  // Subscribe engine ticks to store updates
  function subscribeToEngine(eng: SimulationEngine): void {
    // Unsubscribe previous if any
    tickUnsubscribe?.();

    tickUnsubscribe = eng.onTick((result) => {
      const state = eng.getState();
      const mode = state.mode;

      // PERF #5 fix: Skip Map copies when no visual updates
      const get = useSimulationStore.getState;
      let nodeVisualsChanged = false;
      let edgeVisualsChanged = false;
      let nodeVisualStates: Map<string, NodeVisualState> | undefined;
      let edgeVisualStates: Map<string, EdgeVisualState> | undefined;

      if (result.visualUpdates.length > 0) {
        const prevNodeVisuals = get().nodeVisualStates;
        const prevEdgeVisuals = get().edgeVisualStates;
        nodeVisualStates = new Map(prevNodeVisuals);
        edgeVisualStates = new Map(prevEdgeVisuals);

        for (const update of result.visualUpdates) {
          if (update.type === 'node') {
            const prev = prevNodeVisuals.get(update.id);
            const next = update.visualState;
            // Simple shallow compare on key fields
            if (!prev ||
                prev.healthColor !== next.healthColor ||
                prev.pulseIntensity !== next.pulseIntensity ||
                prev.queueVisualization?.percentFull !== next.queueVisualization?.percentFull) {
              nodeVisualStates.set(update.id, next);
              nodeVisualsChanged = true;
            }
          } else {
            const prev = prevEdgeVisuals.get(update.id);
            const next = update.visualState;
            if (!prev ||
                prev.congestionLevel !== next.congestionLevel ||
                prev.particleFlow?.speed !== next.particleFlow?.speed) {
              edgeVisualStates.set(update.id, next);
              edgeVisualsChanged = true;
            }
          }
        }
      }

      // Bug #18 fix: Only create new activeFailures array if it changed
      const currentFailures = get().activeFailures;
      const engineFailures = state.activeFailures;
      const failuresChanged = currentFailures.length !== engineFailures.length ||
        currentFailures.some((f, i) => f.id !== engineFailures[i]?.id);

      // PERF #2 fix: Only spread systemMetrics when values changed
      const prevMetrics = get().systemMetrics;
      const newMetrics = result.systemMetrics;
      const metricsChanged = !prevMetrics ||
        prevMetrics.totalThroughput !== newMetrics.totalThroughput ||
        prevMetrics.averageLatency !== newMetrics.averageLatency ||
        prevMetrics.errorRate !== newMetrics.errorRate ||
        prevMetrics.healthyNodeCount !== newMetrics.healthyNodeCount;

      set({
        isRunning: mode.state === 'running',
        isPaused: mode.state === 'paused',
        isBroken: mode.state === 'broken',
        isTeaching: mode.state === 'teaching',
        speed: state.speed,
        currentTime: state.currentTime,
        ...(metricsChanged ? { systemMetrics: { ...newMetrics } } : {}),
        ...(nodeVisualsChanged ? { nodeVisualStates } : {}),
        ...(edgeVisualsChanged ? { edgeVisualStates } : {}),
        ...(failuresChanged ? { activeFailures: [...engineFailures] } : {}),
        currentLesson: mode.state === 'teaching' ? mode.lesson : null,
      });

      // Throttle metrics history snapshots to ~1 per second (wall-clock time)
      const now = Date.now();
      if (now - lastSnapshotTime >= 1000) {
        lastSnapshotTime = now;
        const currentTime = state.currentTime;
        set(prev => ({
          metricsHistory: [
            ...(prev.metricsHistory.length >= 300
              ? prev.metricsHistory.slice(1)
              : prev.metricsHistory),
            { timestamp: currentTime, metrics: { ...result.systemMetrics } }
          ]
        }));
      }
    });
  }

  return {
    // Initial state
    isInitialized: false,
    isRunning: false,
    isPaused: true,
    isBroken: false,
    isTeaching: false,
    speed: 1,
    currentTime: 0,
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
    metricsHistory: [],
    nodeVisualStates: new Map(),
    edgeVisualStates: new Map(),
    activeFailures: [],
    currentLesson: null,

    actions: {
      initialize(nodes: CanvasNode[], edges: ArchEdge[]) {
        const eng = getOrCreateEngine();
        eng.initialize({ nodes, edges });
        subscribeToEngine(eng);
        set({ isInitialized: true, isPaused: true, isRunning: false });
      },

      start() {
        const eng = getOrCreateEngine();
        eng.start();
        set({ isRunning: true, isPaused: false, isBroken: false, isTeaching: false });
      },

      pause() {
        const eng = getOrCreateEngine();
        eng.pause();
        set({ isRunning: false, isPaused: true });
      },

      reset() {
        const eng = getOrCreateEngine();
        eng.reset();
        lastSnapshotTime = Date.now();
        set({
          isRunning: false,
          isPaused: true,
          isBroken: false,
          isTeaching: false,
          currentTime: 0,
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
          metricsHistory: [],
          nodeVisualStates: new Map(),
          edgeVisualStates: new Map(),
          activeFailures: [],
          currentLesson: null,
        });
      },

      setSpeed(speed: 1 | 2 | 4) {
        const eng = getOrCreateEngine();
        eng.setSpeed(speed);
        set({ speed });
      },

      triggerFailure(scenario: FailureScenario) {
        const eng = getOrCreateEngine();
        eng.triggerFailure(scenario);
        const mode = eng.getState().mode;
        set({
          isBroken: mode.state === 'broken',
          isRunning: mode.state === 'running',
          activeFailures: [...eng.getState().activeFailures],
        });
      },

      recoverFromFailure(scenarioId: string) {
        const eng = getOrCreateEngine();
        eng.recoverFromFailure(scenarioId);
        const engineState = eng.getState();
        const newState: Partial<SimulationStoreState> = {
          activeFailures: [...engineState.activeFailures],
        };
        // FIX 3: If all failures cleared, update mode flags
        if (engineState.activeFailures.length === 0) {
          newState.isBroken = false;
          newState.isPaused = true;
          newState.isRunning = false;
        }
        set(newState);
      },

      acknowledgeLesson() {
        const eng = getOrCreateEngine();
        eng.resumeFromTeaching();
        set({ isTeaching: false, currentLesson: null, isPaused: true });
      },

      triggerTeachingMode(lesson: EducationalHint) {
        const eng = getOrCreateEngine();
        eng.pauseForTeaching(lesson);
        set({ isTeaching: true, currentLesson: lesson, isPaused: true });
      },

      // FIX 2: Atomic triggerFailureWithTeaching action
      triggerFailureWithTeaching(scenario: FailureScenario, hint: EducationalHint) {
        const eng = getOrCreateEngine();
        eng.triggerFailure(scenario);
        // Store the hint — it will be shown after cascading events complete
        eng.getState().pendingHints.push(hint);
        const mode = eng.getState().mode;
        set({
          isBroken: mode.state === 'broken',
          isRunning: false, // Even though tick continues, from user POV sim is "failing"
          activeFailures: [...eng.getState().activeFailures],
        });
      },

      // FIX 4: Atomic fixAndResume action
      fixAndResume() {
        const eng = getOrCreateEngine();
        // Get current failures from engine (not React state — avoids stale closure)
        const failures = eng.getState().activeFailures;
        // Recover ALL failures
        for (const f of failures) {
          eng.recoverFromFailure(f.id);
        }
        // Clear teaching state
        eng.resumeFromTeaching();
        // Restart
        eng.start();
        set({
          activeFailures: [],
          isBroken: false,
          isTeaching: false,
          isPaused: false,
          isRunning: true,
          currentLesson: null,
        });
      },
    },
  };
});
