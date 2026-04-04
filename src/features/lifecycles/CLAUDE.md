# Lifecycles

## Overview

Renders state machine canvases for entity lifecycles (e.g. listing, offer, shop). Data source is the extracted `lifecycles.json` from nessi-web-app. Provides both a list view (all lifecycles) and per-lifecycle detail view with an interactive canvas.

## Architecture

```
lifecycles/
├── services/
│   └── lifecycles.ts         — Data access (wraps branch-loader)
├── hooks/
│   └── use-lifecycles.ts     — TanStack Query hooks for client components
├── components/
│   ├── lifecycle-list/       — List view of all lifecycles
│   └── lifecycle-canvas/     — Interactive state machine canvas
└── index.ts                  — Public API (barrel export)
```

## Services

| Function                     | Returns                     | Used By                             |
| ---------------------------- | --------------------------- | ----------------------------------- |
| `getLifecycles(branch)`      | `Lifecycle[]`               | LifecyclesIndex page, useLifecycles |
| `getLifecycle(branch, slug)` | `LifecyclePageData \| null` | LifecyclePage, useLifecycle         |

## Hooks

| Hook                 | Query Key                     | Returns                                                 |
| -------------------- | ----------------------------- | ------------------------------------------------------- |
| `useLifecycles()`    | `['lifecycles', branch]`      | `{ data: Lifecycle[], isLoading, error }`               |
| `useLifecycle(slug)` | `['lifecycle', branch, slug]` | `{ data: LifecyclePageData \| null, isLoading, error }` |

## Types

- `LifecyclePageData` — `{ lifecycle, siblings, entityNames }`
- `siblings` — `{ slug, name, description }[]` — all lifecycles for sibling nav
- `entityNames` — `string[]` — entity table names from `getEntitiesForLifecycle` cross-link

## Data Flow

- **Server:** Page → service function → branch-loader → props → component
- **Client:** Component → hook → useQuery → service → branch-loader
