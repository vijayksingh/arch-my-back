import { useQuery, useMutation, useAction } from 'convex/react';
import { useNavigate } from '@tanstack/react-router';
import { PlusIcon, FolderPlus, Layers, Sun, Moon, User } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { DesignListItem } from './DesignCard';
import { FolderCard } from './FolderCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useThemeStore } from '@/stores/themeStore';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { AIPromptBar } from '@/components/AIPromptBar';
import { toCanvasNodes } from '@/dsl/canvasAdapter';
import { useCanvasStore } from '@/stores/canvasStore';
import { TemplateGallery } from './TemplateGallery';

export function DashboardPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const designs = useQuery(api.newDesigns.list);
  const folders = useQuery(api.folders.list);
  const createDesign = useMutation(api.newDesigns.create);
  const createFolder = useMutation(api.folders.create);
  const moveToFolder = useMutation(api.newDesigns.moveToFolder);
  const generateArchitecture = useAction(api.aiGeneration.generateArchitecture);
  const { loadDesign } = useCanvasStore();

  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Drag-and-drop state
  const [activeDesign, setActiveDesign] = useState<Doc<'newDesigns'> | null>(null);
  const [overedFolderId, setOveredFolderId] = useState<Id<'folders'> | null>(null);

  // Configure drag sensors with distance threshold to prevent click interception
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

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

  const handleAIGenerate = async (prompt: string) => {
    try {
      // Call the AI generation action
      const result = await generateArchitecture({ prompt });

      // Parse the generated JSON
      const archspecDoc = JSON.parse(result.content);

      // Convert to canvas nodes/edges format
      const { nodes, edges } = toCanvasNodes(archspecDoc);

      // Create a new design with AI-generated content
      const now = new Date();
      const title = archspecDoc.metadata?.title || `AI Generated ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      const designId = await createDesign({ title });

      // Load the generated nodes/edges into the canvas store
      // Cast nodes to CanvasNode[] as toCanvasNodes returns a compatible but different type
      loadDesign(nodes as any, edges);

      // Navigate to the new design
      navigate({ to: '/design/$designId', params: { designId } });

    } catch (error: any) {
      // Re-throw to let AIPromptBar handle error display
      throw error;
    }
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'design') {
      setActiveDesign(active.data.current.design);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over?.data.current?.type === 'folder') {
      setOveredFolderId(over.id as Id<'folders'>);
    } else {
      setOveredFolderId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear drag state
    setActiveDesign(null);
    setOveredFolderId(null);

    // Check if dropped on a folder
    if (
      over?.data.current?.type === 'folder' &&
      active.data.current?.type === 'design'
    ) {
      const design = active.data.current.design as Doc<'newDesigns'>;
      const targetFolderId = over.id as Id<'folders'>;

      // Don't move if already in that folder
      if (design.folderId === targetFolderId) {
        return;
      }

      try {
        await moveToFolder({ designId: design._id, folderId: targetFolderId });
      } catch (error) {
        console.error('Failed to move design to folder:', error);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDesign(null);
    setOveredFolderId(null);
  };

  // Count designs per folder
  const folderDesignCounts = new Map<string, number>();
  designs?.forEach((design) => {
    if (design.folderId) {
      folderDesignCounts.set(
        design.folderId,
        (folderDesignCounts.get(design.folderId) || 0) + 1
      );
    }
  });

  // Separate designs in folders vs at root
  const rootDesigns = designs?.filter((d) => !d.folderId) || [];

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
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        {/* Header */}
        <div className="border-b border-border px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Branding */}
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold tracking-tight">System Architect</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button onClick={handleCreateDesign} size="default">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Design
              </Button>
              <Button onClick={() => setShowFolderDialog(true)} variant="outline" size="default">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" aria-label="User menu">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* AI Prompt Bar */}
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="mx-auto max-w-4xl">
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Generate with AI
            </h3>
            <AIPromptBar onGenerate={handleAIGenerate} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Template Gallery */}
        <TemplateGallery />

        {/* Empty state */}
        {rootDesigns.length === 0 && (!folders || folders.length === 0) ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center text-center py-24">
              <div className="mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
                <Layers className="h-16 w-16 text-muted-foreground/50 relative" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Create your first architecture</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Start with a blank canvas or choose a template above
              </p>
              <Button onClick={handleCreateDesign} size="lg">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Design
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Folders section */}
            {folders && folders.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Folders
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder._id}
                      folder={folder}
                      designCount={folderDesignCounts.get(folder._id) || 0}
                      isDropTarget={overedFolderId === folder._id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Designs section */}
            {rootDesigns.length > 0 && (
              <div>
                <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {folders && folders.length > 0 ? 'Recent Designs' : 'All Designs'}
                </h2>
                <div className="flex flex-col gap-2">
                  {rootDesigns.map((design) => (
                    <DesignListItem key={design._id} design={design} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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
