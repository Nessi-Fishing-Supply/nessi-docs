# Dashboard

## Overview

Renders the dashboard home view with system metrics, recent changelog entries, and feature domain cards. Data is sourced from `branch-loader` and pre-computed by the `getDashboardMetrics` and `getFeatureDomains` transforms.

## Architecture

```
dashboard/
├── services/
│   └── dashboard.ts      — Data access (wraps branch-loader today, API tomorrow)
├── hooks/
│   └── use-dashboard.ts  — TanStack Query hooks for client components
├── components/
│   └── dashboard-view/   — Dashboard page layout (metrics, changelog, domain grid)
└── index.ts              — Public API (barrel export)
```

## Services

| Function                               | Returns                    | Used By                         |
| -------------------------------------- | -------------------------- | ------------------------------- |
| `getDashboardData(branch)`             | `DashboardData \| null`    | DashboardPage, useDashboardData |
| `getDashboardMetricsForBranch(branch)` | `DashboardMetrics \| null` | useDashboardMetrics             |
| `getFeatureDomainsForBranch(branch)`   | `FeatureDomain[]`          | useFeatureDomains               |

`DashboardData` consolidates metrics, feature domains, and the first 5 changelog entries.

## Hooks

| Hook                    | Query Key                       | Returns                                             |
| ----------------------- | ------------------------------- | --------------------------------------------------- |
| `useDashboardData()`    | `['dashboard', branch]`         | `{ data: DashboardData \| null, isLoading, error }` |
| `useDashboardMetrics()` | `['dashboard-metrics', branch]` | `{ data: DashboardMetrics \| null, ... }`           |
| `useFeatureDomains()`   | `['feature-domains', branch]`   | `{ data: FeatureDomain[], ... }`                    |

## Data Flow

- **Server:** Page → `getDashboardData(branch)` → branch-loader + transforms → props → DashboardView
- **Client:** Component → `useDashboardData()` → useQuery → service → branch-loader
