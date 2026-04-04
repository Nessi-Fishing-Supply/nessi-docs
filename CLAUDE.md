# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nessi Docs is the internal documentation and product visualization app for the Nessi fishing marketplace. It renders structured data (journeys, API contracts, data model, entity relationships, lifecycles, architecture diagrams, features, config) as interactive visualizations for the product and engineering teams.

Deployed at `docs.nessifishingsupply.com` (planned).

## Relationship to nessi-web-app

This app is a **rendering and transformation layer** over extracted data from `nessi-web-app`. The extraction boundary is clear:

- **nessi-web-app** owns the raw data (JSON files in `docs/` directory)
- **nessi-docs** transforms that data for view-layer needs and renders it
- Extraction produces clean JSON. This app computes all derived fields (layouts, colors, domain mapping, cross-links)

### Domain assignment boundary

Domain assignment is split across repos:

- **Journey domains** — assigned at the source in `nessi-web-app/docs/journeys/*.json` (each journey has a `domain` field)
- **Feature domains** — assigned during transformation in this repo via `FEATURE_TO_DOMAIN` map (`src/data/transforms/features.ts`)
- **Domain definitions** — owned by this repo in `src/constants/domains.ts`

When nessi-web-app adds a new feature, the extraction pipeline produces raw metrics (component count, endpoint count, hooks, entities) with **no domain opinion**. This repo's transform layer assigns the feature to a domain using the hardcoded map. If a new feature slug appears in extracted data but is missing from `FEATURE_TO_DOMAIN`, it will be silently excluded from all domain views.

See "Feature Domain Classification" under Architecture for promotion criteria.

### Data sync

Raw JSON is synced from `nessi-web-app` to `src/data/generated/` via GitHub Action or manual copy. The `_meta.json` file tracks the source commit hash.

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Lint styles:** `pnpm lint:styles`
- **Type check:** `pnpm typecheck`
- **Format:** `pnpm format` (write) / `pnpm format:check` (verify)
- **All CI checks:** `pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck`

Package manager is **pnpm** (v10.13.1). Do not use npm or yarn.

## Architecture

### Stack

- Next.js 16 (App Router), fully static (SSG)
- SCSS Modules with Nessi design tokens
- No database, no auth, no API routes
- react-icons for UI icons

### Key Directories

```
src/
├── app/                    # Pages and routes
│   ├── page.tsx            # Dashboard home
│   ├── journeys/           # Journey canvas pages (domain/slug)
│   ├── api-map/            # API endpoint reference
│   ├── data-model/         # Entity table reference
│   ├── entity-relationships/ # ERD canvas
│   ├── lifecycles/         # State machine canvases (list + by slug)
│   ├── architecture/       # System architecture diagrams (list + by slug)
│   ├── features/           # Feature domain pages (by domain)
│   ├── config/             # Config reference + roles (deep-linkable)
│   └── changelog/          # Change feed
├── data/
│   ├── generated/          # Raw JSON from nessi-web-app extraction
│   ├── index.ts            # Data transformer — all exports, computed fields, layout engines
│   └── cross-links.ts      # Bidirectional entity ↔ endpoint mapping
├── types/                  # TypeScript types per domain
├── features/               # Feature-scoped components
│   ├── journeys/           # services/, hooks/, components/{domain-grid,domain-journey-list,journey-canvas,journey-filters}
│   ├── canvas/             # Shared canvas infrastructure (provider, nodes, edges, hooks)
│   ├── data-model/         # services/, hooks/, components/{entity-list,erd-canvas}
│   ├── lifecycles/         # services/, hooks/, components/{lifecycle-list,lifecycle-canvas}
│   ├── architecture/       # services/, hooks/, components/{architecture-list,architecture-canvas}
│   ├── api-map/            # services/, hooks/, components/{api-list}
│   ├── dashboard/          # services/, hooks/, components/{dashboard-view}
│   ├── domains/            # services/, hooks/, components/{feature-domain-view}
│   ├── config/             # services/, hooks/, components/{config-list}
│   ├── changelog/          # services/, hooks/, components/{changelog-feed}
│   ├── diff-overview/      # services/, hooks/, components/{diff-overview-view,diff-domain-group,diff-empty-state}
│   └── search/             # search-index.ts, recent-searches.ts, components/{search-dialog,search-trigger}
├── components/
│   ├── layout/             # App shell, sidebar, topbar, detail panel
│   └── ui/                 # Reusable UI primitives (badge, border-trace, breadcrumb, cross-link, github-link, info-block, key-value-row, page-header, section-label, tooltip)
├── providers/              # React context (DocsProvider for selection state)
├── constants/              # Domain config, colors, GitHub URL
└── styles/                 # Nessi design tokens (variables, mixins, globals)
```

