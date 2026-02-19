import { create } from 'zustand';
import type {
  CanvasBounds,
  CanvasSection,
  CanvasTool,
  NotebookBlock,
  NotebookBlockType,
  WorkspaceViewMode,
} from '@/types';
import { useCanvasStore } from '@/stores/canvasStore';

let sectionIdCounter = 0;
let blockIdCounter = 0;

function createSectionId(): string {
  sectionIdCounter += 1;
  return `section_${(Date.now() + sectionIdCounter).toString(36)}`;
}

function createBlockId(): string {
  blockIdCounter += 1;
  return `block_${(Date.now() + blockIdCounter).toString(36)}`;
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || 'Untitled Section';
}

function toSectionLink(sectionId: string, title: string): string {
  return `[${title}](section:${sectionId})`;
}

const blockTypeLabels: Record<NotebookBlockType, string> = {
  text: 'Text',
  requirements: 'Requirements',
  schema: 'Schema',
  api: 'API',
  lld: 'LLD',
};

function makeDefaultBlock(
  type: NotebookBlockType,
  sectionId: string | null,
  id: string,
): NotebookBlock {
  const createdAt = Date.now();
  switch (type) {
    case 'text':
      return { id, type: 'text', sectionId, createdAt, data: { markdown: '' } };
    case 'requirements':
      return {
        id,
        type: 'requirements',
        sectionId,
        createdAt,
        data: {
          items: [
            { id: `req_${Date.now()}a`, text: '', kind: 'functional' as const },
            { id: `req_${Date.now()}b`, text: '', kind: 'non-functional' as const },
          ],
        },
      };
    case 'schema':
      return { id, type: 'schema', sectionId, createdAt, data: { tables: [] } };
    case 'api':
      return { id, type: 'api', sectionId, createdAt, data: { endpoints: [] } };
    case 'lld':
      return { id, type: 'lld', sectionId, createdAt, data: { title: '', content: '' } };
  }
}

const defaultTextBlock: NotebookBlock = {
  id: createBlockId(),
  type: 'text',
  sectionId: null,
  createdAt: Date.now(),
  data: {
    markdown: [
      '# Architecture Notes',
      '',
      '- Use the canvas to model topology.',
      '- Create linked sections from node selections.',
      "- Type / to insert a structured widget.",
    ].join('\n'),
  },
};

interface WorkspaceStore {
  viewMode: WorkspaceViewMode;
  activeCanvasTool: CanvasTool;
  documentEditorMode: 'edit' | 'preview';
  blocks: NotebookBlock[];
  sections: CanvasSection[];
  pendingFocusSectionId: string | null;
  pendingFocusBlockId: string | null;

  setViewMode: (mode: WorkspaceViewMode) => void;
  cycleViewMode: () => void;
  setActiveCanvasTool: (tool: CanvasTool) => void;
  setDocumentEditorMode: (mode: 'edit' | 'preview') => void;
  toggleDocumentEditorMode: () => void;

  addBlock: (type: NotebookBlockType, atIndex?: number) => NotebookBlock;
  removeBlock: (blockId: string) => void;
  updateBlockData: (blockId: string, data: Record<string, unknown>) => void;

  createSectionFromNodeSelection: (
    title: string,
    selectedNodeIds: string[],
    bounds: CanvasBounds,
  ) => CanvasSection | null;
  removeSection: (id: string) => void;
  getSectionLink: (id: string) => string | null;

  requestFocusSection: (id: string) => void;
  clearPendingFocusSection: () => void;
  requestFocusBlock: (blockId: string) => void;
  clearPendingFocusBlock: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()((set, get) => ({
      viewMode: 'both',
      activeCanvasTool: 'cursor',
      documentEditorMode: 'edit',
      blocks: [defaultTextBlock],
      sections: [],
      pendingFocusSectionId: null,
      pendingFocusBlockId: null,

      setViewMode: (mode) => set({ viewMode: mode }),
      cycleViewMode: () =>
        set((s) => {
          const next: Record<WorkspaceViewMode, WorkspaceViewMode> = {
            document: 'both', both: 'canvas', canvas: 'document',
          };
          return { viewMode: next[s.viewMode] };
        }),
      setActiveCanvasTool: (tool) => set({ activeCanvasTool: tool }),
      setDocumentEditorMode: (mode) => set({ documentEditorMode: mode }),
      toggleDocumentEditorMode: () =>
        set((s) => ({
          documentEditorMode: s.documentEditorMode === 'edit' ? 'preview' : 'edit',
        })),

      addBlock: (type, atIndex?) => {
        const id = createBlockId();
        let sectionId: string | null = null;

        if (type !== 'text') {
          const label = blockTypeLabels[type];
          const canvasNodes = useCanvasStore.getState().nodes;
          let maxY = 0;
          for (const node of canvasNodes) {
            const nodeH =
              typeof node.style?.height === 'number' ? node.style.height : 48;
            const bottom = node.position.y + nodeH;
            if (bottom > maxY) maxY = bottom;
          }
          const position = { x: 100, y: Math.max(60, maxY + 60) };

          const nodeId = useCanvasStore
            .getState()
            .addSectionBadgeNode(id, type, label, position);

          const section: CanvasSection = {
            id: createSectionId(),
            title: label,
            nodeIds: [nodeId],
            bounds: {
              x: position.x - 10,
              y: position.y - 10,
              width: 260,
              height: 160,
            },
            createdAt: Date.now(),
            linkedBlockId: id,
          };
          sectionId = section.id;
          set((state) => ({ sections: [...state.sections, section] }));
        }

        const block = makeDefaultBlock(type, sectionId, id);

        set((state) => {
          const blocks = [...state.blocks];
          if (
            atIndex !== undefined &&
            atIndex >= 0 &&
            atIndex <= blocks.length
          ) {
            blocks.splice(atIndex, 0, block);
          } else {
            blocks.push(block);
          }
          return { blocks };
        });

        return block;
      },

      removeBlock: (blockId) => {
        const linkedSection = get().sections.find(
          (s) => s.linkedBlockId === blockId,
        );

        if (linkedSection) {
          const canvasStore = useCanvasStore.getState();
          for (const nodeId of linkedSection.nodeIds) {
            canvasStore.removeNode(nodeId);
          }
        }

        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== blockId),
          sections: state.sections.filter(
            (s) => s.linkedBlockId !== blockId,
          ),
          pendingFocusBlockId:
            state.pendingFocusBlockId === blockId
              ? null
              : state.pendingFocusBlockId,
        }));
      },

      updateBlockData: (blockId, data) => {
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? ({
                  ...b,
                  data: { ...(b.data as object), ...data },
                } as unknown as NotebookBlock)
              : b,
          ),
        }));
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

        set((state) => ({ sections: [...state.sections, section] }));
        return section;
      },

      removeSection: (id) => {
        set((state) => ({
          sections: state.sections.filter((s) => s.id !== id),
          pendingFocusSectionId:
            state.pendingFocusSectionId === id
              ? null
              : state.pendingFocusSectionId,
        }));
      },

      getSectionLink: (id) => {
        const section = get().sections.find((s) => s.id === id);
        if (!section) return null;
        return toSectionLink(section.id, section.title);
      },

      requestFocusSection: (id) => set({ pendingFocusSectionId: id }),
      clearPendingFocusSection: () => set({ pendingFocusSectionId: null }),
      requestFocusBlock: (blockId) => set({ pendingFocusBlockId: blockId }),
      clearPendingFocusBlock: () => set({ pendingFocusBlockId: null }),
    }));
