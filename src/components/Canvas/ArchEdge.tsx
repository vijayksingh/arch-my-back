import { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { ArchEdge as ArchEdgeType } from '@/types';
import type { EdgeVisualState } from '@/types/simulation';

function ArchEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<ArchEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = data?.label || data?.protocol;
  const simulating = data?.simulating as boolean;
  const status = data?.status as 'normal' | 'bottleneck' | 'error' | undefined;
  const simVisual = data?.simVisual as EdgeVisualState | undefined;

  const getPacketDur = () => {
    if (status === 'bottleneck') return 3;
    if (status === 'error') return 0;
    return 1.5;
  };

  // Dynamic particle count based on congestion (2-12 particles)
  const particleCount = simVisual
    ? Math.max(2, Math.round(2 + simVisual.congestionLevel * 10))
    : 3;

  // Dynamic packet speed/duration
  const packetDur = simVisual
    ? Math.max(0.5, 10 / Math.max(1, simVisual.particleFlow.speed))
    : getPacketDur();

  // Particle size based on congestion (1.5px → 2.5px)
  const particleSize = simVisual
    ? 1.5 + simVisual.congestionLevel
    : 2;

  // Particle color based on congestion thresholds
  const getParticleColor = () => {
    if (status === 'bottleneck' || status === 'error') return '#ef4444';
    if (!simVisual) return '#3b82f6';

    const { congestionLevel } = simVisual;
    if (congestionLevel < 0.3) return '#3b82f6'; // blue
    if (congestionLevel < 0.6) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const particleColor = getParticleColor();

  // Congestion-based color gradient
  const getEdgeColor = () => {
    if (status === 'bottleneck' || status === 'error') return '#ef4444';
    if (!simVisual) return selected ? 'hsl(var(--connection-selected))' : 'hsl(var(--connection))';

    const { congestionLevel } = simVisual;
    if (congestionLevel < 0.3) return '#3b82f6'; // blue
    if (congestionLevel < 0.6) return '#f59e0b'; // amber
    if (congestionLevel < 0.9) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const edgeColor = getEdgeColor();

  // Congestion-based stroke width
  const congestionWidth = simVisual
    ? 2 + simVisual.congestionLevel * 2 // 2-4px
    : selected ? 3 : 2;

  // Glow opacity scales with congestion level
  const glowOpacity = simVisual
    ? 0.3 + simVisual.congestionLevel * 0.6 // 0.3 → 0.9
    : selected ? 0.9 : 0.5;

  return (
    <>
      {/* Glow layer */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: status === 'bottleneck' || status === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'var(--connection-glow)',
          strokeWidth: selected ? 10 : 8,
          opacity: glowOpacity,
          filter: 'blur(8px)',
        }}
      />

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: edgeColor,
          strokeWidth: congestionWidth,
          strokeDasharray: selected || simulating ? 'none' : '7 7',
          animation: selected || simulating ? 'none' : 'flow 1.2s linear infinite',
        }}
      />

      {/* Animated packets for traffic simulation */}
      {simulating && packetDur > 0 && Array.from({ length: particleCount }, (_, i) => i).map((i) => {
        const delay = (packetDur / particleCount) * i;

        // For congested edges, particles slow down near target (bunching effect)
        // keyTimes: [0, 1] = start, end
        // keySplines controls acceleration between keyframes
        // format: "cx1 cy1 cx2 cy2" (cubic bezier control points)
        const useVariableSpeed = simVisual && simVisual.congestionLevel > 0.3;
        const keyTimes = useVariableSpeed ? '0;1' : undefined;
        // ease-in: particles decelerate as they approach target (congestion)
        const keySplines = useVariableSpeed
          ? `0.42 0 1 ${0.4 + simVisual.congestionLevel * 0.6}` // more congestion = sharper deceleration
          : undefined;
        const calcMode = useVariableSpeed ? 'spline' : 'linear';

        return (
          <circle
            key={i}
            r={particleSize}
            fill={particleColor}
            filter={`drop-shadow(0 0 ${2 + (simVisual?.congestionLevel ?? 0) * 2}px ${particleColor})`}
            style={{ willChange: 'transform' }}
          >
            <animateMotion
              dur={`${packetDur}s`}
              begin={`-${delay}s`}
              repeatCount="indefinite"
              path={edgePath}
              keyTimes={keyTimes}
              keySplines={keySplines}
              calcMode={calcMode}
            />
          </circle>
        );
      })}

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <div
              className="px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap"
              style={{
                background: 'hsl(var(--card) / 0.94)',
                border: '1px solid hsl(var(--border))',
                color: selected
                  ? 'hsl(var(--foreground))'
                  : 'hsl(var(--muted-foreground))',
                boxShadow: 'var(--surface-shadow)',
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const ArchEdge = memo(ArchEdgeComponent);
export default ArchEdge;
