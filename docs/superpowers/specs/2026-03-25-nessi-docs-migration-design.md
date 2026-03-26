# Nessi Docs — Migration from Playground to Next.js App

**Date:** 2026-03-25
**Status:** Draft
**Repo:** nessi-docs (docs.nessifishingsupply.com)
**Source of truth:** nessi-web-app (nessifishingsupply.com)

---

## 1. Purpose

Nessi Docs is a documentation, visualization, and testing tool for the Nessi fishing marketplace. It renders interactive user journeys, API contracts, data models, data lifecycles, and coverage dashboards so the product team can review, test, and understand the full system.

The app must stay 100% accurate to the nessi-web-app codebase automatically. When code merges to main in nessi-web-app, this app updates itself via CI. No manual maintenance.

### Non-goals

- This is not a customer-facing site. It's an internal product team tool.
- No auth, no user accounts, no API routes in this app.
- No runtime data fetching — fully static (SSG).

---

## 2. Design Decisions (from brainstorming)

| Decision                     | Choice                                                      | Rationale                                                                    |
| ---------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Theme                        | Dark mode only                                              | Internal dev tool. Matches the prototyped playground. Techy SaaS feel.       |
| Existing timeline components | Remove                                                      | The 2D SVG canvas replaces them. Dead code creates confusion.                |
| Data sourcing                | Automated extraction + CI sync                              | "Set and forget" — accuracy is non-negotiable.                               |
| Journey authoring            | Expanded JSON schema in nessi-web-app                       | Lives next to the code it describes. Claude assists during feature work.     |
| Layout                       | Three-column: sidebar + canvas + detail panel               | Proven in playground prototype.                                              |
| Logo                         | Pull real Nessi SVG logo from nessi-web-app + "docs" suffix | Brand continuity.                                                            |
| Cross-linking                | Deep links between journeys, API, data model, lifecycles    | Click an API route in a journey step → navigate to that endpoint in API Map. |

---

## 3. Architecture

### 3.1 App Shell Layout

```
+--------+----------------------------------+-----------+
| Topbar | Logo + "docs" + site URL                     |
+--------+----------------------------------+-----------+
|        |                                  |           |
| Side-  |  Main Content Area               |  Detail   |
| bar    |  (Canvas for Journeys/Lifecycles) |  Panel    |
| 220px  |  (Scrollable for API/Data/Cov)   |  280px    |
|        |                                  |           |
|  Nav   |  Pan/zoom SVG or list view       |  Context- |
|  +     |                                  |  ual info |
|  Sub-  |  Filter bar (collapsible,        |  for      |
|  nav   |  top of canvas, journeys only)   |  selected |
|        |                                  |  item     |
+--------+----------------------------------+-----------+
```

- **Topbar (48px):** Nessi logo SVG (from nessi-web-app/src/assets/logos/) + "docs" label + `docs.nessifishingsupply.com`.
- **Sidebar (220px):** 5 main nav items (Journeys, API Map, Data Model, Data Lifecycles, Coverage). Contextual sub-nav appears below a separator when on Journeys or Lifecycles pages, showing the list of items for that section.
- **Canvas (flex):** SVG with pan/zoom for Journeys and Lifecycles. Scrollable content for API Map, Data Model, Coverage.
- **Detail Panel (280px):** Always visible. Shows contextual details for whatever is selected. Includes "Why this exists" explanations, cross-links to related pages, route/code references, error cases. Empty state with hint text when nothing is selected.

### 3.2 Root Layout (Next.js)

The three-column grid is the root layout. It wraps all pages. The sidebar and detail panel are persistent client components that read from a shared state provider (React context or Zustand).

```
src/app/layout.tsx        → Dark mode globals, fonts, AppShell wrapper
src/app/page.tsx          → Redirect to /journeys (or dashboard landing)
```

### 3.3 Pages & Routes

```
/journeys                 → Redirects to first journey (or shows journey index)
/journeys/[slug]          → 2D SVG canvas with decision nodes, path tracing
/api                      → API endpoint list grouped by domain
/data                     → Data model entity cards with expandable fields
/lifecycles               → Redirects to first lifecycle
/lifecycles/[slug]        → SVG state machine canvas
/coverage                 → Build/test coverage dashboard per journey
```

