/**
 * WalkthroughViewer - Main component for interactive walkthrough experiences
 *
 * Features:
 * - Split-screen layout (text + canvas)
 * - Step navigation with progress tracking
 * - Quiz validation
 * - Canvas synchronization
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { TextPanel } from './TextPanel';
import { CanvasPanel } from './CanvasPanel';
import { WalkthroughEngine, type WalkthroughStep } from '@/lib/walkthroughEngine';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import type { Node, Connection } from '@xyflow/react';

interface WalkthroughViewerProps {
  steps: WalkthroughStep[];
  onComplete?: () => void;
}

export function WalkthroughViewer({ steps, onComplete }: WalkthroughViewerProps) {
  const [engine] = useState(() => new WalkthroughEngine(steps));
  const [state, setState] = useState(() => engine.getState());

  const currentStep = engine.getCurrentStep();
  const progress = engine.getProgress();
  const canGoNext = engine.canGoNext();
  const canGoPrevious = engine.canGoPrevious();

  // Scrollytelling Observer
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    // Calculate the center of the visible area in the container's scroll space
    const containerCenter = latest + container.clientHeight / 2;
    
    const elements = container.querySelectorAll('.step-container');
    let activeIndex = state.currentStepIndex;
    let minDistance = Infinity;

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const index = parseInt(htmlEl.getAttribute('data-step-index') || '0', 10);
      const elCenter = htmlEl.offsetTop + htmlEl.offsetHeight / 2;
      const distance = Math.abs(containerCenter - elCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = index;
      }
    });

    if (activeIndex !== state.currentStepIndex && activeIndex <= state.completedStepIds.length) {
      setState(engine.goToStep(activeIndex));
    }
  });

  const handleNext = () => {
    const newState = engine.next();
    setState(newState);

    // Check if completed
    if (newState.currentStepIndex >= steps.length) {
      onComplete?.();
    } else {
      // Smooth scroll to next step
      const nextEl = document.getElementById(`step-${newState.currentStepIndex}`);
      if (nextEl) {
        nextEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handlePrevious = () => {
    const newState = engine.previous();
    setState(newState);
    
    const prevEl = document.getElementById(`step-${newState.currentStepIndex}`);
    if (prevEl) {
      prevEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuizAnswer = (stepId: string, selectedIndex: number) => {
    engine.submitQuizAnswer(stepId, selectedIndex);
    setState(engine.getState());
  };

  const getQuizResult = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    const ans = state.quizAnswers[stepId];
    if (step?.quiz && ans !== undefined) {
      return {
        correct: ans === step.quiz.correctIndex,
        explanation: step.quiz.explanation
      };
    }
    return undefined;
  };

  const isDraggingRequired = currentStep?.requiredAction?.type === 'drag-node';
  const isConnectingRequired = currentStep?.requiredAction?.type === 'connect-edge';

  const handleNodeDragStop = (e: React.MouseEvent, node: Node) => {
    if (isDraggingRequired && currentStep?.requiredAction?.targetId === node.id) {
      engine.completeAction(currentStep.id);
      setState(engine.getState());
    }
  };

  const handleConnect = (connection: Connection) => {
    if (
      isConnectingRequired &&
      currentStep?.requiredAction?.sourceId === connection.source &&
      currentStep?.requiredAction?.targetNodeId === connection.target
    ) {
      engine.completeAction(currentStep.id);
      setState(engine.getState());
    }
  };

  const visibleSteps = steps.filter((step, index) => {
    if (index === 0) return true;
    return state.completedStepIds.includes(steps[index - 1].id) || state.currentStepIndex >= index;
  });

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
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Background Canvas (Full bleed) */}
      <div className="absolute inset-0 z-0">
        <CanvasPanel
          nodes={state.canvasNodes}
          edges={state.canvasEdges}
          highlightedNodeIds={state.highlightedNodeIds}
          animatedEdgeIds={state.animatedEdgeIds}
          nodesDraggable={isDraggingRequired}
          nodesConnectable={isConnectingRequired}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
        />
      </div>

      {/* Floating UI Layer */}
      <div className="pointer-events-none absolute inset-0 z-10 flex p-6">
        {/* Floating Text/Editor Panel */}
        <motion.div 
          className="pointer-events-auto flex h-full w-[450px] flex-col overflow-hidden rounded-xl border border-border/50 bg-background/90 shadow-2xl backdrop-blur-xl"
          layout
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", visualDuration: 0.3, bounce: 0.2 }}
        >
          {/* Header with progress */}
          <div className="border-b border-border/50 bg-card/50 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">
                  Step {progress.current} of {progress.total}
                </h2>
                <h1 className="text-xl font-bold line-clamp-1">{currentStep.title}</h1>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrevious}
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNext}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted/50">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ type: "spring", bounce: 0, visualDuration: 0.2 }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-smooth" id="walkthrough-scroll-container" ref={scrollRef}>
            {visibleSteps.map((step, index) => {
              const isActive = index === state.currentStepIndex;
              const isLocked = !canGoNext && isActive;

              return (
                <div 
                  key={step.id} 
                  id={`step-${index}`} 
                  data-step-index={index}
                  className="step-container flex min-h-full flex-col justify-center transition-opacity duration-500"
                  style={{ opacity: isActive ? 1 : 0.4 }}
                >
                  <TextPanel
                    title={step.title}
                    content={step.content}
                    quiz={step.quiz}
                    quizAnswer={state.quizAnswers[step.id]}
                    onQuizAnswer={(ans) => handleQuizAnswer(step.id, ans)}
                    quizResult={getQuizResult(step.id)}
                  />
                  
                  {isActive && !isLocked && index < steps.length - 1 && (
                    <div className="px-8 pb-12">
                      <Button onClick={handleNext} className="w-full" size="lg">
                        Continue to Next Step <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {isActive && index === steps.length - 1 && (
                    <div className="px-8 pb-12">
                      <Button onClick={() => onComplete?.()} className="w-full" size="lg" variant="default">
                        Complete Walkthrough
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
