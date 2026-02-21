import { useState, useRef, useEffect } from 'react';
import { Search, Puzzle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getWidgetsByCategory } from '../registry/widgetRegistry';
import type { WidgetCategory } from '../types';
import { WidgetCard } from './WidgetCard';

const categoryOrder: WidgetCategory[] = [
  'visualization',
  'interaction',
  'context',
  'flow',
];

const categoryLabels: Record<WidgetCategory, string> = {
  visualization: 'Visualization',
  interaction: 'Interaction',
  context: 'Context',
  flow: 'Flow',
};

interface WidgetSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetSidebar({ isOpen, onClose }: WidgetSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = searchQuery.toLowerCase().trim();

  const widgetsByCategory = getWidgetsByCategory();

  // Focus search input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const noMatches =
    normalizedQuery &&
    categoryOrder.every((cat) => {
      const widgets = widgetsByCategory[cat];
      if (!widgets) return true;
      return widgets.every(
        (w) =>
          !w.name.toLowerCase().includes(normalizedQuery) &&
          !w.description.toLowerCase().includes(normalizedQuery) &&
          !w.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
      );
    });

  return (
    <aside
      className={cn(
        'pointer-events-auto flex w-[240px] max-h-[min(68vh,32rem)] flex-col overflow-hidden rounded-xl border ui-border-ghost bg-card/92 shadow-(--surface-shadow) backdrop-blur-xl transition-all duration-180 ease-out',
        isOpen
          ? 'translate-x-0 opacity-100'
          : 'pointer-events-none -translate-x-3 opacity-0',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-secondary/65">
            <Puzzle className="h-3 w-3 text-foreground/90" />
          </div>
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Widgets
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          title="Close widgets"
          aria-label="Close widgets"
          onClick={onClose}
          className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative rounded-md bg-background/40">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            variant="ghost"
            type="text"
            name="widgetSearch"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            className="h-7 bg-transparent pl-7 text-xs"
          />
        </div>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {categoryOrder.map((category) => {
          const widgets = widgetsByCategory[category];
          if (!widgets?.length) return null;

          const filtered = normalizedQuery
            ? widgets.filter(
                (w) =>
                  w.name.toLowerCase().includes(normalizedQuery) ||
                  w.description.toLowerCase().includes(normalizedQuery) ||
                  w.tags.some((tag) =>
                    tag.toLowerCase().includes(normalizedQuery),
                  ),
              )
            : widgets;

          if (filtered.length === 0) return null;

          return (
            <div key={category} className="mb-3">
              <div className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/78">
                {categoryLabels[category]}
              </div>

              <div className="flex flex-col gap-1">
                {filtered.map((widget) => (
                  <WidgetCard key={widget.id} widget={widget} />
                ))}
              </div>
            </div>
          );
        })}

        {noMatches && (
          <div className="flex flex-col items-center px-2 py-8">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              No widgets found
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
