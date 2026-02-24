import { memo, useState } from 'react';
import { Flame, TrendingUp, Unplug, ChevronDown, ChevronUp, Zap, RotateCcw } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { cn } from '@/lib/utils';
import type { FailureScenario } from '@/types/simulation';
import { NODE_TYPE } from '@/constants';

// ============================================================================
// Preset Failure Scenarios
// ============================================================================

interface PresetScenario {
  label: string;
  description: string;
  icon: typeof Flame;
  createScenario: (nodeId: string) => FailureScenario;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    label: 'Kill Database',
    description: 'Crashes the primary database node',
    icon: Flame,
    createScenario: (nodeId: string): FailureScenario => ({
      id: `db-crash-${Date.now()}`,
      type: 'cascading_failure',
      severity: 'critical',
      affectedNodeIds: [],
      rootCauseNodeId: nodeId,
      detectedAt: 0,
      message: `Database node ${nodeId} has crashed. All dependent services will experience failures.`,
      suggestedPattern: 'Add read replicas and implement circuit breakers to handle database failures gracefully.',
    }),
  },
  {
    label: 'Traffic Spike',
    description: 'Overwhelm a service with 10x normal load',
    icon: TrendingUp,
    createScenario: (nodeId: string): FailureScenario => ({
      id: `traffic-spike-${Date.now()}`,
      type: 'bottleneck',
      severity: 'error',
      affectedNodeIds: [],
      rootCauseNodeId: nodeId,
      detectedAt: 0,
      message: `Service ${nodeId} is experiencing a massive traffic spike. Queue is filling rapidly.`,
      suggestedPattern: 'Consider auto-scaling, rate limiting, or adding a load balancer to distribute traffic.',
    }),
  },
  {
    label: 'Network Partition',
    description: 'Isolate a service from its dependencies',
    icon: Unplug,
    createScenario: (nodeId: string): FailureScenario => ({
      id: `net-partition-${Date.now()}`,
      type: 'timeout',
      severity: 'error',
      affectedNodeIds: [],
      rootCauseNodeId: nodeId,
      detectedAt: 0,
      message: `Network partition detected. ${nodeId} cannot reach its downstream dependencies.`,
      suggestedPattern: 'Implement retry with exponential backoff and circuit breaker pattern.',
    }),
  },
];

// ============================================================================
// Component
// ============================================================================

function FailureScenarioPanelComponent() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Simulation state
  const isInitialized = useSimulationStore((s) => s.isInitialized);
  const activeFailures = useSimulationStore((s) => s.activeFailures);
  const actions = useSimulationStore((s) => s.actions);

  // Canvas nodes (for target selection)
  const nodes = useCanvasStore((s) => s.nodes);

  // Don't render if simulation is not initialized
  if (!isInitialized) return null;

  // Filter to only archComponent nodes
  const archNodes = nodes.filter((n) => n.type === NODE_TYPE.ARCH_COMPONENT);

  // Auto-select first node if none selected
  const targetNodeId = selectedNodeId || archNodes[0]?.id || null;

  const handleTriggerFailure = (preset: PresetScenario) => {
    if (!targetNodeId) return;
    const scenario = preset.createScenario(targetNodeId);
    actions.triggerFailure(scenario);
  };

  const handleRecover = (scenarioId: string) => {
    actions.recoverFromFailure(scenarioId);
  };

  const getSeverityColor = (severity: FailureScenario['severity']) => {
    switch (severity) {
      case 'critical': return 'hsl(var(--destructive))';
      case 'error': return 'hsl(var(--destructive) / 0.7)';
      case 'warning': return 'hsl(var(--warning))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  if (!isExpanded) {
    // Collapsed state: just a tab button
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "absolute right-4 top-4 z-40 flex items-center gap-1.5 rounded-l-lg border px-2.5 py-1.5",
          "transition-colors hover:bg-accent/10"
        )}
        style={{
          borderColor: 'hsl(var(--border))',
          backgroundColor: 'hsl(var(--card) / 0.9)',
        }}
        title="Open failure scenarios panel"
      >
        <Zap className="h-3.5 w-3.5" style={{ color: 'hsl(var(--destructive))' }} />
        <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Failures
        </span>
        {activeFailures.length > 0 && (
          <span
            className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
            style={{
              backgroundColor: 'hsl(var(--destructive))',
              color: 'hsl(var(--destructive-foreground))',
            }}
          >
            {activeFailures.length}
          </span>
        )}
      </button>
    );
  }

  // Expanded state: full panel
  return (
    <div
      className="absolute right-4 top-4 z-40 w-64 rounded-lg border shadow-xl"
      style={{
        borderColor: 'hsl(var(--border))',
        backgroundColor: 'hsl(var(--card))',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-3 py-2"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4" style={{ color: 'hsl(var(--destructive))' }} />
          <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Failure Scenarios
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-accent/20"
          title="Collapse panel"
        >
          <ChevronUp className="h-3.5 w-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </button>
      </div>

      {/* Content */}
      <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto p-3">
        {/* Target Node Selector */}
        {archNodes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Target Node
            </label>
            <select
              value={targetNodeId || ''}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className={cn(
                "w-full rounded border px-2 py-1.5 text-xs transition-colors",
                "focus:outline-none focus:ring-1"
              )}
              style={{
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
              }}
            >
              {archNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data.label || node.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Trigger Failure Section */}
        <div className="flex flex-col gap-2">
          <h3
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Trigger Failure
          </h3>
          {PRESET_SCENARIOS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.label}
                onClick={() => handleTriggerFailure(preset)}
                disabled={!targetNodeId}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-all",
                  "hover:border-destructive/50 hover:bg-destructive/5",
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
                style={{
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" style={{ color: 'hsl(var(--destructive))' }} />
                  <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    {preset.label}
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Failures Section */}
        {activeFailures.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Active Failures ({activeFailures.length})
            </h3>
            {activeFailures.map((failure) => (
              <div
                key={failure.id}
                className="flex flex-col gap-2 rounded-lg border p-2.5"
                style={{
                  borderColor: getSeverityColor(failure.severity),
                  backgroundColor: 'hsl(var(--card))',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: getSeverityColor(failure.severity) }}
                      />
                      <span
                        className="text-xs font-semibold capitalize"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        {failure.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Root: {failure.rootCauseNodeId}
                    </p>
                    {failure.affectedNodeIds.length > 0 && (
                      <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Affected: {failure.affectedNodeIds.join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRecover(failure.id)}
                    className={cn(
                      "flex h-6 items-center gap-1 rounded px-2 text-[10px] font-semibold transition-colors",
                      "hover:bg-accent/20"
                    )}
                    style={{ color: 'hsl(var(--foreground))' }}
                    title="Recover from this failure"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Recover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const FailureScenarioPanel = memo(FailureScenarioPanelComponent);
