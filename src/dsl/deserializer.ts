/**
 * DSL text → archspec JSON deserializer
 *
 * Uses the Lezer parser to convert archspec DSL text into the JSON interchange format.
 * Handles variable resolution, connection chain expansion, and error recovery.
 */

import { parser } from './syntax.js';
import type { SyntaxNode } from '@lezer/common';
import { validateArchspec, type ValidationResult } from './validator.js';
import type { ArchspecDocument } from './archspecZodSchema.js';
import * as terms from './archspec.parser.terms.js';

/**
 * Diagnostic message for parse or semantic errors
 */
export interface Diagnostic {
  severity: 'error' | 'warning';
  message: string;
  from: number;
  to: number;
}

/**
 * Result of deserializing DSL text
 */
export interface DeserializeResult {
  success: boolean;
  data?: ArchspecDocument;
  diagnostics: Diagnostic[];
}

/**
 * Deserialize DSL text to archspec JSON
 *
 * @param dslText - The archspec DSL source code
 * @returns Validated ArchspecDocument or diagnostics
 *
 * @example
 * ```typescript
 * const result = deserialize(`archspec v1
 * architecture "E-Commerce" {
 *   api = app_server "API" { runtime: "node" }
 *   db = postgres "Database" {}
 *   api -> db { protocol: "postgres" }
 * }`);
 *
 * if (result.success) {
 *   console.log('Components:', result.data.components);
 * } else {
 *   console.error('Errors:', result.diagnostics);
 * }
 * ```
 */
export function deserialize(dslText: string): DeserializeResult {
  const diagnostics: Diagnostic[] = [];

  // Parse DSL text with Lezer
  const tree = parser.parse(dslText);

  // Collect syntax errors
  tree.iterate({
    enter(node) {
      if (node.type.isError) {
        diagnostics.push({
          severity: 'error',
          message: 'Syntax error',
          from: node.from,
          to: node.to,
        });
      }
    }
  });

  // Try to extract structure even with errors (partial recovery)
  try {
    const doc = extractDocument(tree.topNode, dslText);

    // Validate against Zod schema
    const validation = validateArchspec(doc);

    if (validation.success) {
      return {
        success: diagnostics.length === 0,
        data: validation.data,
        diagnostics,
      };
    } else {
      // Add validation errors as diagnostics
      for (const error of validation.errors) {
        diagnostics.push({
          severity: 'error',
          message: `Validation: ${error.path.join('.')}: ${error.message}`,
          from: 0,
          to: 0, // No source location for validation errors
        });
      }
      return { success: false, diagnostics };
    }
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      from: 0,
      to: 0,
    });
    return { success: false, diagnostics };
  }
}

/**
 * Extract archspec document from parse tree
 */
function extractDocument(node: SyntaxNode, source: string): any {
  const vars = new Map<string, any>();
  const components: any[] = [];
  const groups: any[] = [];
  const connections: any[] = [];
  let archName = 'Untitled';
  let archspecVersion = '1.0';

  // Find Header node for version
  const header = node.getChild('Header');
  if (header) {
    const versionNode = header.getChild('archspec')?.nextSibling;
    if (versionNode) {
      const versionText = source.substring(versionNode.from, versionNode.to);
      archspecVersion = versionText.replace(/^v/, '');
    }
  }

  // Find Architecture node
  const arch = node.getChild('Architecture');
  if (arch) {
    // Extract architecture name - it's between the "architecture" keyword and Body
    const archKeywordNode = arch.getChild('architecture');
    const body = arch.getChild('Body');

    if (archKeywordNode && body) {
      const betweenText = source.substring(archKeywordNode.to, body.from).trim();
      if (betweenText.startsWith('"')) {
        archName = parseStringLiteral(betweenText);
      }
    }

    // Process body
    if (body) {
      processBody(body, source, vars, components, groups, connections);
    }
  }

  return {
    archspec_version: archspecVersion,
    name: archName,
    components,
    groups: groups.length > 0 ? groups : undefined,
    connections,
  };
}

