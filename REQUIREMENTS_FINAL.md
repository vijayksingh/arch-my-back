# arch-my-back — Platform Roadmap & Requirements

> Updated: 2026-02-21Status: Production foundation complete. Pivoting to primitive-based learning platform.

## 🎯 Vision 2.0 — Composable Primitives for Understanding Systems

**From:** Architecture diagram tool with simulation**To:** Primitive-based interactive learning platform for understanding and designing software systems

**Core Philosophy:**Like Excalidraw/tldraw evolved from "draw diagrams" to "embeddable visual tool for all workflows," arch-my-back becomes an **embeddable primitive-based platform** for software understanding and design. Every widget should feel like a **Unix tool** — small, focused, composable.

**Inspiration:** Raycast's plugin system — primitives combine to form larger, more powerful flows.

## 🎮 Target Use Cases

1. **Onboarding Engineers** — Turn any codebase into an interactive wiki
2. **Technical Documentation** — Replace static diagrams with explorable canvases
3. **System Design Practice** — Learn patterns through interactive walkthroughs
4. **Engineering Blogs** — Embed interactive diagrams in technical posts
5. **Team Knowledge Sharing** — Collaboratively document architecture decisions
6. **Open Source Documentation** — Auto-generate interactive READMEs from GitHub repos

**Goal:** Mostly educational, but with production-grade primitives that can be used for real work (like Excalidraw/tldraw adoption path).

## ✅ Current State Audit (What's Done)

### Phase 0 — Validation Alpha ✅ **COMPLETE**

- ✅ Vite + React 19 + TypeScript + pnpm + shadcn/ui
- ✅ React Flow canvas with drag-and-drop
- ✅ Component library with icons (10+ types)
- ✅ Edge wiring and connection handling
- ✅ Config panel (3-level progressive disclosure)
- ✅ Minimap and zoom controls
- ✅ Undo/redo with Zustand temporal (zundo)

### Phase 1 — DSL + AI + Canvas Core ✅ **MOSTLY COMPLETE**

- ✅ Lezer grammar for archspec DSL v1 (`src/dsl/archspec.grammar`)
- ✅ DSL parser/serializer with error recovery
- ✅ JSON Schema + Zod validator (`archspec.schema.json`, `archspecZodSchema.ts`)
- ✅ Component type registry
- ✅ Group/bounding boxes (CollapsibleGroupNode)
- ✅ Auto-layout with ELK.js + Web Worker integration
- ✅ CodeMirror 6 DSL editor with syntax highlighting
- ✅ Bidirectional DSL ↔ canvas sync (CanvasStatePatcher)
- ✅ AI prompt bar (AIPromptBar component)
- ✅ Template browser shell
- ✅ Keyboard shortcuts
- ⚠️ **Partially:** AI generation flow (prompt bar exists, LLM integration not fully wired)
- ⚠️ **Partially:** Template gallery with thumbnails (shell exists, content missing)

### Phase 2 — Auth + Sharing ✅ **COMPLETE**

- ✅ Convex backend initialized with schema
- ✅ Convex Auth (GitHub/Google OAuth via @convex-dev/auth)
- ✅ Save/load designs to Convex
- ✅ User dashboard with folders
- ✅ Drag-and-drop file management (DashboardPage, FolderCard, DesignCard)
- ✅ Fork designs (forkedFrom tracking in schema)
- ✅ Export PNG (html-to-image)
- ⚠️ **Missing:** Public share links with slugs (schema exists, not implemented)
- ⚠️ **Missing:** SVG export
- ⚠️ **Missing:** Import DSL text functionality

### Additional Features Implemented

- ✅ Document panel with widgets (Requirements, Schema, API, LLD)
- ✅ Workspace modes tabs
- ✅ Command palette (cmdk)
- ✅ Selection action bar
- ✅ Comprehensive test suite (Vitest + Testing Library)
- ✅ Shape nodes and section badges

### 🚧 In Progress

- **Branch:** `fix-dashboard-ui-issues` — Minor dashboard UI refinements
- **Branch:** `arch-my-back-platform-roadmap` — This planning session

## 🧩 Core Concept: Widget/Primitive System

