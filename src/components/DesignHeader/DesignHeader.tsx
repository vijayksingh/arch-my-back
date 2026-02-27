import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { ChevronRight, Home } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface DesignHeaderProps {
  designId: Id<'newDesigns'>;
}

export function DesignHeader({ designId }: DesignHeaderProps) {
  const navigate = useNavigate();
  const design = useQuery(api.newDesigns.get, { designId });
  const updateTitle = useMutation(api.newDesigns.update);
  const folder = useQuery(
    api.folders.list,
    design?.folderId ? {} : 'skip'
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentFolder = folder?.find((f) => f._id === design?.folderId);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (design) {
      setEditValue(design.title);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!design || !editValue.trim()) {
      setIsEditing(false);
      return;
    }

    if (editValue.trim() !== design.title) {
      try {
        await updateTitle({ designId, title: editValue.trim() });
      } catch (error) {
        console.error('Failed to update title:', error);
      }
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (!design) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        {/* Home link */}
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </button>

      {/* Folder breadcrumb (if in folder) */}
      {currentFolder && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() =>
              navigate({
                to: '/folder/$folderId',
                params: { folderId: currentFolder._id },
              })
            }
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {currentFolder.title}
          </button>
        </>
      )}

        {/* Design title (editable) */}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="rounded border border-accent bg-background px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-accent"
          />
        ) : (
          <button
            onClick={handleStartEdit}
            className="rounded px-2 py-1 font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            {design.title}
          </button>
        )}
      </div>

      {/* Share button */}
      <ShareButton designId={designId} />
    </div>
  );
}
