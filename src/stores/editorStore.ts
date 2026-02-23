import { create } from "zustand";
import { CANVAS_TOOL, VIEW_MODE } from "@/constants";

/**
 * Editor UI preferences (ephemeral, not persisted to Convex)
 * These settings are local-only and reset to defaults when opening a design
 */

export type WorkspaceViewMode = typeof VIEW_MODE[keyof typeof VIEW_MODE];
export type CanvasTool = typeof CANVAS_TOOL[keyof typeof CANVAS_TOOL];

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
  viewMode: VIEW_MODE.BOTH,
  activeCanvasTool: CANVAS_TOOL.CURSOR,
  documentEditorMode: "edit",
  dslEditorVisible: false,

  setViewMode: (mode) => set({ viewMode: mode }),

  cycleViewMode: () =>
    set((s) => {
      const next: Record<WorkspaceViewMode, WorkspaceViewMode> = {
        [VIEW_MODE.DOCUMENT]: VIEW_MODE.BOTH,
        [VIEW_MODE.BOTH]: VIEW_MODE.CANVAS,
        [VIEW_MODE.CANVAS]: VIEW_MODE.DOCUMENT,
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
