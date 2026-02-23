import { z } from 'zod';

/**
 * Zod schema for archspec JSON interchange format
 * Used by AI SDK for structured output generation and runtime validation
 */

// Valid component types from the registry
export const ComponentTypeEnum = z.enum([
  'client_browser',
  'client_mobile',
  'load_balancer',
  'api_gateway',
  'cdn',
  'dns',
  'app_server',
  'worker',
  'serverless',
  'postgres',
  'object_storage',
  'mysql',
  'mongodb',
  'cassandra',
  'dynamodb',
  'redis',
  'elasticsearch',
  'data_warehouse',
  'ml_model',
  'vector_db',
  'logging',
  'metrics',
  'kafka',
  'websocket',
  'message_queue',
  'external_api',
  'payment_gateway',
  'auth_provider',
]).describe('Type of architectural component from the registry');

// Component schema
export const ComponentSchema = z.object({
  id: z.string().describe('Unique identifier for the component (e.g., "api", "db")'),
  type: ComponentTypeEnum,
  label: z.string().describe('Human-readable display name for the component'),
  group: z.string().optional().describe('Optional group ID this component belongs to'),
  config: z.record(z.string(), z.any()).optional().describe('Optional component-specific configuration (runtime, replicas, etc.)'),
}).describe('A single architectural component (server, database, service, etc.)');

// Group schema
export const GroupSchema = z.object({
  id: z.string().describe('Unique identifier for the group'),
  label: z.string().describe('Human-readable name for the group (e.g., "Edge Layer", "Storage")'),
  parent: z.string().nullable().describe('Parent group ID for nested groups, or null for top-level groups'),
}).describe('A logical grouping of components for organization');

// Connection configuration
export const ConnectionConfigSchema = z.object({
  protocol: z.string().optional().describe('Communication protocol (e.g., "HTTPS", "TCP", "AMQP")'),
  port: z.number().optional().describe('Port number for the connection'),
  mode: z.enum(['sync', 'async']).optional().describe('Synchronous or asynchronous communication pattern'),
  fanOut: z.number().min(0).optional().describe('Fan-out ratio for load distribution (0.0-1.0+, default 1.0)'),
  label: z.string().optional().describe('Optional label for the connection edge'),
}).describe('Optional configuration for a connection between components');

// Connection schema
export const ConnectionSchema = z.object({
  from: z.string().describe('Source component ID'),
  to: z.string().describe('Target component ID'),
  config: ConnectionConfigSchema.optional().describe('Optional connection configuration'),
}).describe('A directed connection from one component to another');

// Root archspec document
export const ArchspecDocumentSchema = z.object({
  archspec_version: z.string().describe('Version of the archspec format (currently "1.0")'),
  name: z.string().describe('Name of the architecture (e.g., "E-Commerce Platform")'),
  components: z.array(ComponentSchema).describe('List of architectural components'),
  groups: z.array(GroupSchema).optional().describe('Optional list of component groups for organization'),
  connections: z.array(ConnectionSchema).describe('List of connections between components'),
}).describe('Complete architectural specification document in JSON interchange format');

// Export TypeScript types inferred from Zod schemas
export type ComponentType = z.infer<typeof ComponentTypeEnum>;
export type Component = z.infer<typeof ComponentSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type ConnectionConfig = z.infer<typeof ConnectionConfigSchema>;
export type Connection = z.infer<typeof ConnectionSchema>;
export type ArchspecDocument = z.infer<typeof ArchspecDocumentSchema>;
