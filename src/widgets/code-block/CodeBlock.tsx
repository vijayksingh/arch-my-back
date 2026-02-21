import { useState, useRef, useEffect } from 'react';
import type { WidgetProps } from '../types';
import { Button } from '@/components/ui/button';
import { Play, Copy, Share2, AlertCircle } from 'lucide-react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';

/**
 * Runtime environment for code execution
 */
export type CodeRuntime = 'browser' | 'sandboxed';

/**
 * Interactive Code Block Input Schema
 */
export interface CodeBlockInput {
  language: string;
  code: string;
  runtime?: CodeRuntime;
  dependencies?: string[];
}

/**
 * Interactive Code Block Output Schema
 */
export interface CodeBlockOutput {
  code: string;
  output?: string;
  error?: string;
  executionTime?: number;
}

/**
 * Interactive Code Block Config Schema
 */
export interface CodeBlockConfig {
  name?: string;
  editable?: boolean;
  showOutput?: boolean;
  theme?: 'light' | 'dark';
  autoRun?: boolean;
}

/**
 * Interactive Code Block Widget Component
 */
export function CodeBlock({
  input,
  config,
  onOutput,
}: WidgetProps<CodeBlockInput, CodeBlockOutput, CodeBlockConfig>) {
  const [code, setCode] = useState(input?.code || '');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        javascript(),
        config.theme === 'dark' ? oneDark : [],
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newCode = update.state.doc.toString();
            setCode(newCode);
          }
        }),
        EditorView.editable.of(config.editable !== false),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Update editor when code changes externally
  useEffect(() => {
    if (viewRef.current && input?.code !== undefined && input.code !== code) {
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: input.code,
        },
      });
      viewRef.current.dispatch(transaction);
      setCode(input.code);
    }
  }, [input?.code]);

  if (!input) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-border bg-muted/30 p-4">
        <div className="text-center text-sm text-muted-foreground">
          No code provided. Please provide language and code.
        </div>
      </div>
    );
  }

  const executeCode = async () => {
    setIsRunning(true);
    setError('');
    setOutput('');

    const startTime = performance.now();

    try {
      const runtime = input.runtime || 'sandboxed';

      if (runtime === 'sandboxed') {
        // Execute in sandboxed iframe
        await executeInSandbox(code);
      } else {
        // Execute directly in browser (less secure)
        executeInBrowser(code);
      }

      const executionTime = performance.now() - startTime;

      onOutput?.({
        code,
        output,
        executionTime,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onOutput?.({
        code,
        error: errorMessage,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const executeInBrowser = (codeToExecute: string) => {
    const logs: string[] = [];

    // Capture console.log
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map((arg) => String(arg)).join(' '));
      originalLog(...args);
    };

    try {
      // eslint-disable-next-line no-eval
      const result = eval(codeToExecute);
      if (result !== undefined) {
        logs.push(`=> ${String(result)}`);
      }
      setOutput(logs.join('\n'));
    } catch (err) {
      throw err;
    } finally {
      console.log = originalLog;
    }
  };

  const executeInSandbox = async (codeToExecute: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!iframeRef.current) {
        reject(new Error('Sandbox iframe not ready'));
        return;
      }

      const iframe = iframeRef.current;

      // Create a safe sandbox HTML document
      const sandboxHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <script>
            // Override console methods to capture output
            const logs = [];
            const originalConsole = {
              log: console.log,
              error: console.error,
              warn: console.warn
            };

            console.log = (...args) => {
              logs.push(args.map(arg => String(arg)).join(' '));
            };

            console.error = (...args) => {
              logs.push('ERROR: ' + args.map(arg => String(arg)).join(' '));
            };

            console.warn = (...args) => {
              logs.push('WARN: ' + args.map(arg => String(arg)).join(' '));
            };

            // Listen for code execution message
            window.addEventListener('message', (event) => {
              if (event.data.type === 'execute') {
                try {
                  const result = eval(event.data.code);
                  if (result !== undefined) {
                    logs.push('=> ' + String(result));
                  }
                  window.parent.postMessage({
                    type: 'result',
                    output: logs.join('\\n'),
                    success: true
                  }, '*');
                } catch (error) {
                  window.parent.postMessage({
                    type: 'result',
                    error: error.message,
                    success: false
                  }, '*');
                }
              }
            });

            // Signal ready
            window.parent.postMessage({ type: 'ready' }, '*');
          </script>
        </body>
        </html>
      `;

      // Set up message listener
      const handleMessage = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) return;

        if (event.data.type === 'ready') {
          // Send code to execute
          iframe.contentWindow?.postMessage(
            {
              type: 'execute',
              code: codeToExecute,
            },
            '*'
          );
        } else if (event.data.type === 'result') {
          window.removeEventListener('message', handleMessage);

          if (event.data.success) {
            setOutput(event.data.output);
            resolve();
          } else {
            setError(event.data.error);
            reject(new Error(event.data.error));
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Load sandbox
      const blob = new Blob([sandboxHTML], { type: 'text/html' });
      iframe.src = URL.createObjectURL(blob);

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        reject(new Error('Execution timeout'));
      }, 5000);
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const handleShare = () => {
    const shareURL = `${window.location.origin}?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(shareURL);
    setOutput('Share URL copied to clipboard');
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{config.name || 'Interactive Code Block'}</div>
          <div className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
            {input.language}
          </div>
          {input.runtime && (
            <div className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {input.runtime}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            title="Copy code"
            disabled={!code}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleShare} title="Share snippet">
            <Share2 className="h-4 w-4" />
          </Button>
          {input.language === 'javascript' && (
            <Button
              size="sm"
              variant="default"
              onClick={executeCode}
              disabled={isRunning || !code}
              title="Run code"
            >
              <Play className="mr-1 h-4 w-4" />
              Run
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <div ref={editorRef} className="h-full" />
      </div>

      {/* Output/Error Console */}
      {config.showOutput !== false && (output || error) && (
        <div className="border-t border-border bg-muted/10">
          <div className="px-4 py-1 text-xs font-semibold uppercase text-muted-foreground">
            Output
          </div>
          <div className="max-h-48 overflow-auto px-4 pb-3">
            {error ? (
              <div className="flex items-start gap-2 rounded bg-error-muted p-2 text-sm text-error">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm">{output}</pre>
            )}
          </div>
        </div>
      )}

      {/* Hidden sandbox iframe */}
      <iframe
        ref={iframeRef}
        className="hidden"
        sandbox="allow-scripts"
        title="Code execution sandbox"
      />
    </div>
  );
}
