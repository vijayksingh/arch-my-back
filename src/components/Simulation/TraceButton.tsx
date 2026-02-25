/**
 * TraceButton — Toggle trace mode for request tracing
 *
 * When enabled, clicking an entry node during simulation starts a tracer particle
 * that follows the request path through the system, pausing at each node
 * proportional to its latency. Teaches distributed tracing (Jaeger/Zipkin).
 *
 * Design: Positioned near LoadSlider, crosshair icon, toggle button style.
 */

import { memo, useCallback } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';

function TraceButtonComponent() {
  const isRunning = useSimulationStore((s) => s.isRunning);
  const isInitialized = useSimulationStore((s) => s.isInitialized);
  const isTraceMode = useSimulationStore((s) => s.isTraceMode);
  const setTraceMode = useSimulationStore((s) => s.actions.setTraceMode);

  const handleToggle = useCallback(() => {
    setTraceMode(!isTraceMode);
  }, [isTraceMode, setTraceMode]);

  // Don't render until simulation is initialized
  if (!isInitialized) {
    return null;
  }

  const isDisabled = !isRunning;

  return (
    <button
      onClick={handleToggle}
      disabled={isDisabled}
      className={cn(
        "absolute top-3 right-[260px] z-30 flex items-center gap-2 px-3 py-2 rounded-lg border",
        "backdrop-blur-sm transition-all",
        "hover:scale-105 active:scale-95",
        isDisabled
          ? "opacity-50 cursor-not-allowed"
          : isTraceMode
            ? "opacity-100 ring-2 ring-blue-400/60"
            : "opacity-100 hover:ring-2 hover:ring-blue-400/40"
      )}
      style={{
        backgroundColor: isTraceMode
          ? 'hsl(var(--primary) / 0.15)'
          : 'hsl(var(--card) / 0.95)',
        borderColor: isTraceMode
          ? 'hsl(var(--primary) / 0.6)'
          : 'hsl(var(--border))',
      }}
      title={isDisabled
        ? "Start simulation to enable tracing"
        : isTraceMode
          ? "Click entry node to trace request path"
          : "Enable trace mode"}
    >
      <Target
        className={cn(
          "w-3.5 h-3.5 transition-colors",
          isDisabled
            ? "text-muted-foreground"
            : isTraceMode
              ? "text-primary"
              : "text-muted-foreground"
        )}
      />
      <span
        className={cn(
          "text-[10px] font-mono uppercase tracking-wide transition-colors",
          isDisabled
            ? "text-muted-foreground"
            : isTraceMode
              ? "text-primary"
              : "text-muted-foreground"
        )}
      >
        Trace
      </span>
    </button>
  );
}

export const TraceButton = memo(TraceButtonComponent);
