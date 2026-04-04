# Architecture

## Overview

Renders system architecture visualizations as interactive canvases. Data source is the extracted `architecture/` JSON files from nessi-web-app. Categories: `stack` (layered dependency graphs), `flow` (directional data movement), `pipeline` (sequential workflows with branching).

## Architecture

```
architecture/
├── services/
│   └── arch-diagrams.ts    — Data access (wraps branch-loader today, API tomorrow)
├── hooks/
│   └── use-arch-diagrams.ts — TanStack Query hooks for client components
├── architecture-list/       — Architecture diagram list view
├── architecture-canvas/     — Interactive canvas with trace mode, tooltips, bezier edges
└── index.ts                 — Public API (barrel export)
```

## Services

| Function                       | Returns                              | Used By                           |
| ------------------------------ | ------------------------------------ | --------------------------------- |
| `getArchDiagrams(branch)`      | `ArchDiagram[]`                      | ArchitecturePage, useArchDiagrams |
| `getArchDiagram(branch, slug)` | `ArchDiagramPageData \| null`        | ArchitectureSlugPage, useArchDiagram |

`ArchDiagramPageData` shape: `{ diagram: ArchDiagram, siblings: { slug, title, description }[] }`

## Hooks

| Hook                      | Query Key                        | Returns                                                    |
| ------------------------- | -------------------------------- | ---------------------------------------------------------- |
| `useArchDiagrams()`       | `['arch-diagrams', branch]`      | `{ data: ArchDiagram[], isLoading, error }`                |
| `useArchDiagram(slug)`    | `['arch-diagram', branch, slug]` | `{ data: ArchDiagramPageData \| null, isLoading, error }`  |

## Data Flow

- **Server:** Page → `getArchDiagrams(branch)` → branch-loader → props → ArchitectureList
- **Server:** SlugPage → `getArchDiagram(branch, slug)` → branch-loader → props → ArchitecturePageClient
- **Client:** Component → `useArchDiagrams()` → useQuery → service → branch-loader
