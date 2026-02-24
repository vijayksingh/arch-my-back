import { useNavigate } from '@tanstack/react-router';
import { MoreVertical, FolderInput, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDraggable } from '@dnd-kit/core';

interface DesignCardProps {
  design: Doc<'newDesigns'>;
}

// Hash string to deterministic number for gradient selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Subtle gradient presets for preview area
const gradients = [
  'bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10',
  'bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10',
  'bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10',
  'bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-blue-500/10',
  'bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-fuchsia-500/10',
  'bg-gradient-to-br from-slate-500/10 via-gray-500/10 to-zinc-500/10',
];

// Card variant for grid layout (used in dashboard)
export function DesignListItem({ design }: DesignCardProps) {
  const navigate = useNavigate();
  const folders = useQuery(api.folders.list);
  const moveToFolder = useMutation(api.newDesigns.moveToFolder);
  const duplicateDesign = useMutation(api.newDesigns.duplicate);
  const deleteDesign = useMutation(api.newDesigns.remove);

  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Make card draggable
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: design._id,
    data: { type: 'design', design },
  });

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

  const handleDuplicate = async () => {
    try {
      const newDesignId = await duplicateDesign({ designId: design._id });
      navigate({ to: '/design/$designId', params: { designId: newDesignId } });
    } catch (error) {
      console.error('Failed to duplicate design:', error);
    }
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

  // Select gradient based on title hash
  const gradientClass = gradients[hashString(design.title) % gradients.length];

  return (
    <>
      <div
        ref={setNodeRef}
        className={`group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-border/60 hover:shadow-md cursor-pointer ${
          isDragging ? 'opacity-40' : ''
        }`}
      >
        {/* Preview Area - also the drag handle */}
        <div
          onClick={handleClick}
          {...attributes}
          {...listeners}
          className={`aspect-[16/10] w-full ${gradientClass} relative overflow-hidden`}
        >
          {/* Grid dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />
          {/* Future: thumbnailStorageId will render actual thumbnail here */}
        </div>

        {/* Content Area */}
        <div onClick={handleClick} className="flex flex-col gap-1.5 p-4">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {design.title}
          </h3>
          {design.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {design.description}
            </p>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            Updated {lastUpdated}
          </div>
        </div>

        {/* Three-dot Menu (visible on hover) */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 bg-card/90 backdrop-blur-sm hover:bg-card shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                <FolderInput className="mr-2 h-4 w-4" />
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Move to folder dialog */}
      {showMoveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowMoveDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-foreground">Move to Folder</h2>
            <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
              <button
                onClick={() => handleMove(null)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/70"
              >
                📁 Root (No folder)
              </button>
              {folders?.map((folder) => (
                <button
                  key={folder._id}
                  onClick={() => handleMove(folder._id)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/70"
                >
                  📁 {folder.title}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowMoveDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{design.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DesignCard({ design }: DesignCardProps) {
  const navigate = useNavigate();
  const folders = useQuery(api.folders.list);
  const moveToFolder = useMutation(api.newDesigns.moveToFolder);
  const duplicateDesign = useMutation(api.newDesigns.duplicate);
  const deleteDesign = useMutation(api.newDesigns.remove);

  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Make card draggable
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: design._id,
    data: { type: 'design', design },
  });

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

  const handleDuplicate = async () => {
    try {
      const newDesignId = await duplicateDesign({ designId: design._id });
      navigate({ to: '/design/$designId', params: { designId: newDesignId } });
    } catch (error) {
      console.error('Failed to duplicate design:', error);
    }
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

  // Select gradient based on title hash
  const gradientClass = gradients[hashString(design.title) % gradients.length];

  return (
    <>
      <div
        ref={setNodeRef}
        className={`group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md cursor-pointer ${
          isDragging ? 'opacity-40' : ''
        }`}
      >
        {/* Preview Area - also the drag handle */}
        <div
          onClick={handleClick}
          {...attributes}
          {...listeners}
          className={`aspect-[16/10] w-full ${gradientClass} relative`}
        >
          {/* Grid dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />
          {/* Future: thumbnailStorageId will render actual thumbnail here */}
        </div>

        {/* Content Area */}
        <div onClick={handleClick} className="flex flex-col gap-1 p-3">
          <h3 className="text-sm font-medium text-foreground truncate">
            {design.title}
          </h3>
          {design.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {design.description}
            </p>
          )}
          <div className="text-xs text-muted-foreground">
            Updated {lastUpdated}
          </div>
        </div>

        {/* Three-dot Menu (visible on hover) */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 bg-card/80 backdrop-blur-sm hover:bg-card"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                <FolderInput className="mr-2 h-4 w-4" />
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Move to folder dialog (custom, not AlertDialog since it's a selection) */}
      {showMoveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowMoveDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-foreground">Move to Folder</h2>
            <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
              <button
                onClick={() => handleMove(null)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/70"
              >
                📁 Root (No folder)
              </button>
              {folders?.map((folder) => (
                <button
                  key={folder._id}
                  onClick={() => handleMove(folder._id)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/70"
                >
                  📁 {folder.title}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowMoveDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog using shadcn AlertDialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{design.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
