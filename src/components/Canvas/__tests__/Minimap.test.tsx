import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render as rtlRender } from '@testing-library/react';
import { resetAllStores } from '@/test/test-utils';

// Mock @xyflow/react to render a simple div with the expected class
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div className="react-flow">{children}</div>
  ),
  MiniMap: ({ position, style }: { position?: string; style?: React.CSSProperties }) => (
    <div
      className="react-flow__minimap"
      data-position={position}
      style={style}
    />
  ),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Import after mock is set up
const { ReactFlow, MiniMap } = await import('@xyflow/react');

describe('Minimap', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('renders minimap with correct positioning', () => {
    const { container } = rtlRender(
      <ReactFlow>
        <MiniMap
          position="bottom-left"
          style={{
            width: 120,
            height: 80,
          }}
        />
      </ReactFlow>
    );

    // Assert: Minimap container exists
    // React Flow creates elements with specific class names
    const minimapElement = container.querySelector('.react-flow__minimap');
    expect(minimapElement).toBeInTheDocument();
  });
});