Each page is a Server Component that loads data at build time via `generateStaticParams()`.

### 3.4 Shared State

A lightweight React context (`DocsContext`) provides:

- `selectedItem: object | null` — what's currently selected (step, endpoint, entity, state, coverage card)
- `setSelectedItem(item)` — called by canvas node clicks, list item clicks, etc.
- Cross-link navigation: `navigateTo(page, slug, highlightId?)` — e.g., `navigateTo('api', 'authentication', 'POST /api/auth/register')` navigates to the API page and auto-selects that endpoint. `slug` identifies the page/section, `highlightId` optionally selects an item within it.

The detail panel subscribes to `selectedItem` and renders the appropriate panel variant.

---

## 4. Component Architecture

### 4.1 Layout Components

```
src/components/layout/
  app-shell/              → Three-column grid wrapper
    index.tsx
    app-shell.module.scss
  sidebar/                → Main nav + contextual sub-nav
    index.tsx
    sidebar.module.scss
  detail-panel/           → Universal detail panel with variant renderers
    index.tsx
    detail-panel.module.scss
    panels/
      step-panel.tsx      → Journey step details + cross-links
      api-panel.tsx       → API endpoint details + cross-links
      entity-panel.tsx    → Data model entity details
      lifecycle-panel.tsx → Lifecycle state details (incoming/outgoing transitions)
      coverage-panel.tsx  → Coverage breakdown per journey
  topbar/
    index.tsx
    topbar.module.scss
```

### 4.2 Canvas Components

The SVG canvas engine is shared between Journeys and Lifecycles.

```
src/features/canvas/
  canvas-provider/        → Pan/zoom state, viewBox calculation, mouse handlers
    index.tsx             → Client component ('use client')
    canvas-provider.module.scss
  components/
    step-node.tsx         → SVG step card (layer-colored, status dot, error badge)
    entry-node.tsx        → SVG pill-shaped entry point
    decision-node.tsx     → SVG diamond with option pills, click to choose path
    state-node.tsx        → SVG lifecycle state card (for lifecycle canvas)
    edge.tsx              → Bezier connection with arrow marker
    animated-edge.tsx     → Flowing particle animation on edges
    label-pill.tsx        → Rounded rect label along an edge (for lifecycle transitions)
  hooks/
    use-pan-zoom.ts       → Pan/zoom state + mouse event handlers
    use-path-trace.ts     → Decision path tracing (chosenPath, litNodes, litEdges)
    use-viewport.ts       → ViewBox calculation from node bounds
```

### 4.3 Page-Specific Components

```
src/features/journeys/
  journey-canvas/         → Renders a journey's nodes + edges on the canvas
    index.tsx
  journey-filters/        → Layer + status filter chips (collapsible bar)
    index.tsx

src/features/api-map/
  api-list/               → Grouped endpoint listing, clickable rows
    index.tsx
    api-list.module.scss

src/features/data-model/
  entity-list/            → Expandable entity cards with field tables
    index.tsx
    entity-list.module.scss

src/features/lifecycles/
  lifecycle-canvas/       → Renders a lifecycle's states + transitions on the canvas
    index.tsx

src/features/coverage/
  coverage-list/          → Coverage dashboard cards with progress bars
    index.tsx
    coverage-list.module.scss
```

---

## 5. Data Architecture

### 5.1 Data Files (in nessi-docs)

```
src/data/
  journeys/               → Journey JSON files (synced from nessi-web-app)
    signup.json
    guest-cart.json
    shop-invite-acceptance.json
    onboarding.json
    ... (all 9 personas)
    index.ts              → Exports getAllJourneys(), getJourney(slug)
  api-contracts.json      → Generated: all API endpoints with methods, paths, descriptions
  data-model.json         → Generated: all DB tables with columns, types, constraints
  lifecycles.json         → Generated: status enums + transition maps
  index.ts                → Unified data access layer
```

### 5.2 Journey JSON Schema (Expanded)

The existing schema supports steps, branches, and error cases. We extend it to capture UX behaviors:

