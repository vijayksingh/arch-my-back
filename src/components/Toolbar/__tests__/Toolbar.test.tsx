import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import { resetAllStores, resetMocks, mockUseQuery } from '@/test/test-utils';
import { Toolbar } from '../Toolbar';

// Mock useAuthActions
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    useAuthActions: () => ({
      signOut: vi.fn(),
    }),
  };
});

describe('Toolbar', () => {
  beforeEach(() => {
    resetAllStores();
    resetMocks();
  });

  it('displays user email when available', () => {
    // Mock useQuery to return a user with email
    mockUseQuery.mockReturnValue({
      email: 'test@example.com',
    });

    rtlRender(<Toolbar />);

    // Assert: Email is visible
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    // Assert: Avatar initial "T" is visible
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('displays avatar initial from user email', () => {
    // Mock useQuery to return a user with email
    mockUseQuery.mockReturnValue({
      email: 'alice@example.com',
    });

    rtlRender(<Toolbar />);

    // Assert: Avatar shows first letter of email (uppercase)
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows fallback when user has no email', () => {
    // Mock useQuery to return user with empty/null email (but user object exists)
    mockUseQuery.mockReturnValue({
      email: '',
    });

    rtlRender(<Toolbar />);

    // Assert: "Account" text is visible as fallback
    expect(screen.getByText('Account')).toBeInTheDocument();

    // Assert: "Unknown" is NOT in the document
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
  });

  it('never displays "Unknown" text', () => {
    // Test various edge cases where user exists but email is falsy
    const testCases = [
      { email: '' },
      { email: null },
      { email: undefined },
    ];

    testCases.forEach((userData) => {
      resetAllStores();
      resetMocks();

      mockUseQuery.mockReturnValue(userData);

      const { unmount } = rtlRender(<Toolbar />);

      // Assert: "Unknown" is never shown
      expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();

      unmount();
    });
  });

  it('shows sign out button when user is authenticated', () => {
    mockUseQuery.mockReturnValue({
      email: 'test@example.com',
    });

    rtlRender(<Toolbar />);

    // Assert: Sign out button is present
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});
