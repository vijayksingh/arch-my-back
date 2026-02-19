import { useState, useCallback } from 'react';
import Download from 'lucide-react/dist/esm/icons/download';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Rocket from 'lucide-react/dist/esm/icons/rocket';
import Moon from 'lucide-react/dist/esm/icons/moon';
import Sun from 'lucide-react/dist/esm/icons/sun';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import User from 'lucide-react/dist/esm/icons/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkspaceModeTabs } from '@/components/WorkspaceModeTabs';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { useCanvasStore } from '@/stores/canvasStore';
import { useThemeStore } from '@/stores/themeStore';
import { urlShortenerTemplate } from '@/templates/urlShortener';
import { exportCanvasAsPng } from '@/lib/exportImage';
import { useAuthActions, useQuery } from '@/lib/auth';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface ToolbarProps {
  currentWorkspaceId: Id<'workspaces'> | null;
  onWorkspaceChange: (workspaceId: Id<'workspaces'>) => void;
}

export function Toolbar({ currentWorkspaceId, onWorkspaceChange }: ToolbarProps) {
  const [designName, setDesignName] = useState('Untitled Design');
  const [isEditing, setIsEditing] = useState(false);

  const loadDesign = useCanvasStore((s) => s.loadDesign);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);

  const handleLoadTemplate = useCallback(() => {
    loadDesign(urlShortenerTemplate.nodes, urlShortenerTemplate.edges);
    setDesignName(urlShortenerTemplate.title);
  }, [loadDesign]);

  const handleExport = useCallback(() => {
    exportCanvasAsPng('react-flow-canvas', `${designName}.png`);
  }, [designName]);

  const handleClear = useCallback(() => {
    if (window.confirm('Clear the entire canvas? This cannot be undone.')) {
      clearCanvas();
      setDesignName('Untitled Design');
    }
  }, [clearCanvas]);

  return (
    <header className="flex h-14 w-full shrink-0 items-center border-b border-border/80 bg-card/90 px-4 backdrop-blur-xl">
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

      {/* Center: workspace switcher + design name + workspace mode */}
      <div className="flex flex-1 items-center justify-center gap-3">
        <WorkspaceSwitcher
          currentWorkspaceId={currentWorkspaceId}
          onWorkspaceChange={onWorkspaceChange}
        />
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
            onClick={handleLoadTemplate}
            title="Load Template"
            aria-label="Load Template"
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            title="Export PNG"
            aria-label="Export PNG"
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
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
        {/* Note: Autosave to Convex happens automatically via useWorkspaceSync */}

        {/* Auth button */}
        {user && (
          <div className="flex items-center gap-2 rounded-xl border border-border/75 bg-background/65 px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground/90">
                {user.email}
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
    </header>
  );
}
