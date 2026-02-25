/**
 * useBootSequence — Staggers node activation when simulation initializes
 *
 * Visual Philosophy:
 * When simulation starts, nodes should "power up" sequentially following
 * topological order, like a factory coming online. Entry nodes light up first,
 * downstream nodes follow in cascading waves.
 *
 * Boot Sequence:
 * 1. Compute topological layers (BFS from entry nodes)
 * 2. Stagger activation: layer 0 at t=0, layer 1 at t=150ms, etc.
 * 3. Each node transitions: dimmed (0.4) → booting (0.7, pulse) → active (1.0)
 * 4. Total boot time: ~150ms * max_depth (typically 600-750ms)
 *
 * Shutdown Sequence:
 * 1. Reverse order: leaf nodes dim first
 * 2. Faster cadence: 100ms per layer
 *
 * Usage:
 * const { bootingNodeIds, isBooting } = useBootSequence(nodes, edges, isInitialized, isRunning);
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface BootSequenceState {
  bootingNodeIds: Set<string>;
  isBooting: boolean;
}

const BOOT_STAGGER_MS = 150; // Time between layers during boot
const SHUTDOWN_STAGGER_MS = 100; // Time between layers during shutdown

/**
 * Computes topological layers using BFS from entry nodes (nodes with no incoming edges).
 * Returns: Map<nodeId, layer> where layer 0 = entry nodes, layer 1 = their children, etc.
 */
function computeTopologicalLayers(
  nodes: Node[],
  edges: Edge[]
): Map<string, number> {
  const nodeIds = new Set(nodes.map(n => n.id));
  const layerMap = new Map<string, number>();

  // Build adjacency map: nodeId → Set<childNodeId>
  const adjacency = new Map<string, Set<string>>();
  const incomingCount = new Map<string, number>();

  // Initialize
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
    incomingCount.set(node.id, 0);
  }

  // Build graph
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)?.add(edge.target);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  }

  // Find entry nodes (no incoming edges)
  const entryNodes = nodes.filter(n => (incomingCount.get(n.id) ?? 0) === 0);

  // BFS to assign layers
  const queue: Array<{ nodeId: string; layer: number }> = entryNodes.map(n => ({
    nodeId: n.id,
    layer: 0,
  }));

  const visited = new Set<string>();

  while (queue.length > 0) {
    const { nodeId, layer } = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    layerMap.set(nodeId, layer);

    // Add children to next layer
    const children = adjacency.get(nodeId);
    if (children) {
      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push({ nodeId: childId, layer: layer + 1 });
        }
      }
    }
  }

  // Handle orphaned nodes (no incoming or outgoing edges) — assign to layer 0
  for (const node of nodes) {
    if (!layerMap.has(node.id)) {
      layerMap.set(node.id, 0);
    }
  }

  return layerMap;
}

/**
 * Staggers node activation during simulation boot/shutdown.
 */
export function useBootSequence(
  nodes: Node[],
  edges: Edge[],
  isInitialized: boolean,
  isRunning: boolean
): BootSequenceState {
  const [bootingNodeIds, setBootingNodeIds] = useState<Set<string>>(new Set());
  const [isBooting, setIsBooting] = useState(false);

  // Track previous isInitialized state to detect transitions
  const prevInitializedRef = useRef(isInitialized);
  const prevRunningRef = useRef(isRunning);

  // Compute topological layers (memoized)
  const topologyLayers = useMemo(() => {
    return computeTopologicalLayers(nodes, edges);
  }, [nodes, edges]);

  useEffect(() => {
    const wasInitialized = prevInitializedRef.current;
    const wasRunning = prevRunningRef.current;
    prevInitializedRef.current = isInitialized;
    prevRunningRef.current = isRunning;

    // Boot sequence: isInitialized changes from false → true
    if (!wasInitialized && isInitialized) {
      setIsBooting(true);
      const allNodeIds = nodes.map(n => n.id);

      // Group nodes by layer
      const layerGroups = new Map<number, string[]>();
      for (const nodeId of allNodeIds) {
        const layer = topologyLayers.get(nodeId) ?? 0;
        if (!layerGroups.has(layer)) {
          layerGroups.set(layer, []);
        }
        layerGroups.get(layer)!.push(nodeId);
      }

      const maxLayer = Math.max(...Array.from(layerGroups.keys()));
      const timers: NodeJS.Timeout[] = [];

      // Initially, all nodes are "booting"
      setBootingNodeIds(new Set(allNodeIds));

      // Stagger activation by layer
      for (let layer = 0; layer <= maxLayer; layer++) {
        const layerNodes = layerGroups.get(layer) ?? [];
        const delay = layer * BOOT_STAGGER_MS;

        const timer = setTimeout(() => {
          // Remove this layer's nodes from booting set (they're now active)
          setBootingNodeIds(prev => {
            const next = new Set(prev);
            layerNodes.forEach(id => next.delete(id));
            return next;
          });
        }, delay);

        timers.push(timer);
      }

      // Mark boot complete after all layers finish
      const totalBootTime = maxLayer * BOOT_STAGGER_MS + BOOT_STAGGER_MS;
      const completeTimer = setTimeout(() => {
        setIsBooting(false);
      }, totalBootTime);
      timers.push(completeTimer);

      return () => {
        timers.forEach(clearTimeout);
      };
    }

    // Shutdown sequence: isRunning changes from true → false or isInitialized false → false
    if ((wasRunning && !isRunning) || (wasInitialized && !isInitialized)) {
      setIsBooting(true);
      const allNodeIds = nodes.map(n => n.id);

      // Group nodes by layer (reverse order for shutdown)
      const layerGroups = new Map<number, string[]>();
      for (const nodeId of allNodeIds) {
        const layer = topologyLayers.get(nodeId) ?? 0;
        if (!layerGroups.has(layer)) {
          layerGroups.set(layer, []);
        }
        layerGroups.get(layer)!.push(nodeId);
      }

      const maxLayer = Math.max(...Array.from(layerGroups.keys()), 0);
      const timers: NodeJS.Timeout[] = [];

      // Shutdown starts from leaf nodes (highest layer) back to entry nodes
      for (let layer = maxLayer; layer >= 0; layer--) {
        const layerNodes = layerGroups.get(layer) ?? [];
        const delay = (maxLayer - layer) * SHUTDOWN_STAGGER_MS;

        const timer = setTimeout(() => {
          // Add this layer's nodes to booting set (dimming them)
          setBootingNodeIds(prev => {
            const next = new Set(prev);
            layerNodes.forEach(id => next.add(id));
            return next;
          });
        }, delay);

        timers.push(timer);
      }

      // Mark shutdown complete
      const totalShutdownTime = (maxLayer + 1) * SHUTDOWN_STAGGER_MS;
      const completeTimer = setTimeout(() => {
        setIsBooting(false);
        setBootingNodeIds(new Set()); // Clear all
      }, totalShutdownTime);
      timers.push(completeTimer);

      return () => {
        timers.forEach(clearTimeout);
      };
    }
  }, [isInitialized, isRunning, nodes, edges, topologyLayers]);

  return { bootingNodeIds, isBooting };
}