### Shared Canvas System (`src/features/canvas/`)

All graph visualizations (Journeys, ERD, Lifecycles, Architecture) use a shared canvas infrastructure:

- **CanvasProvider** — SVG viewport with pan/zoom, dot grid background, toolbar/legend/minimap slots
- **Hooks** — `usePanZoom` (external store), `useViewport`, `useStaggerEntry`, `usePathTrace` (journey), `useErdTrace` (ERD/lifecycle)
- **Shared components** — `Edge`, `AnimatedEdge`, `LabelPill`, `Minimap`, `CanvasToolbar`, `Legend`, `DotGrid`
- **Domain-specific nodes** — `StepNode`/`EntryNode`/`DecisionNode` (journeys), `EntityNode` (ERD), `StateNode` (lifecycles), inline SVG nodes (architecture)
- **Tooltips** — `NodeTooltip` (journeys, click-to-pin), `EntityTooltip` (ERD, hover with bridging), `StateTooltip` (lifecycles, hover with bridging)
- **Architecture tooltip** — `ArchTooltip` is defined inline in the architecture canvas component (`src/features/architecture/architecture-canvas/`), not in the shared canvas dir
- **Geometry** — `smoothPath()` for direction-aware bezier curves, port helpers, node dimension constants

### Canvas Features (shared across all canvases)

- Pan/zoom with momentum and smooth animation
- Frosted glass effect on nodes (`foreignObject` with `backdrop-filter: blur()`)
- Hover glow (radial gradient) + selection glow with `glow-pulse` animation
- Hover stroke brightening
- Direction-aware edge routing (`smoothPath` with exit/entry port directions)
- Label pills with glass backdrop, collision avoidance (nudge away from overlapping nodes)
- Sibling edge spreading (multiple edges between same node pair fan out)
- Trace mode — click to isolate connected nodes/edges, animated flowing edges, dimming
- Minimap with clickable viewport indicator
- Toolbar with zoom controls, legend toggle, filter toggle, reset all
- Category/layer filtering via dropup pill toggles

### Deep-Link System

Cross-page navigation uses hash anchors with a consistent animation sequence:

1. Navigate to target page with `#hash` (via Next.js `Link`)
2. Target row detects hash via `useEffect` + `hashchange` listener
3. Row expands (accordion open), highlight activates (border trace)
4. Scroll into view at 100ms
5. Hash cleared from URL at 600ms (prevents stale hash stacking)
6. Highlight fades at 9500ms
7. Deep-link target rows skip CSS stagger delay (`--stagger: 0ms`)

Used by: Data Model rows, API Map endpoint rows, Feature domain feature rows, Config reference blocks.

### Feature Domain Classification

Features are grouped into **domains** — top-level product areas rendered as pages under `/features/[domain]`. Domain assignment is a manual classification in `FEATURE_TO_DOMAIN` (`src/data/transforms/features.ts`) and `DOMAINS` (`src/constants/domains.ts`). This section defines when a feature warrants its own domain vs. remaining grouped under an existing one.

