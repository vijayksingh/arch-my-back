import { useNavigate } from '@tanstack/react-router';
import { FolderIcon } from 'lucide-react';
import type { Doc } from '../../../convex/_generated/dataModel';

interface FolderCardProps {
  folder: Doc<'folders'>;
  designCount?: number;
}

export function FolderCard({ folder, designCount = 0 }: FolderCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: '/folder/$folderId', params: { folderId: folder._id } });
  };

  return (
    <button
      onClick={handleClick}
      className="group relative flex flex-col items-start rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-accent hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      <div className="mb-3 flex items-center gap-2">
        <FolderIcon className="h-5 w-5 text-muted-foreground group-hover:text-accent" />
        <h3 className="text-lg font-semibold text-foreground group-hover:text-accent">
          {folder.title}
        </h3>
      </div>
      <div className="text-sm text-muted-foreground">
        {designCount} {designCount === 1 ? 'design' : 'designs'}
      </div>
    </button>
  );
}
