import { z } from 'zod';
import { ArchspecDocumentSchema, type ArchspecDocument } from './archspecZodSchema';

/**
 * Result type for validation operations
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * Structured validation error with path and message
 */
export interface ValidationError {
  path: (string | number)[];
  message: string;
}

/**
 * Validate archspec JSON input against the Zod schema
 *
 * @param input - Unknown input to validate (typically parsed JSON)
 * @returns Typed ArchspecDocument or structured validation errors
 *
 * @example
 * ```typescript
 * const result = validateArchspec(jsonData);
 * if (result.success) {
 *   console.log('Valid archspec:', result.data);
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateArchspec(input: unknown): ValidationResult<ArchspecDocument> {
  const result = ArchspecDocumentSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Transform Zod v4 errors to our structured format
  // In Zod v4, errors are stored in the message as JSON string
  const zodErrors = JSON.parse(result.error.message);
  const errors: ValidationError[] = zodErrors.map((err: any) => ({
    path: err.path,
    message: err.message,
  }));

  return { success: false, errors };
}

/**
 * Validate and throw on error (for contexts where exceptions are appropriate)
 *
 * @param input - Unknown input to validate
 * @returns Typed ArchspecDocument
 * @throws {z.ZodError} If validation fails
 */
export function validateArchspecStrict(input: unknown): ArchspecDocument {
  return ArchspecDocumentSchema.parse(input);
}
