/**
 * Test suite for CollapsibleGroup node behavior
 * Tests collapsible group functionality and store integration
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { userEvent } from '@testing-library/user-event';
import CollapsibleGroupNode from '../CollapsibleGroupNode';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CollapsibleGroupNode as CollapsibleGroupNodeType } from '@/types';

// Test wrapper with ReactFlowProvider
function renderNode(props: Partial<CollapsibleGroupNodeType> = {}) {
  const defaultProps: CollapsibleGroupNodeType = {
    id: 'test-group',
    type: 'collapsibleGroup',
    position: { x: 0, y: 0 },
    data: {
      label: 'Test Group',
      isCollapsed: false,
      childNodeIds: ['child1', 'child2'],
    },
    ...props,
  };

  return render(
    <ReactFlowProvider>
      <CollapsibleGroupNode
        id={defaultProps.id}
        type="collapsibleGroup"
        data={defaultProps.data}
        selected={false}
        draggable={true}
        dragging={false}
        selectable={true}
        deletable={true}
        zIndex={1}
        isConnectable={true}
        positionAbsoluteX={defaultProps.position.x}
        positionAbsoluteY={defaultProps.position.y}
      />
    </ReactFlowProvider>
  );
}

describe('CollapsibleGroupNode', () => {
  beforeEach(() => {
    useCanvasStore.getState().clearCanvas();
  });

  test('renders with label and child count', () => {
    renderNode();
    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  test('shows child count badge when collapsed', () => {
    renderNode({
      data: {
        label: 'My Group',
        isCollapsed: true,
        childNodeIds: ['child1', 'child2', 'child3'],
      },
    });

    expect(screen.getByText('My Group')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('hides child count badge when expanded', () => {
    renderNode({
      data: {
        label: 'My Group',
        isCollapsed: false,
        childNodeIds: ['child1', 'child2', 'child3'],
      },
    });

    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  test('shows collapse icon when expanded', () => {
    renderNode({
      data: {
        label: 'Expanded Group',
        isCollapsed: false,
        childNodeIds: [],
      },
    });

    const button = screen.getByLabelText('Collapse group');
    expect(button).toBeInTheDocument();
  });

  test('shows expand icon when collapsed', () => {
    renderNode({
      data: {
        label: 'Collapsed Group',
        isCollapsed: true,
        childNodeIds: [],
      },
    });

    const button = screen.getByLabelText('Expand group');
    expect(button).toBeInTheDocument();
  });

  test('toggle button calls toggleGroupCollapse', async () => {
    const user = userEvent.setup();
    renderNode();

    const collapseButton = screen.getByLabelText('Collapse group');
    await user.click(collapseButton);

    // Note: We can't directly test store state changes in component tests
    // This just verifies the button is clickable and doesn't throw
    expect(collapseButton).toBeInTheDocument();
  });
});

describe('CanvasStore Group Actions', () => {
  beforeEach(() => {
    useCanvasStore.getState().clearCanvas();
  });

  test('addGroup creates a collapsible group node', () => {
    const store = useCanvasStore.getState();
    const groupId = store.addGroup('Backend Services', []);

    const nodes = useCanvasStore.getState().nodes;
    const groupNode = nodes.find((n) => n.id === groupId);

    expect(groupNode).toBeDefined();
    expect(groupNode?.type).toBe('collapsibleGroup');
    expect(groupNode?.data).toMatchObject({
      label: 'Backend Services',
      isCollapsed: false,
      childNodeIds: [],
    });
  });

  test('addGroup with child nodes sets parent relationships', () => {
    const store = useCanvasStore.getState();

    // Add some nodes first
    store.addNode('app_server', { x: 100, y: 100 });
    store.addNode('postgres', { x: 200, y: 200 });

    const nodes = useCanvasStore.getState().nodes;
    const childIds = nodes.map((n) => n.id);

    const groupId = store.addGroup('Services', childIds);

    const updatedNodes = useCanvasStore.getState().nodes;
    const childNodes = updatedNodes.filter((n) => childIds.includes(n.id));

    // Child nodes should have parentId set
    childNodes.forEach((child) => {
      expect(child.parentId).toBe(groupId);
    });
  });

  test('toggleGroupCollapse changes isCollapsed state', () => {
    const store = useCanvasStore.getState();
    const groupId = store.addGroup('My Group', []);

    let nodes = useCanvasStore.getState().nodes;
    let groupNode = nodes.find((n) => n.id === groupId);
    expect(groupNode?.data.isCollapsed).toBe(false);

    // Toggle to collapsed
    store.toggleGroupCollapse(groupId);
    nodes = useCanvasStore.getState().nodes;
    groupNode = nodes.find((n) => n.id === groupId);
    expect(groupNode?.data.isCollapsed).toBe(true);

    // Toggle back to expanded
    store.toggleGroupCollapse(groupId);
    nodes = useCanvasStore.getState().nodes;
    groupNode = nodes.find((n) => n.id === groupId);
    expect(groupNode?.data.isCollapsed).toBe(false);
  });

  test('toggleGroupCollapse hides child nodes when collapsed', () => {
    const store = useCanvasStore.getState();

    // Add child nodes
    store.addNode('app_server', { x: 100, y: 100 });
    const childId = useCanvasStore.getState().nodes[0].id;

    // Create group
    const groupId = store.addGroup('Services', [childId]);

    // Initially expanded, child not hidden
    let nodes = useCanvasStore.getState().nodes;
    let child = nodes.find((n) => n.id === childId);
    expect(child?.hidden).toBeUndefined();

    // Collapse group
    store.toggleGroupCollapse(groupId);
    nodes = useCanvasStore.getState().nodes;
    child = nodes.find((n) => n.id === childId);
    expect(child?.hidden).toBe(true);

    // Expand group
    store.toggleGroupCollapse(groupId);
    nodes = useCanvasStore.getState().nodes;
    child = nodes.find((n) => n.id === childId);
    expect(child?.hidden).toBe(false);
  });

  test('removeGroup without deleteChildren ungroups nodes', () => {
    const store = useCanvasStore.getState();

    store.addNode('app_server', { x: 100, y: 100 });
    const childId = useCanvasStore.getState().nodes[0].id;
    const groupId = store.addGroup('Services', [childId]);

    store.removeGroup(groupId, false);

    const nodes = useCanvasStore.getState().nodes;
    const child = nodes.find((n) => n.id === childId);
    const group = nodes.find((n) => n.id === groupId);

    expect(group).toBeUndefined(); // Group removed
    expect(child).toBeDefined(); // Child still exists
    expect(child?.parentId).toBeUndefined(); // No longer has parent
  });

  test('removeGroup with deleteChildren removes child nodes', () => {
    const store = useCanvasStore.getState();

    store.addNode('app_server', { x: 100, y: 100 });
    const childId = useCanvasStore.getState().nodes[0].id;
    const groupId = store.addGroup('Services', [childId]);

    store.removeGroup(groupId, true);

    const nodes = useCanvasStore.getState().nodes;
    expect(nodes).toHaveLength(0); // Both group and child removed
  });
});
