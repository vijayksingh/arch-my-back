import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RailSection = 'components' | 'search';
export type SidebarCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | null;

interface SidebarPosition {
  x: number;
  y: number;
  corner: SidebarCorner;
  isDragging: boolean;
}

interface SidebarViewport {
  width: number;
  height: number;
  panelWidth: number;
  panelHeight: number;
  topInset?: number;
  bottomInset?: number;
  margin?: number;
  snapThreshold?: number;
}

const DEFAULT_TOP_INSET = 68;
const DEFAULT_BOTTOM_INSET = 64;
const DEFAULT_MARGIN = 12;
const DEFAULT_SNAP_THRESHOLD = 180;
const UI_STORAGE_KEY = 'archmyback_ui';

const defaultSidebarPosition: SidebarPosition = {
  x: DEFAULT_MARGIN,
  y: DEFAULT_TOP_INSET,
  corner: 'top-left',
  isDragging: false,
};

function getBounds(viewport: SidebarViewport) {
  const margin = viewport.margin ?? DEFAULT_MARGIN;
  const topInset = viewport.topInset ?? DEFAULT_TOP_INSET;
  const bottomInset = viewport.bottomInset ?? DEFAULT_BOTTOM_INSET;
  const maxX = Math.max(margin, viewport.width - viewport.panelWidth - margin);
  const maxY = Math.max(
    topInset,
    viewport.height - viewport.panelHeight - bottomInset,
  );

  return {
    minX: margin,
    maxX,
    minY: topInset,
    maxY,
  };
}

function clampPosition(
  x: number,
  y: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
) {
  return {
    x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(y, bounds.minY), bounds.maxY),
  };
}

function getCornerPoints(bounds: {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}) {
  return [
    { corner: 'top-left' as const, x: bounds.minX, y: bounds.minY },
    { corner: 'top-right' as const, x: bounds.maxX, y: bounds.minY },
    { corner: 'bottom-left' as const, x: bounds.minX, y: bounds.maxY },
    { corner: 'bottom-right' as const, x: bounds.maxX, y: bounds.maxY },
  ];
}

interface UIStore {
  isTrayOpen: boolean;
  activeRailSection: RailSection;
  sidebarPosition: SidebarPosition;
  openTray: (section?: RailSection) => void;
  toggleTray: (section?: RailSection) => void;
  closeTray: () => void;
  setActiveRailSection: (section: RailSection) => void;
  setSidebarPosition: (position: Partial<SidebarPosition>) => void;
  setSidebarDragging: (isDragging: boolean) => void;
  snapSidebarToNearestCorner: (viewport: SidebarViewport) => void;
  rehydrateSidebarPosition: (viewport: SidebarViewport) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      isTrayOpen: true,
      activeRailSection: 'components',
      sidebarPosition: defaultSidebarPosition,
      openTray: (section = 'components') => {
        set({ isTrayOpen: true, activeRailSection: section });
      },
      toggleTray: (section = 'components') => {
        const { isTrayOpen, activeRailSection } = get();
        if (isTrayOpen && activeRailSection === section) {
          set({ isTrayOpen: false });
          return;
        }

        set({ isTrayOpen: true, activeRailSection: section });
      },
      closeTray: () => {
        set({ isTrayOpen: false });
      },
      setActiveRailSection: (section) => {
        set({ activeRailSection: section, isTrayOpen: true });
      },
      setSidebarPosition: (position) => {
        set((state) => ({
          sidebarPosition: { ...state.sidebarPosition, ...position },
        }));
      },
      setSidebarDragging: (isDragging) => {
        set((state) => ({
          sidebarPosition: { ...state.sidebarPosition, isDragging },
        }));
      },
      snapSidebarToNearestCorner: (viewport) => {
        set((state) => {
          const threshold = viewport.snapThreshold ?? DEFAULT_SNAP_THRESHOLD;
          const bounds = getBounds(viewport);
          const clamped = clampPosition(
            state.sidebarPosition.x,
            state.sidebarPosition.y,
            bounds,
          );
          const corners = getCornerPoints(bounds);

          const nearest = corners.reduce(
            (best, current) => {
              const distance = Math.hypot(
                clamped.x - current.x,
                clamped.y - current.y,
              );
              return distance < best.distance
                ? { ...current, distance }
                : best;
            },
            { ...corners[0], distance: Number.POSITIVE_INFINITY },
          );

          const shouldSnap = nearest.distance <= threshold;
          return {
            sidebarPosition: {
              x: shouldSnap ? nearest.x : clamped.x,
              y: shouldSnap ? nearest.y : clamped.y,
              corner: shouldSnap ? nearest.corner : null,
              isDragging: false,
            },
          };
        });
      },
      rehydrateSidebarPosition: (viewport) => {
        set((state) => {
          const bounds = getBounds(viewport);
          const corners = getCornerPoints(bounds);
          const storedCorner = state.sidebarPosition.corner;

          if (storedCorner) {
            const cornerPoint = corners.find((c) => c.corner === storedCorner);
            if (cornerPoint) {
              return {
                sidebarPosition: {
                  ...state.sidebarPosition,
                  x: cornerPoint.x,
                  y: cornerPoint.y,
                  isDragging: false,
                },
              };
            }
          }

          const clamped = clampPosition(
            state.sidebarPosition.x,
            state.sidebarPosition.y,
            bounds,
          );
          return {
            sidebarPosition: {
              ...state.sidebarPosition,
              x: clamped.x,
              y: clamped.y,
              isDragging: false,
            },
          };
        });
      },
    }),
    {
      name: UI_STORAGE_KEY,
      partialize: (state) => ({
        isTrayOpen: state.isTrayOpen,
        activeRailSection: state.activeRailSection,
        sidebarPosition: {
          ...state.sidebarPosition,
          isDragging: false,
        },
      }),
    },
  ),
);
