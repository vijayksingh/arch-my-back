/**
 * WalkthroughViewer - 2-column layout for interactive walkthrough experiences
 *
 * Layout: Left panel (step content) + Right panel (canvas)
 * - No floating panels, no scrollytelling
 * - One step at a time with navigation buttons
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CanvasPanel } from './CanvasPanel';
import { WalkthroughEngine, type WalkthroughStep } from '@/lib/walkthroughEngine';
import type { Connection } from '@xyflow/react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lightbulb,
  Puzzle,
  AlertTriangle,
  Rocket,
  PenTool,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownLines } from '@/components/DocumentPanel/widgets/MarkdownLines';
import { WidgetPreviewCard } from '@/components/DocumentPanel/widgets/WidgetPreviewCard';
import { HelpCircle } from 'lucide-react';
import type { WidgetConfig, QuizWidgetConfig, Walkthrough } from '@/types/walkthrough';
import { CodeBlock } from '@/widgets/code-block/CodeBlock';
import { TradeoffsCard } from '@/widgets/tradeoffs-card/TradeoffsCard';
import { Timeline } from '@/widgets/timeline/Timeline';
import { ComparisonTable } from '@/widgets/comparison-table/ComparisonTable';
import { motion, AnimatePresence } from 'motion/react';

interface WalkthroughViewerProps {
  walkthrough: Walkthrough;
  onComplete?: () => void;
}

// Phase styling helpers
const getPhaseIcon = (phase: WalkthroughStep['phase']) => {
  switch (phase) {
    case 'intro':
      return Lightbulb;
    case 'naive':
      return Puzzle;
    case 'complexity':
      return AlertTriangle;
    case 'real':
      return Rocket;
    case 'exercise':
      return PenTool;
    case 'deep-dive':
      return Search;
  }
};

const getPhaseColor = (phase: WalkthroughStep['phase']) => {
  switch (phase) {
    case 'intro':
      return {
        border: 'border-l-amber-500',
        bg: 'bg-amber-50/30 dark:bg-amber-950/10',
        icon: 'text-amber-600 dark:text-amber-400',
      };
    case 'naive':
      return {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50/30 dark:bg-blue-950/10',
        icon: 'text-blue-600 dark:text-blue-400',
      };
    case 'complexity':
      return {
        border: 'border-l-orange-500',
        bg: 'bg-orange-50/30 dark:bg-orange-950/10',
        icon: 'text-orange-600 dark:text-orange-400',
      };
    case 'real':
      return {
        border: 'border-l-green-500',
        bg: 'bg-green-50/30 dark:bg-green-950/10',
        icon: 'text-green-600 dark:text-green-400',
      };
    case 'exercise':
      return {
        border: 'border-l-purple-500',
        bg: 'bg-purple-50/30 dark:bg-purple-950/10',
        icon: 'text-purple-600 dark:text-purple-400',
      };
    case 'deep-dive':
      return {
        border: 'border-l-cyan-500',
        bg: 'bg-cyan-50/30 dark:bg-cyan-950/10',
        icon: 'text-cyan-600 dark:text-cyan-400',
      };
  }
};

export function WalkthroughViewer({ walkthrough, onComplete }: WalkthroughViewerProps) {
  const { steps } = walkthrough;
  const [engine] = useState(() => new WalkthroughEngine(steps));
  const [state, setState] = useState(() => engine.getState());
  const [showLearningGoals, setShowLearningGoals] = useState(false);

  const currentStep = engine.getCurrentStep();
  const progress = engine.getProgress();
  const canGoNext = engine.canGoNext();
  const canGoPrevious = engine.canGoPrevious();

  const handleNext = () => {
    const newState = engine.next();
    setState(newState);

    if (newState.currentStepIndex >= steps.length) {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    const newState = engine.previous();
    setState(newState);
  };

  const handleQuizAnswer = (selectedOptionIds: string[]) => {
    if (!currentStep) return;
    engine.submitQuizAnswer(currentStep.id, selectedOptionIds);
    setState(engine.getState());
  };

  const handleConnect = (connection: Connection) => {
    // Add user-created edge to the walkthrough state
    engine.addUserEdge(connection);
    setState(engine.getState());
  };

  if (!currentStep) {
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
              You've completed all {steps.length} steps in the {walkthrough.title} walkthrough.
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

  // Check if current step has a quiz and it's answered correctly
  const hasCorrectQuizAnswer = currentStep.widgets?.some(widget => {
    if (widget.type !== 'quiz') return false;
    const answers = state.quizAnswers[currentStep.id] || [];
    if (answers.length === 0) return false;
    return widget.options
      .filter(opt => opt.correct)
      .every(opt => answers.includes(opt.id)) &&
      answers.every(id => widget.options.find(opt => opt.id === id)?.correct);
  });

  const PhaseIcon = getPhaseIcon(currentStep.phase);
  const phaseColors = getPhaseColor(currentStep.phase);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left Panel: Step Content */}
      <div className="flex h-full w-[min(42rem,42vw)] min-w-0 flex-col border-r ui-border-ghost bg-background">
        {/* Header with progress */}
        <div className="border-b ui-border-ghost bg-card/50 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <PhaseIcon className={cn('h-4 w-4', phaseColors.icon)} />
                <span>Step {progress.current} of {progress.total}</span>
                <span>•</span>
                <span>{currentStep.phase}</span>
                {currentStep.estimatedMinutes > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{currentStep.estimatedMinutes} min
                    </span>
                  </>
                )}
              </div>
              <h1 className="truncate text-xl font-bold">{currentStep.title}</h1>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Learning Goals (collapsible) */}
        {walkthrough.learningGoals.length > 0 && (
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
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
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
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer */}
        <div className="border-t ui-border-ghost bg-card/30 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    idx === state.currentStepIndex
                      ? 'bg-primary'
                      : idx < state.currentStepIndex
                        ? 'bg-primary/40'
                        : 'bg-muted',
                  )}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canGoNext}
              className={cn(
                'flex items-center gap-2',
                hasCorrectQuizAnswer && 'animate-pulse'
              )}
            >
              {progress.current === progress.total ? 'Complete' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel: Canvas */}
      <div className="relative flex h-full min-w-0 flex-1 overflow-hidden bg-background">
        <CanvasPanel
          nodes={state.canvasNodes}
          edges={state.canvasEdges}
          highlightedNodeIds={state.highlightedNodeIds}
          animatedEdgeIds={state.animatedEdgeIds}
          nodesDraggable={true}
          nodesConnectable={true}
          onConnect={handleConnect}
        />
      </div>
    </div>
  );
}

