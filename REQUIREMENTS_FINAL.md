# arch-my-back — Final Requirements Document

> Consolidated from 5 parallel expert audits: DSL Design, Tech Stack, Convex Backend, Simulation Engine, and Product Strategy/UX.

---

## Product Vision

**The only architecture tool that lets you design a system and stress-test it before writing a single line of code.**

For senior engineers who need to design, document, and validate system architectures — combining visual diagramming with AI generation and throughput simulation. Unlike Excalidraw (meaningless drawings) or draw.io (no semantic understanding), arch-my-back knows what a Postgres replica set is and whether the architecture can handle 10K RPS. Unlike Eraser.io (the closest competitor), it simulates your design under load and shows you where it breaks.

---

## Target Users

| Persona | Description | Priority | Serves In |
|---|---|---|---|
| **A — Interview Preppers** | Practice system design, learn patterns | Viral wedge (free tier) | Phase 1+ |
| **B — Senior Engineers** | Document/communicate architecture decisions | Primary paying customer | Phase 1+ |
| **C — DevOps/SRE Teams** | Capacity planning, cost optimization | Expansion | Phase 5+ |

**v1 optimizes for Persona B, uses Persona A for growth.** Every Phase 1 feature decision must answer: "Does this help a senior engineer document or communicate an architecture?"

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + TypeScript | Ecosystem, React Flow compatibility |
| Canvas | React Flow v12 (@xyflow/react) | Best-in-class React node editor. ~150 node soft limit; build custom `CollapsibleGroup` node |
| Styling | **shadcn/ui** (Tailwind + Radix combined) | Pre-styled accessible components, copy-paste ownership, React Flow has shadcn-compatible kit |
| State | Zustand | Lightweight, React Flow recommends it, `temporal` middleware for undo/redo |
| DSL Editor | **CodeMirror 6 + Lezer** | 5-10x smaller than Monaco, better custom grammar support, mobile-friendly. Lazy-loaded. |
| DSL Parser | Custom TypeScript (Lezer grammar) | Bidirectional DSL <-> canvas. Lezer provides incremental parsing + error recovery |
| Backend | Convex | Real-time DB, auth, file storage, cron. Self-hostable as escape hatch |
| Auto-layout | ELK.js (light API + Web Worker) | Compound graph support, lazy-loaded (~300KB gzip), use `elkjs/lib/elk-api` |
| Simulation | Main thread (Tier 1-2), Web Worker (Tier 3) | No SharedArrayBuffer (breaks OAuth popups), no WASM needed |
| Build | Vite + pnpm | No monorepo — single project, well-organized `src/` directories |
| Deployment | Vercel (frontend) + Convex Cloud (backend) | Zero-config |

### Bundle Size Budget

| Chunk | Target (gzip) | Loading |
|---|---|---|
| Initial page load | **< 300 KB** | Immediate |
| ELK.js | ~300-400 KB | Lazy (on auto-layout trigger) |
| CodeMirror + Lezer | ~80-120 KB | Lazy (on DSL editor toggle) |
| Simulation engine | ~20-30 KB | Lazy (on simulation mode) |
| **Total (all chunks)** | **< 800 KB** | Progressive |

Use `size-limit` in CI to enforce budget. Preload lazy chunks on hover (hover "Auto Layout" → start loading ELK.js).

---

## The DSL: `archspec`

### Design Principles
- **Semantic source of truth**: The DSL represents architectural *meaning*. Canvas positions are stored separately.
- **AI-first**: LLMs generate JSON interchange format; serialize to DSL text for humans. The DSL exists so AI can generate diagrams.
- **Bidirectional**: Canvas -> DSL (serialize) and DSL -> Canvas (parse). Positions are a view concern stored separately in `canvasState`.
- **Diffable**: Text-based, meaningful git diffs.
- **Extensible**: New component types = new registry entries, zero grammar changes.

### Grammar (v1)

