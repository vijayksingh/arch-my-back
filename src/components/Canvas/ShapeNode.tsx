import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Handle,
  NodeResizer,
  type NodeProps,
  Position,
  type ResizeDragEvent,
  type ResizeParams,
} from '@xyflow/react';
import type { CanvasShapeNode } from '@/types';
import { useCanvasStore } from '@/stores/canvasStore';
import { NODE_TYPE, Z_INDEX } from '@/constants';

function ShapeNodeComponent({
  id,
  data,
  selected,
  type,
  width,
  height,
}: NodeProps<CanvasShapeNode>) {
  const [draftLabel, setDraftLabel] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeShapeEditId = useCanvasStore((s) => s.activeShapeEditId);
  const startShapeInlineEdit = useCanvasStore((s) => s.startShapeInlineEdit);
  const stopShapeInlineEdit = useCanvasStore((s) => s.stopShapeInlineEdit);
  const updateNodeLabel = useCanvasStore((s) => s.updateNodeLabel);
  const updateShapeStyle = useCanvasStore((s) => s.updateShapeStyle);

  const resolvedWidth = width ?? 160;
  const resolvedHeight = height ?? 96;
  const isCircle = type === NODE_TYPE.SHAPE_CIRCLE;
  const isText = type === NODE_TYPE.SHAPE_TEXT;
  const isEditing = activeShapeEditId === id;
  // Handles are subtle by default; visible on node hover via `group-hover:` (root has `group` class).
  const handleClassName =
    'nodrag nopan z-30! h-2.5! w-2.5! rounded-full! border! opacity-0 group-hover:opacity-100 transition-opacity duration-150';
  const handleBaseStyle: CSSProperties = {
    backgroundColor: 'var(--node-handle)',
    borderColor: 'var(--node-handle-border)',
    pointerEvents: 'auto',
  };

  useEffect(() => {
    if (!isEditing) return;
    const rafId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [isEditing]);

  const commitLabel = useCallback(() => {
    const nextLabel = draftLabel.trim();
    if (nextLabel && nextLabel !== data.label) {
      updateNodeLabel(id, nextLabel);
    } else {
      setDraftLabel(data.label);
    }
    stopShapeInlineEdit();
  }, [data.label, draftLabel, id, stopShapeInlineEdit, updateNodeLabel]);

  const cancelLabelEdit = useCallback(() => {
    setDraftLabel(data.label);
    stopShapeInlineEdit();
  }, [data.label, stopShapeInlineEdit]);

  const handleStartInlineEdit = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      setDraftLabel(data.label);
      startShapeInlineEdit(id);
    },
    [data.label, id, startShapeInlineEdit],
  );

  const handleResizeEnd = useCallback(
    (_event: ResizeDragEvent, params: ResizeParams) => {
      updateShapeStyle(id, { width: params.width, height: params.height });
    },
    [id, updateShapeStyle],
  );

  const baseStyle: CSSProperties = isText
    ? {
        height: resolvedHeight,
        backgroundColor: selected
          ? 'hsl(var(--accent) / 0.22)'
          : 'transparent',
        borderColor: selected
          ? 'hsl(var(--ring) / 0.68)'
          : 'transparent',
      }
    : {
        height: resolvedHeight,
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
      onDoubleClick={handleStartInlineEdit}
      style={{
        width: resolvedWidth,
        ...baseStyle,
        borderRadius: isCircle ? '999px' : isText ? '0.5rem' : '0.75rem',
        borderWidth: isText ? (selected ? 1 : 0) : 1,
        borderStyle: 'solid',
        boxShadow: selected
          ? '0 0 0 1px hsl(var(--ring) / 0.65), var(--node-shadow)'
          : isText
            ? 'none'
            : 'var(--node-shadow)',
      }}
    >
      <NodeResizer
        isVisible={selected && !isEditing}
        minWidth={isCircle ? 64 : 80}
        minHeight={isCircle ? 64 : 44}
        keepAspectRatio={isCircle}
        lineStyle={{
          borderColor: 'hsl(var(--ring) / 0.55)',
          pointerEvents: 'none',
        }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--ring) / 0.72)',
          zIndex: Z_INDEX.RESIZE_HANDLE,
        }}
        onResizeEnd={handleResizeEnd}
      />

      {isEditing ? (
        <input
          ref={inputRef}
          value={draftLabel}
          onChange={(event) => setDraftLabel(event.target.value)}
          onBlur={commitLabel}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Enter') {
              event.preventDefault();
              commitLabel();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              cancelLabelEdit();
            }
          }}
          className="nodrag nopan w-full rounded-md bg-background/75 px-2 py-1 text-center text-sm font-medium leading-tight text-foreground outline-none ring-1 ring-ring/45"
        />
      ) : (
        <span
          className="max-w-full truncate font-medium leading-tight"
          style={{
            color: 'hsl(var(--foreground) / 0.9)',
            fontSize: data.fontSize ?? (isText ? 14 : 12),
          }}
        >
          {data.label}
        </span>
      )}

      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className={handleClassName}
        style={{ ...handleBaseStyle, left: -6 }}
      />
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        className={handleClassName}
        style={{ ...handleBaseStyle, right: -6 }}
      />
    </div>
  );
}

const ShapeNode = memo(ShapeNodeComponent);
export default ShapeNode;

