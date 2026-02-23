/**
 * WalkthroughStepContent - Markdown content and widgets
 */

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MarkdownLines } from '@/components/DocumentPanel/widgets/MarkdownLines';
import { useWalkthroughContext } from './WalkthroughContext';
import { getPhaseColor } from './WalkthroughStepHeader';
import { WidgetRenderer } from './widgets/WidgetRenderer';

export function WalkthroughStepContent() {
  const { currentStep, state, handleQuizAnswer, setTimelineHighlightedNodes } = useWalkthroughContext();

  if (!currentStep) return null;

  const phaseColors = getPhaseColor(currentStep.phase);

  return (
    <motion.div
      key={currentStep.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'min-h-0 flex-1 overflow-y-auto border-l-4 px-6 py-6',
        phaseColors.border,
        phaseColors.bg
      )}
    >
      <div className="flex flex-col gap-6 prose prose-sm dark:prose-invert max-w-none">
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
            onTimelineHighlight={setTimelineHighlightedNodes}
          />
        ))}
      </div>
    </motion.div>
  );
}
