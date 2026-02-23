import ELK from 'elkjs/lib/elk-api';
import type { CanvasNode, ArchEdge } from '@/types';
import { componentTypeMap } from '@/registry/componentTypes';

// ELK.js instance with Web Worker
let elkInstance: InstanceType<typeof ELK> | null = null;

function getElkInstance(): InstanceType<typeof ELK> {
  if (!elkInstance) {
    elkInstance = new ELK({
      workerFactory: () =>
        new Worker(new URL('elkjs/lib/elk-worker.min.js', import.meta.url)),
    });
  }
  return elkInstance;
}

// Category to layer mapping for semantic flow layout
const CATEGORY_TO_LAYER: Record<string, number> = {
  'Clients': 0,
  'Traffic': 1,
  'External': 2,
  'Compute': 3,
  'Caching': 4,
  'Messaging': 4,
  'Databases': 5,
  'Search & Analytics': 4,
  'ML / AI': 4,
  'Observability': 6,
};

interface ElkNode {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  children?: ElkNode[];
  layoutOptions?: Record<string, string>;
}

interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
}

interface ElkGraph {
  id: string;
  layoutOptions?: Record<string, string>;
  children: ElkNode[];
  edges: ElkEdge[];
}

const layoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '200',
  'elk.layered.layering.strategy': 'INTERACTIVE',  // respect layer assignments
  'elk.padding': '[top=50,left=50,bottom=50,right=50]',
};

/**
 * Convert React Flow nodes to ELK graph format.
 * Supports compound graphs (groups with parentId nesting).
 */
function toElkGraph(nodes: CanvasNode[], edges: ArchEdge[]): ElkGraph {
  // Separate top-level nodes from children
  const topLevelNodes = nodes.filter((n) => !n.parentId);
  const childrenByParent = new Map<string, CanvasNode[]>();

  nodes.forEach((node) => {
    if (node.parentId) {
      const children = childrenByParent.get(node.parentId) ?? [];
      children.push(node);
      childrenByParent.set(node.parentId, children);
    }
  });

  // Recursively build ELK nodes
  function buildElkNode(node: CanvasNode): ElkNode {
    const width = (node.style?.width as number) ?? 156;
    const height = (node.style?.height as number) ?? 96;

    const children = childrenByParent.get(node.id);
    const elkNode: ElkNode = {
      id: node.id,
      width,
      height,
    };

    // Assign layer based on component category for semantic flow
    if (node.data?.componentType && typeof node.data.componentType === 'string') {
      const typeDef = componentTypeMap.get(node.data.componentType);
      if (typeDef) {
        const layer = CATEGORY_TO_LAYER[typeDef.category] ?? 3;
        elkNode.layoutOptions = {
          'elk.layered.layering.layer': String(layer),
        };
      }
    }

    if (children && children.length > 0) {
      elkNode.children = children.map(buildElkNode);
    }

    return elkNode;
  }

  const elkNodes = topLevelNodes.map(buildElkNode);

  // Convert edges (only include edges between nodes at the same hierarchy level)
  const elkEdges: ElkEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  return {
    id: 'root',
    layoutOptions,
    children: elkNodes,
    edges: elkEdges,
  };
}

/**
 * Apply ELK layout positions back to React Flow nodes.
 */
function applyElkLayout(
  nodes: CanvasNode[],
  elkGraph: ElkGraph
): CanvasNode[] {
  const positionMap = new Map<string, { x: number; y: number }>();

  // Recursively extract positions from ELK result
  function extractPositions(elkNodes: ElkNode[], parentPos = { x: 0, y: 0 }) {
    elkNodes.forEach((elkNode) => {
      const x = (elkNode.x ?? 0) + parentPos.x;
      const y = (elkNode.y ?? 0) + parentPos.y;

      positionMap.set(elkNode.id, { x, y });

      if (elkNode.children) {
        extractPositions(elkNode.children, { x, y });
      }
    });
  }

  extractPositions(elkGraph.children);

  // Apply positions to nodes
  return nodes.map((node) => {
    const newPos = positionMap.get(node.id);
    if (!newPos) return node;

    // If node has a parent, convert to relative position
    if (node.parentId) {
      const parentPos = positionMap.get(node.parentId);
      if (parentPos) {
        return {
          ...node,
          position: {
            x: newPos.x - parentPos.x,
            y: newPos.y - parentPos.y,
          },
        };
      }
    }

    return { ...node, position: newPos };
  });
}

/**
 * Run ELK.js layout on React Flow nodes and edges.
 * Returns new nodes with updated positions.
 */
export async function runElkLayout(
  nodes: CanvasNode[],
  edges: ArchEdge[]
): Promise<CanvasNode[]> {
  if (nodes.length === 0) return nodes;

  const elk = getElkInstance();
  const elkGraph = toElkGraph(nodes, edges);

  const layoutedGraph = await elk.layout(elkGraph) as ElkGraph;

  return applyElkLayout(nodes, layoutedGraph);
}