### Design Principles (Unix Philosophy)

**Each primitive should:**

1. **Do one thing well** — Focused, clear purpose
2. **Be composable** — Combine with other primitives to create flows
3. **Have clean interfaces** — Input/output contracts, not monoliths
4. **Be embeddable** — Work standalone or inside larger compositions

**Examples:**

- **Comparison Table** + **Canvas** + **Code Diff Viewer** → Feature comparison flow
- **Timeline** + **Code Path** + **Annotation Layer** → Request lifecycle walkthrough
- **Breadcrumb Navigator** + **Canvas** → Codebase exploration flow

### Widget Categories

#### 1. Visualization Primitives

- **Canvas** (existing — React Flow) — Node-edge diagrams, data flow
- **Timeline/Sequence** — Execution flow, request lifecycle
- **State Machine** — FSM visualization, workflow states
- **Comparison Table** — Side-by-side approach comparisons
- **Code Diff Viewer** — File changes, code evolution
- **Tree View** — File structure, dependency hierarchy

#### 2. Interaction Primitives

- **Step-through Debugger** — Navigate call chains, execution flow
- **Interactive Code Block** — Run/edit snippets inline
- **Annotation Layer** — Add notes/callouts to any widget
- **Quiz/Challenge** — Test understanding, interactive exercises
- **Sandbox** — "Try it yourself" environments
- **Slider/Parameter Control** — Adjust values, see live updates

#### 3. Context Primitives

- **Requirements Widget** (existing) — User stories, acceptance criteria
- **API Schema Widget** (existing) — Contract definitions
- **Trade-offs Card** — Pros/cons, decision records
- **Decision Record** — ADR format, context/decision/consequences
- **Real-world Examples** — "How Stripe does X", "How Netflix does Y"
- **Reference Links** — Eng blogs, talks, papers

#### 4. Flow Primitives

- **Guided Tour** — Step-by-step walkthroughs
- **Breadcrumb Navigator** — Show context (where am I?)
- **Progress Tracker** — Track learning path completion
- **Suggested Next Steps** — Adaptive learning paths
- **Checkpoint System** — Save progress, resume later

## 🚀 New Killer Feature: Interactive Deep Wiki (GitHub Repo Explorer)

### User Flow

**Phase 1: Analysis**

1. Paste GitHub repo URL
2. AI analyzes codebase, detects features (e.g., "Authentication", "Payment Processing", "File Upload")
3. Generates high-level architecture canvas automatically

**Phase 2: Exploration**

1. User clicks a feature to explore
2. Platform generates interactive breakdown using widgets:

- **Canvas:** File dependencies, data flow, function call graphs
- **Code Path Widget:** Step-through navigation
- **Timeline:** Request lifecycle for this feature
- **Document Widgets:** Requirements, API contracts
- **Comparison Widget:** "How Stripe does it vs. how we do it"

**Phase 3: Author Mode** (for repo owners/educators)

1. Annotate generated content
2. Add custom widgets and flows
3. Create "guided tours" through features
4. Link to real-world examples
5. Publish as interactive documentation

### Technical Scope

**MVP (Phase 4):**

- Multi-language support (JS/TS, Python, Go, Java via Tree-sitter or LSP)
- Full AST analysis for call graphs
- Feature detection via heuristics + AI
- File dependency graph on canvas
- Code path widget (navigate call chains)
- Author mode (annotations, custom widgets)

**Stretch Goals:**

- Private repo support (OAuth)
- Incremental updates (watch repo changes)
- Multi-repo projects (monorepo support)
- Live code search (grep-like within visualizations)

## 📊 Simulation Engine — On Hold (Design for Future)

**Decision:** Keep simulation in the roadmap, but defer implementation until primitives are mature.

**Vision:** Simulation should feel like a **video game** — watch systems work, break, and recover in real-time. Not just numbers, but **visual storytelling** of system behavior.

**Design Considerations (for when we build it):**

- Use existing **Canvas** + **Timeline** primitives
- Animated particles for data flow
- "Chaos mode" — click to kill nodes, inject latency
- Educational focus: "Why did this break? How can we fix it? How do companies solve this?"
- Pattern matching: Show real-world solutions (Circuit Breaker, Bulkhead, etc.)

