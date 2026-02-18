import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetPreviewCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  accentBorder?: boolean;
  className?: string;
}

export function WidgetPreviewCard({
  icon: Icon,
  title,
  children,
  accentBorder,
  className,
}: WidgetPreviewCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border ui-border-ghost bg-card/70 p-3',
        accentBorder && 'border-l-2 border-l-primary',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
