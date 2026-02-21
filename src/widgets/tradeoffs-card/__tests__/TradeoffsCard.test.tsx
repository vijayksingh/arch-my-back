import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TradeoffsCard } from '../TradeoffsCard';
import type { TradeoffsCardInput, TradeoffsCardConfig } from '../TradeoffsCard';

describe('TradeoffsCard', () => {
  const defaultInput: TradeoffsCardInput = {
    title: 'Test Decision',
    context: 'Test context',
    pros: ['Pro 1', 'Pro 2'],
    cons: ['Con 1'],
    decision: 'Test decision',
    alternatives: [
      {
        id: 'alt-1',
        name: 'Alternative 1',
        description: 'Test alternative',
        pros: ['Alt Pro 1'],
        cons: ['Alt Con 1'],
      },
    ],
  };

  const defaultConfig: TradeoffsCardConfig = {
    name: 'Test Tradeoffs',
    showAlternatives: true,
    exportAsADR: false,
  };

  it('renders title and context', () => {
    render(
      <TradeoffsCard
        instanceId="test-1"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText('Test Decision')).toBeInTheDocument();
    expect(screen.getByText('Test context')).toBeInTheDocument();
  });

  it('displays pros and cons with counts', () => {
    render(
      <TradeoffsCard
        instanceId="test-2"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/Pros \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Cons \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('Pro 1')).toBeInTheDocument();
    expect(screen.getByText('Con 1')).toBeInTheDocument();
  });

  it('shows balance indicator', () => {
    render(
      <TradeoffsCard
        instanceId="test-3"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/\+1 in favor/i)).toBeInTheDocument();
  });

  it('displays decision when provided', () => {
    render(
      <TradeoffsCard
        instanceId="test-4"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText('Test decision')).toBeInTheDocument();
  });

  it('shows alternatives when enabled', () => {
    render(
      <TradeoffsCard
        instanceId="test-5"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText('Alternative 1')).toBeInTheDocument();
    expect(screen.getByText(/Alternatives Considered \(1\)/i)).toBeInTheDocument();
  });

  it('allows selecting alternatives', () => {
    const onOutput = vi.fn();
    render(
      <TradeoffsCard
        instanceId="test-6"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const selectButton = screen.getByText('Select');
    fireEvent.click(selectButton);

    expect(onOutput).toHaveBeenCalledWith({
      selectedAlternative: 'alt-1',
    });
  });

  it('handles ADR export', () => {
    const onOutput = vi.fn();
    render(
      <TradeoffsCard
        instanceId="test-7"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const exportButton = screen.getByTitle(/Export as Architecture Decision Record/i);
    fireEvent.click(exportButton);

    expect(onOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        exportedADR: expect.stringContaining('# Architecture Decision Record'),
      })
    );
  });

  it('shows empty state when no input provided', () => {
    render(
      <TradeoffsCard
        instanceId="test-8"
        input={undefined}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/No data provided/i)).toBeInTheDocument();
  });
});
