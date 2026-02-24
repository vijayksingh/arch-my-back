import { memo, useState, useMemo } from 'react';
import {
  Flame,
  TrendingUp,
  Unplug,
  ChevronUp,
  Zap,
  RotateCcw,
  Timer,
  HardDrive,
  Database,
  Layers,
  CloudOff,
  ServerOff,
  type LucideIcon
} from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { cn } from '@/lib/utils';
import type { FailureScenario } from '@/types/simulation';
import type { ArchNode, CanvasNode } from '@/types';
import { SCENARIO_LIBRARY, type ScenarioDefinition } from '@/lib/simulation/failureScenarioLibrary';
import { NODE_TYPE } from '@/constants';

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  'trending-up': TrendingUp,
  unplug: Unplug,
  timer: Timer,
  'memory-stick': HardDrive,
  database: Database,
  layers: Layers,
  'cloud-off': CloudOff,
  'server-crash': ServerOff,
  zap: Zap,
};

// ============================================================================
// Difficulty Badge Component
// ============================================================================

function DifficultyBadge({ difficulty }: { difficulty: ScenarioDefinition['difficulty'] }) {
  const colors = {
    beginner: { bg: 'hsl(142 71% 45% / 0.15)', text: 'hsl(142 71% 45%)' },
    intermediate: { bg: 'hsl(45 93% 47% / 0.15)', text: 'hsl(45 93% 47%)' },
    advanced: { bg: 'hsl(0 84% 60% / 0.15)', text: 'hsl(0 84% 60%)' },
  };
  const c = colors[difficulty];
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {difficulty.slice(0, 3)}
    </span>
  );
}

// ============================================================================
// Type Guard
// ============================================================================

function isArchNode(n: CanvasNode): n is ArchNode {
  return n.type === NODE_TYPE.ARCH_COMPONENT;
}

// ============================================================================
// Component
// ============================================================================

function FailureScenarioPanelComponent() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);

  // Simulation state
  const isInitialized = useSimulationStore((s) => s.isInitialized);
  const activeFailures = useSimulationStore((s) => s.activeFailures);
  const actions = useSimulationStore((s) => s.actions);

  // Canvas nodes (for target selection)
  const nodes = useCanvasStore((s) => s.nodes);

  // Don't render if simulation is not initialized
  if (!isInitialized) return null;

  // PERF #15: Memoize archNodes filter to avoid re-filtering on every render
  const archNodes = useMemo(() => nodes.filter(isArchNode), [nodes]);

  // Auto-select first node if none selected
  const targetNodeId = selectedNodeId || archNodes[0]?.id || null;

  // Filter scenarios by category
  const filteredScenarios = activeCategory === 'all'
    ? SCENARIO_LIBRARY
    : SCENARIO_LIBRARY.filter(s => s.category === activeCategory);

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
      className="absolute right-4 top-4 z-40 w-72 rounded-lg border shadow-xl"
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

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1">
          {['all', 'availability', 'performance', 'resilience', 'scalability'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors capitalize",
                activeCategory === cat
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-accent/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Trigger Failure Section */}
        <div className="flex flex-col gap-2">
          <h3
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Trigger Failure
          </h3>
          {filteredScenarios.map((scenario) => {
            const Icon = ICON_MAP[scenario.icon] || Zap;
            const isExpanded = expandedScenarioId === scenario.id;

            return (
              <div
                key={scenario.id}
                className="flex flex-col rounded-lg border transition-all"
                style={{
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                }}
              >
                {/* Header — always visible, clickable to expand */}
                <button
                  onClick={() => setExpandedScenarioId(isExpanded ? null : scenario.id)}
                  className="flex flex-col gap-1 p-2.5 text-left transition-colors hover:bg-accent/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" style={{ color: 'hsl(var(--destructive))' }} />
                      <span className="text-xs font-semibold">{scenario.label}</span>
                    </div>
                    <DifficultyBadge difficulty={scenario.difficulty} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{scenario.description}</p>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t px-2.5 pb-2.5 pt-2" style={{ borderColor: 'hsl(var(--border))' }}>
                    {/* Learning objectives */}
                    <div className="mb-2">
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        You'll Learn
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {scenario.learningObjectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                            <span className="mt-0.5 text-primary">•</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* What happens */}
                    <p className="mb-2 text-[10px] italic text-muted-foreground">
                      {scenario.whatHappens}
                    </p>

                    {/* Trigger button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (targetNodeId) {
                          const failureScenario = scenario.createScenario(targetNodeId);
                          const educationalHint = scenario.educationalHint(targetNodeId);
                          // FIX 2: Use single atomic action instead of two separate calls
                          actions.triggerFailureWithTeaching(failureScenario, educationalHint);
                          setExpandedScenarioId(null);
                        }
                      }}
                      disabled={!targetNodeId}
                      className={cn(
                        "flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors",
                        "bg-destructive/10 text-destructive hover:bg-destructive/20",
                        "disabled:cursor-not-allowed disabled:opacity-40"
                      )}
                    >
                      <Zap className="h-3 w-3" />
                      Trigger Failure
                    </button>
                  </div>
                )}
              </div>
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
