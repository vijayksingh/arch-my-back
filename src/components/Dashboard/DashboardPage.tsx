import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { DesignCard } from './DesignCard';
import { FolderCard } from './FolderCard';

export function DashboardPage() {
  const navigate = useNavigate();
  const designs = useQuery(api.newDesigns.list);
  const folders = useQuery(api.folders.list);
  const createDesign = useMutation(api.newDesigns.create);

  const handleCreateDesign = async () => {
    const now = new Date();
    const title = `Untitled Design ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    try {
      const designId = await createDesign({ title });
      navigate({ to: '/design/$designId', params: { designId } });
    } catch (error) {
      console.error('Failed to create design:', error);
    }
  };

  // Count designs per folder
  const folderDesignCounts = new Map<string, number>();
  designs?.forEach((design) => {
    if (design.folderId) {
      folderDesignCounts.set(
        design.folderId,
        (folderDesignCounts.get(design.folderId) || 0) + 1
      );
    }
  });

  // Separate designs in folders vs at root
  const rootDesigns = designs?.filter((d) => !d.folderId) || [];

  const isLoading = designs === undefined || folders === undefined;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Designs</h1>
          <button
            onClick={handleCreateDesign}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" />
            New Design
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Folders section */}
        {folders && folders.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Folders</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {folders.map((folder) => (
                <FolderCard
                  key={folder._id}
                  folder={folder}
                  designCount={folderDesignCounts.get(folder._id) || 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Root designs section */}
        {rootDesigns.length > 0 ? (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {folders && folders.length > 0 ? 'Recent Designs' : 'All Designs'}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rootDesigns.map((design) => (
                <DesignCard key={design._id} design={design} />
              ))}
            </div>
          </div>
        ) : (
          folders && folders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="mb-4 text-lg text-muted-foreground">
                No designs yet. Create your first design to get started!
              </p>
              <button
                onClick={handleCreateDesign}
                className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <PlusIcon className="h-5 w-5" />
                Create Design
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
