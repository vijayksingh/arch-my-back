/**
 * InteractiveTimelineWidget - Step-through timeline with canvas sync
 *
 * Used in walkthroughs to show events one at a time with optional prediction prompts.
 * Highlights canvas nodes as the learner progresses through events.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WidgetPreviewCard } from '@/components/DocumentPanel/widgets/WidgetPreviewCard';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineWidgetConfig } from '@/types/walkthrough';
import { motion } from 'motion/react';

interface InteractiveTimelineWidgetProps {
  widget: TimelineWidgetConfig;
  onHighlightNodes: (nodeIds: string[]) => void;
}

export function InteractiveTimelineWidget({
  widget,
  onHighlightNodes
}: InteractiveTimelineWidgetProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [showPrediction, setShowPrediction] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [predictionSubmitted, setPredictionSubmitted] = useState(false);

  const currentEvent = widget.events[currentEventIndex];

  // Update canvas highlights when event changes
  useEffect(() => {
    if (!showPrediction && currentEvent.nodeIds) {
      onHighlightNodes(currentEvent.nodeIds);
    }
  }, [currentEventIndex, showPrediction, currentEvent.nodeIds, onHighlightNodes]);

  const handleNext = () => {
    const nextIndex = currentEventIndex + 1;
    if (nextIndex < widget.events.length) {
      const nextEvent = widget.events[nextIndex];

      // If next event has prediction, show prediction UI
      if (nextEvent.predictPrompt && nextEvent.predictOptions) {
        setShowPrediction(true);
        setSelectedPrediction(null);
        setPredictionSubmitted(false);
      } else {
        setCurrentEventIndex(nextIndex);
      }
    }
  };

  const handlePrevious = () => {
    if (currentEventIndex > 0) {
      setCurrentEventIndex(currentEventIndex - 1);
      setShowPrediction(false);
      setSelectedPrediction(null);
      setPredictionSubmitted(false);
    }
  };

  const handleSubmitPrediction = () => {
    if (!selectedPrediction) return;
    setPredictionSubmitted(true);

    // After showing feedback, move to next event
    setTimeout(() => {
      setCurrentEventIndex(currentEventIndex + 1);
      setShowPrediction(false);
      setSelectedPrediction(null);
      setPredictionSubmitted(false);
    }, 2000);
  };

  // Show prediction UI
  if (showPrediction) {
    const nextEvent = widget.events[currentEventIndex + 1];
    const correctOption = nextEvent?.predictOptions?.find(opt => opt.correct);
    const isCorrect = selectedPrediction === correctOption?.text;

    // Guard clause after all hooks
    if (!nextEvent?.predictPrompt || !nextEvent?.predictOptions) return null;

    return (
      <WidgetPreviewCard icon={HelpCircle} title={widget.title} accentBorder>
        <div className="space-y-4">
          <div className="text-sm font-medium">{nextEvent.predictPrompt}</div>

          <div className="space-y-2">
            {nextEvent.predictOptions.map((option, idx) => {
              const isSelected = selectedPrediction === option.text;
              const showFeedback = predictionSubmitted && isSelected;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !predictionSubmitted && setSelectedPrediction(option.text)}
                  disabled={predictionSubmitted}
                  className={cn(
                    'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    isSelected && !predictionSubmitted && 'border-primary bg-primary/10',
                    !isSelected && !predictionSubmitted && 'border-border hover:border-primary/50',
                    showFeedback && option.correct && 'border-green-500 bg-green-500/10',
                    showFeedback && !option.correct && 'border-red-500 bg-red-500/10',
                    predictionSubmitted && 'cursor-not-allowed',
                  )}
                >
                  {option.text}
                </button>
              );
            })}
          </div>

          {predictionSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                isCorrect
                  ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                  : 'bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100'
              )}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Correct! Let's see what happens...
                </>
              ) : (
                <>
                  <HelpCircle className="h-4 w-4" />
                  Not quite. Let's see what actually happens...
                </>
              )}
            </motion.div>
          )}

          {!predictionSubmitted && (
            <Button
              onClick={handleSubmitPrediction}
              disabled={!selectedPrediction}
              className="w-full"
            >
              Submit Prediction
            </Button>
          )}
        </div>
      </WidgetPreviewCard>
    );
  }

  // Show current event with stepper controls
  return (
    <WidgetPreviewCard icon={Clock} title={widget.title} accentBorder>
      <div className="space-y-4">
        {/* Event list with current highlighted */}
        <div className="space-y-2">
          {widget.events.map((event, idx) => {
            const isCurrent = idx === currentEventIndex;
            const isPast = idx < currentEventIndex;
            const isFuture = idx > currentEventIndex;

            return (
              <div
                key={idx}
                className={cn(
                  'rounded-md border px-3 py-2 text-sm transition-colors',
                  isCurrent && 'border-primary bg-primary/10 font-medium',
                  isPast && 'border-border/50 text-muted-foreground opacity-60',
                  isFuture && 'border-border/30 text-muted-foreground/50 opacity-40'
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {isCurrent ? (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    ) : isPast ? (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{event.label}</div>
                    {isCurrent && event.description && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentEventIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-xs text-muted-foreground">
            {currentEventIndex + 1} / {widget.events.length}
          </div>
          <Button
            size="sm"
            onClick={handleNext}
            disabled={currentEventIndex === widget.events.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </WidgetPreviewCard>
  );
}
