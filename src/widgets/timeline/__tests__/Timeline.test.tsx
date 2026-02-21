import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Timeline } from '../Timeline';
import type { TimelineInput, TimelineConfig } from '../Timeline';

describe('Timeline', () => {
  const defaultInput: TimelineInput = {
    events: [
      {
        id: 'event1',
        timestamp: 0,
        title: 'Event 1',
        description: 'First event',
        type: 'start',
      },
      {
        id: 'event2',
        timestamp: 100,
        title: 'Event 2',
        description: 'Second event',
        type: 'event',
      },
      {
        id: 'event3',
        timestamp: 200,
        title: 'Event 3',
        description: 'Third event',
        type: 'end',
      },
    ],
  };

  const defaultConfig: TimelineConfig = {
    name: 'Test Timeline',
    showSwimlanes: true,
    animate: false,
  };

  it('renders timeline with events', () => {
    render(
      <Timeline
        instanceId="test-1"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText('Test Timeline')).toBeInTheDocument();
    expect(screen.getByText(/3 events/i)).toBeInTheDocument();
  });

  it('shows empty state when no events provided', () => {
    render(
      <Timeline
        instanceId="test-2"
        input={{ events: [] }}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/No events provided/i)).toBeInTheDocument();
  });

  it('shows empty state when no input provided', () => {
    render(
      <Timeline
        instanceId="test-3"
        input={undefined}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/No events provided/i)).toBeInTheDocument();
  });

  it('handles zoom in', () => {
    const onOutput = vi.fn();
    render(
      <Timeline
        instanceId="test-4"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const zoomInButton = screen.getByTitle('Zoom In');
    fireEvent.click(zoomInButton);

    expect(onOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        zoomLevel: 1.5,
      })
    );
  });

  it('handles zoom out', () => {
    const onOutput = vi.fn();
    render(
      <Timeline
        instanceId="test-5"
        input={defaultInput}
        config={defaultConfig}
        onOutput={onOutput}
      />
    );

    const zoomOutButton = screen.getByTitle('Zoom Out');
    fireEvent.click(zoomOutButton);

    expect(onOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        zoomLevel: expect.any(Number),
      })
    );
  });

  it('shows animation controls when animate is enabled', () => {
    render(
      <Timeline
        instanceId="test-6"
        input={defaultInput}
        config={{ ...defaultConfig, animate: true }}
      />
    );

    expect(screen.getByTitle('Play Animation')).toBeInTheDocument();
  });

  it('does not show animation controls when animate is disabled', () => {
    render(
      <Timeline
        instanceId="test-7"
        input={defaultInput}
        config={{ ...defaultConfig, animate: false }}
      />
    );

    expect(screen.queryByTitle('Play Animation')).not.toBeInTheDocument();
  });

  it('renders swimlanes when provided', () => {
    const inputWithSwimlanes: TimelineInput = {
      events: [
        {
          id: 'event1',
          timestamp: 0,
          title: 'Event 1',
          swimlaneId: 'lane1',
        },
        {
          id: 'event2',
          timestamp: 100,
          title: 'Event 2',
          swimlaneId: 'lane2',
        },
      ],
      swimlanes: [
        { id: 'lane1', label: 'Lane 1' },
        { id: 'lane2', label: 'Lane 2' },
      ],
    };

    render(
      <Timeline
        instanceId="test-8"
        input={inputWithSwimlanes}
        config={defaultConfig}
      />
    );

    expect(screen.getByText('Lane 1')).toBeInTheDocument();
    expect(screen.getByText('Lane 2')).toBeInTheDocument();
  });

  it('handles string timestamps', () => {
    const inputWithStringTimestamps: TimelineInput = {
      events: [
        {
          id: 'event1',
          timestamp: '2024-01-01T00:00:00Z',
          title: 'Event 1',
        },
        {
          id: 'event2',
          timestamp: '2024-01-01T00:01:00Z',
          title: 'Event 2',
        },
      ],
    };

    render(
      <Timeline
        instanceId="test-9"
        input={inputWithStringTimestamps}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/2 events/i)).toBeInTheDocument();
  });

  it('displays zoom level', () => {
    render(
      <Timeline
        instanceId="test-10"
        input={defaultInput}
        config={defaultConfig}
      />
    );

    expect(screen.getByText(/Zoom: 1.0x/i)).toBeInTheDocument();
  });
});
