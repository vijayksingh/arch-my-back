/**
 * Walkthrough route - Interactive learning experiences
 * URL: /walkthrough/{slug}
 * Example: /walkthrough/netflix-recommendation
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { WalkthroughViewer } from '@/components/Walkthrough/WalkthroughViewer';
import { getWalkthroughBySlug } from '@/walkthroughs';

export const Route = createFileRoute('/walkthrough/$slug')({
  component: WalkthroughPage,
});

function WalkthroughPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  // Load walkthrough data from the index
  const walkthrough = getWalkthroughBySlug(slug);

  const handleComplete = () => {
    // Navigate back to dashboard
    navigate({ to: '/dashboard' });
  };

  // Show fallback for unknown slugs
  if (!walkthrough) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold mb-4">Walkthrough Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The walkthrough "{slug}" does not exist.
          </p>
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <WalkthroughViewer
        walkthrough={walkthrough}
        onComplete={handleComplete}
      />
    </div>
  );
}
