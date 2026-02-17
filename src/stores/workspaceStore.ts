import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CanvasBounds,
  CanvasSection,
  CanvasTool,
  WorkspaceViewMode,
} from '@/types';

const WORKSPACE_STORAGE_KEY = 'archmyback_workspace';

let sectionIdCounter = 0;

function createSectionId(): string {
  sectionIdCounter += 1;
  return `section_${(Date.now() + sectionIdCounter).toString(36)}`;
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || 'Untitled Section';
}

function toSectionLink(sectionId: string, title: string): string {
  return `[${title}](section:${sectionId})`;
}

interface WorkspaceStore {
  viewMode: WorkspaceViewMode;
  activeCanvasTool: CanvasTool;
  documentMarkdown: string;
  sections: CanvasSection[];
  pendingFocusSectionId: string | null;
  setViewMode: (mode: WorkspaceViewMode) => void;
  setActiveCanvasTool: (tool: CanvasTool) => void;
  setDocumentMarkdown: (markdown: string) => void;
  createSectionFromNodeSelection: (
    title: string,
    selectedNodeIds: string[],
    bounds: CanvasBounds,
  ) => CanvasSection | null;
  removeSection: (id: string) => void;
  getSectionLink: (id: string) => string | null;
  requestFocusSection: (id: string) => void;
  clearPendingFocusSection: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      viewMode: 'both',
      activeCanvasTool: 'cursor',
      documentMarkdown: [
        '# Architecture Notes',
        '',
        '- Use the canvas to model topology.',
        '- Create linked sections from node selections.',
        '- Use Insert Link for clean references.',
      ].join('\n'),
      sections: [],
      pendingFocusSectionId: null,
      setViewMode: (mode) => set({ viewMode: mode }),
      setActiveCanvasTool: (tool) => set({ activeCanvasTool: tool }),
      setDocumentMarkdown: (markdown) => set({ documentMarkdown: markdown }),
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

        set((state) => ({ sections: [...state.sections, section] }));
        return section;
      },
      removeSection: (id) => {
        set((state) => ({
          sections: state.sections.filter((section) => section.id !== id),
          pendingFocusSectionId:
            state.pendingFocusSectionId === id ? null : state.pendingFocusSectionId,
        }));
      },
      getSectionLink: (id) => {
        const section = get().sections.find((entry) => entry.id === id);
        if (!section) return null;
        return toSectionLink(section.id, section.title);
      },
      requestFocusSection: (id) => {
        set({ pendingFocusSectionId: id });
      },
      clearPendingFocusSection: () => {
        set({ pendingFocusSectionId: null });
      },
    }),
    {
      name: WORKSPACE_STORAGE_KEY,
      partialize: (state) => ({
        viewMode: state.viewMode,
        activeCanvasTool: state.activeCanvasTool,
        documentMarkdown: state.documentMarkdown,
        sections: state.sections,
      }),
    },
  ),
);

