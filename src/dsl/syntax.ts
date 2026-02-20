/**
 * Lezer parser instance for archspec DSL
 *
 * This module exports the generated Lezer parser for use by CodeMirror
 * and our parser/serializer layer.
 */

import { parser } from './archspec.parser.js';

export { parser };

// Re-export term constants for convenience
export * from './archspec.parser.terms.js';
