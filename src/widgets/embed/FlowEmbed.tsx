import { useEffect, useState } from 'react';
import { FlowEditor } from '../flow-editor/FlowEditor';
import type { WidgetFlow } from '../types';

interface FlowEmbedProps {
  flow: WidgetFlow;
  mode?: 'inline' | 'panel' | 'iframe';
  interactive?: boolean;
  width?: string;
  height?: string;
  theme?: 'light' | 'dark';
}

/**
 * Flow Embed Component
 * Renders widget flows in different embedding modes
 */
export function FlowEmbed({
  flow,
  mode = 'iframe',
  interactive = false,
  width,
  height,
  theme,
}: FlowEmbedProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flow) {
      setError('Flow not found');
    } else {
      setError(null);
    }
  }, [flow]);

  useEffect(() => {
    // Apply theme if specified
    if (theme) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-destructive/50 bg-destructive/10 p-4">
        <div className="text-center">
          <div className="text-sm font-medium text-destructive">Flow Error</div>
          <div className="mt-1 text-xs text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  // Apply size constraints based on mode
  const containerStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || (mode === 'inline' ? 'auto' : '600px'),
    pointerEvents: interactive ? 'auto' : 'none',
  };

  return (
    <div
      className="flow-embed-container"
      style={containerStyle}
      data-flow-id={flow.id}
      data-embed-mode={mode}
    >
      <FlowEditor flowId={flow.id} />
    </div>
  );
}