#### Promotion signals

A feature should be evaluated for its own domain when it meets **3 or more** of these criteria:

| Signal                    | Threshold                                                          | Example                                                                                 |
| ------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Own dashboard section** | Has dedicated routes in nessi-web-app's dashboard                  | Messaging has `/dashboard/messages`                                                     |
| **Own permission model**  | Feature-gated by a distinct permission (not just auth)             | Messaging has `shops.permissions.messaging`                                             |
| **Own infrastructure**    | Requires dedicated infra beyond tables (realtime, storage, queues) | Messaging uses Supabase Realtime + storage bucket                                       |
| **Cross-domain reach**    | Touches 3+ existing domains as a dependency or integration point   | Messaging integrates with listings, shops, members, blocks                              |
| **Multiple journeys**     | Could support 2+ distinct user journeys                            | Buyer-seller messaging, offer negotiation, shop inbox                                   |
| **Scale**                 | >10 components OR >8 endpoints OR >10 hooks                        | Messaging: 13 components, 12+ endpoints, 15 hooks                                       |
| **Own entity cluster**    | Owns 3+ database tables forming a cohesive data model              | `message_threads`, `message_thread_participants`, `messages`, `offers`, `member_blocks` |

#### Staying grouped

A feature stays under its parent domain when:

- It's a **utility** with no product surface (0 components, 0 endpoints) — e.g., `email`, `notifications`
- It's a **single-purpose leaf** that serves one parent domain — e.g., `recently-viewed` serves shopping, `addresses` serves account
- It has **<5 components and <5 endpoints** with no independent infrastructure
- It has **no dashboard section** of its own

#### Cross-domain features

A feature can be its **own domain** and still appear as nodes/steps in other domains' journeys. This is by design — the cross-link system (`cross-links.ts`) and journey `links` arrays handle it:

- Messaging is its own domain, but "Message Seller" appears as a step in shopping journeys
- Offers live within messaging, but "Accept Offer" connects to the cart/orders domain
- The `links` array on each feature explicitly declares these cross-references

This is not a conflict — it's the **primary value** of the cross-link system. A feature's domain is where it _lives_. Cross-links are where it _touches_.

#### When to re-evaluate

Domain assignment should be reviewed when:

- A feature gains a new dashboard section in nessi-web-app
- A feature adds its own permission model or storage infrastructure
- A feature's component/endpoint count doubles from its last evaluation
- A new journey is created that is primarily about a grouped feature (not its parent domain)

#### Current domain inventory

| Domain            | Slug        | Core features                                      | Grouped utilities |
| ----------------- | ----------- | -------------------------------------------------- | ----------------- |
| Authentication    | `auth`      | auth, context                                      | —                 |
| Shopping & Social | `shopping`  | flags, follows, recently-viewed, shared, watchlist | —                 |
| Messaging         | `messaging` | messaging, blocks                                  | —                 |
| Cart & Checkout   | `cart`      | cart, orders                                       | —                 |
| Members           | `account`   | addresses, dashboard, members                      | notifications     |
| Shops             | `shops`     | shops                                              | email             |
| Listings          | `listings`  | listings, editorial                                | —                 |

### Data Layer (`src/data/index.ts`)

Single file that imports all raw JSON from `src/data/generated/`, transforms it, and re-exports typed data:

- **Layout engines** — Topological layering with decision-aware vertical positioning for journey canvases, BFS-based positioning for lifecycle state machines, category-clustered grid layout for ERD nodes
- **Color assignment** — Entity category colors, lifecycle state colors
- **Domain mapping** — `FEATURE_TO_DOMAIN` map for grouping features into domains
- **Cross-links** — `cross-links.ts` builds bidirectional indexes between entities and API endpoints
- **Changelog parsing** — Groups by date, maps conventional commit types, parses scopes for domain filtering
- **Static exports** — `features`, `entities`, `journeys`, `lifecycles`, `archDiagrams`, `apiGroups`, `roles`, `configEnums`, `changelog`, `erdNodes`, `erdEdges`
- **Helper functions** — `getDomains()`, `getFeatureDomains()`, `getFeaturesByDomain()`, `getChangelogByDomain()`, `getDashboardMetrics()`, `getAllJourneys()`, `getEndpointsForTable()`, `getAllArchDiagrams()`, `getArchDiagram()`, `getAllLifecycles()`, etc.

