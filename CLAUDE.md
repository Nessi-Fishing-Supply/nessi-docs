# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nessi Docs is the internal documentation and product visualization app for the Nessi fishing marketplace. It renders structured data (journeys, API contracts, data model, lifecycles, features, permissions, config) as interactive visualizations for the product and engineering teams.

Deployed at `docs.nessifishingsupply.com` (planned).

## Relationship to nessi-web-app

This app is a **rendering and transformation layer** over extracted data from `nessi-web-app`. The extraction boundary is clear:

- **nessi-web-app** owns the raw data (JSON files in `docs/` directory)
- **nessi-docs** transforms that data for view-layer needs and renders it
- Extraction produces clean JSON. This app computes all derived fields (layouts, colors, domain mapping, cross-links)

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
│   ├── lifecycles/         # State machine canvases (by slug)
│   ├── features/           # Feature domain pages (by domain)
│   ├── config/             # Config reference + roles
│   └── changelog/          # Change feed
├── data/
│   ├── generated/          # Raw JSON from nessi-web-app extraction
│   ├── index.ts            # Data transformer — all exports, computed fields, layout engines
│   └── cross-links.ts      # Bidirectional entity ↔ endpoint mapping
├── types/                  # TypeScript types per domain
├── features/               # Feature-scoped components
│   ├── journeys/           # Journey canvas, filters, domain grid
│   ├── canvas/             # Shared canvas infrastructure (provider, nodes, edges, hooks)
│   ├── data-model/         # Entity list, ERD canvas
│   ├── lifecycles/         # Lifecycle canvas
│   ├── api-map/            # API endpoint list
│   ├── dashboard/          # Dashboard home view
│   ├── feature-domain/     # Feature domain page view
│   ├── config/             # Config reference list
│   ├── changelog/          # Changelog feed
│   └── search/             # Global search dialog
├── components/
│   ├── layout/             # App shell, sidebar, topbar, detail panel
│   └── ui/                 # Reusable UI primitives (badge, border-trace, breadcrumb, etc.)
├── providers/              # React context (DocsProvider for selection state)
├── constants/              # Domain config, colors
└── styles/                 # Nessi design tokens (variables, mixins, globals)
```

### Shared Canvas System (`src/features/canvas/`)

All graph visualizations (Journeys, ERD, Lifecycles) use a shared canvas infrastructure:

- **CanvasProvider** — SVG viewport with pan/zoom, dot grid background, toolbar/legend/minimap slots
- **Hooks** — `usePanZoom` (external store), `useViewport`, `useStaggerEntry`, `usePathTrace` (journey), `useErdTrace` (ERD/lifecycle)
- **Shared components** — `Edge`, `AnimatedEdge`, `LabelPill`, `Minimap`, `CanvasToolbar`, `Legend`, `DotGrid`
- **Domain-specific nodes** — `StepNode`/`EntryNode`/`DecisionNode` (journeys), `EntityNode` (ERD), `StateNode` (lifecycles)
- **Tooltips** — `NodeTooltip` (journeys, click-to-pin), `EntityTooltip` (ERD, hover with bridging), `StateTooltip` (lifecycles, hover with bridging)
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

Used by: Data Model rows, API Map endpoint rows, Feature domain feature rows.

### Data Layer (`src/data/index.ts`)

Single file that imports all raw JSON from `src/data/generated/`, transforms it, and re-exports typed data:

- **Layout engines** — BFS-based positioning for lifecycle state machines, grid layout for ERD nodes
- **Color assignment** — Entity category colors, lifecycle state colors
- **Domain mapping** — `FEATURE_TO_DOMAIN` map for grouping features into domains
- **Cross-links** — `cross-links.ts` builds bidirectional indexes between entities and API endpoints
- **Changelog parsing** — Groups by date, maps conventional commit types, parses scopes for domain filtering
- **Static exports** — `features`, `entities`, `journeys`, `lifecycles`, `apiGroups`, `roles`, `configEnums`, `changelog`, `erdNodes`, `erdEdges`
- **Helper functions** — `getDomains()`, `getFeatureDomains()`, `getFeaturesByDomain()`, `getChangelogByDomain()`, `getDashboardMetrics()`, `getAllJourneys()`, `getEndpointsForTable()`, etc.

### App Shell

Three-panel layout managed by `AppShell`:

- **Sidebar** — Three-group navigation (System Views / Features / Reference)
- **Main content** — Page-specific visualization
- **Detail panel** — Context-sensitive inspector (only on non-canvas pages)

Selection state flows through `DocsProvider` (React context). The `SelectedItem` union type determines which detail panel renders.

### Fonts

DM Sans (body/UI) and DM Serif Display (headings), loaded via `next/font/google` with CSS variables `--font-dm-sans` and `--font-dm-serif`.

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
