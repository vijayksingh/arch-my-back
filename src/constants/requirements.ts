/**
 * Requirement kind discriminators
 * Categorizes requirements in the requirements block
 */
export const REQUIREMENT_KIND = {
  FUNCTIONAL: 'functional',
  NON_FUNCTIONAL: 'non-functional',
} as const;

export type RequirementKindId = typeof REQUIREMENT_KIND[keyof typeof REQUIREMENT_KIND];
