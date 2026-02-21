# Timeline/Sequence Widget

Visualize execution flows, request lifecycles, and event sequences.

## Features

- **Horizontal Timeline**: Events plotted along a time axis
- **Swimlanes**: Organize events by category/layer (client, server, database, etc.)
- **Zoom Controls**: Zoom in/out to see more or less detail
- **Event Selection**: Click events to see details
- **Event Types**: Start, end, event, error, decision with color coding
- **Animation**: Optional replay mode to step through events
- **Timestamp Support**: Handles both numeric and ISO 8601 timestamps

## Input Schema

```typescript
{
  events: Array<{
    id: string;
    timestamp: number | string;  // Unix timestamp or ISO 8601
    title: string;
    description?: string;
    type?: 'start' | 'end' | 'event' | 'error' | 'decision';
    metadata?: Record<string, unknown>;
    swimlaneId?: string;  // Which swimlane this event belongs to
  }>;
  swimlanes?: Array<{
    id: string;
    label: string;
  }>;
}
```

## Output Schema

```typescript
{
  selectedEvent?: string;    // ID of selected event
  zoomLevel?: number;        // Current zoom level (0.5-5)
  visibleRange?: {
    start: number;           // Start timestamp
    end: number;             // End timestamp
  };
}
```

## Configuration

```typescript
{
  name?: string;          // Widget title
  showSwimlanes?: boolean; // Show swimlane labels (default: true)
  animate?: boolean;       // Enable animation mode (default: false)
}
```

## Event Types & Colors

- **Start** (Green): Beginning of a flow
- **End** (Red): Completion of a flow
- **Event** (Blue): Regular event
- **Error** (Dark Red): Error or failure
- **Decision** (Yellow): Decision point or branching

## Examples

### Example 1: HTTP Request Lifecycle
Visualize DNS lookup, TCP handshake, TLS, request/response across client, network, server, database swimlanes.

### Example 2: OAuth Authentication Flow
Show user interactions, app redirects, OAuth provider validation across user, app, OAuth swimlanes.

### Example 3: CI/CD Build Pipeline
Single-lane sequence showing commit, tests, build, deploy stages with error handling.

## Use Cases

- HTTP request/response lifecycles
- Authentication flows (OAuth, SAML)
- Distributed tracing
- CI/CD pipelines
- Event sourcing visualizations
- State machine transitions
- Message queue processing
- API call chains
