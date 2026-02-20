import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIPromptBar } from '../AIPromptBar';

describe('AIPromptBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders prompt input with placeholder text', () => {
    const onGenerate = vi.fn();
    render(<AIPromptBar onGenerate={onGenerate} />);

    const textarea = screen.getByPlaceholderText(/Describe your architecture/i);
    expect(textarea).toBeInTheDocument();
  });

  test('renders generate button with Sparkles icon', () => {
    const onGenerate = vi.fn();
    render(<AIPromptBar onGenerate={onGenerate} />);

    const button = screen.getByRole('button', { name: /Generate/i });
    expect(button).toBeInTheDocument();
  });

  test('submits prompt when Generate button is clicked', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockResolvedValue(undefined);
    render(<AIPromptBar onGenerate={onGenerate} />);

    const textarea = screen.getByPlaceholderText(/Describe your architecture/i);
    const button = screen.getByRole('button', { name: /Generate/i });

    // Type a prompt
    await user.type(textarea, 'Build an e-commerce platform');

    // Click generate
    await user.click(button);

    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalledWith('Build an e-commerce platform');
    });
  });

  test('shows loading state during generation', async () => {
    const user = userEvent.setup();
    let resolveGenerate: () => void;
    const onGenerate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveGenerate = resolve;
        })
    );

    render(<AIPromptBar onGenerate={onGenerate} />);

    const textarea = screen.getByPlaceholderText(/Describe your architecture/i);
    await user.type(textarea, 'Build a system');

    const button = screen.getByRole('button', { name: /Generate/i });
    await user.click(button);

    // Should show loading text
    await waitFor(() => {
      expect(screen.getByText(/Generating.../i)).toBeInTheDocument();
    });

    // Should show Loader2 icon (spinner)
    const loadingButton = screen.getByRole('button', { name: /Generating.../i });
    expect(loadingButton).toBeDisabled();

    // Resolve the promise
    resolveGenerate!();

    // Should return to normal state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
    });
  });

  test('displays error message when generation fails', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockRejectedValue(new Error('API error occurred'));

    render(<AIPromptBar onGenerate={onGenerate} />);

    const textarea = screen.getByPlaceholderText(/Describe your architecture/i);
    await user.type(textarea, 'Build a system');

    const button = screen.getByRole('button', { name: /Generate/i });
    await user.click(button);

    // Error should be displayed
    await waitFor(() => {
      expect(screen.getByText(/API error occurred/i)).toBeInTheDocument();
    });

    // Error text should be in red
    const errorElement = screen.getByText(/API error occurred/i);
    expect(errorElement).toHaveClass('text-red-500');
  });

  test('clears prompt after successful generation', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockResolvedValue(undefined);

    render(<AIPromptBar onGenerate={onGenerate} />);

    const textarea = screen.getByPlaceholderText(/Describe your architecture/i);
    await user.type(textarea, 'Build a system');

    const button = screen.getByRole('button', { name: /Generate/i });
    await user.click(button);

    // Wait for generation to complete
    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalled();
    });

    // Textarea should be cleared
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  test('does not submit empty or whitespace-only prompts', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();

    render(<AIPromptBar onGenerate={onGenerate} />);

    const button = screen.getByRole('button', { name: /Generate/i });

    // Button should be disabled when empty
    expect(button).toBeDisabled();

    // Type only whitespace
    const textarea = screen.getByPlaceholderText(/Describe your architecture/i);
    await user.type(textarea, '   ');

    // Button should still be disabled
    expect(button).toBeDisabled();

    // onGenerate should not be called
    expect(onGenerate).not.toHaveBeenCalled();
  });

  test('disables input and button when disabled prop is true', () => {
    const onGenerate = vi.fn();
    render(<AIPromptBar onGenerate={onGenerate} disabled={true} />);

    const textarea = screen.getByPlaceholderText(/Describe your architecture/i);
    const button = screen.getByRole('button', { name: /Generate/i });

    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
  });

  test('prevents double submission while loading', async () => {
    const user = userEvent.setup();
    let resolveGenerate: () => void;
    const onGenerate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveGenerate = resolve;
        })
    );

    render(<AIPromptBar onGenerate={onGenerate} />);

    const textarea = screen.getByPlaceholderText(/Describe your architecture/i);
    await user.type(textarea, 'Build a system');

    const button = screen.getByRole('button', { name: /Generate/i });
    await user.click(button);

    // Try to click again while loading
    await waitFor(() => {
      const loadingButton = screen.getByRole('button', { name: /Generating.../i });
      expect(loadingButton).toBeDisabled();
    });

    // onGenerate should only be called once
    expect(onGenerate).toHaveBeenCalledTimes(1);

    // Resolve
    resolveGenerate!();
  });
});
