import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Boxes, X, GripVertical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { componentsByCategory } from '@/registry/componentTypes';
import type { RailSection } from '@/stores/uiStore';
import { useUIStore } from '@/stores/uiStore';
import type { ComponentCategory } from '@/types';
import { ComponentCard } from './ComponentCard';

const categoryOrder: ComponentCategory[] = [
  'Traffic',
  'Compute',
  'Storage',
  'Messaging',
  'Caching',
  'External',
];

const railItems: { id: RailSection; label: string; icon: LucideIcon }[] = [
  { id: 'components', label: 'Components', icon: Boxes },
  { id: 'search', label: 'Search', icon: Search },
];

const SIDEBAR_TOP_INSET = 68;
const SIDEBAR_BOTTOM_INSET = 64;
const SIDEBAR_MARGIN = 12;
const SIDEBAR_SNAP_THRESHOLD = 180;
const FALLBACK_RAIL_WIDTH = 40;
const FALLBACK_TRAY_WIDTH = 184;
const FALLBACK_GAP = 8;

interface DragState {
  startX: number;
  startY: number;
  startPosX: number;
  startPosY: number;
}

export function Sidebar() {
  const isTrayOpen = useUIStore((s) => s.isTrayOpen);
  const activeRailSection = useUIStore((s) => s.activeRailSection);
  const sidebarPosition = useUIStore((s) => s.sidebarPosition);
  const toggleTray = useUIStore((s) => s.toggleTray);
  const closeTray = useUIStore((s) => s.closeTray);
  const setActiveRailSection = useUIStore((s) => s.setActiveRailSection);
  const setSidebarPosition = useUIStore((s) => s.setSidebarPosition);
  const setSidebarDragging = useUIStore((s) => s.setSidebarDragging);
  const snapSidebarToNearestCorner = useUIStore((s) => s.snapSidebarToNearestCorner);
  const rehydrateSidebarPosition = useUIStore((s) => s.rehydrateSidebarPosition);

  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const normalizedQuery = searchQuery.toLowerCase().trim();
  const requiresQuery = activeRailSection === 'search';
  const trayTitle =
    activeRailSection === 'search' ? 'Search Components' : 'Components';

  const getViewportMetrics = useCallback(() => {
    const root = rootRef.current;
    const panelWidth =
      root?.offsetWidth ??
      (isTrayOpen
        ? FALLBACK_RAIL_WIDTH + FALLBACK_GAP + FALLBACK_TRAY_WIDTH
        : FALLBACK_RAIL_WIDTH);
    const panelHeight = root?.offsetHeight ?? 420;

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      panelWidth,
      panelHeight,
      topInset: SIDEBAR_TOP_INSET,
      bottomInset: SIDEBAR_BOTTOM_INSET,
      margin: SIDEBAR_MARGIN,
      snapThreshold: SIDEBAR_SNAP_THRESHOLD,
    };
  }, [isTrayOpen]);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: sidebarPosition.x,
        startPosY: sidebarPosition.y,
      };
      setSidebarDragging(true);
    },
    [sidebarPosition.x, sidebarPosition.y, setSidebarDragging],
  );

  useEffect(() => {
    if (isTrayOpen && activeRailSection === 'search') {
      searchRef.current?.focus();
    }
  }, [activeRailSection, isTrayOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const rafId = window.requestAnimationFrame(() => {
      rehydrateSidebarPosition(getViewportMetrics());
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [getViewportMetrics, isTrayOpen, rehydrateSidebarPosition]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onResize = () => {
      rehydrateSidebarPosition(getViewportMetrics());
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getViewportMetrics, rehydrateSidebarPosition]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeTray();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeTray]);

  useEffect(() => {
    if (!sidebarPosition.isDragging) return;

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onPointerMove = (e: PointerEvent) => {
      const dragState = dragRef.current;
      if (!dragState) return;

      const metrics = getViewportMetrics();
      const margin = metrics.margin ?? SIDEBAR_MARGIN;
      const topInset = metrics.topInset ?? SIDEBAR_TOP_INSET;
      const bottomInset = metrics.bottomInset ?? SIDEBAR_BOTTOM_INSET;
      const maxX = Math.max(margin, metrics.width - metrics.panelWidth - margin);
      const maxY = Math.max(
        topInset,
        metrics.height - metrics.panelHeight - bottomInset,
      );

      const nextX = dragState.startPosX + (e.clientX - dragState.startX);
      const nextY = dragState.startPosY + (e.clientY - dragState.startY);
      setSidebarPosition({
        x: Math.min(Math.max(nextX, margin), maxX),
        y: Math.min(Math.max(nextY, topInset), maxY),
        corner: null,
      });
    };

    const onPointerUp = () => {
      if (!dragRef.current) return;

      dragRef.current = null;
      setSidebarDragging(false);
      snapSidebarToNearestCorner(getViewportMetrics());
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [
    getViewportMetrics,
    setSidebarDragging,
    setSidebarPosition,
    sidebarPosition.isDragging,
    snapSidebarToNearestCorner,
  ]);

  const noMatches =
    normalizedQuery &&
    categoryOrder.every((cat) => {
      const comps = componentsByCategory[cat];
      if (!comps) return true;
      return comps.every(
        (c) =>
          !c.label.toLowerCase().includes(normalizedQuery) &&
          !c.description.toLowerCase().includes(normalizedQuery),
      );
    });

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed z-40 flex items-start gap-2"
      style={{
        left: `${sidebarPosition.x}px`,
        top: `${sidebarPosition.y}px`,
      }}
    >
      <aside className="pointer-events-auto flex w-10 shrink-0 flex-col items-center gap-1 rounded-xl border ui-border-ghost bg-card/88 p-1 shadow-(--surface-shadow) backdrop-blur-xl">
        <button
          type="button"
          aria-label="Drag sidebar"
          title="Drag and snap"
          onPointerDown={handleDragStart}
          className={cn(
            'flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-accent/70 hover:text-foreground active:cursor-grabbing',
            sidebarPosition.isDragging && 'bg-accent/60 text-foreground',
          )}
        >
          <GripVertical className="h-3 w-3" />
        </button>

        {railItems.map(({ id, label, icon: Icon }) => {
          const isActive = isTrayOpen && activeRailSection === id;

          return (
            <Button
              key={id}
              variant="ghost"
              size="icon"
              title={label}
              onClick={() => {
                if (isActive) {
                  toggleTray(id);
                } else {
                  setActiveRailSection(id);
                }
              }}
              className={cn(
                'h-6 w-6 rounded-md text-muted-foreground transition-colors',
                isActive && 'bg-accent text-foreground shadow-sm',
              )}
            >
              <Icon className="h-2.5 w-2.5" />
            </Button>
          );
        })}
      </aside>

      <aside
        className={cn(
          'pointer-events-auto flex w-[184px] max-h-[min(68vh,28rem)] max-w-[calc(100vw-3.75rem)] flex-col overflow-hidden rounded-xl border ui-border-ghost bg-card/92 shadow-(--surface-shadow) backdrop-blur-xl transition-all duration-180 ease-out',
          isTrayOpen
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none -translate-x-3 opacity-0',
        )}
      >
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-secondary/65">
              {activeRailSection === 'search' ? (
                <Search className="h-2.5 w-2.5 text-foreground/90" />
              ) : (
                <Boxes className="h-2.5 w-2.5 text-foreground/90" />
              )}
            </div>
            <span className="truncate text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {trayTitle}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            title="Close tray"
            onClick={closeTray}
            className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>

        <div className="px-2 pb-1.5">
          <div className="relative rounded-md bg-background/40">
            <Search className="absolute left-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              variant="ghost"
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-6 bg-transparent pl-6 text-[11px]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {requiresQuery && !normalizedQuery && (
            <div className="flex flex-col items-center px-1 py-6">
              <Search className="h-6 w-6 text-muted-foreground/55" />
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Type to search components
              </p>
            </div>
          )}

          {(!requiresQuery || normalizedQuery) &&
            categoryOrder.map((category) => {
              const components = componentsByCategory[category];
              if (!components?.length) return null;

              const filtered = normalizedQuery
                ? components.filter(
                    (c) =>
                      c.label.toLowerCase().includes(normalizedQuery) ||
                      c.description.toLowerCase().includes(normalizedQuery),
                  )
                : components;

              if (filtered.length === 0) return null;

              return (
                <div key={category} className="mb-2.5">
                  <div className="mb-1 px-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/78">
                    {category}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {filtered.map((ct) => (
                      <ComponentCard key={ct.key} componentType={ct} />
                    ))}
                  </div>
                </div>
              );
            })}

          {noMatches && (
            <div className="flex flex-col items-center px-2 py-6">
              <Search className="h-6 w-6 text-muted-foreground/50" />
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                No components found
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
