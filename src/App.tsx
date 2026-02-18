import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import { ConfigPanel } from '@/components/ConfigPanel';
import { DocumentPanel } from '@/components/DocumentPanel';
import { CommandPalette } from '@/components/CommandPalette';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/canvasStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { urlShortenerTemplate } from '@/templates/urlShortener';
import { loadDesign, setupAutosave } from '@/lib/persistence';
import type { CanvasTool } from '@/types';

export default function App() {
  const canvasShellRef = useRef<HTMLDivElement>(null);
  const fromJSON = useCanvasStore((s) => s.fromJSON);
  const loadDesignToStore = useCanvasStore((s) => s.loadDesign);
  const toJSON = useCanvasStore((s) => s.toJSON);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const cycleViewMode = useWorkspaceStore((s) => s.cycleViewMode);
  const setActiveCanvasTool = useWorkspaceStore((s) => s.setActiveCanvasTool);
  const toggleDocumentEditorMode = useWorkspaceStore((s) => s.toggleDocumentEditorMode);

  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const closePalette = useCallback(() => setCmdPaletteOpen(false), []);

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

  useEffect(() => {
    const TOOL_KEYS: Record<string, CanvasTool> = {
      v: 'cursor', s: 'select', r: 'rectangle', c: 'circle', t: 'text',
    };

    const handler = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K — open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((v) => !v);
        return;
      }

      // Cmd/Ctrl+Shift+P — toggle document preview mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        toggleDocumentEditorMode();
        return;
      }

      // Cmd/Ctrl+\ — cycle view mode
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        cycleViewMode();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.getAttribute('contenteditable')) return;

      const tool = TOOL_KEYS[e.key.toLowerCase()];
      if (tool) setActiveCanvasTool(tool);
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setActiveCanvasTool, cycleViewMode, toggleDocumentEditorMode]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top toolbar */}
      <Toolbar />
      <CommandPalette open={cmdPaletteOpen} onClose={closePalette} />

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
