import type { ConfigField } from '@/types';

/**
 * JSON Schema property definition
 */
interface SchemaProperty {
  type: 'string' | 'integer' | 'number' | 'boolean';
  enum?: string[];
  default?: string | number | boolean;
  description?: string;
  minimum?: number;
  maximum?: number;
}

/**
 * JSON Schema object definition
 */
interface ConfigSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required: string[];
}

/**
 * Overrides for custom labels and field ordering
 */
export interface ConfigFieldOverrides {
  labels?: Record<string, string>;
  fieldOrder?: string[];
}

/**
 * Derives defaultConfig from a JSON Schema by extracting all default values
 */
export function deriveDefaultConfig(schema: ConfigSchema): Record<string, unknown> {
  const defaultConfig: Record<string, unknown> = {};

  for (const [key, property] of Object.entries(schema.properties)) {
    if ('default' in property && property.default !== undefined) {
      defaultConfig[key] = property.default;
    }
  }

  return defaultConfig;
}

/**
 * Converts a camelCase or snake_case field name to Title Case
 * Examples: maxConnections → Max Connections, cache_ttl → Cache TTL
 */
function formatFieldLabel(fieldName: string): string {
  // Handle snake_case
  const normalized = fieldName.replace(/_/g, ' ');

  // Split camelCase and add spaces
  const withSpaces = normalized.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Capitalize first letter of each word
  return withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Determines the ConfigField type from a JSON Schema property
 */
function deriveFieldType(property: SchemaProperty): 'text' | 'number' | 'select' {
  // If it has enum values, it's a select field
  if (property.enum && property.enum.length > 0) {
    return 'select';
  }

  // If it's a boolean, it's a select field with true/false options
  if (property.type === 'boolean') {
    return 'select';
  }

  // If it's a number or integer, it's a number field
  if (property.type === 'integer' || property.type === 'number') {
    return 'number';
  }

  // Default to text for strings without enum
  return 'text';
}

/**
 * Derives configFields from a JSON Schema by examining the required fields
 * Only fields in the 'required' array are considered user-editable
 */
export function deriveConfigFields(
  schema: ConfigSchema,
  overrides?: ConfigFieldOverrides
): ConfigField[] {
  const fields: ConfigField[] = [];

  // Only process fields that are in the required array
  const requiredFields = schema.required || [];

  for (const fieldKey of requiredFields) {
    const property = schema.properties[fieldKey];
    if (!property) continue;

    const field: ConfigField = {
      key: fieldKey,
      label: overrides?.labels?.[fieldKey] || formatFieldLabel(fieldKey),
      type: deriveFieldType(property),
      defaultValue: property.default as string | number,
    };

    // Add options for select fields
    if (field.type === 'select') {
      if (property.enum) {
        field.options = property.enum;
      } else if (property.type === 'boolean') {
        // Boolean fields are displayed as selects with 'true'/'false' strings
        field.options = ['true', 'false'];
        // Convert boolean default to string
        field.defaultValue = property.default ? 'true' : 'false';
      }
    }

    fields.push(field);
  }

  // Apply field ordering if specified in overrides
  if (overrides?.fieldOrder) {
    const orderMap = new Map(overrides.fieldOrder.map((key, index) => [key, index]));
    fields.sort((a, b) => {
      const aOrder = orderMap.get(a.key) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = orderMap.get(b.key) ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });
  }

  return fields;
}
