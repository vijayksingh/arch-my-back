/**
 * archspec CodeMirror language support
 *
 * Provides syntax highlighting, autocomplete, and linting for the archspec DSL
 */

import { LanguageSupport, LRLanguage } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { CompletionContext, autocompletion } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import type { Diagnostic } from '@codemirror/lint';
import { parser } from '@/dsl/syntax';
import { deserialize } from '@/dsl/deserializer';

/**
 * Create archspec language support with Lezer parser
 */
const archspecLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        'archspec architecture group vars simulation': t.keyword,
        'true false null': t.bool,
        ComponentType: t.typeName,
        String: t.string,
        Number: t.number,
        LineComment: t.lineComment,
        BlockComment: t.blockComment,
        Identifier: t.variableName,
        '-> <- <-> --': t.operator,
        '= : , ;': t.separator,
        '{ }': t.brace,
        '[ ]': t.squareBracket,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
  },
});

/**
 * Component type completions
 */
const componentTypes = [
  'load_balancer',
  'api_gateway',
  'cdn',
  'app_server',
  'worker',
  'serverless',
  'postgres',
  'object_storage',
  'redis',
  'kafka',
  'websocket',
  'external_api',
];

/**
 * DSL keyword completions
 */
const dslKeywords = [
  'archspec',
  'architecture',
  'group',
  'vars',
  'simulation',
  'true',
  'false',
  'null',
];

/**
 * Connection operator completions
 */
const connectionOperators = [
  { label: '->', detail: 'connection', type: 'keyword' },
  { label: '<->', detail: 'bidirectional', type: 'keyword' },
  { label: '<-', detail: 'reverse connection', type: 'keyword' },
  { label: '--', detail: 'undirected', type: 'keyword' },
];

/**
 * Autocomplete source
 */
function archspecCompletions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;

  const options = [
    ...componentTypes.map((type) => ({
      label: type,
      type: 'type',
      detail: 'component type',
    })),
    ...dslKeywords.map((keyword) => ({
      label: keyword,
      type: 'keyword',
      detail: 'keyword',
    })),
    ...connectionOperators,
  ];

  return {
    from: word.from,
    options,
  };
}

/**
 * Linter using deserializer diagnostics
 */
const archspecLinter = linter((view) => {
  const text = view.state.doc.toString();
  const result = deserialize(text);

  if (!result.diagnostics || result.diagnostics.length === 0) {
    return [];
  }

  const diagnostics: Diagnostic[] = result.diagnostics.map((diag) => ({
    from: diag.from,
    to: diag.to,
    severity: diag.severity as 'error' | 'warning' | 'info',
    message: diag.message,
  }));

  return diagnostics;
});

/**
 * Create archspec language support
 */
export function archspec() {
  return new LanguageSupport(archspecLanguage, [
    autocompletion({ override: [archspecCompletions] }),
    archspecLinter,
  ]);
}
