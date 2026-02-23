/**
 * WalkthroughHeader - Top navigation bar with back button and progress
 */

import { ArrowLeft } from 'lucide-react';
import { useWalkthroughContext } from './WalkthroughContext';

export function WalkthroughHeader() {
  const { walkthrough, progress, handleBack } = useWalkthroughContext();

  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{walkthrough.title}</span>
      </button>
      <div className="text-xs font-medium text-muted-foreground">
        Step {progress.current} of {progress.total}
      </div>
    </div>
  );
}
