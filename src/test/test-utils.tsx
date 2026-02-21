import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { vi } from 'vitest';

// Re-export everything from testing-library
export { screen, within, waitFor } from '@testing-library/react';
export { userEvent };

/**
 * Mock Convex client and auth hooks
 * These can be customized per-test using vi.mocked()
 */
export const mockConvexAuth = {
  isLoading: false,
  isAuthenticated: true,
};

export const mockUseQuery = vi.fn();
export const mockUseMutation = vi.fn();

// Mock the convex/react module
vi.mock('convex/react', () => ({
  useQuery: (query: any, ...args: any[]) => mockUseQuery(query, ...args),
  useMutation: (mutation: any) => mockUseMutation(mutation),
  useConvexAuth: () => mockConvexAuth,
  useAction: () => vi.fn(),
}));

// Mock @convex-dev/auth/react
vi.mock('@convex-dev/auth/react', () => ({
  ConvexAuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock the convex client
vi.mock('@/lib/convex', () => ({
  convex: {},
}));

/**
 * Store reset utilities
 * Call these in beforeEach to ensure clean state between tests
 */

// Import stores
import { useCanvasStore } from '@/stores/canvasStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { useThemeStore } from '@/stores/themeStore';

// Mock the temporal middleware on canvasStore
// @ts-expect-error - Adding temporal mock for zundo middleware
useCanvasStore.temporal = vi.fn((selector: any) => {
  return selector({
    undo: vi.fn(),
    redo: vi.fn(),
    pastStates: [],
    futureStates: [],
  });
});
// @ts-expect-error - Adding getState for temporal
useCanvasStore.temporal.getState = () => ({
  undo: vi.fn(),
  redo: vi.fn(),
  pastStates: [],
  futureStates: [],
  clear: vi.fn(),
});

const initialCanvasState = {
  nodes: [],
  edges: [],
  sections: [],
  selectedNodeId: null,
  activeShapeEditId: null,
  pendingFocusSectionId: null,
};

const initialEditorState = {
  viewMode: 'both' as const,
  activeCanvasTool: 'cursor' as const,
  documentEditorMode: 'edit' as const,
};

const initialDocumentState = {
  blocks: [],
  pendingFocusBlockId: null,
};

const initialUIState = {
  isTrayOpen: true,
  activeRailSection: 'components' as const,
  sidebarPosition: {
    x: 12,
    y: 68,
    corner: 'top-left' as const,
    isDragging: false,
  },
};

const initialThemeState = {
  theme: 'dark' as const,
};

export function resetAllStores() {
  // Reset canvas store
  useCanvasStore.setState(initialCanvasState);

  // Reset editor store
  useEditorStore.setState(initialEditorState);

  // Reset document store
  useDocumentStore.setState(initialDocumentState);

  // Reset UI store
  useUIStore.setState(initialUIState);

  // Reset theme store
  useThemeStore.setState(initialThemeState);
}

/**
 * Custom render function that wraps components with all necessary providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Whether to include ReactFlowProvider (needed for canvas components)
  withReactFlow?: boolean;
}

function AllProviders({
  children,
  withReactFlow = false
}: {
  children: ReactNode;
  withReactFlow?: boolean;
}) {
  // For testing, we just wrap the children with ReactFlowProvider if needed
  // The router is set up separately for actual routing tests
  if (withReactFlow) {
    return <ReactFlowProvider>{children}</ReactFlowProvider>;
  }

  return <>{children}</>;
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const {
    withReactFlow = false,
    ...renderOptions
  } = options || {};

  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AllProviders withReactFlow={withReactFlow}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
}

// Override render export
export { customRender as render };

/**
 * Helper to create mock query responses
 */
export function mockQueryResponse<T>(data: T) {
  mockUseQuery.mockReturnValue(data);
}

/**
 * Helper to create mock mutation functions
 */
export function mockMutationResponse(fn: (...args: any[]) => any = async () => {}) {
  mockUseMutation.mockReturnValue(fn);
}

/**
 * Reset all mocks
 * Call this in beforeEach to ensure clean mock state
 */
export function resetMocks() {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset();
  mockConvexAuth.isLoading = false;
  mockConvexAuth.isAuthenticated = true;
}
