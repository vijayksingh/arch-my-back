import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Breadcrumb } from '../Breadcrumb';
import type { BreadcrumbInput, BreadcrumbConfig } from '../Breadcrumb';

describe('Breadcrumb', () => {
  const defaultInput: BreadcrumbInput = {
    path: [
      { id: '1', label: 'root', type: 'folder' },
      { id: '2', label: 'src', type: 'folder' },
      { id: '3', label: 'components', type: 'folder' },
      { id: '4', label: 'Widget.tsx', type: 'file' },
    ],
    currentId: '4',
  };

  const defaultConfig: BreadcrumbConfig = {
    name: 'Test Breadcrumb',
    maxLength: 5,
    showIcons: true,
    separator: 'chevron',
  };

  it('renders breadcrumb path', () => {
    render(
      <Breadcrumb instanceId="test-1" input={defaultInput} config={defaultConfig} />
    );

    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('components')).toBeInTheDocument();
    expect(screen.getByText('Widget.tsx')).toBeInTheDocument();
  });

  it('shows empty state when no path provided', () => {
    render(
      <Breadcrumb
        instanceId="test-2"
        input={undefined}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/No path provided/i)).toBeInTheDocument();
  });

  it('highlights current item', () => {
    render(
      <Breadcrumb instanceId="test-3" input={defaultInput} config={defaultConfig} />
    );

    const currentItem = screen.getByText('Widget.tsx').closest('button');
    expect(currentItem).toHaveClass('text-primary');
  });

  it('handles item navigation', () => {
    const onOutput = vi.fn();
    render(
      <Breadcrumb
        instanceId="test-4"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const item = screen.getByText('src');
    fireEvent.click(item);

    expect(onOutput).toHaveBeenCalledWith({
      selectedId: '2',
      path: 'root/src',
    });
  });

  it('truncates long paths', () => {
    const longPath: BreadcrumbInput = {
      path: Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        label: `item-${i}`,
        type: 'folder' as const,
      })),
    };

    render(
      <Breadcrumb instanceId="test-5" input={longPath} config={defaultConfig} />
    );

    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('has copy path button', () => {
    render(
      <Breadcrumb instanceId="test-6" input={defaultInput} config={defaultConfig} />
    );

    expect(screen.getByTitle(/Copy full path/i)).toBeInTheDocument();
  });

  it('displays item count in footer', () => {
    render(
      <Breadcrumb instanceId="test-7" input={defaultInput} config={defaultConfig} />
    );

    expect(screen.getByText(/4 items in path/i)).toBeInTheDocument();
  });

  it('shows icons when enabled', () => {
    const { container } = render(
      <Breadcrumb instanceId="test-8" input={defaultInput} config={defaultConfig} />
    );

    // Icons are rendered as SVG elements
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('hides icons when disabled', () => {
    const { container } = render(
      <Breadcrumb
        instanceId="test-9"
        input={defaultInput}
        config={{ ...defaultConfig, showIcons: false }}
      />
    );

    // Should have fewer icons (only separators + copy button)
    const icons = container.querySelectorAll('svg');
    // 3 separators + 1 copy button = 4 icons
    expect(icons.length).toBe(4);
  });
});
