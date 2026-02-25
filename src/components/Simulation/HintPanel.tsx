/**
 * HintPanel — Non-modal side panel for detailed hint content
 *
 * Design: Slides in from right (~30% canvas width). Contains title, severity,
 * explanation, suggestion, "Learn More" link, "Got It" dismiss, "Fix & Resume" button.
 * Does NOT cover full canvas. Closes on ESC/click-outside/"Got It".
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import { X, Lightbulb, BookOpen, AlertTriangle, Sparkles } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';
import type { EducationalHint } from '@/types/simulation';

interface HintPanelProps {
  nodeId: string;
  hint: EducationalHint;
}

const HintPanelComponent = ({ nodeId, hint }: HintPanelProps) => {
  const { selectHint, dismissHint, fixAndResume } = useSimulationStore((s) => s.actions);
  const activeFailures = useSimulationStore((s) => s.activeFailures);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    selectHint(null);
  }, [selectHint]);

  const handleGotIt = useCallback(() => {
    dismissHint(nodeId);
    selectHint(null);
  }, [nodeId, dismissHint, selectHint]);

  const handleFixAndResume = useCallback(() => {
    fixAndResume();
    dismissHint(nodeId);
    selectHint(null);
  }, [nodeId, fixAndResume, dismissHint, selectHint]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    // Use capture phase to intercept clicks before they reach ReactFlow
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [handleClose]);

  const Icon = getIconForType(hint.type);
  const typeLabel = getTypeLabelForType(hint.type);
  const typeColor = getTypeColorForType(hint.type);

  return (
    <>
      {/* Backdrop (subtle, doesn't block interaction with canvas) */}
      <div className="absolute inset-0 z-40 bg-black/10 backdrop-blur-[1px] pointer-events-none animate-in fade-in duration-200" />

      {/* Side panel */}
      <div
        ref={panelRef}
        className={cn(
          "absolute top-0 right-0 bottom-0 z-50",
          "w-[min(400px,30vw)]",
          "bg-[hsl(var(--surface-bg-elevated))] border-l border-[hsl(var(--ui-border-accent-soft))]",
          "shadow-2xl",
          "animate-in slide-in-from-right duration-300",
          "flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-[hsl(var(--ui-border-ghost))]">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              typeColor.bg
            )}>
              <Icon className={cn("h-5 w-5", typeColor.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[hsl(var(--text-primary))]">
                {hint.title}
              </h3>
              <span className={cn(
                "inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-md",
                typeColor.badge
              )}>
                {typeLabel}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              "shrink-0 p-1 rounded-md",
              "text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-primary))]",
              "hover:bg-[hsl(var(--ui-bg-hover))]",
              "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ui-border-focus))]",
              "transition-colors"
            )}
            aria-label="Close hint panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Message */}
          <div>
            <h4 className="text-xs font-semibold text-[hsl(var(--text-tertiary))] uppercase tracking-wider mb-2">
              Explanation
            </h4>
            <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
              {hint.message}
            </p>
          </div>

          {/* Suggestion box (if present) */}
          {hint.actionSuggestion && (
            <div className="rounded-md bg-blue-500/5 border border-blue-500/20 p-4">
              <div className="flex gap-2">
                <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-500 mb-1">Suggestion</p>
                  <p className="text-sm text-[hsl(var(--text-secondary))]">
                    {hint.actionSuggestion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Learn more link (if present) */}
          {hint.learnMoreUrl && (
            <a
              href={hint.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[hsl(var(--ui-bg-accent))] hover:underline inline-flex items-center gap-1"
            >
              Learn more →
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[hsl(var(--ui-border-ghost))] flex justify-end gap-3">
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
    </>
  );
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

export const HintPanel = memo(HintPanelComponent);
