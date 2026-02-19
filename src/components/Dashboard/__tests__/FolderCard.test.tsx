import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetMocks, mockUseMutation } from '@/test/test-utils';
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
const { FolderCard } = await import('../FolderCard');

describe('FolderCard', () => {
  const mockFolder: Doc<'folders'> = {
    _id: 'folder-123' as any,
    _creationTime: Date.now(),
    title: 'Backend Systems',
    userId: 'user-1' as any,
  };

  const mockRenameFolder = vi.fn();
  const mockDeleteFolder = vi.fn();

  beforeEach(() => {
    resetMocks();
    mockNavigate.mockClear();
    mockRenameFolder.mockClear();
    mockDeleteFolder.mockClear();

    // Setup mutation mocks
    mockUseMutation.mockImplementation(() => {
      const callCount = mockUseMutation.mock.calls.length;
      if (callCount === 1) return mockRenameFolder;
      if (callCount === 2) return mockDeleteFolder;
      return vi.fn();
    });
  });

  it('displays folder name and design count', () => {
    render(<FolderCard folder={mockFolder} designCount={5} />);

    // Assert: Folder name is visible
    expect(screen.getByText('Backend Systems')).toBeInTheDocument();

    // Assert: Design count is visible
    expect(screen.getByText(/5 designs/i)).toBeInTheDocument();
  });

  it('shows singular design count for 1 design', () => {
    render(<FolderCard folder={mockFolder} designCount={1} />);

    // Assert: Singular "design" not "designs"
    expect(screen.getByText(/1 design$/i)).toBeInTheDocument();
  });

  it('navigates to folder when card is clicked', async () => {
    const user = userEvent.setup();
    render(<FolderCard folder={mockFolder} designCount={3} />);

    // Click the folder card
    const folderName = screen.getByText('Backend Systems');
    await user.click(folderName);

    // Assert: Navigate was called
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/folder/$folderId',
      params: { folderId: 'folder-123' },
    });
  });


  it('shows delete confirmation when delete is clicked', async () => {
    const user = userEvent.setup();
    render(<FolderCard folder={mockFolder} designCount={0} />);

    // Open menu
    const menuButton = screen.getByRole('button', { hidden: true });
    await user.click(menuButton);

    // Click Delete
    const deleteOption = screen.getByText(/delete/i);
    await user.click(deleteOption);

    // Assert: Confirmation dialog appears
    expect(screen.getByText('Delete Folder')).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete "Backend Systems"/i)).toBeInTheDocument();
    expect(screen.getByText(/designs in this folder will be moved to the root level/i)).toBeInTheDocument();
  });

  it('shows rename and delete options in action menu', async () => {
    const user = userEvent.setup();
    render(<FolderCard folder={mockFolder} designCount={3} />);

    // Open menu
    const menuButton = screen.getByRole('button', { hidden: true });
    await user.click(menuButton);

    // Assert: Rename and Delete options are available
    expect(screen.getByText(/rename/i)).toBeInTheDocument();
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  });
});
