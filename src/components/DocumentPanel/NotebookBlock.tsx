import { useCallback, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { NotebookBlock, NotebookBlockType } from '@/types';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils';
import { SectionBadge } from './widgets/SectionBadge';
import { TextWidget } from './widgets/TextWidget';
import { RequirementsWidget } from './widgets/RequirementsWidget';
import { SchemaWidget } from './widgets/SchemaWidget';
import { ApiWidget } from './widgets/ApiWidget';
import { LldWidget } from './widgets/LldWidget';

interface NotebookBlockProps {
  block: NotebookBlock;
  index: number;
  isPreview: boolean;
  isHighlighted: boolean;
  autoFocus?: boolean;
  addBlock: (type: NotebookBlockType, atIndex?: number) => NotebookBlock;
}

export function NotebookBlockComponent({
  block,
  index,
  isPreview,
  isHighlighted,
  autoFocus,
  addBlock,
}: NotebookBlockProps) {
  const removeBlock = useWorkspaceStore((s) => s.removeBlock);
  const sections = useWorkspaceStore((s) => s.sections);
  const [isHovered, setIsHovered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleDelete = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => removeBlock(block.id), 180);
  }, [block.id, removeBlock]);

  const linkedSection = block.sectionId
    ? sections.find((s) => s.id === block.sectionId)
    : null;

  const handleReplaceWith = useCallback(
    (type: NotebookBlockType) => {
      removeBlock(block.id);
      addBlock(type, index);
    },
    [block.id, index, removeBlock, addBlock],
  );

  const handleExitWidget = useCallback(() => {
    addBlock('text', index + 1);
  }, [addBlock, index]);

  return (
    <div
      className={cn(
        'group relative rounded-lg transition-shadow duration-300',
        isHighlighted && 'ring-2 ring-ring/70',
        isExiting && 'animate-block-exit motion-reduce:animate-none pointer-events-none',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {linkedSection && (
        <div className="mb-1.5 flex items-center">
          <SectionBadge
            sectionId={linkedSection.id}
            label={linkedSection.title}
          />
        </div>
      )}

      {block.type === 'text' && (
        <TextWidget
          block={block}
          isPreview={isPreview}
          autoFocus={autoFocus}
          onReplaceWith={handleReplaceWith}
          onExitWidget={handleExitWidget}
        />
      )}
      {block.type === 'requirements' && (
        <RequirementsWidget
          block={block}
          isPreview={isPreview}
          autoFocus={autoFocus}
          onExitWidget={handleExitWidget}
        />
      )}
      {block.type === 'schema' && (
        <SchemaWidget
          block={block}
          isPreview={isPreview}
          autoFocus={autoFocus}
          onExitWidget={handleExitWidget}
        />
      )}
      {block.type === 'api' && (
        <ApiWidget
          block={block}
          isPreview={isPreview}
          autoFocus={autoFocus}
          onExitWidget={handleExitWidget}
        />
      )}
      {block.type === 'lld' && (
        <LldWidget
          block={block}
          isPreview={isPreview}
          autoFocus={autoFocus}
          onExitWidget={handleExitWidget}
        />
      )}

      {!isPreview && isHovered && (
        <div className="absolute right-1 top-1 flex items-center gap-1 rounded-md border ui-border-ghost bg-card/90 px-1 py-0.5 shadow-sm">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded p-1 text-muted-foreground/60 transition-colors hover:text-destructive"
            title="Delete block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
