/**
 * WalkthroughNavigation - Footer navigation with prev/next buttons and progress dots
 */

import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWalkthroughContext } from './WalkthroughContext';

export function WalkthroughNavigation() {
  const {
    walkthrough,
    currentStep,
    state,
    progress,
    canGoNext,
    canGoPrevious,
    handleNext,
    handlePrevious,
  } = useWalkthroughContext();

  if (!currentStep) return null;

  // Check if current step has a quiz and it's answered correctly
  const hasCorrectQuizAnswer = currentStep.widgets?.some(widget => {
    if (widget.type !== 'quiz') return false;
    const answers = state.quizAnswers[currentStep.id] || [];
    if (answers.length === 0) return false;
    // Type guard: only MCQ mode has options
    if (widget.mode !== 'mcq' && widget.mode !== undefined) {
      // For new quiz modes, check for 'correct' signal
      return answers.includes('correct');
    }
    // MCQ mode
    return widget.options
      .filter(opt => opt.correct)
      .every(opt => answers.includes(opt.id)) &&
      answers.every(id => widget.options.find(opt => opt.id === id)?.correct);
  });

  return (
    <div className="border-t ui-border-ghost bg-card/30 px-6 py-4">
      <div className="flex flex-col gap-3">
        {/* Helper text for disabled Next button */}
        {!canGoNext && currentStep.nextCondition && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            <span>
              {currentStep.nextCondition === 'quiz-correct' && 'Answer the quiz correctly to continue'}
              {currentStep.nextCondition === 'action-complete' && 'Complete the exercise to continue'}
            </span>
          </div>
        )}

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
            {walkthrough.steps.map((_, idx) => (
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
            className={cn(
              'flex items-center gap-2',
              hasCorrectQuizAnswer && 'animate-pulse',
              !canGoNext && 'opacity-50 cursor-not-allowed'
            )}
          >
            {progress.current === progress.total ? 'Complete' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
