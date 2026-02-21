/**
 * Walkthrough route - Interactive learning experiences
 * URL: /walkthrough/netflix-recommendations
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
// import { useQuery } from 'convex/react';
// import { api } from '../../convex/_generated/api';
import { WalkthroughViewer } from '@/components/Walkthrough/WalkthroughViewer';

export const Route = createFileRoute('/walkthrough/$slug')({
  component: WalkthroughPage,
});

function WalkthroughPage() {
  // const { slug } = Route.useParams();
  const navigate = useNavigate();

  // TODO: Load walkthrough from database
  // const walkthrough = useQuery(api.walkthroughs.getBySlug, { slug });

  // For now, show a placeholder
  const placeholderSteps = [
    {
      id: 'step-1',
      title: 'Welcome to the Walkthrough',
      content: `# Getting Started

This is an interactive walkthrough that will teach you system architecture step by step.

## What you'll learn:
- How to design scalable systems
- Best practices for architecture
- Real-world examples

Let's begin!`,
      canvasOperations: [],
      nextCondition: 'click' as const,
    },
    {
      id: 'step-2',
      title: 'Your First Component',
      content: `# Adding Components

Now let's add our first component to the canvas.

We'll start with a simple **User** node.`,
      canvasOperations: [
        {
          type: 'add-node' as const,
          node: {
            id: 'user-1',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: {
              componentType: 'client',
              label: 'User',
              config: {},
            },
          },
        },
      ],
      nextCondition: 'click' as const,
    },
    {
      id: 'step-3',
      title: 'Test Your Knowledge',
      content: `# Quick Quiz

Let's test what you've learned so far.`,
      canvasOperations: [],
      quiz: {
        question: 'What type of component did we just add?',
        options: [
          'Database',
          'Client',
          'Server',
          'Cache',
        ],
        correctIndex: 1,
        explanation: 'We added a Client component representing the User.',
      },
      nextCondition: 'quiz-correct' as const,
    },
  ];

  const handleComplete = () => {
    // Navigate back to dashboard or show completion screen
    navigate({ to: '/' });
  };

  return (
    <div className="h-screen">
      <WalkthroughViewer
        steps={placeholderSteps}
        onComplete={handleComplete}
      />
    </div>
  );
}
