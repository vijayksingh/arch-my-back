# Convex Backend Functions

This directory contains all Convex backend functions, schema definitions, and authentication configuration.

## Overview

Convex is a serverless backend platform that provides:
- Real-time database with automatic synchronization
- Type-safe queries and mutations
- Built-in authentication support
- Automatic API generation

## File Structure

```
convex/
├── schema.ts          # Database schema definition (tables, indexes)
├── auth.ts            # Authentication configuration (Google OAuth, Password)
├── workspaces.ts      # Workspace CRUD operations
├── designs.ts         # Canvas designs (nodes, edges, sections)
├── blocks.ts          # Documentation blocks (text, requirements, schema, API, LLD)
├── users.ts           # User management functions
└── _generated/        # Auto-generated types (don't edit manually)
    ├── api.d.ts       # API types for calling functions from frontend
    ├── dataModel.d.ts # Database types
    └── server.d.ts    # Server-side types
```

## Schema Definition (`schema.ts`)

The schema defines the database structure with tables and indexes.

### Tables

#### `users`
Stores user account information.
```typescript
{
  userId: string,      // External auth provider user ID
  name: string,
  email: string,
  createdAt: number    // Unix timestamp
}
```

Indexes:
- `by_userId`: Query users by auth provider ID
- `by_email`: Query users by email address

#### `workspaces`
Stores user workspaces with view settings and preferences.
```typescript
{
  userId: string,
  title: string,
  viewMode: 'document' | 'both' | 'canvas',
  activeCanvasTool: 'cursor' | 'select' | 'rectangle' | 'circle' | 'text',
  documentEditorMode: 'edit' | 'preview',
  createdAt: number,
  updatedAt: number
}
```

Indexes:
- `by_userId`: Query workspaces by user
- `by_userId_updatedAt`: Query workspaces by user, sorted by last updated

#### `designs`
Stores canvas data (nodes, edges, sections).
```typescript
{
  workspaceId: Id<'workspaces'>,
  nodes: Array<{
    id: string,
    type: string,      // 'archComponent' | 'shapeRect' | 'shapeCircle' | 'shapeText' | 'sectionBadge'
    position: { x: number, y: number },
    data: any,         // Node-specific data
    style?: any,
    selected?: boolean,
    dragging?: boolean
  }>,
  edges: Array<{
    id: string,
    source: string,
    target: string,
    type?: string,
    data?: any,        // Edge-specific data (protocol, port, label)
    selected?: boolean,
    sourceHandle?: string,
    targetHandle?: string
  }>,
  sections: Array<{
    id: string,
    title: string,
    nodeIds: string[],
    bounds: { x: number, y: number, width: number, height: number },
    createdAt: number,
    linkedBlockId?: string
  }>,
  version: number,     // Schema version for migrations
  createdAt: number,
  updatedAt: number
}
```

Indexes:
- `by_workspaceId`: Query designs by workspace
- `by_workspaceId_updatedAt`: Query designs by workspace, sorted by last updated

#### `blocks`
Stores notebook blocks with type-specific data.
```typescript
{
  workspaceId: Id<'workspaces'>,
  blockId: string,     // Client-generated ID for referencing
  type: 'text' | 'requirements' | 'schema' | 'api' | 'lld',
  sectionId: string | null,  // Reference to canvas section
  data: any,           // Block-specific data structure
  createdAt: number,
  updatedAt: number
}
```

Block data structures:
- **text**: `{ markdown: string }`
- **requirements**: `{ items: RequirementItem[] }`
- **schema**: `{ tables: SchemaTable[] }`
- **api**: `{ endpoints: ApiEndpoint[] }`
- **lld**: `{ title: string, summary?: string, content: string, status?: string }`

Indexes:
- `by_workspaceId`: Query blocks by workspace
- `by_workspaceId_blockId`: Query specific block in workspace
- `by_workspaceId_type`: Query blocks by workspace and type
- `by_workspaceId_createdAt`: Query blocks by workspace, sorted by creation time

## Authentication (`auth.ts`)

Convex Auth configuration with two providers:

### Password Provider
Email/password authentication with built-in user management.

### Google OAuth Provider
Google sign-in integration. Requires environment variables:
- `AUTH_GOOGLE_ID`: Google OAuth Client ID
- `AUTH_GOOGLE_SECRET`: Google OAuth Client Secret

**Important**: These environment variables must be set in the Convex Dashboard, not in `.env.local`.

### Auth Functions
The `convexAuth` export provides:
- `auth`: Middleware for authenticated functions
- `signIn`: Sign in function
- `signOut`: Sign out function
- `store`: Auth storage adapter

## Function Files

### `workspaces.ts`
Functions for workspace management:
- **Queries**: Get workspaces for a user, get specific workspace
- **Mutations**: Create workspace, update workspace settings, delete workspace

