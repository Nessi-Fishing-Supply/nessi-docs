# Changelog

## Overview

Renders a feed of changelog entries extracted from nessi-web-app. Each entry represents a merged PR with associated changes grouped by type (added, changed, fixed, removed).

## Architecture

```
changelog/
├── services/
│   └── changelog.ts      — Data access (wraps branch-loader today, API tomorrow)
├── hooks/
│   └── use-changelog.ts  — TanStack Query hook for client components
├── changelog-feed/       — Feed view rendering changelog entries
└── index.ts              — Public API (barrel export)
```

## Services

| Function               | Returns           | Used By                      |
| ---------------------- | ----------------- | ---------------------------- |
| `getChangelog(branch)` | `ChangelogEntry[]` | ChangelogPage, useChangelog  |

## Hooks

| Hook              | Query Key               | Returns                                          |
| ----------------- | ----------------------- | ------------------------------------------------ |
| `useChangelog()`  | `['changelog', branch]` | `{ data: ChangelogEntry[], isLoading, error }`   |

## Data Flow

- **Server:** Page → `getChangelog(branch)` → branch-loader → props → ChangelogFeed
- **Client:** Component → `useChangelog()` → useQuery → service → branch-loader
