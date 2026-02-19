import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { DesignId } from "@/types/design";
import {
  hasOldLocalStorageData,
  migrateLocalStorageToConvex,
} from "@/lib/migration";

const STORAGE_KEY = "current_design_id";

/**
 * Hook to get or create the current user's design
 * Persists design selection in localStorage and supports switching
 * Replaces useCurrentWorkspace
 */
export function useCurrentDesign() {
  const [designId, setDesignId] = useState<DesignId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const migrationAttempted = useRef(false);

  // Note: Using old workspace functions for now until migration to new designs table
  const workspaces = useQuery(api.workspaces.getWorkspaces);
  const createWorkspace = useMutation(api.workspaces.createWorkspace);
  const saveDesign = useMutation(api.designs.saveDesign);
  const createBlocks = useMutation(api.blocks.createBlocks);

  // Use refs to stabilize mutation functions (prevent infinite loops)
  const createWorkspaceRef = useRef(createWorkspace);
  const saveDesignRef = useRef(saveDesign);
  const createBlocksRef = useRef(createBlocks);
  useEffect(() => {
    createWorkspaceRef.current = createWorkspace;
  }, [createWorkspace]);
  useEffect(() => {
    saveDesignRef.current = saveDesign;
  }, [saveDesign]);
  useEffect(() => {
    createBlocksRef.current = createBlocks;
  }, [createBlocks]);

  useEffect(() => {
    if (workspaces === undefined) return; // Still loading

    // Check for authentication error
    if (workspaces === null) {
      setError("Not authenticated");
      return;
    }

    if (workspaces.length > 0) {
      // Try to restore from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Check if saved workspace still exists
        const exists = workspaces.some((w) => w._id === saved);
        if (exists) {
          setDesignId(saved as DesignId);
          return;
        }
      }

      // Fall back to first workspace
      setDesignId(workspaces[0]._id as DesignId);
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
          async (args) => createBlocksRef.current(args as any)
        )
          .then((result) => {
            setIsMigrating(false);
            if (result.success && result.workspaceId) {
              setDesignId(result.workspaceId as DesignId);
              localStorage.setItem(STORAGE_KEY, result.workspaceId);
              console.log("Migration successful:", result);
            } else {
              console.error("Migration failed:", result.error);
              // Fall through to create default workspace
              createDefaultWorkspace();
            }
          })
          .catch((err) => {
            console.error("Migration error:", err);
            setIsMigrating(false);
            createDefaultWorkspace();
          });
      } else {
        // No migration needed, create default workspace
        createDefaultWorkspace();
      }
    }

    function createDefaultWorkspace() {
      createWorkspaceRef
        .current({
          title: "My Workspace",
          viewMode: "both",
          activeCanvasTool: "cursor",
          documentEditorMode: "edit",
        })
        .then((id) => {
          setDesignId(id as DesignId);
          localStorage.setItem(STORAGE_KEY, id);
        })
        .catch((err) => {
          console.error("Failed to create workspace:", err);
          setError(err.message || "Failed to create workspace");
        });
    }
  }, [workspaces]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeDesign = useCallback((newDesignId: DesignId) => {
    setDesignId(newDesignId);
    localStorage.setItem(STORAGE_KEY, newDesignId);
  }, []);

  return {
    designId,
    changeDesign,
    isLoading: workspaces === undefined || isMigrating,
    error,
  };
}
