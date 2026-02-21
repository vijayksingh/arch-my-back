import { useEffect, useState } from 'react';
import { widgetRegistry } from '../registry/widgetRegistry';
import type { WidgetEmbedMode, WidgetInstance } from '../types';

interface WidgetEmbedProps {
  widget: WidgetInstance;
  mode?: WidgetEmbedMode;
  interactive?: boolean;
  width?: string;
  height?: string;
  theme?: 'light' | 'dark';
}

/**
 * Widget Embed Component
 * Renders widgets in different embedding modes: inline, panel, iframe
 */
export function WidgetEmbed({
  widget,
  mode = 'inline',
  interactive = true,
  width,
  height,
  theme,
}: WidgetEmbedProps) {
  const [error, setError] = useState<string | null>(null);

  const definition = widgetRegistry.get(widget.widgetId);

  useEffect(() => {
    if (!definition) {
      setError(`Widget definition "${widget.widgetId}" not found`);
    } else {
      setError(null);
    }
  }, [definition, widget.widgetId]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-destructive/50 bg-destructive/10 p-4">
        <div className="text-center">
          <div className="text-sm font-medium text-destructive">
            Widget Error
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  if (!definition) {
    return null;
  }

  // Use embed component if available, otherwise use main component
  const Component = definition.embedComponent || definition.component;

  const embedConfig = {
    mode,
    interactive,
    width,
    height,
    theme,
  };

  const componentProps = definition.embedComponent
    ? {
        input: widget.input,
        config: widget.config,
        ...embedConfig,
      }
    : {
        instanceId: widget.id,
        input: widget.input,
        config: widget.config,
      };

  // Apply size constraints based on mode
  const containerStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || (mode === 'inline' ? 'auto' : '400px'),
  };

  return (
    <div
      className="widget-embed-container"
      style={containerStyle}
      data-widget-id={widget.widgetId}
      data-widget-instance-id={widget.id}
      data-embed-mode={mode}
    >
      <Component {...componentProps} />
    </div>
  );
}

/**
 * Generate embed URL for a widget instance
 * Can be used to embed widgets in external sites via iframe
 */
export function generateEmbedURL(
  widgetInstanceId: string,
  config?: {
    baseURL?: string;
    mode?: WidgetEmbedMode;
    interactive?: boolean;
    theme?: 'light' | 'dark';
  },
): string {
  const baseURL = config?.baseURL || window.location.origin;
  const params = new URLSearchParams();

  params.set('instance', widgetInstanceId);

  if (config?.mode) {
    params.set('mode', config.mode);
  }

  if (config?.interactive !== undefined) {
    params.set('interactive', config.interactive.toString());
  }

  if (config?.theme) {
    params.set('theme', config.theme);
  }

  return `${baseURL}/embed/widget?${params.toString()}`;
}

/**
 * Parse widget data from URL query parameters
 * Used by the embed page to render widgets from URL
 */
export function parseEmbedURL(
  searchParams: URLSearchParams,
): {
  instanceId: string;
  mode: WidgetEmbedMode;
  interactive: boolean;
  theme?: 'light' | 'dark';
} | null {
  const instanceId = searchParams.get('instance');

  if (!instanceId) {
    return null;
  }

  const mode = (searchParams.get('mode') as WidgetEmbedMode) || 'iframe';
  const interactive = searchParams.get('interactive') !== 'false';
  const theme = searchParams.get('theme') as 'light' | 'dark' | null;

  return {
    instanceId,
    mode,
    interactive,
    theme: theme || undefined,
  };
}
