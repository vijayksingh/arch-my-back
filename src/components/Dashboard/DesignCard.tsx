import { useNavigate } from '@tanstack/react-router';
import { MoreVertical, FolderInput, Copy, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';

interface DesignCardProps {
  design: Doc<'newDesigns'>;
}

export function DesignCard({ design }: DesignCardProps) {
  const navigate = useNavigate();
  const folders = useQuery(api.folders.list);
  const moveToFolder = useMutation(api.newDesigns.moveToFolder);
  const duplicateDesign = useMutation(api.newDesigns.duplicate);
  const deleteDesign = useMutation(api.newDesigns.remove);

  const [showMenu, setShowMenu] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleClick = () => {
    navigate({ to: '/design/$designId', params: { designId: design._id } });
  };

  const handleMove = async (folderId: Id<'folders'> | null) => {
    try {
      await moveToFolder({ designId: design._id, folderId });
      setShowMoveDialog(false);
    } catch (error) {
      console.error('Failed to move design:', error);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newDesignId = await duplicateDesign({ designId: design._id });
      // Optionally navigate to the new design
      navigate({ to: '/design/$designId', params: { designId: newDesignId } });
    } catch (error) {
      console.error('Failed to duplicate design:', error);
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    try {
      await deleteDesign({ designId: design._id });
    } catch (error) {
      console.error('Failed to delete design:', error);
    }
  };

  const lastUpdated = new Date(design.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div
        onClick={handleClick}
        className="group relative flex flex-col items-start rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-accent hover:shadow-md cursor-pointer"
      >
        <div className="mb-2 flex w-full items-start justify-between gap-2">
          <h3 className="flex-1 text-lg font-semibold text-foreground group-hover:text-accent">
            {design.title}
          </h3>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded p-1 opacity-0 transition-all hover:bg-accent/10 group-hover:opacity-100 focus:opacity-100"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-border bg-background shadow-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoveDialog(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
                >
                  <FolderInput className="h-4 w-4" />
                  Move to folder
                </button>
                <button
                  onClick={handleDuplicate}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-b-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {design.description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {design.description}
          </p>
        )}
        <div className="mt-auto text-xs text-muted-foreground">
          Updated {lastUpdated}
        </div>
      </div>

      {/* Move to folder dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Move to Folder</h2>
            <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
              <button
                onClick={() => handleMove(null)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/10"
              >
                📁 Root (No folder)
              </button>
              {folders?.map((folder) => (
                <button
                  key={folder._id}
                  onClick={() => handleMove(folder._id)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/10"
                >
                  📁 {folder.title}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowMoveDialog(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Delete Design</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Are you sure you want to delete "{design.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
