# Shared

## Overview

Cross-cutting types, hooks, and constants used by multiple features. No components — this is pure infrastructure. Matches the `features/shared` pattern in nessi-web-app.

## Architecture

```
shared/
├── types/         — App-level types not owned by any single feature
├── hooks/         — Shared React hooks used across features
├── constants/     — Shared constants (colors, domains, dates, diff config)
└── CLAUDE.md
```

## Types

| File | Purpose | Used By |
|------|---------|---------|
| `branch.ts` | `BranchData`, `BranchInfo` — branch metadata and data bundle shape | libs (app-store, branch-init), data layer |
| `docs-context.ts` | `SelectedItem` union type — drives detail panel content | libs (app-store), detail-panel |
| `extraction-meta.ts` | `ExtractionMeta` — source commit hash and timestamp from data sync | data layer (branch-loader), staleness-banner |
| `roadmap.ts` | `RoadmapItem` — future roadmap data structure | data layer (branch-loader) |

## Hooks

| Hook | Purpose | Used By |
|------|---------|---------|
| `useBranchHref(path)` | Builds branch-prefixed URLs from the active branch in the store | Sidebar, breadcrumb, diff-toolbar, comparison-selector |
| `useDeepLink(id)` | Hash-based deep-link detection with highlight/scroll/clear lifecycle | Collapsible rows across data-model, api-map, config, feature-domain |
| `useFilterToggle(items)` | Generic Set-based filter toggle with "all on" / "all off" logic | Journey filters, canvas category filters |
| `useUrlSync()` | Syncs URL query params (compare branch) to Zustand store on mount | Branch layout (Suspense boundary) |

## Constants

| File | Purpose | Used By |
|------|---------|---------|
| `colors.ts` | Entity category color map, lifecycle state colors | Data transforms, canvas nodes, entity-list |
| `dates.ts` | Date formatting utilities and staleness threshold | Staleness-banner, changelog |
| `diff.ts` | `DIFF_COLORS`, `DIFF_STATUS_CONFIG` — diff color values for canvas | Canvas components, diff-toolbar, badges |
| `domains.ts` | `DOMAINS` array — domain slugs, labels, descriptions | Journeys service, feature-domain service, dashboard |
| `github.ts` | `githubUrl()` — builds GitHub source links to nessi-web-app repo | GitHub-link component, step-panel, entity-panel |

## When to Add Here vs. Feature

Add to `shared/` when:
- The type/hook/constant is used by **3+ features** with no clear single owner
- It's **app infrastructure** (branch, selection, URL sync) not tied to a domain

Add to a feature when:
- One feature **owns** the concept (e.g., `DiffResult` belongs to diff-overview)
- Other features consume it via the owning feature's barrel export
