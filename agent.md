# AGENT UX + DESIGN SYSTEM GUIDELINES

This document locks the product taste, UI behavior, and engineering SOP for future phases.
If a future change conflicts with this file, this file wins unless explicitly overridden by product direction.

## 1) Product Taste Lock (Non-Negotiable)

### North Star
- Aesthetic baseline: **Notion + Cursor + Vercel** style discipline.
- Tone: premium, minimal, calm, technical, intentional.
- Visual language: mostly monochromatic (grays/white/black) with restrained category accents.
- Layout philosophy: **canvas-first**, floating tools, low visual noise, high information clarity.

### Taste Fingerprint
- Use fewer, better visual signals.
- Prioritize spacing and typography rhythm over heavy borders.
- Surfaces should feel layered and light, not boxed and dense.
- Accent color means meaning (category/focus/state), not decoration.
- Avoid flashy gradients/glows unless subtle and purposeful.

## 2) Design Principles

1. **Minimal by default**
   - Remove non-essential strokes, separators, and decorative wrappers.
   - Keep only high-value boundaries (outer shell, focus, active, selected).

2. **Accent-led hierarchy**
   - Neutral borders are low-priority and faint.
   - Category accents carry identity for cards, chips, icons, and key affordances.

3. **Canvas is primary**
   - Sidebar and inspector must never hijack main canvas real estate.
   - Use floating overlays and content-driven sizing.

4. **Progressive disclosure, not modal overload**
   - Inline edit where possible.
   - Keep interaction loops short (click -> edit -> continue).

5. **Consistency over novelty**
   - Reuse existing patterns/tokens before inventing new ones.

## 3) Source of Truth Files

- Theme + tokens: `src/index.css`
- Theme state/persistence: `src/stores/themeStore.ts`
- Floating sidebar behavior/persistence: `src/stores/uiStore.ts`, `src/components/Sidebar/Sidebar.tsx`
- Component rows: `src/components/Sidebar/ComponentCard.tsx`
- Inline inspector: `src/components/ConfigPanel/ConfigPanel.tsx`
- Node look/feel: `src/components/Canvas/ArchNode.tsx`
- Input behavior variants: `src/components/ui/input.tsx`

Do not introduce parallel token systems or one-off style islands.

## 4) Visual System Rules

### 4.1 Colors and Tokens
- Always use semantic tokens and category variables.
- Prefer `hsl(var(--token))` patterns for theme compatibility.
- Do not hardcode hex colors in components unless there is a documented exception.

Required border hierarchy tokens:
- `--ui-border-ghost`
- `--ui-border-focus`
- `--ui-border-accent-soft`

Category accent tokens (already standardized):
- `--category-traffic-accent`
- `--category-compute-accent`
- `--category-storage-accent`
- `--category-messaging-accent`
- `--category-caching-accent`
- `--category-external-accent`

### 4.2 Borders and Surfaces
- Default state: low-noise and mostly border-light.
- Keep border emphasis for:
  - outer floating containers,
  - selected state,
  - keyboard focus,
  - destructive/critical actions.
- Prefer tint, elevation, and subtle inset over stacked outlines.

### 4.3 Shadows and Depth
- Use existing shadow tokens (`--surface-shadow`, `--panel-shadow`, node shadow tokens).
- Shadows should separate layers, not shout.
- Keep blur/backdrop subtle and consistent with floating surfaces.

### 4.4 Typography and Density
- Small UI text is acceptable, but maintain readability and contrast.
- Keep row heights compact and aligned to current controls.
- Avoid increasing density by adding wrappers/dividers around every field.

## 5) Locked Interaction Contracts

### 5.1 Sidebar (Floating Rail + Tray)
- Rail remains compact (`w-10`) and draggable.
- Must support drag-anywhere movement and nearest-corner snapping.
- Position and corner must persist across sessions.
- Tray is compact and non-dominant; search and category sections remain lightweight.

