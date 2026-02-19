import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

const STORAGE_KEY = 'current_workspace_id';

/**
 * Hook to get or create the current user's workspace
 * Persists workspace selection in localStorage and supports switching
 */
export function useCurrentWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<Id<'workspaces'> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workspaces = useQuery(api.workspaces.getWorkspaces);
  const createWorkspace = useMutation(api.workspaces.createWorkspace);

  useEffect(() => {
    if (workspaces === undefined) return; // Still loading

    // Check for authentication error
    if (workspaces === null) {
      setError('Not authenticated');
      return;
    }

    if (workspaces.length > 0) {
      // Try to restore from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Check if saved workspace still exists
        const exists = workspaces.some((w) => w._id === saved);
        if (exists) {
          setWorkspaceId(saved as Id<'workspaces'>);
          return;
        }
      }

      // Fall back to first workspace
      setWorkspaceId(workspaces[0]._id);
      localStorage.setItem(STORAGE_KEY, workspaces[0]._id);
    } else {
      // Create default workspace
      createWorkspace({
        title: 'My Workspace',
        viewMode: 'both',
        activeCanvasTool: 'cursor',
        documentEditorMode: 'edit',
      })
        .then((id) => {
          setWorkspaceId(id);
          localStorage.setItem(STORAGE_KEY, id);
        })
        .catch((err) => {
          console.error('Failed to create workspace:', err);
          setError(err.message || 'Failed to create workspace');
        });
    }
  }, [workspaces, createWorkspace]);

  const changeWorkspace = useCallback((newWorkspaceId: Id<'workspaces'>) => {
    setWorkspaceId(newWorkspaceId);
    localStorage.setItem(STORAGE_KEY, newWorkspaceId);
  }, []);

  return {
    workspaceId,
    changeWorkspace,
    isLoading: workspaces === undefined,
    error,
  };
}
