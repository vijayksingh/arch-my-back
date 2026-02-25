/**
 * useWalkthroughSimulationBridge — Syncs simulation visual states to local React state
 *
 * This hook is a variant of useSimulationBridge that works with local controlled state
 * (useState setters) instead of the Zustand canvasStore. It's designed for Canvas.Walkthrough
 * which uses local state management.
 *
 * Key differences from useSimulationBridge:
 * - Accepts nodes/edges/setters as parameters instead of reading from canvasStore
 * - Writes to local state via setNodes/setEdges instead of canvasStore.setState
 * - Does NOT initialize simulation engine (that's WalkthroughContext's responsibility)
 * - Has an `enabled` guard parameter for conditional activation
 *
 * Usage: Call inside Canvas.Walkthrough with local state:
 * ```typescript
 * const [localNodes, setLocalNodes] = useState<Node[]>([]);
 * const [localEdges, setLocalEdges] = useState<Edge[]>([]);
 * useWalkthroughSimulationBridge(localNodes, localEdges, setLocalNodes, setLocalEdges, true);
 * ```
 */

import { useEffect, useRef } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import type { Node, Edge } from '@xyflow/react';
import type { NodeVisualState, EdgeVisualState } from '@/types/simulation';

/**
 * Bridge simulation visual states to local React state (for walkthrough mode).
 *
 * @param nodes - Current nodes array from local state
 * @param edges - Current edges array from local state
 * @param setNodes - State setter for nodes
 * @param setEdges - State setter for edges
 * @param enabled - Whether to activate the bridge (allows conditional usage)
 */
export function useWalkthroughSimulationBridge(
  _nodes: Node[],
  _edges: Edge[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  enabled: boolean,
): void {
  // Track previous visual states to detect changes
  const prevNodeVisualsRef = useRef<Map<string, NodeVisualState> | null>(null);
  const prevEdgeVisualsRef = useRef<Map<string, EdgeVisualState> | null>(null);

  // Subscribe to simulation store visual state changes
  useEffect(() => {
    if (!enabled) return;

    // Subscribe directly to visual state changes in simulation store
    const unsubscribe = useSimulationStore.subscribe((state) => {
      const { nodeVisualStates, edgeVisualStates } = state;

      // Only process if Maps actually changed (reference comparison)
      if (
        nodeVisualStates === prevNodeVisualsRef.current &&
        edgeVisualStates === prevEdgeVisualsRef.current
      ) {
        return;
      }
      prevNodeVisualsRef.current = nodeVisualStates;
      prevEdgeVisualsRef.current = edgeVisualStates;

      if (nodeVisualStates.size === 0 && edgeVisualStates.size === 0) return;

      let nodesChanged = false;
      let edgesChanged = false;

      // Update node data with simulation visual states
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node): Node => {
          const visual = nodeVisualStates.get(node.id);
          if (!visual) {
            // Clear simulation data if no visual state
            if (node.data.simVisual) {
              nodesChanged = true;
              return { ...node, data: { ...node.data, simVisual: undefined } };
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
          };
        });

        // Only return new array if something changed
        return nodesChanged ? updatedNodes : prevNodes;
      });

      // Update edge data with simulation visual states
      setEdges((prevEdges) => {
        const updatedEdges = prevEdges.map((edge): Edge => {
          const visual = edgeVisualStates.get(edge.id);
          if (!visual) {
            // Clear simulation flags if no visual state
            if (edge.data?.simulating) {
              edgesChanged = true;
              return {
                ...edge,
                data: { ...edge.data, simulating: false, status: undefined },
              };
            }
            return edge;
          }

          // Map EdgeVisualState to edge's data interface
          const simulating = visual.particleFlow.count > 0;
          const status = mapCongestionToStatus(visual.congestionLevel);

          // Compare current values with new values before creating new edge object
          // If the engine's diff didn't emit an update for this edge, the visual reference
          // from the Map is the SAME object as last tick, so === comparison works
          const currentVisual = edge.data?.simVisual;
          const currentSimulating = edge.data?.simulating;
          const currentStatus = edge.data?.status;

          if (
            currentVisual === visual &&
            currentSimulating === simulating &&
            currentStatus === status
          ) {
            return edge; // unchanged — return same reference to prevent ReactFlow re-render
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
          };
        });

        // Only return new array if something changed
        return edgesChanged ? updatedEdges : prevEdges;
      });
    });

    return unsubscribe;
  }, [enabled, setNodes, setEdges]);

  // Cleanup: clear simulation data from nodes/edges when unmounting
  useEffect(() => {
    return () => {
      if (!enabled) return;

      // Clear simVisual data from nodes
      setNodes((prevNodes) =>
        prevNodes.map((node): Node => {
          if (!node.data.simVisual) return node;
          return {
            ...node,
            data: { ...node.data, simVisual: undefined, highlighted: false },
          };
        })
      );

      // Clear simVisual data from edges
      setEdges((prevEdges) =>
        prevEdges.map((edge): Edge => {
          if (!edge.data?.simulating) return edge;
          return {
            ...edge,
            data: {
              ...edge.data,
              simulating: false,
              status: undefined,
              simVisual: undefined,
            },
          };
        })
      );
    };
  }, [enabled, setNodes, setEdges]);
}

/**
 * Maps congestion level (0-1) to edge status field.
 */
function mapCongestionToStatus(
  congestionLevel: number,
): 'normal' | 'bottleneck' | 'error' {
  if (congestionLevel >= 0.9) return 'error';
  if (congestionLevel >= 0.6) return 'bottleneck';
  return 'normal';
}