### 5.2 Inspector (Bottom Inline Panel)
- Bottom inspector remains a **single-row inline editing surface**.
- Width must be content-driven (`w-fit`) with sensible max width.
- Horizontal overflow uses scroll; do not reintroduce oversized fixed-width cards.
- Internal separators are minimal; avoid stacked neutral borders.

### 5.3 Component Rows
- Rows rely on accent cues (strip/tint/icon), not full neutral outlines.
- Hover/active states should prefer fill/elevation over hard border flips.

### 5.4 Nodes
- Node surfaces are translucent/subtle and integrated with global aesthetic.
- Selection and hover must be clear but restrained.
- Category identity appears through icon/accent treatment, not loud panel fills.

### 5.5 Theme
- Must support both dark and light mode parity.
- Theme persistence must remain reliable (`localStorage` + root class/data-theme).

## 6) Input and Control Rules

- Use `Input` variant contract:
  - `default`: standard form contexts.
  - `ghost`: compact inspector/sidebar contexts (borderless at rest, visible on focus).
- In compact floating contexts, controls should not create border congestion.
- Focus state must remain obvious for keyboard navigation.

## 7) Accessibility and Usability Guardrails

- Never remove visible focus indication.
- Validate dark and light contrast for text, icons, and focus rings.
- Keyboard behavior must stay intact:
  - `Escape` closes tray/inspector as implemented,
  - inline rename enter/escape behavior remains predictable.
- Preserve pointer + drag affordances and cursor feedback.

## 8) SOP For Future Dev Work

Use this SOP for all UI work, refactors, and feature phases.

### Step 0: Scope Clarification (Mandatory)
- Confirm user intent, constraints, and success criteria before coding.
- Identify ambiguity early (layout, behavior, persistence, accessibility, breakpoints).
- Ask targeted clarifying questions only when needed.

### Step 1: Source-of-Truth Discovery
- Inspect existing implementation patterns before creating new ones.
- Reuse existing token and component contracts first.
- Verify where behavior is persisted (Zustand stores, theme, UI state).

### Step 2: Change Design
- Define:
  - affected files,
  - expected visual/behavioral delta,
  - non-goals (what must not change),
  - regression risks.

### Step 3: Implement in This Order
1. Tokens/utilities (`src/index.css`) if needed.
2. Primitive contracts (`src/components/ui/*`) if needed.
3. Feature surfaces (`Sidebar`, `ConfigPanel`, `ArchNode`, etc.).
4. State/store behavior (`uiStore`, `themeStore`) only if required.

### Step 4: Validation (Required)
- Run:
  - `pnpm lint`
  - `pnpm build`
- Manual UX checks in both themes:
  - sidebar drag/snap/persist,
  - tray search behavior,
  - node select/edit flow,
  - bottom inspector inline editing and overflow behavior,
  - focus states visible on keyboard navigation.

### Step 5: Regression Checklist
- No reintroduction of dense border stacks.
- No fixed-width inspector regressions.
- No sidebar width creep.
- No hardcoded color drift from token system.
- No broken theme persistence.

### Step 6: Delivery Notes
- Summarize what changed, why, and what was verified.
- Call out any residual risk and follow-up tasks.

## 9) Do / Do Not

### Do
- Keep UI breathable and accent-led.
- Prefer tokenized styling and existing patterns.
- Preserve current interaction model unless explicitly asked to change it.
- Validate with lint/build and manual interaction passes.

### Do Not
- Reintroduce heavy borders/dividers inside compact panels.
- Add colorful gradients/glows that break the monochrome tone.
- Convert floating compact panels back into full-width/full-height takeovers.
- Hardcode one-off colors/sizing that bypass design tokens.

## 10) Definition of Done (UI Work)

A UI task is done only if:
- visual style matches this taste lock,
- interaction contracts remain intact,
- dark/light parity is validated,
- focus and keyboard usability are preserved,
- lint/build pass,
- no obvious regression in sidebar/inspector/node workflows.
