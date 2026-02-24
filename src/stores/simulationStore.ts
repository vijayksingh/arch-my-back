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
  SimulationEvent,
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

  // Recent events for timeline (last 100)
  recentEvents: SimulationEvent[];

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

const MAX_EVENTS = 100;

export const useSimulationStore = create<SimulationStoreState>((set) => {
  // Subscribe engine ticks to store updates
  function subscribeToEngine(eng: SimulationEngine): void {
    // Unsubscribe previous if any
    tickUnsubscribe?.();

    tickUnsubscribe = eng.onTick((result) => {
      const state = eng.getState();
      const mode = state.mode;

      // Build visual state maps from tick result
      const nodeVisualStates = new Map<string, NodeVisualState>();
      const edgeVisualStates = new Map<string, EdgeVisualState>();

      for (const update of result.visualUpdates) {
        if (update.type === 'node') {
          nodeVisualStates.set(update.id, update.visualState as NodeVisualState);
        } else {
          edgeVisualStates.set(update.id, update.visualState as EdgeVisualState);
        }
      }

      set({
        isRunning: mode.state === 'running',
        isPaused: mode.state === 'paused',
        isBroken: mode.state === 'broken',
        isTeaching: mode.state === 'teaching',
        speed: state.speed,
        currentTime: state.currentTime,
        systemMetrics: { ...result.systemMetrics },
        nodeVisualStates,
        edgeVisualStates,
        activeFailures: [...state.activeFailures],
        currentLesson: mode.state === 'teaching' ? mode.lesson : null,
        recentEvents: [...state.events.slice(-MAX_EVENTS)],
      });

      // Throttle metrics history snapshots to ~1 per second
      const currentTime = state.currentTime;
      if (currentTime - lastSnapshotTime >= 1000) {
        lastSnapshotTime = currentTime;
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
    recentEvents: [],

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
        lastSnapshotTime = 0;
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
          recentEvents: [],
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
        set({ activeFailures: [...eng.getState().activeFailures] });
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
    },
  };
});
