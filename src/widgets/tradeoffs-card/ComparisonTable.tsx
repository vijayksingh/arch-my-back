import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import type { Alternative } from './TradeoffsCard';

interface ComparisonTableProps {
  alternatives: Alternative[];
  selectedId?: string;
}

export function ComparisonTable({ alternatives, selectedId }: ComparisonTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="space-y-2"
    >
      <div className="text-sm font-semibold text-muted-foreground">All Approaches Compared</div>

      {alternatives.map((alt) => {
        const isRecommended = alt.recommended;
        const isSelected = alt.id === selectedId;

        return (
          <div
            key={alt.id}
            className={`overflow-hidden rounded-lg border-2 transition-colors ${
              isRecommended
                ? 'border-green-500/50 bg-green-50/30 dark:bg-green-950/10'
                : 'border-border bg-muted/20'
            }`}
          >
            <div className="p-3">
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="font-medium">{alt.name}</div>
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      Your choice
                    </span>
                  )}
                  {isRecommended && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Recommended</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {alt.description && (
                <div className="mb-3 text-sm text-muted-foreground">{alt.description}</div>
              )}

              {/* Pros and Cons */}
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
                    Pros
                  </div>
                  <ul className="space-y-1">
                    {alt.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <span className="mt-0.5 text-green-600 dark:text-green-400">✓</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
                    Cons
                  </div>
                  <ul className="space-y-1">
                    {alt.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <span className="mt-0.5 text-red-600 dark:text-red-400">✗</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* When to use / avoid */}
              {(alt.whenToUse || alt.whenToAvoid) && (
                <div className="space-y-2 border-t border-border/50 pt-3">
                  {alt.whenToUse && (
                    <div className="text-xs">
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        ✅ Use this when:{' '}
                      </span>
                      <span className="text-muted-foreground">{alt.whenToUse}</span>
                    </div>
                  )}
                  {alt.whenToAvoid && (
                    <div className="text-xs">
                      <span className="font-semibold text-red-700 dark:text-red-400">
                        ❌ Avoid this when:{' '}
                      </span>
                      <span className="text-muted-foreground">{alt.whenToAvoid}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata badges */}
              {(alt.complexity || alt.cost) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {alt.complexity && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Complexity: {alt.complexity}
                    </span>
                  )}
                  {alt.cost && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Cost: {alt.cost}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
