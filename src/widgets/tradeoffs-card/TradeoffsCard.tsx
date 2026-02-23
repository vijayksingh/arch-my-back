import { useState } from 'react';
import type { WidgetProps } from '../types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Download, ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Alternative option with pros/cons
 */
export interface Alternative {
  id: string;
  name: string;
  description?: string;
  pros: string[];
  cons: string[];
  consequence?: string; // What happens if this option is chosen (for decision mode)
  recommended?: boolean; // Whether this is the recommended option (for decision mode)
}

/**
 * Trade-offs Card Input Schema
 */
export interface TradeoffsCardInput {
  title: string;
  context?: string;
  pros: string[];
  cons: string[];
  decision?: string;
  alternatives?: Alternative[];
  mode?: 'display' | 'decision'; // New: decision mode for interactive learning
  scenario?: string; // Context for decision mode
  constraints?: string[]; // Requirements/constraints for decision mode
}

/**
 * Trade-offs Card Output Schema
 */
export interface TradeoffsCardOutput {
  selectedAlternative?: string;
  exportedADR?: string;
}

/**
 * Trade-offs Card Config Schema
 */
export interface TradeoffsCardConfig {
  name?: string;
  showAlternatives?: boolean;
  exportAsADR?: boolean;
  expandedByDefault?: boolean;
}

/**
 * Trade-offs Card Widget Component
 */
