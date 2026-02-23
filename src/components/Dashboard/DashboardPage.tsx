import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from '@tanstack/react-router';
import { PlusIcon, FolderPlus, Layers } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { DesignListItem } from './DesignCard';
import { DashboardHeader } from './DashboardHeader';
import { DesignGrid } from './DesignGrid';
import { FolderGrid } from './FolderGrid';
import { WalkthroughGrid } from './WalkthroughGrid';
import { TemplateGallery } from './TemplateGallery';
import { useAIGeneration } from './hooks/useAIGeneration';
import { useDashboardDragDrop } from './hooks/useDashboardDragDrop';
import { DashboardDndProvider } from './DashboardDndContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const designs = useQuery(api.newDesigns.list);
  const folders = useQuery(api.folders.list);
  const createDesign = useMutation(api.newDesigns.create);
  const createFolder = useMutation(api.folders.create);

  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Custom hooks
  const { handleAIGenerate } = useAIGeneration();
  const {
    sensors,
    activeDesign,
    overedFolderId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDashboardDragDrop();

  const handleCreateDesign = async () => {
    const now = new Date();
    const title = `Untitled Design ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    try {
      const designId = await createDesign({ title });
      navigate({ to: '/design/$designId', params: { designId } });
    } catch (error) {
      console.error('Failed to create design:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder({ title: newFolderName.trim() });
      setNewFolderName('');
      setShowFolderDialog(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleFolderDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    }
  };

  // Filter designs by type
  const myDesigns = designs?.filter(d => !d.isExample) || [];
  const exampleDesigns = designs?.filter(d => d.isExample === true) || [];

  // Count designs per folder (only for user designs)
  const folderDesignCounts = new Map<string, number>();
  myDesigns.forEach((design) => {
    if (design.folderId) {
      folderDesignCounts.set(
        design.folderId,
        (folderDesignCounts.get(design.folderId) || 0) + 1
      );
    }
  });

  // Separate user designs in folders vs at root
  const rootMyDesigns = myDesigns.filter((d) => !d.folderId);

  const isLoading = designs === undefined || folders === undefined;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <DashboardDndProvider overedFolderId={overedFolderId}>
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        {/* Header */}
        <DashboardHeader
          onCreateDesign={handleCreateDesign}
          onCreateFolder={() => setShowFolderDialog(true)}
          onAIGenerate={handleAIGenerate}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6">
            {/* Empty state when no designs or folders */}
            {rootMyDesigns.length === 0 && (!folders || folders.length === 0) ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center text-center max-w-md">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30">
                    <Layers className="h-10 w-10 text-muted-foreground/60" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold">Create your first design</h2>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Start with a blank canvas or try a template
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateDesign} size="default" className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      New Design
                    </Button>
                    <Button onClick={() => setShowFolderDialog(true)} variant="outline" size="default" className="gap-2">
                      <FolderPlus className="h-4 w-4" />
                      New Folder
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Recent Designs */}
                <DesignGrid designs={rootMyDesigns} title="Recent Designs" maxVisible={8} />

                {/* Folders */}
                {folders && folders.length > 0 && (
                  <FolderGrid
                    folders={folders}
                    folderDesignCounts={folderDesignCounts}
                  />
                )}
              </>
            )}

            {/* Templates */}
            <section className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Start from a Template</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pre-configured architectures
                  </p>
                </div>
                <button className="text-sm text-muted-foreground hover:text-foreground">
                  Browse all →
                </button>
              </div>
              <TemplateGallery compact={true} maxVisible={5} />
            </section>

            {/* Interactive Walkthroughs */}
            <WalkthroughGrid />

            {/* Example Designs */}
            {exampleDesigns.length > 0 && (
              <section className="mb-6">
                <div className="mb-4">
                  <h2 className="text-base font-semibold">Example Architectures</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pre-built diagrams to explore
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {exampleDesigns.slice(0, 4).map((design) => (
                    <div key={design._id} className="relative">
                      <DesignListItem design={design} />
                      <Badge
                        variant="secondary"
                        className="absolute top-3 right-3 bg-primary/10 text-primary pointer-events-none text-xs"
                      >
                        Example
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Folder creation dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleFolderDialogKeyDown}
              placeholder="Folder name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowFolderDialog(false);
                  setNewFolderName('');
                }}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </DashboardDndProvider>

      {/* Drag Overlay - shows ghost card during drag */}
    <DragOverlay>
      {activeDesign && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-lg opacity-90">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{activeDesign.title}</span>
        </div>
      )}
    </DragOverlay>
  </DndContext>
  );
}