### `designs.ts`
Functions for canvas data management:
- **Queries**: Get design for a workspace
- **Mutations**: Create design, update nodes/edges, add/update sections

### `blocks.ts`
Functions for documentation block management:
- **Queries**: Get blocks for a workspace, get specific block
- **Mutations**: Create block, update block data, delete block, link block to section

### `users.ts`
Functions for user management:
- **Queries**: Get current user, get user by ID
- **Mutations**: Create user, update user profile

## Writing Functions

### Query Functions
Read-only operations that fetch data from the database.

```typescript
import { query } from './_generated/server';
import { v } from 'convex/values';

export const getWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    return await ctx.db
      .query('workspaces')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect();
  },
});
```

### Mutation Functions
Write operations that modify database state.

```typescript
import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const createWorkspace = mutation({
  args: {
    title: v.string(),
    viewMode: v.union(v.literal('document'), v.literal('both'), v.literal('canvas')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const workspaceId = await ctx.db.insert('workspaces', {
      userId: identity.subject,
      title: args.title,
      viewMode: args.viewMode,
      activeCanvasTool: 'cursor',
      documentEditorMode: 'edit',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return workspaceId;
  },
});
```

### Authentication
Use `ctx.auth.getUserIdentity()` to get the current authenticated user:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error('Not authenticated');
}

// identity.subject is the user ID
const userId = identity.subject;
```

## Calling Functions from Frontend

Import the API from `convex/_generated/api`:

```typescript
import { api } from '../convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';

// In a React component
function MyComponent() {
  // Query (real-time subscription)
  const workspaces = useQuery(api.workspaces.getWorkspaces);

  // Mutation
  const createWorkspace = useMutation(api.workspaces.createWorkspace);

  const handleCreate = async () => {
    await createWorkspace({
      title: 'New Workspace',
      viewMode: 'both'
    });
  };

  return <div>{/* ... */}</div>;
}
```

## Database Queries

### Basic Query
```typescript
// Get all records
const records = await ctx.db.query('tableName').collect();

// Get first record
const record = await ctx.db.query('tableName').first();
```

### Index Queries
```typescript
// Query with index
const workspaces = await ctx.db
  .query('workspaces')
  .withIndex('by_userId', (q) => q.eq('userId', userId))
  .collect();

// Query with compound index
const recentWorkspaces = await ctx.db
  .query('workspaces')
  .withIndex('by_userId_updatedAt', (q) =>
    q.eq('userId', userId).gt('updatedAt', timestamp)
  )
  .collect();
```

### Filtering and Ordering
```typescript
// Filter results
const activeWorkspaces = await ctx.db
  .query('workspaces')
  .filter((q) => q.eq(q.field('status'), 'active'))
  .collect();

// Order results (only works with indexes)
const sorted = await ctx.db
  .query('workspaces')
  .withIndex('by_userId_updatedAt')
  .order('desc')
  .collect();
```

### Insert, Update, Delete
```typescript
// Insert
const id = await ctx.db.insert('tableName', { field: 'value' });

// Update
await ctx.db.patch(id, { field: 'newValue' });

// Delete
await ctx.db.delete(id);

// Get by ID
const record = await ctx.db.get(id);
```

## Development Workflow

1. **Modify schema**: Edit `schema.ts`
2. **Run Convex dev**: `npx convex dev` (auto-regenerates types)
3. **Write functions**: Create/edit function files
4. **Use in frontend**: Import from `convex/_generated/api`

Types are automatically generated in `_generated/` whenever you save changes.

## Best Practices

1. **Always validate authentication** in mutations and sensitive queries
2. **Use indexes** for frequently queried fields
3. **Keep function arguments simple** - use flat objects, avoid deeply nested structures
4. **Handle errors gracefully** - throw descriptive errors
5. **Use transactions** when multiple operations must succeed/fail together
6. **Keep functions focused** - one function should do one thing well
7. **Document complex logic** with comments
8. **Test locally** with `npx convex dev` before deploying

## Debugging

### Convex Dashboard
View logs, database contents, and function execution in the [Convex Dashboard](https://dashboard.convex.dev).

### Console Logging
Use `console.log()` in functions - output appears in the Convex dev server terminal.

```typescript
export const myFunction = mutation({
  handler: async (ctx, args) => {
    console.log('Function called with args:', args);
    // ...
  },
});
```

### Common Issues

**"Not authenticated" errors**
- Ensure the user is signed in
- Check that `ConvexAuthProvider` wraps your app
- Verify auth configuration in `auth.ts`

**Schema validation errors**
- Check that data matches the schema definition
- Ensure all required fields are provided
- Verify type correctness (string vs number, etc.)

**Index not found errors**
- Make sure the index is defined in `schema.ts`
- Wait for `npx convex dev` to regenerate types
- Restart the Convex dev server if needed

## Additional Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [React Flow Documentation](https://reactflow.dev/)