/**
 * Process Body node and its items
 *
 * Note: Body children are BodyItem nodes, which wrap the actual content.
 * We need to look at BodyItem's child to find ComponentDecl/GroupDecl/Connection.
 */
function processBody(
  body: SyntaxNode,
  source: string,
  vars: Map<string, any>,
  components: any[],
  groups: any[],
  connections: any[],
  parentGroupId?: string
): void {
  let cursor = body.firstChild;

  while (cursor) {
    // Handle BodyItem wrapper nodes
    if (cursor.type.id === terms.BodyItem) {
      const child = cursor.firstChild;
      if (child) {
        if (child.type.id === terms.VarsBlock) {
          processVarsBlock(child, source, vars);
        } else if (child.type.id === terms.ComponentDecl) {
          const component = processComponentDecl(child, source, vars, parentGroupId);
          if (component) components.push(component);
        } else if (child.type.id === terms.GroupDecl) {
          const group = processGroupDecl(child, source, vars, components, groups, connections, parentGroupId);
          if (group) groups.push(group);
        } else if (child.type.id === terms.Connection) {
          const conns = processConnection(child, source, vars);
          connections.push(...conns);
        }
        // SimulationBlock is not part of the JSON schema yet
      }
    }
    // Also handle direct children (in case grammar changes or for error recovery)
    else if (cursor.type.id === terms.VarsBlock) {
      processVarsBlock(cursor, source, vars);
    } else if (cursor.type.id === terms.ComponentDecl) {
      const component = processComponentDecl(cursor, source, vars, parentGroupId);
      if (component) components.push(component);
    } else if (cursor.type.id === terms.GroupDecl) {
      const group = processGroupDecl(cursor, source, vars, components, groups, connections, parentGroupId);
      if (group) groups.push(group);
    } else if (cursor.type.id === terms.Connection) {
      const conns = processConnection(cursor, source, vars);
      connections.push(...conns);
    }

    cursor = cursor.nextSibling;
  }
}

/**
 * Process VarsBlock and collect variable declarations
 */
function processVarsBlock(node: SyntaxNode, source: string, vars: Map<string, any>): void {
  let cursor = node.firstChild;

  while (cursor) {
    if (cursor.type.id === terms.VarDecl) {
      const { identifier, value } = processVarDecl(cursor, source, vars);
      vars.set(identifier, value);
    }
    cursor = cursor.nextSibling;
  }
}

/**
 * Process VarDecl node
 *
 * Note: The identifier is NOT a child node - extract from text before ":"
 */
function processVarDecl(node: SyntaxNode, source: string, vars: Map<string, any>): { identifier: string; value: any } {
  // Extract identifier from the text before the ":" sign
  const declText = source.substring(node.from, node.to);
  const colonIndex = declText.indexOf(':');
  const identifier = colonIndex >= 0 ? declText.substring(0, colonIndex).trim() : 'unnamed';

  let value: any = null;

  let cursor = node.firstChild;
  while (cursor) {
    if (cursor.type.id === terms.Value) {
      value = processValue(cursor, source, vars);
    }
    cursor = cursor.nextSibling;
  }

  return { identifier, value };
}

/**
 * Process ComponentDecl node
 *
 * Note: Neither the identifier NOR the label string are child nodes.
 * - Identifier: extract text before "="
 * - Label: extract string literal between ComponentType and PropertyBlock
 */
