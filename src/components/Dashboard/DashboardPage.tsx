import { useQuery, useMutation, useAction } from 'convex/react';
import { useNavigate } from '@tanstack/react-router';
import { PlusIcon, FolderPlus, Layers, Sun, Moon, User } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { DesignListItem } from './DesignCard';
import { FolderCard } from './FolderCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Interactive walkthrough metadata
const WALKTHROUGHS = [
  {
    slug: 'netflix-recommendation',
    title: 'Netflix Recommendation System',
    description: '105-minute deep dive into ML-powered recommendations at scale',
    duration: '105 min',
    steps: 15,
    difficulty: 'Intermediate',
    topics: ['Machine Learning', 'Microservices', 'A/B Testing'],
  },
  {
    slug: 'stripe-payments',
    title: 'Stripe Payment Processing',
    description: '105-minute walkthrough of idempotent payment systems',
    duration: '105 min',
    steps: 14,
    difficulty: 'Advanced',
    topics: ['Idempotency', 'State Machines', 'PCI Compliance'],
  },
  {
    slug: 'instagram-feed',
    title: 'Instagram System Design',
    description: '90-minute exploration of feed generation at billion-user scale',
    duration: '90 min',
    steps: 15,
    difficulty: 'Advanced',
    topics: ['Feed Generation', 'CDN', 'Graph Database'],
  },
  {
    slug: 'uber-dispatch',
    title: 'Uber Real-Time Dispatch',
    description: '100-minute hands-on with geospatial algorithms and surge pricing',
    duration: '100 min',
    steps: 14,
    difficulty: 'Advanced',
    topics: ['Geospatial', 'Real-time', 'ETA Prediction'],
  },
  {
    slug: 'twitter-feed',
    title: 'Twitter/X Feed Ranking',
    description: '105-minute journey through fan-out strategies and ML ranking',
    duration: '105 min',
    steps: 15,
    difficulty: 'Advanced',
    topics: ['Fan-out', 'ML Ranking', 'Trending Topics'],
  },
] as const;

// WalkthroughCard component
interface WalkthroughCardProps {
  walkthrough: typeof WALKTHROUGHS[number];
}

function WalkthroughCard({ walkthrough }: WalkthroughCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate({ to: '/walkthrough/$slug', params: { slug: walkthrough.slug } })}
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">
              {walkthrough.title}
            </h3>
            <div className="flex gap-2 items-center text-xs text-muted-foreground">
              <span>⏱️ {walkthrough.duration}</span>
              <span>•</span>
              <span>{walkthrough.steps} steps</span>
            </div>
          </div>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {walkthrough.difficulty}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {walkthrough.description}
        </p>

        {/* Topics */}
        <div className="flex flex-wrap gap-1">
          {walkthrough.topics.map((topic) => (
            <Badge key={topic} variant="outline" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      </div>
    </button>
  );
}

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

      // Run layout to position nodes properly
      const { autoLayout } = useCanvasStore.getState();
      await autoLayout();

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
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">System Architect</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={handleCreateDesign} size="default" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                New Design
              </Button>
              <Button onClick={() => setShowFolderDialog(true)} variant="outline" size="default" className="gap-2">
                <FolderPlus className="h-4 w-4" />
                Folder
              </Button>
              <div className="ml-2 flex items-center gap-1 border-l border-border pl-3">
                <Button
                  onClick={toggleTheme}
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle theme"
                  className="h-9 w-9"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" aria-label="User menu" className="h-9 w-9">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* AI Hero Section */}
        <div className="border-b border-border bg-gradient-to-br from-primary/[0.03] via-background to-background">
          <div className="mx-auto max-w-4xl px-6 py-12">
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight">Design your architecture</h1>
              <p className="text-muted-foreground">
                Describe your system and let AI generate a professional diagram
              </p>
            </div>
            <AIPromptBar onGenerate={handleAIGenerate} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">
            {/* Template Gallery */}
            <TemplateGallery />

            {/* Tabs Navigation */}
            <Tabs defaultValue="my-designs" className="w-full mt-12">
              <TabsList className="mb-8">
                <TabsTrigger value="my-designs" className="gap-2">
                  My Designs
                  {myDesigns.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {myDesigns.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="examples" className="gap-2">
                  Examples
                  {exampleDesigns.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {exampleDesigns.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* My Designs Tab */}
              <TabsContent value="my-designs">
                {rootMyDesigns.length === 0 && (!folders || folders.length === 0) ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center text-center max-w-md">
                      <div className="mb-8 relative">
                        <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl" />
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30">
                          <Layers className="h-12 w-12 text-muted-foreground/60" />
                        </div>
                      </div>
                      <h2 className="mb-3 text-2xl font-semibold">Create your first architecture</h2>
                      <p className="mb-8 text-muted-foreground">
                        Start with a blank canvas, choose a template, or describe your system to AI
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={handleCreateDesign} size="lg" className="gap-2">
                          <PlusIcon className="h-5 w-5" />
                          New Design
                        </Button>
                        <Button onClick={() => setShowFolderDialog(true)} variant="outline" size="lg" className="gap-2">
                          <FolderPlus className="h-5 w-5" />
                          New Folder
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Folders */}
                    {folders && folders.length > 0 && (
                      <section className="mb-12">
                        <h2 className="mb-5 text-sm font-semibold text-foreground">
                          Folders
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {folders.map((folder) => (
                            <FolderCard
                              key={folder._id}
                              folder={folder}
                              designCount={folderDesignCounts.get(folder._id) || 0}
                              isDropTarget={overedFolderId === folder._id}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Designs */}
                    {rootMyDesigns.length > 0 && (
                      <section>
                        <h2 className="mb-5 text-sm font-semibold text-foreground">
                          Recent Designs
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {rootMyDesigns.map((design) => (
                            <DesignListItem key={design._id} design={design} />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Examples Tab */}
              <TabsContent value="examples">
                {/* Interactive Walkthroughs Section */}
                <section className="mb-16">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Interactive Walkthroughs</h2>
                      <p className="text-sm text-muted-foreground">
                        90-120 minute progressive learning experiences with quizzes, hands-on exercises, and real-world depth
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1 hidden sm:flex">
                      🎓 Learn by doing
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {WALKTHROUGHS.map((walkthrough) => (
                      <WalkthroughCard key={walkthrough.slug} walkthrough={walkthrough} />
                    ))}
                  </div>
                </section>

                {/* Example Designs Section */}
                {exampleDesigns.length === 0 ? (
                  <section>
                    <h2 className="mb-5 text-sm font-semibold text-foreground">Example Architectures</h2>
                    <div className="flex flex-col items-center text-center py-16 rounded-xl border-2 border-dashed border-border bg-muted/20">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
                        <Layers className="h-8 w-8 text-muted-foreground/70" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Run the seed mutation to create example architecture diagrams
                      </p>
                    </div>
                  </section>
                ) : (
                  <section>
                    <div className="mb-5">
                      <h2 className="text-xl font-semibold mb-2">Example Architectures</h2>
                      <p className="text-sm text-muted-foreground">
                        Pre-built architecture diagrams you can view and fork
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {exampleDesigns.map((design) => (
                        <div key={design._id} className="relative">
                          <DesignListItem design={design} />
                          <Badge
                            variant="secondary"
                            className="absolute top-3 right-3 bg-primary/10 text-primary pointer-events-none"
                          >
                            Example
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </TabsContent>
            </Tabs>
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
