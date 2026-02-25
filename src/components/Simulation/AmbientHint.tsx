/**
 * AmbientHint — Non-modal floating hint glyph positioned above a node
 *
 * Design: Inspired by Factorio — teaching should NEVER pause simulation.
 * Hints float above the affected node, visible but non-intrusive.
 * Subtle bounce animation draws attention. Hover shows summary. Click opens HintPanel.
 * Auto-dismisses after 30 seconds.
 */

import { memo, useCallback, useEffect, useState } from 'react';
import { Lightbulb, AlertTriangle, BookOpen, Sparkles } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';
import type { EducationalHint } from '@/types/simulation';

interface AmbientHintProps {
  nodeId: string;
  hint: EducationalHint;
  timestamp: number;
}

const AmbientHintComponent = ({ nodeId, hint, timestamp }: AmbientHintProps) => {
  const { getNode } = useReactFlow();
  const { selectHint, dismissHint } = useSimulationStore((s) => s.actions);
  const [showTooltip, setShowTooltip] = useState(false);

  // Get node position from ReactFlow
  const node = getNode(nodeId);

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    const elapsed = Date.now() - timestamp;
    const remaining = 30000 - elapsed;

    if (remaining <= 0) {
      dismissHint(nodeId);
      return;
    }

    const timer = setTimeout(() => {
      dismissHint(nodeId);
    }, remaining);

    return () => clearTimeout(timer);
  }, [nodeId, timestamp, dismissHint]);

  const handleClick = useCallback(() => {
    selectHint(nodeId);
  }, [nodeId, selectHint]);

  if (!node) {
    return null;
  }

  // Position hint above the node (centered horizontally)
  const hintX = node.position.x + (node.measured?.width || 200) / 2;
  const hintY = node.position.y - 40; // 40px above node

  const Icon = getIconForType(hint.type);
  const colors = getTypeColorForType(hint.type);

  return (
    <>
      {/* Floating hint glyph */}
      <div
        className="absolute z-50 pointer-events-auto"
        style={{
          left: `${hintX}px`,
          top: `${hintY}px`,
          transform: 'translate(-50%, 0)',
        }}
      >
        <button
          onClick={handleClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-full",
            "border-2 backdrop-blur-sm shadow-lg",
            "transition-all duration-200",
            "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
            "animate-bounce",
            colors.bg,
            colors.border,
            "focus:ring-[hsl(var(--ui-border-focus))]"
          )}
          style={{
            animationDuration: '2s',
            animationIterationCount: 'infinite',
          }}
        >
          <Icon className={cn("h-4 w-4", colors.text)} />
        </button>

        {/* Tooltip on hover */}
        {showTooltip && (
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 top-full mt-2",
              "w-max max-w-[300px] p-3 rounded-md",
              "bg-[hsl(var(--surface-bg-elevated))] border border-[hsl(var(--ui-border-accent-soft))]",
              "shadow-lg backdrop-blur-sm",
              "text-xs text-[hsl(var(--text-secondary))]",
              "animate-in fade-in duration-150",
              "pointer-events-none"
            )}
          >
            <p className="font-medium text-[hsl(var(--text-primary))] mb-1">
              {hint.title}
            </p>
            <p className="line-clamp-2">{hint.message}</p>
            <p className="mt-2 text-[10px] text-[hsl(var(--text-tertiary))]">
              Click for details
            </p>
          </div>
        )}
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

function getTypeColorForType(type: EducationalHint['type']) {
  switch (type) {
    case 'pattern_opportunity':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/50',
      };
    case 'best_practice':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-500',
        border: 'border-green-500/50',
      };
    case 'failure_explanation':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        border: 'border-red-500/50',
      };
    case 'success_celebration':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-500',
        border: 'border-purple-500/50',
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-500',
        border: 'border-gray-500/50',
      };
  }
}

export const AmbientHint = memo(AmbientHintComponent);
