import { useState, useCallback } from 'react';
import { Download, Trash2, BookOpen, Rocket, Moon, Sun, LogOut, User, Braces, Undo2, Redo2, LayoutGrid, Loader2 } from 'lucide-react';
import { useStore } from 'zustand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkspaceModeTabs } from '@/components/WorkspaceModeTabs';
import { TemplateBrowser } from '@/components/TemplateBrowser/TemplateBrowser';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { useThemeStore } from '@/stores/themeStore';
import { exportCanvasAsPng, exportCanvasAsSvg } from '@/lib/exportImage';
import { useAuthActions, useQuery } from '@/lib/auth';
import { api } from '../../../convex/_generated/api';

export function Toolbar() {
  const [designName, setDesignName] = useState('Untitled Design');
  const [isEditing, setIsEditing] = useState(false);
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);
  const [templateBrowserOpen, setTemplateBrowserOpen] = useState(false);

  const nodes = useCanvasStore((s) => s.nodes);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const dslEditorVisible = useEditorStore((s) => s.dslEditorVisible);
  const toggleDslEditor = useEditorStore((s) => s.toggleDslEditor);

  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);

  const { undo, redo, pastStates, futureStates } = useStore(
    useCanvasStore.temporal,
    (state) => state,
  );

  const handleOpenTemplateBrowser = useCallback(() => {
    setTemplateBrowserOpen(true);
  }, []);

  const handleExportPng = useCallback(() => {
    exportCanvasAsPng('react-flow-canvas', `${designName}.png`);
  }, [designName]);

  const handleExportSvg = useCallback(() => {
    exportCanvasAsSvg('react-flow-canvas', `${designName}.svg`);
  }, [designName]);

  const handleClear = useCallback(() => {
    if (window.confirm('Clear the entire canvas? This cannot be undone.')) {
      clearCanvas();
      setDesignName('Untitled Design');
    }
  }, [clearCanvas]);

  const handleAutoLayout = useCallback(async () => {
    setIsLayoutRunning(true);
    try {
      await autoLayout();
    } finally {
      setIsLayoutRunning(false);
    }
  }, [autoLayout]);

  const preloadLayout = useCallback(() => {
    void import('@/services/layoutService');
  }, []);

  const hasEnoughNodes = nodes.length >= 2;

  return (
    <header className="flex h-14 w-full shrink-0 items-center border-b border-border/80 bg-card px-4 backdrop-blur-xl">
      {/* Left: branding */}
      <div className="flex w-[250px] shrink-0 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-secondary shadow-sm">
          <Rocket className="h-4 w-4 text-foreground/90" strokeWidth={2} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">System Architect</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Architecture Studio
          </span>
        </div>
      </div>

      {/* Center: design name + workspace mode */}
      <div className="flex flex-1 items-center justify-center gap-3">
        {isEditing ? (
          <Input
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditing(false);
            }}
            name="designName"
            autoComplete="off"
            autoFocus
            className="h-8 w-72 border-border/60 bg-background/70 text-center text-sm font-medium shadow-none"
          />
        ) : (
          <Button
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 px-3 text-sm font-medium text-foreground/85 hover:text-foreground"
          >
            {designName}
          </Button>
        )}
        <WorkspaceModeTabs />
      </div>

      {/* Right: actions */}
      <div className="flex w-[310px] shrink-0 items-center justify-end gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border/75 bg-background/65 p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => undo()}
            title="Undo (Cmd+Z)"
            aria-label="Undo (Cmd+Z)"
            disabled={pastStates.length === 0}
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => redo()}
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo (Cmd+Shift+Z)"
            disabled={futureStates.length === 0}
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDslEditor}
            title={dslEditorVisible ? 'Hide DSL Editor' : 'Show DSL Editor'}
            aria-label={dslEditorVisible ? 'Hide DSL Editor' : 'Show DSL Editor'}
            className={`h-8 w-8 rounded-md ${dslEditorVisible ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Braces className="h-3.5 w-3.5" />
          </Button>
          {hasEnoughNodes && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAutoLayout}
              onMouseEnter={preloadLayout}
              disabled={isLayoutRunning}
              title="Auto Layout"
              aria-label="Auto Layout"
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLayoutRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LayoutGrid className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenTemplateBrowser}
            title="Browse Templates"
            aria-label="Browse Templates"
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Export"
                aria-label="Export"
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPng}>
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSvg}>
                Export as SVG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            title="Clear Canvas"
            aria-label="Clear Canvas"
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {/* Note: Autosave to Convex happens automatically via useDesignSync */}

        {/* Auth button */}
        {user && (
          <div className="flex items-center gap-2 rounded-xl border border-border/75 bg-background/65 px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              {/* Avatar circle with initial */}
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {user.email && user.email !== 'Unknown'
                  ? user.email.charAt(0).toUpperCase()
                  : <User className="h-3 w-3" />
                }
              </div>
              <span className="text-xs font-medium text-foreground/90">
                {user.email && user.email !== 'Unknown' ? user.email : 'Account'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void signOut()}
              title="Sign out"
              aria-label="Sign out"
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <TemplateBrowser
        open={templateBrowserOpen}
        onOpenChange={setTemplateBrowserOpen}
      />
    </header>
  );
}
