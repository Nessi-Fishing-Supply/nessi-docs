# Domains

## Overview

Renders feature domain pages — grouping product features (auth, cart, listings, etc.) with their associated journeys, entities, and changelog entries. Data source is the extracted `features.json` and `changelog.json` from nessi-web-app.

## Architecture

```
domains/
├── services/
│   └── features.ts           — Data access (wraps branch-loader today, API tomorrow)
├── hooks/
│   └── use-features.ts       — TanStack Query hooks for client components
├── components/
│   └── feature-domain-view/  — Domain page view with feature list, changelog, cross-links
└── index.ts                  — Public API (barrel export)
```

## Services

| Function                                 | Returns                         | Used By                                      |
| ---------------------------------------- | ------------------------------- | -------------------------------------------- |
| `getFeatureDomains(branch)`              | `FeatureDomain[]`               | FeatureDomainPage, layout, useFeatureDomains |
| `getFeatureDomainPageData(branch, slug)` | `FeatureDomainPageData \| null` | FeatureDomainPage, useFeatureDomainPageData  |

`FeatureDomainPageData` shape: `{ domain, features, changelog, journeys, entities }`

## Hooks

| Hook                             | Query Key                               | Returns                                                     |
| -------------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `useFeatureDomains()`            | `['feature-domains', branch]`           | `{ data: FeatureDomain[], isLoading, error }`               |
| `useFeatureDomainPageData(slug)` | `['feature-domain-page', branch, slug]` | `{ data: FeatureDomainPageData \| null, isLoading, error }` |

## Data Flow

- **Server:** Page → `getFeatureDomainPageData(branch, slug)` → branch-loader → props → FeatureDomainView
- **Server:** Layout → `getFeatureDomains(branch)` → branch-loader → nav items
- **Client:** Component → `useFeatureDomainPageData(slug)` → useQuery → service → branch-loader
