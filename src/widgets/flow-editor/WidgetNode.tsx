import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { widgetRegistry } from '../registry/widgetRegistry';
import type { WidgetInstance } from '../types';

interface WidgetNodeData {
  widget: WidgetInstance;
  onOutput?: (output: unknown) => void;
}

/**
 * Custom React Flow node for widgets
 * Displays widget info and handles for connections
 */
export const WidgetNode = memo(({ data }: NodeProps<WidgetNodeData>) => {
  const { widget, onOutput } = data;
  const definition = widgetRegistry.get(widget.widgetId);

  if (!definition) {
    return (
      <div className="rounded border border-destructive bg-destructive/10 p-2">
        <div className="text-xs font-medium text-destructive">
          Unknown Widget
        </div>
        <div className="text-xs text-muted-foreground">{widget.widgetId}</div>
      </div>
    );
  }

  const Component = definition.component;

  return (
    <div className="relative rounded-lg border-2 border-border bg-card shadow-lg">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !bg-primary"
        id="input"
      />

      {/* Widget content */}
      <div className="min-w-[200px] max-w-[400px]">
        {/* Header */}
        <div className="border-b border-border bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{definition.icon}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{definition.name}</div>
              <div className="text-xs text-muted-foreground">
                {widget.id.slice(0, 12)}...
              </div>
            </div>
          </div>
        </div>

        {/* Preview of widget */}
        <div className="max-h-[200px] overflow-hidden p-2">
          <div className="scale-75 origin-top-left">
            <Component
              instanceId={widget.id}
              input={widget.input}
              config={widget.config}
              onOutput={onOutput}
            />
          </div>
        </div>

        {/* Footer with status */}
        <div className="border-t border-border bg-muted/30 px-3 py-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {widget.input && (
              <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-green-700 dark:text-green-300">
                Has Input
              </span>
            )}
            {widget.output && (
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-blue-700 dark:text-blue-300">
                Has Output
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !bg-primary"
        id="output"
      />
    </div>
  );
});

WidgetNode.displayName = 'WidgetNode';