export function TradeoffsCard({
  input,
  config,
  onOutput,
}: WidgetProps<TradeoffsCardInput, TradeoffsCardOutput, TradeoffsCardConfig>) {
  const [expandedAlternatives, setExpandedAlternatives] = useState<Set<string>>(
    new Set(config.expandedByDefault ? input?.alternatives?.map((a) => a.id) : [])
  );
  const [selectedAlternative, setSelectedAlternative] = useState<string | undefined>();
  const [decisionMade, setDecisionMade] = useState(false);

  if (!input) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-border bg-muted/30 p-4">
        <div className="text-center text-sm text-muted-foreground">
          No data provided. Please provide title, pros, and cons.
        </div>
      </div>
    );
  }

  const mode = input.mode || 'display';

  const toggleAlternative = (id: string) => {
    setExpandedAlternatives((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAlternative = (id: string) => {
    const newSelected = selectedAlternative === id ? undefined : id;
    setSelectedAlternative(newSelected);
    onOutput?.({
      selectedAlternative: newSelected,
    });
  };

  const handleDecisionSelect = (id: string) => {
    setSelectedAlternative(id);
    setDecisionMade(true);
    onOutput?.({
      selectedAlternative: id,
    });
  };

  const exportToADR = () => {
    let adr = `# Architecture Decision Record: ${input.title}\n\n`;

    if (input.context) {
      adr += `## Context\n\n${input.context}\n\n`;
    }

    adr += `## Decision\n\n`;
    if (input.decision) {
      adr += `${input.decision}\n\n`;
    } else {
      adr += `(Decision pending)\n\n`;
    }

    adr += `## Consequences\n\n`;

    if (input.pros.length > 0) {
      adr += `### Pros\n\n`;
      input.pros.forEach((pro) => {
        adr += `- ✅ ${pro}\n`;
      });
      adr += `\n`;
    }

    if (input.cons.length > 0) {
      adr += `### Cons\n\n`;
      input.cons.forEach((con) => {
        adr += `- ❌ ${con}\n`;
      });
      adr += `\n`;
    }

    if (input.alternatives && input.alternatives.length > 0) {
      adr += `## Alternatives Considered\n\n`;
      input.alternatives.forEach((alt) => {
        adr += `### ${alt.name}\n\n`;
        if (alt.description) {
          adr += `${alt.description}\n\n`;
        }
        if (alt.pros.length > 0) {
          adr += `**Pros:**\n`;
          alt.pros.forEach((pro) => {
            adr += `- ✅ ${pro}\n`;
          });
          adr += `\n`;
        }
        if (alt.cons.length > 0) {
          adr += `**Cons:**\n`;
          alt.cons.forEach((con) => {
            adr += `- ❌ ${con}\n`;
          });
          adr += `\n`;
        }
      });
    }

    adr += `## Status\n\n`;
    adr += input.decision ? `Accepted\n` : `Proposed\n`;
    adr += `\n---\n\n`;
    adr += `Date: ${new Date().toISOString().split('T')[0]}\n`;

    const blob = new Blob([adr], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ADR-${input.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);

    onOutput?.({
      selectedAlternative,
      exportedADR: adr,
    });
  };

  const prosCount = input.pros.length;
  const consCount = input.cons.length;
  const balance = prosCount - consCount;

  // Decision mode rendering
  if (mode === 'decision' && input.alternatives) {
    const selectedAlt = input.alternatives.find((a) => a.id === selectedAlternative);
    const recommendedAlt = input.alternatives.find((a) => a.recommended);

    return (
      <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
          <div className="text-sm font-medium">{config.name || 'Decision Exercise'}</div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Title */}
          <h2 className="mb-3 text-xl font-bold">{input.title}</h2>

          {/* Scenario */}
          {input.scenario && (
            <div className="mb-4 rounded-lg bg-blue-50/50 p-3 dark:bg-blue-950/20">
              <div className="mb-1 text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
                Scenario
              </div>
              <div className="text-sm text-blue-900 dark:text-blue-100">{input.scenario}</div>
            </div>
          )}

          {/* Constraints */}
          {input.constraints && input.constraints.length > 0 && (
            <div className="mb-4 rounded-lg bg-amber-50/50 p-3 dark:bg-amber-950/20">
              <div className="mb-2 text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">
                Constraints
              </div>
              <ul className="space-y-1">
                {input.constraints.map((constraint, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100">
                    <span className="mt-0.5">•</span>
                    <span>{constraint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decision not made yet - show option cards */}
          {!decisionMade && (
            <div className="space-y-2">
              <div className="mb-3 text-sm font-semibold text-muted-foreground">
                Choose your approach:
              </div>
              {input.alternatives.map((alt) => (
                <motion.button
                  key={alt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDecisionSelect(alt.id)}
                  className="w-full rounded-lg border-2 border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-muted/30"
                >
                  <div className="font-medium">{alt.name}</div>
                  {alt.description && (
                    <div className="mt-1 text-sm text-muted-foreground">{alt.description}</div>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Decision made - show consequence and comparison */}
          {decisionMade && selectedAlt && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Selected choice header */}
                <div className="rounded-lg border-2 border-primary bg-primary/5 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase text-primary">
                    You chose
                  </div>
                  <div className="font-medium">{selectedAlt.name}</div>
                </div>

                {/* Consequence */}
                {selectedAlt.consequence && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="rounded-lg bg-purple-50/50 p-3 dark:bg-purple-950/20"
                  >
                    <div className="mb-1 text-xs font-semibold uppercase text-purple-700 dark:text-purple-300">
                      What happens
                    </div>
                    <div className="text-sm text-purple-900 dark:text-purple-100">
                      {selectedAlt.consequence}
                    </div>
                  </motion.div>
                )}

                {/* Show better choice if not recommended */}
                {!selectedAlt.recommended && recommendedAlt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="rounded-lg border-2 border-green-500/50 bg-green-50/50 p-3 dark:bg-green-950/20"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <div className="text-xs font-semibold uppercase text-green-700 dark:text-green-300">
                        The better choice
                      </div>
                    </div>
                    <div className="font-medium text-green-900 dark:text-green-100">
                      {recommendedAlt.name}
                    </div>
                    {recommendedAlt.consequence && (
                      <div className="mt-2 text-sm text-green-800 dark:text-green-200">
                        {recommendedAlt.consequence}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Full comparison table */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="space-y-2"
                >
                  <div className="text-sm font-semibold text-muted-foreground">
                    Full Comparison
                  </div>
                  {input.alternatives.map((alt) => {
                    const isRecommended = alt.recommended;
                    const isSelected = alt.id === selectedAlternative;

                    return (
                      <div
                        key={alt.id}
                        className={`overflow-hidden rounded-lg border-2 ${
                          isRecommended
                            ? 'border-green-500/50 bg-green-50/30 dark:bg-green-950/10'
                            : 'border-border bg-muted/20'
                        }`}
                      >
                        <div className="p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="font-medium">{alt.name}</div>
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                  Your choice
                                </span>
                              )}
                              {isRecommended && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="mb-1 text-xs font-semibold text-success">Pros</div>
                              <ul className="space-y-1">
                                {alt.pros.map((pro, i) => (
                                  <li key={i} className="flex items-start gap-1 text-xs">
                                    <span className="text-success">✓</span>
                                    <span>{pro}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="mb-1 text-xs font-semibold text-error">Cons</div>
                              <ul className="space-y-1">
                                {alt.cons.map((con, i) => (
                                  <li key={i} className="flex items-start gap-1 text-xs">
                                    <span className="text-error">✗</span>
                                    <span>{con}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    );
  }

  // Display mode rendering (original behavior)
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="text-sm font-medium">{config.name || 'Trade-offs Card'}</div>
        <Button
          size="sm"
          variant="ghost"
          onClick={exportToADR}
          title="Export as Architecture Decision Record"
        >
          <Download className="mr-1 h-3 w-3" />
          ADR
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Title */}
        <h2 className="mb-3 text-xl font-bold">{input.title}</h2>

        {/* Context */}
        {input.context && (
          <div className="mb-4 rounded-lg bg-muted/30 p-3">
            <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Context
            </div>
            <div className="text-sm">{input.context}</div>
          </div>
        )}

        {/* Pros & Cons */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {/* Pros */}
          <div className="rounded-lg border border-success/30 bg-success-muted p-3">
            <div className="mb-2 flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-success" />
              <div className="text-sm font-semibold text-success">
                Pros ({prosCount})
              </div>
            </div>
            <ul className="space-y-1.5">
              {input.pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 text-success">✓</span>
                  <span className="flex-1 text-success">{pro}</span>
                </li>
              ))}
            </ul>
            {input.pros.length === 0 && (
              <div className="text-sm italic text-success/50">
                No pros listed
              </div>
            )}
          </div>

          {/* Cons */}
          <div className="rounded-lg border border-error/30 bg-error-muted p-3">
            <div className="mb-2 flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-error" />
              <div className="text-sm font-semibold text-error">
                Cons ({consCount})
              </div>
            </div>
            <ul className="space-y-1.5">
              {input.cons.map((con, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 text-error">✗</span>
                  <span className="flex-1 text-error">{con}</span>
                </li>
              ))}
            </ul>
            {input.cons.length === 0 && (
              <div className="text-sm italic text-error/50">
                No cons listed
              </div>
            )}
          </div>
        </div>

        {/* Balance indicator */}
        <div className="mb-4 flex items-center justify-center">
          <div
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              balance > 0
                ? 'bg-success-muted text-success'
                : balance < 0
                  ? 'bg-error-muted text-error'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {balance > 0
              ? `+${balance} in favor`
              : balance < 0
                ? `${balance} against`
                : 'Balanced'}
          </div>
        </div>

        {/* Decision */}
        {input.decision && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="mb-1 text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
              Decision
            </div>
            <div className="text-sm text-blue-900 dark:text-blue-100">{input.decision}</div>
          </div>
        )}

        {/* Alternatives */}
        {config.showAlternatives && input.alternatives && input.alternatives.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">
              Alternatives Considered ({input.alternatives.length})
            </div>
            {input.alternatives.map((alt) => {
              const isExpanded = expandedAlternatives.has(alt.id);
              const isSelected = selectedAlternative === alt.id;

              return (
                <motion.div
                  layout
                  key={alt.id}
                  className={`overflow-hidden rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  <motion.div 
                    layout="position"
                    className="flex w-full items-center justify-between p-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-1 items-start text-left outline-none"
                      onClick={() => toggleAlternative(alt.id)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{alt.name}</div>
                        {alt.description && !isExpanded && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {alt.description.substring(0, 80)}
                            {alt.description.length > 80 ? '...' : ''}
                          </div>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-xs transition-colors outline-none ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAlternative(alt.id);
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </motion.button>
                  </motion.div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.3 }}
                        className="border-t border-border px-3 pb-3"
                      >
                        <div className="pt-2">
                          {alt.description && (
                            <div className="mb-2 text-sm text-muted-foreground">
                              {alt.description}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="mb-1 text-xs font-semibold text-success">
                                Pros
                              </div>
                              <ul className="space-y-1">
                                {alt.pros.map((pro, i) => (
                                  <li key={i} className="flex items-start gap-1 text-xs">
                                    <span className="text-success">✓</span>
                                    <span>{pro}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="mb-1 text-xs font-semibold text-error">
                                Cons
                              </div>
                              <ul className="space-y-1">
                                {alt.cons.map((con, i) => (
                                  <li key={i} className="flex items-start gap-1 text-xs">
                                    <span className="text-error">✗</span>
                                    <span>{con}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
