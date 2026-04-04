# Phase 7: API Abstraction Layer — Domain-Based Service Layer

> Introduces a service layer and TanStack Query hooks co-located with each feature domain, following the nessi-web-app pattern. Prepares the frontend for the Archway transition from static JSON to live API without component-level changes.

**Date:** 2026-04-04
**Author:** Kyle Holloway + Claude
**Status:** Draft

---

## Problem Statement

Today, data access is split across two patterns:

1. **Server Components** call `loadBranch(branch)` from `src/data/branch-loader.ts` directly and pass data as props.
2. **Client Components** read from the Zustand store (populated by `BranchInit`) or compute diffs via `useDiffResult()` with `useMemo`.

There is no abstraction between the data source and consumers. When Archway replaces static JSON with a database-backed API:
- Every page component that calls `loadBranch()` needs rewriting
- Every client component that reads `activeData` from the store needs a new data source
- Transforms that are currently client-side IP need to move behind the API

The service layer creates a seam: components call services, services call the data source. Swap the data source, components don't change.

---

## Scope

### In Scope

- Service files co-located in each feature's `services/` directory
- TanStack Query hooks co-located in each feature's `hooks/` directory
- Barrel exports (`index.ts`) per feature for controlled public API
- CLAUDE.md per feature documenting architecture, services, hooks, components
- Page migration from `loadBranch()` → feature service imports
- Migration of `useDiffResult` hook into `diff-overview` feature
- Existing `src/hooks/use-diff-result.ts` deprecated in favor of feature-local hook

### Out of Scope

- Moving transforms to a backend (no backend exists yet — transforms stay in `src/data/transforms/`)
- Actual API endpoints (Archway backend work)
- Changing the Zustand store structure
- Moving layout engines or cross-link indexes
- Modifying component rendering logic

### Design Decision: Transform Location

Transforms (entity categorization, journey layout, changelog parsing, cross-link indexing) stay client-side in `src/data/transforms/` and `src/data/layout/` for now. Services call them and return already-transformed types (`Entity[]`, not `RawEntity[]`). When the Archway API arrives, transforms move server-side — the service becomes a thin `fetch()` and the interface stays the same. The transforms are IP that belongs behind the API long-term.

---

## Architecture

### Pattern: Feature-Scoped Services (Matching nessi-web-app)

Each feature directory in `src/features/` gets:

```
features/{domain}/
├── CLAUDE.md              # Feature docs (architecture, data flow, hooks)
├── index.ts               # Barrel export (controlled public API)
├── services/
│   └── {domain}.ts        # Data access functions
├── hooks/
│   └── use-{domain}.ts    # TanStack Query hooks wrapping services
└── ... (existing components, canvas dirs, etc.)
```

### Service Layer Contract

