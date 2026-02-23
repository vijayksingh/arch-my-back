/**
 * Notebook block type discriminators
 * Used as the `type` field in NotebookBlock objects
 */
export const BLOCK_TYPE = {
  TEXT: 'text',
  REQUIREMENTS: 'requirements',
  SCHEMA: 'schema',
  API: 'api',
  LLD: 'lld',
} as const;

export type BlockTypeId = typeof BLOCK_TYPE[keyof typeof BLOCK_TYPE];
