/**
 * WalkthroughComplete - Completion screen shown after all steps are done
 */

import { CheckCircle2, Clock, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import type { Walkthrough } from '@/types/walkthrough';

interface WalkthroughCompleteProps {
  walkthrough: Walkthrough;
  onComplete?: () => void;
}

export function WalkthroughComplete({ walkthrough, onComplete }: WalkthroughCompleteProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="max-w-2xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/30">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="mb-3 text-3xl font-bold">Walkthrough Complete!</h2>
          <p className="mb-6 text-lg text-muted-foreground">
            You've completed all {walkthrough.steps.length} steps in the {walkthrough.title} walkthrough.
          </p>

          {/* Time estimate */}
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated time: {walkthrough.estimatedMinutes} minutes</span>
          </div>

          {/* Learning goals checklist */}
          {walkthrough.learningGoals.length > 0 && (
            <div className="mb-8 rounded-lg border bg-card p-6 text-left">
              <h3 className="mb-4 text-lg font-semibold">Learning Goals Achieved</h3>
              <ul className="space-y-3">
                {walkthrough.learningGoals.map((goal, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-sm">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={onComplete}
            size="lg"
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
