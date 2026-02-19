import { useCallback, useEffect, useRef, useState } from 'react';
import { ListChecks, Minus, Plus } from 'lucide-react';
import type { NotebookBlock, RequirementItem } from '@/types';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { WidgetPreviewCard } from './WidgetPreviewCard';
import { useDoubleEnterExit } from './useDoubleEnterExit';

interface RequirementsWidgetProps {
  block: Extract<NotebookBlock, { type: 'requirements' }>;
  isPreview: boolean;
  autoFocus?: boolean;
  onExitWidget?: () => void;
}

export function RequirementsWidget({
  block,
  isPreview,
  autoFocus,
  onExitWidget,
}: RequirementsWidgetProps) {
  const updateBlockData = useWorkspaceStore((s) => s.updateBlockData);
  const items = block.data.items;
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  const functional = items.filter((i) => i.kind === 'functional');
  const nonFunctional = items.filter((i) => i.kind === 'non-functional');

  useEffect(() => {
    if (!pendingFocusId) return;
    const el = inputRefs.current[pendingFocusId];
    if (el) {
      el.focus();
      setPendingFocusId(null);
    }
  }, [pendingFocusId]);

  const addItem = useCallback(
    (kind: 'functional' | 'non-functional') => {
      const newItem: RequirementItem = {
        id: `req_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        text: '',
        kind,
      };
      updateBlockData(block.id, { items: [...items, newItem] });
      setPendingFocusId(newItem.id);
    },
    [block.id, items, updateBlockData],
  );

  const updateItem = useCallback(
    (id: string, text: string) => {
      updateBlockData(block.id, {
        items: items.map((i) => (i.id === id ? { ...i, text } : i)),
      });
    },
    [block.id, items, updateBlockData],
  );

  const removeItem = useCallback(
    (id: string) => {
      updateBlockData(block.id, {
        items: items.filter((i) => i.id !== id),
      });
    },
    [block.id, items, updateBlockData],
  );

  const handleDoubleEnter = useDoubleEnterExit(onExitWidget ?? (() => {}));

  if (isPreview) {
    return (
      <WidgetPreviewCard icon={ListChecks} title="Requirements">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Functional
            </div>
            {functional.length === 0 ? (
              <p className="text-[12px] italic text-muted-foreground">None</p>
            ) : (
              <ul className="space-y-1">
                {functional.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-1 text-[12px] text-foreground/90"
                  >
                    <span className="mt-0.5 text-muted-foreground">—</span>
                    <span>{item.text || '(empty)'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Non-Functional
            </div>
            {nonFunctional.length === 0 ? (
              <p className="text-[12px] italic text-muted-foreground">None</p>
            ) : (
              <ul className="space-y-1">
                {nonFunctional.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-1 text-[12px] text-foreground/90"
                  >
                    <span className="mt-0.5 text-muted-foreground">—</span>
                    <span>{item.text || '(empty)'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </WidgetPreviewCard>
    );
  }

  return (
    <div className="py-3" onKeyDown={onExitWidget ? handleDoubleEnter : undefined}>
      <div className="mb-2 flex items-center gap-1.5">
        <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Requirements
        </span>
      </div>
      <div className="flex flex-col gap-1 rounded-md bg-muted/5 px-2 py-2">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span
              className={
                item.kind === 'functional'
                  ? 'flex-shrink-0 rounded px-1 text-[9px] font-bold bg-blue-500/15 text-blue-400'
                  : 'flex-shrink-0 rounded px-1 text-[9px] font-bold bg-violet-500/15 text-violet-400'
              }
            >
              {item.kind === 'functional' ? 'F' : 'NF'}
            </span>
            <input
              ref={(el) => {
                if (el) inputRefs.current[item.id] = el;
                else delete inputRefs.current[item.id];
              }}
              type="text"
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              placeholder="Add requirement..."
              autoFocus={autoFocus && idx === 0}
              className="min-w-0 flex-1 rounded bg-transparent px-1.5 py-1 text-[12px] text-foreground outline-none transition-colors hover:bg-muted/20 focus:bg-card/40 placeholder:text-muted-foreground/40"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="flex-shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
            >
              <Minus className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => addItem('functional')}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Add Functional
          </button>
          <button
            type="button"
            onClick={() => addItem('non-functional')}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Add Non-Functional
          </button>
        </div>
      </div>
    </div>
  );
}
