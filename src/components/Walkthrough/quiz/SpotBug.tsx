/**
 * SpotBug Quiz Component
 *
 * Code with a deliberate defect. Learner clicks the buggy line.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuizWidgetConfigSpotBug } from '@/types/walkthrough';
import { cn } from '@/lib/utils';

interface SpotBugProps {
  widget: QuizWidgetConfigSpotBug;
  onSubmit: (correct: boolean) => void;
  hasSubmitted: boolean;
}

export function SpotBug({ widget, onSubmit, hasSubmitted }: SpotBugProps) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const codeLines = widget.code.split('\n');
  const buggyLineSet = new Set(widget.buggyLines);

  const handleLineClick = (lineNumber: number) => {
    if (hasSubmitted) return;
    setSelectedLine(lineNumber);
  };

  const handleSubmit = () => {
    if (selectedLine === null) return;
    const correct = buggyLineSet.has(selectedLine);
    setIsCorrect(correct);
    onSubmit(correct);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{widget.question}</p>

      <div className="rounded-md border border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/20 px-3 py-2 flex items-start gap-2">
        <Bug className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
        <p className="text-xs text-orange-900 dark:text-orange-100">
          Click on the line that contains the bug, then submit your answer.
        </p>
      </div>

      {/* Clickable Code Lines */}
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 font-mono text-sm overflow-x-auto">
        {codeLines.map((line, idx) => {
          const lineNumber = idx + 1;
          const isSelected = selectedLine === lineNumber;
          const isBuggy = buggyLineSet.has(lineNumber);
          const showFeedback = hasSubmitted && isSelected;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleLineClick(lineNumber)}
              disabled={hasSubmitted}
              className={cn(
                'flex gap-3 items-start py-0.5 w-full text-left transition-colors rounded px-1 -mx-1',
                !hasSubmitted && 'hover:bg-muted/50 cursor-pointer',
                hasSubmitted && 'cursor-not-allowed',
                isSelected && !hasSubmitted && 'bg-primary/10 ring-2 ring-primary',
                showFeedback && isBuggy && 'bg-green-500/10 ring-2 ring-green-500',
                showFeedback && !isBuggy && 'bg-red-500/10 ring-2 ring-red-500'
              )}
            >
              <span className="text-muted-foreground/50 select-none w-6 text-right shrink-0">
                {lineNumber}
              </span>
              <pre className="flex-1 whitespace-pre-wrap break-all">{line}</pre>
              {isSelected && (
                <span className="shrink-0 text-primary">
                  {showFeedback ? (
                    isBuggy ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )
                  ) : (
                    '←'
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Success/Failure Banner with Explanation */}
      <AnimatePresence>
        {hasSubmitted && isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'rounded-md px-3 py-2 text-sm space-y-1',
              isCorrect
                ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Correct! You found the bug.
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Not quite. The bug is on line{' '}
                  {widget.buggyLines.length === 1
                    ? widget.buggyLines[0]
                    : widget.buggyLines.join(' or ')}.
                </>
              )}
            </div>
            <p className="text-xs pl-6">{widget.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasSubmitted && (
        <Button onClick={handleSubmit} disabled={selectedLine === null} className="w-full">
          Submit Answer
        </Button>
      )}
    </div>
  );
}
