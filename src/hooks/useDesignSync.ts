import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { DesignId, CanvasSection, NotebookBlock } from "@/types/design";
import type { CanvasNode, ArchEdge } from "@/types";
import { useCanvasStore } from "@/stores/canvasStore";
import { useDocumentStore } from "@/stores/documentStore";

/** Extract only domain fields from a React Flow node — strips runtime state */
function cleanNodeForStorage(node: CanvasNode) {
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
function cleanEdgeForStorage(edge: ArchEdge) {
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
      loadDesign(
        canvasData.nodes as CanvasNode[],
        canvasData.edges as ArchEdge[],
        canvasData.sections as CanvasSection[]
      );
      setBlocks(blocksData.blocks as NotebookBlock[]);
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
          nodes: nodes.map(cleanNodeForStorage) as any,
          edges: edges.map(cleanEdgeForStorage) as any,
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
          blocks: blocks as NotebookBlock[],
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
