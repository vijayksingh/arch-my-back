/**
 * WalkthroughViewer - 2-column layout for interactive walkthrough experiences
 *
 * Layout: Left panel (step content) + Right panel (canvas)
 * - No floating panels, no scrollytelling
 * - One step at a time with navigation buttons
 * - Compound component pattern with shared context
 */

import { AnimatePresence } from 'motion/react';
import type { Walkthrough } from '@/types/walkthrough';
import { WalkthroughProvider, useWalkthroughContext } from './WalkthroughContext';
import { WalkthroughHeader } from './WalkthroughHeader';
import { WalkthroughStepHeader } from './WalkthroughStepHeader';
import { WalkthroughLearningGoals } from './WalkthroughLearningGoals';
import { WalkthroughStepContent } from './WalkthroughStepContent';
import { WalkthroughNavigation } from './WalkthroughNavigation';
import { WalkthroughCanvas } from './WalkthroughCanvas';
import { WalkthroughComplete } from './WalkthroughComplete';

interface WalkthroughViewerProps {
  walkthrough: Walkthrough;
  onComplete?: () => void;
}

export function WalkthroughViewer({ walkthrough, onComplete }: WalkthroughViewerProps) {
  return (
    <WalkthroughProvider walkthrough={walkthrough} onComplete={onComplete}>
      <WalkthroughViewerLayout />
    </WalkthroughProvider>
  );
}

function WalkthroughViewerLayout() {
  const { currentStep, walkthrough } = useWalkthroughContext();

  // Show completion screen when no current step
  if (!currentStep) {
    return <WalkthroughComplete walkthrough={walkthrough} />;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Header: Back Navigation + Progress */}
      <WalkthroughHeader />

      {/* Main Content: Left Panel + Right Panel */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Panel: Step Content */}
        <div className="flex h-full w-[min(42rem,42vw)] min-w-0 flex-col border-r ui-border-ghost bg-background">
          <WalkthroughStepHeader />
          <WalkthroughLearningGoals />
          <AnimatePresence mode="wait">
            <WalkthroughStepContent />
          </AnimatePresence>
          <WalkthroughNavigation />
        </div>

        {/* Right Panel: Canvas */}
        <WalkthroughCanvas />
      </div>
    </div>
  );
}