```
archspec v1

architecture "E-Commerce Platform" {

  // --- Variables ---
  vars {
    region: "us-east-1"
    default_runtime: "node:20"
  }

  // --- Groups (nestable, with identifiers) ---
  edge = group "Edge Layer" {
    cdn     = cdn "CloudFront" {}
    waf     = waf "API Firewall" { rules: ["rate-limit", "sqli", "xss"] }
    gateway = api_gateway "Kong Gateway" { rate_limit: 10000 }
  }

  compute = group "Compute" {
    api = app_server "Product API" {
      runtime:  ${default_runtime}
      replicas: 3
      cpu:      "2vCPU"
      memory:   "4GB"
    }

    worker = worker "Order Processor" {
      runtime:  "python:3.12"
      replicas: 2
    }
  }

  storage = group "Data Layer" {
    pg = postgres "Products DB" {
      storage:  "500GB"
      replicas: 2
      mode:     "primary-replica"
      profile:  "standard-oltp"
    }

    redis = cache "Session Store" {
      engine: "redis"
      memory: "6GB"
      ttl:    3600
    }

    s3 = object_storage "Media Bucket" {}
  }

  messaging = group "Async" {
    kafka = event_stream "Order Events" {
      engine:     "kafka"
      partitions: 12
      retention:  "7d"
    }
  }

  // --- Nested groups (region > VPC > subnet) ---
  aws = group "AWS" {
    region_east = group "us-east-1" {
      vpc = group "Production VPC" {
        // components here inherit the nesting context
      }
    }
  }

  // --- Connections (unified { } syntax) ---
  cdn -> waf -> gateway -> api               // chaining supported
  api -> pg      { protocol: "TCP", port: 5432, mode: "sync", fanOut: 0.2, label: "cache miss" }
  api -> redis   { protocol: "TCP", port: 6379, mode: "sync", fanOut: 1.0 }
  api -> kafka   { protocol: "TCP", port: 9092, mode: "async", fanOut: 1.0 }
  api -> s3      { protocol: "HTTPS", mode: "sync", fanOut: 0.05 }
  kafka -> worker { protocol: "AMQP", mode: "async" }
  worker -> pg   { protocol: "TCP", port: 5432, mode: "sync", label: "write" }
  api <-> redis  { label: "bidirectional cache" }  // bidirectional operator

  // --- Simulation (optional) ---
  simulation {
    rps:          10000
    duration:     "5m"
    ramp_up:      "30s"
    read_write:   "80:20"
    payload_size: "2KB"
  }
}
```

### Grammar Changes from Previous Draft

| Change | Before | After | Rationale |
|---|---|---|---|
| Version header | None | `archspec v1` | Prevents migration pain when grammar evolves |
| Group identifiers | `group "Edge" { }` | `edge = group "Edge" { }` | Groups can be referenced in connections and nested |
| Nested groups | Not supported | Unlimited nesting | Required for region > VPC > subnet hierarchies |
| Unified config syntax | `[key: val]` on connections | `{ key: val }` everywhere | One syntax for all key-value metadata |
| Connection operators | `->` only | `->`, `<->`, `<-`, `--` | Bidirectional, reverse, undirected associations |
| Connection chaining | Not supported | `a -> b -> c` | Reduces verbosity for linear chains |
| Variables | Not supported | `vars { }` block with `${var}` | Reduces duplication across components |
| Edge mode | Not specified | `mode: "sync" \| "async"` | Critical for correct simulation (see Simulation section) |
| Fan-out factor | Not specified | `fanOut: 0.2` per edge | Required for simulation — factors do NOT sum to 1.0 |
| Value types | Implicit | Explicit: string, number, boolean, array, null | Removes parsing ambiguity |

### Formal Value Type Grammar

| Type | Examples | Notes |
|---|---|---|
| string | `"hello"`, `"node:20"` | Required for values with `:`, `{`, `}`, spaces |
| number | `3`, `10000`, `0.5` | Integer or float |
| boolean | `true`, `false` | Lowercase only |
| array | `["a", "b"]` | JSON-style, homogeneous |
| null | `null` | Explicit absence |
| duration | `"5m"`, `"30s"`, `"7d"` | String with suffix (parsed by runtime) |
| size | `"4GB"`, `"500MB"` | String with suffix (parsed by runtime) |

