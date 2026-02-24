import { useState, useCallback, useRef, useEffect } from 'react';
import { Rocket, LogOut, User, Home, ChevronRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery as useConvexQuery, useMutation } from 'convex/react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ShareButton';
import { SimulationControls } from '@/components/Simulation/SimulationControls';
import { useAuthActions, useQuery } from '@/lib/auth';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface ToolbarProps {
  designId?: Id<'newDesigns'>;
}

export function Toolbar({ designId }: ToolbarProps = {}) {
  const navigate = useNavigate();
  const [isBreadcrumbEditing, setIsBreadcrumbEditing] = useState(false);
  const [breadcrumbEditValue, setBreadcrumbEditValue] = useState('');
  const breadcrumbInputRef = useRef<HTMLInputElement>(null);

  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);

  // Breadcrumb navigation state (only when designId is provided)
  const design = useConvexQuery(
    api.newDesigns.get,
    designId ? { designId } : 'skip'
  );
  const updateTitle = useMutation(api.newDesigns.update);
  const folder = useConvexQuery(
    api.folders.list,
    design?.folderId ? {} : 'skip'
  );

  const currentFolder = folder?.find((f) => f._id === design?.folderId);

  // Focus input when entering breadcrumb edit mode
  useEffect(() => {
    if (isBreadcrumbEditing && breadcrumbInputRef.current) {
      breadcrumbInputRef.current.focus();
      breadcrumbInputRef.current.select();
    }
  }, [isBreadcrumbEditing]);

  const handleStartBreadcrumbEdit = useCallback(() => {
    if (design) {
      setBreadcrumbEditValue(design.title);
      setIsBreadcrumbEditing(true);
    }
  }, [design]);

  const handleSaveBreadcrumbEdit = useCallback(async () => {
    if (!design || !designId || !breadcrumbEditValue.trim()) {
      setIsBreadcrumbEditing(false);
      return;
    }

    if (breadcrumbEditValue.trim() !== design.title) {
      try {
        await updateTitle({ designId, title: breadcrumbEditValue.trim() });
      } catch (error) {
        console.error('Failed to update title:', error);
      }
    }

    setIsBreadcrumbEditing(false);
  }, [design, designId, breadcrumbEditValue, updateTitle]);

  const handleBreadcrumbKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveBreadcrumbEdit();
    } else if (e.key === 'Escape') {
      setIsBreadcrumbEditing(false);
    }
  }, [handleSaveBreadcrumbEdit]);

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

      {/* Center: breadcrumbs + simulation controls */}
      <div className="flex flex-1 items-center justify-center gap-3">
        {designId && design && (
          // Breadcrumb navigation for designs
          <div className="flex items-center gap-2 text-sm">
            {/* Home link */}
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </button>

            {/* Folder breadcrumb (if in folder) */}
            {currentFolder && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={() =>
                    navigate({
                      to: '/folder/$folderId',
                      params: { folderId: currentFolder._id },
                    })
                  }
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {currentFolder.title}
                </button>
              </>
            )}

            {/* Design title (editable) */}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isBreadcrumbEditing ? (
              <input
                ref={breadcrumbInputRef}
                type="text"
                value={breadcrumbEditValue}
                onChange={(e) => setBreadcrumbEditValue(e.target.value)}
                onBlur={handleSaveBreadcrumbEdit}
                onKeyDown={handleBreadcrumbKeyDown}
                className="rounded border border-accent bg-background px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            ) : (
              <button
                onClick={handleStartBreadcrumbEdit}
                className="rounded px-2 py-1 font-medium text-foreground transition-colors hover:bg-accent/10"
              >
                {design.title}
              </button>
            )}
          </div>
        )}

        {/* Simulation controls (renders only when initialized) */}
        <SimulationControls />
      </div>

      {/* Right: share and auth */}
      <div className="flex w-[310px] shrink-0 items-center justify-end gap-2">
        {/* Share button (when designId provided) */}
        {designId && <ShareButton designId={designId} />}

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
    </header>
  );
}
