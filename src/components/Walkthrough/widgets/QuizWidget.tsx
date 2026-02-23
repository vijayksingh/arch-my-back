/**
 * QuizWidget - Routes quiz modes to appropriate components
 */

import { HelpCircle } from 'lucide-react';
import type { QuizWidgetConfig } from '@/types/walkthrough';
import { WidgetPreviewCard } from '@/components/DocumentPanel/widgets/WidgetPreviewCard';
import { PredictOutput } from '../quiz/PredictOutput';
import { FillBlank } from '../quiz/FillBlank';
import { SpotBug } from '../quiz/SpotBug';
import { Ordering } from '../quiz/Ordering';
import { QuizWidgetMCQ } from './QuizWidgetMCQ';

interface QuizWidgetProps {
  widget: QuizWidgetConfig;
  selectedOptionIds: string[];
  onAnswer: (selectedOptionIds: string[]) => void;
}

export function QuizWidget({ widget, selectedOptionIds, onAnswer }: QuizWidgetProps) {
  const hasSubmitted = selectedOptionIds.length > 0;

  // Route to appropriate quiz mode component
  const mode = widget.mode || 'mcq';

  const handleModeSubmit = (correct: boolean) => {
    // For non-MCQ modes, we use a simple correct/incorrect signal
    // Store as ['correct'] or ['incorrect'] to track submission state
    onAnswer(correct ? ['correct'] : ['incorrect']);
  };

  // Render based on mode
  if (mode === 'predict-output') {
    return (
      <WidgetPreviewCard icon={HelpCircle} title="Quiz: Predict Output" accentBorder>
        <PredictOutput
          widget={widget as Extract<QuizWidgetConfig, { mode: 'predict-output' }>}
          onSubmit={handleModeSubmit}
          hasSubmitted={hasSubmitted}
        />
      </WidgetPreviewCard>
    );
  }

  if (mode === 'fill-blank') {
    return (
      <WidgetPreviewCard icon={HelpCircle} title="Quiz: Fill in the Blank" accentBorder>
        <FillBlank
          widget={widget as Extract<QuizWidgetConfig, { mode: 'fill-blank' }>}
          onSubmit={handleModeSubmit}
          hasSubmitted={hasSubmitted}
        />
      </WidgetPreviewCard>
    );
  }

  if (mode === 'spot-bug') {
    return (
      <WidgetPreviewCard icon={HelpCircle} title="Quiz: Spot the Bug" accentBorder>
        <SpotBug
          widget={widget as Extract<QuizWidgetConfig, { mode: 'spot-bug' }>}
          onSubmit={handleModeSubmit}
          hasSubmitted={hasSubmitted}
        />
      </WidgetPreviewCard>
    );
  }

  if (mode === 'ordering') {
    return (
      <WidgetPreviewCard icon={HelpCircle} title="Quiz: Put in Order" accentBorder>
        <Ordering
          widget={widget as Extract<QuizWidgetConfig, { mode: 'ordering' }>}
          onSubmit={handleModeSubmit}
          hasSubmitted={hasSubmitted}
        />
      </WidgetPreviewCard>
    );
  }

  // Default MCQ mode (backward compatible)
  return <QuizWidgetMCQ widget={widget} selectedOptionIds={selectedOptionIds} onAnswer={onAnswer} />;
}
