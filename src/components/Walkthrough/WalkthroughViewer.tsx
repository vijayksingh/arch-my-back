/**
 * WalkthroughViewer - 2-column layout for interactive walkthrough experiences
 *
 * Layout: Left panel (step content) + Right panel (canvas)
 * - No floating panels, no scrollytelling
 * - One step at a time with navigation buttons
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CanvasPanel } from './CanvasPanel';
import { WalkthroughEngine, type WalkthroughStep } from '@/lib/walkthroughEngine';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownLines } from '@/components/DocumentPanel/widgets/MarkdownLines';
import { WidgetPreviewCard } from '@/components/DocumentPanel/widgets/WidgetPreviewCard';
import {
  HelpCircle,
  Clock,
  Scale,
  Code2,
  Table,
} from 'lucide-react';
import type { WidgetConfig, QuizWidgetConfig } from '@/types/walkthrough';

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

  const handleNext = () => {
    const newState = engine.next();
    setState(newState);

    if (newState.currentStepIndex >= steps.length) {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    const newState = engine.previous();
    setState(newState);
  };

  const handleQuizAnswer = (selectedOptionIds: string[]) => {
    if (!currentStep) return;
    engine.submitQuizAnswer(currentStep.id, selectedOptionIds);
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
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left Panel: Step Content */}
      <div className="flex h-full w-[min(42rem,42vw)] min-w-0 flex-col border-r ui-border-ghost bg-background">
        {/* Header with progress */}
        <div className="border-b ui-border-ghost bg-card/50 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Step {progress.current} of {progress.total} • {currentStep.phase}
              </div>
              <h1 className="truncate text-xl font-bold">{currentStep.title}</h1>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            {/* Markdown content */}
            {currentStep.content && (
              <MarkdownLines content={currentStep.content} />
            )}

            {/* Widgets */}
            {currentStep.widgets?.map((widget, idx) => (
              <WidgetRenderer
                key={idx}
                widget={widget}
                quizAnswers={state.quizAnswers[currentStep.id]}
                onQuizAnswer={handleQuizAnswer}
              />
            ))}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t ui-border-ghost bg-card/30 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    idx === state.currentStepIndex
                      ? 'bg-primary'
                      : idx < state.currentStepIndex
                        ? 'bg-primary/40'
                        : 'bg-muted',
                  )}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canGoNext}
              className="flex items-center gap-2"
            >
              {progress.current === progress.total ? 'Complete' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel: Canvas */}
      <div className="relative flex h-full min-w-0 flex-1 overflow-hidden bg-background">
        <CanvasPanel
          nodes={state.canvasNodes}
          edges={state.canvasEdges}
          highlightedNodeIds={state.highlightedNodeIds}
          animatedEdgeIds={state.animatedEdgeIds}
        />
      </div>
    </div>
  );
}

// --- Widget Renderer ---

interface WidgetRendererProps {
  widget: WidgetConfig;
  quizAnswers?: string[];
  onQuizAnswer: (selectedOptionIds: string[]) => void;
}

function WidgetRenderer({ widget, quizAnswers, onQuizAnswer }: WidgetRendererProps) {
  switch (widget.type) {
    case 'quiz':
      return (
        <QuizWidget
          widget={widget}
          selectedOptionIds={quizAnswers || []}
          onAnswer={onQuizAnswer}
        />
      );
    case 'timeline':
      return (
        <WidgetPreviewCard icon={Clock} title="Timeline">
          <div className="text-sm text-muted-foreground">
            Timeline widget: {widget.title}
          </div>
        </WidgetPreviewCard>
      );
    case 'tradeoffs':
      return (
        <WidgetPreviewCard icon={Scale} title="Trade-offs">
          <div className="text-sm text-muted-foreground">
            Trade-offs: {widget.title}
          </div>
        </WidgetPreviewCard>
      );
    case 'code-block':
      return (
        <WidgetPreviewCard icon={Code2} title="Code Block">
          <div className="text-sm text-muted-foreground">
            Code: {widget.title}
          </div>
        </WidgetPreviewCard>
      );
    case 'comparison-table':
      return (
        <WidgetPreviewCard icon={Table} title="Comparison Table">
          <div className="text-sm text-muted-foreground">
            Table: {widget.title}
          </div>
        </WidgetPreviewCard>
      );
    default:
      return null;
  }
}

// --- Quiz Widget ---

interface QuizWidgetProps {
  widget: QuizWidgetConfig;
  selectedOptionIds: string[];
  onAnswer: (selectedOptionIds: string[]) => void;
}

function QuizWidget({ widget, selectedOptionIds, onAnswer }: QuizWidgetProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedOptionIds);
  const hasSubmitted = selectedOptionIds.length > 0;

  const handleOptionToggle = (optionId: string) => {
    if (hasSubmitted) return; // Don't allow changes after submission

    if (widget.multiSelect) {
      setLocalSelection((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setLocalSelection([optionId]);
    }
  };

  const handleSubmit = () => {
    if (localSelection.length > 0) {
      onAnswer(localSelection);
    }
  };

  return (
    <WidgetPreviewCard icon={HelpCircle} title="Quiz" accentBorder>
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">{widget.question}</p>

        <div className="space-y-2">
          {widget.options.map((option) => {
            const isSelected = localSelection.includes(option.id);
            const isCorrect = option.correct;
            const showFeedback = hasSubmitted && isSelected;

            return (
              <div key={option.id}>
                <button
                  type="button"
                  onClick={() => handleOptionToggle(option.id)}
                  disabled={hasSubmitted}
                  className={cn(
                    'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    isSelected && !hasSubmitted && 'border-primary bg-primary/10',
                    !isSelected && !hasSubmitted && 'border-border hover:border-primary/50',
                    hasSubmitted && isSelected && isCorrect && 'border-green-500 bg-green-500/10',
                    hasSubmitted && isSelected && !isCorrect && 'border-red-500 bg-red-500/10',
                    hasSubmitted && 'cursor-not-allowed',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckCircle2
                          className={cn(
                            'h-4 w-4',
                            hasSubmitted && isCorrect && 'text-green-600',
                            hasSubmitted && !isCorrect && 'text-red-600',
                            !hasSubmitted && 'text-primary',
                          )}
                        />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="flex-1">{option.text}</span>
                  </div>
                </button>

                {showFeedback && option.explanation && (
                  <div
                    className={cn(
                      'mt-1 rounded-md px-3 py-2 text-xs',
                      isCorrect ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100' : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
                    )}
                  >
                    {option.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!hasSubmitted && (
          <Button
            onClick={handleSubmit}
            disabled={localSelection.length === 0}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}
      </div>
    </WidgetPreviewCard>
  );
}
