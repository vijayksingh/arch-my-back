/**
 * SolutionPanel - Modal displaying the correct solution with architectural explanation
 * Shows 3-column diff (Remove/Keep/Add) with educational context
 */

import { useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Lightbulb, BookOpen, AlertTriangle } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';
import type { BuildStepSolution } from '@/types/walkthrough';
import { computeDiff } from '@/lib/solutionDiff';
import { DiffColumn } from './DiffColumn';
import { UnderstandingGate } from './UnderstandingGate';

interface SolutionPanelProps {
  solution: BuildStepSolution;
  currentNodes: Node[];
  currentEdges: Edge[];
  onApply: (explanation: string) => void;
  onTryManually: () => void;
  onClose: () => void;
}

export function SolutionPanel({
  solution,
  currentNodes,
  currentEdges,
  onApply,
  onTryManually,
  onClose,
}: SolutionPanelProps) {
  const diffData = useMemo(
    () => computeDiff(currentNodes, currentEdges, solution),
    [currentNodes, currentEdges, solution]
  );

  // Add escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[800px] max-h-[80vh] overflow-auto
                   rounded-lg border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between
                        border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4">
          <h2 className="text-xl font-semibold">Understanding the Solution</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted/50 transition-colors"
            aria-label="Close solution panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Key Insight Banner */}
        <div className="px-6 py-4 bg-primary/5 border-b border-primary/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold uppercase text-primary/80 mb-1">
                Key Insight
              </div>
              <div className="text-sm font-medium leading-relaxed">
                {solution.explanation.keyInsight}
              </div>
            </div>
          </div>
        </div>

        {/* Three-Column Diff */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-border">
          <DiffColumn
            title="❌ Remove"
            items={diffData.toRemove}
            colorScheme="red"
            explanation="These components don't fit the pattern"
          />

          <DiffColumn
            title="✅ Keep"
            items={diffData.toKeep}
            colorScheme="green"
            explanation="Correct architecture components"
          />

          <DiffColumn
            title="➕ Add"
            items={diffData.toAdd}
            colorScheme="yellow"
            explanation="Missing components needed for the pattern"
          />
        </div>

        {/* Architectural Reasoning */}
        <div className="px-6 py-5 bg-muted/30 border-b border-border">
          <div className="flex items-start gap-3 mb-3">
            <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <h3 className="text-sm font-semibold">
              {solution.explanation.title}
            </h3>
          </div>
          <ul className="space-y-2 ml-8">
            {solution.explanation.reasoning.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="text-primary mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Common Mistakes */}
        <div className="px-6 py-5 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-800/50">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Common Mistakes (What Learners Get Wrong)
            </h3>
          </div>
          <ul className="space-y-2 ml-8">
            {solution.explanation.commonMistakes.map((mistake, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Understanding Gate */}
        <div className="px-6 py-5">
          <UnderstandingGate
            onApply={onApply}
            onTryManually={onTryManually}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
