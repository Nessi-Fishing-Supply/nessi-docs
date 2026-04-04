# API Map

## Overview

Renders the API endpoint reference (list view). Data source is the extracted `api-contract.json` from nessi-web-app.

## Architecture

```
api-map/
├── services/
│   └── api-groups.ts     — Data access (wraps branch-loader today, API tomorrow)
├── hooks/
│   └── use-api-groups.ts — TanStack Query hooks for client components
├── components/
│   └── api-list/         — API endpoint list view with expandable rows and filters
└── index.ts              — Public API (barrel export)
```

## Services

| Function                    | Returns      | Used By                       |
| --------------------------- | ------------ | ----------------------------- |
| `getApiGroups(branch)`      | `ApiGroup[]` | ApiMapPage, useApiGroups      |
| `getTotalEndpoints(branch)` | `number`     | ApiMapPage, useTotalEndpoints |

## Hooks

| Hook                  | Query Key                     | Returns                                  |
| --------------------- | ----------------------------- | ---------------------------------------- |
| `useApiGroups()`      | `['api-groups', branch]`      | `{ data: ApiGroup[], isLoading, error }` |
| `useTotalEndpoints()` | `['total-endpoints', branch]` | `{ data: number, isLoading, error }`     |

## Data Flow

- **Server:** Page → `getApiGroups(branch)` + `getTotalEndpoints(branch)` → branch-loader → props → ApiList
- **Client:** Component → `useApiGroups()` → useQuery → service → branch-loader
