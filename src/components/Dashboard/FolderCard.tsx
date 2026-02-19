import { useNavigate } from '@tanstack/react-router';
import { FolderIcon, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';

interface FolderCardProps {
  folder: Doc<'folders'>;
  designCount?: number;
}

export function FolderCard({ folder, designCount = 0 }: FolderCardProps) {
  const navigate = useNavigate();
  const renameFolder = useMutation(api.folders.rename);
  const deleteFolder = useMutation(api.folders.remove);

  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus input when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

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
    if (!isRenaming) {
      navigate({ to: '/folder/$folderId', params: { folderId: folder._id } });
    }
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(folder.title);
    setIsRenaming(true);
    setShowMenu(false);
  };

  const handleSaveRename = async () => {
    if (!renameValue.trim() || renameValue.trim() === folder.title) {
      setIsRenaming(false);
      return;
    }

    try {
      await renameFolder({ folderId: folder._id, title: renameValue.trim() });
      setIsRenaming(false);
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFolder({ folderId: folder._id });
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="group relative flex flex-col items-start rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-accent hover:shadow-md cursor-pointer"
      >
        <div className="mb-3 flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FolderIcon className="h-5 w-5 text-muted-foreground group-hover:text-accent flex-shrink-0" />
            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleRenameKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 rounded border border-accent bg-background px-2 py-1 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            ) : (
              <h3 className="text-lg font-semibold text-foreground group-hover:text-accent truncate">
                {folder.title}
              </h3>
            )}
          </div>
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
              <div className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-border bg-background shadow-lg">
                <button
                  onClick={handleStartRename}
                  className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
                >
                  <Edit2 className="h-4 w-4" />
                  Rename
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
        <div className="text-sm text-muted-foreground">
          {designCount} {designCount === 1 ? 'design' : 'designs'}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Delete Folder</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Are you sure you want to delete "{folder.title}"? Designs in this folder will be moved to the root level.
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
