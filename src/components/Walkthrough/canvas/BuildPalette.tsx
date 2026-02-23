/**
 * BuildPalette - Component palette for canvas build mode
 * Displays draggable components that learners can add to the canvas
 */

import { motion } from 'motion/react';
import { Layers, GripVertical } from 'lucide-react';
import type { BuildPaletteComponent } from '@/types/walkthrough';
import { cn } from '@/lib/utils';

interface BuildPaletteProps {
  palette: BuildPaletteComponent[];
  onDragStart: (component: BuildPaletteComponent) => void;
}

export function BuildPalette({ palette, onDragStart }: BuildPaletteProps) {
  const handleDragStart = (e: React.DragEvent, component: BuildPaletteComponent) => {
    // Store component data in the drag event
    e.dataTransfer.setData('application/reactflow', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(component);
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute right-4 top-4 z-10 w-72 rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Component Palette</h3>
      </div>

      {/* Palette Items */}
      <div className="max-h-[600px] overflow-y-auto p-3 space-y-2">
        {palette.map((component) => (
          <div
            key={component.id}
            draggable
            onDragStart={(e) => handleDragStart(e, component)}
            className={cn(
              'group relative flex cursor-grab items-start gap-3 rounded-md border border-border bg-background px-3 py-2.5',
              'hover:border-primary/50 hover:bg-accent/50 transition-all duration-200',
              'active:cursor-grabbing active:scale-95'
            )}
          >
            {/* Drag Handle */}
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary mt-0.5" />

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">
                {component.label}
              </div>
              <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {component.description}
              </div>
              <div className="mt-1.5 inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                {component.componentType}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        Drag components onto the canvas to build your architecture
      </div>
    </motion.div>
  );
}
