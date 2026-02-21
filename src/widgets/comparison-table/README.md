# Comparison Table Widget

Side-by-side comparison of approaches, technologies, architectures.

## Features

- **Multiple Column Support**: Compare 2+ options side-by-side
- **Rich Cell Types**: Text, pros/cons lists, code snippets, links
- **Export Options**: Export to Markdown, JSON, or CSV
- **Interactive**: Click columns/rows for selection
- **Keyboard Navigation**: Fully accessible with keyboard
- **Customizable**: Striped rows, hover highlighting, sortable (coming soon)

## Input Schema

```typescript
{
  columns: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  rows: Array<{
    id: string;
    label: string;
    cells: Record<string, CellContent>;
  }>;
}
```

### Cell Content Types

1. **Simple Text**: `"Simple string content"`
2. **Pros/Cons**: `{ type: 'pros-cons', pros: [...], cons: [...] }`
3. **Code**: `{ type: 'code', content: '...' }`
4. **Link**: `{ type: 'link', content: 'Text', url: 'https://...' }`

## Output Schema

```typescript
{
  selectedColumn?: string;  // ID of selected column
  selectedRow?: string;     // ID of selected row
  exportFormat?: 'markdown' | 'json' | 'csv';
}
```

## Configuration

```typescript
{
  name?: string;               // Widget title
  striped?: boolean;           // Alternate row colors (default: true)
  highlightOnHover?: boolean;  // Highlight on hover (default: true)
  sortable?: boolean;          // Enable sorting (default: false)
  maxWidth?: string;           // Max width CSS value
}
```

## Examples

### Example 1: Cloud Providers
Compare AWS, GCP, and Azure across compute, storage, database features.

### Example 2: API Patterns
Compare REST, GraphQL, and gRPC with pros/cons and code examples.

### Example 3: Frontend Frameworks
Compare React, Vue, and Svelte with learning curves and bundle sizes.

## Use Cases

- Technology selection (AWS vs GCP vs Azure)
- API design patterns (REST vs GraphQL vs gRPC)
- Framework comparisons (React vs Vue vs Svelte)
- Architecture decision records
- Feature matrices
- Product comparisons
