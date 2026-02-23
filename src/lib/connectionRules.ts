import { componentTypeMap } from '@/registry/componentTypes';

export interface ConnectionValidationResult {
  valid: boolean;
  warning?: string;
}

/**
 * Category-level connection validation rules.
 * Uses the component type registry to resolve categories dynamically.
 */
export function isConnectionValid(
  sourceType: string,
  targetType: string
): ConnectionValidationResult {
  // Resolve categories from component types
  const sourceComponent = componentTypeMap.get(sourceType);
  const targetComponent = componentTypeMap.get(targetType);

  // If either type is not registered, allow the connection (graceful degradation)
  if (!sourceComponent || !targetComponent) {
    return { valid: true };
  }

  const sourceCategory = sourceComponent.category;
  const targetCategory = targetComponent.category;

  // Hard Rules (block connection entirely)

  // Rule 1: Clients cannot connect directly to infrastructure layers
  if (sourceCategory === 'Clients') {
    const forbiddenTargets = [
      'Databases',
      'Caching',
      'Messaging',
      'ML / AI',
      'Observability',
      'Search & Analytics',
    ];

    if (forbiddenTargets.includes(targetCategory)) {
      return {
        valid: false,
        warning: `Clients cannot connect directly to ${targetCategory}. Use Traffic or Compute layers instead.`,
      };
    }
  }

  // Rule 2: DNS can only connect to Traffic and Compute nodes
  if (sourceType === 'dns') {
    const allowedTargets = ['Traffic', 'Compute'];
    if (!allowedTargets.includes(targetCategory)) {
      return {
        valid: false,
        warning: `DNS can only connect to Traffic or Compute nodes, not ${targetCategory}.`,
      };
    }
  }

  // Rule 3: Databases should not connect directly to other databases
  if (sourceCategory === 'Databases' && targetCategory === 'Databases') {
    return {
      valid: false,
      warning: 'Databases should not connect directly to other databases. Use Compute/Workers for data flows.',
    };
  }

  // Rule 4: Observability nodes are typically targets, not sources
  if (sourceCategory === 'Observability') {
    return {
      valid: false,
      warning: 'Observability nodes typically receive data, not send it. Consider reversing the connection direction.',
    };
  }

  // Soft Rules (show warning but allow)

  // Rule 5: Serverless → PostgreSQL connection pooling warning
  if (sourceType === 'serverless' && targetType === 'postgres') {
    return {
      valid: true,
      warning: 'Serverless functions connecting to PostgreSQL may face connection pooling issues. Consider using a connection pooler like PgBouncer.',
    };
  }

  // Rule 6: Self-connections
  if (sourceType === targetType) {
    return {
      valid: true,
      warning: 'Self-referential connection detected. This may indicate a circular dependency.',
    };
  }

  // All validation passed
  return { valid: true };
}

/**
 * Validates a connection between two nodes in the architecture diagram.
 * This function encapsulates the full validation pattern: find source/target nodes,
 * check if archComponent, check self-loop, call isConnectionValid.
 *
 * @param nodes - Array of nodes (must have id, type?, and data?)
 * @param connection - Connection object with source and target IDs
 * @returns Validation result with valid flag and optional warning
 */
export function validateArchConnection<
  T extends { id: string; type?: string; data?: any }
>(
  nodes: T[],
  connection: { source: string | null; target: string | null }
): ConnectionValidationResult {
  // Prevent self-loops
  if (connection.source === connection.target) {
    return { valid: false };
  }

  // Get source and target nodes to determine their types
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  // Only validate arch component connections (not shapes, badges, etc.)
  if (sourceNode?.type === 'archComponent' && targetNode?.type === 'archComponent') {
    const sourceType = sourceNode.data?.componentType;
    const targetType = targetNode.data?.componentType;

    // Ensure component types are defined
    if (sourceType && targetType) {
      return isConnectionValid(sourceType, targetType);
    }
  }

  // Allow all other connection types (shapes, badges, etc.)
  return { valid: true };
}
