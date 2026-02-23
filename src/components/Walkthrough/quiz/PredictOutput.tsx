/**
 * PredictOutput Quiz Component
 *
 * Shows code + input, learner types expected output
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/widgets/code-block/CodeBlock';
import type { QuizWidgetConfigPredictOutput } from '@/types/walkthrough';
import { cn } from '@/lib/utils';

interface PredictOutputProps {
  widget: QuizWidgetConfigPredictOutput;
  onSubmit: (correct: boolean) => void;
  hasSubmitted: boolean;
}

export function PredictOutput({ widget, onSubmit, hasSubmitted }: PredictOutputProps) {
  const [userOutput, setUserOutput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = () => {
    const correct = validateOutput(userOutput, widget.expectedOutput, widget.tolerance);
    setIsCorrect(correct);
    onSubmit(correct);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{widget.question}</p>

      {/* Code Display */}
      <div className="h-[300px] max-h-[300px]">
        <CodeBlock
          instanceId={`predict-output-${widget.question}`}
          input={{
            language: widget.language,
            code: widget.code,
          }}
          config={{
            name: 'Code',
            editable: false,
            showOutput: false,
            theme: 'dark',
          }}
        />
      </div>

      {/* Input Display */}
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground mb-1">Input:</p>
        <pre className="text-sm font-mono">{widget.inputs}</pre>
      </div>

      {/* Success/Failure Banner */}
      <AnimatePresence>
        {hasSubmitted && isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
              isCorrect
                ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
            )}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Correct! The output matches.
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Not quite. Expected: <code className="ml-1 rounded bg-red-100 px-1 dark:bg-red-900/50">{widget.expectedOutput}</code>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output Input Field */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Your predicted output:
        </label>
        <textarea
          value={userOutput}
          onChange={(e) => setUserOutput(e.target.value)}
          disabled={hasSubmitted}
          placeholder="Type the expected output here..."
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm font-mono resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            hasSubmitted && 'cursor-not-allowed opacity-60'
          )}
          rows={3}
        />
      </div>

      {!hasSubmitted && (
        <Button
          onClick={handleSubmit}
          disabled={userOutput.trim().length === 0}
          className="w-full"
        >
          Submit Answer
        </Button>
      )}
    </div>
  );
}

function validateOutput(userOutput: string, expectedOutput: string, tolerance?: string): boolean {
  let userNormalized = userOutput;
  let expectedNormalized = expectedOutput;

  if (tolerance === 'whitespace') {
    userNormalized = userOutput.trim().replace(/\s+/g, ' ');
    expectedNormalized = expectedOutput.trim().replace(/\s+/g, ' ');
  } else if (tolerance === 'case-insensitive') {
    userNormalized = userOutput.toLowerCase().trim();
    expectedNormalized = expectedOutput.toLowerCase().trim();
  } else {
    // Default: exact match with trim
    userNormalized = userOutput.trim();
    expectedNormalized = expectedOutput.trim();
  }

  return userNormalized === expectedNormalized;
}
