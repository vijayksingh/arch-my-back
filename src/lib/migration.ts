/**
 * Migration utility for moving localStorage data to Convex
 *
 * Detects existing localStorage data (workspaces, canvas designs) and migrates
 * it to Convex on first login. Runs automatically, shows progress, and handles
 * errors gracefully.
 */

import type { CanvasNode, ArchEdge, CanvasSection, NotebookBlock } from '@/types';
import type { FunctionReturnType } from 'convex/server';
import type { api } from '../../convex/_generated/api';

const KEY_PREFIX = 'archmyback_';
const MIGRATION_FLAG_KEY = 'archmyback_migrated';

/**
 * Old localStorage format that was stored per workspace
 */
interface OldWorkspaceData {
  nodes: CanvasNode[];
  edges: ArchEdge[];
  sections?: CanvasSection[];
  blocks?: NotebookBlock[];
  viewMode?: 'document' | 'both' | 'canvas';
  activeCanvasTool?: 'cursor' | 'select' | 'rectangle' | 'circle' | 'text';
  documentEditorMode?: 'edit' | 'preview';
}

/**
 * Result of migration attempt
 */
export interface MigrationResult {
  success: boolean;
  workspaceId?: string;
  error?: string;
  migratedKeys?: string[];
}

/**
 * Check if there is old localStorage data that needs migration
 */
export function hasOldLocalStorageData(): boolean {
  // Check if already migrated
  if (localStorage.getItem(MIGRATION_FLAG_KEY)) {
    return false;
  }

  // Check for any keys with the old prefix
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX) && key !== MIGRATION_FLAG_KEY) {
        return true;
      }
    }
  } catch (e) {
    console.error('Failed to check localStorage:', e);
  }

  return false;
}

/**
 * Get all old localStorage keys
 */
function getOldLocalStorageKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey && fullKey.startsWith(KEY_PREFIX) && fullKey !== MIGRATION_FLAG_KEY) {
        keys.push(fullKey.slice(KEY_PREFIX.length));
      }
    }
  } catch (e) {
    console.error('Failed to list localStorage keys:', e);
  }
  return keys;
}

/**
 * Parse old workspace data from localStorage
 */
function parseOldWorkspaceData(key: string): OldWorkspaceData | null {
  try {
    const fullKey = `${KEY_PREFIX}${key}`;
    const json = localStorage.getItem(fullKey);
    if (!json) return null;

    const data = JSON.parse(json) as OldWorkspaceData;
    return data;
  } catch (e) {
    console.error(`Failed to parse localStorage data for key ${key}:`, e);
    return null;
  }
}

/**
 * Migrate old localStorage data to Convex
 * Creates a new workspace with the migrated data
 */
export async function migrateLocalStorageToConvex(
  createWorkspace: (args: {
    title: string;
    viewMode?: 'document' | 'both' | 'canvas';
    activeCanvasTool?: 'cursor' | 'select' | 'rectangle' | 'circle' | 'text';
    documentEditorMode?: 'edit' | 'preview';
  }) => Promise<FunctionReturnType<typeof api.workspaces.createWorkspace>>,
  saveDesign: (args: {
    workspaceId: string;
    nodes: CanvasNode[];
    edges: ArchEdge[];
    sections: CanvasSection[];
  }) => Promise<unknown>,
  createBlocks: (args: {
    workspaceId: string;
    blocks: Array<{
      blockId: string;
      type: 'text' | 'requirements' | 'schema' | 'api' | 'lld';
      sectionId: string | null;
      data: unknown;
      createdAt: number;
    }>;
  }) => Promise<unknown>,
): Promise<MigrationResult> {
  try {
    // Get all old localStorage keys
    const keys = getOldLocalStorageKeys();

    if (keys.length === 0) {
      // Mark as migrated even if no data found
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return { success: true, migratedKeys: [] };
    }

    // Find the most recent design (prefer 'autosave' or first key)
    let targetKey = keys.find(k => k === 'autosave') || keys[0];
    const data = parseOldWorkspaceData(targetKey);

    if (!data) {
      // Failed to parse, but mark as migrated to avoid retry loops
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return {
        success: false,
        error: 'Failed to parse old workspace data',
      };
    }

    // Create workspace with migrated settings
    const workspaceId = await createWorkspace({
      title: targetKey === 'autosave' ? 'My Workspace' : targetKey,
      viewMode: data.viewMode || 'both',
      activeCanvasTool: data.activeCanvasTool || 'cursor',
      documentEditorMode: data.documentEditorMode || 'edit',
    });

    // Migrate canvas data if it exists
    if (data.nodes || data.edges || data.sections) {
      await saveDesign({
        workspaceId: workspaceId as string,
        nodes: (data.nodes || []).map((n: any) => ({
          id: n.id,
          type: n.type,
          position: { x: n.position.x, y: n.position.y },
          data: n.data,
          ...(n.style != null ? { style: n.style } : {}),
        })),
        edges: (data.edges || []).map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          ...(e.type != null ? { type: e.type } : {}),
          ...(e.data != null ? { data: e.data } : {}),
          ...(e.sourceHandle != null ? { sourceHandle: e.sourceHandle } : {}),
          ...(e.targetHandle != null ? { targetHandle: e.targetHandle } : {}),
        })),
        sections: data.sections || [],
      });
    }

    // Migrate blocks if they exist
    if (data.blocks && data.blocks.length > 0) {
      await createBlocks({
        workspaceId: workspaceId as string,
        blocks: data.blocks.map(block => ({
          blockId: block.id,
          type: block.type,
          sectionId: block.sectionId,
          data: block.data,
          createdAt: block.createdAt,
        })),
      });
    }

    // Clear old localStorage keys (keep as backup initially)
    // We'll only mark as migrated, not delete the keys yet
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

    return {
      success: true,
      workspaceId: workspaceId as string,
      migratedKeys: keys,
    };
  } catch (e) {
    console.error('Migration failed:', e);
    // Mark as migrated to avoid retry loops even on failure
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error during migration',
    };
  }
}

/**
 * Clear old localStorage keys after successful migration
 * This should be called after user confirms migration success
 */
export function clearOldLocalStorageData(): void {
  try {
    const keys = getOldLocalStorageKeys();
    for (const key of keys) {
      const fullKey = `${KEY_PREFIX}${key}`;
      localStorage.removeItem(fullKey);
    }
  } catch (e) {
    console.error('Failed to clear old localStorage:', e);
  }
}

/**
 * Reset migration flag (for testing purposes)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_FLAG_KEY);
}
