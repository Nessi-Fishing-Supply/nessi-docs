# Nessi Docs

Internal documentation and product visualization app for the [Nessi](https://nessifishingsupply.com) fishing marketplace. Provides interactive visualizations of user journeys, API contracts, data model, entity relationships, state machine lifecycles, system architecture diagrams, and feature domain dashboards.

Built for the product and engineering teams to review system architecture, navigate cross-cutting concerns across the platform, and deep-link to source code on GitHub.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm dev`          | Start development server         |
| `pnpm build`        | Production build (static export) |
| `pnpm lint`         | ESLint                           |
| `pnpm lint:styles`  | Stylelint for SCSS               |
| `pnpm typecheck`    | TypeScript type checking         |
| `pnpm format`       | Prettier (write)                 |
| `pnpm format:check` | Prettier (verify)                |

## Stack

- **Next.js 16** (App Router, fully static SSG)
- **SCSS Modules** with Nessi design tokens (dark theme)
- **Custom SVG canvas** system for graph visualizations (no external canvas library)
- **react-icons** for UI icons
- **DM Sans** via `next/font`

## Architecture

### Pages

| Route                   | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `/`                     | Dashboard — metrics, recent changes, feature domain grid             |
| `/journeys/**`          | Interactive journey flow canvases with path tracing                  |
| `/api-map`              | API endpoint reference with expandable details                       |
| `/data-model`           | Database entity reference with field tables                          |
| `/entity-relationships` | ERD canvas with trace mode and entity tooltips                       |
| `/lifecycles`           | Lifecycle list with state/transition counts                          |
| `/lifecycles/**`        | State machine canvases per entity lifecycle                          |
| `/architecture`         | System architecture diagram list                                     |
| `/architecture/**`      | Interactive architecture canvases (tech stack, data flow, pipelines) |
| `/features/**`          | Feature domain dashboards with scoped coverage and deep-links        |
| `/config`               | Configuration enums + roles/permissions reference (deep-linkable)    |
| `/changelog`            | Chronological change feed                                            |

### Shared Canvas System

All graph visualizations (Journeys, ERD, Lifecycles, Architecture) share a common canvas infrastructure:

- SVG-based pan/zoom with momentum
- Frosted glass node effects
- Direction-aware bezier edge routing
- Hover glow, selection glow with pulse animation
- Trace mode (click to isolate connected nodes)
- Animated flowing edges on traced paths
- Minimap, toolbar, legend, category filters
- Hover tooltips with cursor bridging

### Cross-Page Deep-Linking

Pages are deeply interconnected. Clicking an API endpoint in an entity tooltip navigates to the API Map and auto-expands the target row with a border trace animation. The same pattern works across Data Model, API Map, Feature Domain, and Config pages. Every artifact with a source file links directly to the code on GitHub.

### Data Flow

```
nessi-web-app (source) → extraction scripts → JSON files
    ↓
src/data/generated/*.json (raw data, synced via GitHub Action)
    ↓
src/data/index.ts (transformer — layout, colors, domain mapping, cross-links)
    ↓
Pages + Components (SSG at build time)
```

All derived fields (node positions, category colors, domain grouping, cross-link indexes) are computed in the data transformer, not stored in the extracted JSON.

## Data Sync

Raw JSON is extracted from `nessi-web-app` and synced to `src/data/generated/`. The `_meta.json` file tracks the source commit. This app never modifies the generated JSON — it only reads and transforms.
