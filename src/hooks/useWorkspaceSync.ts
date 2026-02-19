import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useCanvasStore } from '@/stores/canvasStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

/** Extract only domain fields from a React Flow node — strips runtime state */
function cleanNodeForStorage(node: { id: string; type: string; position: { x: number; y: number }; data: unknown; style?: unknown }) {
  return {
    id: node.id,
    type: node.type,
    position: { x: node.position.x, y: node.position.y },
    data: node.data,
    ...(node.style != null ? { style: node.style } : {}),
  };
}

/** Extract only domain fields from a React Flow edge — strips runtime state */
function cleanEdgeForStorage(edge: { id: string; source: string; target: string; type?: string; data?: unknown; sourceHandle?: string | null; targetHandle?: string | null }) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.type != null ? { type: edge.type } : {}),
    ...(edge.data != null ? { data: edge.data } : {}),
    ...(edge.sourceHandle != null ? { sourceHandle: edge.sourceHandle } : {}),
    ...(edge.targetHandle != null ? { targetHandle: edge.targetHandle } : {}),
  };
}

/**
 * Hook to sync workspace and canvas state with Convex
 * Handles debounced autosave and real-time loading
 */
export function useWorkspaceSync(workspaceId: Id<'workspaces'> | null) {
  const updateWorkspace = useMutation(api.workspaces.updateWorkspace);
  const saveDesign = useMutation(api.designs.saveDesign);

  const workspace = useQuery(
    api.workspaces.getWorkspace,
    workspaceId ? { workspaceId } : 'skip'
  );

  const design = useQuery(
    api.designs.getDesign,
    workspaceId ? { workspaceId } : 'skip'
  );

  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use individual selectors (stable references)
  const loadDesign = useCanvasStore((s) => s.loadDesign);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const setActiveCanvasTool = useWorkspaceStore((s) => s.setActiveCanvasTool);
  const setDocumentEditorMode = useWorkspaceStore((s) => s.setDocumentEditorMode);

  // Load initial data from Convex
  useEffect(() => {
    if (!workspaceId || hasLoadedRef.current) return;

    if (workspace && design) {
      setViewMode(workspace.viewMode);
      setActiveCanvasTool(workspace.activeCanvasTool);
      setDocumentEditorMode(workspace.documentEditorMode);
      loadDesign(design.nodes as any, design.edges as any);
      useWorkspaceStore.setState({ sections: design.sections });
      hasLoadedRef.current = true;
    }
  }, [workspace, design, workspaceId, setViewMode, setActiveCanvasTool, setDocumentEditorMode, loadDesign]);

  // Subscribe to canvas store changes for debounced autosave
  useEffect(() => {
    if (!workspaceId) return;

    const unsubscribe = useCanvasStore.subscribe(() => {
      if (!hasLoadedRef.current) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const { nodes, edges } = useCanvasStore.getState();
        const { sections } = useWorkspaceStore.getState();
        saveDesign({
          workspaceId,
          nodes: nodes.map(cleanNodeForStorage),
          edges: edges.map(cleanEdgeForStorage),
          sections,
        }).catch((err: Error) => {
          console.error('Failed to save design:', err);
        });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [workspaceId, saveDesign]);

  // Subscribe to workspace settings changes for immediate sync
  const prevSettingsRef = useRef<{
    viewMode: string;
    activeCanvasTool: string;
    documentEditorMode: string;
  } | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const unsubscribe = useWorkspaceStore.subscribe(() => {
      if (!hasLoadedRef.current) return;

      const state = useWorkspaceStore.getState();
      const curr = {
        viewMode: state.viewMode,
        activeCanvasTool: state.activeCanvasTool,
        documentEditorMode: state.documentEditorMode,
      };

      const prev = prevSettingsRef.current;
      if (
        !prev ||
        prev.viewMode !== curr.viewMode ||
        prev.activeCanvasTool !== curr.activeCanvasTool ||
        prev.documentEditorMode !== curr.documentEditorMode
      ) {
        prevSettingsRef.current = curr;
        updateWorkspace({
          workspaceId,
          viewMode: curr.viewMode,
          activeCanvasTool: curr.activeCanvasTool,
          documentEditorMode: curr.documentEditorMode,
        }).catch((err: Error) => {
          console.error('Failed to update workspace settings:', err);
        });
      }
    });

    return () => { unsubscribe(); };
  }, [workspaceId, updateWorkspace]);

  // Subscribe to sections changes for debounced save (sections affect design)
  const prevSectionsRef = useRef<any>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const unsubscribe = useWorkspaceStore.subscribe(() => {
      if (!hasLoadedRef.current) return;

      const state = useWorkspaceStore.getState();
      const currSections = state.sections;

      // Only save if sections actually changed
      if (prevSectionsRef.current !== currSections) {
        prevSectionsRef.current = currSections;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          const { nodes, edges } = useCanvasStore.getState();
          const { sections } = useWorkspaceStore.getState();
          saveDesign({
            workspaceId,
            nodes: nodes.map(cleanNodeForStorage),
            edges: edges.map(cleanEdgeForStorage),
            sections,
          }).catch((err: Error) => {
            console.error('Failed to save design:', err);
          });
        }, 2000);
      }
    });

    return () => { unsubscribe(); };
  }, [workspaceId, saveDesign]);

  return {
    isLoading: !workspace || !design,
    workspace,
    design,
  };
}
