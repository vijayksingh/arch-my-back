import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import { ConfigPanel } from '@/components/ConfigPanel';
import { DocumentPanel } from '@/components/DocumentPanel';
import { CommandPalette } from '@/components/CommandPalette';
import { DesignHeader } from '@/components/DesignHeader';
import { cn } from '@/lib/utils';
import { useEditorStore, type CanvasTool } from '@/stores/editorStore';
import { useCurrentDesign } from '@/hooks/useCurrentDesign';
import { useDesignSync } from '@/hooks/useDesignSync';
import { useCanvasStore } from '@/stores/canvasStore';

// Lazy-load DSL editor
const DSLEditor = lazy(() => import('@/components/DSLEditor').then(m => ({ default: m.DSLEditor })));

export const Route = createFileRoute('/design/$designId')({
  component: DesignEditorPage,
});

function DesignEditorPage() {
  const { designId } = Route.useParams();
  const canvasShellRef = useRef<HTMLDivElement>(null);

  // Get current design (will use the designId from params)
  const { changeDesign, isLoading: designLoading } = useCurrentDesign();

  // Set the current design to match the URL param
  useEffect(() => {
    changeDesign(designId as any);
  }, [designId, changeDesign]);

  // Sync design canvas and blocks with Convex
  const { isLoading: syncLoading } = useDesignSync(designId as any);

  const viewMode = useEditorStore((s) => s.viewMode);
  const cycleViewMode = useEditorStore((s) => s.cycleViewMode);
  const setActiveCanvasTool = useEditorStore((s) => s.setActiveCanvasTool);
  const toggleDocumentEditorMode = useEditorStore((s) => s.toggleDocumentEditorMode);
  const dslEditorVisible = useEditorStore((s) => s.dslEditorVisible);

  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const closePalette = useCallback(() => setCmdPaletteOpen(false), []);

  const isLoading = designLoading || syncLoading;

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

      // Cmd/Ctrl+Z — undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useCanvasStore.temporal.getState().undo();
        return;
      }

      // Cmd/Ctrl+Shift+Z — redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useCanvasStore.temporal.getState().redo();
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

  // Show loading state while design is being set up
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading design...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top toolbar */}
      <Toolbar />
      <CommandPalette open={cmdPaletteOpen} onClose={closePalette} />

      {/* Breadcrumb header */}
      <DesignHeader designId={designId as any} />

      {/* Main content area below toolbar */}
      <div className="relative flex flex-1 overflow-hidden">
        {viewMode !== 'canvas' && (
          <div
            className={cn(
              'h-full min-w-0 bg-background',
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

            {/* Canvas area - split when DSL editor is visible */}
            <div
              id="react-flow-canvas"
              className={cn(
                'absolute inset-0 bg-background transition-all duration-200',
                dslEditorVisible && 'right-[40%]',
              )}
            >
              <ReactFlowProvider>
                <Canvas />
              </ReactFlowProvider>
            </div>

            {/* DSL Editor pane */}
            {dslEditorVisible && (
              <div className="absolute right-0 top-0 bottom-0 w-[40%]">
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center border-l border-border bg-background">
                      <div className="text-sm text-muted-foreground">Loading editor...</div>
                    </div>
                  }
                >
                  <DSLEditor />
                </Suspense>
              </div>
            )}

            {/* Config panel overlay */}
            <ConfigPanel />
          </div>
        )}
      </div>
    </div>
  );
}
