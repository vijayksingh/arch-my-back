import { memo, useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ArchNode as ArchNodeType } from '@/types';
import type { NodeVisualState } from '@/types/simulation';
import { componentTypeMap } from '@/registry/componentTypes';
import { getIconByName } from '@/registry/iconRegistry';
import { categoryGlows, categoryAccentTokens } from '@/registry/categoryThemes';
import { ARCH_NODE } from '@/constants';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info } from 'lucide-react';

function ArchNodeComponent({ data, selected }: NodeProps<ArchNodeType>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isHighlighted = data.highlighted ?? false;
  const isNewlyAdded = data.isNewlyAdded ?? false;
  const hasContext = Boolean(data.context);
  const simVisual = data.simVisual as NodeVisualState | undefined;

  // PERF #13: Pulse animation hysteresis to prevent flickering at boundary
  const isPulsingRef = useRef(false);
  if (simVisual) {
    if (!isPulsingRef.current && simVisual.pulseIntensity > 0.6) {
      isPulsingRef.current = true;
    } else if (isPulsingRef.current && simVisual.pulseIntensity < 0.4) {
      isPulsingRef.current = false;
    }
  } else {
    isPulsingRef.current = false;
  }
  const shouldPulse = simVisual && isPulsingRef.current;
  const typeDef = componentTypeMap.get(data.componentType);
  const IconComponent = getIconByName(typeDef?.icon ?? '');
  const glowColor = typeDef ? categoryGlows[typeDef.category] : categoryGlows.External;
  const accentToken = typeDef ? categoryAccentTokens[typeDef.category] : null;
  const accentColor = accentToken
    ? `hsl(var(${accentToken}))`
    : 'var(--node-icon-color)';
  const accentBorderColor = accentToken
    ? `hsl(var(${accentToken}) / ${selected ? '0.5' : '0.34'})`
    : 'var(--node-border)';
  const surfaceBackground = selected
    ? 'var(--node-surface-selected)'
    : isHovered
      ? 'var(--node-surface-hover)'
      : 'var(--node-surface)';

  // Determine border color - simulation health color overrides when active
  const healthColorMap = {
    green: 'hsl(142 71% 45% / 0.6)',
    yellow: 'hsl(45 93% 47% / 0.6)',
    red: 'hsl(0 84% 60% / 0.6)',
    gray: undefined,
  };
  const simulationBorderColor = simVisual ? healthColorMap[simVisual.healthColor] : undefined;
  const baseBorderColor = simulationBorderColor ?? (selected
    ? accentBorderColor
    : isHovered
      ? 'var(--node-border-hover)'
      : 'var(--node-border)');
  // Determine shadow - add health glow when simulating
  const healthGlowMap = {
    green: '0 0 12px hsl(142 71% 45% / 0.3)',
    yellow: '0 0 12px hsl(45 93% 47% / 0.3)',
    red: '0 0 16px 4px hsl(0 84% 60% / 0.4)',
    gray: undefined,
  };
  const healthGlow = simVisual ? healthGlowMap[simVisual.healthColor] : undefined;
  const baseShadow = isHighlighted
    ? `var(--node-selected-shadow), 0 0 16px 4px ${glowColor}`
    : selected
      ? `var(--node-selected-shadow), 0 0 14px ${glowColor}`
      : isHovered
        ? `var(--node-hover-shadow), 0 0 10px ${glowColor}`
        : 'var(--node-shadow)';
  const boxShadow = healthGlow ? `${baseShadow}, ${healthGlow}` : baseShadow;
  const transform = selected
    ? 'scale(var(--node-selected-scale))'
    : isHovered
      ? 'translateY(-1px) scale(1.01)'
      : 'scale(1)';

  const nodeContent = (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-2.5 rounded-xl border px-4 py-3 transition-all duration-160",
        isNewlyAdded && "ring-2 ring-blue-400/60 animate-pulse",
        shouldPulse && "animate-pulse"
      )}
      style={{
        width: ARCH_NODE.WIDTH,
        minHeight: ARCH_NODE.MIN_HEIGHT,
        background: surfaceBackground,
        borderColor: baseBorderColor,
        boxShadow,
        transform,
        backdropFilter: 'blur(10px)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5! h-2.5! border! rounded-full! transition-opacity duration-150"
        style={{
          backgroundColor: 'var(--node-handle)',
          borderColor: 'var(--node-handle-border)',
          opacity: isHovered || selected ? 1 : 0.3,
        }}
      />

      {/* Context Info Icon */}
      {hasContext && (
        <div className="absolute -top-1 -right-1">
          <div
            className="flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-200"
            style={{
              backgroundColor: 'var(--node-surface)',
              borderColor: accentBorderColor,
              opacity: isHovered || isPopoverOpen ? 1 : 0.6,
            }}
          >
            <Info
              size={10}
              strokeWidth={2.5}
              style={{ color: accentColor }}
            />
          </div>
        </div>
      )}

      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'var(--node-icon-surface)',
          border: `1px solid ${accentBorderColor}`,
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18)',
        }}
      >
        <IconComponent
          size={18}
          strokeWidth={2.1}
          style={{ color: accentColor }}
        />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <span
          className="px-1 text-xs font-medium leading-tight"
          style={{ color: 'var(--node-label)' }}
        >
          {data.label}
        </span>
        {typeDef && (
          <span
            className="text-[9px] font-medium uppercase tracking-[0.12em]"
            style={{ color: 'var(--node-meta)' }}
          >
            {typeDef.label}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5! h-2.5! border! rounded-full! transition-opacity duration-150"
        style={{
          backgroundColor: 'var(--node-handle)',
          borderColor: 'var(--node-handle-border)',
          opacity: isHovered || selected ? 1 : 0.3,
        }}
      />

      {/* Queue depth visualization bar */}
      {simVisual?.queueVisualization && (
        <div
          className="absolute -bottom-1 left-2 right-2 h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--node-border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${simVisual.queueVisualization.percentFull}%`,
              backgroundColor: simVisual.queueVisualization.percentFull > 80
                ? 'hsl(0 84% 60%)'
                : simVisual.queueVisualization.percentFull > 50
                  ? 'hsl(45 93% 47%)'
                  : 'hsl(142 71% 45%)',
            }}
          />
        </div>
      )}

      {/* Metrics overlay - shown on hover or when selected */}
      {simVisual?.metricsOverlay && (isHovered || selected) && (
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2 text-[9px] font-mono whitespace-nowrap"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>{simVisual.metricsOverlay.throughput}</span>
          <span>{simVisual.metricsOverlay.latency}</span>
          {simVisual.metricsOverlay.errorRate && (
            <span style={{ color: 'hsl(0 84% 60%)' }}>{simVisual.metricsOverlay.errorRate}</span>
          )}
        </div>
      )}
    </div>
  );

  if (!hasContext) {
    return nodeContent;
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        {nodeContent}
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0"
        style={{
          backgroundColor: 'var(--surface-bg)',
          borderColor: 'var(--ui-border-ghost)',
          boxShadow: 'var(--panel-shadow)',
        }}
      >
        <div className="flex flex-col gap-3 p-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{
                backgroundColor: 'var(--node-icon-surface)',
                border: `1px solid ${accentBorderColor}`,
              }}
            >
              <IconComponent
                size={14}
                strokeWidth={2.1}
                style={{ color: accentColor }}
              />
            </div>
            <div className="flex flex-col">
              <span
                className="text-sm font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {data.label}
              </span>
              {typeDef && (
                <span
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {typeDef.label}
                </span>
              )}
            </div>
          </div>

          {/* Context Sections */}
          <div className="flex flex-col gap-3">
            {data.context?.purpose && (
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Purpose
                </span>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {data.context.purpose}
                </p>
              </div>
            )}

            {data.context?.problemSolved && (
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Problem Solved
                </span>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {data.context.problemSolved}
                </p>
              </div>
            )}

            {data.context?.walkthroughContext && (
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Context in Walkthrough
                </span>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {data.context.walkthroughContext}
                </p>
              </div>
            )}

            {data.context?.relatedConcepts && data.context.relatedConcepts.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Related Concepts
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {data.context.relatedConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="rounded px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `hsl(var(${accentToken}) / 0.1)`,
                        color: accentColor,
                        border: `1px solid ${accentBorderColor}`,
                      }}
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const ArchNode = memo(ArchNodeComponent);
export default ArchNode;
