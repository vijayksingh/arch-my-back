/**
 * CodeMirror 6 DSL editor component
 *
 * Displays the archspec DSL with syntax highlighting, autocomplete, and linting
 */

import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { archspec } from './archspecLanguage';
import { useThemeStore } from '@/stores/themeStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { fromCanvasNodes } from '@/dsl/canvasAdapter';
import { serialize } from '@/dsl/serializer';

export function DSLEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  // Generate DSL text from canvas state
  const dslText = (() => {
    try {
      // Convert canvas nodes/edges to archspec document
      const archspecDoc = fromCanvasNodes(nodes, edges, 'Architecture', '1.0');

      // Serialize to DSL text
      return serialize(archspecDoc);
    } catch (error) {
      console.error('Failed to serialize canvas to DSL:', error);
      return '// Error: Unable to serialize canvas state\n';
    }
  })();

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Create editor state
    const state = EditorState.create({
      doc: dslText,
      extensions: [
        basicSetup,
        archspec(),
        theme === 'dark' ? oneDark : [],
        EditorView.editable.of(false), // Read-only for now (bidirectional sync is future work)
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
          },
          '.cm-scroller': {
            fontFamily: 'var(--font-mono, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace)',
          },
        }),
      ],
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only create once

  // Update document when canvas changes
  useEffect(() => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const currentDoc = view.state.doc.toString();

    if (currentDoc !== dslText) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: dslText,
        },
      });
    }
  }, [dslText]);

  // Update theme when it changes
  useEffect(() => {
    if (!viewRef.current) return;

    const view = viewRef.current;

    view.dispatch({
      effects: [
        // Reconfigure extensions to apply new theme
        // Note: This is a simplified approach. For production, use compartments.
      ],
    });

    // For now, we'll recreate the view to apply theme changes
    // A more efficient approach would use StateEffect.reconfigure with compartments
    const currentDoc = view.state.doc.toString();

    const newState = EditorState.create({
      doc: currentDoc,
      extensions: [
        basicSetup,
        archspec(),
        theme === 'dark' ? oneDark : [],
        EditorView.editable.of(false),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
          },
          '.cm-scroller': {
            fontFamily: 'var(--font-mono, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace)',
          },
        }),
      ],
    });

    view.setState(newState);
  }, [theme]);

  return (
    <div className="h-full w-full overflow-hidden border-l border-border bg-background">
      <div className="flex h-10 items-center border-b border-border bg-muted/30 px-3">
        <span className="text-xs font-medium text-muted-foreground">DSL Editor</span>
      </div>
      <div ref={editorRef} className="h-[calc(100%-2.5rem)]" />
    </div>
  );
}
