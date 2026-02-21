import { describe, it, expect, beforeEach } from 'vitest';
import { useWidgetStore } from '../store/widgetStore';
import { widgetRegistry } from '../registry/widgetRegistry';
import type { WidgetDefinition } from '../types';

describe('WidgetStore', () => {
  const mockWidget: WidgetDefinition = {
    id: 'test-widget',
    name: 'Test Widget',
    category: 'visualization',
    icon: 'TestIcon',
    description: 'A test widget',
    tags: ['test'],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    configSchema: { type: 'object' },
    defaultConfig: { testValue: 'default' },
    component: () => null,
    examples: [],
  };

  beforeEach(() => {
    // Clear widget store
    useWidgetStore.getState().clearWidgets();

    // Clear and register mock widget
    widgetRegistry.clear();
    widgetRegistry.register(mockWidget);
  });

  it('should add a widget instance', () => {
    const instanceId = useWidgetStore.getState().addWidget('test-widget', { testValue: 'custom' });
    const widgets = useWidgetStore.getState().widgets;

    expect(instanceId).toBeTruthy();
    expect(widgets[instanceId!]).toMatchObject({
      id: instanceId,
      widgetId: 'test-widget',
      config: { testValue: 'custom' },
    });
  });

  it('should use default config when no config provided', () => {
    const instanceId = useWidgetStore.getState().addWidget('test-widget');
    const widgets = useWidgetStore.getState().widgets;

    expect(instanceId).toBeTruthy();
    expect(widgets[instanceId!].config).toEqual({ testValue: 'default' });
  });

  it('should return null when adding non-existent widget', () => {
    const instanceId = useWidgetStore.getState().addWidget('non-existent-widget');

    expect(instanceId).toBeNull();
  });

  it('should remove a widget instance', () => {
    const instanceId = useWidgetStore.getState().addWidget('test-widget')!;
    expect(useWidgetStore.getState().widgets[instanceId]).toBeDefined();

    useWidgetStore.getState().removeWidget(instanceId);
    expect(useWidgetStore.getState().widgets[instanceId]).toBeUndefined();
  });

  it('should update widget config', () => {
    const instanceId = useWidgetStore.getState().addWidget('test-widget')!;

    useWidgetStore.getState().updateWidgetConfig(instanceId, { testValue: 'updated', newProp: 'new' });

    expect(useWidgetStore.getState().widgets[instanceId].config).toEqual({
      testValue: 'updated',
      newProp: 'new',
    });
  });

  it('should update widget input', () => {
    const instanceId = useWidgetStore.getState().addWidget('test-widget')!;
    const inputData = { data: 'test input' };

    useWidgetStore.getState().updateWidgetInput(instanceId, inputData);

    expect(useWidgetStore.getState().widgets[instanceId].input).toEqual(inputData);
  });

  it('should update widget output', () => {
    const instanceId = useWidgetStore.getState().addWidget('test-widget')!;
    const outputData = { result: 'test output' };

    useWidgetStore.getState().updateWidgetOutput(instanceId, outputData);

    expect(useWidgetStore.getState().widgets[instanceId].output).toEqual(outputData);
  });

  it('should connect two widgets', () => {
    const widget1Id = useWidgetStore.getState().addWidget('test-widget')!;
    const widget2Id = useWidgetStore.getState().addWidget('test-widget')!;

    const connection = {
      from: { widgetId: widget1Id, outputKey: 'result' },
      to: { widgetId: widget2Id, inputKey: 'data' },
    };

    useWidgetStore.getState().connectWidgets(connection);

    const connections = useWidgetStore.getState().connections;
    expect(connections).toHaveLength(1);
    expect(connections[0]).toEqual(connection);
  });

  it('should not connect non-existent widgets', () => {
    const connection = {
      from: { widgetId: 'non-existent-1', outputKey: 'result' },
      to: { widgetId: 'non-existent-2', inputKey: 'data' },
    };

    useWidgetStore.getState().connectWidgets(connection);

    expect(useWidgetStore.getState().connections).toHaveLength(0);
  });

  it('should disconnect widgets', () => {
    const widget1Id = useWidgetStore.getState().addWidget('test-widget')!;
    const widget2Id = useWidgetStore.getState().addWidget('test-widget')!;

    useWidgetStore.getState().connectWidgets({
      from: { widgetId: widget1Id, outputKey: 'result' },
      to: { widgetId: widget2Id, inputKey: 'data' },
    });

    expect(useWidgetStore.getState().connections).toHaveLength(1);

    useWidgetStore.getState().disconnectWidgets(widget1Id, widget2Id);

    expect(useWidgetStore.getState().connections).toHaveLength(0);
  });

  it('should get connected widgets', () => {
    const widget1Id = useWidgetStore.getState().addWidget('test-widget')!;
    const widget2Id = useWidgetStore.getState().addWidget('test-widget')!;
    const widget3Id = useWidgetStore.getState().addWidget('test-widget')!;

    useWidgetStore.getState().connectWidgets({
      from: { widgetId: widget1Id, outputKey: 'result' },
      to: { widgetId: widget2Id, inputKey: 'data' },
    });

    useWidgetStore.getState().connectWidgets({
      from: { widgetId: widget2Id, outputKey: 'result' },
      to: { widgetId: widget3Id, inputKey: 'data' },
    });

    const connectedToWidget2 = useWidgetStore.getState().getConnectedWidgets(widget2Id);

    expect(connectedToWidget2).toHaveLength(2);
    expect(connectedToWidget2.map((w) => w.id)).toContain(widget1Id);
    expect(connectedToWidget2.map((w) => w.id)).toContain(widget3Id);
  });

  it('should create a flow from widgets', () => {
    const widget1Id = useWidgetStore.getState().addWidget('test-widget')!;
    const widget2Id = useWidgetStore.getState().addWidget('test-widget')!;

    useWidgetStore.getState().connectWidgets({
      from: { widgetId: widget1Id, outputKey: 'result' },
      to: { widgetId: widget2Id, inputKey: 'data' },
    });

    const flowId = useWidgetStore.getState().createFlow('Test Flow', [widget1Id, widget2Id]);
    const flows = useWidgetStore.getState().flows;

    expect(flows[flowId]).toBeDefined();
    expect(flows[flowId].name).toBe('Test Flow');
    expect(flows[flowId].widgets).toHaveLength(2);
    expect(flows[flowId].connections).toHaveLength(1);
  });

  it('should clear all widgets and reset state', () => {
    const widget1Id = useWidgetStore.getState().addWidget('test-widget')!;
    const widget2Id = useWidgetStore.getState().addWidget('test-widget')!;

    useWidgetStore.getState().connectWidgets({
      from: { widgetId: widget1Id, outputKey: 'result' },
      to: { widgetId: widget2Id, inputKey: 'data' },
    });

    expect(Object.keys(useWidgetStore.getState().widgets)).toHaveLength(2);
    expect(useWidgetStore.getState().connections).toHaveLength(1);

    useWidgetStore.getState().clearWidgets();

    expect(Object.keys(useWidgetStore.getState().widgets)).toHaveLength(0);
    expect(useWidgetStore.getState().connections).toHaveLength(0);
  });

  it('should remove connections when removing a widget', () => {
    const widget1Id = useWidgetStore.getState().addWidget('test-widget')!;
    const widget2Id = useWidgetStore.getState().addWidget('test-widget')!;

    useWidgetStore.getState().connectWidgets({
      from: { widgetId: widget1Id, outputKey: 'result' },
      to: { widgetId: widget2Id, inputKey: 'data' },
    });

    expect(useWidgetStore.getState().connections).toHaveLength(1);

    useWidgetStore.getState().removeWidget(widget1Id);

    expect(useWidgetStore.getState().connections).toHaveLength(0);
  });
});
