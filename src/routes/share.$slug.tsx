import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { ReactFlowProvider } from '@xyflow/react';
import { useEffect } from 'react';
import Canvas from '@/components/Canvas';
import { DocumentPanel } from '@/components/DocumentPanel';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editorStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useDocumentStore } from '@/stores/documentStore';
import { VIEW_MODE } from '@/constants';
import { api } from '../../convex/_generated/api';

export const Route = createFileRoute('/share/$slug')({
  component: PublicSharePage,
  head: () => ({
    meta: [
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
  }),
});

function PublicSharePage() {
  const { slug } = Route.useParams();

  // Fetch public design data
  const design = useQuery(api.sharing.getBySlug, { slug });
  const canvas = useQuery(api.sharing.getCanvasBySlug, { slug });
  const blocks = useQuery(api.sharing.getBlocksBySlug, { slug });

  const viewMode = useEditorStore((s) => s.viewMode);
  const loadDesign = useCanvasStore((s) => s.loadDesign);
  const setBlocks = useDocumentStore((s) => s.setBlocks);

  // Load canvas and blocks data when available
  useEffect(() => {
    if (canvas) {
      loadDesign(canvas.nodes as any, canvas.edges as any, canvas.sections as any);
    }
    if (blocks) {
      setBlocks(blocks.blocks as any);
    }
  }, [canvas, blocks, loadDesign, setBlocks]);

  // Update page title and meta tags when design loads
  useEffect(() => {
    if (design) {
      document.title = `${design.title} - Shared Design`;

      // Update OG meta tags
      const updateMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };

      const updateNameMetaTag = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };

      updateMetaTag('og:title', design.title);
      updateMetaTag('og:description', design.description || 'View this architecture design');
      updateMetaTag('og:url', window.location.href);

      updateNameMetaTag('twitter:title', design.title);
      updateNameMetaTag('twitter:description', design.description || 'View this architecture design');
    }
  }, [design]);

  // Show loading state
  if (design === undefined || canvas === undefined || blocks === undefined) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading shared design...</div>
        </div>
      </div>
    );
  }

  // Show error if design not found
  if (design === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold">Design not found</div>
          <p className="text-sm text-muted-foreground">
            This design may have been removed or made private.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Header with view-only badge */}
      <div className="flex h-14 items-center justify-between border-b ui-border-ghost px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{design.title}</h1>
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            View Only
          </span>
        </div>
        {design.description && (
          <p className="text-sm text-muted-foreground">{design.description}</p>
        )}
      </div>

      {/* Main content area */}
      <div className="relative flex flex-1 overflow-hidden">
        {viewMode !== 'canvas' && (
          <div
            className={cn(
              'h-full min-w-0 bg-background',
              viewMode === VIEW_MODE.BOTH && 'w-[min(42rem,42vw)] max-w-2xl border-r ui-border-ghost',
              viewMode === VIEW_MODE.DOCUMENT && 'w-full',
            )}
          >
            <DocumentPanel />
          </div>
        )}

        {viewMode !== 'document' && (
          <div className="relative flex h-full min-w-0 flex-1 overflow-hidden bg-background">
            <div
              id="react-flow-canvas"
              className="absolute inset-0 bg-background"
            >
              <ReactFlowProvider>
                <Canvas>
                  <Canvas.Editor />
                </Canvas>
              </ReactFlowProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
