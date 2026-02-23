import { DesignListItem } from './DesignCard';
import type { Doc } from '../../../convex/_generated/dataModel';

interface DesignGridProps {
  designs: Doc<'newDesigns'>[];
  title?: string;
  maxVisible?: number;
}

/**
 * Grid of design cards with optional title and "View all" link
 */
export function DesignGrid({ designs, title = 'Recent Designs', maxVisible = 8 }: DesignGridProps) {
  if (designs.length === 0) {
    return null;
  }

  const visibleDesigns = designs.slice(0, maxVisible);
  const hasMore = designs.length > maxVisible;

  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        {hasMore && (
          <button className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleDesigns.map((design) => (
          <DesignListItem key={design._id} design={design} />
        ))}
      </div>
    </section>
  );
}
