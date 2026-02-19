import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { NotebookBlock, NotebookBlockType } from '@/types';
import { useDocumentStore } from '@/stores/documentStore';
import { SlashCommandPicker } from '../SlashCommandPicker';
import { MarkdownLines } from './MarkdownLines';

interface TextWidgetProps {
  block: Extract<NotebookBlock, { type: 'text' }>;
  isPreview: boolean;
  autoFocus?: boolean;
  onReplaceWith: (type: NotebookBlockType) => void;
  onExitWidget?: () => void;
}

export function TextWidget({ block, isPreview, autoFocus, onReplaceWith, onExitWidget }: TextWidgetProps) {
  const updateBlockData = useDocumentStore((s) => s.updateBlockData);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastWasEnter = useRef(false);

  const markdown = block.data.markdown;

  const resize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    // Set to 1px first so scrollHeight reflects content, not flex-stretched height
    ta.style.height = '1px';
    ta.style.height = `${ta.scrollHeight}px`;
  }, []);

  useEffect(() => { resize(); }, [markdown, resize]);

  const pickerFilter =
    !markdown.includes('\n') && markdown.startsWith('/')
      ? markdown.slice(1).toLowerCase()
      : '';

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      updateBlockData(block.id, { markdown: value });

      if (!value.includes('\n') && value.startsWith('/')) {
        setPickerVisible(true);
      } else {
        setPickerVisible(false);
      }
    },
    [block.id, updateBlockData],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape' && pickerVisible) {
        e.preventDefault();
        setPickerVisible(false);
        updateBlockData(block.id, { markdown: '' });
        return;
      }

      // Double-Enter on an empty line exits to a new text block.
      // Works regardless of block content — Enter from a content line moves to a blank
      // trailing line, then a second Enter exits.
      if (e.key === 'Enter' && onExitWidget) {
        const ta = textareaRef.current;
        const pos = ta ? ta.selectionStart : markdown.length;
        const end = ta ? ta.selectionEnd : markdown.length;

        if (pos === end) {
          const before = markdown.slice(0, pos);
          const lineContent = before.slice(before.lastIndexOf('\n') + 1);
          const after = markdown.slice(pos);
          const isAtEmptyLine = lineContent === '' && (after === '' || after.startsWith('\n'));

          if (isAtEmptyLine && lastWasEnter.current) {
            e.preventDefault();
            onExitWidget();
            return;
          }
        }

        // Track this Enter so the next consecutive Enter can exit
        lastWasEnter.current = true;
        setTimeout(() => { lastWasEnter.current = false; }, 500);
      } else if (e.key !== 'Enter') {
        lastWasEnter.current = false;
      }
    },
    [pickerVisible, block.id, markdown, onExitWidget, updateBlockData],
  );

  const handlePickerSelect = useCallback(
    (type: NotebookBlockType) => {
      setPickerVisible(false);
      onReplaceWith(type);
    },
    [onReplaceWith],
  );

  const handlePickerDismiss = useCallback(() => {
    setPickerVisible(false);
    updateBlockData(block.id, { markdown: '' });
  }, [block.id, updateBlockData]);

  useEffect(() => {
    if (pickerVisible && textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.top + 33, left: rect.left });
    } else {
      setPickerPos(null);
    }
  }, [pickerVisible]);

  if (isPreview) {
    if (!markdown.trim()) {
      return (
        <p className="text-[13px] italic text-muted-foreground">
          Empty text block.
        </p>
      );
    }
    return <MarkdownLines content={markdown} />;
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={markdown}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onInput={resize}
        rows={1}
        placeholder="Type '/' for commands, or start writing..."
        autoFocus={autoFocus}
        className="w-full overflow-hidden resize-none bg-transparent px-1.5 py-2 text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
      />
      {pickerVisible && pickerPos && createPortal(
        <div style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, zIndex: 200, width: 240 }}>
          <SlashCommandPicker
            filter={pickerFilter}
            onSelect={handlePickerSelect}
            onDismiss={handlePickerDismiss}
          />
        </div>,
        document.body,
      )}
    </div>
  );
}
