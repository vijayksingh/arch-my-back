/**
 * BuildValidator - Validation UI and logic for canvas build mode
 * Validates learner's architecture against rules and provides feedback
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Lightbulb, AlertCircle, ChevronDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BuildValidationRule, BuildStepSolution, WalkthroughNodeDef } from '@/types/walkthrough';
import type { Node, Edge } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { SolutionPanel } from './SolutionPanel';

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
  solution?: BuildStepSolution;
  onApplySolution?: (nodes: WalkthroughNodeDef[], edges: Edge[]) => void;
}

export function BuildValidator({
  validationRules,
  successMessage,
  hints,
  nodes,
  edges,
  onValidationSuccess,
  solution,
  onApplySolution,
}: BuildValidatorProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [hasValidated, setHasValidated] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Solution panel state
  const [showSolution, setShowSolution] = useState(false);
  const [solutionApplied, setSolutionApplied] = useState(false);

  // Trigger condition state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [previousFailedRules, setPreviousFailedRules] = useState<Set<string>>(new Set());

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
    } else {
      // Track failed attempts for "Show Answer" trigger
      const failedRuleIds = results.filter(r => !r.passed).map(r => r.rule.feedback);
      const currentFailedSet = new Set(failedRuleIds);

      // Check if user made progress (fewer failed rules)
      const madeProgress = currentFailedSet.size < previousFailedRules.size;

      if (madeProgress) {
        setFailedAttempts(1); // Reset counter on progress
      } else {
        setFailedAttempts(prev => prev + 1);
      }
      setPreviousFailedRules(currentFailedSet);
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

  const handleApplySolution = (explanation: string) => {
    if (solution && onApplySolution) {
      // Apply the solution to the canvas
      onApplySolution(solution.nodes, solution.edges);
      setSolutionApplied(true);
      setShowSolution(false);

      // Track that solution was used (could log explanation for analytics)
      console.log('Solution applied with explanation:', explanation);
    }
  };

  const handleTryManually = () => {
    // Close solution panel, learner will try to fix manually
    setShowSolution(false);
    // Could add visual hints here in future (ghost outlines, etc.)
  };

  const allPassed = validationResults.length > 0 && validationResults.every((r) => r.passed);

  // Determine if "Show Answer" button should appear
  const allHintsUsed = showHints && currentHintIndex >= hints.length - 1;
  const validatedAfterFinalHint = allHintsUsed && hasValidated;
  const shouldShowSolutionButton =
    solution &&
    !allPassed &&
    !solutionApplied &&
    (failedAttempts >= 3 || validatedAfterFinalHint);

  // If minimized, show compact floating button
  if (minimized) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-4 left-4 z-10"
      >
        <Button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 shadow-lg"
          size="lg"
        >
          <AlertCircle className="h-4 w-4" />
          Validate
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-2xl"
    >
      <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg relative">
        {/* Minimize Button */}
        <button
          onClick={() => setMinimized(true)}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted/50 transition-colors z-20"
          aria-label="Minimize validator"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

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

        {/* Show Answer Section */}
        <AnimatePresence>
          {shouldShowSolutionButton && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-2">
                      Still stuck? See the complete solution with architectural explanation →
                    </div>
                    <Button
                      onClick={() => setShowSolution(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Show Answer
                    </Button>
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

      {/* Solution Panel Modal */}
      <AnimatePresence>
        {showSolution && solution && (
          <SolutionPanel
            solution={solution}
            currentNodes={nodes}
            currentEdges={edges}
            onApply={handleApplySolution}
            onTryManually={handleTryManually}
            onClose={() => setShowSolution(false)}
          />
        )}
      </AnimatePresence>
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
