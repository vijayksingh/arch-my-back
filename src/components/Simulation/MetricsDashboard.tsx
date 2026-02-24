import { memo, useMemo, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';
import { Sparkline } from '@/components/Simulation';
import { cn } from '@/lib/utils';

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatThroughput(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k/s`;
  return `${Math.round(value)}/s`;
}

function formatLatency(value: number): string {
  if (!isFinite(value)) return '∞';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}

function formatErrorRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ============================================================================
// Chart Configuration
// ============================================================================

const CHART_CONFIGS = [
  {
    key: 'throughput',
    label: 'Throughput',
    color: 'hsl(142 71% 45%)',
    format: formatThroughput,
  },
  {
    key: 'latency',
    label: 'Latency',
    color: 'hsl(45 93% 47%)',
    format: formatLatency,
  },
  {
    key: 'errorRate',
    label: 'Error Rate',
    color: 'hsl(0 84% 60%)',
    format: formatErrorRate,
  },
] as const;

// ============================================================================
// Component
// ============================================================================

function MetricsDashboardComponent() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulation state - using granular selectors
  const isInitialized = useSimulationStore((s) => s.isInitialized);
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);
  const systemMetrics = useSimulationStore((s) => s.systemMetrics);

  // Don't render if simulation is not initialized
  if (!isInitialized) return null;

  // Extract data arrays from metrics history
  const throughputData = useMemo(
    () => metricsHistory.map((s) => s.metrics.totalThroughput),
    [metricsHistory]
  );
  const latencyData = useMemo(
    () => metricsHistory.map((s) => s.metrics.averageLatency),
    [metricsHistory]
  );
  const errorRateData = useMemo(
    () => metricsHistory.map((s) => s.metrics.errorRate),
    [metricsHistory]
  );

  // Map chart configs to their data and current values
  const chartData = useMemo(() => {
    return [
      { config: CHART_CONFIGS[0], data: throughputData, currentValue: systemMetrics.totalThroughput },
      { config: CHART_CONFIGS[1], data: latencyData, currentValue: systemMetrics.averageLatency },
      { config: CHART_CONFIGS[2], data: errorRateData, currentValue: systemMetrics.errorRate },
    ];
  }, [throughputData, latencyData, errorRateData, systemMetrics]);

  if (!isExpanded) {
    // Collapsed state: small tab button
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'absolute left-4 top-4 z-40 flex items-center gap-1.5 rounded-r-lg border px-2.5 py-1.5',
          'transition-colors hover:bg-accent/10'
        )}
        style={{
          borderColor: 'hsl(var(--border))',
          backgroundColor: 'hsl(var(--card) / 0.95)',
        }}
        title="Open metrics dashboard"
      >
        <BarChart3 className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
        <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Metrics
        </span>
        <ChevronRight className="h-3 w-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
      </button>
    );
  }

  // Expanded state: full panel with charts
  return (
    <div
      className="absolute left-4 top-4 z-40 w-[280px] rounded-lg border shadow-lg backdrop-blur-sm"
      style={{
        borderColor: 'hsl(var(--border))',
        backgroundColor: 'hsl(var(--card) / 0.95)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-3 py-2"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
          <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Metrics
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-accent/20"
          title="Collapse panel"
        >
          <ChevronLeft className="h-3.5 w-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </button>
      </div>

      {/* Chart Grid */}
      <div className="flex flex-col gap-3 p-3">
        {chartData.map(({ config, data, currentValue }) => (
          <div key={config.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{config.label}</span>
              <span
                className="text-[11px] font-mono tabular-nums"
                style={{ color: config.color }}
              >
                {config.format(currentValue)}
              </span>
            </div>
            <Sparkline
              data={data}
              width={248}
              height={32}
              color={config.color}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export const MetricsDashboard = memo(MetricsDashboardComponent);
