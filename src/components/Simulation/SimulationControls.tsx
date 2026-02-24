import { memo } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';

function SimulationControlsComponent() {
  const isInitialized = useSimulationStore((s) => s.isInitialized);
  const isRunning = useSimulationStore((s) => s.isRunning);
  const isBroken = useSimulationStore((s) => s.isBroken);
  const isTeaching = useSimulationStore((s) => s.isTeaching);
  const speed = useSimulationStore((s) => s.speed);
  // Throttle to 1/sec: round to nearest second in ms so selector only returns new value once per second
  const currentTime = useSimulationStore((s) => Math.floor(s.currentTime / 1000) * 1000);
  const actions = useSimulationStore((s) => s.actions);

  // Don't render if simulation is not initialized
  if (!isInitialized) return null;

  const statusColor = isRunning ? '#22c55e' : isBroken ? '#ef4444' : isTeaching ? '#3b82f6' : '#eab308';

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  const handlePlayPause = () => {
    if (isRunning) {
      actions.pause();
    } else {
      actions.start(); // start handles both initial start and resume
    }
  };

  return (
    <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1"
         style={{
           borderColor: 'hsl(var(--border))',
           backgroundColor: 'hsl(var(--card) / 0.8)',
         }}>
      {/* Status dot */}
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: statusColor }}
      />

      {/* Play/Pause */}
      <button
        onClick={handlePlayPause}
        disabled={isBroken || isTeaching}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          "hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        title={isRunning ? 'Pause simulation' : 'Start simulation'}
      >
        {isRunning ? (
          <Pause className="h-3.5 w-3.5" style={{ color: 'hsl(var(--foreground))' }} />
        ) : (
          <Play className="h-3.5 w-3.5" style={{ color: 'hsl(var(--foreground))' }} />
        )}
      </button>

      {/* Reset */}
      <button
        onClick={actions.reset}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          "hover:bg-accent/20"
        )}
        title="Reset simulation"
      >
        <RotateCcw className="h-3.5 w-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
      </button>

      {/* Divider */}
      <div className="mx-0.5 h-4 w-px" style={{ backgroundColor: 'hsl(var(--border))' }} />

      {/* Speed selector */}
      <div className="flex items-center gap-0.5">
        {([1, 2, 4] as const).map((s) => (
          <button
            key={s}
            onClick={() => actions.setSpeed(s)}
            className={cn(
              "flex h-6 min-w-[28px] items-center justify-center rounded px-1 text-[10px] font-semibold transition-colors",
              speed === s
                ? "bg-accent/30 text-foreground"
                : "text-muted-foreground hover:bg-accent/15 hover:text-foreground"
            )}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-0.5 h-4 w-px" style={{ backgroundColor: 'hsl(var(--border))' }} />

      {/* Time display */}
      <span
        className="min-w-[40px] text-center text-[11px] font-mono tabular-nums"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        {formatTime(currentTime)}
      </span>
    </div>
  );
}

export const SimulationControls = memo(SimulationControlsComponent);
