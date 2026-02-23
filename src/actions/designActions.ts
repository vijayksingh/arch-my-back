import { useCanvasStore } from '@/stores/canvasStore';
import { useDocumentStore } from '@/stores/documentStore';
import type { NotebookBlock, BlockType, CanvasSection } from '@/types/design';
import { NODE_TYPE } from '@/constants';

/**
 * Shared action functions for coordinating across stores
 * Extracted from the original workspaceStore to maintain cross-store logic
 */

const blockTypeLabels: Record<BlockType, string> = {
  text: 'Text',
  requirements: 'Requirements',
  schema: 'Schema',
  api: 'API',
  lld: 'LLD',
};

/**
 * Add a new block to the document, with optional section/badge creation for non-text blocks
 * Coordinates between documentStore and canvasStore
 *
 * For non-text blocks:
 * 1. Creates a section badge node on the canvas
 * 2. Creates a section linked to that badge node
 * 3. Creates the block with a reference to the section
 */
export function addBlockWithSectionCoordination(
  type: BlockType,
  insertIndex?: number
): NotebookBlock {
  let sectionId: string | null = null;

  if (type !== 'text') {
    const label = blockTypeLabels[type];
    const canvasNodes = useCanvasStore.getState().nodes;

    // Find the lowest point on canvas to position new badge below existing content
    let maxY = 0;
    for (const node of canvasNodes) {
      const nodeH = typeof node.style?.height === 'number' ? node.style.height : 48;
      const bottom = node.position.y + nodeH;
      if (bottom > maxY) maxY = bottom;
    }
    const position = { x: 100, y: Math.max(60, maxY + 60) };

    // Note: block ID will be created by documentStore.addBlock, so we pass empty string for now
    // and will update after block creation
    const tempBlockId = 'temp';
    const nodeId = useCanvasStore
      .getState()
      .addSectionBadgeNode(tempBlockId, type, label, position);

    // Create section with bounds around the badge node
    sectionId = `section_${(Date.now() + Math.random()).toString(36)}`;
    const section: CanvasSection = {
      id: sectionId,
      title: label,
      nodeIds: [nodeId],
      bounds: {
        x: position.x - 10,
        y: position.y - 10,
        width: 260,
        height: 160,
      },
      createdAt: Date.now(),
      linkedBlockId: tempBlockId, // Will be updated below
    };

    useCanvasStore.getState().addSection(section);
  }

  // Add to document store (it creates the block with ID)
  const block = useDocumentStore.getState().addBlock(type, insertIndex, sectionId);

  // Update the section's linkedBlockId now that we have the real block ID
  if (type !== 'text' && sectionId) {
    useCanvasStore.getState().updateSection(sectionId, {
      linkedBlockId: block.id,
    });

    // Also update the badge node's blockId
    const section = useCanvasStore.getState().sections.find((s) => s.id === sectionId);
    if (section && section.nodeIds.length > 0) {
      const nodeId = section.nodeIds[0];
      const node = useCanvasStore.getState().nodes.find((n) => n.id === nodeId);
      if (node && node.type === NODE_TYPE.SECTION_BADGE) {
        useCanvasStore.getState().updateNodeConfig(nodeId, { blockId: block.id });
      }
    }
  }

  return block;
}

/**
 * Remove a block from the document and clean up any associated canvas sections
 * Coordinates between documentStore and canvasStore
 */
export function removeBlockWithSectionCleanup(blockId: string): void {
  const blocks = useDocumentStore.getState().blocks;
  const block = blocks.find((b) => b.id === blockId);

  if (!block) return;

  // Find linked section and remove all its nodes from canvas
  const linkedSection = useCanvasStore.getState().sections.find(
    (s) => s.linkedBlockId === blockId
  );

  if (linkedSection) {
    const canvasStore = useCanvasStore.getState();
    for (const nodeId of linkedSection.nodeIds) {
      canvasStore.removeNode(nodeId);
    }
    // Remove the section itself
    canvasStore.removeSection(linkedSection.id);
  }

  // Remove from document store
  useDocumentStore.getState().removeBlock(blockId);
}
