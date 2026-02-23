/**
 * TypeScript types for archspec AST nodes
 */

export interface ArchspecDocument {
  type: 'Document';
  header: Header;
  architecture: Architecture;
}

export interface Header {
  type: 'Header';
  version: string;
}

export interface Architecture {
  type: 'Architecture';
  name: string;
  body: Body;
}

export interface Body {
  type: 'Body';
  items: (VarsBlock | GroupDecl | ComponentDecl | Connection | SimulationBlock)[];
}

export interface VarsBlock {
  type: 'VarsBlock';
  declarations: VarDecl[];
}

export interface VarDecl {
  type: 'VarDecl';
  identifier: string;
  value: Value;
}

export interface GroupDecl {
  type: 'GroupDecl';
  identifier: string;
  name: string;
  body: Body;
}

export interface ComponentDecl {
  type: 'ComponentDecl';
  identifier: string;
  componentType: ComponentType;
  name: string;
  properties: PropertyBlock;
}

export type ComponentType =
  | 'client_browser'
  | 'client_mobile'
  | 'load_balancer'
  | 'api_gateway'
  | 'cdn'
  | 'dns'
  | 'app_server'
  | 'worker'
  | 'serverless'
  | 'postgres'
  | 'object_storage'
  | 'mysql'
  | 'mongodb'
  | 'cassandra'
  | 'dynamodb'
  | 'redis'
  | 'elasticsearch'
  | 'data_warehouse'
  | 'ml_model'
  | 'vector_db'
  | 'logging'
  | 'metrics'
  | 'kafka'
  | 'websocket'
  | 'message_queue'
  | 'external_api'
  | 'payment_gateway'
  | 'auth_provider';

export interface PropertyBlock {
  type: 'PropertyBlock';
  properties: Property[];
}

export interface Property {
  type: 'Property';
  identifier: string;
  value: Value;
}

export interface Connection {
  type: 'Connection';
  chain: ConnectionChain;
  properties?: PropertyBlock;
}

export interface ConnectionChain {
  type: 'ConnectionChain';
  nodes: ConnectionNode[];
  operators: ConnectionOp[];
}

export interface ConnectionNode {
  type: 'ConnectionNode';
  identifier: string;
}

export type ConnectionOp = '->' | '<->' | '<-' | '--';

export interface SimulationBlock {
  type: 'SimulationBlock';
  properties: PropertyBlock;
}

export type Value =
  | StringValue
  | NumberValue
  | BooleanValue
  | NullValue
  | ArrayValue
  | VariableRef;

export interface StringValue {
  type: 'string';
  value: string;
}

export interface NumberValue {
  type: 'number';
  value: number;
}

export interface BooleanValue {
  type: 'boolean';
  value: boolean;
}

export interface NullValue {
  type: 'null';
}

export interface ArrayValue {
  type: 'array';
  elements: Value[];
}

export interface VariableRef {
  type: 'VariableRef';
  identifier: string;
}