function processComponentDecl(
  node: SyntaxNode,
  source: string,
  vars: Map<string, any>,
  groupId?: string
): any {
  // Extract identifier from the text before the "=" sign
  const declText = source.substring(node.from, node.to);
  const eqIndex = declText.indexOf('=');
  const identifier = eqIndex >= 0 ? declText.substring(0, eqIndex).trim() : 'unnamed';

  let componentType = '';
  let componentTypeEnd = 0;
  let config: Record<string, any> = {};
  let propBlockStart = 0;

  let cursor = node.firstChild;
  while (cursor) {
    if (cursor.type.id === terms.ComponentType) {
      componentType = source.substring(cursor.from, cursor.to);
      componentTypeEnd = cursor.to;
    } else if (cursor.type.id === terms.PropertyBlock) {
      config = processPropertyBlock(cursor, source, vars);
      propBlockStart = cursor.from;
    }
    cursor = cursor.nextSibling;
  }

  // Extract label string between ComponentType and PropertyBlock
  let label = identifier; // default to identifier if no label found
  if (componentTypeEnd > 0 && propBlockStart > 0) {
    const betweenText = source.substring(componentTypeEnd, propBlockStart).trim();
    if (betweenText.startsWith('"')) {
      label = parseStringLiteral(betweenText);
    }
  }

  // Map DSL component types to JSON schema types
  const typeMap: Record<string, string> = {
    'cdn': 'cdn',
    'waf': 'load_balancer', // waf not in schema, map to load_balancer
    'api_gateway': 'api_gateway',
    'app_server': 'app_server',
    'worker': 'worker',
    'postgres': 'postgres',
    'cache': 'redis', // cache → redis
    'object_storage': 'object_storage',
    'event_stream': 'kafka', // event_stream → kafka
  };

  return {
    id: identifier,
    type: typeMap[componentType] || componentType,
    label,
    group: groupId,
    config: Object.keys(config).length > 0 ? config : undefined,
  };
}

/**
 * Process GroupDecl node
 *
 * Note: Like ComponentDecl, identifier and label are NOT child nodes.
 * - Identifier: extract text before "="
 * - Label: extract string literal between "group" keyword and Body
 */
function processGroupDecl(
  node: SyntaxNode,
  source: string,
  vars: Map<string, any>,
  components: any[],
  groups: any[],
  connections: any[],
  parentGroupId?: string
): any {
  // Extract identifier from the text before the "=" sign
  const declText = source.substring(node.from, node.to);
  const eqIndex = declText.indexOf('=');
  const identifier = eqIndex >= 0 ? declText.substring(0, eqIndex).trim() : 'unnamed';

  let label = identifier; // default to identifier
  let groupKeywordEnd = 0;
  let bodyStart = 0;

  let cursor = node.firstChild;
  while (cursor) {
    if (cursor.type.id === terms.group) {
      groupKeywordEnd = cursor.to;
    } else if (cursor.type.id === terms.Body) {
      bodyStart = cursor.from;
      // Process nested components/groups
      processBody(cursor, source, vars, components, groups, connections, identifier);
    }
    cursor = cursor.nextSibling;
  }

  // Extract label string between "group" keyword and Body
  if (groupKeywordEnd > 0 && bodyStart > 0) {
    const betweenText = source.substring(groupKeywordEnd, bodyStart).trim();
    if (betweenText.startsWith('"')) {
      label = parseStringLiteral(betweenText);
    }
  }

  return {
    id: identifier,
    label,
    parent: parentGroupId ?? null,
  };
}

/**
 * Process Connection node and expand chains
 */
