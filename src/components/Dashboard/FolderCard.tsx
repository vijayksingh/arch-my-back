import { useNavigate } from '@tanstack/react-router';
import { Folder, FolderOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useDroppable } from '@dnd-kit/core';

interface FolderCardProps {
  folder: Doc<'folders'>;
  designCount?: number;
}

export function FolderCard({ folder, designCount = 0 }: FolderCardProps) {
  const navigate = useNavigate();
  const renameFolder = useMutation(api.folders.rename);
  const deleteFolder = useMutation(api.folders.remove);

  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Make card droppable
  const { setNodeRef, isOver } = useDroppable({
    id: folder._id,
    data: { type: 'folder', folder },
  });

  // Focus input when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleClick = () => {
    if (!isRenaming) {
      navigate({ to: '/folder/$folderId', params: { folderId: folder._id } });
    }
  };

  const handleStartRename = () => {
    setRenameValue(folder.title);
    setIsRenaming(true);
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

  const FolderIcon = isHovered ? FolderOpen : Folder;

  return (
    <>
      <Card
        ref={setNodeRef}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex flex-col items-start border-2 border-dashed p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
          isOver
            ? 'border-primary bg-primary/[0.04] scale-[1.02] shadow-lg'
            : 'border-border hover:border-border/60'
        }`}
      >
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Large folder icon with warm accent background */}
            <div className="flex-shrink-0 rounded-xl bg-warning-muted p-2.5">
              <FolderIcon className="h-7 w-7 text-warning" />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              {isRenaming ? (
                <Input
                  ref={inputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleSaveRename}
                  onKeyDown={handleRenameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 text-sm font-semibold"
                />
              ) : (
                <h3 className="text-sm font-semibold text-foreground truncate mb-2">
                  {folder.title}
                </h3>
              )}

              {/* Design count badge */}
              <div className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {designCount} {designCount === 1 ? 'design' : 'designs'}
              </div>
            </div>
          </div>

          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg p-1.5 opacity-0 transition-all hover:bg-accent group-hover:opacity-100 focus:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleStartRename}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{folder.title}"? Designs in this folder will be moved to the root level.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
