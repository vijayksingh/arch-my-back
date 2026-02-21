import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { useWidgetStore } from '../store/widgetStore';
import { widgetRegistry } from '../registry/widgetRegistry';
import { cn } from '@/lib/utils';

interface WidgetNodeData extends Record<string, unknown> {
  widgetInstanceId: string;
}

/**
 * WidgetNode - React Flow node component for rendering widget instances on canvas
 * Receives widgetInstanceId via node data, looks up instance from store, and renders the widget component
 */
function WidgetNode({ data, selected }: NodeProps) {
  const widgetInstance = useWidgetStore((s) => s.getWidget((data as WidgetNodeData).widgetInstanceId));

  if (!widgetInstance) {
    return (
      <div className="rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3">
        <p className="text-xs text-destructive">
          Widget instance not found: {(data as WidgetNodeData).widgetInstanceId}
        </p>
      </div>
    );
  }

  const definition = widgetRegistry.get(widgetInstance.widgetId);
  if (!definition) {
    return (
      <div className="rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3">
        <p className="text-xs text-destructive">
          Widget definition not found: {widgetInstance.widgetId}
        </p>
      </div>
    );
  }

  const WidgetComponent = definition.component;

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-card shadow-sm transition-shadow',
        selected ? 'border-primary shadow-lg' : 'border-border',
      )}
    >
      {/* Input handle */}
      {definition.inputSchema && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-background !bg-primary"
        />
      )}

      {/* Widget content */}
      <div className="min-h-[80px] min-w-[200px] p-3">
        <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
          <span className="text-xs font-medium text-card-foreground">
            {definition.name}
          </span>
        </div>
        <WidgetComponent
          instanceId={widgetInstance.id}
          config={widgetInstance.config}
          input={widgetInstance.input}
          onConfigChange={(newConfig) => {
            useWidgetStore.getState().updateWidgetConfig(widgetInstance.id, newConfig);
          }}
          onOutput={(newOutput) => {
            useWidgetStore.getState().updateWidgetOutput(widgetInstance.id, newOutput);
          }}
        />
      </div>

      {/* Output handle */}
      {definition.outputSchema && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-background !bg-primary"
        />
      )}
    </div>
  );
}

export default memo(WidgetNode);
