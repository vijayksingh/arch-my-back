import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import WidgetNode from '../canvas/WidgetNode';
import { useWidgetStore } from '../store/widgetStore';
import { widgetRegistry } from '../registry/widgetRegistry';
import type { WidgetDefinition } from '../types';

// Simple test widget component
function TestWidgetComponent() {
  return <div>Test Widget Content</div>;
}

const testWidgetDefinition: WidgetDefinition = {
  id: 'test-widget-render',
  name: 'Test Widget',
  description: 'A test widget for rendering',
  category: 'visualization',
  version: '1.0.0',
  author: 'Test',
  tags: ['test'],
  icon: 'Box',
  component: TestWidgetComponent,
  inputSchema: {
    type: 'object',
    properties: {
      value: { type: 'string' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      result: { type: 'string' },
    },
  },
  defaultConfig: {},
};

describe('WidgetNode', () => {
  beforeEach(() => {
    // Clear stores
    useWidgetStore.getState().clearWidgets();
    widgetRegistry.clear();
  });

  it('should render widget instance', () => {
    // Register widget
    widgetRegistry.register(testWidgetDefinition);

    // Create widget instance
    const instanceId = useWidgetStore.getState().addWidget('test-widget-render');
    expect(instanceId).toBeTruthy();

    // Render WidgetNode
    render(
      <ReactFlowProvider>
        <WidgetNode
          id="test-node-1"
          type="widgetNode"
          data={{ widgetInstanceId: instanceId! }}
          selected={false}
          isConnectable={true}
          zIndex={0}
          dragging={false}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
        />
      </ReactFlowProvider>,
    );

    // Verify widget name renders
    expect(screen.getByText('Test Widget')).toBeInTheDocument();

    // Verify widget component renders
    expect(screen.getByText('Test Widget Content')).toBeInTheDocument();
  });

  it('should show error for non-existent widget instance', () => {
    render(
      <ReactFlowProvider>
        <WidgetNode
          id="test-node-2"
          type="widgetNode"
          data={{ widgetInstanceId: 'non-existent-instance' }}
          selected={false}
          isConnectable={true}
          zIndex={0}
          dragging={false}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
        />
      </ReactFlowProvider>,
    );

    // Verify error message renders
    expect(screen.getByText(/Widget instance not found/i)).toBeInTheDocument();
  });

  it('should show error for non-existent widget definition', () => {
    // Create widget instance with an ID that will fail lookup
    const store = useWidgetStore.getState();
    const instanceId = 'test-instance-broken';

    // Manually add a broken widget instance (bypassing validation)
    store.widgets = {
      [instanceId]: {
        id: instanceId,
        widgetId: 'non-existent-widget-def',
        config: {},
        position: { x: 0, y: 0 },
      },
    };

    render(
      <ReactFlowProvider>
        <WidgetNode
          id="test-node-3"
          type="widgetNode"
          data={{ widgetInstanceId: instanceId }}
          selected={false}
          isConnectable={true}
          zIndex={0}
          dragging={false}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
        />
      </ReactFlowProvider>,
    );

    // Verify error message renders
    expect(screen.getByText(/Widget definition not found/i)).toBeInTheDocument();
  });

  it('should apply selected styling', () => {
    // Register widget
    widgetRegistry.register(testWidgetDefinition);

    // Create widget instance
    const instanceId = useWidgetStore.getState().addWidget('test-widget-render');

    const { container } = render(
      <ReactFlowProvider>
        <WidgetNode
          id="test-node-4"
          type="widgetNode"
          data={{ widgetInstanceId: instanceId! }}
          selected={true}
          isConnectable={true}
          zIndex={0}
          dragging={false}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
        />
      </ReactFlowProvider>,
    );

    // Verify selected class is applied
    const nodeElement = container.querySelector('.border-primary');
    expect(nodeElement).toBeInTheDocument();
  });
});
