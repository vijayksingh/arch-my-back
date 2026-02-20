# Agent Testing Methodology

**A proven framework for building UI features with AI agents while preventing regressions**

Based on real-world experience transforming a React architecture tool's UX with 14 coordinated agent tasks, 110 tests, and zero regressions.

---

## The Core Problem

When AI agents build features, **they often break existing behavior without realizing it.** You ship a new feature, and suddenly:
- A button that worked yesterday doesn't respond
- A dropdown menu vanishes
- A hover effect stops working
- Dark mode breaks

The agent had no way to know it broke something — it only tested the new code.

---

## The Solution: Behavior-Driven Agent Testing

**Interleave implementation and testing waves.** After every feature wave, immediately write behavior tests that verify what the USER sees and does.

### Wave Structure

```
Wave 0: Testing Infrastructure
↓
Wave 1: Implement features (parallel agents)
↓
Wave 1.5: Write behavior tests for Wave 1
↓
Wave 2: Implement more features (parallel agents)
↓
Wave 2.5: Write behavior tests for Wave 2
↓
...continue pattern...
↓
Final Wave: Verifier agent runs full suite + build + manual checks
```

**Key insight:** Tests are written AFTER implementation (by a dedicated test-writing agent), not before. This is pragmatic — the implementor focuses on shipping, the test writer focuses on protecting.

---

## Kent C. Dodds Philosophy (The Foundation)

Our testing approach is grounded in Kent C. Dodds' methodology:

### 1. Test User Behavior, Not Implementation

**Bad (tests implementation):**
```typescript
expect(component.state.isOpen).toBe(true)
expect(mockStore.getState().activeCanvasTool).toBe('select')
```

**Good (tests behavior):**
```typescript
expect(screen.getByText('Group & Link')).toBeVisible()
expect(screen.queryByText('Unknown')).not.toBeInTheDocument()
```

### 2. The Testing Trophy

Invest most heavily in **integration tests**:

```
    /\
   /  \    E2E (few)
  /----\
 /      \  Integration (most)
/--------\
\________/ Unit (some) + Static (TypeScript)
```

- **Static**: TypeScript strict mode catches type errors
- **Unit**: Test pure functions, business logic (domain/services layer)
- **Integration**: Test components WITH their real children, mocking only at boundaries
- **E2E**: Optional for critical paths (Playwright/Cypress)

### 3. "Think Less About Code, More About Use Cases"

Every test should map to a user story:

```typescript
// ✅ User story: "When I click a single node, the group bar should NOT appear"
test('does not show group actions when a single node is clicked', async () => {
  render(<SelectionActionBar />)
  // ... setup: select 1 node
  expect(screen.queryByText('Group')).not.toBeInTheDocument()
})

// ❌ Not a user story: "The component should check the store before rendering"
test('checks editorStore.activeCanvasTool', () => {
  // This is testing HOW, not WHAT
})
```

### 4. Tests Should Survive Refactors

