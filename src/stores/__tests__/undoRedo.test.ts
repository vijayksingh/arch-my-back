import { describe, test, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../canvasStore';
import type { CanvasNode } from '@/types';
import type { Connection } from '@xyflow/react';

describe('canvasStore undo/redo', () => {
  beforeEach(() => {
    // Reset store to initial state
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      sections: [],
      selectedNodeId: null,
      activeShapeEditId: null,
      pendingFocusSectionId: null,
    });

    // Clear temporal history
    useCanvasStore.temporal.getState().clear();
  });

  test('undo removes a newly added node', () => {
    const store = useCanvasStore.getState();

    // Add a node
    const success = store.addNode('app_server', { x: 100, y: 100 });
    expect(success).toBe(true);

    const stateAfterAdd = useCanvasStore.getState();
    expect(stateAfterAdd.nodes).toHaveLength(1);

    // Undo the add
    useCanvasStore.temporal.getState().undo();

    const stateAfterUndo = useCanvasStore.getState();
    expect(stateAfterUndo.nodes).toHaveLength(0);
  });

  test('redo restores a removed node', () => {
    const store = useCanvasStore.getState();

    // Add a node
    store.addNode('postgres', { x: 200, y: 200 });
    const stateAfterAdd = useCanvasStore.getState();
    const nodeId = stateAfterAdd.nodes[0].id;

    // Undo
    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().nodes).toHaveLength(0);

    // Redo
    useCanvasStore.temporal.getState().redo();
    const stateAfterRedo = useCanvasStore.getState();
    expect(stateAfterRedo.nodes).toHaveLength(1);
    expect(stateAfterRedo.nodes[0].id).toBe(nodeId);
  });

  test('multiple undo operations work in sequence', () => {
    const store = useCanvasStore.getState();

    // Add 3 nodes
    store.addNode('app_server', { x: 0, y: 0 });
    store.addNode('postgres', { x: 100, y: 100 });
    store.addNode('redis', { x: 200, y: 200 });

    expect(useCanvasStore.getState().nodes).toHaveLength(3);

    // Undo twice
    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().nodes).toHaveLength(2);

    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().nodes).toHaveLength(1);

    // Undo once more
    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().nodes).toHaveLength(0);
  });

  test('multiple redo operations work in sequence', () => {
    const store = useCanvasStore.getState();

    // Add 3 nodes
    store.addNode('app_server', { x: 0, y: 0 });
    store.addNode('postgres', { x: 100, y: 100 });
    store.addNode('redis', { x: 200, y: 200 });

    // Undo all
    useCanvasStore.temporal.getState().undo();
    useCanvasStore.temporal.getState().undo();
    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().nodes).toHaveLength(0);

    // Redo all
    useCanvasStore.temporal.getState().redo();
    expect(useCanvasStore.getState().nodes).toHaveLength(1);

    useCanvasStore.temporal.getState().redo();
    expect(useCanvasStore.getState().nodes).toHaveLength(2);

    useCanvasStore.temporal.getState().redo();
    expect(useCanvasStore.getState().nodes).toHaveLength(3);
  });

  test('selection changes do not create history entries', () => {
    const store = useCanvasStore.getState();

    // Add a node
    store.addNode('app_server', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;

    // Change selection multiple times (should not create history)
    store.setSelectedNode(nodeId);
    store.setSelectedNode(null);
    store.setSelectedNode(nodeId);

    // Undo should remove the node, not change selection
    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().nodes).toHaveLength(0);

    // No more undo should be available (no selection history)
    const stateBefore = useCanvasStore.getState();
    useCanvasStore.temporal.getState().undo();
    const stateAfter = useCanvasStore.getState();
    expect(stateBefore).toEqual(stateAfter);
  });

  test('removing a node creates an undo point', () => {
    const store = useCanvasStore.getState();

    // Add a node
    store.addNode('app_server', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    expect(useCanvasStore.getState().nodes).toHaveLength(1);

    // Remove the node
    store.removeNode(nodeId);
    expect(useCanvasStore.getState().nodes).toHaveLength(0);

    // Undo the removal
    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().nodes).toHaveLength(1);
    expect(useCanvasStore.getState().nodes[0].id).toBe(nodeId);
  });

  test('clearCanvas clears history', () => {
    const store = useCanvasStore.getState();

    // Add some nodes
    store.addNode('app_server', { x: 0, y: 0 });
    store.addNode('postgres', { x: 100, y: 100 });

    // Clear canvas
    store.clearCanvas();

    expect(useCanvasStore.getState().nodes).toHaveLength(0);

    // Try to undo - should have no effect since history was cleared
    const stateBefore = useCanvasStore.getState();
    useCanvasStore.temporal.getState().undo();
    const stateAfter = useCanvasStore.getState();

    expect(stateAfter.nodes).toEqual(stateBefore.nodes);
  });

  test('loadDesign clears history', () => {
    const store = useCanvasStore.getState();

    // Add some nodes
    store.addNode('app_server', { x: 0, y: 0 });
    store.addNode('postgres', { x: 100, y: 100 });

    // Load a design
    const newNodes: CanvasNode[] = [
      {
        id: 'new-node',
        type: 'archComponent',
        position: { x: 50, y: 50 },
        data: {
          componentType: 'redis',
          label: 'Cache',
          config: {},
        },
      },
    ];

    store.loadDesign(newNodes, []);

    expect(useCanvasStore.getState().nodes).toHaveLength(1);
    expect(useCanvasStore.getState().nodes[0].id).toBe('new-node');

    // Try to undo - should have no effect since history was cleared
    const stateBefore = useCanvasStore.getState();
    useCanvasStore.temporal.getState().undo();
    const stateAfter = useCanvasStore.getState();

    expect(stateAfter.nodes).toEqual(stateBefore.nodes);
  });

  test('edge changes create history entries', () => {
    const store = useCanvasStore.getState();

    // Add two nodes
    store.addNode('app_server', { x: 0, y: 0 });
    store.addNode('postgres', { x: 200, y: 0 });

    const nodes = useCanvasStore.getState().nodes;
    const sourceId = nodes[0].id;
    const targetId = nodes[1].id;

    // Connect them
    const connection: Connection = {
      source: sourceId,
      target: targetId,
      sourceHandle: null,
      targetHandle: null,
    };
    store.onConnect(connection);

    expect(useCanvasStore.getState().edges).toHaveLength(1);

    // Undo the connection
    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().edges).toHaveLength(0);

    // Redo the connection
    useCanvasStore.temporal.getState().redo();
    expect(useCanvasStore.getState().edges).toHaveLength(1);
  });

  test('section changes create history entries', () => {
    const store = useCanvasStore.getState();

    // Add a node
    store.addNode('app_server', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;

    // Create a section
    const section = store.createSectionFromNodeSelection(
      'Test Section',
      [nodeId],
      { x: 50, y: 50, width: 200, height: 200 }
    );

    expect(section).toBeDefined();
    expect(useCanvasStore.getState().sections).toHaveLength(1);

    // Undo section creation
    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().sections).toHaveLength(0);

    // Redo section creation
    useCanvasStore.temporal.getState().redo();
    expect(useCanvasStore.getState().sections).toHaveLength(1);
  });

  test('updating node label creates history entry', () => {
    const store = useCanvasStore.getState();

    // Add a node
    store.addNode('app_server', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;
    const originalLabel = useCanvasStore.getState().nodes[0].data.label;

    // Update label
    store.updateNodeLabel(nodeId, 'New Label');
    expect(useCanvasStore.getState().nodes[0].data.label).toBe('New Label');

    // Undo
    useCanvasStore.temporal.getState().undo();
    expect(useCanvasStore.getState().nodes[0].data.label).toBe(originalLabel);

    // Redo
    useCanvasStore.temporal.getState().redo();
    expect(useCanvasStore.getState().nodes[0].data.label).toBe('New Label');
  });
});