// --- Widget Renderer ---

interface WidgetRendererProps {
  widget: WidgetConfig;
  quizAnswers?: string[];
  onQuizAnswer: (selectedOptionIds: string[]) => void;
}

function WidgetRenderer({ widget, quizAnswers, onQuizAnswer }: WidgetRendererProps) {
  switch (widget.type) {
    case 'quiz':
      return (
        <QuizWidget
          widget={widget}
          selectedOptionIds={quizAnswers || []}
          onAnswer={onQuizAnswer}
        />
      );
    case 'code-block':
      return (
        <div className="h-[400px] max-h-[400px]">
          <CodeBlock
            instanceId={`code-${widget.title}`}
            input={{
              language: widget.language,
              code: widget.code,
            }}
            config={{
              name: widget.title,
              editable: false,
              showOutput: false,
              theme: 'dark',
            }}
          />
        </div>
      );
    case 'tradeoffs':
      return (
        <TradeoffsCard
          instanceId={`tradeoffs-${widget.title}`}
          input={{
            title: widget.title,
            context: widget.decision,
            pros: [],
            cons: [],
            decision: widget.decision,
            alternatives: widget.options.map((opt, i) => ({
              id: `alt-${i}`,
              name: opt.label,
              pros: opt.pros,
              cons: opt.cons,
            })),
          }}
          config={{
            name: widget.title,
            showAlternatives: true,
            expandedByDefault: false,
          }}
        />
      );
    case 'timeline':
      return (
        <div className="h-[300px] max-h-[300px]">
          <Timeline
            instanceId={`timeline-${widget.title}`}
            input={{
              events: widget.events.map((evt, i) => ({
                id: `evt-${i}`,
                timestamp: i * 1000,
                title: evt.label,
                description: evt.description,
                type: 'event' as const,
              })),
            }}
            config={{
              name: widget.title,
              animate: true,
            }}
          />
        </div>
      );
    case 'comparison-table':
      return (
        <div className="max-h-[400px]">
          <ComparisonTable
            instanceId={`table-${widget.title}`}
            input={{
              columns: widget.columns.map((col, i) => ({
                id: `col-${i}`,
                title: col,
              })),
              rows: widget.rows.map((row, i) => ({
                id: `row-${i}`,
                label: row.label,
                cells: Object.fromEntries(
                  row.values.map((val, j) => [`col-${j}`, val])
                ),
              })),
            }}
            config={{
              name: widget.title,
              striped: true,
              highlightOnHover: true,
            }}
          />
        </div>
      );
    default:
      return null;
  }
}

