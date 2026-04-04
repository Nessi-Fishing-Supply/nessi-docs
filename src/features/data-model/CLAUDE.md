# Data Model

## Overview

Renders the entity table reference (list view) and entity relationship diagram (ERD canvas). Data source is the extracted `data-model.json` and `entity-relationships.json` from nessi-web-app.

## Architecture

```
data-model/
├── services/
│   └── entities.ts       — Data access (wraps branch-loader today, API tomorrow)
├── hooks/
│   └── use-entities.ts   — TanStack Query hooks for client components
├── components/
│   ├── entity-list/      — Entity table list view with expandable rows
│   └── erd-canvas/       — Entity relationship diagram canvas
└── index.ts              — Public API (barrel export)
```

## Services

| Function              | Returns                            | Used By                    |
| --------------------- | ---------------------------------- | -------------------------- |
| `getEntities(branch)` | `Entity[]`                         | DataModelPage, useEntities |
| `getErdData(branch)`  | `{ nodes, edges, categoryGroups }` | ErdPage, useErdData        |

## Hooks

| Hook            | Query Key              | Returns                                                        |
| --------------- | ---------------------- | -------------------------------------------------------------- |
| `useEntities()` | `['entities', branch]` | `{ data: Entity[], isLoading, error }`                         |
| `useErdData()`  | `['erd-data', branch]` | `{ data: { nodes, edges, categoryGroups }, isLoading, error }` |

## Data Flow

- **Server:** Page → `getEntities(branch)` → branch-loader → props → EntityList
- **Client:** Component → `useEntities()` → useQuery → service → branch-loader
