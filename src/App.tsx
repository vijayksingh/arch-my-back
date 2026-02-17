import { useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import { ConfigPanel } from '@/components/ConfigPanel';
import { DocumentPanel } from '@/components/DocumentPanel';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/canvasStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { urlShortenerTemplate } from '@/templates/urlShortener';
import { loadDesign, setupAutosave } from '@/lib/persistence';

export default function App() {
  const canvasShellRef = useRef<HTMLDivElement>(null);
  const fromJSON = useCanvasStore((s) => s.fromJSON);
  const loadDesignToStore = useCanvasStore((s) => s.loadDesign);
  const toJSON = useCanvasStore((s) => s.toJSON);
  const viewMode = useWorkspaceStore((s) => s.viewMode);

  useEffect(() => {
    // Try to restore autosaved design
    const saved = loadDesign('autosave');
    if (saved) {
      fromJSON(saved);
    } else {
      // Load default template so canvas isn't empty
      loadDesignToStore(
        urlShortenerTemplate.nodes,
        urlShortenerTemplate.edges,
      );
    }
  }, [fromJSON, loadDesignToStore]);

  useEffect(() => {
    const cleanup = setupAutosave(() => toJSON(), 30000);
    return cleanup;
  }, [toJSON]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top toolbar */}
      <Toolbar />

      {/* Main content area below toolbar */}
      <div className="relative flex flex-1 overflow-hidden">
        {viewMode !== 'canvas' && (
          <div
            className={cn(
              'h-full min-w-0 bg-background/75',
              viewMode === 'both' && 'w-[min(42rem,42vw)] max-w-2xl border-r ui-border-ghost',
              viewMode === 'document' && 'w-full',
            )}
          >
            <DocumentPanel />
          </div>
        )}

        {viewMode !== 'document' && (
          <div
            ref={canvasShellRef}
            className="relative flex h-full min-w-0 flex-1 overflow-hidden bg-background"
          >
            <Sidebar containerRef={canvasShellRef} />

            {/* Canvas area */}
            <div id="react-flow-canvas" className="absolute inset-0 bg-background">
              <ReactFlowProvider>
                <Canvas />
              </ReactFlowProvider>
            </div>

            {/* Config panel overlay */}
            <ConfigPanel />
          </div>
        )}
      </div>
    </div>
  );
}
