import { useRef, useState } from 'react';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Navigation from 'lucide-react/dist/esm/icons/navigation';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspaceStore';

type EditorMode = 'edit' | 'preview';

const sectionLinkPattern =
  /\[([^\]]+)\]\(section:([^)]+)\)|\[\[section:([^\]|]+)\|([^\]]+)\]\]/g;

type Fragment =
  | { type: 'text'; value: string }
  | { type: 'link'; sectionId: string; title: string; raw: string };

function parseLineFragments(line: string): Fragment[] {
  const fragments: Fragment[] = [];
  let lastIndex = 0;

  sectionLinkPattern.lastIndex = 0;
  let match = sectionLinkPattern.exec(line);
  while (match) {
    if (match.index > lastIndex) {
      fragments.push({ type: 'text', value: line.slice(lastIndex, match.index) });
    }
    const parsedTitle = match[1] ?? match[4];
    const parsedSectionId = match[2] ?? match[3];
    if (parsedTitle && parsedSectionId) {
      fragments.push({
        type: 'link',
        title: parsedTitle,
        sectionId: parsedSectionId,
        raw: match[0],
      });
    }
    lastIndex = match.index + match[0].length;
    match = sectionLinkPattern.exec(line);
  }

  if (lastIndex < line.length) {
    fragments.push({ type: 'text', value: line.slice(lastIndex) });
  }

  if (fragments.length === 0) {
    fragments.push({ type: 'text', value: line });
  }

  return fragments;
}

