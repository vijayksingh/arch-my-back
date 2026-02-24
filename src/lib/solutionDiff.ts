/**
 * Solution Diff Computation
 * Computes the difference between current canvas state and correct solution
 */

import type { Node, Edge } from '@xyflow/react';
import type { BuildStepSolution, WalkthroughNodeDef } from '@/types/walkthrough';

export interface DiffItem {
  type: 'node' | 'edge';
  id: string;
  label?: string;
  reason?: string;
}

export interface DiffItemToAdd extends DiffItem {
  data: WalkthroughNodeDef | Edge;
}

export interface DiffData {
  toRemove: DiffItem[];
  toKeep: DiffItem[];
  toAdd: DiffItemToAdd[];
}

/**
 * Compute the diff between current state and solution
 */
export function computeDiff(
  currentNodes: Node[],
  currentEdges: Edge[],
  solution: BuildStepSolution
): DiffData {
  const currentNodeIds = new Set(currentNodes.map(n => n.id));
  const solutionNodeIds = new Set(solution.nodes.map(n => n.id));

  const currentEdgeIds = new Set(currentEdges.map(e => `${e.source}-${e.target}`));
  const solutionEdgeIds = new Set(solution.edges.map(e => `${e.source}-${e.target}`));

  // Nodes to remove (in current but not in solution)
  const nodesToRemove: DiffItem[] = currentNodes
    .filter(n => !solutionNodeIds.has(n.id))
    .map(n => ({
      type: 'node' as const,
      id: n.id,
      label: String(n.data?.label || n.id),
      reason: getRemovalReason(n, solution),
    }));

  // Nodes to keep (in both current and solution)
  const nodesToKeep: DiffItem[] = currentNodes
    .filter(n => solutionNodeIds.has(n.id))
    .map(n => ({
      type: 'node' as const,
      id: n.id,
      label: String(n.data?.label || n.id),
    }));

  // Nodes to add (in solution but not in current)
  const nodesToAdd: DiffItemToAdd[] = solution.nodes
    .filter(n => !currentNodeIds.has(n.id))
    .map(n => ({
      type: 'node' as const,
      id: n.id,
      label: String(n.data?.label || n.id),
      data: n,
      reason: getAdditionReason(n, solution),
    }));

  // Edges to remove (in current but not in solution)
  const edgesToRemove: DiffItem[] = currentEdges
    .filter(e => !solutionEdgeIds.has(`${e.source}-${e.target}`))
    .map(e => ({
      type: 'edge' as const,
      id: e.id,
      label: `${e.source} → ${e.target}`,
      reason: getEdgeRemovalReason(e, solution),
    }));

  // Edges to keep (in both current and solution)
  const edgesToKeep: DiffItem[] = currentEdges
    .filter(e => solutionEdgeIds.has(`${e.source}-${e.target}`))
    .map(e => ({
      type: 'edge' as const,
      id: e.id,
      label: `${e.source} → ${e.target}`,
    }));

  // Edges to add (in solution but not in current)
  const edgesToAdd: DiffItemToAdd[] = solution.edges
    .filter(e => !currentEdgeIds.has(`${e.source}-${e.target}`))
    .map(e => ({
      type: 'edge' as const,
      id: e.id,
      label: `${e.source} → ${e.target}`,
      data: e,
      reason: getEdgeAdditionReason(e, solution),
    }));

  return {
    toRemove: [...nodesToRemove, ...edgesToRemove],
    toKeep: [...nodesToKeep, ...edgesToKeep],
    toAdd: [...nodesToAdd, ...edgesToAdd],
  };
}

/**
 * Get reason why a node should be removed
 */
function getRemovalReason(node: Node, solution: BuildStepSolution): string {
  // Look up in common mistakes or provide generic reason
  const label = String(node.data?.label || node.id);
  const mistake = solution.explanation.commonMistakes.find(m =>
    m.toLowerCase().includes(label.toLowerCase())
  );
  return mistake || `${label} doesn't fit this architectural pattern`;
}

/**
 * Get reason why a node should be added
 */
function getAdditionReason(node: WalkthroughNodeDef, solution: BuildStepSolution): string {
  // Look up in reasoning or provide generic reason
  const label = String(node.data?.label || node.id);
  const reasoning = solution.explanation.reasoning.find(r =>
    r.toLowerCase().includes(label.toLowerCase())
  );
  return reasoning || `${label} is needed to complete the pattern`;
}

/**
 * Get reason why an edge should be removed
 */
function getEdgeRemovalReason(edge: Edge, solution: BuildStepSolution): string {
  const label = `${edge.source} → ${edge.target}`;
  const mistake = solution.explanation.commonMistakes.find(m =>
    m.toLowerCase().includes(edge.source.toLowerCase()) ||
    m.toLowerCase().includes(edge.target.toLowerCase())
  );
  return mistake || `Connection ${label} is not part of the correct pattern`;
}

/**
 * Get reason why an edge should be added
 */
function getEdgeAdditionReason(edge: Edge, solution: BuildStepSolution): string {
  const label = `${edge.source} → ${edge.target}`;
  const reasoning = solution.explanation.reasoning.find(r =>
    r.toLowerCase().includes(edge.source.toLowerCase()) ||
    r.toLowerCase().includes(edge.target.toLowerCase())
  );
  return reasoning || `Connection ${label} completes the architectural pattern`;
}