```typescript
interface Step {
  id: string;
  label: string;
  layer: StepLayer; // client | server | database | background | email | external
  status: StepStatus; // planned | built | tested
  route?: string; // API endpoint (e.g., "POST /api/auth/register")
  codeRef?: string; // Source file path
  notes?: string; // Implementation notes
  why?: string; // "Why this exists" explanation
  errorCases?: ErrorCase[];
  // NEW: UX behavior annotations
  ux?: {
    toast?: string; // Toast message shown (e.g., "Added to cart")
    redirect?: string; // Redirect destination (e.g., "/dashboard")
    modal?: string; // Modal opened (e.g., "OTP input modal")
    email?: string; // Email sent (e.g., "Shop invite via Resend")
    notification?: string; // In-app notification
    stateChange?: string; // Client state mutation (e.g., "Zustand cart badge updates")
  };
}
```

### 5.3 Canvas Layout Data

Each journey and lifecycle includes 2D positions for canvas rendering:

```typescript
// Journey nodes have x,y positions for the canvas
interface JourneyNode {
  id: string;
  type: 'entry' | 'step' | 'decision';
  label: string;
  x: number;
  y: number;
  // ... step fields when type === 'step'
  options?: DecisionOption[]; // when type === 'decision'
}

interface JourneyEdge {
  from: string;
  to: string;
  opt?: string; // Decision option label (makes this a decision edge)
}
```

This is the same format used in the playground. Canvas positions are authored alongside the journey data in nessi-web-app.

### 5.4 Cross-Link Index

At build time, generate a cross-reference index:

```typescript
// Auto-generated from journey + API + data model data
interface CrossLinkIndex {
  routeToJourneySteps: Record<string, { journey: string; step: string }[]>;
  tableToEndpoints: Record<string, string[]>;
  endpointToJourneys: Record<string, string[]>;
}
```

This powers the "Used in: Signup (Step 3)" and "View in API Map →" links in the detail panel.

---

## 6. CI/CD Pipeline — Data Extraction & Sync

### 6.1 Extraction Scripts (live in nessi-web-app)

```
nessi-web-app/
  scripts/docs-extract/
    extract-api-routes.ts     → Walk src/app/api/, extract paths + methods
    extract-data-model.ts     → Parse src/types/database.ts → tables/columns
    extract-lifecycles.ts     → Parse status enums + transition maps
    index.ts                  → Orchestrator: runs all extractors, writes JSON
```

**API Route Extractor:**

- Walks `src/app/api/` directory tree
- For each `route.ts`: reads exported function names (GET, POST, PUT, PATCH, DELETE)
- Builds the path from directory structure (e.g., `api/shops/[id]/invites/[inviteId]/resend`)
- Output: `api-contracts.json`

**Data Model Extractor:**

- Parses `src/types/database.ts` (Supabase generated types)
- Extracts table names, column names, types, nullability
- Enriches with migration data (constraints, defaults, triggers) where parseable
- Output: `data-model.json`

**Lifecycle Extractor:**

- Reads listing_status, invite_status, and other enums from database types
- Reads VALID_TRANSITIONS maps from the status API route
- Output: `lifecycles.json`

### 6.2 GitHub Action (in nessi-web-app)

Triggers on push to `main`. Runs extraction scripts. Commits results to nessi-docs.

```yaml
name: Sync Docs Data
on:
  push:
    branches: [main]
    paths:
      - 'src/app/api/**'
      - 'src/types/database.ts'
      - 'supabase/migrations/**'
      - 'docs/journeys/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm run docs:extract # Runs extraction scripts
      - name: Push to nessi-docs
        uses: dmnemec/copy_file_to_another_repo_action@main
        with:
          source_file: 'docs/generated/'
          destination_repo: 'your-org/nessi-docs' # Replace with actual GitHub org/user
          destination_folder: 'src/data/'
          destination_branch: 'main'
          user_email: 'github-actions[bot]@users.noreply.github.com'
          user_name: 'github-actions[bot]'
          commit_message: 'sync: update docs data from nessi-web-app'
```

Journey JSON files are also copied from `docs/journeys/*.json` to `src/data/journeys/`.

### 6.3 Enrichment Data (lives in nessi-docs)

Some data is human-authored and must NOT be overwritten by the sync:

