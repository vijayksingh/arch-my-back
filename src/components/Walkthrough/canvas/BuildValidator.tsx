/**
 * BuildValidator - Validation UI and logic for canvas build mode
 * Validates learner's architecture against rules and provides feedback
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BuildValidationRule } from '@/types/walkthrough';
import type { Node, Edge } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface ValidationResult {
  rule: BuildValidationRule;
  passed: boolean;
}

interface BuildValidatorProps {
  validationRules: BuildValidationRule[];
  successMessage: string;
  hints: string[];
  nodes: Node[];
  edges: Edge[];
  onValidationSuccess: () => void;
}

export function BuildValidator({
  validationRules,
  successMessage,
  hints,
  nodes,
  edges,
  onValidationSuccess,
}: BuildValidatorProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [hasValidated, setHasValidated] = useState(false);

  const validateArchitecture = (): boolean => {
    const results: ValidationResult[] = [];

    for (const rule of validationRules) {
      const passed = evaluateRule(rule, nodes, edges);
      results.push({ rule, passed });
    }

    setValidationResults(results);
    setHasValidated(true);

    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
      onValidationSuccess();
    }

    return allPassed;
  };

  const handleValidate = () => {
    validateArchitecture();
  };

  const handleShowNextHint = () => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
    setShowHints(true);
  };

  const allPassed = validationResults.length > 0 && validationResults.every((r) => r.passed);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-2xl"
    >
      <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg">
        {/* Validation Results */}
        <AnimatePresence>
          {hasValidated && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="p-4 space-y-2">
                {validationResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-3 rounded-md border px-3 py-2 text-sm',
                      result.passed
                        ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
                        : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                    )}
                  >
                    {result.passed ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <span className={result.passed ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}>
                      {result.rule.feedback}
                    </span>
                  </div>
                ))}

                {/* Success Message */}
                {allPassed && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-3 flex items-start gap-3 rounded-md border border-green-500 bg-green-50 dark:bg-green-950/30 px-4 py-3"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-green-900 dark:text-green-100">
                        Architecture Validated!
                      </div>
                      <div className="mt-1 text-sm text-green-800 dark:text-green-200">
                        {successMessage}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hints Section */}
        <AnimatePresence>
          {showHints && hints.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-amber-900 dark:text-amber-100 text-sm mb-1">
                      Hint {currentHintIndex + 1} of {hints.length}
                    </div>
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      {hints[currentHintIndex]}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="p-4 flex items-center gap-3">
          {hints.length > 0 && !allPassed && (
            <Button
              variant="outline"
              onClick={handleShowNextHint}
              disabled={showHints && currentHintIndex >= hints.length - 1}
              className="flex items-center gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              {showHints ? 'Next Hint' : 'Show Hint'}
            </Button>
          )}

          <Button
            onClick={handleValidate}
            disabled={allPassed}
            className={cn(
              'flex items-center gap-2',
              allPassed && 'opacity-50 cursor-not-allowed'
            )}
          >
            <AlertCircle className="h-4 w-4" />
            Validate Architecture
          </Button>

          {allPassed && (
            <div className="ml-auto text-sm text-muted-foreground">
              Click "Next" to continue →
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Evaluate a validation rule against current canvas state
 */
function evaluateRule(rule: BuildValidationRule, nodes: Node[], edges: Edge[]): boolean {
  switch (rule.type) {
    case 'must-exist': {
      // Rule: a node with specific type must exist
      // params: { nodeType: string }
      const nodeType = rule.params.nodeType as string;
      return nodes.some((n) => n.type === nodeType);
    }

    case 'min-count': {
      // Rule: minimum number of nodes of a specific type
      // params: { nodeType: string, count: number }
      const nodeType = rule.params.nodeType as string;
      const minCount = rule.params.count as number;
      const count = nodes.filter((n) => n.type === nodeType).length;
      return count >= minCount;
    }

    case 'must-connect': {
      // Rule: two specific nodes must be connected
      // params: { sourceType: string, targetType: string } or { sourceId: string, targetId: string }
      if (rule.params.sourceId && rule.params.targetId) {
        const sourceId = rule.params.sourceId as string;
        const targetId = rule.params.targetId as string;
        return edges.some((e) => e.source === sourceId && e.target === targetId);
      }

      if (rule.params.sourceType && rule.params.targetType) {
        const sourceType = rule.params.sourceType as string;
        const targetType = rule.params.targetType as string;

        // Find nodes of each type
        const sourceNodes = nodes.filter((n) => n.type === sourceType);
        const targetNodes = nodes.filter((n) => n.type === targetType);

        // Check if any source node connects to any target node
        return edges.some((e) =>
          sourceNodes.some((s) => s.id === e.source) &&
          targetNodes.some((t) => t.id === e.target)
        );
      }

      return false;
    }

    case 'must-not-connect': {
      // Rule: two nodes must NOT be connected
      // params: { sourceType: string, targetType: string } or { sourceId: string, targetId: string }
      if (rule.params.sourceId && rule.params.targetId) {
        const sourceId = rule.params.sourceId as string;
        const targetId = rule.params.targetId as string;
        return !edges.some((e) => e.source === sourceId && e.target === targetId);
      }

      if (rule.params.sourceType && rule.params.targetType) {
        const sourceType = rule.params.sourceType as string;
        const targetType = rule.params.targetType as string;

        // Find nodes of each type
        const sourceNodes = nodes.filter((n) => n.type === sourceType);
        const targetNodes = nodes.filter((n) => n.type === targetType);

        // Check that no source node connects to any target node
        return !edges.some((e) =>
          sourceNodes.some((s) => s.id === e.source) &&
          targetNodes.some((t) => t.id === e.target)
        );
      }

      return false;
    }

    default:
      return false;
  }
}
