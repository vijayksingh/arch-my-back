/**
 * Branded types for type-safe IDs and keys.
 * These prevent accidental mixing of different ID types.
 */

// Branded type utility
type Brand<K, T> = K & { __brand: T };

/**
 * Branded type for node IDs
 */
export type NodeId = Brand<string, 'NodeId'>;

/**
 * Branded type for edge IDs
 */
export type EdgeId = Brand<string, 'EdgeId'>;

/**
 * Branded type for section IDs
 */
export type SectionId = Brand<string, 'SectionId'>;

/**
 * Branded type for component type keys
 */
export type ComponentTypeKey = Brand<string, 'ComponentTypeKey'>;

/**
 * Smart constructor for NodeId with validation
 */
export function createNodeId(value: string): NodeId | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return value as NodeId;
}

/**
 * Smart constructor for EdgeId with validation
 */
export function createEdgeId(value: string): EdgeId | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return value as EdgeId;
}

/**
 * Smart constructor for SectionId with validation
 */
export function createSectionId(value: string): SectionId | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return value as SectionId;
}

/**
 * Smart constructor for ComponentTypeKey with validation
 */
export function createComponentTypeKey(value: string): ComponentTypeKey | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return value as ComponentTypeKey;
}

/**
 * Unsafe versions for migrations and JSON parsing where validation happens elsewhere
 */
export const unsafeNodeId = (value: string): NodeId => value as NodeId;
export const unsafeEdgeId = (value: string): EdgeId => value as EdgeId;
export const unsafeSectionId = (value: string): SectionId => value as SectionId;
export const unsafeComponentTypeKey = (value: string): ComponentTypeKey =>
  value as ComponentTypeKey;

/**
 * Type guards
 */
export function isNodeId(value: unknown): value is NodeId {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isEdgeId(value: unknown): value is EdgeId {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isSectionId(value: unknown): value is SectionId {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isComponentTypeKey(value: unknown): value is ComponentTypeKey {
  return typeof value === 'string' && value.trim().length > 0;
}
