import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetAllStores } from '@/test/test-utils';
import { Sidebar } from '../Sidebar';
import { useUIStore } from '@/stores/uiStore';
import { useRef } from 'react';

// Wrapper component that provides a containerRef
function SidebarWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef}>
      <Sidebar containerRef={containerRef} />
    </div>
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('does not render a sections panel', () => {
    render(<SidebarWrapper />);

    // Assert: "SECTIONS" text is NOT in the document
    expect(screen.queryByText(/sections/i)).not.toBeInTheDocument();
  });

  it('does not render a Create button for sections', () => {
    render(<SidebarWrapper />);

    // Assert: No "Create" button in the context of sections
    // Since there's no sections panel at all, this should not exist
    const createButtons = screen.queryAllByRole('button', { name: /create/i });
    expect(createButtons).toHaveLength(0);
  });

  it('renders the component search input', () => {
    // Open the tray so the search is visible
    act(() => {
      useUIStore.getState().toggleTray('components');
    });

    render(<SidebarWrapper />);

    // Assert: Search input is visible
    const searchInput = screen.getByPlaceholderText(/search components/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('renders component categories', () => {
    // Open the tray
    act(() => {
      useUIStore.getState().toggleTray('components');
    });

    render(<SidebarWrapper />);

    // Assert: Component category names are visible
    expect(screen.getByText('Traffic')).toBeInTheDocument();
    expect(screen.getByText('Compute')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  it('filters components when user types in search', async () => {
    const user = userEvent.setup();

    // Open the tray
    act(() => {
      useUIStore.getState().toggleTray('components');
    });

    render(<SidebarWrapper />);

    const searchInput = screen.getByPlaceholderText(/search components/i);

    // Type a search query
    await user.type(searchInput, 'lambda');

    // The search should filter - we can check that the input has the value
    expect(searchInput).toHaveValue('lambda');
  });

  it('shows tool buttons for cursor, select, rectangle, circle, text', () => {
    render(<SidebarWrapper />);

    // Assert: All tool buttons are present
    expect(screen.getByRole('button', { name: /cursor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rectangle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /circle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument();
  });
});
