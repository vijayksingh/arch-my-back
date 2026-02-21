import { templates } from '@/templates';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import type { DesignTemplate, CanvasNode, ArchEdge } from '@/types';

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

export function TemplateGallery() {
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

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Start from a Template
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.slug}
            onClick={() => handleTemplateClick(template)}
            className="group flex flex-col p-4 border rounded-lg hover:border-primary transition-colors text-left bg-card hover:bg-accent"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {template.title}
              </h3>
              <Badge variant="secondary" className="ml-2 shrink-0">
                {template.nodes.length} nodes
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
