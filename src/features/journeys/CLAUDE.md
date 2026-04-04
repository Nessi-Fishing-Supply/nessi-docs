# Journeys

## Overview

Renders user journey canvases (interactive step/decision graphs) grouped by domain. Data source is the extracted `journeys.json` from nessi-web-app. Provides both a domain index (grid of domains with stats) and per-domain/per-journey detail views.

## Architecture

```
journeys/
├── services/
│   └── journeys.ts         — Data access (wraps branch-loader)
├── hooks/
│   └── use-journeys.ts     — TanStack Query hooks for client components
├── domain-grid/            — Domain index grid with journey/step counts
├── domain-journey-list/    — Journey list for a single domain
├── journey-canvas/         — Interactive journey step/decision canvas
├── journey-filters/        — Layer/status/persona filter controls
└── index.ts                — Public API (barrel export)
```

## Services

| Function                            | Returns                   | Used By                               |
| ----------------------------------- | ------------------------- | ------------------------------------- |
| `getJourneyDomains(branch)`         | `DomainWithStats[]`       | JourneysIndex page, useJourneyDomains |
| `getDomainJourneys(branch, domain)` | `DomainPageData \| null`  | DomainPage, useDomainJourneys         |
| `getJourney(branch, domain, slug)`  | `JourneyPageData \| null` | JourneyPage, useJourney               |

## Hooks

| Hook                        | Query Key                             | Returns                                               |
| --------------------------- | ------------------------------------- | ----------------------------------------------------- |
| `useJourneyDomains()`       | `['journey-domains', branch]`         | `{ data: DomainWithStats[], isLoading, error }`       |
| `useDomainJourneys(domain)` | `['domain-journeys', branch, domain]` | `{ data: DomainPageData \| null, isLoading, error }`  |
| `useJourney(domain, slug)`  | `['journey', branch, domain, slug]`   | `{ data: JourneyPageData \| null, isLoading, error }` |

## Data Flow

- **Server:** Page → service function → branch-loader → props → component
- **Client:** Component → hook → useQuery → service → branch-loader

## Types

- `DomainWithStats` — imported from `@/data`; `DomainConfig` extended with `journeyCount`, `stepCount`, `decisionCount`
- `DomainPageData` — `{ config, journeys, stats, siblingDomains }`
- `JourneyPageData` — `{ journey, siblings }`
