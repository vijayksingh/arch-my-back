import { create } from "zustand";

/**
 * Editor UI preferences (ephemeral, not persisted to Convex)
 * These settings are local-only and reset to defaults when opening a design
 */

export type WorkspaceViewMode = "document" | "both" | "canvas";
export type CanvasTool = "cursor" | "select" | "rectangle" | "circle" | "text";

interface EditorStore {
  viewMode: WorkspaceViewMode;
  activeCanvasTool: CanvasTool;
  documentEditorMode: "edit" | "preview";
  dslEditorVisible: boolean;

  setViewMode: (mode: WorkspaceViewMode) => void;
  cycleViewMode: () => void;
  setActiveCanvasTool: (tool: CanvasTool) => void;
  setDocumentEditorMode: (mode: "edit" | "preview") => void;
  toggleDocumentEditorMode: () => void;
  setDslEditorVisible: (visible: boolean) => void;
  toggleDslEditor: () => void;
}

export const useEditorStore = create<EditorStore>()((set) => ({
  viewMode: "both",
  activeCanvasTool: "cursor",
  documentEditorMode: "edit",
  dslEditorVisible: false,

  setViewMode: (mode) => set({ viewMode: mode }),

  cycleViewMode: () =>
    set((s) => {
      const next: Record<WorkspaceViewMode, WorkspaceViewMode> = {
        document: "both",
        both: "canvas",
        canvas: "document",
      };
      return { viewMode: next[s.viewMode] };
    }),

  setActiveCanvasTool: (tool) => set({ activeCanvasTool: tool }),

  setDocumentEditorMode: (mode) => set({ documentEditorMode: mode }),

  toggleDocumentEditorMode: () =>
    set((s) => ({
      documentEditorMode: s.documentEditorMode === "edit" ? "preview" : "edit",
    })),

  setDslEditorVisible: (visible) => set({ dslEditorVisible: visible }),

  toggleDslEditor: () =>
    set((s) => ({ dslEditorVisible: !s.dslEditorVisible })),
}));
