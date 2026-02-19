import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetMocks, mockUseQuery, mockUseMutation } from '@/test/test-utils';
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
const { DesignCard } = await import('../DesignCard');

describe('DesignCard', () => {
  const mockDesign: Doc<'newDesigns'> = {
    _id: 'design-123' as any,
    _creationTime: Date.now(),
    title: 'My Architecture',
    description: 'A cool system design',
    updatedAt: new Date('2024-01-15').getTime(),
    userId: 'user-1' as any,
    folderId: null,
    thumbnailStorageId: null,
  };

  const mockFolders = [
    { _id: 'folder-1', title: 'Backend Systems', _creationTime: Date.now(), userId: 'user-1' },
    { _id: 'folder-2', title: 'Frontend Apps', _creationTime: Date.now(), userId: 'user-1' },
  ];

  const mockMoveToFolder = vi.fn();
  const mockDuplicateDesign = vi.fn();
  const mockDeleteDesign = vi.fn();

  beforeEach(() => {
    resetMocks();
    mockNavigate.mockClear();
    mockMoveToFolder.mockClear();
    mockDuplicateDesign.mockClear();
    mockDeleteDesign.mockClear();

    // Setup default mocks
    mockUseQuery.mockReturnValue(mockFolders);
    mockUseMutation.mockImplementation((mutation: any) => {
      // Discriminate by mutation function name/structure if needed
      // For simplicity, return different mocks based on call order
      const callCount = mockUseMutation.mock.calls.length;
      if (callCount === 1) return mockMoveToFolder;
      if (callCount === 2) return mockDuplicateDesign;
      if (callCount === 3) return mockDeleteDesign;
      return vi.fn();
    });
  });

  it('renders design title and updated date', () => {
    render(<DesignCard design={mockDesign} />);

    // Assert: Title is visible
    expect(screen.getByText('My Architecture')).toBeInTheDocument();

    // Assert: Updated date is visible
    expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
  });

  it('shows preview area with gradient placeholder', () => {
    const { container } = render(<DesignCard design={mockDesign} />);

    // Assert: Title is visible
    expect(screen.getByText('My Architecture')).toBeInTheDocument();

    // Assert: Preview area with gradient exists
    // Check for the gradient background classes in the DOM
    const previewArea = container.querySelector('[class*="aspect-"]');
    expect(previewArea).toBeInTheDocument();
    expect(previewArea?.className).toMatch(/bg-gradient/);
  });

  it('shows action menu on interaction', async () => {
    const user = userEvent.setup();
    render(<DesignCard design={mockDesign} />);

    // Find and click the three-dot menu button
    // The button has a MoreVertical icon, look for it by role
    const menuButton = screen.getByRole('button', { hidden: true });
    await user.click(menuButton);

    // Assert: Menu items appear
    expect(screen.getByText(/move to folder/i)).toBeInTheDocument();
    expect(screen.getByText(/duplicate/i)).toBeInTheDocument();
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  });

  it('navigates to design when card is clicked', async () => {
    const user = userEvent.setup();
    render(<DesignCard design={mockDesign} />);

    // Click the card (not the menu button)
    const title = screen.getByText('My Architecture');
    await user.click(title);

    // Assert: Navigate was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/design/$designId',
      params: { designId: 'design-123' },
    });
  });

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<DesignCard design={mockDesign} />);

    // Open menu
    const menuButton = screen.getByRole('button', { hidden: true });
    await user.click(menuButton);

    // Click Delete
    const deleteItem = screen.getByText(/delete/i);
    await user.click(deleteItem);

    // Assert: Confirmation dialog appears
    expect(screen.getByText('Delete Design')).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete "My Architecture"/i)).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('calls duplicate mutation when duplicate is clicked', async () => {
    const user = userEvent.setup();
    const newDesignId = 'design-456';
    mockDuplicateDesign.mockResolvedValue(newDesignId);

    render(<DesignCard design={mockDesign} />);

    // Open menu
    const menuButton = screen.getByRole('button', { hidden: true });
    await user.click(menuButton);

    // Click Duplicate
    const duplicateItem = screen.getByText(/duplicate/i);
    await user.click(duplicateItem);

    // Assert: Duplicate mutation was called
    expect(mockDuplicateDesign).toHaveBeenCalledWith({ designId: 'design-123' });

    // Wait for navigation
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/design/$designId',
        params: { designId: newDesignId },
      });
    });
  });
});
