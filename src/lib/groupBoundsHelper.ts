import type { CanvasNode } from '@/types';

/**
 * Compute the bounding box for a group based on its child nodes
 * Returns group position and dimensions with padding and header
 */
export function computeGroupBounds(
  nodes: CanvasNode[],
  childNodeIds: string[],
  position: { x: number; y: number } = { x: 100, y: 100 }
): {
  position: { x: number; y: number };
  width: number;
  height: number;
} {
  const childNodes = nodes.filter((n) =>
    childNodeIds.includes(n.id)
  );

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  childNodes.forEach((node) => {
    const nodeWidth = (node.style?.width as number) ?? 156;
    const nodeHeight = (node.style?.height as number) ?? 96;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + nodeWidth);
    maxY = Math.max(maxY, node.position.y + nodeHeight);
  });

  const padding = 20;
  const headerHeight = 36;
  const groupWidth =
    childNodes.length > 0 ? maxX - minX + 2 * padding : 300;
  const groupHeight =
    childNodes.length > 0 ? maxY - minY + 2 * padding + headerHeight : 200;

  const groupPosition =
    childNodes.length > 0
      ? { x: minX - padding, y: minY - padding - headerHeight }
      : position;

  return {
    position: groupPosition,
    width: groupWidth,
    height: groupHeight,
  };
}