**What we're building now that will power simulation:**

- Canvas rendering engine
- Edge/node state management
- Animation primitives
- Timeline widget
- Trade-offs cards

## 📅 Revised Phase Plan

### **Phase 3 — Widget/Primitive Library** (3-4 weeks)

**Goal:** Build the composable widget system that powers everything

**Priority Order (implement in this sequence):**

1. **Comparison Table** — Side-by-side approach comparisons (most requested)
2. **Timeline/Sequence** — Execution flow, request lifecycle
3. **Code Diff Viewer** — Show file changes, code evolution
4. **Annotation Layer** — Add notes/callouts to canvas
5. **Trade-offs Card** — Pros/cons, decision records
6. **Interactive Code Block** — Run/edit snippets
7. **Breadcrumb Navigator** — Show context (where am I in the codebase?)

**Deliverables:**

- Widget registry system (like component registry)
- Widget config schemas (schema-driven forms)
- Widget composition API (how widgets connect)
- Widget embedding system (iframe/export)
- 7 core widgets implemented and tested
- Widget documentation + examples

**Acceptance Criteria:**

- [ ] User can drag widgets onto canvas
- [ ] Widgets are composable (output of one → input of another)
- [ ] Each widget has clear input/output contract
- [ ] Widgets work standalone or embedded
- [ ] Examples showing widget combinations

### **Phase 4 — GitHub Wiki (Interactive Codebase Explorer)** (5-6 weeks)

**Goal:** The killer feature — turn any GitHub repo into an interactive learning experience

**MVP Deliverables:**

- GitHub URL input + repo analysis
- Multi-language AST parsing (JS/TS, Python, Go, Java)
- Feature detection (heuristics + AI)
- File dependency graph on canvas
- Code path widget (navigate call chains)
- Author mode (annotate, add custom widgets)
- Export to shareable link

**Stretch Goals:**

- Private repo support (GitHub OAuth)
- Guided tours (step-by-step walkthroughs)
- Real-time repo sync (watch for changes)
- Multi-repo/monorepo support

**Acceptance Criteria:**

- [ ] Paste GitHub URL → see feature list in < 30s
- [ ] Click feature → see interactive breakdown with 3+ widgets
- [ ] Author can annotate and customize generated content
- [ ] Export creates shareable public link
- [ ] Works for repos with 100+ files

### **Phase 5 — Real-Time Collaboration** (4-5 weeks)

**Goal:** Enable multi-user workflows (Option A: Real-time multiplayer, Google Docs-style)

**Deliverables:**

