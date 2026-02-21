import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComparisonTable } from '../ComparisonTable';
import type { ComparisonTableInput, ComparisonTableConfig } from '../ComparisonTable';

describe('ComparisonTable', () => {
  const defaultInput: ComparisonTableInput = {
    columns: [
      { id: 'col1', title: 'Column 1', description: 'First column' },
      { id: 'col2', title: 'Column 2' },
    ],
    rows: [
      {
        id: 'row1',
        label: 'Row 1',
        cells: {
          col1: 'Cell 1-1',
          col2: 'Cell 1-2',
        },
      },
      {
        id: 'row2',
        label: 'Row 2',
        cells: {
          col1: 'Cell 2-1',
          col2: 'Cell 2-2',
        },
      },
    ],
  };

  const defaultConfig: ComparisonTableConfig = {
    name: 'Test Table',
    striped: true,
    highlightOnHover: true,
    sortable: false,
  };

  it('renders table with columns and rows', () => {
    render(
      <ComparisonTable
        instanceId="test-1"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Column 2')).toBeInTheDocument();
    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
    expect(screen.getByText('Cell 1-1')).toBeInTheDocument();
  });

  it('shows empty state when no input provided', () => {
    render(
      <ComparisonTable
        instanceId="test-2"
        input={undefined}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/No data provided/i)).toBeInTheDocument();
  });

  it('handles column selection', () => {
    const onOutput = vi.fn();
    render(
      <ComparisonTable
        instanceId="test-3"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const columnHeader = screen.getByText('Column 1');
    fireEvent.click(columnHeader);

    expect(onOutput).toHaveBeenCalledWith({
      selectedColumn: 'col1',
      selectedRow: undefined,
    });
  });

  it('handles row selection', () => {
    const onOutput = vi.fn();
    render(
      <ComparisonTable
        instanceId="test-4"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const rowLabel = screen.getByText('Row 1');
    fireEvent.click(rowLabel);

    expect(onOutput).toHaveBeenCalledWith({
      selectedColumn: undefined,
      selectedRow: 'row1',
    });
  });

  it('renders pros-cons cell type', () => {
    const inputWithProsCons: ComparisonTableInput = {
      columns: [{ id: 'col1', title: 'Column 1' }],
      rows: [
        {
          id: 'row1',
          label: 'Row 1',
          cells: {
            col1: {
              type: 'pros-cons',
              content: 'Test',
              pros: ['Pro 1', 'Pro 2'],
              cons: ['Con 1'],
            },
          },
        },
      ],
    };

    render(
      <ComparisonTable
        instanceId="test-5"
        input={inputWithProsCons}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/Pro 1, Pro 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Con 1/i)).toBeInTheDocument();
  });

  it('renders code cell type', () => {
    const inputWithCode: ComparisonTableInput = {
      columns: [{ id: 'col1', title: 'Column 1' }],
      rows: [
        {
          id: 'row1',
          label: 'Row 1',
          cells: {
            col1: {
              type: 'code',
              content: 'const x = 1;',
            },
          },
        },
      ],
    };

    render(
      <ComparisonTable
        instanceId="test-6"
        input={inputWithCode}
        config={defaultConfig}
      />
    );

    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('renders link cell type', () => {
    const inputWithLink: ComparisonTableInput = {
      columns: [{ id: 'col1', title: 'Column 1' }],
      rows: [
        {
          id: 'row1',
          label: 'Row 1',
          cells: {
            col1: {
              type: 'link',
              content: 'Click here',
              url: 'https://example.com',
            },
          },
        },
      ],
    };

    render(
      <ComparisonTable
        instanceId="test-7"
        input={inputWithLink}
        config={defaultConfig}
      />
    );

    const link = screen.getByText('Click here');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('shows export buttons', () => {
    render(
      <ComparisonTable
        instanceId="test-8"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByTitle('Export to Markdown')).toBeInTheDocument();
    expect(screen.getByTitle('Export to JSON')).toBeInTheDocument();
    expect(screen.getByTitle('Export to CSV')).toBeInTheDocument();
  });
});
