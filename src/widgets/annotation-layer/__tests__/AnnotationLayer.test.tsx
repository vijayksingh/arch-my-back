import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnnotationLayer } from '../AnnotationLayer';
import type { AnnotationLayerInput, AnnotationLayerConfig } from '../AnnotationLayer';

describe('AnnotationLayer', () => {
  const defaultInput: AnnotationLayerInput = {
    targetId: 'test-target',
    annotations: [
      {
        id: 'ann-1',
        type: 'note',
        position: { x: 100, y: 50 },
        content: 'Test annotation',
        visible: true,
      },
    ],
  };

  const defaultConfig: AnnotationLayerConfig = {
    name: 'Test Annotations',
    editable: true,
    showAll: true,
  };

  it('renders annotations on canvas', () => {
    render(
      <AnnotationLayer
        instanceId="test-1"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText('Test annotation')).toBeInTheDocument();
    expect(screen.getByText(/Target: test-target/i)).toBeInTheDocument();
  });

  it('shows empty state when no target provided', () => {
    render(
      <AnnotationLayer
        instanceId="test-2"
        input={undefined}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/No target specified/i)).toBeInTheDocument();
  });

  it('allows adding new annotations when editable', () => {
    const onOutput = vi.fn();
    render(
      <AnnotationLayer
        instanceId="test-3"
        input={{ targetId: 'test', annotations: [] }}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const addButton = screen.getByTitle('Add annotation');
    fireEvent.click(addButton);

    expect(onOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        annotations: expect.arrayContaining([
          expect.objectContaining({
            content: 'New annotation',
          }),
        ]),
        action: 'add',
      })
    );
  });

  it('allows deleting annotations when editable', () => {
    const onOutput = vi.fn();
    render(
      <AnnotationLayer
        instanceId="test-4"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(onOutput).toHaveBeenCalledWith({
      annotations: [],
      action: 'delete',
    });
  });

  it('handles export of annotations', () => {
    const onOutput = vi.fn();
    render(
      <AnnotationLayer
        instanceId="test-5"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const exportButton = screen.getByTitle('Export annotations');
    fireEvent.click(exportButton);

    expect(onOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'export',
      })
    );
  });

  it('displays annotation count', () => {
    render(
      <AnnotationLayer
        instanceId="test-6"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/1 annotation/i)).toBeInTheDocument();
  });
});
