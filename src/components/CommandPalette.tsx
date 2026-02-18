import { useCallback, useEffect } from 'react';
import { Command } from 'cmdk';
import type { CanvasTool } from '@/types';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const setActiveCanvasTool = useWorkspaceStore((s) => s.setActiveCanvasTool);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const cycleViewMode = useWorkspaceStore((s) => s.cycleViewMode);
  const toggleDocumentEditorMode = useWorkspaceStore((s) => s.toggleDocumentEditorMode);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      onClose();
    },
    [onClose],
  );

  if (!open) return null;

  const toolItems: { label: string; shortcut: string; tool: CanvasTool }[] = [
    { label: 'Cursor tool', shortcut: 'V', tool: 'cursor' },
    { label: 'Select tool', shortcut: 'S', tool: 'select' },
    { label: 'Rectangle tool', shortcut: 'R', tool: 'rectangle' },
    { label: 'Circle tool', shortcut: 'C', tool: 'circle' },
    { label: 'Text tool', shortcut: 'T', tool: 'text' },
  ];

  const viewItems: { label: string; shortcut?: string; fn: () => void }[] = [
    { label: 'View: Document only', fn: () => setViewMode('document') },
    { label: 'View: Both', fn: () => setViewMode('both') },
    { label: 'View: Canvas only', fn: () => setViewMode('canvas') },
    { label: 'Cycle view', shortcut: '⌘/Ctrl+\\', fn: cycleViewMode },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto mt-[18vh] w-[480px] rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden">
        <Command
          loop
          className="[&_[cmdk-group-heading]]:select-none [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          <Command.Input
            autoFocus
            placeholder="Type a command or search..."
            className="w-full border-b border-border/40 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-[320px] overflow-y-auto py-2">
            <Command.Empty className="px-4 py-6 text-sm text-center text-muted-foreground">
              No commands found.
            </Command.Empty>

            <Command.Group heading="Tools">
              {toolItems.map(({ label, shortcut, tool }) => (
                <Command.Item
                  key={tool}
                  value={label}
                  onSelect={() => run(() => setActiveCanvasTool(tool))}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 mx-1 text-sm transition-colors aria-selected:bg-accent/40"
                >
                  <span>{label}</span>
                  <kbd className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {shortcut}
                  </kbd>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="View">
              {viewItems.map(({ label, shortcut, fn }) => (
                <Command.Item
                  key={label}
                  value={label}
                  onSelect={() => run(fn)}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 mx-1 text-sm transition-colors aria-selected:bg-accent/40"
                >
                  <span>{label}</span>
                  {shortcut && (
                    <kbd className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Editor">
              <Command.Item
                value="Toggle Edit / Preview"
                onSelect={() => run(toggleDocumentEditorMode)}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 mx-1 text-sm transition-colors aria-selected:bg-accent/40"
              >
                <span>Toggle Edit / Preview</span>
                <kbd className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ⌘/Ctrl+Shift+P
                </kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
