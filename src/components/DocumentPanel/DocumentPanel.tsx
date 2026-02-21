import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/stores/documentStore';
import { useEditorStore } from '@/stores/editorStore';
import { addBlockWithSectionCoordination } from '@/actions/designActions';
import type { NotebookBlockType } from '@/types';
import { NotebookBlockComponent } from './NotebookBlock';

export function DocumentPanel() {
  const blocks = useDocumentStore((s) => s.blocks);
  const pendingFocusBlockId = useDocumentStore((s) => s.pendingFocusBlockId);
  const clearPendingFocusBlock = useDocumentStore((s) => s.clearPendingFocusBlock);
  const editorMode = useEditorStore((s) => s.documentEditorMode);
  const setEditorMode = useEditorStore((s) => s.setDocumentEditorMode);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(
    null,
  );
  const [newBlockId, setNewBlockId] = useState<string | null>(null);

  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isPreview = editorMode === 'preview';

  const visibleBlocks = isPreview
    ? blocks.filter((b) => !(b.type === 'text' && (b.data as { markdown: string }).markdown.trim() === ''))
    : blocks;

  // Wrapped addBlock that tracks the newly added block for auto-focus
  // Uses coordinated action to create section + badge for non-text blocks
  const addBlock = useCallback(
    (type: NotebookBlockType, atIndex?: number) => {
      const block = addBlockWithSectionCoordination(type as any, atIndex);
      setNewBlockId(block.id);
      return block;
    },
    [],
  );

  // Clear newBlockId after one render cycle (enough for autoFocus to fire)
  useEffect(() => {
    if (!newBlockId) return;
    const timer = setTimeout(() => setNewBlockId(null), 350);
    return () => clearTimeout(timer);
  }, [newBlockId]);

  // Scroll newly added block into view
  useEffect(() => {
    if (!newBlockId) return;
    const el = blockRefs.current.get(newBlockId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [newBlockId]);

  // Handle pending focus from canvas badge node click
  // Note: viewMode switch is handled in SectionBadgeNode before requestFocusBlock is called.
  // Do NOT include viewMode/setViewMode here — they would cause the effect to re-run after
  // the view switch, canceling the highlight timer and leaving the ring stuck permanently.
  useEffect(() => {
    if (!pendingFocusBlockId) return;

    const el = blockRefs.current.get(pendingFocusBlockId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    setHighlightedBlockId(pendingFocusBlockId);
    clearPendingFocusBlock();

    const timer = setTimeout(() => setHighlightedBlockId(null), 1500);
    return () => clearTimeout(timer);
  }, [pendingFocusBlockId, clearPendingFocusBlock]);

  // Continuation zone click: focus last text block, or append a new text block
  const handleContinuationClick = useCallback(() => {
    if (isPreview) return;
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock?.type === 'text') {
      const el = blockRefs.current.get(lastBlock.id);
      if (el) {
        const textarea = el.querySelector('textarea');
        textarea?.focus();
      }
    } else {
      addBlock('text');
    }
  }, [blocks, isPreview, addBlock]);

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b ui-border-ghost px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Notebook
          </span>
          <div className="h-4 w-px bg-border/70" />
          <span className="truncate text-xs text-muted-foreground">
            {blocks.length} block{blocks.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center rounded-md border ui-border-ghost bg-card/70 p-0.5">
          <button
            type="button"
            onClick={() => setEditorMode('edit')}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-medium transition-colors',
              editorMode === 'edit'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setEditorMode('preview')}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-medium transition-colors',
              editorMode === 'preview'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Block list */}
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
        <div className="flex flex-col gap-2">
          {visibleBlocks.map((block, index) => (
            <div
              key={block.id}
              ref={(el) => {
                if (el) {
                  blockRefs.current.set(block.id, el);
                } else {
                  blockRefs.current.delete(block.id);
                }
              }}
              className={cn(newBlockId === block.id ? 'animate-block-enter motion-reduce:animate-none' : undefined)}
              style={newBlockId === block.id ? { willChange: 'opacity, transform' } : undefined}
            >
              <NotebookBlockComponent
                block={block as any}
                index={index}
                isPreview={isPreview}
                isHighlighted={highlightedBlockId === block.id}
                autoFocus={newBlockId === block.id}
                addBlock={addBlock as any}
              />
            </div>
          ))}

          {/* Continuation zone — click to focus last text block or add new one */}
          {!isPreview && (
            <div
              className="min-h-[80px] cursor-text"
              onClick={handleContinuationClick}
            />
          )}
        </div>
      </div>
    </section>
  );
}
