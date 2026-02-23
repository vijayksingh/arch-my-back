/**
 * WalkthroughStepHeader - Phase indicator, title, and progress bar
 */

import {
  Lightbulb,
  Puzzle,
  AlertTriangle,
  Rocket,
  PenTool,
  Search,
  Clock,
} from 'lucide-react';
import type { WalkthroughStep } from '@/lib/walkthroughEngine';
import { cn } from '@/lib/utils';
import { useWalkthroughContext } from './WalkthroughContext';

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

export function WalkthroughStepHeader() {
  const { currentStep, progress } = useWalkthroughContext();

  if (!currentStep) return null;

  const PhaseIcon = getPhaseIcon(currentStep.phase);
  const phaseColors = getPhaseColor(currentStep.phase);

  return (
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
  );
}

export { getPhaseColor }; // Export for use in StepContent
