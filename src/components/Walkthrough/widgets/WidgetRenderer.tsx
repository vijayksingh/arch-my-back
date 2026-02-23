/**
 * WidgetRenderer - Routes widgets to appropriate components
 */

import type { WidgetConfig } from '@/types/walkthrough';
import { CodeBlock } from '@/widgets/code-block/CodeBlock';
import { TradeoffsCard } from '@/widgets/tradeoffs-card/TradeoffsCard';
import { Timeline } from '@/widgets/timeline/Timeline';
import { ComparisonTable } from '@/widgets/comparison-table/ComparisonTable';
import { ScaleExplorer } from '../widgets/ScaleExplorer';
import { InteractiveTimelineWidget } from '../InteractiveTimelineWidget';
import { QuizWidget } from './QuizWidget';

interface WidgetRendererProps {
  widget: WidgetConfig;
  quizAnswers?: string[];
  onQuizAnswer: (selectedOptionIds: string[]) => void;
  onTimelineHighlight?: (nodeIds: string[]) => void;
}

export function WidgetRenderer({ widget, quizAnswers, onQuizAnswer, onTimelineHighlight }: WidgetRendererProps) {
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
            mode: widget.mode,
            scenario: widget.scenario,
            constraints: widget.constraints,
            alternatives: widget.options.map((opt, i) => ({
              id: `alt-${i}`,
              name: opt.label,
              pros: opt.pros,
              cons: opt.cons,
              consequence: opt.consequence,
              recommended: opt.recommended,
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
      // For interactive timelines in walkthroughs, we need to handle nodeId highlighting
      // Non-interactive timelines work as before
      if (widget.interactive) {
        return (
          <InteractiveTimelineWidget
            widget={widget}
            onHighlightNodes={onTimelineHighlight || (() => {})}
          />
        );
      }
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
              mode: widget.mode || 'display',
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
                blanks: row.blanks?.map(idx => `col-${idx}`),
                acceptableAnswers: row.acceptableAnswers
                  ? Object.fromEntries(
                      Object.entries(row.acceptableAnswers).map(([idx, vals]) => [
                        `col-${idx}`,
                        vals,
                      ])
                    )
                  : undefined,
              })),
              decisionPrompt: widget.decisionPrompt,
              decisionOptions: widget.decisionOptions,
            }}
            config={{
              name: widget.title,
              striped: true,
              highlightOnHover: true,
            }}
          />
        </div>
      );
    case 'scale-explorer':
      return <ScaleExplorer config={widget} />;
    default:
      return null;
  }
}
