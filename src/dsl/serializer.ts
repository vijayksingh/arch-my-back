/**
 * archspec JSON → DSL text serializer
 *
 * Converts validated archspec JSON back to canonical DSL format.
 * This is the "pretty printer" that produces consistent, parseable output.
 */

import type { ArchspecDocument, Component, Group, Connection } from './archspecZodSchema.js';

/**
 * Serialization options
 */
export interface SerializeOptions {
  /** Indentation string (default: '  ' - 2 spaces) */
  indent?: string;
  /** Include blank lines between sections (default: true) */
  spacing?: boolean;
}

/**
 * Serialize archspec JSON to DSL text
 *
 * @param doc - Validated ArchspecDocument
 * @param options - Formatting options
 * @returns Canonical DSL text
 *
 * @example
 * ```typescript
 * const dslText = serialize({
 *   archspec_version: '1.0',
 *   name: 'E-Commerce',
 *   components: [
 *     { id: 'api', type: 'app_server', label: 'API Server' }
 *   ],
 *   connections: [
 *     { from: 'api', to: 'db' }
 *   ]
 * });
 * ```
 */
export function serialize(doc: ArchspecDocument, options: SerializeOptions = {}): string {
  const indent = options.indent ?? '  ';
  const spacing = options.spacing ?? true;

  const lines: string[] = [];

  // Header - convert version to integer format (grammar expects "v1" not "v1.0")
  const versionInt = doc.archspec_version.split('.')[0]; // "1.0" -> "1"
  lines.push(`archspec v${versionInt}`);
  if (spacing) lines.push('');

  // Architecture
  lines.push(`architecture "${escapeString(doc.name)}" {`);

  // Build group hierarchy
  const groupMap = new Map<string, Group>();
  const topLevelGroups: Group[] = [];
  if (doc.groups) {
    for (const group of doc.groups) {
      groupMap.set(group.id, group);
      if (group.parent === null) {
        topLevelGroups.push(group);
      }
    }
  }

  // Serialize body
  const bodyLines = serializeBody(doc, topLevelGroups, groupMap, indent, spacing);
  lines.push(...bodyLines.map(line => indent + line));

  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Serialize architecture body (components, groups, connections)
 */
function serializeBody(
  doc: ArchspecDocument,
  groups: Group[],
  groupMap: Map<string, Group>,
  indent: string,
  spacing: boolean,
  currentGroupId?: string
): string[] {
  const lines: string[] = [];

  // Filter components for this level
  const components = doc.components.filter(c => c.group === currentGroupId);

  // Serialize groups first
  for (const group of groups) {
    const childGroups = (doc.groups ?? []).filter(g => g.parent === group.id);
    const groupLines = serializeGroup(group, doc, childGroups, groupMap, indent, spacing);
    lines.push(...groupLines);
    if (spacing && groupLines.length > 0) lines.push('');
  }

  // Serialize components
  for (const component of components) {
    const componentLines = serializeComponent(component, indent);
    lines.push(...componentLines);
  }

  if (spacing && components.length > 0 && doc.connections.length > 0) {
    lines.push('');
  }

  // Serialize connections (only at top level)
  if (!currentGroupId) {
    for (const connection of doc.connections) {
      const connLines = serializeConnection(connection, indent);
      lines.push(...connLines);
    }
  }

  return lines;
}

/**
 * Serialize a group declaration
 */
function serializeGroup(
  group: Group,
  doc: ArchspecDocument,
  childGroups: Group[],
  groupMap: Map<string, Group>,
  indent: string,
  spacing: boolean
): string[] {
  const lines: string[] = [];

  lines.push(`${group.id} = group "${escapeString(group.label)}" {`);

  const bodyLines = serializeBody(doc, childGroups, groupMap, indent, spacing, group.id);
  lines.push(...bodyLines.map(line => indent + line));

  lines.push('}');

  return lines;
}

/**
 * Serialize a component declaration
 */
function serializeComponent(component: Component, indent: string): string[] {
  const lines: string[] = [];

  // Map JSON types back to DSL types
  const typeMap: Record<string, string> = {
    'load_balancer': 'api_gateway', // Best approximation
    'api_gateway': 'api_gateway',
    'cdn': 'cdn',
    'app_server': 'app_server',
    'worker': 'worker',
    'serverless': 'app_server', // No serverless in grammar
    'postgres': 'postgres',
    'object_storage': 'object_storage',
    'redis': 'cache',
    'kafka': 'event_stream',
    'websocket': 'app_server', // No websocket in grammar
    'external_api': 'api_gateway', // Best approximation
  };

  const dslType = typeMap[component.type] || component.type;

  let line = `${component.id} = ${dslType} "${escapeString(component.label)}"`;

  if (component.config && Object.keys(component.config).length > 0) {
    // Filter out empty keys (parsing artifacts)
    const validEntries = Object.entries(component.config).filter(([key]) => key.trim() !== '');

    if (validEntries.length > 0) {
      line += ' {';
      lines.push(line);

      for (const [key, value] of validEntries) {
        lines.push(`${indent}${key}: ${serializeValue(value)}`);
      }

      lines.push('}');
    } else {
      line += ' {}';
      lines.push(line);
    }
  } else {
    line += ' {}';
    lines.push(line);
  }

  return lines;
}

/**
 * Serialize a connection
 */
function serializeConnection(connection: Connection, indent: string): string[] {
  const lines: string[] = [];

  let line = `${connection.from} -> ${connection.to}`;

  if (connection.config && Object.keys(connection.config).length > 0) {
    line += ' {';
    lines.push(line);

    for (const [key, value] of Object.entries(connection.config)) {
      lines.push(`${indent}${key}: ${serializeValue(value)}`);
    }

    lines.push('}');
  } else {
    lines.push(line);
  }

  return lines;
}

/**
 * Serialize a value (string, number, boolean, null, array)
 */
function serializeValue(value: any): string {
  if (value === null) {
    return 'null';
  } else if (typeof value === 'string') {
    return `"${escapeString(value)}"`;
  } else if (typeof value === 'number') {
    return String(value);
  } else if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  } else if (Array.isArray(value)) {
    return '[' + value.map(serializeValue).join(', ') + ']';
  } else if (typeof value === 'object') {
    // Objects not supported in DSL, convert to string
    return `"${escapeString(JSON.stringify(value))}"`;
  }
  return 'null';
}

/**
 * Escape string for DSL (add quotes escaping)
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
