import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { WidgetDefinition } from '../types';
import { getIconByName } from '@/registry/iconRegistry';

interface WidgetCardProps {
  widget: WidgetDefinition;
}

// Category accent colors (similar to component categories)
const categoryAccents: Record<string, string> = {
  visualization: '--chart-1',
  interaction: '--chart-2',
  context: '--chart-3',
  flow: '--chart-4',
};

export function WidgetCard({ widget }: WidgetCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const IconComponent = getIconByName(widget.icon);
  const categoryAccent = categoryAccents[widget.category] || '--chart-1';

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('application/widget', widget.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'group relative flex h-10 cursor-grab select-none items-center gap-2.5 overflow-hidden rounded-lg px-2.5 transition-[background-color,transform,opacity] duration-150',
        'bg-popover/82 hover:-translate-y-px hover:bg-popover/96',
        isDragging ? 'cursor-grabbing opacity-40' : 'cursor-grab',
      )}
      style={{
        boxShadow: `inset 0 0 0 1px hsl(var(${categoryAccent}) / 0.1)`,
        touchAction: 'none',
      }}
      title={widget.description}
    >
      <span
        className="pointer-events-none absolute inset-y-1 left-0 w-0.5 rounded-full"
        style={{ backgroundColor: `hsl(var(${categoryAccent}) / 0.8)` }}
      />
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundColor: `hsl(var(${categoryAccent}) / 0.16)`,
        }}
      >
        <IconComponent
          size={14}
          strokeWidth={2}
          style={{ color: `hsl(var(${categoryAccent}))` }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium leading-tight text-card-foreground">
          {widget.name}
        </span>
        <span className="truncate text-[9px] leading-tight text-muted-foreground/70">
          {widget.tags.slice(0, 2).join(', ')}
        </span>
      </div>
    </div>
  );
}
