import { useNavigate } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';

// Interactive walkthrough metadata
const WALKTHROUGHS = [
  {
    slug: 'netflix-recommendation',
    title: 'Netflix Recommendation System',
    description: '105-minute deep dive into ML-powered recommendations at scale',
    duration: '105 min',
    steps: 15,
    difficulty: 'Intermediate',
    topics: ['Machine Learning', 'Microservices', 'A/B Testing'],
  },
  {
    slug: 'stripe-payments',
    title: 'Stripe Payment Processing',
    description: '105-minute walkthrough of idempotent payment systems',
    duration: '105 min',
    steps: 14,
    difficulty: 'Advanced',
    topics: ['Idempotency', 'State Machines', 'PCI Compliance'],
  },
  {
    slug: 'instagram-feed',
    title: 'Instagram System Design',
    description: '90-minute exploration of feed generation at billion-user scale',
    duration: '90 min',
    steps: 15,
    difficulty: 'Advanced',
    topics: ['Feed Generation', 'CDN', 'Graph Database'],
  },
  {
    slug: 'uber-dispatch',
    title: 'Uber Real-Time Dispatch',
    description: '100-minute hands-on with geospatial algorithms and surge pricing',
    duration: '100 min',
    steps: 14,
    difficulty: 'Advanced',
    topics: ['Geospatial', 'Real-time', 'ETA Prediction'],
  },
  {
    slug: 'twitter-feed',
    title: 'Twitter/X Feed Ranking',
    description: '105-minute journey through fan-out strategies and ML ranking',
    duration: '105 min',
    steps: 15,
    difficulty: 'Advanced',
    topics: ['Fan-out', 'ML Ranking', 'Trending Topics'],
  },
] as const;

interface WalkthroughCardProps {
  walkthrough: typeof WALKTHROUGHS[number];
}

function WalkthroughCard({ walkthrough }: WalkthroughCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate({ to: '/walkthrough/$slug', params: { slug: walkthrough.slug } })}
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_6px_16px_rgba(0,0,0,0.16)] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1.5 line-clamp-2">
              {walkthrough.title}
            </h3>
            <div className="flex gap-2 items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                ⏱️ {walkthrough.duration}
              </span>
              <span className="text-border">•</span>
              <span>{walkthrough.steps} steps</span>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {walkthrough.difficulty}
          </Badge>
        </div>

        {/* Topics */}
        <div className="flex flex-wrap gap-1.5">
          {walkthrough.topics.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="outline" className="text-xs font-normal">
              {topic}
            </Badge>
          ))}
        </div>
      </div>
    </button>
  );
}

/**
 * Grid of interactive walkthrough cards
 */
export function WalkthroughGrid() {
  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Interactive Walkthroughs</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Learn system design concepts
          </p>
        </div>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          View all →
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WALKTHROUGHS.slice(0, 3).map((walkthrough) => (
          <WalkthroughCard key={walkthrough.slug} walkthrough={walkthrough} />
        ))}
      </div>
    </section>
  );
}
