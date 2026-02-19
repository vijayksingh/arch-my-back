import { useNavigate } from '@tanstack/react-router';
import type { Doc } from '../../../convex/_generated/dataModel';

interface DesignCardProps {
  design: Doc<'newDesigns'>;
}

export function DesignCard({ design }: DesignCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: '/design/$designId', params: { designId: design._id } });
  };

  const lastUpdated = new Date(design.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <button
      onClick={handleClick}
      className="group relative flex flex-col items-start rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-accent hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-accent">
        {design.title}
      </h3>
      {design.description && (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {design.description}
        </p>
      )}
      <div className="mt-auto text-xs text-muted-foreground">
        Updated {lastUpdated}
      </div>
    </button>
  );
}
