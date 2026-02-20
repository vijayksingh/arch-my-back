import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetMocks, resetAllStores, mockUseQuery, mockUseMutation } from '@/test/test-utils';
import type { Doc } from '../../../../convex/_generated/dataModel';

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Import after mocks are set up
const { DashboardPage } = await import('../DashboardPage');

describe('DashboardPage', () => {
  const mockDesigns: Doc<'newDesigns'>[] = [
    {
      _id: 'design-1' as any,
      _creationTime: Date.now(),
      title: 'Architecture A',
      description: 'First design',
      updatedAt: Date.now(),
      userId: 'user-1' as any,
      folderId: null,
      thumbnailStorageId: null,
    },
    {
      _id: 'design-2' as any,
      _creationTime: Date.now(),
      title: 'Architecture B',
      description: 'Second design',
      updatedAt: Date.now(),
      userId: 'user-1' as any,
      folderId: null,
      thumbnailStorageId: null,
    },
  ];

  const mockFolders: Doc<'folders'>[] = [
    {
      _id: 'folder-1' as any,
      _creationTime: Date.now(),
      title: 'Backend',
      userId: 'user-1' as any,
    },
    {
      _id: 'folder-2' as any,
      _creationTime: Date.now(),
      title: 'Frontend',
      userId: 'user-1' as any,
    },
  ];

  const mockCreateDesign = vi.fn();
  const mockCreateFolder = vi.fn();

  beforeEach(() => {
    resetMocks();
    resetAllStores();
    mockNavigate.mockClear();
    mockCreateDesign.mockClear();
    mockCreateFolder.mockClear();

    // Default: Return empty arrays to prevent loading state
    mockUseQuery.mockReturnValue([]);

    // Setup mutations
    mockUseMutation.mockImplementation(() => {
      const callCount = mockUseMutation.mock.calls.length;
      if (callCount === 1) return mockCreateDesign;
      if (callCount === 2) return mockCreateFolder;
      return vi.fn();
    });
  });

  it('renders header with app branding and action buttons', () => {
    // Mock queries to return empty but defined arrays (not undefined)
    mockUseQuery.mockReturnValue([]);

    render(<DashboardPage />);

    // Assert: Branding is visible
    expect(screen.getByText('System Architect')).toBeInTheDocument();

    // Assert: Action buttons are visible (there may be multiple "New Design" buttons)
    const newDesignButtons = screen.getAllByRole('button', { name: /new design/i });
    expect(newDesignButtons.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /new folder/i })).toBeInTheDocument();
  });

  it('shows empty state when no designs exist', () => {
    // Mock queries to return empty arrays
    let queryCallCount = 0;
    mockUseQuery.mockImplementation(() => {
      queryCallCount++;
      return []; // designs and folders are empty
    });

    render(<DashboardPage />);

    // Assert: Empty state message is visible
    expect(screen.getByText(/create your first architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/start with a blank canvas/i)).toBeInTheDocument();
  });

  it('shows designs grid when designs exist', () => {
    // Mock queries: first call returns designs, second returns empty folders
    let queryCallCount = 0;
    mockUseQuery.mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount === 1) return mockDesigns;
      return []; // folders
    });

    render(<DashboardPage />);

    // Assert: Design titles are visible
    expect(screen.getByText('Architecture A')).toBeInTheDocument();
    expect(screen.getByText('Architecture B')).toBeInTheDocument();
  });

  it('shows folders section when folders exist', () => {
    // Mock queries: first call returns empty designs, second returns folders
    let queryCallCount = 0;
    mockUseQuery.mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount === 1) return []; // designs
      return mockFolders; // folders
    });

    render(<DashboardPage />);

    // Assert: Folders section header is visible
    expect(screen.getByText('Folders')).toBeInTheDocument();

    // Assert: Folder names are visible
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('opens folder creation dialog when New Folder is clicked', async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue([]);

    render(<DashboardPage />);

    // Click New Folder button (in the header)
    const newFolderButton = screen.getByRole('button', { name: /new folder/i });
    await user.click(newFolderButton);

    // Assert: Dialog appears
    expect(screen.getByText('Create Folder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/folder name/i)).toBeInTheDocument();
  });

  it('creates a new design when New Design is clicked', async () => {
    const user = userEvent.setup();
    const newDesignId = 'design-new';
    mockCreateDesign.mockResolvedValue(newDesignId);
    mockUseQuery.mockReturnValue([]);

    render(<DashboardPage />);

    // Click New Design button (get the first one - in the header)
    const newDesignButtons = screen.getAllByRole('button', { name: /new design/i });
    await user.click(newDesignButtons[0]);

    // Assert: Create mutation was called
    expect(mockCreateDesign).toHaveBeenCalled();

    // The mutation is called with a title containing "Untitled Design"
    const callArgs = mockCreateDesign.mock.calls[0][0];
    expect(callArgs.title).toMatch(/untitled design/i);

    // Wait for navigation
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/design/$designId',
        params: { designId: newDesignId },
      });
    });
  });
});
