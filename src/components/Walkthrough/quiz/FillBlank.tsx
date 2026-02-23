/**
 * FillBlank Quiz Component
 *
 * Code with blanked-out key lines. Learner fills them in.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuizWidgetConfigFillBlank } from '@/types/walkthrough';
import { cn } from '@/lib/utils';

interface FillBlankProps {
  widget: QuizWidgetConfigFillBlank;
  onSubmit: (correct: boolean) => void;
  hasSubmitted: boolean;
}

export function FillBlank({ widget, onSubmit, hasSubmitted }: FillBlankProps) {
  const [blankAnswers, setBlankAnswers] = useState<Record<number, string>>({});
  const [validationResults, setValidationResults] = useState<Record<number, boolean>>({});

  const codeLines = widget.code.split('\n');
  const blankLineNumbers = new Set(widget.blanks.map((b) => b.lineNumber));

  const handleBlankChange = (lineNumber: number, value: string) => {
    setBlankAnswers((prev) => ({ ...prev, [lineNumber]: value }));
  };

  const handleSubmit = () => {
    const results: Record<number, boolean> = {};
    let allCorrect = true;

    for (const blank of widget.blanks) {
      const userAnswer = blankAnswers[blank.lineNumber]?.trim() || '';
      const correctAnswers = [blank.answer, ...(blank.acceptAlternatives || [])];
      const isCorrect = correctAnswers.some(
        (ans) => userAnswer.toLowerCase() === ans.toLowerCase().trim()
      );
      results[blank.lineNumber] = isCorrect;
      if (!isCorrect) allCorrect = false;
    }

    setValidationResults(results);
    onSubmit(allCorrect);
  };

  const allBlanksFilled = widget.blanks.every(
    (blank) => blankAnswers[blank.lineNumber]?.trim().length > 0
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{widget.question}</p>

      {/* Code with Editable Blanks */}
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 font-mono text-sm overflow-x-auto">
        {codeLines.map((line, idx) => {
          const lineNumber = idx + 1;
          const isBlank = blankLineNumbers.has(lineNumber);
          const blank = widget.blanks.find((b) => b.lineNumber === lineNumber);
          const isValidated = hasSubmitted && blank && lineNumber in validationResults;
          const isCorrect = isValidated ? validationResults[lineNumber] : null;

          if (!isBlank) {
            return (
              <div key={idx} className="flex gap-3 items-start py-0.5">
                <span className="text-muted-foreground/50 select-none w-6 text-right shrink-0">
                  {lineNumber}
                </span>
                <pre className="flex-1 whitespace-pre-wrap break-all">{line}</pre>
              </div>
            );
          }

          return (
            <div key={idx} className="flex gap-3 items-start py-1">
              <span className="text-muted-foreground/50 select-none w-6 text-right shrink-0 mt-1">
                {lineNumber}
              </span>
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={blankAnswers[lineNumber] || ''}
                  onChange={(e) => handleBlankChange(lineNumber, e.target.value)}
                  disabled={hasSubmitted}
                  placeholder={blank?.hint || 'Fill in the blank...'}
                  className={cn(
                    'w-full rounded border px-2 py-1 text-sm font-mono',
                    'focus:outline-none focus:ring-2 focus:ring-primary',
                    hasSubmitted && isCorrect && 'border-green-500 bg-green-500/10',
                    hasSubmitted && isCorrect === false && 'border-red-500 bg-red-500/10',
                    hasSubmitted && 'cursor-not-allowed'
                  )}
                />
                <AnimatePresence>
                  {hasSubmitted && isCorrect === false && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                    >
                      <XCircle className="h-3 w-3" />
                      Correct answer: <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">{blank?.answer}</code>
                    </motion.div>
                  )}
                  {hasSubmitted && isCorrect === true && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Correct!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Success/Failure Banner */}
      <AnimatePresence>
        {hasSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
              Object.values(validationResults).every((v) => v)
                ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                : 'bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100'
            )}
          >
            {Object.values(validationResults).every((v) => v) ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                All blanks filled correctly!
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Some blanks need correction. See feedback above.
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!hasSubmitted && (
        <Button onClick={handleSubmit} disabled={!allBlanksFilled} className="w-full">
          Submit Answer
        </Button>
      )}
    </div>
  );
}
