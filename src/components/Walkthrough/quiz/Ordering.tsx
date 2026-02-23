/**
 * Ordering Quiz Component
 *
 * Given steps, put them in correct order (for request flow steps)
 */

import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { CheckCircle2, XCircle, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuizWidgetConfigOrdering } from '@/types/walkthrough';
import { cn } from '@/lib/utils';

interface OrderingProps {
  widget: QuizWidgetConfigOrdering;
  onSubmit: (correct: boolean) => void;
  hasSubmitted: boolean;
}

export function Ordering({ widget, onSubmit, hasSubmitted }: OrderingProps) {
  // Initialize with shuffled items (if not submitted yet)
  const [orderedItems, setOrderedItems] = useState(() => {
    // Shallow copy to avoid mutating original
    return [...widget.items];
  });
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = () => {
    const userOrder = orderedItems.map((item) => item.id);
    const correct =
      userOrder.length === widget.correctOrder.length &&
      userOrder.every((id, idx) => id === widget.correctOrder[idx]);
    setIsCorrect(correct);
    onSubmit(correct);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{widget.question}</p>

      <div className="rounded-md border border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20 px-3 py-2 flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-900 dark:text-blue-100">
          Drag the items to reorder them into the correct sequence.
        </p>
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
                Correct! The items are in the right order.
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Not quite. Try reordering the items.
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable List */}
      <Reorder.Group
        axis="y"
        values={orderedItems}
        onReorder={setOrderedItems}
        className="space-y-2"
      >
        {orderedItems.map((item, idx) => {
          const correctPosition = widget.correctOrder.indexOf(item.id);
          const currentPosition = idx;
          const isInCorrectPosition = hasSubmitted && correctPosition === currentPosition;
          const isInWrongPosition = hasSubmitted && correctPosition !== currentPosition;

          return (
            <Reorder.Item
              key={item.id}
              value={item}
              dragListener={!hasSubmitted}
              className={cn(
                'rounded-md border px-3 py-2 text-sm flex items-center gap-3 transition-colors',
                !hasSubmitted && 'cursor-grab active:cursor-grabbing hover:border-primary/50',
                hasSubmitted && 'cursor-not-allowed',
                isInCorrectPosition && 'border-green-500 bg-green-500/10',
                isInWrongPosition && 'border-red-500 bg-red-500/10',
                !hasSubmitted && 'bg-card'
              )}
            >
              <GripVertical
                className={cn(
                  'h-4 w-4 shrink-0',
                  hasSubmitted ? 'text-muted-foreground/30' : 'text-muted-foreground'
                )}
              />
              <div className="flex-1 flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium shrink-0',
                    hasSubmitted && isInCorrectPosition && 'bg-green-600 text-white',
                    hasSubmitted && isInWrongPosition && 'bg-red-600 text-white',
                    !hasSubmitted && 'bg-muted text-muted-foreground'
                  )}
                >
                  {idx + 1}
                </span>
                <span className="flex-1">{item.text}</span>
              </div>
              {hasSubmitted && isInCorrectPosition && (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              )}
              {hasSubmitted && isInWrongPosition && (
                <div className="text-xs text-red-600 dark:text-red-400 shrink-0">
                  Should be #{correctPosition + 1}
                </div>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {!hasSubmitted && (
        <Button onClick={handleSubmit} className="w-full">
          Submit Answer
        </Button>
      )}
    </div>
  );
}
