import { useState } from 'react';
import type { WidgetProps } from '../types';
import { Button } from '@/components/ui/button';
import { Copy, SplitSquareHorizontal, AlignLeft } from 'lucide-react';

/**
 * Code Diff Input Schema
 */
export interface CodeDiffInput {
  language: string;
  oldCode: string;
  newCode: string;
  filename?: string;
  hunks?: Array<{
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
  }>;
}

/**
 * Code Diff Output Schema
 */
export interface CodeDiffOutput {
  selectedLine?: number;
  viewMode?: 'split' | 'unified';
}

/**
 * Code Diff Config Schema
 */
export interface CodeDiffConfig {
  name?: string;
  viewMode?: 'split' | 'unified';
  showLineNumbers?: boolean;
}

/**
 * Diff line type
 */
type DiffLineType = 'added' | 'removed' | 'unchanged' | 'empty';

interface DiffLine {
  type: DiffLineType;
  oldLine?: number;
  newLine?: number;
  content: string;
}

/**
 * Code Diff Widget Component
 */
export function CodeDiff({
  instanceId,
  input,
  config,
  onOutput,
}: WidgetProps<CodeDiffInput, CodeDiffOutput, CodeDiffConfig>) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>(
    config.viewMode || 'split'
  );
  const [selectedLine, setSelectedLine] = useState<number | undefined>();

  if (!input || !input.oldCode || !input.newCode) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-border bg-muted/30 p-4">
        <div className="text-center text-sm text-muted-foreground">
          No code provided. Please provide oldCode and newCode.
        </div>
      </div>
    );
  }

  // Simple diff algorithm
  const computeDiff = (): DiffLine[] => {
    const oldLines = input.oldCode.split('\n');
    const newLines = input.newCode.split('\n');
    const diff: DiffLine[] = [];

    // Very simple line-by-line diff
    const maxLength = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === newLine) {
        // Unchanged line
        diff.push({
          type: 'unchanged',
          oldLine: i + 1,
          newLine: i + 1,
          content: oldLine || '',
        });
      } else if (oldLine !== undefined && newLine === undefined) {
        // Line removed
        diff.push({
          type: 'removed',
          oldLine: i + 1,
          content: oldLine,
        });
      } else if (oldLine === undefined && newLine !== undefined) {
        // Line added
        diff.push({
          type: 'added',
          newLine: i + 1,
          content: newLine,
        });
      } else {
        // Line changed (show as removed + added)
        diff.push({
          type: 'removed',
          oldLine: i + 1,
          content: oldLine,
        });
        diff.push({
          type: 'added',
          newLine: i + 1,
          content: newLine,
        });
      }
    }

    return diff;
  };

  const diffLines = computeDiff();

  const handleViewModeChange = (mode: 'split' | 'unified') => {
    setViewMode(mode);
    onOutput?.({
      selectedLine,
      viewMode: mode,
    });
  };

  const handleLineClick = (lineNum: number) => {
    const newSelectedLine = selectedLine === lineNum ? undefined : lineNum;
    setSelectedLine(newSelectedLine);
    onOutput?.({
      selectedLine: newSelectedLine,
      viewMode,
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const getLineColor = (type: DiffLineType) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 dark:bg-green-950/30 text-green-900 dark:text-green-100';
      case 'removed':
        return 'bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-100';
      case 'unchanged':
        return 'bg-background';
      case 'empty':
        return 'bg-muted/20';
    }
  };

  const getLineMarker = (type: DiffLineType) => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'unchanged':
        return ' ';
      case 'empty':
        return ' ';
    }
  };

  const renderUnifiedView = () => {
    return (
      <div className="overflow-auto font-mono text-xs">
        <table className="w-full border-collapse">
          <tbody>
            {diffLines.map((line, idx) => (
              <tr
                key={idx}
                className={`${getLineColor(line.type)} cursor-pointer hover:brightness-95 dark:hover:brightness-110`}
                onClick={() => handleLineClick(idx)}
              >
                {config.showLineNumbers && (
                  <>
                    <td className="w-12 select-none border-r border-border px-2 py-0.5 text-right text-muted-foreground">
                      {line.oldLine || ''}
                    </td>
                    <td className="w-12 select-none border-r border-border px-2 py-0.5 text-right text-muted-foreground">
                      {line.newLine || ''}
                    </td>
                  </>
                )}
                <td className="w-6 select-none border-r border-border px-2 py-0.5 text-center font-bold">
                  {getLineMarker(line.type)}
                </td>
                <td className="px-2 py-0.5">
                  <pre className="whitespace-pre-wrap break-all">{line.content}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSplitView = () => {
    const oldLines = input.oldCode.split('\n');
    const newLines = input.newCode.split('\n');
    const maxLength = Math.max(oldLines.length, newLines.length);

    return (
      <div className="flex h-full overflow-auto">
        {/* Old Code */}
        <div className="w-1/2 border-r border-border font-mono text-xs">
          <table className="w-full border-collapse">
            <tbody>
              {Array.from({ length: maxLength }).map((_, idx) => {
                const line = oldLines[idx];
                const isRemoved = line !== undefined && newLines[idx] !== line;
                const type = isRemoved ? 'removed' : line !== undefined ? 'unchanged' : 'empty';

                return (
                  <tr
                    key={idx}
                    className={`${getLineColor(type)} cursor-pointer hover:brightness-95 dark:hover:brightness-110`}
                    onClick={() => handleLineClick(idx)}
                  >
                    {config.showLineNumbers && (
                      <td className="w-12 select-none border-r border-border px-2 py-0.5 text-right text-muted-foreground">
                        {line !== undefined ? idx + 1 : ''}
                      </td>
                    )}
                    <td className="px-2 py-0.5">
                      <pre className="whitespace-pre-wrap break-all">{line || ''}</pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* New Code */}
        <div className="w-1/2 font-mono text-xs">
          <table className="w-full border-collapse">
            <tbody>
              {Array.from({ length: maxLength }).map((_, idx) => {
                const line = newLines[idx];
                const isAdded = line !== undefined && oldLines[idx] !== line;
                const type = isAdded ? 'added' : line !== undefined ? 'unchanged' : 'empty';

                return (
                  <tr
                    key={idx}
                    className={`${getLineColor(type)} cursor-pointer hover:brightness-95 dark:hover:brightness-110`}
                    onClick={() => handleLineClick(idx)}
                  >
                    {config.showLineNumbers && (
                      <td className="w-12 select-none border-r border-border px-2 py-0.5 text-right text-muted-foreground">
                        {line !== undefined ? idx + 1 : ''}
                      </td>
                    )}
                    <td className="px-2 py-0.5">
                      <pre className="whitespace-pre-wrap break-all">{line || ''}</pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">
            {input.filename || config.name || 'Code Diff'}
          </div>
          {input.language && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {input.language}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={viewMode === 'split' ? 'default' : 'ghost'}
            onClick={() => handleViewModeChange('split')}
            title="Split View"
          >
            <SplitSquareHorizontal className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'unified' ? 'default' : 'ghost'}
            onClick={() => handleViewModeChange('unified')}
            title="Unified View"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyCode(input.newCode)}
            title="Copy New Code"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'split' ? renderSplitView() : renderUnifiedView()}
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        {diffLines.filter((l) => l.type === 'added').length} additions •{' '}
        {diffLines.filter((l) => l.type === 'removed').length} deletions
        {selectedLine !== undefined && (
          <span className="ml-2">• Selected line: {selectedLine + 1}</span>
        )}
      </div>
    </div>
  );
}
