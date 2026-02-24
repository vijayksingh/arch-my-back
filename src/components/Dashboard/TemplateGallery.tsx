import { Badge } from '@/components/ui/badge';
import { templates } from '@/templates';
import type { ArchEdge, CanvasNode, DesignTemplate } from '@/types';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

/** Extract only domain fields from a node for storage */
function cleanNodeForStorage(node: CanvasNode) {
  return {
    id: node.id,
    type: node.type,
    position: { x: node.position.x, y: node.position.y },
    data: node.data,
    ...(node.style != null ? { style: node.style } : {}),
    ...(node.measured != null ? { measured: node.measured } : {}),
  };
}

/** Extract only domain fields from an edge for storage */
function cleanEdgeForStorage(edge: ArchEdge) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.type != null ? { type: edge.type } : {}),
    ...(edge.data != null ? { data: edge.data } : {}),
    ...(edge.sourceHandle != null ? { sourceHandle: edge.sourceHandle } : {}),
    ...(edge.targetHandle != null ? { targetHandle: edge.targetHandle } : {}),
  };
}

interface TemplateGalleryProps {
  compact?: boolean;
  maxVisible?: number;
}

export function TemplateGallery({ compact = false, maxVisible }: TemplateGalleryProps) {
  const navigate = useNavigate();
  const createDesign = useMutation(api.newDesigns.create);
  const saveCanvas = useMutation(api.designCanvases.save);

  const handleTemplateClick = async (template: DesignTemplate) => {
    try {
      // Create new design from template
      const designId = await createDesign({
        title: template.title,
        description: template.description,
      });

      // Clean nodes and edges before saving to match Convex validators
      const cleanedNodes = template.nodes.map(cleanNodeForStorage);
      const cleanedEdges = template.edges.map(cleanEdgeForStorage);

      // Save canvas data (nodes, edges, empty sections)
      await saveCanvas({
        designId,
        nodes: cleanedNodes as any,
        edges: cleanedEdges as any,
        sections: [],
      });

      // Navigate to the new design
      navigate({ to: '/design/$designId', params: { designId } });
    } catch (error) {
      console.error('Failed to create design from template:', error);
    }
  };

  const displayedTemplates = maxVisible ? templates.slice(0, maxVisible) : templates;

  if (compact) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {displayedTemplates.map((template) => (
          <button
            key={template.slug}
            onClick={() => handleTemplateClick(template)}
            className="group shrink-0 w-56 rounded-lg border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_6px_16px_rgba(0,0,0,0.16)] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-medium text-sm leading-snug flex-1 line-clamp-2">
                {template.title}
              </h3>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {template.nodes.length}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <section className="mb-12">
      <div className="mb-5">
        <h2 className="text-xl font-semibold mb-2">Start from a Template</h2>
        <p className="text-sm text-muted-foreground">
          Pre-configured architectures to jumpstart your design
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedTemplates.map((template) => (
          <button
            key={template.slug}
            onClick={() => handleTemplateClick(template)}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
          >
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/[0.02] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-base leading-tight flex-1">
                  {template.title}
                </h3>
                <Badge variant="secondary" className="shrink-0 font-medium">
                  {template.nodes.length} nodes
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {template.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