- **`why` explanations** — per API endpoint, per data model table, per journey step
- **Canvas positions** — x,y coordinates for journey nodes and lifecycle states
- **UX annotations** — toast messages, redirects, modals, emails per step

These are stored in separate enrichment files that are merged with the extracted data at build time:

```
src/data/enrichments/
  api-why.json            → { "/api/auth/register": "Creates user via admin client..." }
  data-model-why.json     → { "members": "Central user entity..." }
  lifecycle-positions.json → { "listing": { "draft": { x: 60, y: 120 }, ... } }
```

Build-time merge: extracted data provides the skeleton (what exists), enrichment files add the human context (why it exists, where to position it).

---

## 7. Styling

### 7.1 Dark Mode Tokens

Extend the existing SCSS variables with dark-mode equivalents:

```scss
// src/styles/variables/dark-theme.scss
:root {
  --bg-body: #090b0e;
  --bg-panel: #0f1319;
  --bg-raised: #161c26;
  --bg-hover: #1e2636;
  --bg-active: #283044;
  --bg-input: #0c0f12;

  --text-primary: #e8e6e1;
  --text-secondary: #9a9790;
  --text-muted: #6a6860;
  --text-dim: #4a4840;

  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-medium: rgba(255, 255, 255, 0.09);
  --border-strong: rgba(255, 255, 255, 0.15);
}
```

Layer colors, status colors, and persona colors use the existing Nessi design tokens (they already work on dark backgrounds).

### 7.2 Font Stack

Same as existing: DM Sans (body), DM Serif Display (headings), DM Mono (code/values). Already configured in the root layout via Google Fonts.

### 7.3 Component Styling

SCSS Modules with kebab-case file names (enforced by eslint-plugin-check-file). Mobile-first with `@include breakpoint()` mixin. CSS custom properties for theming.

---

## 8. Future Phases

### Phase 2: GitHub Integration

- Pull issues from Nessi Kanban project board via GitHub API
- Map issues to journey steps (via labels, milestone, or custom field)
- "Planned" steps link to their tracking issue
- Issue closed → step moves to "built" automatically

### Phase 3: AI-Powered Flow Review

- "Insights" page or inline canvas annotations
- Runs analysis against structured journey data
- Surfaces recommendations:
  - Missing error handling at a step
  - Missing confirmation email/toast
  - No cascade deletion for a relationship
  - No way for user to go back from a state
  - Missing edge cases compared to similar marketplace patterns
- Could use AI SDK to generate recommendations from journey JSON + API contract data

### Phase 4: Test Coverage Integration

- Extract Vitest unit test coverage → map to source files → map to features
- Extract Playwright E2E test results → map to journey flows
- Coverage page shows: unit coverage %, E2E coverage %, manual QA sign-off
- Distinguish machine-verified vs human-annotated coverage

---

## 9. Migration Plan (Phase 1 Scope)

What gets built in the initial migration:

1. **App shell** — Root layout with dark mode, topbar (real Nessi logo), sidebar, detail panel
2. **Canvas engine** — Pan/zoom SVG, step/decision/entry nodes, bezier edges, path tracing, animated particles
3. **Journeys page** — `/journeys/[slug]` with 2D canvas, decision interaction, filter bar
4. **API Map page** — `/api` with grouped endpoint list, clickable → detail panel
5. **Data Model page** — `/data` with expandable entity cards, clickable → detail panel
6. **Lifecycles page** — `/lifecycles/[slug]` with SVG state machine canvas
7. **Coverage page** — `/coverage` with journey coverage cards
8. **Cross-linking** — Detail panel links between journeys, API, data model, lifecycles
9. **Data files** — Migrate playground data to typed JSON/TS files in `src/data/`
10. **Extraction scripts** — API route extractor, data model extractor, lifecycle extractor
11. **CI pipeline** — GitHub Action to sync data on merge to main
12. **Cleanup** — Remove playground HTML, remove old vertical timeline components

### Out of scope for Phase 1:

- GitHub project board integration (Phase 2)
- AI flow review / recommendations (Phase 3)
- Vitest/Playwright coverage extraction (Phase 4)
- UX annotation authoring UI (manual JSON editing is fine for now)
