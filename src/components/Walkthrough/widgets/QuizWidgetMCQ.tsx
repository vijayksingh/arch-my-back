/**
 * QuizWidgetMCQ - Multiple choice quiz implementation
 */

import { useState } from 'react';
import { CheckCircle2, Circle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuizWidgetConfig } from '@/types/walkthrough';
import { WidgetPreviewCard } from '@/components/DocumentPanel/widgets/WidgetPreviewCard';

interface QuizWidgetMCQProps {
  widget: QuizWidgetConfig;
  selectedOptionIds: string[];
  onAnswer: (selectedOptionIds: string[]) => void;
}

export function QuizWidgetMCQ({ widget, selectedOptionIds, onAnswer }: QuizWidgetMCQProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedOptionIds);
  const [showSuccess, setShowSuccess] = useState(false);
  const hasSubmitted = selectedOptionIds.length > 0;

  // TypeScript narrowing: only MCQ mode has options
  if (widget.mode && widget.mode !== 'mcq') {
    return null; // Should never happen, but satisfies TypeScript
  }

  // Check if answer is correct
  const isAnswerCorrect = hasSubmitted &&
    widget.options.filter(opt => opt.correct).every(opt => selectedOptionIds.includes(opt.id)) &&
    selectedOptionIds.every(id => widget.options.find(opt => opt.id === id)?.correct);

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

      // Show success animation if correct
      const willBeCorrect = widget.options
        .filter(opt => opt.correct)
        .every(opt => localSelection.includes(opt.id)) &&
        localSelection.every(id => widget.options.find(opt => opt.id === id)?.correct);

      if (willBeCorrect) {
        setShowSuccess(true);
      }
    }
  };

  return (
    <WidgetPreviewCard icon={HelpCircle} title="Quiz" accentBorder>
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">{widget.question}</p>

        {/* Success banner */}
        <AnimatePresence>
          {showSuccess && isAnswerCorrect && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-900 dark:bg-green-950 dark:text-green-100"
            >
              <CheckCircle2 className="h-4 w-4" />
              Correct!
            </motion.div>
          )}
        </AnimatePresence>

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
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={cn(
                      'mt-1 rounded-md px-3 py-2 text-xs overflow-hidden',
                      isCorrect
                        ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                        : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
                    )}
                  >
                    {!isCorrect && <span className="font-medium">Here's why: </span>}
                    {option.explanation}
                  </motion.div>
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
