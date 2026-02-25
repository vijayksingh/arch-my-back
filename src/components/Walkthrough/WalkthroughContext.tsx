/**
 * WalkthroughContext - Shared state for WalkthroughViewer compound components
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { WalkthroughEngine, type WalkthroughStep } from '@/lib/walkthroughEngine';
import type { Walkthrough } from '@/types/walkthrough';
import type { Node, Edge } from '@xyflow/react';
import { useSimulationStore } from '@/stores/simulationStore';

interface WalkthroughContextValue {
  // Core data
  walkthrough: Walkthrough;
  engine: WalkthroughEngine;
  state: ReturnType<WalkthroughEngine['getState']>;

  // Derived state
  currentStep: WalkthroughStep | null;
  progress: { current: number; total: number; percentage: number };
  canGoNext: boolean;
  canGoPrevious: boolean;

  // UI state
  showLearningGoals: boolean;
  setShowLearningGoals: (show: boolean) => void;
  timelineHighlightedNodes: string[];
  setTimelineHighlightedNodes: (nodes: string[]) => void;
  isLeftPanelCollapsed: boolean;
  setIsLeftPanelCollapsed: (collapsed: boolean) => void;

  // Navigation handlers
  handleBack: () => void;
  handleNext: () => Promise<void>;
  handlePrevious: () => Promise<void>;

  // Quiz/Build handlers
  handleQuizAnswer: (selectedOptionIds: string[]) => void;
  handleNodeAdd: (node: Node) => void;
  handleBuildValidationSuccess: () => void;
  handleApplySolution: (nodes: any[], edges: Edge[]) => void;

  // Simulation toggle
  simulationEnabled: boolean;
  toggleSimulation: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

export function useWalkthroughContext() {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthroughContext must be used within WalkthroughProvider');
  }
  return context;
}

interface WalkthroughProviderProps {
  walkthrough: Walkthrough;
  onComplete?: () => void;
  children: ReactNode;
}

export function WalkthroughProvider({ walkthrough, onComplete, children }: WalkthroughProviderProps) {
  const navigate = useNavigate();
  const [engine] = useState(() => new WalkthroughEngine(walkthrough.steps));
  const [state, setState] = useState(() => engine.getState());
  const [showLearningGoals, setShowLearningGoals] = useState(false);
  const [timelineHighlightedNodes, setTimelineHighlightedNodes] = useState<string[]>([]);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [simulationEnabled, setSimulationEnabled] = useState(false);

  const currentStep = engine.getCurrentStep() ?? null;
  const progress = engine.getProgress();
  const canGoNext = engine.canGoNext();
  const canGoPrevious = engine.canGoPrevious();

  const handleBack = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  const handleNext = useCallback(async () => {
    const newState = await engine.next();
    setState(newState);

    if (newState.currentStepIndex >= walkthrough.steps.length) {
      onComplete?.();
    }
  }, [engine, walkthrough.steps.length, onComplete]);

  const handlePrevious = useCallback(async () => {
    const newState = await engine.previous();
    setState(newState);
  }, [engine]);

  const handleQuizAnswer = useCallback((selectedOptionIds: string[]) => {
    if (!currentStep) return;
    engine.submitQuizAnswer(currentStep.id, selectedOptionIds);
    setState(engine.getState());
  }, [engine, currentStep]);

  const handleNodeAdd = useCallback((node: Node) => {
    engine.addUserNode(node);
    setState(engine.getState());
  }, [engine]);

  const handleBuildValidationSuccess = useCallback(() => {
    if (!currentStep) return;
    engine.setBuildModeValidated(currentStep.id, true);
    setState(engine.getState());
  }, [engine, currentStep]);

  const handleApplySolution = useCallback((nodes: any[], edges: Edge[]) => {
    // Apply solution nodes and edges to the canvas
    engine.applySolution(nodes, edges);
    setState(engine.getState());

    // Auto-validate after applying solution
    if (currentStep) {
      engine.setBuildModeValidated(currentStep.id, true);
      setState(engine.getState());
    }
  }, [engine, currentStep]);

  const toggleSimulation = useCallback(() => {
    const simActions = useSimulationStore.getState().actions;
    if (simulationEnabled) {
      // Turning off — reset simulation
      simActions.reset();
      setSimulationEnabled(false);
    } else {
      // Turning on — initialize from current graph
      simActions.initialize(state.canvasNodes as any, state.canvasEdges as any);
      simActions.start();
      setSimulationEnabled(true);
    }
  }, [simulationEnabled, state.canvasNodes, state.canvasEdges]);

  // Reset on step change — re-initialize simulation with new graph from new step
  useEffect(() => {
    if (simulationEnabled) {
      const simActions = useSimulationStore.getState().actions;
      // Re-initialize simulation with new graph from new step
      simActions.reset();
      simActions.initialize(state.canvasNodes as any, state.canvasEdges as any);
      simActions.start();
    }
  }, [state.currentStepIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      useSimulationStore.getState().actions.reset();
    };
  }, []);

  const value: WalkthroughContextValue = {
    walkthrough,
    engine,
    state,
    currentStep,
    progress,
    canGoNext,
    canGoPrevious,
    showLearningGoals,
    setShowLearningGoals,
    timelineHighlightedNodes,
    setTimelineHighlightedNodes,
    isLeftPanelCollapsed,
    setIsLeftPanelCollapsed,
    handleBack,
    handleNext,
    handlePrevious,
    handleQuizAnswer,
    handleNodeAdd,
    handleBuildValidationSuccess,
    handleApplySolution,
    simulationEnabled,
    toggleSimulation,
  };

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
    </WalkthroughContext.Provider>
  );
}
