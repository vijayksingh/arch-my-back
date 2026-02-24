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

  // Dynamic particle count (1-5 based on simVisual flow)
  const particleCount = simVisual
    ? Math.max(1, Math.min(5, simVisual.particleFlow.count))
    : 3;

  // Dynamic packet speed/duration
  const packetDur = simVisual
    ? Math.max(0.5, 10 / Math.max(1, simVisual.particleFlow.speed))
    : getPacketDur();

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
  const packetColor = status === 'bottleneck' || status === 'error' ? '#ef4444' : '#3b82f6';

  // Congestion-based stroke width
  const congestionWidth = simVisual
    ? 2 + simVisual.congestionLevel * 2 // 2-4px
    : selected ? 3 : 2;

  // Backpressure glow intensity
  const glowOpacity = simVisual?.isBackpressured
    ? 0.8
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
        return (
          <circle key={i} r="4" fill={packetColor} filter={`drop-shadow(0 0 4px ${packetColor})`}>
            <animateMotion
              dur={`${packetDur}s`}
              begin={`-${delay}s`}
              repeatCount="indefinite"
              path={edgePath}
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
