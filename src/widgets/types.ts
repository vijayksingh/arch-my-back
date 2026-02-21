import type { JSONSchema7 } from 'json-schema';
import type { ComponentType } from 'react';

/**
 * Widget categories for organization in the sidebar
 */
export type WidgetCategory = 'visualization' | 'interaction' | 'context' | 'flow';

/**
 * Widget embedding modes
 */
export type WidgetEmbedMode = 'inline' | 'panel' | 'iframe';

/**
 * Widget definition - the blueprint for a widget type
 * Similar to ComponentTypeConfig, but for composable widgets
 */
export interface WidgetDefinition<
  TInput = unknown,
  TOutput = unknown,
  TConfig = unknown,
> {
  // Identification
  id: string; // e.g., "comparison-table"
  name: string; // e.g., "Comparison Table"
  category: WidgetCategory;
  icon: string; // Icon identifier
  description: string;
  tags: string[];

  // Input/Output Contracts (for composability)
  inputSchema: JSONSchema7; // What data this widget accepts
  outputSchema: JSONSchema7; // What data this widget produces

  // Configuration
  configSchema: JSONSchema7; // Widget settings (schema-driven forms)
  defaultConfig: TConfig;

  // Rendering
  component: ComponentType<WidgetProps<TInput, TOutput, TConfig>>;
  embedComponent?: ComponentType<WidgetEmbedProps<TInput, TOutput, TConfig>>;

  // Metadata
  examples: WidgetExample<TInput, TConfig>[];
}

/**
 * Widget instance - a specific usage of a widget definition
 */
export interface WidgetInstance<
  TInput = unknown,
  TOutput = unknown,
  TConfig = unknown,
> {
  id: string; // Unique instance ID
  widgetId: string; // Reference to WidgetDefinition.id
  config: TConfig;
  input?: TInput;
  output?: TOutput;
  position?: { x: number; y: number }; // For canvas placement
  embedMode?: WidgetEmbedMode;
}

/**
 * Widget connection - how widgets pipe data to each other
 */
export interface WidgetConnection {
  from: { widgetId: string; outputKey: string };
  to: { widgetId: string; inputKey: string };
  transform?: (data: unknown) => unknown; // Optional data transformation
}

/**
 * Widget flow - a composition of multiple widgets
 */
export interface WidgetFlow {
  id: string;
  name: string;
  widgets: WidgetInstance[];
  connections: WidgetConnection[];
  layout?: FlowLayout;
}

/**
 * Flow layout configuration
 */
export interface FlowLayout {
  type: 'horizontal' | 'vertical' | 'grid' | 'custom';
  spacing?: number;
}

/**
 * Widget example for documentation and testing
 */
export interface WidgetExample<TInput = unknown, TConfig = unknown> {
  name: string;
  description: string;
  input: TInput;
  config: TConfig;
}

/**
 * Props passed to widget components
 */
export interface WidgetProps<
  TInput = unknown,
  TOutput = unknown,
  TConfig = unknown,
> {
  instanceId: string;
  input?: TInput;
  config: TConfig;
  onOutput?: (output: TOutput) => void;
  onConfigChange?: (config: Partial<TConfig>) => void;
}

/**
 * Props passed to widget embed components
 */
export interface WidgetEmbedProps<
  TInput = unknown,
  _TOutput = unknown,
  TConfig = unknown,
> {
  input?: TInput;
  config: TConfig;
  mode: WidgetEmbedMode;
  interactive?: boolean;
  width?: string;
  height?: string;
  theme?: 'light' | 'dark';
}

/**
 * Widget embed configuration
 */
export interface WidgetEmbedConfig {
  mode: WidgetEmbedMode;
  interactive: boolean;
  width?: string;
  height?: string;
  theme?: 'light' | 'dark';
}
