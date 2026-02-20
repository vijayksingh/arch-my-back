/**
 * Test suite for ConfigPanel progressive disclosure
 * Tests 3-level UI and component schema adaptation
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ConfigPanel } from '../ConfigPanel';
import { useCanvasStore } from '@/stores/canvasStore';

describe('ConfigPanel', () => {
  beforeEach(() => {
    useCanvasStore.getState().clearCanvas();
  });

  test('does not render when no node is selected', () => {
    const { container } = render(<ConfigPanel />);
    const panel = container.querySelector('aside');
    expect(panel).toHaveClass('pointer-events-none');
    expect(panel).toHaveClass('translate-y-[calc(100%+0.75rem)]');
  });

  test('renders when a component node is selected', () => {
    const store = useCanvasStore.getState();
    store.addNode('load_balancer', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    // Label appears twice: once as editable label, once as component type badge
    expect(screen.getAllByText('Load Balancer').length).toBeGreaterThan(0);
  });

  test('Level 1: shows primary fields that exist in configFields', () => {
    const store = useCanvasStore.getState();
    store.addNode('app_server', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    // App server has primaryFields: ['runtime', 'replicas', 'cpu']
    // All of these exist in configFields, so they should all be shown
    // Field labels are rendered as-is from configFields (not uppercase)
    expect(screen.getByText('Runtime')).toBeInTheDocument();
    expect(screen.getByText('Replicas')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
  });

  test('Level 1: shows Advanced button when more fields exist', () => {
    const store = useCanvasStore.getState();
    store.addNode('load_balancer', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  test('Level 1: shows JSON button', () => {
    const store = useCanvasStore.getState();
    store.addNode('api_gateway', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  test('Level 2: Advanced button expands to show all fields', async () => {
    const user = userEvent.setup();
    const store = useCanvasStore.getState();
    // Use app_server which has 4 configFields but only 3 primaryFields
    store.addNode('app_server', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    const advancedButton = screen.getByText('Advanced');
    await user.click(advancedButton);

    // Should now show all fields in full-width layout
    await waitFor(() => {
      expect(screen.getByText('Runtime')).toBeInTheDocument();
      expect(screen.getByText('Replicas')).toBeInTheDocument();
      expect(screen.getByText('CPU')).toBeInTheDocument();
      expect(screen.getByText('Memory')).toBeInTheDocument();
    });
  });

  test('Level 2: shows Quick button to return to Level 1', async () => {
    const user = userEvent.setup();
    const store = useCanvasStore.getState();
    store.addNode('load_balancer', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    const advancedButton = screen.getByText('Advanced');
    await user.click(advancedButton);

    await waitFor(() => {
      expect(screen.getByText('Quick')).toBeInTheDocument();
    });
  });

  test('Level 2: Quick button returns to Level 1', async () => {
    const user = userEvent.setup();
    const store = useCanvasStore.getState();
    store.addNode('load_balancer', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    // Go to Level 2
    const advancedButton = screen.getByText('Advanced');
    await user.click(advancedButton);

    // Wait for Level 2
    await waitFor(() => {
      expect(screen.getByText('Quick')).toBeInTheDocument();
    });

    // Go back to Level 1
    const quickButton = screen.getByText('Quick');
    await user.click(quickButton);

    await waitFor(() => {
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  test('Level 3: JSON button opens JSON editor', async () => {
    const user = userEvent.setup();
    const store = useCanvasStore.getState();
    store.addNode('api_gateway', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    const jsonButton = screen.getByText('JSON');
    await user.click(jsonButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Configuration as JSON')).toBeInTheDocument();
      expect(screen.getByText('Save JSON')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  test('Level 3: Cancel button returns to Level 1', async () => {
    const user = userEvent.setup();
    const store = useCanvasStore.getState();
    store.addNode('app_server', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    // Open JSON editor
    const jsonButton = screen.getByText('JSON');
    await user.click(jsonButton);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Cancel back to Level 1
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      // Back to Level 1 - should show primary fields
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  test('Level 3: Save JSON updates node config', async () => {
    const user = userEvent.setup();
    const store = useCanvasStore.getState();
    store.addNode('api_gateway', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    // Open JSON editor
    const jsonButton = screen.getByText('JSON');
    await user.click(jsonButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Configuration as JSON')).toBeInTheDocument();
    });

    // Edit JSON - use paste instead of type to avoid parsing issues with braces
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.click(textarea);
    await user.paste('{"rate_limit": 5000}');

    // Save
    const saveButton = screen.getByText('Save JSON');
    await user.click(saveButton);

    // Check node config updated
    const nodes = useCanvasStore.getState().nodes;
    const node = nodes.find((n) => n.id === nodeId);
    expect(node?.data.config).toMatchObject({ rate_limit: 5000 });
  });

  test('adapts to different component schemas', () => {
    const store = useCanvasStore.getState();

    // Test with postgres (different schema)
    store.addNode('postgres', { x: 100, y: 100 });
    const postgresId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(postgresId);

    const { rerender } = render(<ConfigPanel />);

    // Postgres has primaryFields: ['replicas', 'mode', 'storage']
    expect(screen.getAllByText('PostgreSQL').length).toBeGreaterThan(0);
    expect(screen.getByText(/REPLICAS/i)).toBeInTheDocument();
    expect(screen.getByText(/MODE/i)).toBeInTheDocument();

    // Switch to different component
    store.addNode('kafka', { x: 200, y: 200 });
    const kafkaId = useCanvasStore.getState().nodes[1].id;
    store.setSelectedNode(kafkaId);

    rerender(<ConfigPanel />);

    // Kafka has different primaryFields
    expect(screen.getAllByText('Kafka').length).toBeGreaterThan(0);
    expect(screen.getByText(/PARTITIONS/i)).toBeInTheDocument();
  });

  test('updates field value when changed', async () => {
    const user = userEvent.setup();
    const store = useCanvasStore.getState();
    store.addNode('load_balancer', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    // Find and change the algorithm dropdown
    const algorithmSelect = screen
      .getAllByRole('combobox')
      .find((el) => (el as HTMLSelectElement).value === 'round-robin');

    expect(algorithmSelect).toBeInTheDocument();

    await user.selectOptions(algorithmSelect!, 'least-connections');

    // Check config updated
    const nodes = useCanvasStore.getState().nodes;
    const node = nodes.find((n) => n.id === nodeId);
    expect(node?.data.config.algorithm).toBe('least-connections');
  });

  test('renders shape node config', () => {
    const store = useCanvasStore.getState();
    const shapeId = store.addShapeNode('rectangle', { x: 100, y: 100 });
    store.setSelectedNode(shapeId);

    render(<ConfigPanel />);

    // Shape nodes show label and type badge
    expect(screen.getAllByText('Rectangle').length).toBeGreaterThan(0);
    // Shape config shows font size control
    expect(screen.getByDisplayValue('12')).toBeInTheDocument(); // Default font size
  });

  test('close button deselects node', async () => {
    const user = userEvent.setup();
    const store = useCanvasStore.getState();
    store.addNode('redis', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    expect(useCanvasStore.getState().selectedNodeId).toBe(nodeId);

    // Find and click close button (X icon) - get all and click the first one
    const closeButtons = screen.getAllByTitle('Close panel');
    await user.click(closeButtons[0]);

    expect(useCanvasStore.getState().selectedNodeId).toBeNull();
  });

  test('delete button removes node', async () => {
    const user = userEvent.setup();
    const store = useCanvasStore.getState();
    store.addNode('redis', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    store.setSelectedNode(nodeId);

    render(<ConfigPanel />);

    expect(useCanvasStore.getState().nodes).toHaveLength(1);

    // Find and click delete button (trash icon)
    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    expect(useCanvasStore.getState().nodes).toHaveLength(0);
    expect(useCanvasStore.getState().selectedNodeId).toBeNull();
  });
});
