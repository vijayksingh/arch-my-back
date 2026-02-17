import { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { ArchEdge as ArchEdgeType } from '@/types';

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

  return (
    <>
      {/* Glow layer */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: 'var(--connection-glow)',
          strokeWidth: selected ? 10 : 8,
          opacity: selected ? 0.9 : 0.5,
          filter: 'blur(8px)',
        }}
      />

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected
            ? 'hsl(var(--connection-selected))'
            : 'hsl(var(--connection))',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: selected ? 'none' : '7 7',
          animation: selected ? 'none' : 'flow 1.2s linear infinite',
        }}
      />

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