### JSON Interchange Format (for AI)

LLMs generate JSON, not DSL text. JSON is validated against a formal JSON Schema (`archspec.schema.json`), then serialized to DSL text.

```json
{
  "archspec_version": "1.0",
  "name": "E-Commerce Platform",
  "components": [
    { "id": "cdn", "type": "cdn", "label": "CloudFront", "group": "edge", "config": {} },
    { "id": "api", "type": "app_server", "label": "Product API", "group": "compute", "config": { "runtime": "node:20", "replicas": 3 } },
    { "id": "pg", "type": "postgres", "label": "Products DB", "group": "storage", "config": { "replicas": 2, "profile": "standard-oltp" } }
  ],
  "groups": [
    { "id": "edge", "label": "Edge Layer", "parent": null },
    { "id": "compute", "label": "Compute", "parent": null },
    { "id": "storage", "label": "Data Layer", "parent": null }
  ],
  "connections": [
    { "from": "cdn", "to": "api", "config": { "protocol": "HTTPS" } },
    { "from": "api", "to": "pg", "config": { "protocol": "TCP", "port": 5432, "mode": "sync", "fanOut": 0.2 } }
  ]
}
```

**Minimal AI profile** (simplest valid output for LLMs):
```json
{
  "archspec_version": "1.0",
  "name": "URL Shortener",
  "components": [
    { "id": "api", "type": "app_server", "label": "API" },
    { "id": "db", "type": "postgres", "label": "Database" }
  ],
  "connections": [
    { "from": "api", "to": "db" }
  ]
}
```

No groups, no config, no simulation. LLMs generate this; users enrich.

### Parser Requirements

- **Error recovery**: Parser must return partial results + diagnostics when DSL is invalid (user is mid-typing). Use Lezer's built-in error recovery. Canvas renders whatever is valid; does not go blank on first syntax error.
- **CanvasStatePatcher**: `(oldDSL, newDSL, oldCanvasState) -> newCanvasState`. Detects renames via identifier diffing, places new nodes near group siblings, prunes deleted nodes, preserves positions for unchanged nodes.
- **Canonical formatter**: 2-space indent, one component per line, blank line between groups, connections after components, simulation block last. Ensures diffs are always meaningful.
- **Globally unique component IDs**: Required within an architecture block. Keeps connection references simple.

### Future Grammar Extensions (designed for, not built yet)

- **`views` block** (Structurizr-inspired): Multiple filtered views of the same model.
- **User-defined component types**: `type legacy_monolith { ... }` for custom components.
- **Imports/composition**: `...@file.archspec` for modular architectures.

---

## Component Library

### Phase 1 Launch Set (10-15 types)

Start lean. Add more based on user requests, not speculation.

| Type Key | Display Name | Category |
|---|---|---|
| `app_server` | App Server | Compute |
| `worker` | Worker | Compute |
| `serverless` | Serverless Function | Compute |
| `load_balancer` | Load Balancer | Traffic |
| `api_gateway` | API Gateway | Traffic |
| `cdn` | CDN | Traffic |
| `postgres` | PostgreSQL | Storage |
| `redis` | Redis | Caching |
| `kafka` | Event Stream | Messaging |
| `object_storage` | Object Storage (S3) | Storage |
| `websocket` | WebSocket Server | Messaging |
| `external_api` | Third-party API | External |

### Post-Launch Additions (add per user demand)

`mongo`, `dynamodb`, `mysql`, `cassandra`, `elasticsearch`, `sqs`, `rabbitmq`, `kinesis`, `pubsub`, `memcached`, `waf`, `dns`, `ingress`, `auth_service`, `rate_limiter`, `ml_inference`, `notification`, `payment`, `logging`, `metrics`, `tracing`, `alerting`, `cron`, `k8s_cluster`, `cert_manager`, `secrets_manager`, `block_storage`, `cdn_cache`, `app_cache`

