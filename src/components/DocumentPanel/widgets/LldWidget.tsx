import { useCallback, useRef } from 'react';
import { FileText } from 'lucide-react';
import type { NotebookBlock } from '@/types';
import { useDocumentStore } from '@/stores/documentStore';
import { WidgetPreviewCard } from './WidgetPreviewCard';
import { useDoubleEnterExit } from './useDoubleEnterExit';
import { MarkdownLines } from './MarkdownLines';
import { cn } from '@/lib/utils';

interface LldWidgetProps {
  block: Extract<NotebookBlock, { type: 'lld' }>;
  isPreview: boolean;
  autoFocus?: boolean;
  onExitWidget?: () => void;
}

type LldStatus = 'draft' | 'review' | 'final';

const STATUS_STYLES: Record<LldStatus, string> = {
  draft: 'text-muted-foreground bg-muted/30',
  review: 'text-amber-400 bg-amber-500/15',
  final: 'text-green-400 bg-green-500/15',
};

const STATUS_LABELS: Record<LldStatus, string> = {
  draft: 'Draft',
  review: 'Review',
  final: 'Final',
};

export function LldWidget({ block, isPreview, autoFocus, onExitWidget }: LldWidgetProps) {
  const updateBlockData = useDocumentStore((s) => s.updateBlockData);
  const { title, summary, content, status = 'draft' } = block.data;
  const lastWasEnter = useRef(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateBlockData(block.id, { title: e.target.value });
    },
    [block.id, updateBlockData],
  );

  const handleSummaryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateBlockData(block.id, { summary: e.target.value });
    },
    [block.id, updateBlockData],
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateBlockData(block.id, { content: e.target.value });
    },
    [block.id, updateBlockData],
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateBlockData(block.id, { status: e.target.value as LldStatus });
    },
    [block.id, updateBlockData],
  );

  const handleTitleKeyDown = useDoubleEnterExit(onExitWidget ?? (() => {}));

  const handleContentKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!onExitWidget) return;

      if (e.key === 'Enter') {
        const ta = contentRef.current;
        const pos = ta ? ta.selectionStart : 0;
        const end = ta ? ta.selectionEnd : 0;
        const value = ta ? ta.value : '';

        if (pos === end) {
          const before = value.slice(0, pos);
          const lineContent = before.slice(before.lastIndexOf('\n') + 1);
          const after = value.slice(pos);
          const isAtEmptyLine = lineContent === '' && (after === '' || after.startsWith('\n'));

          if (isAtEmptyLine && lastWasEnter.current) {
            e.preventDefault();
            onExitWidget();
            return;
          }
        }

        lastWasEnter.current = true;
        setTimeout(() => { lastWasEnter.current = false; }, 500);
      } else if (e.key !== 'Enter') {
        lastWasEnter.current = false;
      }
    },
    [onExitWidget],
  );

  if (isPreview) {
    return (
      <WidgetPreviewCard icon={FileText} title={title || 'Low-Level Design'} accentBorder>
        <div className="mb-2 flex items-center justify-between">
          {summary && (
            <p className="text-[12px] italic text-muted-foreground">{summary}</p>
          )}
          <span
            className={cn(
              'ml-auto flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              STATUS_STYLES[status as LldStatus] ?? STATUS_STYLES.draft,
            )}
          >
            {STATUS_LABELS[status as LldStatus] ?? status}
          </span>
        </div>
        {content ? (
          <MarkdownLines content={content} />
        ) : (
          <p className="text-[12px] italic text-muted-foreground">
            No content yet.
          </p>
        )}
      </WidgetPreviewCard>
    );
  }

  return (
    <div className="py-3">
      {/* Title row */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/60">›</span>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={onExitWidget ? handleTitleKeyDown : undefined}
          placeholder="Component name..."
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent text-[18px] font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
        />
        <select
          value={status}
          onChange={handleStatusChange}
          className={cn(
            'flex-shrink-0 cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide outline-none',
            STATUS_STYLES[status as LldStatus] ?? STATUS_STYLES.draft,
          )}
        >
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="final">Final</option>
        </select>
      </div>

      {/* Summary */}
      <input
        type="text"
        value={summary ?? ''}
        onChange={handleSummaryChange}
        placeholder="One-line purpose description..."
        className="mt-1 w-full bg-transparent text-[13px] italic text-muted-foreground outline-none placeholder:text-muted-foreground/30"
      />

      <div className="my-2 border-t border-border/30" />

      {/* Content */}
      <textarea
        ref={contentRef}
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleContentKeyDown}
        placeholder="Describe design, interfaces, data flows..."
        rows={8}
        className="w-full resize-none bg-transparent px-0 py-1 text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
      />
    </div>
  );
}
