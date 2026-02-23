import { useState, useCallback } from 'react';
import type { WidgetProps } from '../types';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Comparison Table Input Schema
 */
export interface ComparisonTableInput {
  columns: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  rows: Array<{
    id: string;
    label: string;
    cells: Record<string, CellContent>;
    blanks?: string[]; // column IDs that are blank for learner to fill
    acceptableAnswers?: Record<string, string[]>; // col ID -> acceptable strings
  }>;
  mode?: 'display' | 'analysis'; // default 'display'
  decisionPrompt?: string;
  decisionOptions?: Array<{
    id: string;
    text: string;
    correct: boolean;
    explanation: string;
  }>;
}

/**
 * Cell content types
 */
export type CellContent =
  | string
  | {
      type: 'text' | 'pros-cons' | 'code' | 'link';
      content: string;
      pros?: string[];
      cons?: string[];
      url?: string;
    };

/**
 * Comparison Table Output Schema
 */
export interface ComparisonTableOutput {
  selectedColumn?: string;
  selectedRow?: string;
  exportFormat?: 'markdown' | 'json' | 'csv';
}

/**
 * Comparison Table Config Schema
 */
export interface ComparisonTableConfig {
  name?: string;
  striped?: boolean;
  highlightOnHover?: boolean;
  sortable?: boolean;
  maxWidth?: string;
}

/**
 * Comparison Table Widget Component
 */
