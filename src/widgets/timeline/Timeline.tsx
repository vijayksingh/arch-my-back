import { useState, useRef, useEffect } from 'react';
import type { WidgetProps } from '../types';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Play, Pause } from 'lucide-react';

/**
 * Timeline Input Schema
 */
export interface TimelineInput {
  events: Array<{
    id: string;
    timestamp: number | string;
    title: string;
    description?: string;
    type?: 'start' | 'end' | 'event' | 'error' | 'decision';
    metadata?: Record<string, unknown>;
    swimlaneId?: string;
  }>;
  swimlanes?: Array<{
    id: string;
    label: string;
  }>;
}

/**
 * Timeline Output Schema
 */
export interface TimelineOutput {
  selectedEvent?: string;
  zoomLevel?: number;
  visibleRange?: {
    start: number;
    end: number;
  };
}

/**
 * Timeline Config Schema
 */
export interface TimelineConfig {
  name?: string;
  showSwimlanes?: boolean;
  animate?: boolean;
}

const EVENT_TYPE_COLORS = {
  start: 'bg-green-500',
  end: 'bg-red-500',
  event: 'bg-blue-500',
  error: 'bg-red-600',
  decision: 'bg-yellow-500',
};

const EVENT_TYPE_LABELS = {
  start: 'Start',
  end: 'End',
  event: 'Event',
  error: 'Error',
  decision: 'Decision',
};

/**
 * Timeline Widget Component
 */
