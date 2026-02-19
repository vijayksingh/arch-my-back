import { useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useCanvasStore } from '@/stores/canvasStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

/**
 * Hook to sync workspace and canvas state with Convex
 * Handles debounced autosave and real-time loading
 */
export function useWorkspaceSync(workspaceId: Id<'workspaces'> | null) {
  const updateWorkspace = useMutation(api.workspaces.updateWorkspace);
  const saveDesign = useMutation(api.designs.saveDesign);

  // Query workspace settings
  const workspace = useQuery(
    api.workspaces.getWorkspace,
    workspaceId ? { workspaceId } : 'skip'
  );

  // Query design (canvas + sections)
  const design = useQuery(
    api.designs.getDesign,
    workspaceId ? { workspaceId } : 'skip'
  );

  // Track if we've loaded initial data
  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get store state and actions
  const canvasState = useCanvasStore((s) => ({
    nodes: s.nodes,
    edges: s.edges,
  }));
  const loadDesign = useCanvasStore((s) => s.loadDesign);

  const workspaceState = useWorkspaceStore((s) => ({
    viewMode: s.viewMode,
    activeCanvasTool: s.activeCanvasTool,
    documentEditorMode: s.documentEditorMode,
    sections: s.sections,
    blocks: s.blocks,
  }));
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const setActiveCanvasTool = useWorkspaceStore((s) => s.setActiveCanvasTool);
  const setDocumentEditorMode = useWorkspaceStore((s) => s.setDocumentEditorMode);

  // Load initial data from Convex
  useEffect(() => {
    if (!workspaceId || hasLoadedRef.current) return;

    if (workspace && design) {
      // Load workspace settings
      setViewMode(workspace.viewMode);
      setActiveCanvasTool(workspace.activeCanvasTool);
      setDocumentEditorMode(workspace.documentEditorMode);

      // Load canvas design (nodes and edges)
      // Cast to any to bypass type checking as Convex returns more generic types
      loadDesign(design.nodes as any, design.edges as any);

      // Load sections
      // Note: sections are stored in the design document
      useWorkspaceStore.setState({
        sections: design.sections,
      });

      hasLoadedRef.current = true;
    }
  }, [workspace, design, workspaceId, setViewMode, setActiveCanvasTool, setDocumentEditorMode, loadDesign]);

  // Debounced autosave for canvas changes
  const saveCanvas = useCallback(() => {
    if (!workspaceId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDesign({
        workspaceId,
        nodes: canvasState.nodes as any,
        edges: canvasState.edges as any,
        sections: workspaceState.sections as any,
      }).catch((err) => {
        console.error('Failed to save design:', err);
      });
    }, 2000); // 2 second debounce
  }, [workspaceId, canvasState.nodes, canvasState.edges, workspaceState.sections, saveDesign]);

  // Auto-save on canvas/section changes
  useEffect(() => {
    if (!hasLoadedRef.current) return; // Don't save until initial load complete
    saveCanvas();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveCanvas]);

  // Save workspace settings changes immediately (not debounced)
  const prevWorkspaceSettingsRef = useRef(workspaceState);
  useEffect(() => {
    if (!hasLoadedRef.current || !workspaceId) return;

    const prev = prevWorkspaceSettingsRef.current;
    const curr = workspaceState;

    // Check if settings changed (not blocks/sections)
    if (
      prev.viewMode !== curr.viewMode ||
      prev.activeCanvasTool !== curr.activeCanvasTool ||
      prev.documentEditorMode !== curr.documentEditorMode
    ) {
      updateWorkspace({
        workspaceId,
        viewMode: curr.viewMode,
        activeCanvasTool: curr.activeCanvasTool,
        documentEditorMode: curr.documentEditorMode,
      }).catch((err) => {
        console.error('Failed to update workspace settings:', err);
      });
    }

    prevWorkspaceSettingsRef.current = curr;
  }, [workspaceState, workspaceId, updateWorkspace]);

  return {
    isLoading: !workspace || !design,
    workspace,
    design,
  };
}
