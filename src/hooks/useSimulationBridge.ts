/**
 * useSimulationBridge — Syncs simulation visual states to canvas node/edge data
 *
 * This hook bridges the SimulationStore ↔ CanvasStore:
 * 1. Initializes the simulation engine from canvas nodes/edges
 * 2. On each simulation tick, writes visual states into node.data / edge.data
 * 3. ReactFlow re-renders ArchNode/ArchEdge with the updated data
 *
 * Usage: Call once inside the Canvas component.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useSimulationStore } from '@/stores/simulationStore';
import type { NodeVisualState } from '@/types/simulation';
import type { CanvasNode, ArchEdge } from '@/types';

/**
 * Writes simulation visual states into canvas node/edge data so
 * ArchNode and ArchEdge renderers can read them.
 */
export function useSimulationBridge() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const isInitialized = useSimulationStore((s) => s.isInitialized);
  const isRunning = useSimulationStore((s) => s.isRunning);
  const nodeVisualStates = useSimulationStore((s) => s.nodeVisualStates);
  const edgeVisualStates = useSimulationStore((s) => s.edgeVisualStates);

  const actions = useSimulationStore((s) => s.actions);

  // Track whether we've initialized for the current graph
  const initGraphRef = useRef<string>('');

  // Initialize simulation engine when canvas graph changes
  useEffect(() => {
    // Build a fingerprint from node/edge IDs and config to detect graph changes
    const graphKey = nodes.map((n) => {
      // Include config hash so engine re-initializes when node config changes
      const config = n.type === 'archComponent' && n.data?.config
        ? JSON.stringify(n.data.config)
        : '';
      return `${n.id}:${config}`;
    }).sort().join(',') + '|' +
      edges.map((e) => e.id).sort().join(',');

    // Only re-initialize if graph structure actually changed
    if (graphKey === initGraphRef.current) return;
    if (nodes.length === 0) return;

    initGraphRef.current = graphKey;
    actions.initialize(nodes, edges);
  }, [nodes, edges, actions]);

  // Sync visual states back into canvas store
  const syncVisualStates = useCallback(() => {
    if (!isRunning && !isInitialized) return;
    if (nodeVisualStates.size === 0 && edgeVisualStates.size === 0) return;

    const canvasState = useCanvasStore.getState();
    let nodesChanged = false;
    let edgesChanged = false;

    // Update node data with simulation visual states
    // We use type assertions because we're only modifying [key: string]: unknown
    // index-signature fields (simVisual, highlighted), not discriminant fields.
    const updatedNodes = canvasState.nodes.map((node): CanvasNode => {
      const visual = nodeVisualStates.get(node.id);
      if (!visual) {
        // Clear simulation data if no visual state
        if (node.data.simVisual) {
          nodesChanged = true;
          return { ...node, data: { ...node.data, simVisual: undefined } } as CanvasNode;
        }
        return node;
      }

      // Check if visual state actually changed (reference comparison)
      const current = node.data.simVisual as NodeVisualState | undefined;
      if (current === visual) return node;

      nodesChanged = true;
      return {
        ...node,
        data: {
          ...node.data,
          simVisual: visual,
          // Also set highlighted for nodes with critical health
          highlighted: visual.healthColor === 'red',
        },
      } as CanvasNode;
    });

    // Update edge data with simulation visual states
    const updatedEdges = canvasState.edges.map((edge): ArchEdge => {
      const visual = edgeVisualStates.get(edge.id);
      if (!visual) {
        // Clear simulation flags if no visual state
        if (edge.data?.simulating) {
          edgesChanged = true;
          return {
            ...edge,
            data: { ...edge.data, simulating: false, status: undefined },
          } as ArchEdge;
        }
        return edge;
      }

      // Map EdgeVisualState to ArchEdge's existing data interface
      const simulating = visual.particleFlow.count > 0;
      const status = mapCongestionToStatus(visual.congestionLevel);

      // Always apply simVisual when we have visual data from the engine
      // (the old check was too conservative and missed simVisual updates)
      if (visual) {
        edgesChanged = true;
        return {
          ...edge,
          data: {
            ...edge.data,
            simulating,
            status,
            simVisual: visual,
          },
        } as ArchEdge;
      }

      // Only skip update if simulating and status haven't changed AND no visual data
      if (
        edge.data?.simulating === simulating &&
        edge.data?.status === status
      ) {
        return edge;
      }

      edgesChanged = true;
      return {
        ...edge,
        data: {
          ...edge.data,
          simulating,
          status,
          simVisual: visual,
        },
      } as ArchEdge;
    });

    // Only update store if something actually changed
    if (nodesChanged || edgesChanged) {
      useCanvasStore.setState({
        ...(nodesChanged ? { nodes: updatedNodes } : {}),
        ...(edgesChanged ? { edges: updatedEdges } : {}),
      });
    }
  }, [isRunning, isInitialized, nodeVisualStates, edgeVisualStates]);

  // Run sync whenever visual states change
  useEffect(() => {
    syncVisualStates();
  }, [syncVisualStates]);

  // Cleanup: clear simulation data from nodes/edges when unmounting
  useEffect(() => {
    return () => {
      const { nodes: currentNodes, edges: currentEdges } = useCanvasStore.getState();
      const cleanedNodes = currentNodes.map((node): CanvasNode => {
        if (!node.data.simVisual) return node;
        return { ...node, data: { ...node.data, simVisual: undefined, highlighted: false } } as CanvasNode;
      });
      const cleanedEdges = currentEdges.map((edge): ArchEdge => {
        if (!edge.data?.simulating) return edge;
        return { ...edge, data: { ...edge.data, simulating: false, status: undefined, simVisual: undefined } } as ArchEdge;
      });
      useCanvasStore.setState({ nodes: cleanedNodes, edges: cleanedEdges });
    };
  }, []);
}

/**
 * Maps congestion level (0-1) to ArchEdge's status field.
 */
function mapCongestionToStatus(
  congestionLevel: number,
): 'normal' | 'bottleneck' | 'error' {
  if (congestionLevel >= 0.9) return 'error';
  if (congestionLevel >= 0.6) return 'bottleneck';
  return 'normal';
}
