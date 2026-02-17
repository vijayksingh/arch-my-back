import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import { ConfigPanel } from '@/components/ConfigPanel';
import { useCanvasStore } from '@/stores/canvasStore';
import { urlShortenerTemplate } from '@/templates/urlShortener';
import { loadDesign, setupAutosave } from '@/lib/persistence';

export default function App() {
  const fromJSON = useCanvasStore((s) => s.fromJSON);
  const loadDesignToStore = useCanvasStore((s) => s.loadDesign);
  const toJSON = useCanvasStore((s) => s.toJSON);

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
        <Sidebar />

        {/* Canvas area */}
        <div id="react-flow-canvas" className="absolute inset-0 bg-background">
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
        </div>

        {/* Config panel overlay */}
        <ConfigPanel />
      </div>
    </div>
  );
}