export function ComparisonTable({
  input,
  config,
  onOutput,
}: WidgetProps<ComparisonTableInput, ComparisonTableOutput, ComparisonTableConfig>) {
  const [selectedColumn, setSelectedColumn] = useState<string | undefined>();
  const [selectedRow, setSelectedRow] = useState<string | undefined>();

  // Analysis mode state
  const [userInputs, setUserInputs] = useState<Record<string, Record<string, string>>>({});
  const [validation, setValidation] = useState<Record<string, Record<string, boolean>>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<string | undefined>();
  const [showDecisionFeedback, setShowDecisionFeedback] = useState(false);

  const isAnalysisMode = input?.mode === 'analysis';

  if (!input || !input.columns || !input.rows) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-border bg-muted/30 p-4">
        <div className="text-center text-sm text-muted-foreground">
          No data provided. Please provide columns and rows.
        </div>
      </div>
    );
  }

  const handleColumnClick = useCallback(
    (columnId: string) => {
      const newSelectedColumn = selectedColumn === columnId ? undefined : columnId;
      setSelectedColumn(newSelectedColumn);
      onOutput?.({
        selectedColumn: newSelectedColumn,
        selectedRow,
      });
    },
    [selectedColumn, selectedRow, onOutput]
  );

  const handleRowClick = useCallback(
    (rowId: string) => {
      const newSelectedRow = selectedRow === rowId ? undefined : rowId;
      setSelectedRow(newSelectedRow);
      onOutput?.({
        selectedColumn,
        selectedRow: newSelectedRow,
      });
    },
    [selectedColumn, selectedRow, onOutput]
  );

  const exportToMarkdown = () => {
    let md = '# ' + (config.name || 'Comparison Table') + '\n\n';

    // Header row
    md += '| ' + input.rows[0].label + ' | ' + input.columns.map(col => col.title).join(' | ') + ' |\n';
    md += '|' + Array(input.columns.length + 1).fill('---').join('|') + '|\n';

    // Data rows
    input.rows.forEach(row => {
      md += '| **' + row.label + '** |';
      input.columns.forEach(col => {
        const cell = row.cells[col.id];
        const cellText = typeof cell === 'string' ? cell : formatCellContent(cell);
        md += ' ' + cellText + ' |';
      });
      md += '\n';
    });

    return md;
  };

  const exportToJSON = () => {
    return JSON.stringify(input, null, 2);
  };

  const exportToCSV = () => {
    let csv = input.rows[0].label + ',' + input.columns.map(col => col.title).join(',') + '\n';

    input.rows.forEach(row => {
      csv += row.label + ',';
      csv += input.columns.map(col => {
        const cell = row.cells[col.id];
        const cellText = typeof cell === 'string' ? cell : formatCellContent(cell);
        return '"' + cellText.replace(/"/g, '""') + '"';
      }).join(',');
      csv += '\n';
    });

    return csv;
  };

  const handleExport = (format: 'markdown' | 'json' | 'csv') => {
    let content = '';
    let filename = 'comparison-table';

    switch (format) {
      case 'markdown':
        content = exportToMarkdown();
        filename += '.md';
        break;
      case 'json':
        content = exportToJSON();
        filename += '.json';
        break;
      case 'csv':
        content = exportToCSV();
        filename += '.csv';
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    onOutput?.({
      selectedColumn,
      selectedRow,
      exportFormat: format,
    });
  };

  const formatCellContent = useCallback((cell: CellContent): string => {
    if (typeof cell === 'string') return cell;

    if (cell.type === 'pros-cons') {
      return (cell.pros || []).join(', ') + ' / ' + (cell.cons || []).join(', ');
    }

    if (cell.type === 'link') {
      return cell.content + ' (' + cell.url + ')';
    }

    return cell.content || '';
  }, []);

  const handleCheckAnswers = useCallback(() => {
    if (!input || !isAnalysisMode) return;

    const newValidation: Record<string, Record<string, boolean>> = {};

    input.rows.forEach((row) => {
      if (row.blanks && row.acceptableAnswers) {
        newValidation[row.id] = {};
        row.blanks.forEach((colId) => {
          const userAnswer = userInputs[row.id]?.[colId]?.trim().toLowerCase() || '';
          const acceptable = row.acceptableAnswers![colId]?.map(a => a.toLowerCase()) || [];
          newValidation[row.id][colId] = acceptable.some(ans => userAnswer === ans);
        });
      }
    });

    setValidation(newValidation);
    setShowFeedback(true);
  }, [input, isAnalysisMode, userInputs]);

  const handleInputChange = useCallback((rowId: string, colId: string, value: string) => {
    setUserInputs(prev => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [colId]: value,
      },
    }));
  }, []);

  const renderCellContent = (cell: CellContent, rowId: string, colId: string, isBlank?: boolean) => {
    // Analysis mode: render blank cells as inputs
    if (isAnalysisMode && isBlank) {
      const userValue = userInputs[rowId]?.[colId] || '';
      const isValidated = showFeedback && validation[rowId]?.[colId] !== undefined;
      const isCorrect = validation[rowId]?.[colId];

      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={userValue}
            onChange={(e) => handleInputChange(rowId, colId, e.target.value)}
            disabled={showFeedback}
            className={`flex-1 rounded border px-2 py-1 text-sm ${
              isValidated
                ? isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                : 'border-border bg-background'
            }`}
            placeholder="Type your answer..."
          />
          {isValidated && (
            isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )
          )}
        </div>
      );
    }

    // Display mode: render cell content normally
    if (typeof cell === 'string') {
      return <div className="whitespace-pre-wrap">{cell}</div>;
    }

    if (cell.type === 'pros-cons') {
      return (
        <div className="space-y-1 text-sm">
          {cell.pros && cell.pros.length > 0 && (
            <div className="text-success">
              ✓ {cell.pros.join(', ')}
            </div>
          )}
          {cell.cons && cell.cons.length > 0 && (
            <div className="text-error">
              ✗ {cell.cons.join(', ')}
            </div>
          )}
        </div>
      );
    }

    if (cell.type === 'code') {
      return (
        <code className="block rounded bg-muted px-2 py-1 text-xs font-mono">
          {cell.content}
        </code>
      );
    }

    if (cell.type === 'link') {
      return (
        <a
          href={cell.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {cell.content}
        </a>
      );
    }

    return <div>{cell.content}</div>;
  };

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background"
      style={{ maxWidth: config.maxWidth }}
    >
      {/* Header with export buttons */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="text-sm font-medium">{config.name || 'Comparison Table'}</div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleExport('markdown')}
            title="Export to Markdown"
          >
            <Download className="mr-1 h-3 w-3" />
            MD
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleExport('json')}
            title="Export to JSON"
          >
            <Download className="mr-1 h-3 w-3" />
            JSON
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleExport('csv')}
            title="Export to CSV"
          >
            <Download className="mr-1 h-3 w-3" />
            CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-background">
            <tr>
              <th className="border-b border-r border-border bg-muted p-3 text-left text-sm font-semibold">
                {/* Empty corner cell */}
              </th>
              {input.columns.map((column) => (
                <th
                  key={column.id}
                  className={`border-b border-border p-3 text-left text-sm font-semibold cursor-pointer transition-colors ${
                    selectedColumn === column.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleColumnClick(column.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleColumnClick(column.id);
                    }
                  }}
                  aria-pressed={selectedColumn === column.id}
                  aria-label={`Column: ${column.title}. ${column.description || ''}`}
                >
                  <div>{column.title}</div>
                  {column.description && (
                    <div className="mt-1 text-xs font-normal text-muted-foreground">
                      {column.description}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {input.rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={`
                  ${config.striped && rowIndex % 2 === 1 ? 'bg-muted/20' : ''}
                  ${config.highlightOnHover ? 'hover:bg-muted/40' : ''}
                  ${selectedRow === row.id ? 'bg-primary/10' : ''}
                  transition-colors
                `}
              >
                <td
                  className="border-b border-r border-border bg-muted/30 p-3 text-sm font-medium cursor-pointer"
                  onClick={() => handleRowClick(row.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(row.id);
                    }
                  }}
                  aria-pressed={selectedRow === row.id}
                  aria-label={`Row: ${row.label}`}
                >
                  {row.label}
                </td>
                {input.columns.map((column) => {
                  const isBlank = row.blanks?.includes(column.id);
                  return (
                    <td
                      key={column.id}
                      className="border-b border-border p-3 text-sm"
                    >
                      {renderCellContent(row.cells[column.id] || '', row.id, column.id, isBlank)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Analysis mode: Check button */}
      {isAnalysisMode && !showFeedback && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <Button onClick={handleCheckAnswers} size="sm">
            Check Answers
          </Button>
        </div>
      )}

      {/* Analysis mode: Decision prompt */}
      {isAnalysisMode && input.decisionPrompt && showFeedback && (
        <div className="border-t border-border bg-background px-4 py-4">
          <div className="mb-3 font-medium">{input.decisionPrompt}</div>
          <div className="space-y-2">
            {input.decisionOptions?.map((option) => {
              const isSelected = selectedDecision === option.id;
              const showExplanation = showDecisionFeedback && isSelected;
              const isCorrectOption = option.correct;

              return (
                <div key={option.id}>
                  <button
                    onClick={() => {
                      setSelectedDecision(option.id);
                      setShowDecisionFeedback(true);
                    }}
                    disabled={showDecisionFeedback}
                    className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                      showDecisionFeedback
                        ? isCorrectOption
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                          : isSelected
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                          : 'border-border bg-muted/20'
                        : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {showDecisionFeedback && isCorrectOption && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                      {showDecisionFeedback && !isCorrectOption && isSelected && (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      <span>{option.text}</span>
                    </div>
                  </button>
                  {showExplanation && (
                    <div className="mt-2 ml-6 text-sm text-muted-foreground">
                      {option.explanation}
                    </div>
                  )}
                  {showDecisionFeedback && isCorrectOption && !isSelected && (
                    <div className="mt-2 ml-6 text-sm text-muted-foreground">
                      ✓ Correct answer: {option.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
