import type { CanvasSection } from '@/types/design';
import { createSectionId } from '@/lib/idGenerator';

interface CanvasBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || 'Untitled Section';
}

function toSectionLink(sectionId: string, title: string): string {
  return `[${title}](section:${sectionId})`;
}

export interface SectionSlice {
  sections: CanvasSection[];
  pendingFocusSectionId: string | null;
  addSection: (section: CanvasSection) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<CanvasSection>) => void;
  getSectionLink: (id: string) => string | null;
  createSectionFromNodeSelection: (
    title: string,
    selectedNodeIds: string[],
    bounds: CanvasBounds
  ) => CanvasSection | null;
  requestFocusSection: (id: string) => void;
  clearPendingFocusSection: () => void;
  setSections: (sections: CanvasSection[]) => void;
}

export const createSectionSlice = (
  set: any,
  get: any
): SectionSlice => ({
  sections: [],
  pendingFocusSectionId: null,

  addSection: (section) => {
    set((state: SectionSlice) => ({ sections: [...state.sections, section] }));
  },

  removeSection: (id) => {
    set((state: SectionSlice) => ({
      sections: state.sections.filter((s: CanvasSection) => s.id !== id),
      pendingFocusSectionId:
        state.pendingFocusSectionId === id ? null : state.pendingFocusSectionId,
    }));
  },

  updateSection: (id, updates) => {
    set((state: SectionSlice) => ({
      sections: state.sections.map((s: CanvasSection) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  },

  getSectionLink: (id) => {
    const section = get().sections.find((s: CanvasSection) => s.id === id);
    if (!section) return null;
    return toSectionLink(section.id, section.title);
  },

  createSectionFromNodeSelection: (title, selectedNodeIds, bounds) => {
    if (selectedNodeIds.length === 0) return null;
    if (bounds.width <= 0 || bounds.height <= 0) return null;

    const section: CanvasSection = {
      id: createSectionId(),
      title: normalizeTitle(title),
      nodeIds: Array.from(new Set(selectedNodeIds)),
      bounds,
      createdAt: Date.now(),
    };

    set((state: SectionSlice) => ({ sections: [...state.sections, section] }));
    return section;
  },

  requestFocusSection: (id) => set({ pendingFocusSectionId: id }),
  clearPendingFocusSection: () => set({ pendingFocusSectionId: null }),

  setSections: (sections) => set({ sections }),
});
