/**
 * ID generators for canvas entities using crypto.randomUUID()
 * Replaces mutable module-level counters from audit finding L3
 */

export function generateNodeId(): string {
  return `node_${crypto.randomUUID()}`;
}

export function createSectionId(): string {
  return `section_${crypto.randomUUID()}`;
}
