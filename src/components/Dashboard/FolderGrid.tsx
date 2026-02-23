import { FolderCard } from './FolderCard';
import type { Doc, Id } from '../../../convex/_generated/dataModel';

interface FolderGridProps {
  folders: Doc<'folders'>[];
  folderDesignCounts: Map<string, number>;
  overedFolderId: Id<'folders'> | null;
}

/**
 * Grid of folder cards with drag-and-drop support
 */
export function FolderGrid({ folders, folderDesignCounts, overedFolderId }: FolderGridProps) {
  if (folders.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <h2 className="mb-4 text-base font-semibold">Folders</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder._id}
            folder={folder}
            designCount={folderDesignCounts.get(folder._id) || 0}
            isDropTarget={overedFolderId === folder._id}
          />
        ))}
      </div>
    </section>
  );
}
