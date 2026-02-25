/**
 * SimulationMetricsWidget - Compact metrics display for walkthrough text panel
 * Shows real-time simulation metrics inline with walkthrough narrative
 */

import { memo } from 'react';
import { Activity, Clock, AlertTriangle, Server, Layers } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';
import type { SimulationMetricsWidgetConfig } from '@/types/walkthrough';

interface SimulationMetricsWidgetProps {
  config: SimulationMetricsWidgetConfig;
}

function SimulationMetricsWidgetComponent({ config }: SimulationMetricsWidgetProps) {
  const { systemMetrics, isInitialized, isRunning } = useSimulationStore(s => ({
    systemMetrics: s.systemMetrics,
    isInitialized: s.isInitialized,
    isRunning: s.isRunning,
  }));

  // Default metrics if not specified
  const metricsToShow = config.metrics || ['throughput', 'latency', 'errorRate'];
  const title = config.title || 'Simulation Metrics';

  // Not initialized state
  if (!isInitialized) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-4 text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          <span>Start simulation to see live metrics</span>
        </div>
      </div>
    );
  }

  // Metric rendering helper
  const renderMetric = (metricType: string) => {
    switch (metricType) {
      case 'throughput': {
        const value = Math.round(systemMetrics.totalThroughput);
        return (
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Throughput</span>
              <span className="text-sm font-medium">{value}/s</span>
            </div>
          </div>
        );
      }
      case 'latency': {
        const value = Math.round(systemMetrics.averageLatency);
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Latency</span>
              <span className="text-sm font-medium">{value}ms</span>
            </div>
          </div>
        );
      }
      case 'errorRate': {
        const value = (systemMetrics.errorRate * 100).toFixed(1);
        const hasErrors = systemMetrics.errorRate > 0;
        return (
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-4 w-4",
              hasErrors ? "text-red-500" : "text-muted-foreground"
            )} />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Error Rate</span>
              <span className={cn(
                "text-sm font-medium",
                hasErrors && "text-red-500"
              )}>
                {value}%
              </span>
            </div>
          </div>
        );
      }
      case 'healthyNodes': {
        const total = systemMetrics.healthyNodeCount + systemMetrics.unhealthyNodeCount;
        return (
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-green-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Healthy Nodes</span>
              <span className="text-sm font-medium">
                {systemMetrics.healthyNodeCount}/{total}
              </span>
            </div>
          </div>
        );
      }
      case 'queueDepth': {
        const value = Math.round(systemMetrics.peakQueueDepth);
        return (
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Peak Queue</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm p-4">
      {/* Title bar with status indicator */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isRunning ? "bg-green-500 animate-pulse" : "bg-yellow-500"
          )} />
          <span className="text-xs text-muted-foreground">
            {isRunning ? 'Live' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className={cn(
        "grid gap-3",
        metricsToShow.length === 1 && "grid-cols-1",
        metricsToShow.length === 2 && "grid-cols-2",
        metricsToShow.length >= 3 && "grid-cols-2 sm:grid-cols-3"
      )}>
        {metricsToShow.map(metric => (
          <div key={metric}>
            {renderMetric(metric)}
          </div>
        ))}
      </div>
    </div>
  );
}

export const SimulationMetricsWidget = memo(SimulationMetricsWidgetComponent);
