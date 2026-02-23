# Project Guidelines for AI Agents

**READ THIS FIRST** before making any changes to this codebase.

## Quick Start

1. **Design & UX**: See [`agent.md`](./agent.md) for visual system rules, design principles, and UI patterns
2. **Technical Architecture**: See the [Walkthrough System - Technical Reference](intent://local/note/75799c34-a9ae-463a-9757-a39913effa23) note for:
   - Canvas architecture and state management
   - ELK.js auto-layout system
   - React patterns and TypeScript best practices
   - Project philosophy and anti-patterns

## Project Philosophy

### Core Principle: Quality Over Generic AI Slop

This is NOT a generic diagram tool. We build for **depth and insight**, not surface-level features.

**"The graph should look like it's made by some human, not just fucking AI slop."**

Key values:
- **Intentional** - Every feature solves a specific problem
- **Polished** - Attention to detail, smooth interactions
- **Educational** - Users learn architectural thinking
- **Professional** - Something engineers proudly share

### Critical Rules (DO NOT VIOLATE)

#### ❌ Don't Duplicate Implementations
If something works in one place, **extend it**. Never create parallel implementations.

**Example**: We have ONE canvas (`Canvas.tsx`) that supports both `editor` and `walkthrough` modes. Don't create `CanvasPanel.tsx`, `WalkthroughCanvas.tsx`, or similar duplicates.

#### ❌ Don't Manually Position Nodes
Use **ELK.js** with semantic layer constraints for all layout. No hardcoded `position: { x, y }`.

#### ❌ Don't Add Features Without Clear Use Cases
Every feature must solve a real problem. Ask: "What specific pain point does this solve?"

#### ❌ Don't Ignore Type Safety
TypeScript prevents runtime errors. Don't `as any` your way out of problems.

## File Organization

### Design & UX
- **Source of truth**: [`agent.md`](./agent.md)
- Theme tokens: `src/index.css`
- UI primitives: `src/components/ui/*`
- Component patterns: Sidebar, ConfigPanel, ArchNode

### Technical Architecture
- **Source of truth**: [Walkthrough System - Technical Reference](intent://local/note/75799c34-a9ae-463a-9757-a39913effa23) note
- Canvas: `src/components/Canvas/Canvas.tsx` (single implementation)
- Layout: `src/services/layoutService.ts` (ELK.js integration)
- State: Zustand stores (`src/stores/`) + WalkthroughEngine (`src/lib/walkthroughEngine.ts`)
- Types: `src/types/`

## Common Pitfalls

### Walkthrough System
- ✅ Define nodes WITHOUT position fields in walkthrough files
- ✅ Use unique edge IDs across entire walkthrough file
- ✅ Ensure all nodes are connected (no orphans)
- ✅ Let ELK compute positions based on semantic layers
- ❌ Don't override ReactFlow's internal drag state
- ❌ Don't call `fitView()` on every node change
- ❌ Don't reuse simple edge IDs like `e1`, `e2` across steps

### React Patterns
- ✅ Use Tailwind classes, not inline styles
- ✅ Memoize expensive computations
- ✅ Use `useCallback` for event handlers
- ✅ Context for shared state, not props drilling
- ❌ Don't break Rules of Hooks (conditional hook calls)
- ❌ Don't create separate CSS files for components
- ❌ Don't over-optimize (measure first)

### TypeScript
- ✅ Explicit types for public APIs
- ✅ Discriminated unions for variants
- ✅ Branded types for IDs
- ❌ Don't use `any` as an escape hatch
- ❌ Don't ignore type errors with casts

## Before Making Changes

1. **Read the relevant documentation**:
   - Canvas/layout? → [Technical Reference](intent://local/note/75799c34-a9ae-463a-9757-a39913effa23) - "Auto-Layout with ELK.js"
   - UI changes? → [`agent.md`](./agent.md)
   - New component? → [Technical Reference](intent://local/note/75799c34-a9ae-463a-9757-a39913effa23) - "How to Extend the Platform"

2. **Check anti-patterns** - Is what you're about to do listed as ❌ Don't Do This?

3. **When in doubt, ASK** - Better to ask than to implement the wrong thing

## Validation Checklist

After making changes:
- [ ] `npm run build` passes with no errors
- [ ] No TypeScript type errors
- [ ] No duplicate implementations
- [ ] No hardcoded positions (if canvas work)
- [ ] No duplicate edge IDs (if walkthrough work)
- [ ] All nodes connected (if walkthrough work)
- [ ] Dark and light modes both work (if UI work)
- [ ] Focus states visible (if UI work)

## Getting Help

If you encounter:
- Duplicate key warnings → Check edge ID uniqueness
- "Cannot read properties of undefined (reading 'x')" → Missing position, check WalkthroughEngine
- Nodes stacking → ELK layout not running
- Drag not working → Something overriding ReactFlow state

**Stop and ask the user** - don't guess at fixes.

---

**Last Updated**: 2026-02-23
**Maintainer**: Keep this file and referenced documents updated when architectural decisions change