function processConnection(node: SyntaxNode, source: string, vars: Map<string, any>): any[] {
  let chain: string[] = [];
  let operators: string[] = [];
  let config: Record<string, any> = {};

  let cursor = node.firstChild;
  while (cursor) {
    if (cursor.type.id === terms.ConnectionChain) {
      ({ chain, operators } = processConnectionChain(cursor, source));
    } else if (cursor.type.id === terms.PropertyBlock) {
      config = processPropertyBlock(cursor, source, vars);
    }
    cursor = cursor.nextSibling;
  }

  // Expand chain into individual connections
  const connections: any[] = [];
  for (let i = 0; i < operators.length; i++) {
    const op = operators[i];
    const from = chain[i];
    const to = chain[i + 1];

    if (op === '->' || op === '--') {
      connections.push({
        from,
        to,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
    } else if (op === '<-') {
      connections.push({
        from: to,
        to: from,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
    } else if (op === '<->') {
      connections.push({
        from,
        to,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
      connections.push({
        from: to,
        to: from,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
    }
  }

  return connections;
}

/**
 * Process ConnectionChain node
 *
 * Note: ConnectionNode doesn't have an Identifier child - it IS the identifier.
 * The node span directly contains the identifier text.
 */
function processConnectionChain(node: SyntaxNode, source: string): { chain: string[]; operators: string[] } {
  const chain: string[] = [];
  const operators: string[] = [];

  let cursor = node.firstChild;
  while (cursor) {
    if (cursor.type.id === terms.ConnectionNode) {
      // ConnectionNode span IS the identifier text
      chain.push(source.substring(cursor.from, cursor.to).trim());
    } else if (cursor.type.id === terms.ConnectionOp) {
      operators.push(source.substring(cursor.from, cursor.to));
    }
    cursor = cursor.nextSibling;
  }

  return { chain, operators };
}

/**
 * Process PropertyBlock node
 */
function processPropertyBlock(node: SyntaxNode, source: string, vars: Map<string, any>): Record<string, any> {
  const props: Record<string, any> = {};

  let cursor = node.firstChild;
  while (cursor) {
    if (cursor.type.id === terms.Property) {
      const { identifier, value } = processProperty(cursor, source, vars);
      props[identifier] = value;
    }
    cursor = cursor.nextSibling;
  }

  return props;
}

/**
 * Process Property node
 *
 * Note: Property identifier is NOT a child node - extract from text before ":"
 * Grammar: identifier ":" Value
 */
function processProperty(node: SyntaxNode, source: string, vars: Map<string, any>): { identifier: string; value: any } {
  // Extract identifier from the text before the ":" sign
  const propText = source.substring(node.from, node.to);
  const colonIndex = propText.indexOf(':');
  const identifier = colonIndex >= 0 ? propText.substring(0, colonIndex).trim() : '';

  let value: any = null;

  let cursor = node.firstChild;
  while (cursor) {
    if (cursor.type.id === terms.Value) {
      value = processValue(cursor, source, vars);
    }
    cursor = cursor.nextSibling;
  }

  return { identifier, value };
}

/**
 * Process Value node and resolve variable references
 *
 * Note: For strings and numbers, Value has NO children - the value is in the Value span itself.
 * For keywords (true/false/null) and complex types (arrays, variable refs), Value HAS children.
 */
function processValue(node: SyntaxNode, source: string, vars: Map<string, any>): any {
  const child = node.firstChild;

  if (child) {
    // Value has a child - check for keywords and complex types
    if (child.type.id === terms._true) {
      return true;
    } else if (child.type.id === terms._false) {
      return false;
    } else if (child.type.id === terms._null) {
      return null;
    } else if (child.type.name === 'Array') {
      return processArray(child, source, vars);
    } else if (child.type.id === terms.VariableRef) {
      return processVariableRef(child, source, vars);
    }
  } else {
    // Value has NO children - it's a literal string or number in the Value span
    const valueText = source.substring(node.from, node.to).trim();

    if (valueText.startsWith('"')) {
      // String literal
      return parseStringLiteral(valueText);
    } else if (!isNaN(parseFloat(valueText))) {
      // Number literal
      return parseFloat(valueText);
    }
  }

  return null;
}

/**
 * Process Array node
 */
function processArray(node: SyntaxNode, source: string, vars: Map<string, any>): any[] {
  const elements: any[] = [];

  let cursor = node.firstChild;
  while (cursor) {
    if (cursor.type.id === terms.Value) {
      elements.push(processValue(cursor, source, vars));
    }
    cursor = cursor.nextSibling;
  }

  return elements;
}

/**
 * Process VariableRef node and resolve it
 */
function processVariableRef(node: SyntaxNode, source: string, vars: Map<string, any>): any {
  const idNode = node.getChild('Identifier');
  if (idNode) {
    const identifier = source.substring(idNode.from, idNode.to);
    return vars.get(identifier) ?? null;
  }
  return null;
}

/**
 * Parse string literal (remove quotes and handle escapes)
 */
function parseStringLiteral(text: string): string {
  // Remove surrounding quotes
  const inner = text.slice(1, -1);

  // Handle escape sequences
  return inner
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}
