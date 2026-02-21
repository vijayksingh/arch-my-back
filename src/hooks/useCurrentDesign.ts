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
 * Manages which design is currently open
 */
export function useCurrentDesign() {
  const [designId, setDesignId] = useState<DesignId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const migrationAttempted = useRef(false);

  // Query and mutations for new designs table
  const designs = useQuery(api.newDesigns.list);
  const createDesign = useMutation(api.newDesigns.create);
  const saveCanvas = useMutation(api.designCanvases.save);
  const saveBlocks = useMutation(api.designBlocks.save);

  // Use refs to stabilize mutation functions (prevent infinite loops)
  const createDesignRef = useRef(createDesign);
  const saveCanvasRef = useRef(saveCanvas);
  const saveBlocksRef = useRef(saveBlocks);
  useEffect(() => {
    createDesignRef.current = createDesign;
  }, [createDesign]);
  useEffect(() => {
    saveCanvasRef.current = saveCanvas;
  }, [saveCanvas]);
  useEffect(() => {
    saveBlocksRef.current = saveBlocks;
  }, [saveBlocks]);

  useEffect(() => {
    if (designs === undefined) return; // Still loading

    // Check for authentication error
    if (designs === null) {
      setError("Not authenticated");
      return;
    }

    if (designs.length > 0) {
      // Try to restore from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Check if saved design still exists
        const exists = designs.some((d) => d._id === saved);
        if (exists) {
          setDesignId(saved as DesignId);
          return;
        }
      }

      // Fall back to first design
      setDesignId(designs[0]._id as DesignId);
      localStorage.setItem(STORAGE_KEY, designs[0]._id);
    } else {
      // No designs exist - check if we need to migrate old data
      if (!migrationAttempted.current && hasOldLocalStorageData()) {
        migrationAttempted.current = true;
        setIsMigrating(true);

        // Run migration with adapter functions
        migrateLocalStorageToConvex(
          async (args) => createDesignRef.current(args) as any,
          async (args) => saveCanvasRef.current(args as any),
          async (args) => saveBlocksRef.current(args as any)
        )
          .then((result) => {
            setIsMigrating(false);
            if (result.success && result.workspaceId) {
              setDesignId(result.workspaceId as DesignId);
              localStorage.setItem(STORAGE_KEY, result.workspaceId);
              console.log("Migration successful:", result);
            } else {
              console.error("Migration failed:", result.error);
              // Fall through to create default design
              createDefaultDesign();
            }
          })
          .catch((err) => {
            console.error("Migration error:", err);
            setIsMigrating(false);
            createDefaultDesign();
          });
      } else {
        // No migration needed, create default design
        createDefaultDesign();
      }
    }

    function createDefaultDesign() {
      createDesignRef
        .current({
          title: "My Design",
          folderId: undefined,
        })
        .then((id) => {
          setDesignId(id as DesignId);
          localStorage.setItem(STORAGE_KEY, id);
        })
        .catch((err) => {
          console.error("Failed to create design:", err);
          setError(err.message || "Failed to create design");
        });
    }
  }, [designs]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeDesign = useCallback((newDesignId: DesignId) => {
    setDesignId(newDesignId);
    localStorage.setItem(STORAGE_KEY, newDesignId);
  }, []);

  return {
    designId,
    changeDesign,
    isLoading: designs === undefined || isMigrating,
    error,
  };
}
