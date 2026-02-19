import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { hasOldLocalStorageData, migrateLocalStorageToConvex } from '@/lib/migration';

const STORAGE_KEY = 'current_workspace_id';

/**
 * Hook to get or create the current user's workspace
 * Persists workspace selection in localStorage and supports switching
 */
export function useCurrentWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<Id<'workspaces'> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const migrationAttempted = useRef(false);

  const workspaces = useQuery(api.workspaces.getWorkspaces);
  const createWorkspace = useMutation(api.workspaces.createWorkspace);
  const saveDesign = useMutation(api.designs.saveDesign);
  const createBlocks = useMutation(api.blocks.createBlocks);

  // Use refs to stabilize mutation functions (prevent infinite loops)
  const createWorkspaceRef = useRef(createWorkspace);
  const saveDesignRef = useRef(saveDesign);
  const createBlocksRef = useRef(createBlocks);
  useEffect(() => { createWorkspaceRef.current = createWorkspace; }, [createWorkspace]);
  useEffect(() => { saveDesignRef.current = saveDesign; }, [saveDesign]);
  useEffect(() => { createBlocksRef.current = createBlocks; }, [createBlocks]);

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
      // No workspaces exist - check if we need to migrate old data
      if (!migrationAttempted.current && hasOldLocalStorageData()) {
        migrationAttempted.current = true;
        setIsMigrating(true);

        // Run migration with adapter functions
        migrateLocalStorageToConvex(
          async (args) => createWorkspaceRef.current(args),
          async (args) => saveDesignRef.current(args as any),
          async (args) => createBlocksRef.current(args as any),
        )
          .then((result) => {
            setIsMigrating(false);
            if (result.success && result.workspaceId) {
              setWorkspaceId(result.workspaceId as Id<'workspaces'>);
              localStorage.setItem(STORAGE_KEY, result.workspaceId);
              console.log('Migration successful:', result);
            } else {
              console.error('Migration failed:', result.error);
              // Fall through to create default workspace
              createDefaultWorkspace();
            }
          })
          .catch((err) => {
            console.error('Migration error:', err);
            setIsMigrating(false);
            createDefaultWorkspace();
          });
      } else {
        // No migration needed, create default workspace
        createDefaultWorkspace();
      }
    }

    function createDefaultWorkspace() {
      createWorkspaceRef.current({
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
  }, [workspaces]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeWorkspace = useCallback((newWorkspaceId: Id<'workspaces'>) => {
    setWorkspaceId(newWorkspaceId);
    localStorage.setItem(STORAGE_KEY, newWorkspaceId);
  }, []);

  return {
    workspaceId,
    changeWorkspace,
    isLoading: workspaces === undefined || isMigrating,
    error,
  };
}
