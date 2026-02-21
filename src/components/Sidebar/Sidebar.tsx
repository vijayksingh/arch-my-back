import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { Search, Boxes, X, GripVertical, MousePointer2, BoxSelect, Square, Circle, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { componentsByCategory } from '@/registry/componentTypes';
import type { RailSection } from '@/stores/uiStore';
import { useUIStore } from '@/stores/uiStore';
import { useEditorStore } from '@/stores/editorStore';
import type { CanvasTool, ComponentCategory } from '@/types';
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
];

const SIDEBAR_TOP_INSET = 12;
const SIDEBAR_BOTTOM_INSET = 64;
const SIDEBAR_MARGIN = 12;
const SIDEBAR_SNAP_THRESHOLD = 180;
const FALLBACK_RAIL_WIDTH = 40;
const FALLBACK_TRAY_WIDTH = 184;
const FALLBACK_GAP = 8;

const toolItems: {
  id: CanvasTool;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'cursor', label: 'Cursor', icon: MousePointer2 },
  { id: 'select', label: 'Select', icon: BoxSelect },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'text', label: 'Text', icon: Type },
];

interface DragState {
  startX: number;
  startY: number;
  startPosX: number;
  startPosY: number;
}

interface SidebarProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export function Sidebar({ containerRef }: SidebarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
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
  const activeCanvasTool = useEditorStore((s) => s.activeCanvasTool);
  const setActiveCanvasTool = useEditorStore((s) => s.setActiveCanvasTool);

  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const normalizedQuery = searchQuery.toLowerCase().trim();
  const trayTitle = 'Components';

  const getViewportMetrics = useCallback(() => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const root = rootRef.current;
    const panelWidth =
      root?.offsetWidth ??
      (isTrayOpen
        ? FALLBACK_RAIL_WIDTH + FALLBACK_GAP + FALLBACK_TRAY_WIDTH
        : FALLBACK_RAIL_WIDTH);
    const panelHeight = root?.offsetHeight ?? 500;

    return {
      width: containerRect?.width ?? window.innerWidth,
      height: containerRect?.height ?? window.innerHeight,
      panelWidth,
      panelHeight,
      topInset: SIDEBAR_TOP_INSET,
      bottomInset: SIDEBAR_BOTTOM_INSET,
      margin: SIDEBAR_MARGIN,
      snapThreshold: SIDEBAR_SNAP_THRESHOLD,
    };
  }, [containerRef, isTrayOpen]);

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
    if (isTrayOpen) {
      searchRef.current?.focus();
    }
  }, [isTrayOpen]);

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
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      rehydrateSidebarPosition(getViewportMetrics());
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, getViewportMetrics, rehydrateSidebarPosition]);

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
      className="pointer-events-none absolute z-40 flex flex-col items-start gap-2"
      style={{
        left: `${sidebarPosition.x}px`,
        top: `${sidebarPosition.y}px`,
      }}
    >
      <div className="flex items-start gap-2">
        <aside className="pointer-events-auto flex w-10 shrink-0 flex-col items-center gap-1 rounded-xl border ui-border-ghost bg-card p-1 shadow-(--surface-shadow) backdrop-blur-xl">
          <button
            type="button"
            aria-label="Drag sidebar"
            title="Drag and snap"
            onPointerDown={handleDragStart}
            style={{ touchAction: 'none' }}
            className={cn(
              'flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-accent/70 hover:text-foreground active:cursor-grabbing',
              sidebarPosition.isDragging && 'bg-accent/60 text-foreground',
            )}
          >
            <GripVertical className="h-3 w-3" />
          </button>

          <div className="my-0.5 h-px w-6 rounded-full bg-border/60" aria-hidden />

          <div
            role="toolbar"
            aria-label="Sidebar sections"
            className="flex flex-col items-center gap-1"
          >
            {railItems.map(({ id, label, icon: Icon }) => {
              const isActive = isTrayOpen && activeRailSection === id;

              return (
                <Button
                  key={id}
                  variant="ghost"
                  size="icon"
                  title={label}
                  aria-label={label}
                  aria-pressed={isActive}
                  onClick={() => {
                    if (isActive) {
                      toggleTray(id);
                    } else {
                      setActiveRailSection(id);
                    }
                  }}
                  className={cn(
                    'h-6 w-6 rounded-md border border-transparent text-muted-foreground transition-all',
                    isActive
                      ? 'border-primary/50 bg-accent text-foreground shadow-sm ring-1 ring-ring/45'
                      : 'hover:border-border/70 hover:bg-accent/70 hover:text-foreground',
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                </Button>
              );
            })}
          </div>

          <div className="my-1 h-px w-6 rounded-full bg-border/60" aria-hidden />

          <div
            role="toolbar"
            aria-label="Canvas tools"
            className="flex flex-col items-center gap-1"
          >
            {toolItems.map(({ id, label, icon: Icon }) => {
              const isToolActive = activeCanvasTool === id;

              return (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  aria-pressed={isToolActive}
                  onClick={() => setActiveCanvasTool(id)}
                  title={label}
                  className={cn(
                    'relative flex h-7 w-7 items-center justify-center rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                    isToolActive
                      ? 'border-primary/70 bg-primary/20 text-primary shadow-sm ring-2 ring-ring/70 ring-offset-1 ring-offset-background'
                      : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/60 hover:text-foreground',
                  )}
                >
                  {isToolActive && (
                    <span
                      aria-hidden
                      className="absolute -left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
                    />
                  )}
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </aside>

        <aside
          className={cn(
            'pointer-events-auto flex w-[184px] max-h-[min(68vh,28rem)] max-w-[calc(100%-3.75rem)] flex-col overflow-hidden rounded-xl border ui-border-ghost bg-card shadow-(--surface-shadow) backdrop-blur-xl ease-out',
            !prefersReducedMotion && 'transition-all duration-180',
            isTrayOpen
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none -translate-x-3 opacity-0',
          )}
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-secondary/65">
                <Boxes className="h-2.5 w-2.5 text-foreground/90" />
              </div>
              <span className="truncate text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {trayTitle}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              title="Close tray"
              aria-label="Close tray"
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
                name="componentSearch"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                className="h-6 bg-transparent pl-6 text-[11px]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {categoryOrder.map((category) => {
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
    </div>
  );
}
