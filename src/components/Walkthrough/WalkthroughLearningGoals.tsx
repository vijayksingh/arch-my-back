/**
 * WalkthroughLearningGoals - Collapsible learning goals section
 */

import { ChevronDown, ChevronUp, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWalkthroughContext } from './WalkthroughContext';

export function WalkthroughLearningGoals() {
  const { walkthrough, showLearningGoals, setShowLearningGoals } = useWalkthroughContext();

  if (walkthrough.learningGoals.length === 0) {
    return null;
  }

  return (
    <div className="border-b ui-border-ghost">
      <button
        onClick={() => setShowLearningGoals(!showLearningGoals)}
        className="flex w-full items-center justify-between px-6 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span>Learning Goals</span>
        {showLearningGoals ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence>
        {showLearningGoals && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 px-6 pb-4">
              {walkthrough.learningGoals.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Circle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
