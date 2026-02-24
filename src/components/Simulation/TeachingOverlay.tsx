/**
 * TeachingOverlay — Educational content display when simulation enters teaching state
 *
 * Shows lessons from the simulation engine with professional, data-driven styling.
 * Grafana/DataDog inspired: dark, technical, not playful.
 */

import { memo, useCallback } from 'react';
import { Lightbulb, BookOpen, AlertTriangle, Sparkles } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';
import type { EducationalHint } from '@/types/simulation';

const TeachingOverlayComponent = () => {
  const isTeaching = useSimulationStore((s) => s.isTeaching);
  const isBroken = useSimulationStore((s) => s.isBroken);
  const currentLesson = useSimulationStore((s) => s.currentLesson);
  const activeFailures = useSimulationStore((s) => s.activeFailures);
  const { acknowledgeLesson, fixAndResume } = useSimulationStore((s) => s.actions);

  const handleGotIt = useCallback(() => {
    acknowledgeLesson();
  }, [acknowledgeLesson]);

  // FIX 4: Use single atomic fixAndResume action
  const handleFixAndResume = useCallback(() => {
    fixAndResume();
  }, [fixAndResume]);

  // Don't render if not in teaching or broken state
  if (!isTeaching && !isBroken) {
    return null;
  }

  // Broken state (failure detected, not yet teaching)
  if (isBroken && !isTeaching && activeFailures.length > 0) {
    // Show summary of all failures if multiple, or specific message for single failure
    const failureMessage = activeFailures.length === 1
      ? activeFailures[0].message
      : `${activeFailures.length} failures detected: ${activeFailures.map(f => f.type.replace(/_/g, ' ')).join(', ')}`;
    const highestSeverity = activeFailures.reduce((max, f) =>
      f.severity === 'critical' ? 'critical' : (f.severity === 'error' && max !== 'critical' ? 'error' : max),
      activeFailures[0].severity
    );

    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="rounded-lg border border-[hsl(var(--ui-border-accent-soft))] bg-[hsl(var(--surface-bg-elevated))] shadow-lg backdrop-blur-sm">
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[hsl(var(--text-primary))]">
                    {activeFailures.length === 1 ? 'System Failure Detected' : `${activeFailures.length} System Failures Detected`}
                  </h3>
                  <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
                    {failureMessage}
                  </p>
                </div>
              </div>
              <span className={cn(
                "shrink-0 px-2 py-1 text-xs font-medium rounded-md",
                highestSeverity === 'critical' && "bg-red-500/10 text-red-500",
                highestSeverity === 'error' && "bg-orange-500/10 text-orange-500",
                highestSeverity === 'warning' && "bg-yellow-500/10 text-yellow-500"
              )}>
                {highestSeverity}
              </span>
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <button
                onClick={handleGotIt}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium",
                  "rounded-md bg-[hsl(var(--ui-bg-accent))] text-white",
                  "hover:bg-[hsl(var(--ui-bg-accent))]/90",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ui-border-focus))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--surface-bg-elevated))]",
                  "transition-colors"
                )}
              >
                What happened?
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teaching state (showing lesson)
  if (isTeaching && currentLesson) {
    const lesson = currentLesson;
    const Icon = getIconForType(lesson.type);
    const typeLabel = getTypeLabelForType(lesson.type);
    const typeColor = getTypeColorForType(lesson.type);

    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="rounded-lg border border-[hsl(var(--ui-border-accent-soft))] bg-[hsl(var(--surface-bg-elevated))] shadow-lg backdrop-blur-sm">
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  typeColor.bg
                )}>
                  <Icon className={cn("h-5 w-5", typeColor.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[hsl(var(--text-primary))]">
                    {lesson.title}
                  </h3>
                </div>
              </div>
              <span className={cn(
                "shrink-0 px-2 py-1 text-xs font-medium rounded-md",
                typeColor.badge
              )}>
                {typeLabel}
              </span>
            </div>

            {/* Message */}
            <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
              {lesson.message}
            </p>

            {/* Suggestion box (if present) */}
            {lesson.actionSuggestion && (
              <div className="rounded-md bg-blue-500/5 border border-blue-500/20 p-4">
                <div className="flex gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-500 mb-1">Suggestion</p>
                    <p className="text-sm text-[hsl(var(--text-secondary))]">
                      {lesson.actionSuggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Learn more link (if present) */}
            {lesson.learnMoreUrl && (
              <a
                href={lesson.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[hsl(var(--ui-bg-accent))] hover:underline inline-flex items-center gap-1"
              >
                Learn more →
              </a>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleGotIt}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium",
                  "rounded-md border border-[hsl(var(--ui-border-ghost))] bg-transparent text-[hsl(var(--text-primary))]",
                  "hover:bg-[hsl(var(--ui-bg-hover))]",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ui-border-focus))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--surface-bg-elevated))]",
                  "transition-colors"
                )}
              >
                Got It
              </button>
              {activeFailures.length > 0 && (
                <button
                  onClick={handleFixAndResume}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium",
                    "rounded-md bg-[hsl(var(--ui-bg-accent))] text-white",
                    "hover:bg-[hsl(var(--ui-bg-accent))]/90",
                    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ui-border-focus))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--surface-bg-elevated))]",
                    "transition-colors"
                  )}
                >
                  Fix &amp; Resume
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ============================================================================
// Helper Functions
// ============================================================================

function getIconForType(type: EducationalHint['type']) {
  switch (type) {
    case 'pattern_opportunity':
      return Lightbulb;
    case 'best_practice':
      return BookOpen;
    case 'failure_explanation':
      return AlertTriangle;
    case 'success_celebration':
      return Sparkles;
    default:
      return Lightbulb;
  }
}

function getTypeLabelForType(type: EducationalHint['type']): string {
  switch (type) {
    case 'pattern_opportunity':
      return 'Pattern';
    case 'best_practice':
      return 'Best Practice';
    case 'failure_explanation':
      return 'Failure';
    case 'success_celebration':
      return 'Success';
    default:
      return 'Lesson';
  }
}

function getTypeColorForType(type: EducationalHint['type']) {
  switch (type) {
    case 'pattern_opportunity':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        badge: 'bg-blue-500/10 text-blue-500',
      };
    case 'best_practice':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-500',
        badge: 'bg-green-500/10 text-green-500',
      };
    case 'failure_explanation':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        badge: 'bg-red-500/10 text-red-500',
      };
    case 'success_celebration':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-500',
        badge: 'bg-purple-500/10 text-purple-500',
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-500',
        badge: 'bg-gray-500/10 text-gray-500',
      };
  }
}

export const TeachingOverlay = memo(TeachingOverlayComponent);
