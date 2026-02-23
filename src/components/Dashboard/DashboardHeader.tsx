import { PlusIcon, FolderPlus, Layers, Sun, Moon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/themeStore';
import { AIPromptBar } from '@/components/AIPromptBar';

interface DashboardHeaderProps {
  onCreateDesign: () => void;
  onCreateFolder: () => void;
  onAIGenerate: (prompt: string) => Promise<void>;
}

/**
 * Dashboard header with branding, actions, and AI prompt bar
 */
export function DashboardHeader({
  onCreateDesign,
  onCreateFolder,
  onAIGenerate,
}: DashboardHeaderProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div>
      {/* Top bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          {/* Left: Branding */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold">System Architect</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={onCreateDesign} size="sm" className="gap-1.5">
              <PlusIcon className="h-4 w-4" />
              New Design
            </Button>
            <Button onClick={onCreateFolder} variant="outline" size="sm" className="gap-1.5">
              <FolderPlus className="h-4 w-4" />
              Folder
            </Button>
            <div className="ml-1 flex items-center gap-0.5 border-l border-border pl-2">
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                className="h-8 w-8"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" aria-label="User menu" className="h-8 w-8">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Greeting + AI Prompt */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <h1 className="text-lg font-semibold mb-3">Welcome back</h1>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
          <span className="text-2xl">✨</span>
          <div className="flex-1">
            <AIPromptBar onGenerate={onAIGenerate} />
          </div>
        </div>
      </div>
    </div>
  );
}
