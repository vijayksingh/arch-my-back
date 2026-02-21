import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render as rtlRender, screen } from '@testing-library/react';
import { resetAllStores } from '@/test/test-utils';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import type { CanvasNode } from '@/types';

// Mock @xyflow/react entirely
vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => children,
  useReactFlow: () => ({
    flowToScreenPosition: ({ x, y }: { x: number; y: number }) => ({ x, y }),
  }),
  MiniMap: () => null,
}));

// Import after mocks are set up
const { SelectionActionBar } = await import('../SelectionActionBar');

describe('SelectionActionBar', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('does not show group actions when a single node is clicked in cursor mode', () => {
    // Setup: 1 node selected, cursor tool active
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'archComponent',
            position: { x: 0, y: 0 },
            data: { label: 'Node 1', componentType: 'ec2', config: {} },
            selected: true,
          } as CanvasNode,
        ],
      });
      useEditorStore.getState().setActiveCanvasTool('cursor');
    });

    rtlRender(<SelectionActionBar />);

    // Assert: Group action is NOT visible
    expect(screen.queryByText(/group/i)).not.toBeInTheDocument();
  });

  it('does not show group actions when select tool is active but only 1 node selected', () => {
    // Setup: 1 node selected, select tool active
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'archComponent',
            position: { x: 0, y: 0 },
            data: { label: 'Node 1', componentType: 'ec2', config: {} },
            selected: true,
          } as CanvasNode,
        ],
      });
      useEditorStore.getState().setActiveCanvasTool('select');
    });

    rtlRender(<SelectionActionBar />);

    // Assert: Group action is NOT visible
    expect(screen.queryByText(/group/i)).not.toBeInTheDocument();
  });

  it('shows group actions when select tool is active and 2+ nodes are selected', () => {
    // Setup: 2 nodes selected, select tool active
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'archComponent',
            position: { x: 0, y: 0 },
            data: { label: 'Node 1', componentType: 'ec2', config: {} },
            selected: true,
          } as CanvasNode,
          {
            id: 'node-2',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: { label: 'Node 2', componentType: 's3', config: {} },
            selected: true,
          } as CanvasNode,
        ],
      });
      useEditorStore.getState().setActiveCanvasTool('select');
    });

    rtlRender(<SelectionActionBar />);

    // Assert: Group action IS visible
    expect(screen.getByText(/group/i)).toBeInTheDocument();
    expect(screen.getByText(/2 nodes selected/i)).toBeInTheDocument();
  });

  it('hides group actions when switching back to cursor tool', () => {
    // Setup: 2 nodes selected, select tool active
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'archComponent',
            position: { x: 0, y: 0 },
            data: { label: 'Node 1', componentType: 'ec2', config: {} },
            selected: true,
          } as CanvasNode,
          {
            id: 'node-2',
            type: 'archComponent',
            position: { x: 100, y: 100 },
            data: { label: 'Node 2', componentType: 's3', config: {} },
            selected: true,
          } as CanvasNode,
        ],
      });
      useEditorStore.getState().setActiveCanvasTool('select');
    });

    rtlRender(<SelectionActionBar />);

    // Verify it's visible first
    expect(screen.getByText(/group/i)).toBeInTheDocument();

    // Switch to cursor tool
    act(() => {
      useEditorStore.getState().setActiveCanvasTool('cursor');
    });

    // Assert: Group action disappears
    expect(screen.queryByText(/group/i)).not.toBeInTheDocument();
  });
});