- **Multiplayer editing** (Y.js + Convex)
  - Live cursors and presence (who's viewing)
  - Conflict-free canvas updates (CRDT-based)
  - Chat sidebar for collaborators
  - Real-time widget updates
- **Permissions system**
  - Owner, editor, viewer roles
  - Invite by email/link
  - Public vs. private designs
  - Access control per widget/section
- **Activity feed**
  - Who changed what, when
  - Comment threads on canvas elements
  - @mentions and notifications
  - Version history with restore

**Acceptance Criteria:**

- [ ] Two users can edit same canvas simultaneously without conflicts
- [ ] Live cursors show remote user positions
- [ ] Chat sidebar works for coordination
- [ ] Permissions prevent unauthorized edits
- [ ] Activity feed shows recent changes

### **Phase 6 — Embed & Share** (2-3 weeks)

**Goal:** Make arch-my-back embeddable everywhere

**Deliverables:**

- **Public share links** (slugs: `arch-my-back.app/@user/design-name`)
- **Embed mode** (iframe, read-only interactive viewer)
- **Export formats:**
  - PNG (existing — enhance quality)
  - SVG (vector export for print)
  - Interactive HTML (self-contained, no server needed)
  - Markdown + images (for GitHub READMEs)
- **CDN for assets** (thumbnails, exports)
- **Open Graph metadata** (rich previews in Slack/Twitter)

**Acceptance Criteria:**

- [ ] Public links work without login
- [ ] Embed iframe renders interactive viewer
- [ ] All export formats preserve visual fidelity
- [ ] README export includes embedded images + links
- [ ] OG previews show thumbnail + description

### **Phase 7 — Community & Discovery** (5-6 weeks)

**Goal:** Build the learning ecosystem

**Deliverables:**

- **Public gallery** with search, filters, tags
  - Featured designs
  - Trending (most viewed/forked this week)
  - Categories (AWS patterns, microservices, data pipelines, etc.)
- **Template marketplace**
  - Pre-built examples (15+ professional templates)
  - Community contributions
  - "Clone this" one-click fork
  - Template ratings/reviews
- **Real-world examples library**
  - Curated: "How Stripe does payments", "How Netflix does recommendations"
  - Link to eng blogs, talks, papers
  - Cross-reference to relevant templates
- **Interactive tutorials**
  - System design challenges (e.g., "Design Instagram")
  - Guided learning paths (Beginner → Intermediate → Advanced)
  - Progress tracking and badges
  - Peer review system

**Acceptance Criteria:**

- [ ] Gallery shows 50+ public designs
- [ ] Search returns relevant results in < 1s
- [ ] Template marketplace has 15+ curated templates
- [ ] Real-world examples library has 30+ case studies
- [ ] Interactive tutorial completes end-to-end for 1 learning path

### **Phase 8 — Simulation Engine** (6-8 weeks) — *DEFERRED*

**Goal:** Video game-like system simulation

When we build this, it will use the primitives from Phase 3-7:

- Canvas for visualization
- Timeline for execution flow
- Annotation layer for breakage explanations
- Trade-offs cards for solution comparisons
- Real-world examples for pattern matching

See original "Simulation Engine" section for detailed algorithm design.

## 🏗️ Tech Stack (Unchanged)

| Layer | Technology | Rationale |
| --- | --- | --- |
| Frontend | React 19 + TypeScript | Ecosystem, React Flow compatibility |
| Canvas | React Flow v12 (@xyflow/react) | Best-in-class node editor |
| Styling | shadcn/ui (Tailwind + Radix) | Accessible, composable components |
| State | Zustand | Lightweight, temporal middleware for undo/redo |
| DSL Editor | CodeMirror 6 + Lezer | Custom grammar support, mobile-friendly |
| Backend | Convex | Real-time DB, auth, file storage |
| Auto-layout | ELK.js (light API + Web Worker) | Compound graph support |
| Build | Vite + pnpm | Fast, modern tooling |
| Deployment | Vercel (frontend) + Convex Cloud (backend) | Zero-config |

**Additions for GitHub Wiki:**

- **AST Parsing:** Tree-sitter (multi-language) or Language Server Protocol
- **Code Analysis:** Custom heuristics + OpenAI/Anthropic for feature detection
- **Graph Analysis:** NetworkX.js or similar for dependency graphs

## 🎨 UX Principles

### 1. Primitives-First

Every feature should be built as a composable primitive that can be reused, embedded, and combined.

### 2. Progressive Disclosure

Show simple by default, reveal complexity on demand (like 3-level config panel).

### 3. Visual-First, Code-Optional

Canvas and widgets are primary. DSL editor is hidden by default (power user toggle).

### 4. Interactive > Static

Replace static diagrams with explorable, interactive visualizations.

### 5. Educational > Accurate

Prioritize learning and understanding over production-grade accuracy (for now).

### 6. Embed Everywhere

Every widget, every canvas, every visualization should have an embed URL.

## 📦 Business Model Ideas

| Tier | Features | Price |
| --- | --- | --- |
| Free | Public designs, basic widgets, 5 GitHub repos/month | $0 |
| Pro | Private repos, advanced widgets, unlimited GitHub analysis, multiplayer | $15/mo |
| Teams | SSO, permissions, analytics, priority support | $50/user/mo |
| Enterprise | Self-hosted, custom widgets, SLA, dedicated support | Custom |

**Revenue from:**

- Pro subscriptions (individual devs)
- Team licenses (engineering orgs)
- Enterprise self-hosting
- Template marketplace (creator revenue share)
- API access for embedding

## 🔒 What We're NOT Building (Non-Goals)

### Removed/Deferred from Original Plan:

- ❌ **IaC Export** (Terraform, CDK) — Removed permanently. Diagrams lack infrastructure knowledge.
- ⏸️ **Simulation Engine** — Deferred to Phase 8. Build primitives first.
- ⏸️ **Cost Engine** — Deferred indefinitely. Focus on learning, not billing.
- ⏸️ **Mobile Editing** — Desktop-only for editing. Read-only mobile viewing is fine.

### Out of Scope:

- Performance profiling of running systems (use APM tools)
- Automated code generation from diagrams
- CI/CD integration (maybe later)
- Incident management workflows
- Monitoring/alerting (integrations possible, not core)

## 🧪 Testing Strategy

### Phase 3-7 Testing Priorities:

1. **Widget composability** — Verify widgets combine correctly
2. **GitHub analysis accuracy** — Test feature detection on 20+ real repos
3. **Multiplayer conflict resolution** — Y.js CRDT correctness
4. **Embed rendering** — Cross-browser iframe compatibility
5. **Performance** — Canvas with 200+ nodes + 10+ widgets

**Test Repos for GitHub Wiki:**

- Simple: todoist/todoist
- Medium: expressjs/express
- Complex: facebook/react, microsoft/vscode
- Multi-language: tensorflow/tensorflow

## 📊 Success Metrics

### Phase 3 (Widget Library)

- 7 widgets shipped and tested
- 3+ example combinations documented
- Widget API is stable (no breaking changes)

### Phase 4 (GitHub Wiki)

- 100 repos analyzed successfully
- 20 users create custom tours
- 5 public wikis featured in gallery

### Phase 5 (Collaboration)

- 50 designs have multiple collaborators
- 100 comment threads created
- Zero data loss incidents

### Phase 6 (Embed & Share)

- 1000 public share links created
- 100 embeds in external websites
- 50 README exports on GitHub

### Phase 7 (Community)

- 500 public designs in gallery
- 50 community-contributed templates
- 20 completed learning paths

## 🛡️ Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Widget complexity explosion | High | Strict composability rules, design reviews |
| GitHub API rate limits | Medium | Caching, incremental analysis, user tokens |
| Multi-language AST parsing fragility | High | Tree-sitter, fallback heuristics, test suite |
| Y.js multiplayer conflicts | Medium | Extensive testing, conflict resolution UX |
| Scope creep (too many widgets) | High | Prioritize ruthlessly, ship 7 widgets first |
| Embed security (XSS via iframe) | Medium | CSP headers, sandboxing, input sanitization |

## 🗓️ Timeline Summary

| Phase | Duration | Target Completion |
| --- | --- | --- |
| Phase 3 — Widget Library | 3-4 weeks | Week 4 |
| Phase 4 — GitHub Wiki | 5-6 weeks | Week 10 |
| Phase 5 — Collaboration | 4-5 weeks | Week 15 |
| Phase 6 — Embed & Share | 2-3 weeks | Week 18 |
| Phase 7 — Community | 5-6 weeks | Week 24 |
| Total to MVP+Community | ~20-24 weeks | ~6 months |

**Phase 8 (Simulation):** Deferred until primitives are mature and user-validated.

## 🎯 Immediate Next Steps

1. **Review this document** — User approval required before proceeding
2. **Create Phase 3 spec** — Detailed widget library implementation plan
3. **Design widget registry** — Architecture for composable primitives
4. **Prototype Comparison Table** — First widget to validate composability
5. **Set up GitHub API integration** — Foundation for Phase 4

## 📚 Appendix: Original Design Docs

The following sections are preserved from the original requirements for reference:

### The DSL: `archspec`

*(Full grammar, parser requirements, JSON interchange format preserved from original doc)*

### Component Library

*(10-15 launch types, registry structure preserved from original doc)*

### Convex Backend Schema

*(Revised schema preserved from original doc)*

### Simulation Algorithm (For Phase 8)

*(Graph-walking throughput calculator, workload profiles, latency model preserved from original doc)*

### Cost Estimation (Deferred)

*(Dual pricing schema, instance mapping preserved for future reference)*

**End of Requirements Document****Next:** Await user approval, then create Phase 3 detailed spec.