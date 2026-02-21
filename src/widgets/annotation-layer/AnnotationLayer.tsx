import { useState, useRef, useCallback } from 'react';
import type { WidgetProps } from '../types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Eye, EyeOff, Download } from 'lucide-react';

/**
 * Annotation types
 */
export type AnnotationType = 'note' | 'callout' | 'highlight' | 'arrow';

/**
 * Annotation style configuration
 */
export interface AnnotationStyle {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  borderColor?: string;
  borderWidth?: string;
}

/**
 * Individual annotation
 */
export interface Annotation {
  id: string;
  type: AnnotationType;
  position: { x: number; y: number };
  content: string;
  style?: AnnotationStyle;
  visible?: boolean;
}

/**
 * Annotation Layer Input Schema
 */
export interface AnnotationLayerInput {
  targetId: string;
  annotations?: Annotation[];
}

/**
 * Annotation Layer Output Schema
 */
export interface AnnotationLayerOutput {
  annotations: Annotation[];
  action?: 'add' | 'update' | 'delete' | 'export';
}

/**
 * Annotation Layer Config Schema
 */
export interface AnnotationLayerConfig {
  name?: string;
  editable?: boolean;
  showAll?: boolean;
  allowedTypes?: AnnotationType[];
}

/**
 * Annotation Layer Widget Component
 */
export function AnnotationLayer({
  instanceId,
  input,
  config,
  onOutput,
}: WidgetProps<AnnotationLayerInput, AnnotationLayerOutput, AnnotationLayerConfig>) {
  const [annotations, setAnnotations] = useState<Annotation[]>(input?.annotations || []);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!input?.targetId) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-border bg-muted/30 p-4">
        <div className="text-center text-sm text-muted-foreground">
          No target specified. Please provide a targetId.
        </div>
      </div>
    );
  }

  const handleAddAnnotation = () => {
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: 'note',
      position: { x: 50, y: 50 },
      content: 'New annotation',
      visible: true,
      style: {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
      },
    };

    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);
    setSelectedId(newAnnotation.id);

    onOutput?.({
      annotations: updatedAnnotations,
      action: 'add',
    });
  };

  const handleDeleteAnnotation = (id: string) => {
    const updatedAnnotations = annotations.filter((a) => a.id !== id);
    setAnnotations(updatedAnnotations);
    setSelectedId(undefined);

    onOutput?.({
      annotations: updatedAnnotations,
      action: 'delete',
    });
  };

  const handleToggleVisibility = (id: string) => {
    const updatedAnnotations = annotations.map((a) =>
      a.id === id ? { ...a, visible: !a.visible } : a
    );
    setAnnotations(updatedAnnotations);

    onOutput?.({
      annotations: updatedAnnotations,
      action: 'update',
    });
  };

  const handleContentChange = (id: string, content: string) => {
    const updatedAnnotations = annotations.map((a) =>
      a.id === id ? { ...a, content } : a
    );
    setAnnotations(updatedAnnotations);

    onOutput?.({
      annotations: updatedAnnotations,
      action: 'update',
    });
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, annotationId: string) => {
      if (!config.editable) return;

      const annotation = annotations.find((a) => a.id === annotationId);
      if (!annotation) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setIsDragging(true);
      setSelectedId(annotationId);
      setDragOffset({
        x: e.clientX - rect.left - annotation.position.x,
        y: e.clientY - rect.top - annotation.position.y,
      });
    },
    [annotations, config.editable]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedId || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - 200, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(rect.height - 100, e.clientY - rect.top - dragOffset.y));

      const updatedAnnotations = annotations.map((a) =>
        a.id === selectedId ? { ...a, position: { x, y } } : a
      );
      setAnnotations(updatedAnnotations);
    },
    [isDragging, selectedId, dragOffset, annotations]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onOutput?.({
        annotations,
        action: 'update',
      });
    }
  }, [isDragging, annotations, onOutput]);

  const handleExport = () => {
    const exportData = {
      targetId: input.targetId,
      annotations,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations-${input.targetId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    onOutput?.({
      annotations,
      action: 'export',
    });
  };

  const visibleAnnotations = config.showAll
    ? annotations
    : annotations.filter((a) => a.visible !== false);

  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="text-sm font-medium">
          {config.name || 'Annotation Layer'} - Target: {input.targetId}
        </div>
        <div className="flex gap-1">
          {config.editable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddAnnotation}
              title="Add annotation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleExport} title="Export annotations">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas with annotations */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-muted/10"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="region"
        aria-label="Annotation canvas"
      >
        {visibleAnnotations.map((annotation) => (
          <div
            key={annotation.id}
            className={`absolute rounded-lg border-2 p-2 shadow-md transition-shadow ${
              selectedId === annotation.id ? 'ring-2 ring-primary shadow-lg' : ''
            } ${config.editable ? 'cursor-move' : 'cursor-default'}`}
            style={{
              left: annotation.position.x,
              top: annotation.position.y,
              backgroundColor: annotation.style?.backgroundColor || '#fef3c7',
              borderColor: annotation.style?.borderColor || '#f59e0b',
              fontSize: annotation.style?.fontSize || '0.875rem',
              maxWidth: '200px',
              minWidth: '150px',
            }}
            onMouseDown={(e) => handleMouseDown(e, annotation.id)}
            role="article"
            aria-label={`${annotation.type} annotation: ${annotation.content}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedId(annotation.id);
              }
            }}
          >
            {/* Annotation header */}
            <div className="mb-1 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase text-gray-700">
                {annotation.type}
              </div>
              {config.editable && (
                <div className="flex gap-1">
                  <button
                    className="rounded p-0.5 hover:bg-black/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(annotation.id);
                    }}
                    title={annotation.visible !== false ? 'Hide' : 'Show'}
                    aria-label={
                      annotation.visible !== false
                        ? 'Hide annotation'
                        : 'Show annotation'
                    }
                  >
                    {annotation.visible !== false ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    className="rounded p-0.5 hover:bg-black/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAnnotation(annotation.id);
                    }}
                    title="Delete"
                    aria-label="Delete annotation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Annotation content */}
            {config.editable ? (
              <textarea
                className="w-full resize-none rounded border-none bg-transparent p-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={annotation.content}
                onChange={(e) => handleContentChange(annotation.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                rows={3}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm">{annotation.content}</div>
            )}
          </div>
        ))}

        {annotations.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {config.editable
              ? 'Click + to add an annotation'
              : 'No annotations to display'}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="border-t border-border bg-muted/20 px-4 py-1 text-xs text-muted-foreground">
        {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} •{' '}
        {visibleAnnotations.length} visible
      </div>
    </div>
  );
}
