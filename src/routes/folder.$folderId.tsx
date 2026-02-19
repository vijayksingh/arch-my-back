import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { ArrowLeftIcon } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { DesignCard } from '@/components/Dashboard/DesignCard';
import type { Id } from '../../convex/_generated/dataModel';

export const Route = createFileRoute('/folder/$folderId')({
  component: FolderViewPage,
});

function FolderViewPage() {
  const { folderId } = Route.useParams();
  const navigate = useNavigate();

  const folder = useQuery(api.folders.list);
  const designs = useQuery(api.newDesigns.listByFolder, { folderId: folderId as Id<'folders'> });

  const currentFolder = folder?.find((f) => f._id === folderId);

  const isLoading = folder === undefined || designs === undefined;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading folder...</div>
        </div>
      </div>
    );
  }

  if (!currentFolder) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="mb-4 text-lg">Folder not found</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-accent hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/' })}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">{currentFolder.title}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {designs && designs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designs.map((design) => (
              <DesignCard key={design._id} design={design} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">
              This folder is empty. Create a design and move it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
