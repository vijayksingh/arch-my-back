/**
 * LoadSlider — User-controlled traffic pressure
 *
 * Horizontal slider that lets users control entry traffic from 10% to 300%.
 * Transforms simulation from "watch mode" to "play mode" where users discover
 * bottlenecks organically by dragging the slider.
 *
 * Design: Green→amber→red gradient, shows percentage, disabled when sim not active.
 */

import { memo, useCallback } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';

// ============================================================================
// Component
// ============================================================================

function LoadSliderComponent() {
  const isRunning = useSimulationStore((s) => s.isRunning);
  const isInitialized = useSimulationStore((s) => s.isInitialized);
  const loadMultiplier = useSimulationStore((s) => s.loadMultiplier);
  const setLoadMultiplier = useSimulationStore((s) => s.actions.setLoadMultiplier);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setLoadMultiplier(value);
    },
    [setLoadMultiplier]
  );

  // Don't render until simulation is initialized
  if (!isInitialized) {
    return null;
  }

  const isDisabled = !isRunning;
  const percentage = Math.round(loadMultiplier * 100);

  // Color based on load level: green (10-80%), amber (80-150%), red (150%+)
  const getLoadColor = (multiplier: number): string => {
    if (multiplier <= 0.8) return 'hsl(142 76% 36%)'; // green
    if (multiplier <= 1.5) return 'hsl(45 93% 47%)'; // amber
    return 'hsl(0 84% 60%)'; // red
  };

  const loadColor = getLoadColor(loadMultiplier);

  return (
    <div
      className={cn(
        "absolute top-3 right-3 z-30 flex items-center gap-3 px-3 py-2 rounded-lg border",
        "backdrop-blur-sm transition-opacity",
        isDisabled ? "opacity-50 cursor-not-allowed" : "opacity-100"
      )}
      style={{
        backgroundColor: 'hsl(var(--card) / 0.95)',
        borderColor: 'hsl(var(--border))',
      }}
    >
      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">
          Load
        </span>
        <span
          className="text-xs font-mono font-semibold tabular-nums"
          style={{ color: isDisabled ? 'hsl(var(--muted-foreground))' : loadColor }}
        >
          {percentage}%
        </span>
      </div>

      {/* Slider */}
      <div className="relative w-32">
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={loadMultiplier}
          onChange={handleChange}
          disabled={isDisabled}
          aria-label="Load multiplier"
          aria-valuetext={`${percentage}% load`}
          className={cn(
            "w-full h-2 rounded-full appearance-none cursor-pointer",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed load-slider"
          )}
          style={{
            background: isDisabled
              ? 'hsl(var(--muted))'
              : `linear-gradient(to right,
                  hsl(142 76% 36%) 0%,
                  hsl(142 76% 36%) 24%,
                  hsl(45 93% 47%) 48%,
                  hsl(0 84% 60%) 100%)`,
            // CSS custom properties for thumb styling
            ['--thumb-border-color' as string]: isDisabled ? 'hsl(var(--muted-foreground))' : loadColor,
            ['--thumb-hover-shadow' as string]: `${loadColor}22`,
          }}
        />
        {/* Tick marks (optional visual aid) */}
        <div className="absolute -bottom-3 left-0 right-0 flex justify-between text-[8px] text-muted-foreground/60 font-mono pointer-events-none">
          <span>10%</span>
          <span>100%</span>
          <span>300%</span>
        </div>
      </div>
    </div>
  );
}

export const LoadSlider = memo(LoadSliderComponent);