export function DocumentPanel() {
  const documentMarkdown = useWorkspaceStore((s) => s.documentMarkdown);
  const setDocumentMarkdown = useWorkspaceStore((s) => s.setDocumentMarkdown);
  const sections = useWorkspaceStore((s) => s.sections);
  const removeSection = useWorkspaceStore((s) => s.removeSection);
  const getSectionLink = useWorkspaceStore((s) => s.getSectionLink);
  const requestFocusSection = useWorkspaceStore((s) => s.requestFocusSection);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  function handleNavigateToSection(sectionId: string) {
    requestFocusSection(sectionId);
    if (viewMode === 'document') {
      setViewMode('both');
    }
  }

  async function copySectionLink(sectionId: string) {
    const link = getSectionLink(sectionId);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch (error) {
      console.error('Failed to copy section link:', error);
    }
  }

  function insertSectionLink(sectionId: string) {
    const link = getSectionLink(sectionId);
    if (!link) return;

    const target = textareaRef.current;
    if (!target) {
      setDocumentMarkdown(`${documentMarkdown}\n${link}`);
      return;
    }

    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    const nextValue =
      documentMarkdown.slice(0, selectionStart) +
      link +
      documentMarkdown.slice(selectionEnd);

    setDocumentMarkdown(nextValue);
    window.requestAnimationFrame(() => {
      target.focus();
      const nextCaret = selectionStart + link.length;
      target.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function renderInlineFragments(line: string, lineIndex: number, interactive: boolean) {
    const fragments = parseLineFragments(line);

    return fragments.map((fragment, fragmentIndex) => {
      if (fragment.type === 'text') {
        return (
          <span key={`t-${lineIndex}-${fragmentIndex}`}>
            {fragment.value}
          </span>
        );
      }

      if (interactive) {
        return (
          <button
            key={`l-${lineIndex}-${fragmentIndex}`}
            type="button"
            onClick={() => handleNavigateToSection(fragment.sectionId)}
            className="inline-flex items-center rounded-md bg-accent/60 px-1.5 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
            title={`Go to ${fragment.title}`}
          >
            {fragment.title}
          </button>
        );
      }

      return (
        <span
          key={`l-${lineIndex}-${fragmentIndex}`}
          className="rounded bg-accent/28 px-0.5 text-foreground/92"
        >
          {fragment.raw}
        </span>
      );
    });
  }

  function renderPreviewLine(line: string, lineIndex: number) {
    if (line.trim().length === 0) {
      return <div key={`empty-${lineIndex}`} className="h-2" />;
    }

    if (line.startsWith('### ')) {
      return (
        <h3 key={`h3-${lineIndex}`} className="text-sm font-semibold text-foreground">
          {renderInlineFragments(line.slice(4), lineIndex, true)}
        </h3>
      );
    }

    if (line.startsWith('## ')) {
      return (
        <h2 key={`h2-${lineIndex}`} className="text-base font-semibold text-foreground">
          {renderInlineFragments(line.slice(3), lineIndex, true)}
        </h2>
      );
    }

    if (line.startsWith('# ')) {
      return (
        <h1 key={`h1-${lineIndex}`} className="text-lg font-semibold text-foreground">
          {renderInlineFragments(line.slice(2), lineIndex, true)}
        </h1>
      );
    }

    if (line.startsWith('- ')) {
      return (
        <div key={`li-${lineIndex}`} className="flex items-start gap-2 text-[13px] leading-relaxed text-foreground/90">
          <span className="mt-1 text-muted-foreground">•</span>
          <span>{renderInlineFragments(line.slice(2), lineIndex, true)}</span>
        </div>
      );
    }

    return (
      <p key={`p-${lineIndex}`} className="text-[13px] leading-relaxed text-foreground/90">
        {renderInlineFragments(line, lineIndex, true)}
      </p>
    );
  }

  function renderEditorLine(line: string, lineIndex: number) {
    if (line.length === 0) {
      return <div key={`edit-empty-${lineIndex}`} className="h-[1.35rem]" />;
    }

    return (
      <div
        key={`edit-line-${lineIndex}`}
        className="min-h-[1.35rem] whitespace-pre-wrap wrap-break-word"
      >
        {renderInlineFragments(line, lineIndex, false)}
      </div>
    );
  }

  function handleEditorScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    const highlight = highlightRef.current;
    if (!highlight) return;
    highlight.scrollTop = e.currentTarget.scrollTop;
    highlight.scrollLeft = e.currentTarget.scrollLeft;
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-background/70">
      <div className="flex items-center justify-between border-b ui-border-ghost px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Document
          </span>
          <div className="h-4 w-px bg-border/70" />
          <span className="truncate text-xs text-muted-foreground">
            {sections.length} linked section{sections.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center rounded-md border ui-border-ghost bg-card/70 p-0.5">
          <button
            type="button"
            onClick={() => setEditorMode('edit')}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-medium transition-colors',
              editorMode === 'edit'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setEditorMode('preview')}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-medium transition-colors',
              editorMode === 'preview'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-3 py-3">
        {editorMode === 'edit' ? (
          <div className="relative h-full overflow-hidden rounded-lg border ui-border-ghost bg-card/65">
            <div
              ref={highlightRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-auto px-3 py-3 text-[13px] leading-relaxed text-foreground/90"
            >
              {documentMarkdown.length === 0 ? (
                <p className="text-muted-foreground/60">
                  Write architecture notes and insert section links...
                </p>
              ) : (
                documentMarkdown
                  .split('\n')
                  .map((line, index) => renderEditorLine(line, index))
              )}
            </div>
            <textarea
              ref={textareaRef}
              value={documentMarkdown}
              onChange={(e) => setDocumentMarkdown(e.target.value)}
              onScroll={handleEditorScroll}
              className="absolute inset-0 h-full w-full resize-none bg-transparent px-3 py-3 text-[13px] leading-relaxed text-transparent caret-foreground outline-none transition-[border-color,box-shadow] duration-150 selection:bg-accent/35"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto rounded-lg border ui-border-ghost bg-card/65 p-3">
            <div className="flex flex-col gap-2">
              {documentMarkdown
                .split('\n')
                .map((line, index) => renderPreviewLine(line, index))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t ui-border-ghost px-3 py-2">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Link2 className="h-3 w-3" />
          Linked Canvas Sections
        </div>
        <div className="flex max-h-32 flex-col gap-1 overflow-y-auto pr-1">
          {sections.length === 0 ? (
            <p className="text-[11px] italic text-muted-foreground">
              Create a section from node selection on canvas.
            </p>
          ) : (
            sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-1 rounded-md bg-card/70 px-1.5 py-1"
              >
                <span className="min-w-0 flex-1 truncate text-[11px] text-foreground/90">
                  {section.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Insert link"
                  onClick={() => insertSectionLink(section.id)}
                >
                  <Link2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Copy link"
                  onClick={() => copySectionLink(section.id)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Navigate to section"
                  onClick={() => handleNavigateToSection(section.id)}
                >
                  <Navigation className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  title="Remove section"
                  onClick={() => removeSection(section.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