### Component Registry Structure

```typescript
interface ComponentType {
  key: string;                    // "postgres"
  label: string;                  // "PostgreSQL"
  category: string;               // "Storage"
  icon: string;                   // icon identifier
  configSchema: JSONSchema;       // drives config panel form
  defaultConfig: Record<string, unknown>;
  primaryFields: string[];        // shown in Level 1 config (progressive disclosure)

  // Simulation (Phase 3)
  capacityModel: CapacityModel;
  workloadProfiles: Record<string, WorkloadProfile>;

  // Cost (Phase 5)
  pricingModel: "provisioned" | "usage-based";
  costMapping: CostMapping;
}
```

### Config Panel: Progressive Disclosure

| Level | What Shows | When |
|---|---|---|
| **Level 1 — Quick Config** | 2-3 `primaryFields` only (e.g., `replicas`, `mode` for Postgres) | Always visible on node click |
| **Level 2 — Full Config** | All schema fields in expandable accordion | Click "Advanced" |
| **Level 3 — Raw JSON** | Mini JSON editor for the config block | Click "Edit as JSON" |

---

## Convex Backend Schema (Revised)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  // Design metadata (lightweight — fetched in list views)
  designs: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    isPublic: v.boolean(),
    forkedFrom: v.optional(v.id("designs")),
    thumbnailStorageId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_public_created", ["isPublic", "_creationTime"])
    .index("by_fork_source", ["forkedFrom"])
    .searchIndex("search_title", { searchField: "title" }),

  // Design content (heavy — fetched only when opening a design)
  designContent: defineTable({
    designId: v.id("designs"),
    dsl: v.string(),
  }).index("by_design", ["designId"]),

  // Canvas layout (separate from DSL — granular updates, less bandwidth)
  designLayout: defineTable({
    designId: v.id("designs"),
    canvasState: v.string(),  // JSON: node positions, viewport, zoom
  }).index("by_design", ["designId"]),

  designVersions: defineTable({
    designId: v.id("designs"),
    version: v.number(),
    dsl: v.string(),
    canvasState: v.string(),
    createdAt: v.number(),
    message: v.optional(v.string()),
  }).index("by_design", ["designId", "version"]),

  templates: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    dsl: v.string(),
    canvasState: v.string(),
    thumbnailStorageId: v.optional(v.id("_storage")),
  }).index("by_slug", ["slug"]),

  stars: defineTable({
    userId: v.id("users"),
    designId: v.id("designs"),
  })
    .index("by_user", ["userId"])
    .index("by_design", ["designId"])
    .index("by_user_design", ["userId", "designId"]),

  collaborators: defineTable({
    designId: v.id("designs"),
    userId: v.id("users"),
    role: v.union(v.literal("editor"), v.literal("viewer")),
  })
    .index("by_design", ["designId"])
    .index("by_user", ["userId"])
    .index("by_design_user", ["designId", "userId"]),

  // AI generation audit trail
  aiGenerations: defineTable({
    userId: v.optional(v.id("users")),
    prompt: v.string(),
    generatedDsl: v.string(),
    model: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Cloud pricing data (Phase 5)
  pricingData: defineTable({
    provider: v.string(),
    componentType: v.string(),
    tier: v.string(),
    pricePerHour: v.optional(v.number()),
    pricePerUnit: v.optional(v.number()),
    unitType: v.optional(v.string()),
    region: v.string(),
    updatedAt: v.number(),
  }).index("by_provider_type", ["provider", "componentType"]),

  // Share links with optional expiry
  shareLinks: defineTable({
    designId: v.id("designs"),
    slug: v.string(),
    expiresAt: v.optional(v.number()),
    accessCount: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_design", ["designId"]),
});
```

### Key Schema Decisions

1. **Split `designs` into 3 tables**: `designs` (metadata, lightweight), `designContent` (DSL text), `designLayout` (canvas positions). This prevents bandwidth amplification — a node drag only re-transmits layout, not the full DSL.

2. **List queries never fetch DSL or canvasState**. Gallery and dashboard queries read only from `designs` (title, thumbnail, timestamps).

3. **Convex CANNOT replace Y.js for multiplayer editing**. OCC causes conflicts under concurrent edits. Phase 7 multiplayer will use Y.js with Convex as persistence layer. Single-user editing with Convex reactive queries works fine for Phases 1-6.

4. **AI generation runs as Convex Actions** (10-minute timeout, Node.js runtime). User submits prompt -> action calls LLM API -> mutation saves generated DSL. Rate-limited to 10 generations/hour/user on free tier.

5. **Thumbnail generation is client-side** (html-to-image on save). Zero infrastructure. Move to server-side only if needed for designs the user hasn't opened.

6. **Put a CDN in front of public assets**. Vercel Edge or Cloudflare for thumbnails and shared design previews. Do not serve high-traffic assets directly from Convex file storage.

---

## Simulation Engine

### Core Model: Graph-Walking Throughput Calculator

Not discrete event simulation. A static capacity analysis that runs in O(V+E) time, fast enough to recompute on every RPS slider change.

### Edge Properties (Critical)

Every connection has:
```typescript
interface EdgeConfig {
  mode: "sync" | "async";  // sync: blocks caller. async: fire-and-forget
  fanOut: number;           // default 1.0. How many downstream requests per upstream request
                            // Factors do NOT sum to 1.0. API at 10K RPS can generate
                            // 10K cache reads + 2K DB reads + 10K Kafka writes = 22K downstream
}
```

### Workload Profiles (Instead of Raw Numbers)

Users pick from a dropdown, not number fields. 1 choice replaces 20 parameters.

```typescript
const postgresProfiles = {
  "simple-kv": {
    description: "Primary key lookups, simple inserts",
    maxQPS: 30000, p50LatencyMs: 1, p99LatencyMs: 5,
  },
  "standard-oltp": {
    description: "Mix of indexed queries, joins, transactions",
    maxQPS: 5000, p50LatencyMs: 3, p99LatencyMs: 25,
  },
  "complex-analytics": {
    description: "Aggregations, reports, unindexed scans",
    maxQPS: 200, p50LatencyMs: 50, p99LatencyMs: 500,
  },
  "mixed-80-20": {
    description: "80% reads (indexed), 20% writes",
    maxQPS: 8000, p50LatencyMs: 2, p99LatencyMs: 15,
  },
};
```

### Algorithm (Tier 1)

```
1. Topological sort of component graph
2. Propagate RPS from entry node through edges:
   - downstream_rps = upstream_rps * edge.fanOut
   - Fan-in: sum contributions from all incoming edges
3. Compute utilization per node:
   - utilization = actual_rps / (maxQPS * replicas)
4. Compute latency along critical path:
   - For parallel sync fan-out: max(downstream_latencies)  // NOT sum!
   - For sequential chains: sum(hop_latencies)
   - Apply M/M/1 queuing delay: effective_latency = base_latency / (1 - utilization)
     (At 50% util: 2x latency. At 80%: 5x. At 95%: 20x.)
   - Async edges do NOT contribute to request latency
5. Identify bottlenecks:
   - All nodes ≥ 80%: "at risk" (yellow)
   - All nodes ≥ 100%: "bottleneck" (red)
   - Run cascade analysis: if a bottleneck increases upstream latency,
     does upstream concurrency exceed its limit?
6. Async queue analysis:
   - queue_growth_rate = producer_rps - consumer_throughput
   - If positive, flag as "queue building" with estimated lag
```

### Latency Model Fix

The previous doc said "sum of per-hop latencies." This is **wrong for parallel fan-out**.

```
api calls redis AND postgres concurrently:
  Correct:   api_latency + max(redis_latency, pg_latency)
  Wrong:     api_latency + redis_latency + pg_latency
```

Default to **parallel** for compute node fan-out (API servers issue concurrent calls). Default to **sequential** for chain hops (CDN -> WAF -> Gateway). Override per-node with `callPattern: "parallel" | "sequential"`.

### Visualization

- **Canvas IS the dashboard**. Do not make users switch between diagram and metrics views.
- Components turn green/yellow/red based on saturation.
- Bottleneck gets pulsing red border + label: "Bottleneck: 120% capacity"
- Edge thickness scales with throughput.
- Hovering any component shows tooltip: "2,500 RPS / 5,000 max (50% saturated)"
- **Animated particles**: Use logarithmic particle count (`log2(rps)` = ~16 particles at 50K RPS). Particle speed encodes relative magnitude. If perf issues, use WebGL overlay (pixi.js) for particles instead of SVG.

### Chaos Lite (Phase 3, not Phase 5)

Basic chaos is just parameter mutation + static recomputation:
- **Kill node**: set capacity to 0, recompute graph, see instant cascade coloring
- **Latency injection**: multiply latency by N, see upstream impact
- **Sever edge**: remove connection, see traffic redistribution
- No time animation needed. "Here's the steady state with this node gone."

Reserve animated cascade propagation (time-stepped failure wave) for Phase 6.

---

## Cost Estimation

### Dual Pricing Schema

```typescript
// Provisioned resources (VMs, managed DBs, caches)
interface ProvisionedPricing {
  provider: string;
  componentType: string;
  tier: string;
  pricePerHour: number;
  region: string;
}

// Usage-based resources (Lambda, SQS, DynamoDB, S3, data transfer)
interface UsageBasedPricing {
  provider: string;
  componentType: string;
  tier: string;
  pricePerUnit: number;
  unitType: "request" | "GB" | "million_invocations" | "GB_month";
  freeTierMonthly: number;
  region: string;
}
```

Without usage-based pricing, cannot price Lambda, SQS, DynamoDB, S3, or API Gateway.

### Abstract-to-Concrete Instance Mapping

DSL says `cpu: "2vCPU", memory: "4GB"`. Tool maps to cheapest matching instance type per provider and shows the user what was chosen: "Product API (2vCPU/4GB) -> AWS t3.medium @ $0.0416/hr." User can override.

### Data Transfer Costs (The Missing 30%)

Data transfer is 15-30% of real cloud bills. Model it using edge RPS + payload size:

```
monthly_transfer_gb = rps * seconds_per_month * (request_bytes + response_bytes) / 1GB
```

Infer cross-AZ/cross-region from group nesting. Surface as separate line item. Warn if transfer > 20% of compute cost.

### Cost Display

- Show confidence band, not point estimate: "Estimated monthly cost: $2,400 - $3,800"
- Prominent disclaimers: on-demand only, excludes support/tax/NAT, steady-state assumption
- Separate line items: compute, storage, data transfer, per-request services

---

## UX Design

### First-Time Experience

**Never show an empty canvas.** Landing screen offers three entry points:

1. **"Start from a template"** — Grid of 5 templates with preview thumbnails
2. **"Describe your architecture"** — AI prompt bar, prominent and centered. Placeholder: "Design a URL shortener that handles 10K requests per second"
3. **"Start from scratch"** — Opens empty canvas (power users)

### DSL Editor

- **Hidden by default**. Small "Code" toggle in toolbar.
- Toggle on: canvas 60% width, CodeMirror editor 40% right pane.
- Persistent preference per user.
- "Copy DSL" button available even without editor open (for pasting into PRs).
- Full syntax highlighting, autocomplete for component types, error squiggles via Lezer.

### Simulation Entry

1. "Simulate" button in top toolbar (appears only when diagram has entry point + downstream component)
2. Bottom panel opens with: RPS slider + presets (100, 1K, 10K, 100K), read/write ratio, "Run" button
3. Traffic profile summary: "10,000 RPS entering at `gateway`, 80% reads, 2KB payload"
4. Results render on canvas (color-coding + tooltips), not in separate charts

### Mobile

**Desktop-only for editing.** Shared designs are viewable read-only on mobile with pinch-to-zoom. Show "Best experienced on desktop" below 1024px.

---

## Phase Plan (Revised)

### Phase 0 — Validation Alpha (2-3 weeks)

Validate the concept before investing in DSL infrastructure.

- [ ] Vite + React + TypeScript + pnpm + shadcn/ui setup
- [ ] React Flow canvas with drag-and-drop from sidebar
- [ ] 10 core component types (not 40+) with icons
- [ ] Directional edge wiring with labels
- [ ] Basic component config panel (hardcoded forms, not schema-driven)
- [ ] Export as PNG
- [ ] 1 hardcoded template: "URL Shortener" on canvas
- [ ] LocalStorage persistence only
- [ ] No auth, no DSL, no auto-layout

**Goal**: Put in front of 50 engineers. "Would you use this instead of Excalidraw for system design?"

### Phase 1 — DSL + AI + Canvas Core

- [ ] Define `archspec v1` grammar (Lezer grammar file)
- [ ] Build DSL parser/serializer (TypeScript, error-recovering)
- [ ] Build `archspec.schema.json` (formal JSON Schema for AI)
- [ ] Build component type registry (10-15 types, config schemas, icons)
- [ ] Schema-driven config panel with progressive disclosure
- [ ] Group / bounding boxes (nestable)
- [ ] Auto-layout with ELK.js (lazy-loaded, Web Worker)
- [ ] DSL editor toggle (CodeMirror 6 + Lezer, hidden by default, lazy-loaded)
- [ ] Bidirectional DSL <-> canvas sync with CanvasStatePatcher
- [ ] **AI prompt bar**: natural language -> JSON (via LLM) -> DSL -> canvas
- [ ] 5 templates as archspec DSL (anonymous access, no auth required)
- [ ] Template browser with preview thumbnails
- [ ] Undo / redo (Zustand temporal)
- [ ] Keyboard shortcuts
- [ ] Mini-map and zoom

### Phase 2 — Auth + Sharing (Growth)

- [ ] Initialize Convex project with revised schema
- [ ] Convex Auth (GitHub + Google OAuth)
- [ ] Save / load designs to Convex
- [ ] User dashboard ("My designs")
- [ ] Shareable public links (slug-based)
- [ ] Fork designs
- [ ] Export: PNG, SVG, archspec DSL text
- [ ] Import: archspec DSL text -> canvas
- [ ] Client-side thumbnail generation on save

### Phase 3 — Simulation Engine + Chaos Lite

- [ ] Define workload profiles per component type
- [ ] Define edge properties: mode (sync/async), fanOut factor
- [ ] Build graph-walking throughput calculator (Tier 1 algorithm)
- [ ] RPS slider with live saturation % display
- [ ] M/M/1 queuing delay model
- [ ] Parallel vs sequential latency for fan-out
- [ ] Bottleneck detection + cascade analysis (second pass)
- [ ] Async queue depth analysis
- [ ] Canvas color-coding (green/yellow/red) + bottleneck pulsing
- [ ] Hover tooltips with per-component metrics
- [ ] Animated particle flow (Tier 2, log-scale particle count)
- [ ] Bottom panel: simulation controls + traffic profile
- [ ] **Chaos Lite**: kill node, latency injection, sever edge (static recomputation)

### Phase 4 — Versioning + Polish (Retention)

- [ ] Design versioning (snapshots with DSL text diff view)
- [ ] Dark mode
- [ ] Connection bandwidth/latency annotations
- [ ] Additional component types based on user requests
- [ ] Expand to 10 templates

### Phase 5 — Cost Engine

- [ ] Curated pricing table in Convex (provisioned + usage-based schemas)
- [ ] Abstract-to-concrete instance mapping
- [ ] Live $/hr ticker on canvas
- [ ] Cost breakdown panel (compute, storage, data transfer, per-request)
- [ ] Provider comparison (AWS vs GCP vs Azure)
- [ ] Monthly cost projection with confidence band
- [ ] Data transfer cost modeling from edge RPS + payload size
- [ ] Convex cron for periodic pricing refresh

### Phase 6 — Advanced Simulation + Chaos

- [ ] Tier 3 simulation: ramp-up curves, burst patterns
- [ ] Auto-scaling response (replicas spin up/down)
- [ ] Queue depth accumulation over simulated time (Web Worker)
- [ ] Time-series metrics charts
- [ ] Animated cascade failure propagation
- [ ] Recovery behavior simulation

### Phase 7 — Community + Collaboration

- [ ] Public gallery with search and stars
- [ ] Multiplayer editing (Y.js + Convex persistence, NOT Convex OCC)
- [ ] Freehand drawing layer (Y.js)
- [ ] Embed mode (iframe, read-only interactive)
- [ ] Expand to 15+ templates
- [ ] CDN for public assets

---

## Resolved Decisions

| Question | Decision | Rationale |
|---|---|---|
| Monaco vs CodeMirror? | **CodeMirror 6** | 5-10x smaller bundle, Lezer is purpose-built for custom grammars, better mobile support. Sourcegraph and Replit both migrated away from Monaco. |
| Dagre vs ELK.js? | **ELK.js** | Native compound graph support for groups. Dagre cannot do this. Lazy-load to mitigate bundle size. |
| Monorepo? | **No** | Single Vite project. Monorepo is premature with one application. |
| shadcn/ui vs raw Radix? | **shadcn/ui** | Pre-styled components, copy-paste ownership, React Flow has compatible kit. |
| Zustand vs Jotai vs XState? | **Zustand only** | Zustand for all state. Jotai adds no value here. XState only if Phase 3 simulation has 5+ states with 10+ transitions. |
| Web Workers? | **Not until Tier 3** | Tier 1-2 runs synchronously on main thread in sub-millisecond time. |
| WASM for simulation? | **No** | JS handles the computation. WASM only justified for full DES with stochastic queuing models. |
| Multiplayer tech? | **Y.js (Phase 7)** | Convex OCC causes conflicts under concurrent edits. Y.js CRDTs merge without conflict. Convex as persistence. |
| IaC export? | **Removed** | Diagrams lack implicit infrastructure knowledge (IAM, security groups, networking). Revisit only at maturity. |
| Mobile? | **Desktop-only** for editing | Read-only viewing of shared designs on mobile. |
| DSL editor default? | **Hidden** | Toggle for power users. Default is visual-first with AI prompt bar. |

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| React Flow perf at 150+ nodes | Medium | CollapsibleGroup nodes, memoization, disable grid at zoom, soft limit warning |
| Convex bandwidth cost at scale | Medium | Normalized schema, narrow queries, CDN for public assets, cost alert at $100/mo |
| Convex vendor lock-in | Low | Open-source self-hosting available. Code runs unchanged. Supabase as Plan B. |
| archspec DSL is untrained for LLMs | Medium | AI generates JSON (not DSL text). JSON Schema as LLM constraint. Few-shot examples. |
| Bidirectional sync complexity | High | CanvasStatePatcher handles renames/adds/deletes. Error-recovering parser. Extensive test suite. |
| Scope creep | High | Phase 0 validates concept before DSL investment. Each phase ships independently. |
| ELK.js bundle size (300KB+) | Low | Lazy-loaded via Web Worker. Not in initial bundle. |
| Custom DSL zero ecosystem | Medium | DSL is internal representation. Users interact via canvas + AI. Power users get editor. Don't market the DSL; market AI generation. |

---

## Competitive Positioning

| vs | Our Advantage |
|---|---|
| Excalidraw | Semantic understanding of components. Not just drawings — these are typed, configurable, simulatable models. |
| draw.io | Opinionated for system design. AI generation. Simulation. Version-controllable DSL. |
| Eraser.io | Throughput simulation that shows where your design breaks. Eraser can draw it; we can stress-test it. |
| Cloudcraft | Greenfield design tool (Cloudcraft is for existing infra). Multi-cloud. Free tier. |
| Miro/FigJam | Technical depth. Miro is for brainstorming; we are for engineering. |