// --- Quiz Widget ---

interface QuizWidgetProps {
  widget: QuizWidgetConfig;
  selectedOptionIds: string[];
  onAnswer: (selectedOptionIds: string[]) => void;
}

function QuizWidget({ widget, selectedOptionIds, onAnswer }: QuizWidgetProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedOptionIds);
  const [showSuccess, setShowSuccess] = useState(false);
  const hasSubmitted = selectedOptionIds.length > 0;

  // Check if answer is correct
  const isAnswerCorrect = hasSubmitted &&
    widget.options.filter(opt => opt.correct).every(opt => selectedOptionIds.includes(opt.id)) &&
    selectedOptionIds.every(id => widget.options.find(opt => opt.id === id)?.correct);

  const handleOptionToggle = (optionId: string) => {
    if (hasSubmitted) return; // Don't allow changes after submission

    if (widget.multiSelect) {
      setLocalSelection((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setLocalSelection([optionId]);
    }
  };

  const handleSubmit = () => {
    if (localSelection.length > 0) {
      onAnswer(localSelection);

      // Show success animation if correct
      const willBeCorrect = widget.options
        .filter(opt => opt.correct)
        .every(opt => localSelection.includes(opt.id)) &&
        localSelection.every(id => widget.options.find(opt => opt.id === id)?.correct);

      if (willBeCorrect) {
        setShowSuccess(true);
      }
    }
  };

  return (
    <WidgetPreviewCard icon={HelpCircle} title="Quiz" accentBorder>
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">{widget.question}</p>

        {/* Success banner */}
        <AnimatePresence>
          {showSuccess && isAnswerCorrect && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-900 dark:bg-green-950 dark:text-green-100"
            >
              <CheckCircle2 className="h-4 w-4" />
              Correct!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {widget.options.map((option) => {
            const isSelected = localSelection.includes(option.id);
            const isCorrect = option.correct;
            const showFeedback = hasSubmitted && isSelected;

            return (
              <div key={option.id}>
                <button
                  type="button"
                  onClick={() => handleOptionToggle(option.id)}
                  disabled={hasSubmitted}
                  className={cn(
                    'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    isSelected && !hasSubmitted && 'border-primary bg-primary/10',
                    !isSelected && !hasSubmitted && 'border-border hover:border-primary/50',
                    hasSubmitted && isSelected && isCorrect && 'border-green-500 bg-green-500/10',
                    hasSubmitted && isSelected && !isCorrect && 'border-red-500 bg-red-500/10',
                    hasSubmitted && 'cursor-not-allowed',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckCircle2
                          className={cn(
                            'h-4 w-4',
                            hasSubmitted && isCorrect && 'text-green-600',
                            hasSubmitted && !isCorrect && 'text-red-600',
                            !hasSubmitted && 'text-primary',
                          )}
                        />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="flex-1">{option.text}</span>
                  </div>
                </button>

                {showFeedback && option.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={cn(
                      'mt-1 rounded-md px-3 py-2 text-xs overflow-hidden',
                      isCorrect
                        ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                        : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
                    )}
                  >
                    {!isCorrect && <span className="font-medium">Here's why: </span>}
                    {option.explanation}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {!hasSubmitted && (
          <Button
            onClick={handleSubmit}
            disabled={localSelection.length === 0}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}
      </div>
    </WidgetPreviewCard>
  );
}
