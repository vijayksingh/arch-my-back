import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { Infer } from "convex/values";
import type {
  archNodeDataValidator,
  shapeNodeDataValidator,
  sectionBadgeDataValidator,
  blockTypeValidator,
  nodeTypeValidator,
  httpMethodValidator,
  lldStatusValidator,
  requirementKindValidator,
  canvasSectionValidator,
  viewportValidator,
  blockValidator,
} from "../../convex/validators";
import type { Node, Edge } from "@xyflow/react";

/**
 * Design types derived from Convex schema
 * Uses Doc<> and Infer<> to avoid type duplication
 */

// --- Table-level types (use Doc<> directly) ---

export type DesignMeta = Doc<"newDesigns">;
export type Folder = Doc<"folders">;
export type DesignCanvas = Doc<"designCanvases">;
export type DesignBlocksDoc = Doc<"designBlocks">;

// --- Sub-types derived from shared validators ---

export type BlockType = Infer<typeof blockTypeValidator>;
export type NodeType = Infer<typeof nodeTypeValidator>;
export type HttpMethod = Infer<typeof httpMethodValidator>;
export type LldStatus = Infer<typeof lldStatusValidator>;
export type RequirementKind = Infer<typeof requirementKindValidator>;

export type ArchNodeData = Infer<typeof archNodeDataValidator>;
export type ShapeNodeData = Infer<typeof shapeNodeDataValidator>;
export type SectionBadgeData = Infer<typeof sectionBadgeDataValidator>;

export type CanvasNodeData = ArchNodeData | ShapeNodeData | SectionBadgeData;

export type CanvasSection = Infer<typeof canvasSectionValidator>;
export type Viewport = Infer<typeof viewportValidator>;
export type NotebookBlock = Infer<typeof blockValidator>;

// --- React Flow wrappers (bridge Convex types to React Flow) ---

export type ArchNode = Node<ArchNodeData, "archComponent">;
export type CanvasShapeNode = Node<
  ShapeNodeData,
  "shapeRect" | "shapeCircle" | "shapeText"
>;
export type SectionBadgeNode = Node<SectionBadgeData, "sectionBadge">;

export type CanvasNode = ArchNode | CanvasShapeNode | SectionBadgeNode;

export interface ArchEdgeData {
  protocol?: string;
  port?: number;
  label?: string;
  [key: string]: unknown;
}

export type ArchEdge = Edge<ArchEdgeData>;

// --- Convenience types ---

export type DesignId = Id<"newDesigns">;
export type FolderId = Id<"folders">;

/** Full design data loaded when opening the editor */
export interface DesignFull {
  meta: DesignMeta;
  canvas: DesignCanvas;
  blocks: DesignBlocksDoc;
}