If you rename a variable, restructure a component, or switch state management libraries, **tests should still pass** (assuming behavior didn't change).

**Avoid:**
- Checking CSS classes
- Asserting on component internal state
- Shallow rendering
- Mocking child components

**Prefer:**
- `screen.getByRole('button', { name: 'Save' })`
- `userEvent.click()`
- Rendering the full component tree
- Mocking only at system boundaries (API calls, auth, router)

---

## Wave 0: Testing Infrastructure Setup

**This is the foundation.** Do NOT skip this. It only takes one agent ~15 minutes.

### What to Install

```bash
npm install -D \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  jsdom
```

(If Vitest isn't set up yet: `npm install -D vitest @vitest/ui`)

### What to Create

1. **`vitest.config.ts`** (at project root)
   - jsdom environment
   - Setup files: `['./src/test/setup.ts']`
   - Path aliases (`@` → `./src`)
   - Globals: true (so `describe`, `it`, `expect` don't need imports)
   - CSS: true (so Tailwind classes don't break tests)

2. **`src/test/setup.ts`**
   - Import `@testing-library/jest-dom/vitest` for custom matchers
   - Mock `window.matchMedia` (many components break without this in jsdom)
   - Any global test setup

3. **`src/test/test-utils.tsx`**
   - Custom `render()` that wraps components with necessary providers:
     - Router provider (TanStack Router / React Router)
     - React Flow provider (if using React Flow)
     - Theme provider (if applicable)
   - Store reset helpers (if using Zustand / Jotai / Valtio — stores are module singletons, reset them in `beforeEach`)
   - Convex mock utilities:
     ```typescript
     export const mockUseQuery = vi.fn()
     export const mockUseMutation = vi.fn()
     vi.mock('convex/react', () => ({
       useQuery: mockUseQuery,
       useMutation: mockUseMutation,
     }))
     ```
   - Re-export `screen`, `within`, `waitFor` from `@testing-library/react`
   - Re-export `userEvent` from `@testing-library/user-event`

4. **Store reset pattern** (for Zustand)
   ```typescript
   // In test-utils.tsx
   import { canvasStore } from '@/stores/canvasStore'

   export function resetAllStores() {
     canvasStore.setState(initialCanvasState)
     // ... repeat for all stores
   }

   beforeEach(() => {
     resetAllStores()
   })
   ```

5. **Add test scripts to `package.json`**
   ```json
   {
     "test": "vitest run",
     "test:watch": "vitest",
     "test:ui": "vitest --ui",
     "test:coverage": "vitest run --coverage"
   }
   ```

6. **Write a smoke test** (`src/test/smoke.test.tsx`)
   - Render a simple component
   - Assert it's in the document
   - Proves the testing infrastructure works

### Verification

- `npm test` passes (smoke test + any existing tests)
- No setup errors or missing dependencies

---

## Feature Implementation Waves

### Wave Structure

Each feature wave should:
1. Be **scoped tightly** — one wave = 1 area of the app (e.g., "Editor fixes" or "Dashboard redesign")
2. Use **parallel agents** when tasks are independent
3. Have a **clear definition of done** per task
4. End with **TypeScript verification** (`npx tsc --noEmit`)

### Agent Instructions (Implementor)

When delegating to an implementor agent, provide:
- **Exact file paths** to modify
- **Current state** description (what exists now)
- **Target state** description (what should exist after)
- **Design system context** (Tailwind tokens, existing UI primitives, color schemes)
- **Edge cases** to handle
- **Verification command** (`npx tsc --noEmit`)
- **What NOT to touch** (files to leave alone, functionality to preserve)

Example:
```
Fix the SelectionActionBar so it only appears when the Select tool (S) is active AND 2+ nodes are selected.

Current bug: Shows whenever any node is selected.

Fix:
- File: src/components/Canvas/SelectionActionBar.tsx
- Import useEditorStore, read activeCanvasTool
- Change condition from `selectedNodes.length > 0` to:
  `activeCanvasTool === 'select' && selectedNodes.length >= 2`

Verify: npx tsc --noEmit passes
```

### Wait Mode for Parallel Tasks

When delegating multiple parallel tasks, use `wait_mode="after_all"`:

```typescript
delegate_task(taskNoteId="task-1", wait_mode="after_all")
delegate_task(taskNoteId="task-2", wait_mode="after_all")
delegate_task(taskNoteId="task-3", wait_mode="after_all")
// You'll be woken up when ALL THREE complete
```

---

## Testing Waves (The Safety Net)

### Wave Structure

After every feature implementation wave, **immediately** write behavior tests for those features.

### Agent Instructions (Test Writer)

When delegating to a test-writing agent, provide:
- **What was implemented** (summary of features from previous wave)
- **Testing philosophy recap** (Kent C. Dodds principles)
- **File paths** for test files (e.g., `src/components/Dashboard/__tests__/DesignCard.test.tsx`)
- **Mocking patterns** (reference existing test files for patterns)
- **Use cases to test** (list 4-6 user stories per component)
- **What NOT to test** (implementation details, CSS classes, internal state)

Example:
```
Write behavior tests for the SelectionActionBar component.

What was implemented:
- SelectionActionBar now only shows when Select tool + 2+ nodes selected

Tests to write (src/components/Canvas/__tests__/SelectionActionBar.test.tsx):

1. "does not show when single node selected"
   - Setup: 1 node selected, cursor tool active
   - Assert: "Group" text NOT in document

2. "shows when select tool active and 2+ nodes selected"
   - Setup: 2 nodes selected, select tool active
   - Assert: "Group" text IS visible

3. "hides when switching back to cursor tool"
   - Setup: start with select + 2 nodes (bar visible)
   - Action: switch to cursor tool
   - Assert: bar disappears

Use:
- screen.getByText / queryByText (not getByTestId)
- userEvent.click (not fireEvent)
- Mock Convex with mockUseQuery from test-utils
- Update stores via act() and store.setState()

Do NOT:
- Check component state
- Assert on CSS classes
- Mock child components
```

### What Good Tests Look Like

#### 1. DesignCard Tests (Example)

```typescript
import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { DesignCard } from '../DesignCard'
import { mockUseQuery, mockUseMutation } from '@/test/test-utils'

describe('DesignCard', () => {
  const mockDesign = {
    _id: 'design-1',
    title: 'Homepage Mockup',
    updatedAt: Date.now() - 86400000, // 1 day ago
    folderId: null,
  }

  beforeEach(() => {
    mockUseQuery.mockReturnValue([]) // empty folders list
    mockUseMutation.mockReturnValue(vi.fn())
  })

  test('renders design title and updated date', () => {
    render(<DesignCard design={mockDesign} />)
    expect(screen.getByText('Homepage Mockup')).toBeInTheDocument()
    expect(screen.getByText(/1 day ago/i)).toBeInTheDocument()
  })

  test('shows preview area with gradient placeholder', () => {
    const { container } = render(<DesignCard design={mockDesign} />)
    // The preview uses aspect-[16/10], so check for that container
    const previewArea = container.querySelector('[class*="aspect"]')
    expect(previewArea).toBeInTheDocument()
  })

  test('navigates to design when card is clicked', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<DesignCard design={mockDesign} onNavigate={onNavigate} />)

    const card = screen.getByText('Homepage Mockup').closest('div[role="button"]')
    await user.click(card!)

    expect(onNavigate).toHaveBeenCalledWith(mockDesign._id)
  })

  test('shows action menu when three-dot button is clicked', async () => {
    const user = userEvent.setup()
    render(<DesignCard design={mockDesign} />)

    const menuButton = screen.getByRole('button', { name: /more options/i })
    await user.click(menuButton)

    expect(screen.getByText('Open')).toBeVisible()
    expect(screen.getByText('Move to Folder')).toBeVisible()
    expect(screen.getByText('Duplicate')).toBeVisible()
    expect(screen.getByText('Delete')).toBeVisible()
  })

  test('opens delete confirmation when Delete is clicked', async () => {
    const user = userEvent.setup()
    render(<DesignCard design={mockDesign} />)

    const menuButton = screen.getByRole('button', { name: /more options/i })
    await user.click(menuButton)
    await user.click(screen.getByText('Delete'))

    expect(screen.getByText(/are you sure/i)).toBeVisible()
  })
})
```

**What makes this good:**
- ✅ Tests user-visible behavior (title, menu items, dialogs)
- ✅ Uses semantic queries (`getByRole`, `getByText`)
- ✅ Uses `userEvent` for realistic interactions
- ✅ Mocks at the boundary (Convex hooks)
- ✅ No internal state checks, no CSS class assertions

#### 2. DashboardPage Tests (Example)

```typescript
describe('DashboardPage', () => {
  test('shows empty state when no designs exist', () => {
    mockUseQuery.mockReturnValue([]) // no designs
    render(<DashboardPage />)

    expect(screen.getByText('Create your first architecture')).toBeVisible()
    expect(screen.getByRole('button', { name: /new design/i })).toBeVisible()
  })

  test('shows designs grid when designs exist', () => {
    mockUseQuery.mockReturnValue([
      { _id: '1', title: 'Design A', updatedAt: Date.now() },
      { _id: '2', title: 'Design B', updatedAt: Date.now() },
    ])
    render(<DashboardPage />)

    expect(screen.getByText('Design A')).toBeVisible()
    expect(screen.getByText('Design B')).toBeVisible()
    expect(screen.queryByText('Create your first architecture')).not.toBeInTheDocument()
  })

  test('opens folder creation dialog when New Folder is clicked', async () => {
    const user = userEvent.setup()
    mockUseQuery.mockReturnValue([])
    render(<DashboardPage />)

    await user.click(screen.getByRole('button', { name: /new folder/i }))

    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.getByText('Create Folder')).toBeVisible()
  })

  test('creates a new design when New Design is clicked', async () => {
    const user = userEvent.setup()
    const createMutation = vi.fn().mockResolvedValue('new-design-id')
    mockUseMutation.mockReturnValue(createMutation)
    mockUseQuery.mockReturnValue([])

    render(<DashboardPage />)
    await user.click(screen.getByRole('button', { name: /new design/i }))

    expect(createMutation).toHaveBeenCalled()
  })
})
```

---

## Final Verification Wave

The last wave should be a **verifier agent** (use the `verifier` specialist — it's Opus 4, thorough).

### Verifier Instructions

```
You are the final verifier for [project description].

Run ALL of these checks:

1. TypeScript compilation: `npx tsc --noEmit` (must exit 0)
2. Full test suite: `npm test` (check pass count, note pre-existing failures)
3. Production build: `npx vite build` (must succeed, check for warnings)
4. Code review: Read modified files, check for:
   - No unused imports
   - No TypeScript `any` types
   - Dark mode compatibility (semantic tokens, not hardcoded colors)
   - No console.log/debug statements
   - Consistent use of UI primitives

5. Dependency check: `npm ls [new deps]` (verify all installed)

Provide a PASS/FAIL for each check.
Overall verdict: SHIP IT or NEEDS FIXES
```

---

## Key Metrics & Success Criteria

### During Development

- **TypeScript**: Clean compile after each wave (`npx tsc --noEmit`)
- **Tests**: All new tests pass, existing tests unaffected
- **Coverage**: Aim for ~3-6 tests per component (use cases, not lines)

### At Completion

- **Test count**: Expect 40-60 new tests for a medium-sized feature overhaul
- **Pass rate**: 100% (excluding pre-existing failures you explicitly note)
- **Build**: Production build succeeds with no errors
- **Verifier**: Approves with high confidence

### What Success Looks Like

From our real example:
- **48 new behavior tests** written across 3 testing waves
- **110/112 tests passing** (2 pre-existing failures documented)
- **TypeScript**: clean
- **Vite build**: 3.4s, no warnings
- **Dark mode**: verified across all changes
- **Verifier verdict**: "APPROVED with high confidence"

---

## Common Pitfalls & How to Avoid Them

### 1. "The agent keeps breaking existing features"

**Cause:** No regression tests.

**Fix:** Add testing waves after EVERY feature wave. Don't wait until the end.

### 2. "Tests are brittle — they break when I refactor"

**Cause:** Tests check implementation details (state, CSS classes, component structure).

**Fix:** Only assert on what the USER sees: text, buttons, visible elements. Use `getByRole`, `getByText`.

### 3. "Tests pass but the feature is still broken"

**Cause:** Tests aren't testing the actual user flow.

**Fix:** Write tests from the user's perspective. "When I click X, I should see Y." Not "When the component mounts, the store should update."

### 4. "Agents break tests when adding features"

**Cause:** Agents modify test files or test setup without understanding the contract.

**Fix:** Instruct implementor agents to NOT touch test files. Only the dedicated test-writing agent touches tests.

### 5. "Tests take forever to run"

**Cause:** Too many mocks, too much setup, or testing implementation.

**Fix:** Mock only at boundaries (Convex, auth, router). Use the real component tree. Keep tests focused on one use case each.

### 6. "Dark mode breaks after agent changes"

**Cause:** Agents hardcode colors instead of using semantic tokens.

**Fix:** In every implementor instruction, explicitly state: "Use semantic color tokens (`bg-card`, `text-muted-foreground`), never hardcoded colors. Dark mode must work."

---

## Mocking Patterns

### Convex (BaaS)

```typescript
// In test-utils.tsx
export const mockUseQuery = vi.fn()
export const mockUseMutation = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
}))

// In tests
beforeEach(() => {
  mockUseQuery.mockReturnValue([]) // default: empty data
  mockUseMutation.mockReturnValue(vi.fn()) // default: no-op mutation
})

test('example', () => {
  mockUseQuery.mockReturnValue([{ _id: '1', title: 'Test' }])
  // ... rest of test
})
```

### TanStack Router

```typescript
// In test-utils.tsx
export const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}))

// In tests
test('navigates on click', async () => {
  render(<MyComponent />)
  await userEvent.click(screen.getByRole('button'))
  expect(mockNavigate).toHaveBeenCalledWith({ to: '/design/123' })
})
```

### Auth (@convex-dev/auth)

```typescript
// In test-utils.tsx
vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signOut: vi.fn(),
  }),
}))
```

### React Flow (if canvas components)

```typescript
// In test-utils.tsx
vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    getNodes: () => [],
    getEdges: () => [],
    setNodes: vi.fn(),
    fitView: vi.fn(),
  }),
  ReactFlow: ({ children }: any) => <div>{children}</div>,
  MiniMap: () => <div>MiniMap</div>,
  Controls: () => <div>Controls</div>,
  Background: () => <div>Background</div>,
}))
```

### Zustand Stores

```typescript
// Don't mock the store — use the real one and reset it
import { canvasStore } from '@/stores/canvasStore'

beforeEach(() => {
  canvasStore.setState({
    nodes: [],
    edges: [],
    selectedNodes: [],
    // ... initial state
  })
})

test('example', () => {
  // Update store directly in tests
  act(() => {
    canvasStore.getState().setSelectedNodes(['node-1', 'node-2'])
  })

  render(<SelectionActionBar />)
  expect(screen.getByText('Group')).toBeVisible()
})
```

---

## Task Breakdown Template

When planning a feature with agents + tests, structure it like this:

```
Wave 0: Testing Infrastructure
- Task: Set up Testing Library, Vitest, test-utils, mocks

Wave 1: [Feature Area A] Implementation
- Task 1.1: [Specific component/feature]
- Task 1.2: [Specific component/feature]
- Task 1.3: [Specific component/feature]
(all parallel)

Wave 1.5: [Feature Area A] Behavior Tests
- Task: Write integration tests for Wave 1 features

Wave 2: [Feature Area B] Implementation
- Task 2.1: [Specific component/feature]
- Task 2.2: [Specific component/feature]
(all parallel)

Wave 2.5: [Feature Area B] Behavior Tests
- Task: Write integration tests for Wave 2 features

[... repeat pattern ...]

Final Wave: Verification
- Task: Run full test suite, tsc, build, code review (verifier agent)
```

---

## Real-World Example: UX Overhaul

Here's how we applied this methodology to a real project:

### Problem
"Agents break existing behavior when building new features. No confidence that the app still works after changes."

### Solution
8 waves, 14 tasks, interleaved implementation and testing:

```
Wave 0: Testing Infrastructure (1 agent)
  ✅ Installed Testing Library, Vitest config, test-utils, mocks
  ✅ 4 smoke tests passing

Wave 1: Editor Quick Fixes (4 parallel agents)
  ✅ SelectionActionBar tool gating
  ✅ Sidebar sections panel removal
  ✅ Minimap resize/reposition
  ✅ Toolbar username fix

Wave 1.5: Editor Tests (1 agent)
  ✅ 16 behavior tests written
  ✅ All passing

Wave 2: Dashboard Redesign (3 parallel agents)
  ✅ DesignCard with preview area
  ✅ FolderCard with visual distinction
  ✅ DashboardPage polished layout

Wave 2.5: Dashboard Tests (1 agent)
  ✅ 17 behavior tests written
  ✅ All passing

Wave 3: Drag-and-Drop (1 agent)
  ✅ @dnd-kit integration
  ✅ Designs draggable onto folders

Wave 3.5: DnD Tests (1 agent)
  ✅ 15 behavior tests written
  ✅ All passing

Wave 4: Final Verification (1 verifier agent)
  ✅ TypeScript clean
  ✅ 110 tests passing
  ✅ Build succeeds
  ✅ Code reviewed
  ✅ APPROVED
```

### Outcome
- **Zero regressions** — all existing features still work
- **110 tests** protecting the entire feature set
- **High confidence** to ship
- **Verifier approved** on first try

---

## References & Further Reading

- [Kent C. Dodds: Write Tests](https://kentcdodds.com/blog/write-tests)
- [Kent C. Dodds: How to Know What to Test](https://kentcdodds.com/blog/how-to-know-what-to-test)
- [Testing Library: Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library: Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Quick Reference Checklist

Before starting an agent workflow with testing:

- [ ] Wave 0: Testing infrastructure set up first
- [ ] Test waves scheduled after EVERY implementation wave
- [ ] Implementor instructions include: file paths, current state, target state, verification command
- [ ] Test writer instructions include: what was implemented, use cases to test, mocking patterns
- [ ] Tests focus on user behavior (what they see/do), not implementation
- [ ] Mocking only at system boundaries (API, auth, router)
- [ ] Final wave: verifier agent runs full checks
- [ ] Success criteria defined: test count, pass rate, build status

---

**This methodology scales.** Whether you're building 4 small fixes or 40 large features, the pattern is the same: implement, test, implement, test, verify. The tests become your regression safety net, giving you confidence that agents aren't breaking things behind your back.
