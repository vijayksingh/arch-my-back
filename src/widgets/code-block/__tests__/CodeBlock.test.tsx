import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeBlock } from '../CodeBlock';
import type { CodeBlockInput, CodeBlockConfig } from '../CodeBlock';

describe('CodeBlock', () => {
  const defaultInput: CodeBlockInput = {
    language: 'javascript',
    code: 'console.log("Hello World");',
    runtime: 'sandboxed',
  };

  const defaultConfig: CodeBlockConfig = {
    name: 'Test Code Block',
    editable: true,
    showOutput: true,
    theme: 'dark',
  };

  it('renders code editor with language label', () => {
    render(
      <CodeBlock instanceId="test-1" input={defaultInput} config={defaultConfig} />
    );

    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('shows empty state when no input provided', () => {
    render(
      <CodeBlock instanceId="test-2" input={undefined} config={defaultConfig} />
    );

    expect(screen.getByText(/No code provided/i)).toBeInTheDocument();
  });

  it('displays runtime indicator', () => {
    render(
      <CodeBlock instanceId="test-3" input={defaultInput} config={defaultConfig} />
    );

    expect(screen.getByText('sandboxed')).toBeInTheDocument();
  });

  it('has copy button', () => {
    render(
      <CodeBlock instanceId="test-4" input={defaultInput} config={defaultConfig} />
    );

    expect(screen.getByTitle('Copy code')).toBeInTheDocument();
  });

  it('has share button', () => {
    render(
      <CodeBlock instanceId="test-5" input={defaultInput} config={defaultConfig} />
    );

    expect(screen.getByTitle('Share snippet')).toBeInTheDocument();
  });

  it('shows run button for javascript', () => {
    render(
      <CodeBlock instanceId="test-6" input={defaultInput} config={defaultConfig} />
    );

    expect(screen.getByTitle('Run code')).toBeInTheDocument();
  });

  it('has run button that can be clicked', () => {
    const onOutput = vi.fn();
    render(
      <CodeBlock
        instanceId="test-7"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const runButton = screen.getByTitle('Run code');
    expect(runButton).toBeInTheDocument();
    expect(runButton).not.toBeDisabled();
  });

  it('disables run button when no code', () => {
    render(
      <CodeBlock
        instanceId="test-8"
        input={{ language: 'javascript', code: '' }}
        config={defaultConfig}
      />
    );

    const runButton = screen.getByTitle('Run code');
    expect(runButton).toBeDisabled();
  });
});
