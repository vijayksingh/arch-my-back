import { describe, it, expect, beforeEach } from 'vitest';
import { render as rtlRender, screen, act } from '@testing-library/react';
import { resetAllStores, resetMocks } from './test-utils';
import { useCanvasStore } from '@/stores/canvasStore';

describe('Test Infrastructure Smoke Tests', () => {
  beforeEach(() => {
    resetAllStores();
    resetMocks();
  });

  it('should render a simple component', () => {
    rtlRender(<div data-testid="test-div">Hello, Testing Library!</div>);

    const element = screen.getByTestId('test-div');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello, Testing Library!');
  });

  it('should work with jest-dom matchers', () => {
    rtlRender(
      <div>
        <button disabled>Disabled Button</button>
        <input type="text" placeholder="Enter text" />
      </div>
    );

    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toBeDisabled();

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('should render a component that uses Zustand store', () => {
    function TestComponent() {
      const nodes = useCanvasStore((state) => state.nodes);
      const addShapeNode = useCanvasStore((state) => state.addShapeNode);

      return (
        <div>
          <p data-testid="node-count">Nodes: {nodes.length}</p>
          <button onClick={() => addShapeNode('rectangle', { x: 0, y: 0 })}>
            Add Rectangle
          </button>
        </div>
      );
    }

    rtlRender(<TestComponent />);

    const nodeCount = screen.getByTestId('node-count');
    expect(nodeCount).toHaveTextContent('Nodes: 0');

    // Update the store and verify component re-renders
    act(() => {
      useCanvasStore.getState().addShapeNode('rectangle', { x: 0, y: 0 });
    });

    expect(nodeCount).toHaveTextContent('Nodes: 1');
  });

  it('should reset stores between tests', () => {
    // This test verifies that stores are properly reset between tests
    const nodes = useCanvasStore.getState().nodes;
    expect(nodes).toHaveLength(0);
  });
});
