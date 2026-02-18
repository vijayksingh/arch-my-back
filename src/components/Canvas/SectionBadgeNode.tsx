import { type CSSProperties, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NotebookBlock, SectionBadgeNode } from '@/types';
import { useWorkspaceStore } from '@/stores/workspaceStore';

// Convention: every canvas node type should include left/right handles so that
// React Flow edges can be drawn to/from any node in the graph. Handles are
// revealed on hover via the `group` class on the root div.
const handleClassName = 'nodrag nopan z-30! h-2.5! w-2.5! rounded-full! border! opacity-0 group-hover:opacity-100 transition-opacity duration-150';
const handleStyle: CSSProperties = {
  backgroundColor: 'var(--node-handle)',
  borderColor: 'var(--node-handle-border)',
  pointerEvents: 'auto',
};

const typeColors: Record<string, string> = {
  requirements: 'bg-blue-500',
  schema: 'bg-purple-500',
  api: 'bg-green-500',
  lld: 'bg-amber-500',
  text: 'bg-muted-foreground/60',
};

const typeBadgeColors: Record<string, string> = {
  requirements: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  schema: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  api: 'bg-green-500/20 text-green-400 border-green-500/30',
  lld: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  text: 'bg-muted/30 text-muted-foreground border-border',
};

const typeLabels: Record<string, string> = {
  requirements: 'REQS',
  schema: 'SCHEMA',
  api: 'API',
  lld: 'LLD',
  text: 'TEXT',
};


function BlockPreview({ block }: { block: NotebookBlock }) {
  if (block.type === 'requirements') {
    const functional = block.data.items
      .filter((i) => i.kind === 'functional')
      .slice(0, 2);
    const nonFunctional = block.data.items
      .filter((i) => i.kind === 'non-functional')
      .slice(0, 2);

    if (block.data.items.length === 0) {
      return <NoData />;
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Functional
          </div>
          {functional.length === 0 ? (
            <span className="text-[10px] italic text-muted-foreground/50">—</span>
          ) : (
            functional.map((item) => (
              <div key={item.id} className="flex items-start gap-1 text-[10px] text-foreground/70">
                <span className="text-muted-foreground/50">–</span>
                <span className="min-w-0 break-words">{item.text || '(empty)'}</span>
              </div>
            ))
          )}
        </div>
        <div>
          <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Non-Func
          </div>
          {nonFunctional.length === 0 ? (
            <span className="text-[10px] italic text-muted-foreground/50">—</span>
          ) : (
            nonFunctional.map((item) => (
              <div key={item.id} className="flex items-start gap-1 text-[10px] text-foreground/70">
                <span className="text-muted-foreground/50">–</span>
                <span className="min-w-0 break-words">{item.text || '(empty)'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (block.type === 'schema') {
    if (block.data.tables.length === 0) return <NoData />;
    return (
      <div className="flex flex-col gap-0.5">
        {block.data.tables.slice(0, 3).map((t) => (
          <div key={t.id} className="text-[10px] text-foreground/70">
            <span className="font-mono">{t.name}</span>
            <span className="ml-1 text-muted-foreground/60">
              ({t.fields.length} field{t.fields.length === 1 ? '' : 's'})
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === 'api') {
    if (block.data.endpoints.length === 0) return <NoData />;
    return (
      <div className="flex flex-col gap-0.5">
        {block.data.endpoints.slice(0, 3).map((ep) => (
          <div key={ep.id} className="flex items-center gap-1 text-[10px]">
            <span className="font-bold text-muted-foreground/80">{ep.method}</span>
            <span className="font-mono text-foreground/70 break-all">{ep.path}</span>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === 'lld') {
    if (!block.data.title && !block.data.content) return <NoData />;
    const lldStatus = block.data.status ?? 'draft';
    const statusColor =
      lldStatus === 'final' ? 'text-green-400' :
      lldStatus === 'review' ? 'text-amber-400' :
      'text-muted-foreground/60';
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          {block.data.title && (
            <div className="line-clamp-1 min-w-0 flex-1 text-[10px] font-medium text-foreground/80">
              {block.data.title}
            </div>
          )}
          <span className={`flex-shrink-0 text-[9px] font-semibold uppercase ${statusColor}`}>
            {lldStatus}
          </span>
        </div>
        {block.data.summary && (
          <div className="line-clamp-1 text-[10px] italic text-muted-foreground/60">
            {block.data.summary}
          </div>
        )}
        {block.data.content && (
          <div className="line-clamp-2 text-[10px] text-muted-foreground/70">
            {block.data.content.replace(/\n/g, ' ')}
          </div>
        )}
      </div>
    );
  }

  if (block.type === 'text') {
    const firstLine = block.data.markdown
      .split('\n')
      .find((l) => l.trim().length > 0);
    if (!firstLine) return <NoData />;
    return (
      <div className="line-clamp-2 text-[10px] text-muted-foreground/70">
        {firstLine.replace(/^#+\s*/, '')}
      </div>
    );
  }

  return <NoData />;
}

function NoData() {
  return (
    <span className="text-[10px] italic text-muted-foreground/50">
      No data yet
    </span>
  );
}

export default function SectionBadgeNodeComponent({
  data,
}: NodeProps<SectionBadgeNode>) {
  const requestFocusBlock = useWorkspaceStore((s) => s.requestFocusBlock);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const block = useWorkspaceStore((s) =>
    s.blocks.find((b) => b.id === data.blockId),
  );

  const handleClick = useCallback(() => {
    if (viewMode === 'canvas') {
      setViewMode('both');
    }
    requestFocusBlock(data.blockId);
  }, [data.blockId, requestFocusBlock, viewMode, setViewMode]);

  const dotColor = typeColors[data.blockType] ?? 'bg-muted-foreground/60';
  const badgeStyle =
    typeBadgeColors[data.blockType] ?? typeBadgeColors.text;
  const typeLabel = typeLabels[data.blockType] ?? 'BLOCK';

  return (
    <div className="group relative">
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className={handleClassName}
        style={{ ...handleStyle, left: -6 }}
      />
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        className={handleClassName}
        style={{ ...handleStyle, right: -6 }}
      />
      {/* No nodrag — removing it allows the node to be dragged on the canvas while
          still firing onClick for short presses (ReactFlow suppresses click after drag). */}
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full cursor-pointer flex-col rounded-lg border border-border/60 bg-card/80 shadow-sm transition-colors hover:border-border hover:bg-card"
      >
        {/* Header row */}
        <div className="flex items-center gap-2 px-3 py-2">
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} />
          <span className="min-w-0 flex-1 truncate text-left text-[12px] font-medium text-foreground">
            {data.label}
          </span>
          <span
            className={`flex-shrink-0 rounded border px-1 py-0.5 text-[9px] font-bold tracking-wider ${badgeStyle}`}
          >
            {typeLabel}
          </span>
        </div>

        {/* Preview content */}
        {block && (
          <>
            <div className="mx-3 border-t border-border/30" />
            <div className="px-3 py-2">
              <BlockPreview block={block} />
            </div>
          </>
        )}
      </button>
    </div>
  );
}
