import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { templates } from '@/templates';
import { useCanvasStore } from '@/stores/canvasStore';

interface TemplateBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateBrowser({ open, onOpenChange }: TemplateBrowserProps) {
  const loadDesign = useCanvasStore((state) => state.loadDesign);

  const handleTemplateClick = (templateSlug: string) => {
    const template = templates.find((t) => t.slug === templateSlug);
    if (template) {
      loadDesign(template.nodes, template.edges);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Architecture Templates</DialogTitle>
          <DialogDescription>
            Choose a template to start your architecture diagram
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {templates.map((template) => (
            <button
              key={template.slug}
              onClick={() => handleTemplateClick(template.slug)}
              className="group relative flex flex-col p-4 border rounded-lg hover:border-primary transition-colors text-left bg-card hover:bg-accent"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {template.title}
                </h3>
                <Badge variant="secondary" className="ml-2">
                  {template.nodes.length} nodes
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
