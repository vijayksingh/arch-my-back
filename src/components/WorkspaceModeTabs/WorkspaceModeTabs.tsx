import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { WorkspaceViewMode } from '@/types';

const viewModes: { id: WorkspaceViewMode; label: string }[] = [
  { id: 'document', label: 'Document' },
  { id: 'both', label: 'Both' },
  { id: 'canvas', label: 'Canvas' },
];

export function WorkspaceModeTabs() {
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);

  return (
    <div className="flex items-center rounded-lg border ui-border-ghost bg-background/70 p-0.5 shadow-sm">
      {viewModes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => setViewMode(mode.id)}
          className={cn(
            'h-6 rounded-md px-2.5 text-[11px] font-medium transition-colors',
            viewMode === mode.id
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

