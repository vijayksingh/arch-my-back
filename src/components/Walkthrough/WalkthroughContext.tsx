/**
 * WalkthroughContext - Shared state for WalkthroughViewer compound components
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { WalkthroughEngine, type WalkthroughStep } from '@/lib/walkthroughEngine';
import type { Walkthrough } from '@/types/walkthrough';
import type { Node } from '@xyflow/react';

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

  // Navigation handlers
  handleBack: () => void;
  handleNext: () => Promise<void>;
  handlePrevious: () => Promise<void>;

  // Quiz/Build handlers
  handleQuizAnswer: (selectedOptionIds: string[]) => void;
  handleNodeAdd: (node: Node) => void;
  handleBuildValidationSuccess: () => void;
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
    handleBack,
    handleNext,
    handlePrevious,
    handleQuizAnswer,
    handleNodeAdd,
    handleBuildValidationSuccess,
  };

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
    </WalkthroughContext.Provider>
  );
}
