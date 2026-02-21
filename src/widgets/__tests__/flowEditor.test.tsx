import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlowEditor } from '../flow-editor/FlowEditor';
import { useWidgetStore } from '../store/widgetStore';
import { widgetRegistry } from '../registry/widgetRegistry';
import type { WidgetDefinition } from '../types';

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ nodes, edges }: { nodes: unknown[]; edges: unknown[] }) => (
    <div data-testid="react-flow">
      <div data-testid="nodes">{JSON.stringify(nodes)}</div>
      <div data-testid="edges">{JSON.stringify(edges)}</div>
    </div>
  ),
  Controls: () => <div data-testid="controls">Controls</div>,
  Background: () => <div data-testid="background">Background</div>,
  BackgroundVariant: { Dots: 'dots' },
  addEdge: (params: unknown, edges: unknown[]) => [...edges, params],
  useNodesState: (initial: unknown[]) => [
    initial,
    vi.fn(),
    vi.fn(),
  ] as const,
  useEdgesState: (initial: unknown[]) => [
    initial,
    vi.fn(),
    vi.fn(),
  ] as const,
}));

describe('FlowEditor', () => {
  const mockWidget: WidgetDefinition = {
    id: 'test-widget',
    name: 'Test Widget',
    category: 'visualization',
    icon: '🧪',
    description: 'A test widget',
    tags: ['test'],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    configSchema: { type: 'object' },
    defaultConfig: { testValue: 'default' },
    component: () => <div>Test Widget</div>,
    examples: [],
  };

  beforeEach(() => {
    // Clear widget store
    useWidgetStore.getState().clearWidgets();

    // Clear and register mock widget
    widgetRegistry.clear();
    widgetRegistry.register(mockWidget);
  });

  it('should render the flow editor', () => {
    render(<FlowEditor />);
    expect(screen.getByText('Flow Editor')).toBeInTheDocument();
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('should show save button', () => {
    render(<FlowEditor />);
    const saveButton = screen.getByText('Save Flow');
    expect(saveButton).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', () => {
    const onSave = vi.fn();
    render(<FlowEditor onSave={onSave} />);

    const saveButton = screen.getByText('Save Flow');
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalled();
  });

  it('should render nodes for existing widgets', () => {
    // Add a widget to the store
    useWidgetStore.getState().addWidget('test-widget');

    render(<FlowEditor />);

    const nodesContainer = screen.getByTestId('nodes');
    const nodes = JSON.parse(nodesContainer.textContent || '[]');

    expect(nodes.length).toBe(1);
    expect(nodes[0].type).toBe('widget');
  });

  it('should render edges for connections', () => {
    // Add two widgets and connect them
    const store = useWidgetStore.getState();
    const widget1Id = store.addWidget('test-widget');
    const widget2Id = store.addWidget('test-widget');

    if (widget1Id && widget2Id) {
      store.connectWidgets({
        from: { widgetId: widget1Id, outputKey: 'output' },
        to: { widgetId: widget2Id, inputKey: 'input' },
      });
    }

    render(<FlowEditor />);

    const edgesContainer = screen.getByTestId('edges');
    const edges = JSON.parse(edgesContainer.textContent || '[]');

    expect(edges.length).toBe(1);
    expect(edges[0].animated).toBe(true);
  });

  it('should load flow when flowId is provided', () => {
    // Create a flow
    const store = useWidgetStore.getState();
    const widget1Id = store.addWidget('test-widget');
    const widget2Id = store.addWidget('test-widget');
    const flowId = store.createFlow('Test Flow', [widget1Id!, widget2Id!]);

    render(<FlowEditor flowId={flowId} />);

    const nodesContainer = screen.getByTestId('nodes');
    const nodes = JSON.parse(nodesContainer.textContent || '[]');

    expect(nodes.length).toBe(2);
  });
});
