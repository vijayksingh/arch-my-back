import { v } from "convex/values";

/**
 * Shared Convex validators - Single source of truth for enums and data shapes
 * These validators are used in:
 * - Schema definitions (schema.ts)
 * - Mutation/query arguments (all function files)
 * - Frontend types (via Infer<typeof validator>)
 */

// --- Enums ---

export const blockTypeValidator = v.union(
  v.literal("text"),
  v.literal("requirements"),
  v.literal("schema"),
  v.literal("api"),
  v.literal("lld")
);

// Node types as registered in Canvas.tsx nodeTypes map
// NOTE: React Flow uses this string to look up the component to render.
// These MUST match the keys in Canvas.tsx's nodeTypes object.
export const nodeTypeValidator = v.union(
  v.literal("archComponent"),     // not "archNode" — matches Canvas.tsx registration
  v.literal("shapeRect"),         // 3 separate shape types, not one "shapeNode"
  v.literal("shapeCircle"),
  v.literal("shapeText"),
  v.literal("sectionBadge")
);

export const httpMethodValidator = v.union(
  v.literal("GET"),
  v.literal("POST"),
  v.literal("PUT"),
  v.literal("PATCH"),
  v.literal("DELETE")
);

export const lldStatusValidator = v.union(
  v.literal("draft"),
  v.literal("review"),
  v.literal("final")
);

export const requirementKindValidator = v.union(
  v.literal("functional"),
  v.literal("non-functional")
);

// --- Typed node data (replaces v.any()) ---

// Matches ArchNodeData in src/types/index.ts
export const archNodeDataValidator = v.object({
  componentType: v.string(),
  label: v.string(),
  config: v.record(v.string(), v.any()),  // always present, type-specific config fields
});

// Matches CanvasShapeNodeData in src/types/index.ts
// Field is "shape" not "shapeType"
export const shapeNodeDataValidator = v.object({
  label: v.string(),                      // required in code
  shape: v.union(v.literal("rectangle"), v.literal("circle"), v.literal("text")),
  fontSize: v.optional(v.number()),
});

// Matches SectionBadgeNodeData in src/types/index.ts
// Fields are blockId + blockType + label, NOT sectionId
export const sectionBadgeDataValidator = v.object({
  blockId: v.string(),
  blockType: blockTypeValidator,
  label: v.string(),
});

// Node data union — Convex discriminates by structural matching
// archNode has unique required field: componentType
// shapeNode has unique required field: shape
// sectionBadge has unique required field: blockId
export const nodeDataValidator = v.union(
  archNodeDataValidator,
  shapeNodeDataValidator,
  sectionBadgeDataValidator
);

// --- Typed block data (matches actual data shapes from src/types/index.ts) ---

// TextBlockData: { markdown: string }
export const textBlockDataValidator = v.object({
  markdown: v.string(),
});

// RequirementsBlockData: { items: Array<{ id, text, kind }> }
export const requirementsBlockDataValidator = v.object({
  items: v.array(v.object({
    id: v.string(),
    text: v.string(),
    kind: requirementKindValidator,
  })),
});

// SchemaBlockData: { tables: Array<{ id, name, fields: Array<{ id, name, fieldType, constraints }> }> }
export const schemaBlockDataValidator = v.object({
  tables: v.array(v.object({
    id: v.string(),
    name: v.string(),
    fields: v.array(v.object({
      id: v.string(),
      name: v.string(),
      fieldType: v.string(),
      constraints: v.string(),
    })),
  })),
});

// ApiBlockData: { endpoints: Array<{ id, method, path, description, requestBody, responseBody }> }
export const apiBlockDataValidator = v.object({
  endpoints: v.array(v.object({
    id: v.string(),
    method: httpMethodValidator,
    path: v.string(),
    description: v.string(),
    requestBody: v.string(),
    responseBody: v.string(),
  })),
});

// LldBlockData: { title, summary?, content, status? }
export const lldBlockDataValidator = v.object({
  title: v.string(),
  summary: v.optional(v.string()),
  content: v.string(),
  status: v.optional(lldStatusValidator),
});

// --- Composite validators ---

// ⚠️ cleanNodeForStorage() in sync hook MUST strip React Flow runtime fields
// (selected, dragging, positionAbsolute, resizing, etc.) before saving.
// Only whitelisted fields should reach the validator.
export const canvasNodeValidator = v.object({
  id: v.string(),
  type: nodeTypeValidator,
  position: v.object({ x: v.number(), y: v.number() }),
  data: nodeDataValidator,
  style: v.optional(v.record(v.string(), v.any())),
  measured: v.optional(v.object({ width: v.number(), height: v.number() })),
});

// Edge data — port is number (matching ArchEdgeData.port?: number)
export const canvasEdgeValidator = v.object({
  id: v.string(),
  source: v.string(),
  target: v.string(),
  type: v.optional(v.string()),
  data: v.optional(v.object({
    label: v.optional(v.string()),
    protocol: v.optional(v.string()),
    port: v.optional(v.number()),     // number, not string (8080, 6379, etc.)
  })),
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
});

export const canvasSectionValidator = v.object({
  id: v.string(),
  title: v.string(),
  nodeIds: v.array(v.string()),
  bounds: v.object({
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
  }),
  createdAt: v.number(),
  linkedBlockId: v.optional(v.string()),
});

export const viewportValidator = v.object({
  x: v.number(),
  y: v.number(),
  zoom: v.number(),
});

// Block validator — data is discriminated by the type field
// Each block type has a structurally unique data shape, so Convex union works
export const blockValidator = v.object({
  id: v.string(),
  type: blockTypeValidator,
  sectionId: v.union(v.string(), v.null()),
  data: v.union(
    textBlockDataValidator,         // has: markdown
    requirementsBlockDataValidator, // has: items
    schemaBlockDataValidator,       // has: tables
    apiBlockDataValidator,          // has: endpoints
    lldBlockDataValidator,          // has: title + content
  ),
  createdAt: v.number(),
});