export function Timeline({
  instanceId,
  input,
  config,
  onOutput,
}: WidgetProps<TimelineInput, TimelineOutput, TimelineConfig>) {
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!input || !input.events || input.events.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-border bg-muted/30 p-4">
        <div className="text-center text-sm text-muted-foreground">
          No events provided. Please provide at least one event.
        </div>
      </div>
    );
  }

  // Convert timestamps to numbers
  const normalizedEvents = input.events.map((event) => ({
    ...event,
    timestamp: typeof event.timestamp === 'string'
      ? new Date(event.timestamp).getTime()
      : event.timestamp,
  }));

  // Sort events by timestamp
  const sortedEvents = [...normalizedEvents].sort((a, b) => a.timestamp - b.timestamp);

  // Calculate time range
  const minTime = sortedEvents[0].timestamp;
  const maxTime = sortedEvents[sortedEvents.length - 1].timestamp;
  const timeRange = maxTime - minTime || 1000; // Avoid division by zero

  // Get unique swimlanes
  const swimlanes = input.swimlanes || [{ id: 'default', label: 'Events' }];

  const handleEventClick = (eventId: string) => {
    const newSelectedEvent = selectedEvent === eventId ? undefined : eventId;
    setSelectedEvent(newSelectedEvent);
    onOutput?.({
      selectedEvent: newSelectedEvent,
      zoomLevel,
      visibleRange: {
        start: minTime,
        end: maxTime,
      },
    });
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.5, 5);
    setZoomLevel(newZoom);
    onOutput?.({
      selectedEvent,
      zoomLevel: newZoom,
      visibleRange: {
        start: minTime,
        end: maxTime,
      },
    });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.5, 0.5);
    setZoomLevel(newZoom);
    onOutput?.({
      selectedEvent,
      zoomLevel: newZoom,
      visibleRange: {
        start: minTime,
        end: maxTime,
      },
    });
  };

  const toggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      setCurrentAnimationIndex(0);
      setIsAnimating(true);
    }
  };

  // Animation effect
  useEffect(() => {
    if (!isAnimating || !config.animate) return;

    if (currentAnimationIndex >= sortedEvents.length) {
      setIsAnimating(false);
      setCurrentAnimationIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      setSelectedEvent(sortedEvents[currentAnimationIndex].id);
      setCurrentAnimationIndex(currentAnimationIndex + 1);
      onOutput?.({
        selectedEvent: sortedEvents[currentAnimationIndex].id,
        zoomLevel,
        visibleRange: {
          start: minTime,
          end: maxTime,
        },
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAnimating, currentAnimationIndex, sortedEvents, config.animate]);

  const calculatePosition = (timestamp: number) => {
    return ((timestamp - minTime) / timeRange) * 100 * zoomLevel;
  };

  const getEventColor = (type?: string) => {
    return EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] || EVENT_TYPE_COLORS.event;
  };

  const selectedEventData = sortedEvents.find((e) => e.id === selectedEvent);

  const SWIMLANE_HEIGHT = 80;
  const TIMELINE_PADDING = 40;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="text-sm font-medium">{config.name || 'Timeline'}</div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            title="Zoom Out"
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomIn}
            title="Zoom In"
            disabled={zoomLevel >= 5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          {config.animate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleAnimation}
              title={isAnimating ? 'Pause Animation' : 'Play Animation'}
            >
              {isAnimating ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Swimlane Labels */}
        {config.showSwimlanes && swimlanes.length > 1 && (
          <div className="w-32 flex-shrink-0 border-r border-border bg-muted/10">
            <div style={{ height: TIMELINE_PADDING }} className="border-b border-border" />
            {swimlanes.map((swimlane) => (
              <div
                key={swimlane.id}
                style={{ height: SWIMLANE_HEIGHT }}
                className="flex items-center border-b border-border px-3 text-sm font-medium"
              >
                {swimlane.label}
              </div>
            ))}
          </div>
        )}

        {/* Timeline Content */}
        <div className="flex-1 overflow-x-auto" ref={containerRef}>
          <div
            className="relative"
            style={{
              width: `${100 * zoomLevel}%`,
              minWidth: '100%',
              height: '100%',
            }}
          >
            {/* Time axis */}
            <div
              style={{ height: TIMELINE_PADDING }}
              className="border-b border-border bg-background"
            >
              <div className="flex h-full items-center px-4 text-xs text-muted-foreground">
                {sortedEvents.map((event, idx) => {
                  if (idx % Math.ceil(sortedEvents.length / (10 * zoomLevel)) !== 0) return null;
                  return (
                    <div
                      key={event.id}
                      style={{
                        position: 'absolute',
                        left: `${calculatePosition(event.timestamp)}%`,
                      }}
                    >
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swimlanes */}
            {swimlanes.map((swimlane) => (
              <div
                key={swimlane.id}
                style={{ height: SWIMLANE_HEIGHT }}
                className="relative border-b border-border bg-background"
              >
                {/* Events in this swimlane */}
                {sortedEvents
                  .filter(
                    (event) =>
                      !config.showSwimlanes ||
                      swimlanes.length === 1 ||
                      event.swimlaneId === swimlane.id ||
                      (!event.swimlaneId && swimlane.id === 'default')
                  )
                  .map((event) => (
                    <div
                      key={event.id}
                      style={{
                        position: 'absolute',
                        left: `${calculatePosition(event.timestamp)}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="cursor-pointer"
                      onClick={() => handleEventClick(event.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEventClick(event.id);
                        }
                      }}
                      aria-pressed={selectedEvent === event.id}
                      aria-label={`Event: ${event.title}. ${event.description || ''}`}
                    >
                      <div
                        className={`
                          h-3 w-3 rounded-full transition-all
                          ${getEventColor(event.type)}
                          ${selectedEvent === event.id ? 'ring-4 ring-primary/50 scale-150' : 'hover:scale-125'}
                        `}
                        title={event.title}
                      />
                      {selectedEvent === event.id && (
                        <div className="absolute top-5 left-1/2 z-10 w-48 -translate-x-1/2 rounded-md border border-border bg-background p-2 text-xs shadow-lg">
                          <div className="font-medium">{event.title}</div>
                          {event.description && (
                            <div className="mt-1 text-muted-foreground">
                              {event.description}
                            </div>
                          )}
                          <div className="mt-1 text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                          {event.type && (
                            <div className="mt-1">
                              <span
                                className={`inline-block rounded px-1 py-0.5 text-xs text-white ${getEventColor(
                                  event.type
                                )}`}
                              >
                                {EVENT_TYPE_LABELS[event.type] || event.type}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        {sortedEvents.length} events • Zoom: {zoomLevel.toFixed(1)}x
        {selectedEventData && (
          <span className="ml-2">
            • Selected: {selectedEventData.title}
          </span>
        )}
      </div>
    </div>
  );
}
