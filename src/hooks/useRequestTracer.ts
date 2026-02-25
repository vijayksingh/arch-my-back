/**
 * useRequestTracer — Animates a tracer particle following a request path through the graph
 *
 * Visual Philosophy:
 * When user clicks an entry node during simulation, a bright tracer particle follows
 * the request path through the system, pausing at each node proportional to its latency.
 * This teaches distributed tracing concepts (Jaeger/Zipkin) through direct visual experience.
 *
 * Tracer Journey:
 * 1. User clicks entry node → BFS computes path to leaf node
 * 2. Tracer visits each node in sequence:
 *    - Travels along edge (animated motion)
 *    - Pauses at node (processing delay = node latency)
 *    - Continues to next node
 * 3. Reaches leaf node → tracer completes and fades out
 *
 * Technical Details:
 * - BFS through adjacency map (follows edge connections)
 * - Reads per-node latency from simulationStore.nodeVisualStates
 * - Returns activeTracer state: { pathNodeIds, currentNodeIndex, progress }
 * - Only one tracer active at a time (new trace clears previous)
 *
 * Usage:
 * const tracer = useRequestTracer(nodes, edges);
 * // tracer.activeTracer: { pathNodeIds: string[], currentNodeIndex: number, progress: number } | null
 */

import { useState, useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useSimulationStore } from '@/stores/simulationStore';

export interface TracerState {
  pathNodeIds: string[]; // Ordered list of nodes to visit
  currentNodeIndex: number; // Which node we're currently at/traveling to
  progress: number; // 0-1: progress along current edge (0=at source, 1=at target)
  phase: 'traveling' | 'processing'; // traveling=on edge, processing=at node
}

interface UseRequestTracerReturn {
  activeTracer: TracerState | null;
  startTrace: (nodeId: string) => void;
  clearTrace: () => void;
}

/**
 * Computes the shortest path from entry node to a leaf node using BFS.
 * Returns array of node IDs representing the path.
 */
function computeRequestPath(
  startNodeId: string,
  nodes: Node[],
  edges: Edge[]
): string[] {
  const nodeIds = new Set(nodes.map(n => n.id));

  // Build adjacency map: nodeId → Set<childNodeId>
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)?.add(edge.target);
  }

  // BFS to find first leaf node (node with no outgoing edges)
  const queue: Array<{ nodeId: string; path: string[] }> = [
    { nodeId: startNodeId, path: [startNodeId] }
  ];
  const visited = new Set<string>([startNodeId]);

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!;
    const children = adjacency.get(nodeId);

    // Leaf node found (no children)
    if (!children || children.size === 0) {
      return path;
    }

    // Add children to queue
    for (const childId of children) {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push({ nodeId: childId, path: [...path, childId] });
      }
    }
  }

  // No leaf found — return path to start node only
  return [startNodeId];
}

/**
 * Hook that manages tracer animation state.
 * Call startTrace(nodeId) to begin tracing from that node.
 */
export function useRequestTracer(
  nodes: Node[],
  edges: Edge[]
): UseRequestTracerReturn {
  const [activeTracer, setActiveTracer] = useState<TracerState | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Read node latencies from simulation store
  const nodeVisualStates = useSimulationStore(s => s.nodeVisualStates);

  /**
   * Start tracing from the given entry node.
   */
  const startTrace = (nodeId: string) => {
    // Compute path from entry node to leaf
    const pathNodeIds = computeRequestPath(nodeId, nodes, edges);

    if (pathNodeIds.length === 0) {
      console.warn('[useRequestTracer] No path computed for node:', nodeId);
      return;
    }

    // Initialize tracer state
    setActiveTracer({
      pathNodeIds,
      currentNodeIndex: 0,
      progress: 0,
      phase: 'processing', // Start by processing at entry node
    });

    lastTimestampRef.current = null;
  };

  /**
   * Clear active trace.
   */
  const clearTrace = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setActiveTracer(null);
    lastTimestampRef.current = null;
  };

  /**
   * Animation loop: advance tracer along path.
   */
  useEffect(() => {
    if (!activeTracer) {
      // No active tracer — cleanup
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimestampRef.current; // ms
      lastTimestampRef.current = timestamp;

      setActiveTracer(prev => {
        if (!prev) return null;

        const { pathNodeIds, currentNodeIndex, progress, phase } = prev;

        // Tracer completed path
        if (currentNodeIndex >= pathNodeIds.length) {
          return null; // End trace
        }

        const currentNodeId = pathNodeIds[currentNodeIndex];

        if (phase === 'processing') {
          // Processing at node — wait for latency duration
          const nodeVisual = nodeVisualStates.get(currentNodeId);
          const latency = nodeVisual?.metricsOverlay?.latency ?? '10ms';
          const latencyMs = parseLatencyMs(latency);

          // Advance progress based on deltaTime
          const newProgress = progress + (deltaTime / latencyMs);

          if (newProgress >= 1.0) {
            // Processing complete — move to next edge
            const nextIndex = currentNodeIndex + 1;

            if (nextIndex >= pathNodeIds.length) {
              // Reached end of path
              return null;
            }

            return {
              pathNodeIds,
              currentNodeIndex: nextIndex,
              progress: 0,
              phase: 'traveling',
            };
          }

          return { ...prev, progress: newProgress };
        } else {
          // Traveling along edge — fixed duration (500ms)
          const TRAVEL_DURATION_MS = 500;
          const newProgress = progress + (deltaTime / TRAVEL_DURATION_MS);

          if (newProgress >= 1.0) {
            // Arrived at next node — start processing
            return {
              pathNodeIds,
              currentNodeIndex,
              progress: 0,
              phase: 'processing',
            };
          }

          return { ...prev, progress: newProgress };
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeTracer, nodeVisualStates]);

  return { activeTracer, startTrace, clearTrace };
}

/**
 * Parse latency string (e.g., "45ms", "1.2s") to milliseconds.
 */
function parseLatencyMs(latency: string): number {
  const match = latency.match(/^([\d.]+)(ms|s)$/);
  if (!match) return 100; // Default 100ms

  const value = parseFloat(match[1]);
  const unit = match[2];

  return unit === 's' ? value * 1000 : value;
}
