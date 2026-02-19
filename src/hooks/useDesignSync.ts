import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { DesignId } from "@/types/design";
import { useCanvasStore } from "@/stores/canvasStore";
import { useDocumentStore } from "@/stores/documentStore";

/** Extract only domain fields from a React Flow node — strips runtime state */
function cleanNodeForStorage(node: {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: unknown;
  style?: unknown;
  measured?: { width: number; height: number };
}) {
  return {
    id: node.id,
    type: node.type,
    position: { x: node.position.x, y: node.position.y },
    data: node.data,
    ...(node.style != null ? { style: node.style } : {}),
    ...(node.measured != null ? { measured: node.measured } : {}),
  };
}

/** Extract only domain fields from a React Flow edge — strips runtime state */
function cleanEdgeForStorage(edge: {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: unknown;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}) {
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
 * Hook to sync design canvas and blocks with Convex
 * Handles debounced autosave and real-time loading
 */
export function useDesignSync(designId: DesignId | null) {
  const saveCanvas = useMutation(api.designCanvases.save);
  const saveBlocks = useMutation(api.designBlocks.save);

  const canvasData = useQuery(
    api.designCanvases.load,
    designId ? { designId } : "skip"
  );

  const blocksData = useQuery(
    api.designBlocks.load,
    designId ? { designId } : "skip"
  );

  const hasLoadedRef = useRef(false);
  const canvasSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const blocksSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Use individual selectors (stable references)
  const loadDesign = useCanvasStore((s) => s.loadDesign);
  const setBlocks = useDocumentStore((s) => s.setBlocks);

  // Load initial data from Convex
  useEffect(() => {
    if (!designId || hasLoadedRef.current) return;

    if (canvasData && blocksData) {
      loadDesign(canvasData.nodes as any, canvasData.edges as any, canvasData.sections as any);
      setBlocks(blocksData.blocks as any);
      hasLoadedRef.current = true;
    }
  }, [canvasData, blocksData, designId, loadDesign, setBlocks]);

  // Subscribe to canvas store changes for debounced autosave
  useEffect(() => {
    if (!designId) return;

    const unsubscribe = useCanvasStore.subscribe(() => {
      if (!hasLoadedRef.current) return;

      if (canvasSaveTimeoutRef.current) clearTimeout(canvasSaveTimeoutRef.current);
      canvasSaveTimeoutRef.current = setTimeout(() => {
        const { nodes, edges, sections } = useCanvasStore.getState();
        saveCanvas({
          designId,
          nodes: nodes.map(cleanNodeForStorage),
          edges: edges.map(cleanEdgeForStorage),
          sections,
        }).catch((err: Error) => {
          console.error("Failed to save canvas:", err);
        });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (canvasSaveTimeoutRef.current) clearTimeout(canvasSaveTimeoutRef.current);
    };
  }, [designId, saveCanvas]);

  // Subscribe to document store changes for debounced autosave
  useEffect(() => {
    if (!designId) return;

    const unsubscribe = useDocumentStore.subscribe(() => {
      if (!hasLoadedRef.current) return;

      if (blocksSaveTimeoutRef.current) clearTimeout(blocksSaveTimeoutRef.current);
      blocksSaveTimeoutRef.current = setTimeout(() => {
        const { blocks } = useDocumentStore.getState();
        saveBlocks({
          designId,
          blocks: blocks as any,
        }).catch((err: Error) => {
          console.error("Failed to save blocks:", err);
        });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (blocksSaveTimeoutRef.current) clearTimeout(blocksSaveTimeoutRef.current);
    };
  }, [designId, saveBlocks]);

  return {
    isLoading: !canvasData || !blocksData,
    canvasData,
    blocksData,
  };
}
