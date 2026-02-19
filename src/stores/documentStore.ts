import { create } from "zustand";
import type { NotebookBlock } from "@/types/design";
import type { BlockType } from "@/types/design";

let blockIdCounter = 0;

function createBlockId(): string {
  blockIdCounter += 1;
  return `block_${(Date.now() + blockIdCounter).toString(36)}`;
}

function makeDefaultBlock(
  type: BlockType,
  sectionId: string | null,
  id: string
): NotebookBlock {
  const createdAt = Date.now();
  switch (type) {
    case "text":
      return {
        id,
        type: "text",
        sectionId,
        createdAt,
        data: { markdown: "" },
      };
    case "requirements":
      return {
        id,
        type: "requirements",
        sectionId,
        createdAt,
        data: {
          items: [
            { id: `req_${Date.now()}a`, text: "", kind: "functional" },
            { id: `req_${Date.now()}b`, text: "", kind: "non-functional" },
          ],
        },
      };
    case "schema":
      return {
        id,
        type: "schema",
        sectionId,
        createdAt,
        data: { tables: [] },
      };
    case "api":
      return {
        id,
        type: "api",
        sectionId,
        createdAt,
        data: { endpoints: [] },
      };
    case "lld":
      return {
        id,
        type: "lld",
        sectionId,
        createdAt,
        data: { title: "", content: "" },
      };
  }
}

const defaultTextBlock: NotebookBlock = {
  id: createBlockId(),
  type: "text",
  sectionId: null,
  createdAt: Date.now(),
  data: {
    markdown: [
      "# Architecture Notes",
      "",
      "- Use the canvas to model topology.",
      "- Create linked sections from node selections.",
      "- Type / to insert a structured widget.",
    ].join("\n"),
  },
};

interface DocumentStore {
  blocks: NotebookBlock[];
  pendingFocusBlockId: string | null;

  addBlock: (
    type: BlockType,
    atIndex?: number,
    sectionId?: string | null
  ) => NotebookBlock;
  removeBlock: (blockId: string) => void;
  updateBlockData: (blockId: string, data: Record<string, unknown>) => void;
  reorderBlocks: (blockIds: string[]) => void;

  requestFocusBlock: (blockId: string) => void;
  clearPendingFocusBlock: () => void;

  // Bulk operations for sync
  setBlocks: (blocks: NotebookBlock[]) => void;
}

export const useDocumentStore = create<DocumentStore>()((set, get) => ({
  blocks: [defaultTextBlock],
  pendingFocusBlockId: null,

  addBlock: (type, atIndex?, sectionId = null) => {
    const id = createBlockId();
    const block = makeDefaultBlock(type, sectionId, id);

    set((state) => {
      const blocks = [...state.blocks];
      if (atIndex !== undefined && atIndex >= 0 && atIndex <= blocks.length) {
        blocks.splice(atIndex, 0, block);
      } else {
        blocks.push(block);
      }
      return { blocks };
    });

    return block;
  },

  removeBlock: (blockId) => {
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== blockId),
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
            } as NotebookBlock)
          : b
      ),
    }));
  },

  reorderBlocks: (blockIds) => {
    set((state) => {
      const blockMap = new Map(state.blocks.map((b) => [b.id, b]));
      const reordered = blockIds
        .map((id) => blockMap.get(id))
        .filter((b): b is NotebookBlock => b !== undefined);
      return { blocks: reordered };
    });
  },

  requestFocusBlock: (blockId) => set({ pendingFocusBlockId: blockId }),
  clearPendingFocusBlock: () => set({ pendingFocusBlockId: null }),

  setBlocks: (blocks) => set({ blocks }),
}));
