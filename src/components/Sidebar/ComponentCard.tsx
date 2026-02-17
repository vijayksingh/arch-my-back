import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentTypeConfig, ComponentCategory } from '@/types';
import type { LucideIcon } from 'lucide-react';
import {
  Scale,
  Router,
  Globe,
  Server,
  Cog,
  Zap,
  Database,
  HardDrive,
  MemoryStick,
  ArrowRightLeft,
  Plug,
  ExternalLink,
  Box,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Scale,
  Router,
  Globe,
  Server,
  Cog,
  Zap,
  Database,
  HardDrive,
  MemoryStick,
  ArrowRightLeft,
  Plug,
  ExternalLink,
};

const categoryAccents: Record<ComponentCategory, string> = {
  Traffic: '--category-traffic-accent',
  Compute: '--category-compute-accent',
  Storage: '--category-storage-accent',
  Messaging: '--category-messaging-accent',
  Caching: '--category-caching-accent',
  External: '--category-external-accent',
};

interface ComponentCardProps {
  componentType: ComponentTypeConfig;
}

export function ComponentCard({ componentType }: ComponentCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const IconComponent = iconMap[componentType.icon] ?? Box;
  const categoryAccent = categoryAccents[componentType.category];

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