### GitHub Source Linking

All artifacts link to their source code on GitHub via the `GitHubLink` component (`src/components/ui/github-link/`):

- **Journey steps** — `codeRef` field links to feature code (e.g., `src/features/cart/hooks/use-cart-merge.ts`)
- **API endpoints** — `sourceFile` field links to route file (e.g., `src/app/api/addresses/[id]/route.ts`)
- **Data model entities** — `sourceFile` field links to migration file (e.g., `supabase/migrations/20260319000000_create_profiles_table.sql`)
- **Lifecycle states** — `sourceFile` field links to enum definition or constants file

URL construction: `githubUrl()` from `src/constants/github.ts` builds `https://github.com/Nessi-Fishing-Supply/nessi-web-app/blob/main/{path}`. Links open in new tab. Display shows a trimmed path (strips `src/app/`, `src/`, `supabase/migrations/` prefix + timestamp) with full path on hover.

### Architecture Diagrams (`src/features/architecture/`)

System architecture visualizations rendered as interactive canvases:

- **Categories** — `stack` (layered dependency graphs), `flow` (directional data movement), `pipeline` (sequential workflows with branching)
- **Data** — JSON files extracted from `nessi-web-app/docs/architecture/` with layers, nodes, and connections
- **Canvas** — `ArchitectureCanvas` uses the shared canvas infrastructure with trace mode, hover tooltips, frosted glass nodes, direction-aware bezier curves, and animated flow edges
- **Layout** — auto-computed from layers/nodes with configurable spacing constants

### App Shell

Three-panel layout managed by `AppShell`:

- **Sidebar** — Three-group navigation (System Views / Features / Reference)
- **Main content** — Page-specific visualization
- **Detail panel** — Context-sensitive inspector (only on non-canvas pages)
- **DeviceGate** — Blocks mobile/small-screen access with a message (desktop-only app)
- **StalenessBanner** — Warns when synced data is older than a threshold based on `_meta.json` timestamp

Selection state flows through `DocsProvider` (React context). The `SelectedItem` union type determines which detail panel renders.

### Fonts

DM Sans (body/UI), loaded via `next/font/google` with CSS variable `--font-dm-sans`. DM Serif Display is still loaded (`--font-dm-serif`) but no longer applied to any elements — serif was removed site-wide.

### Styling

SCSS Modules with CSS custom properties from design tokens. Dark theme. `sassOptions.includePaths` in `next.config.mjs` includes `src/styles/` so token files can be imported directly.

Key design patterns:

- Dark backgrounds with subtle borders (`var(--bg-raised)`, `var(--border-subtle)`)
- Frosted glass effects via `backdrop-filter: blur()`
- Category-colored accent bars on nodes/rows
- Monospace font for code/technical content (`var(--font-family-mono)`)
- `glow-pulse`, `flow-pulse`, `tooltip-in`, `row-enter` keyframe animations in globals

## Naming Conventions

All files and folders use **kebab-case**, enforced by eslint-plugin-check-file in `eslint.config.mjs`.

## Path Aliases

- `@/*` maps to `./src/*`
- `@journeys/*` maps to `./src/data/journeys/*`

## CI

GitHub Actions runs on PR: `pnpm format:check`, `pnpm lint`, `pnpm lint:styles`, `pnpm typecheck`, `pnpm build`. All must pass. Always run `pnpm format` before committing to avoid CI failures.
