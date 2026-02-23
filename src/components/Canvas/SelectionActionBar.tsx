import { useCallback, useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Link2 } from 'lucide-react';
import type { CanvasNode } from '@/types';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { TIMING, DIMENSIONS } from '@/constants';

function getNodeWidth(node: CanvasNode): number {
  const sw = node.style?.width;
  if (typeof sw === 'number') return sw;
  if (typeof sw === 'string') { const p = parseFloat(sw); if (!isNaN(p)) return p; }
  return node.measured?.width ?? node.width ?? DIMENSIONS.ARCH_NODE.WIDTH;
}

function getNodeHeight(node: CanvasNode): number {
  const sh = node.style?.height;
  if (typeof sh === 'number') return sh;
  if (typeof sh === 'string') { const p = parseFloat(sh); if (!isNaN(p)) return p; }
  return node.measured?.height ?? node.height ?? DIMENSIONS.ARCH_NODE.MIN_HEIGHT;
}

export function SelectionActionBar() {
  const { flowToScreenPosition } = useReactFlow();
  const nodes = useCanvasStore((s) => s.nodes);
  const sections = useCanvasStore((s) => s.sections);
  const createSectionFromNodeSelection = useCanvasStore((s) => s.createSectionFromNodeSelection);
  const getSectionLink = useCanvasStore((s) => s.getSectionLink);
  const activeCanvasTool = useEditorStore((s) => s.activeCanvasTool);
  const setActiveCanvasTool = useEditorStore((s) => s.setActiveCanvasTool);

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const [title, setTitle] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const bounds = useMemo(() => {
    if (selectedNodes.length === 0) return null;
    return selectedNodes.reduce(
      (acc, node, idx) => {
        const x = node.position.x;
        const y = node.position.y;
        const r = x + getNodeWidth(node);
        const b = y + getNodeHeight(node);
        if (idx === 0) return { minX: x, minY: y, maxX: r, maxY: b };
        return {
          minX: Math.min(acc.minX, x),
          minY: Math.min(acc.minY, y),
          maxX: Math.max(acc.maxX, r),
          maxY: Math.max(acc.maxY, b),
        };
      },
      { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    );
  }, [selectedNodes]);

  const screenPos = bounds ? flowToScreenPosition({ x: bounds.minX, y: bounds.minY }) : null;

  const handleCreate = useCallback(async () => {
    if (selectedNodes.length === 0 || !bounds) return;
    const nextTitle = title.trim() || `Section ${sections.length + 1}`;

    const created = createSectionFromNodeSelection(
      nextTitle,
      selectedNodes.map((n) => n.id),
      {
        x: bounds.minX,
        y: bounds.minY,
        width: Math.max(40, bounds.maxX - bounds.minX),
        height: Math.max(40, bounds.maxY - bounds.minY),
      },
    );

    if (!created) {
      setFeedback('Could not create group.');
      setTimeout(() => setFeedback(null), TIMING.FEEDBACK_DISPLAY);
      return;
    }

    setTitle('');
    const link = getSectionLink(created.id);
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setFeedback('Link copied!');
      } catch {
        setFeedback('Group created.');
      }
    } else {
      setFeedback('Group created.');
    }
    setTimeout(() => setFeedback(null), 2200);
    setActiveCanvasTool('cursor');
  }, [selectedNodes, bounds, title, sections.length, createSectionFromNodeSelection, getSectionLink, setActiveCanvasTool]);

  if (activeCanvasTool !== 'select' || selectedNodes.length < 2) return null;

  return (
    <div
      style={{ position: 'fixed', top: (screenPos?.y ?? 40) - 48, left: screenPos?.x ?? 16 }}
      className="pointer-events-auto z-40 flex items-center gap-2 rounded-lg border border-border/60 bg-card/92 px-3 py-1.5 shadow-lg backdrop-blur-md"
    >
      <span className="text-[11px] text-muted-foreground">
        {selectedNodes.length} node{selectedNodes.length !== 1 ? 's' : ''} selected
      </span>
      <div className="h-3.5 w-px bg-border/50" aria-hidden />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
        placeholder={`Group ${sections.length + 1}`}
        className="w-28 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50"
      />
      <button
        type="button"
        onClick={handleCreate}
        className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-primary transition-colors hover:bg-primary/10"
      >
        <Link2 className="h-3 w-3" />
        Group &amp; Link
      </button>
      {feedback && (
        <span className="text-[10px] text-muted-foreground">{feedback}</span>
      )}
    </div>
  );
}
