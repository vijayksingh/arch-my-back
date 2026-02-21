/**
 * Lezer parser instance for archspec DSL
 *
 * This module exports the generated Lezer parser for use by CodeMirror
 * and our parser/serializer layer.
 */

/// <reference path="./parser-types.d.ts" />

// @ts-expect-error - Generated Lezer parser file
import { parser } from './archspec.parser.js';

export { parser };

// Re-export term constants for convenience
// @ts-expect-error - Generated Lezer terms file
export * from './archspec.parser.terms.js';
