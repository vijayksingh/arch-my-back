/**
 * UnderstandingGate - Requires learner explanation before auto-applying solution
 * Educational design: prevents mindless copying, forces active processing
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, CheckCircle2, Wrench, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnderstandingGateProps {
  onApply: (explanation: string) => void;
  onTryManually: () => void;
}

export function UnderstandingGate({ onApply, onTryManually }: UnderstandingGateProps) {
  const [explanation, setExplanation] = useState('');
  const [showEncouragement, setShowEncouragement] = useState(false);

  const meetsMinimum = explanation.length >= 50;
  const isThoughtful = explanation.length >= 100;

  const handleApply = () => {
    if (meetsMinimum) {
      onApply(explanation);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && meetsMinimum) {
      handleApply();
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
        <div className="flex items-start gap-3 mb-3">
          <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
              Understanding Check
            </div>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              Before applying the solution, explain in your own words:{' '}
              <strong className="block mt-1">
                Why does this architecture work better than your attempt?
              </strong>
            </div>
          </div>
        </div>

        <textarea
          className="w-full min-h-[100px] p-3 rounded-md border
                     border-amber-300 dark:border-amber-700
                     bg-white dark:bg-gray-900
                     text-sm resize-y
                     focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     transition-shadow"
          placeholder="e.g., 'The cache layer reduces database load because it stores popular recommendations. This means the database only gets hit for new or unpopular content, which makes the system much faster at scale...'"
          value={explanation}
          onChange={(e) => {
            setExplanation(e.target.value);
            if (e.target.value.length >= 100 && !showEncouragement) {
              setShowEncouragement(true);
            }
          }}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        {/* Character count feedback */}
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-muted-foreground">
            {explanation.length < 50 ? (
              <>
                <span className="text-amber-700 dark:text-amber-300">
                  {50 - explanation.length} more characters needed
                </span>
                {' '}(minimum: one thoughtful sentence)
              </>
            ) : isThoughtful ? (
              <span className="text-green-700 dark:text-green-300 font-medium">
                ✓ Great explanation! This shows real understanding.
              </span>
            ) : (
              <span className="text-green-700 dark:text-green-300">
                ✓ Minimum met
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {explanation.length} characters
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleApply}
          disabled={!meetsMinimum}
          className="flex items-center gap-2"
          size="lg"
        >
          <CheckCircle2 className="h-4 w-4" />
          Apply Solution & Continue
        </Button>

        <Button
          variant="outline"
          onClick={onTryManually}
          size="lg"
        >
          <Wrench className="h-4 w-4 mr-2" />
          Try Fixing It Myself
        </Button>
      </div>

      {/* Encouragement message */}
      <AnimatePresence>
        {showEncouragement && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Excellent! Your detailed explanation shows you're really thinking through the architecture.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
