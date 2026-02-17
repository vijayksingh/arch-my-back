import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentTypeConfig } from '@/types';
import { getIconByName } from '@/registry/iconRegistry';
import { categoryAccentTokens } from '@/registry/categoryThemes';

interface ComponentCardProps {
  componentType: ComponentTypeConfig;
}

export function ComponentCard({ componentType }: ComponentCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const IconComponent = getIconByName(componentType.icon);
  const categoryAccent = categoryAccentTokens[componentType.category];

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('application/archcomponent', componentType.key);
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
        'group relative flex h-9 cursor-grab select-none items-center gap-2 overflow-hidden rounded-lg px-2.5 transition-[background-color,transform,opacity] duration-150',
        'bg-popover/82 hover:-translate-y-px hover:bg-popover/96',
        isDragging ? 'cursor-grabbing opacity-40' : 'cursor-grab',
      )}
      style={{
        boxShadow: `inset 0 0 0 1px hsl(var(${categoryAccent}) / 0.1)`,
        touchAction: 'none',
      }}
      title={componentType.description}
    >
      <span
        className="pointer-events-none absolute inset-y-1 left-0 w-0.5 rounded-full"
        style={{ backgroundColor: `hsl(var(${categoryAccent}) / 0.8)` }}
      />
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundColor: `hsl(var(${categoryAccent}) / 0.16)`,
        }}
      >
        <IconComponent
          size={12}
          strokeWidth={2}
          style={{ color: `hsl(var(${categoryAccent}))` }}
        />
      </div>

      <span className="truncate text-[11px] font-medium leading-none text-card-foreground">
        {componentType.label}
      </span>
    </div>
  );
}
