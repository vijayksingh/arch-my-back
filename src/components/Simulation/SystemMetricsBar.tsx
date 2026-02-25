/**
 * SystemMetricsBar — Real-time system-wide metrics strip
 *
 * A compact, data-dense metrics bar for monitoring simulation health.
 * Grafana/DataDog-inspired design with monospace numbers and color-coded warnings.
 */

import { memo } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatThroughput(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k/s`;
  return `${value.toFixed(0)}/s`;
}

function formatLatency(ms: number): string {
  if (!isFinite(ms)) return '∞';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms.toFixed(0)}ms`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getMetricColor(metric: string, value: number): string {
  switch (metric) {
    case 'errorRate':
      if (value > 5) return 'hsl(0 84% 60%)'; // red
      if (value > 1) return 'hsl(45 93% 47%)'; // yellow
      return 'hsl(var(--foreground))';
    case 'latency':
      if (value > 500) return 'hsl(0 84% 60%)'; // red
      if (value > 200) return 'hsl(45 93% 47%)'; // yellow
      return 'hsl(var(--foreground))';
    case 'queueDepth':
      if (value > 5000) return 'hsl(0 84% 60%)'; // red
      if (value > 1000) return 'hsl(45 93% 47%)'; // yellow
      return 'hsl(var(--foreground))';
    case 'nodes': {
      // Color red if any unhealthy nodes
      const unhealthyCount = Math.floor(value); // value is unhealthyNodeCount
      if (unhealthyCount > 0) return 'hsl(0 84% 60%)'; // red
      return 'hsl(var(--foreground))';
    }
    default:
      return 'hsl(var(--foreground))';
  }
}

// ============================================================================
// Component
// ============================================================================

function SystemMetricsBarComponent() {
  const metrics = useSimulationStore((s) => s.systemMetrics);
  const isInitialized = useSimulationStore((s) => s.isInitialized);

  const totalNodes = metrics.healthyNodeCount + metrics.unhealthyNodeCount;
  const nodeColor = getMetricColor('nodes', metrics.unhealthyNodeCount);

  // Don't render until simulation is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 h-8 flex items-center gap-4 px-4 border-t"
      style={{
        backgroundColor: 'hsl(var(--card) / 0.9)',
        borderColor: 'hsl(var(--border))',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Throughput */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-mono">Throughput</span>
        <span
          className="text-[10px] font-mono tabular-nums"
          style={{ color: getMetricColor('throughput', metrics.totalThroughput) }}
        >
          {formatThroughput(metrics.totalThroughput)}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Latency */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-mono">Latency</span>
        <span
          className="text-[10px] font-mono tabular-nums"
          style={{ color: getMetricColor('latency', metrics.averageLatency) }}
        >
          {formatLatency(metrics.averageLatency)}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Error Rate */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-mono">Errors</span>
        <span
          className="text-[10px] font-mono tabular-nums"
          style={{ color: getMetricColor('errorRate', metrics.errorRate) }}
        >
          {formatPercent(metrics.errorRate)}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Nodes Health */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-mono">Nodes</span>
        <span className="text-[10px] font-mono tabular-nums" style={{ color: nodeColor }}>
          {metrics.healthyNodeCount}/{totalNodes} healthy
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Queue Depth */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-mono">Queue</span>
        <span
          className="text-[10px] font-mono tabular-nums"
          style={{ color: getMetricColor('queueDepth', metrics.peakQueueDepth) }}
        >
          {metrics.peakQueueDepth.toFixed(0)}
        </span>
      </div>

      {/* Spacer to push remaining content right if needed */}
      <div className="flex-1" />

      {/* Active Requests */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-mono">Active</span>
        <span className="text-[10px] font-mono tabular-nums text-foreground">
          {metrics.activeRequestCount.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

export const SystemMetricsBar = memo(SystemMetricsBarComponent);
