import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { CanvasShapeNode } from '@/types';

function ShapeNodeComponent({
  data,
  selected,
  type,
  width,
  height,
}: NodeProps<CanvasShapeNode>) {
  const resolvedWidth = width ?? 160;
  const resolvedHeight = height ?? 96;
  const isCircle = type === 'shapeCircle';
  const isText = type === 'shapeText';

  const baseStyle: CSSProperties = isText
    ? {
        minHeight: resolvedHeight,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      }
    : {
        minHeight: resolvedHeight,
        backgroundColor: selected
          ? 'hsl(var(--accent) / 0.4)'
          : 'hsl(var(--card) / 0.52)',
        borderColor: selected
          ? 'hsl(var(--ring) / 0.72)'
          : 'hsl(var(--border) / 0.5)',
      };

  return (
    <div
      className="group relative flex items-center justify-center px-3 py-2 text-center transition-all duration-150"
      style={{
        width: resolvedWidth,
        ...baseStyle,
        borderRadius: isCircle ? '999px' : isText ? '0.5rem' : '0.75rem',
        borderWidth: isText ? 0 : 1,
        borderStyle: isText ? 'none' : 'solid',
        boxShadow: selected
          ? '0 0 0 1px hsl(var(--ring) / 0.65), var(--node-shadow)'
          : isText
            ? 'none'
            : 'var(--node-shadow)',
      }}
    >
      <span
        className="truncate font-medium leading-tight"
        style={{
          color: 'hsl(var(--foreground) / 0.9)',
          fontSize: data.fontSize ?? (isText ? 14 : 12),
        }}
      >
        {data.label}
      </span>
    </div>
  );
}

const ShapeNode = memo(ShapeNodeComponent);
export default ShapeNode;

