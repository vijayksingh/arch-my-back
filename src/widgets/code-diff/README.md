# Code Diff Viewer Widget

Show file changes, code evolution, and before/after comparisons.

## Features

- **Split View**: Side-by-side comparison (default)
- **Unified View**: Single column with +/- markers
- **Line Numbers**: Optional line numbering
- **Syntax Aware**: Language-specific display
- **Color Coding**: Green for additions, red for deletions
- **Line Selection**: Click lines to select/highlight
- **Copy Support**: Copy new code to clipboard
- **Addition/Deletion Counts**: Summary of changes

## Input Schema

```typescript
{
  language: string;      // Programming language (e.g., 'javascript', 'python')
  oldCode: string;       // Original code
  newCode: string;       // Modified code
  filename?: string;     // Optional filename
  hunks?: Array<{        // Optional hunk information (not yet implemented)
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
  }>;
}
```

## Output Schema

```typescript
{
  selectedLine?: number;              // Line index of selected line
  viewMode?: 'split' | 'unified';    // Current view mode
}
```

## Configuration

```typescript
{
  name?: string;                      // Widget title
  viewMode?: 'split' | 'unified';    // Default view mode (default: 'split')
  showLineNumbers?: boolean;          // Show line numbers (default: true)
}
```

## View Modes

### Split View (Default)
- Side-by-side comparison
- Old code on left, new code on right
- Unchanged lines appear in both columns
- Added lines highlighted in green on right
- Removed lines highlighted in red on left

### Unified View
- Single column with +/- markers
- Old line numbers | New line numbers | Marker | Code
- `+` for additions (green background)
- `-` for deletions (red background)
- ` ` (space) for unchanged lines

## Examples

### Example 1: Security Fix
SQL injection vulnerability fix - before/after comparison showing parameterized queries.

### Example 2: Refactoring
React class component converted to functional component with hooks.

### Example 3: Performance Optimization
Adding debouncing to search input to reduce API calls.

## Use Cases

- Code review
- Security fixes documentation
- Refactoring documentation
- Migration guides (before/after patterns)
- Bug fix examples
- Performance optimizations
- API changes
- Breaking changes documentation

## Future Enhancements

- Syntax highlighting via CodeMirror 6
- Hunk expansion/collapse
- Word-level diff highlighting
- Multiple file diffs
- Commit history integration
