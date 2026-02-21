/**
 * WalkthroughViewer - Main component for interactive walkthrough experiences
 *
 * Features:
 * - Split-screen layout (text + canvas)
 * - Step navigation with progress tracking
 * - Quiz validation
 * - Canvas synchronization
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextPanel } from './TextPanel';
import { CanvasPanel } from './CanvasPanel';
import { WalkthroughEngine, type WalkthroughStep } from '@/lib/walkthroughEngine';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WalkthroughViewerProps {
  steps: WalkthroughStep[];
  onComplete?: () => void;
}

export function WalkthroughViewer({ steps, onComplete }: WalkthroughViewerProps) {
  const [engine] = useState(() => new WalkthroughEngine(steps));
  const [state, setState] = useState(() => engine.getState());
  const [quizResult, setQuizResult] = useState<{ correct: boolean; explanation?: string }>();

  const currentStep = engine.getCurrentStep();
  const progress = engine.getProgress();
  const canGoNext = engine.canGoNext();
  const canGoPrevious = engine.canGoPrevious();

  const handleNext = () => {
    const newState = engine.next();
    setState(newState);
    setQuizResult(undefined);

    // Check if completed
    if (newState.currentStepIndex >= steps.length) {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    const newState = engine.previous();
    setState(newState);
    setQuizResult(undefined);
  };

  const handleQuizAnswer = (selectedIndex: number) => {
    if (!currentStep) return;

    const result = engine.submitQuizAnswer(currentStep.id, selectedIndex);
    setQuizResult(result);
    setState(engine.getState());
  };

  if (!currentStep) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Walkthrough Complete!</h2>
          <p className="mt-2 text-muted-foreground">
            You've completed all {steps.length} steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header with progress */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Step {progress.current} of {progress.total}
            </h2>
            <h1 className="text-xl font-bold">{currentStep.title}</h1>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canGoNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Split-screen content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Text panel */}
        <div className="w-1/2 border-r border-border">
          <TextPanel
            title={currentStep.title}
            content={currentStep.content}
            quiz={currentStep.quiz}
            quizAnswer={state.quizAnswers[currentStep.id]}
            onQuizAnswer={handleQuizAnswer}
            quizResult={quizResult}
          />
        </div>

        {/* Right: Canvas panel */}
        <div className="w-1/2">
          <CanvasPanel
            nodes={state.canvasNodes}
            edges={state.canvasEdges}
            highlightedNodeIds={state.highlightedNodeIds}
            animatedEdgeIds={state.animatedEdgeIds}
          />
        </div>
      </div>
    </div>
  );
}
