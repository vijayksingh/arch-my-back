import { useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface SectionBadgeProps {
  sectionId: string;
  label: string;
}

export function SectionBadge({ sectionId, label }: SectionBadgeProps) {
  const requestFocusSection = useWorkspaceStore((s) => s.requestFocusSection);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);

  const handleClick = useCallback(() => {
    if (viewMode === 'document') {
      setViewMode('both');
    }
    requestFocusSection(sectionId);
  }, [sectionId, requestFocusSection, viewMode, setViewMode]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 rounded-md border border-accent/50 bg-accent/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
      title="View on canvas"
    >
      <ExternalLink className="h-2.5 w-2.5" />
      {label}
    </button>
  );
}
