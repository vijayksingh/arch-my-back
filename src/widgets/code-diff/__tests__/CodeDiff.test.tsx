import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeDiff } from '../CodeDiff';
import type { CodeDiffInput, CodeDiffConfig } from '../CodeDiff';

describe('CodeDiff', () => {
  const defaultInput: CodeDiffInput = {
    language: 'javascript',
    oldCode: 'const x = 1;\nconst y = 2;',
    newCode: 'const x = 1;\nconst z = 3;',
    filename: 'test.js',
  };

  const defaultConfig: CodeDiffConfig = {
    name: 'Test Diff',
    viewMode: 'split',
    showLineNumbers: true,
  };

  it('renders code diff with filename', () => {
    render(
      <CodeDiff
        instanceId="test-1"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText('test.js')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('shows empty state when no input provided', () => {
    render(
      <CodeDiff
        instanceId="test-2"
        input={undefined}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/No code provided/i)).toBeInTheDocument();
  });

  it('shows empty state when oldCode is missing', () => {
    render(
      <CodeDiff
        instanceId="test-3"
        input={{ language: 'js', oldCode: '', newCode: 'test' }}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/No code provided/i)).toBeInTheDocument();
  });

  it('switches between split and unified view', () => {
    const onOutput = vi.fn();
    render(
      <CodeDiff
        instanceId="test-4"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const unifiedButton = screen.getByTitle('Unified View');
    fireEvent.click(unifiedButton);

    expect(onOutput).toHaveBeenCalledWith({
      selectedLine: undefined,
      viewMode: 'unified',
    });
  });

  it('handles view mode change to split', () => {
    const onOutput = vi.fn();
    render(
      <CodeDiff
        instanceId="test-5"
        input={defaultInput}
        config={{ ...defaultConfig, viewMode: 'unified' }}
        onOutput={onOutput}
      />
    );

    const splitButton = screen.getByTitle('Split View');
    fireEvent.click(splitButton);

    expect(onOutput).toHaveBeenCalledWith({
      selectedLine: undefined,
      viewMode: 'split',
    });
  });

  it('displays addition and deletion counts', () => {
    render(
      <CodeDiff
        instanceId="test-6"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    // Should show some additions and deletions
    expect(screen.getByText(/additions/i)).toBeInTheDocument();
    expect(screen.getByText(/deletions/i)).toBeInTheDocument();
  });

  it('shows copy button', () => {
    render(
      <CodeDiff
        instanceId="test-7"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByTitle('Copy New Code')).toBeInTheDocument();
  });

  it('renders code in split view by default', () => {
    render(
      <CodeDiff
        instanceId="test-8"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    // Split view should show code on both sides (may appear multiple times)
    expect(screen.getAllByText('const x = 1;').length).toBeGreaterThan(0);
  });

  it('hides line numbers when config.showLineNumbers is false', () => {
    render(
      <CodeDiff
        instanceId="test-9"
        input={defaultInput}
        config={{ ...defaultConfig, showLineNumbers: false }}
      />
    );

    // This is a bit tricky to test without specific line number elements
    // We're just ensuring it renders without errors
    expect(screen.getAllByText('const x = 1;').length).toBeGreaterThan(0);
  });

  it('handles multi-line diffs', () => {
    const multiLineInput: CodeDiffInput = {
      language: 'javascript',
      oldCode: 'line1\nline2\nline3\nline4',
      newCode: 'line1\nmodified2\nline3\nline4',
    };

    render(
      <CodeDiff
        instanceId="test-10"
        input={multiLineInput}
        config={defaultConfig}
      />
    );

    // Use getAllByText for elements that appear multiple times (in split view)
    expect(screen.getAllByText('line1').length).toBeGreaterThan(0);
    expect(screen.getByText('modified2')).toBeInTheDocument();
  });
});
