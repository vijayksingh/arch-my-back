/**
 * Low-Level Design status discriminators
 * Tracks the maturity/review status of LLD blocks
 */
export const LLD_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  FINAL: 'final',
} as const;

export type LLDStatusId = typeof LLD_STATUS[keyof typeof LLD_STATUS];
