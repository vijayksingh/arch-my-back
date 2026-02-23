import { memo, useState } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { CollapsibleGroupNode as CollapsibleGroupNodeType } from '@/types';
import { useCanvasStore } from '@/stores/canvasStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Z_INDEX } from '@/constants';

function CollapsibleGroupNodeComponent({
  id,
  data,
  selected,
}: NodeProps<CollapsibleGroupNodeType>) {
  const [isHovered, setIsHovered] = useState(false);
  const toggleGroupCollapse = useCanvasStore((s) => s.toggleGroupCollapse);

  const childCount = data.childNodeIds?.length ?? 0;
  const isCollapsed = data.isCollapsed ?? false;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleGroupCollapse(id);
  };

  const headerHeight = 36;
  const minExpandedHeight = 120;

  return (
    <div
      className="group relative flex flex-col overflow-visible"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minWidth: 200,
        minHeight: isCollapsed ? headerHeight : minExpandedHeight,
      }}
    >
      <NodeResizer
        isVisible={selected && !isCollapsed}
        minWidth={200}
        minHeight={minExpandedHeight}
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
      />

      {/* Header bar */}
      <div
        className="flex items-center gap-2 rounded-t-lg border border-border/50 bg-card/80 px-3 py-2 backdrop-blur-sm transition-colors"
        style={{
          height: headerHeight,
          backgroundColor: selected
            ? 'hsl(var(--accent) / 0.3)'
            : 'hsl(var(--card) / 0.8)',
          borderColor: selected
            ? 'hsl(var(--ring) / 0.6)'
            : 'hsl(var(--border) / 0.5)',
          borderBottomLeftRadius: isCollapsed ? '0.5rem' : 0,
          borderBottomRightRadius: isCollapsed ? '0.5rem' : 0,
        }}
      >
        <button
          onClick={handleToggle}
          className="nodrag nopan flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-accent/20"
          aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
        >
          {isCollapsed ? (
            <ChevronRight size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </button>

        <span
          className="flex-1 truncate text-sm font-medium text-card-foreground"
        >
          {data.label}
        </span>

        {isCollapsed && childCount > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {childCount}
          </span>
        )}
      </div>

      {/* Body - only visible when expanded */}
      {!isCollapsed && (
        <div
          className="flex-1 rounded-b-lg border border-t-0 border-border/50 bg-card/20 backdrop-blur-sm"
          style={{
            borderColor: selected
              ? 'hsl(var(--ring) / 0.6)'
              : 'hsl(var(--border) / 0.5)',
            minHeight: minExpandedHeight - headerHeight,
          }}
        />
      )}

      {/* Handles - visible on hover or when selected */}
      <Handle
        type="target"
        position={Position.Left}
        className="h-2.5! w-2.5! rounded-full! border! transition-opacity duration-150"
        style={{
          backgroundColor: 'var(--node-handle)',
          borderColor: 'var(--node-handle-border)',
          opacity: isHovered || selected ? 1 : 0,
          top: headerHeight / 2,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2.5! w-2.5! rounded-full! border! transition-opacity duration-150"
        style={{
          backgroundColor: 'var(--node-handle)',
          borderColor: 'var(--node-handle-border)',
          opacity: isHovered || selected ? 1 : 0,
          top: headerHeight / 2,
        }}
      />
    </div>
  );
}

const CollapsibleGroupNode = memo(CollapsibleGroupNodeComponent);
export default CollapsibleGroupNode;