Every service function:
- Takes `branch: string` as first argument (identifies which branch's data to load)
- Returns **transformed, typed data** (not raw JSON)
- Is synchronous today (wraps `loadBranch()`)
- Will become async tomorrow (wraps `fetch()`)
- Has no side effects, no state management, no React dependencies

```typescript
// Today (static)
export function getEntities(branch: string): Entity[] {
  const data = loadBranch(branch);
  return data?.entities ?? [];
}

// Tomorrow (Archway API)
export async function getEntities(branch: string): Promise<Entity[]> {
  const res = await fetch(`/api/branches/${branch}/entities`);
  return res.json();
}
```

### Query Hook Contract

Every query hook:
- Wraps a service function in `useQuery()`
- Returns `{ data, isLoading, error }` (standard TanStack Query shape)
- Uses `staleTime: Infinity` today (static data never goes stale)
- Query keys follow `[domain, branch]` pattern for cache isolation
- Reads `branch` from the Zustand store (no prop drilling)

```typescript
export function useEntities() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['entities', branch],
    queryFn: () => getEntities(branch),
    staleTime: Infinity,
  });
}
```

### Barrel Export Contract

Each feature's `index.ts` exports:
- Service functions (for Server Component pages)
- Query hooks (for Client Components)
- Types (re-exported from `src/types/` if needed)
- Components (existing, unchanged)

```typescript
// features/data-model/index.ts
export { getEntities } from './services/entities';
export { useEntities } from './hooks/use-entities';
export { EntityList } from './entity-list';
// ... existing component exports
```

---

## Feature Inventory

### Features Getting Services + Hooks

| Feature | Service File | Key Functions | Hook File | Key Hooks |
|---------|-------------|---------------|-----------|-----------|
| `data-model` | `services/entities.ts` | `getEntities(branch)` | `hooks/use-entities.ts` | `useEntities()` |
| `journeys` | `services/journeys.ts` | `getJourneys(branch)`, `getJourney(branch, domain, slug)`, `getJourneysByDomain(branch, domain)` | `hooks/use-journeys.ts` | `useJourneys()`, `useJourney(domain, slug)` |
| `lifecycles` | `services/lifecycles.ts` | `getLifecycles(branch)`, `getLifecycle(branch, slug)` | `hooks/use-lifecycles.ts` | `useLifecycles()`, `useLifecycle(slug)` |
| `api-map` | `services/api-groups.ts` | `getApiGroups(branch)` | `hooks/use-api-groups.ts` | `useApiGroups()` |
| `architecture` | `services/arch-diagrams.ts` | `getArchDiagrams(branch)`, `getArchDiagram(branch, slug)` | `hooks/use-arch-diagrams.ts` | `useArchDiagrams()`, `useArchDiagram(slug)` |
| `feature-domain` | `services/features.ts` | `getFeatureDomains(branch)`, `getFeaturesByDomain(branch, domain)` | `hooks/use-features.ts` | `useFeatureDomains()`, `useFeaturesByDomain(domain)` |
| `config` | `services/config.ts` | `getConfigEnums(branch)`, `getRoles(branch)` | `hooks/use-config.ts` | `useConfigEnums()`, `useRoles()` |
| `changelog` | `services/changelog.ts` | `getChangelog(branch)`, `getChangelogByDomain(branch, domain)` | `hooks/use-changelog.ts` | `useChangelog()` |
| `dashboard` | `services/dashboard.ts` | `getDashboardMetrics(branch)`, `getDomains(branch)` | `hooks/use-dashboard.ts` | `useDashboardMetrics()`, `useDomains()` |
| `diff-overview` | `services/diff.ts` | `getDiff(base, head)` | `hooks/use-diff.ts` | `useDiff()` — replaces `src/hooks/use-diff-result.ts` |

### Features NOT Getting Services (No Data Access)

| Feature | Reason |
|---------|--------|
| `search` | Operates on in-memory search index, no branch data fetching |
| `canvas` | Shared rendering infrastructure, not a data domain |

---

## CLAUDE.md Per Feature

Each feature gets a CLAUDE.md following the nessi-web-app pattern:

```markdown
# {Feature Name}

## Overview
Brief description of what this feature renders and its data sources.

## Architecture
├── services/       — Data access (wraps branch-loader today, API tomorrow)
├── hooks/          — TanStack Query hooks for client components
├── {component}/    — React components
└── index.ts        — Public API

## Services
| Function | Returns | Used By |
|----------|---------|---------|
| getFoo(branch) | Foo[] | FooPage (server), useFoo (client) |

## Hooks
| Hook | Query Key | Returns |
|------|-----------|---------|
| useFoo() | ['foo', branch] | { data: Foo[], isLoading, error } |

## Components
Brief description of each component directory.

## Data Flow
Server: Page → service → branch-loader → props → component
Client: Component → hook → useQuery → service → branch-loader
```

---

## Page Migration

Server Component pages change their import from:

```typescript
// Before
import { loadBranch } from '@/data/branch-loader';

export default async function DataModelPage({ params }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();
  return <EntityList entities={data.entities} />;
}
```

To:

```typescript
// After
import { getEntities } from '@/features/data-model';

export default async function DataModelPage({ params }) {
  const { branch } = await params;
  const entities = getEntities(branch);
  if (!entities.length) notFound();
  return <EntityList entities={entities} />;
}
```

The service function handles the `loadBranch()` call internally. When the API arrives, `getEntities` becomes async and the page adds `await` — one-line change.

---

## Diff Hook Migration

The current `src/hooks/use-diff-result.ts` moves into `src/features/diff-overview/hooks/use-diff.ts`. The interface stays the same but is now co-located with the diff feature. The old file is deleted and imports updated.

The new hook wraps `useQuery` instead of raw `useMemo`:

```typescript
export function useDiff() {
  const branch = useAppStore.use.activeBranch();
  const comparisonBranch = useAppStore.use.comparisonBranch();
  const mode = useAppStore.use.mode();

  return useQuery({
    queryKey: ['diff', branch, comparisonBranch],
    queryFn: () => getDiff(branch, comparisonBranch!),
    enabled: mode === 'diff' && !!comparisonBranch,
    staleTime: Infinity,
  });
}
```

Consumers that currently use `const { isActive, diffResult } = useDiffResult()` will need to adapt to the TanStack Query return shape: `const { data: diffResult, isLoading } = useDiff()`. The `isActive` check becomes `mode === 'diff' && !!diffResult`.

---

## Shared Data Infrastructure (Unchanged)

| File | Status | Reason |
|------|--------|--------|
| `src/data/branch-loader.ts` | Stays | Still the data source — services wrap it |
| `src/data/branch-registry.ts` | Stays | Branch config, used by store and services |
| `src/data/transforms/` | Stays | Transform logic called by services |
| `src/data/layout/` | Stays | Layout engines called by transforms |
| `src/data/cross-links.ts` | Stays | Cross-link index, could become its own service later |
| `src/data/diff-engine.ts` | Stays | Pure diff computation, called by diff service |
| `src/data/index.ts` | Deprecated gradually | Consumers migrate to feature services |

`src/data/index.ts` is the main file that gets hollowed out. Its exports are replaced by feature-specific services. Once all consumers are migrated, it can be deleted or reduced to just re-exports from cross-links and other shared utilities.

---

## Migration Strategy

Build new services alongside existing data access. Migrate one page/consumer at a time. Delete old patterns when all consumers are migrated. App never breaks during transition.

### Migration Order

1. Create service + hook + CLAUDE.md + index.ts for each feature (no consumers yet)
2. Migrate Server Component pages to use feature services
3. Migrate `useDiffResult` consumers to the new `useDiff` hook
4. Clean up: remove deprecated `src/hooks/use-diff-result.ts`, trim `src/data/index.ts`

---

## Success Criteria

- [ ] Every feature has `services/`, `hooks/`, `CLAUDE.md`, and `index.ts`
- [ ] All Server Component pages import from `@/features/{domain}` not `@/data/branch-loader`
- [ ] `useDiffResult` replaced by `useDiff` from `@/features/diff-overview`
- [ ] TanStack Query hooks return `{ data, isLoading, error }` for all domains
- [ ] `src/data/index.ts` has no direct page-level consumers
- [ ] All CI checks pass (`format`, `lint`, `lint:styles`, `typecheck`, `build`)
- [ ] Each feature CLAUDE.md documents services, hooks, components, and data flow
