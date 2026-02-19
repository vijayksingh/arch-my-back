import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Check from 'lucide-react/dist/esm/icons/check';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WorkspaceSwitcherProps {
  currentWorkspaceId: Id<'workspaces'> | null;
  onWorkspaceChange: (workspaceId: Id<'workspaces'>) => void;
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
  onWorkspaceChange,
}: WorkspaceSwitcherProps) {
  const workspaces = useQuery(api.workspaces.getWorkspaces);
  const createWorkspace = useMutation(api.workspaces.createWorkspace);
  const deleteWorkspace = useMutation(api.workspaces.deleteWorkspace);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceTitle, setNewWorkspaceTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{
    id: Id<'workspaces'>;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentWorkspace = workspaces?.find((w) => w._id === currentWorkspaceId);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceTitle.trim()) return;

    setIsCreating(true);
    try {
      const workspaceId = await createWorkspace({ title: newWorkspaceTitle.trim() });
      setIsCreateDialogOpen(false);
      setNewWorkspaceTitle('');
      onWorkspaceChange(workspaceId);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    setIsDeleting(true);
    try {
      await deleteWorkspace({ workspaceId: workspaceToDelete.id });
      setIsDeleteDialogOpen(false);
      setWorkspaceToDelete(null);

      // Switch to another workspace if we deleted the current one
      if (currentWorkspaceId === workspaceToDelete.id && workspaces && workspaces.length > 1) {
        const nextWorkspace = workspaces.find((w) => w._id !== workspaceToDelete.id);
        if (nextWorkspace) {
          onWorkspaceChange(nextWorkspace._id);
        }
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (id: Id<'workspaces'>, title: string) => {
    setWorkspaceToDelete({ id, title });
    setIsDeleteDialogOpen(true);
  };

  if (!workspaces) {
    return (
      <div className="flex h-8 items-center rounded-md border border-border/60 bg-background/70 px-3 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 gap-2 rounded-md border border-border/60 bg-background/70 px-3 text-sm font-medium text-foreground/85 hover:bg-background/90 hover:text-foreground"
          >
            <span className="max-w-[200px] truncate">
              {currentWorkspace?.title || 'Select Workspace'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Workspaces
          </div>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace._id}
              onClick={() => onWorkspaceChange(workspace._id)}
              className="flex items-center justify-between"
            >
              <span className="flex-1 truncate">{workspace.title}</span>
              <div className="flex items-center gap-2">
                {workspace._id === currentWorkspaceId && (
                  <Check className="h-4 w-4 text-foreground" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialog(workspace._id, workspace.title);
                  }}
                  className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${workspace.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2 text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>New Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Workspace Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Workspace name"
              value={newWorkspaceTitle}
              onChange={(e) => setNewWorkspaceTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  handleCreateWorkspace();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceTitle.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workspaceToDelete?.title}"? This action cannot be
              undone and will permanently delete all designs and content in this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
