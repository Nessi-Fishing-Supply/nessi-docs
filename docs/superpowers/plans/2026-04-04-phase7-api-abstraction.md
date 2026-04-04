# Phase 7: API Abstraction Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add domain-scoped service layer, TanStack Query hooks, barrel exports, and CLAUDE.md per feature — matching the nessi-web-app pattern. Migrate all page and component data access to use the new services.

**Architecture:** Each feature in `src/features/` gets `services/`, `hooks/`, `index.ts`, and `CLAUDE.md`. Services wrap `loadBranch()` today, returning typed transformed data. Query hooks wrap services in `useQuery()`. Pages import from feature barrel exports instead of `@/data/` directly. The diff hook migrates from `src/hooks/` into the `diff-overview` feature.

**Tech Stack:** TanStack Query (already installed), Zustand (existing store), TypeScript

---

## File Structure

**New files per feature (10 features × 4 files = 40 new files):**

| Feature          | Service                     | Hook                         | Index      | CLAUDE.md   |
| ---------------- | --------------------------- | ---------------------------- | ---------- | ----------- |
| `data-model`     | `services/entities.ts`      | `hooks/use-entities.ts`      | `index.ts` | `CLAUDE.md` |
| `journeys`       | `services/journeys.ts`      | `hooks/use-journeys.ts`      | `index.ts` | `CLAUDE.md` |
| `lifecycles`     | `services/lifecycles.ts`    | `hooks/use-lifecycles.ts`    | `index.ts` | `CLAUDE.md` |
| `api-map`        | `services/api-groups.ts`    | `hooks/use-api-groups.ts`    | `index.ts` | `CLAUDE.md` |
| `architecture`   | `services/arch-diagrams.ts` | `hooks/use-arch-diagrams.ts` | `index.ts` | `CLAUDE.md` |
| `feature-domain` | `services/features.ts`      | `hooks/use-features.ts`      | `index.ts` | `CLAUDE.md` |
| `config`         | `services/config.ts`        | `hooks/use-config.ts`        | `index.ts` | `CLAUDE.md` |
| `changelog`      | `services/changelog.ts`     | `hooks/use-changelog.ts`     | `index.ts` | `CLAUDE.md` |
| `dashboard`      | `services/dashboard.ts`     | `hooks/use-dashboard.ts`     | `index.ts` | `CLAUDE.md` |
| `diff-overview`  | `services/diff.ts`          | `hooks/use-diff.ts`          | `index.ts` | `CLAUDE.md` |

**Modified files (page migrations):** 15 pages in `src/app/[branch]/`

---

## Task Decomposition Strategy

Each task creates the full service layer for one feature AND migrates its page consumers in the same task. This keeps each task self-contained — the feature works end-to-end after each task completes.

The diff-overview task is special: it also migrates 15+ `useDiffResult` consumers across the codebase.

---

### Task 1: Data Model Feature — Services, Hooks, CLAUDE.md, Page Migration

**Files:**

- Create: `src/features/data-model/services/entities.ts`
- Create: `src/features/data-model/hooks/use-entities.ts`
- Create: `src/features/data-model/index.ts`
- Create: `src/features/data-model/CLAUDE.md`
- Modify: `src/app/[branch]/data-model/page.tsx`
- Modify: `src/app/[branch]/entity-relationships/page.tsx`

- [ ] **Step 1: Create the entities service**

Create `src/features/data-model/services/entities.ts`:

```typescript
import { loadBranch } from '@/data/branch-loader';
import type { Entity } from '@/types/data-model';
import type { ErdNode, ErdEdge, ErdCategoryGroup } from '@/types/entity-relationship';

export function getEntities(branch: string): Entity[] {
  const data = loadBranch(branch);
  return data?.entities ?? [];
}

export function getErdData(branch: string) {
  const data = loadBranch(branch);
  if (!data)
    return {
      nodes: [] as ErdNode[],
      edges: [] as ErdEdge[],
      categoryGroups: [] as ErdCategoryGroup[],
    };
  return {
    nodes: data.erdNodes,
    edges: data.erdEdges,
    categoryGroups: data.erdCategoryGroups,
  };
}
```

- [ ] **Step 2: Create the entities query hook**

Create `src/features/data-model/hooks/use-entities.ts`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app-store';
import { getEntities, getErdData } from '../services/entities';

export function useEntities() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['entities', branch],
    queryFn: () => getEntities(branch),
    staleTime: Infinity,
  });
}

export function useErdData() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['erd-data', branch],
    queryFn: () => getErdData(branch),
    staleTime: Infinity,
  });
}
```

- [ ] **Step 3: Create the barrel export**

Create `src/features/data-model/index.ts`:

```typescript
// Services
export { getEntities, getErdData } from './services/entities';

// Hooks
export { useEntities, useErdData } from './hooks/use-entities';

// Components
export { EntityList } from './entity-list';
export { ErdCanvas } from './erd-canvas';
```

- [ ] **Step 4: Create the CLAUDE.md**

Create `src/features/data-model/CLAUDE.md`:

```markdown
# Data Model

## Overview

Renders the entity table reference (list view) and entity relationship diagram (ERD canvas). Data source is the extracted `data-model.json` and `entity-relationships.json` from nessi-web-app.

## Architecture
```

data-model/
├── services/
│ └── entities.ts — Data access (wraps branch-loader today, API tomorrow)
├── hooks/
│ └── use-entities.ts — TanStack Query hooks for client components
├── entity-list/ — Entity table list view with expandable rows
├── erd-canvas/ — Entity relationship diagram canvas
└── index.ts — Public API (barrel export)

```

## Services

| Function | Returns | Used By |
|----------|---------|---------|
| `getEntities(branch)` | `Entity[]` | DataModelPage, useEntities |
| `getErdData(branch)` | `{ nodes, edges, categoryGroups }` | ErdPage, useErdData |

## Hooks

| Hook | Query Key | Returns |
|------|-----------|---------|
| `useEntities()` | `['entities', branch]` | `{ data: Entity[], isLoading, error }` |
| `useErdData()` | `['erd-data', branch]` | `{ data: { nodes, edges, categoryGroups }, isLoading, error }` |

## Data Flow

- **Server:** Page → `getEntities(branch)` → branch-loader → props → EntityList
- **Client:** Component → `useEntities()` → useQuery → service → branch-loader
```

- [ ] **Step 5: Migrate data-model page**

In `src/app/[branch]/data-model/page.tsx`, change the import from `@/data/branch-loader` to the feature service:

Replace:

```typescript
import { loadBranch } from '@/data/branch-loader';
```

With:

```typescript
import { getEntities } from '@/features/data-model';
```

And update the page body to use `getEntities(branch)` directly instead of `loadBranch(branch)?.entities`.

- [ ] **Step 6: Migrate entity-relationships page**

In `src/app/[branch]/entity-relationships/page.tsx`, change the import:

Replace:

```typescript
import { loadBranch } from '@/data/branch-loader';
```

With:

```typescript
import { getEntities, getErdData } from '@/features/data-model';
```

And update the page to use `getErdData(branch)` and `getEntities(branch)`.

- [ ] **Step 7: Run CI checks**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add src/features/data-model/ src/app/[branch]/data-model/ src/app/[branch]/entity-relationships/
git commit -m "feat(data-model): add service layer, query hooks, and CLAUDE.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Journeys Feature — Services, Hooks, CLAUDE.md, Page Migration

**Files:**

- Create: `src/features/journeys/services/journeys.ts`
- Create: `src/features/journeys/hooks/use-journeys.ts`
- Create: `src/features/journeys/index.ts`
- Create: `src/features/journeys/CLAUDE.md`
- Modify: `src/app/[branch]/journeys/page.tsx`
- Modify: `src/app/[branch]/journeys/[domain]/page.tsx`
- Modify: `src/app/[branch]/journeys/[domain]/[slug]/page.tsx`

- [ ] **Step 1: Create the journeys service**

Read `src/app/[branch]/journeys/page.tsx`, `src/app/[branch]/journeys/[domain]/page.tsx`, and `src/app/[branch]/journeys/[domain]/[slug]/page.tsx` to understand the exact data transformations each page does (domain filtering, stats computation, sibling lookup). Then create `src/features/journeys/services/journeys.ts` that wraps `loadBranch()` and exposes:

```typescript
import { loadBranch } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { DOMAINS } from '@/constants/domains';
import type { Journey } from '@/types/journey';

export function getJourneys(branch: string): Journey[] {
  const data = loadBranch(branch);
  return data?.journeys ?? [];
}

export function getJourneysByDomain(branch: string, domain: string): Journey[] {
  return getJourneys(branch).filter((j) => j.domain === domain);
}

export function getJourney(branch: string, domain: string, slug: string): Journey | undefined {
  return getJourneys(branch).find((j) => j.domain === domain && j.slug === slug);
}

export function getJourneyDomains(branch: string) {
  const journeys = getJourneys(branch);
  return DOMAINS.map((d) => {
    const dJourneys = journeys.filter((j) => j.domain === d.slug);
    const allNodes = dJourneys.flatMap((j) => j.nodes);
    return {
      ...d,
      journeyCount: dJourneys.length,
      stepCount: allNodes.filter((n) => n.type === 'step').length,
      decisionCount: allNodes.filter((n) => n.type === 'decision').length,
    };
  }).filter((d) => d.journeyCount > 0);
}
```

Note: Read the actual page files to capture any additional data preparation and include it in the service. The code above is the pattern — the implementer must read the pages to get the exact logic.

- [ ] **Step 2: Create the journeys query hook**

Create `src/features/journeys/hooks/use-journeys.ts` following the same pattern as Task 1's hook — `useQuery` wrapping each service function.

- [ ] **Step 3: Create barrel export and CLAUDE.md**

Create `src/features/journeys/index.ts` exporting services, hooks, and existing components (`DomainGrid`, `DomainJourneyList`, `JourneyCanvas`, `JourneyFilters`).

Create `src/features/journeys/CLAUDE.md` documenting the feature following the template from Task 1.

- [ ] **Step 4: Migrate all 3 journey pages**

Update `src/app/[branch]/journeys/page.tsx`, `src/app/[branch]/journeys/[domain]/page.tsx`, and `src/app/[branch]/journeys/[domain]/[slug]/page.tsx` to import from `@/features/journeys` instead of `@/data/branch-loader`.

- [ ] **Step 5: Run CI checks and commit**

Run: `pnpm typecheck && pnpm lint && pnpm build`

```bash
git add src/features/journeys/ src/app/[branch]/journeys/
git commit -m "feat(journeys): add service layer, query hooks, and CLAUDE.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Lifecycles Feature — Services, Hooks, CLAUDE.md, Page Migration

**Files:**

- Create: `src/features/lifecycles/services/lifecycles.ts`
- Create: `src/features/lifecycles/hooks/use-lifecycles.ts`
- Create: `src/features/lifecycles/index.ts`
- Create: `src/features/lifecycles/CLAUDE.md`
- Modify: `src/app/[branch]/lifecycles/page.tsx`
- Modify: `src/app/[branch]/lifecycles/[slug]/page.tsx`

Follow the same pattern as Tasks 1 and 2. The lifecycles service should expose:

- `getLifecycles(branch)` → `Lifecycle[]`
- `getLifecycle(branch, slug)` → `Lifecycle | undefined`

Read the page files to capture the exact data preparation (e.g., `getEntitiesForLifecycle` usage in the slug page). Include cross-link helper calls in the service if pages use them.

- [ ] **Step 1: Create service, hook, barrel export, CLAUDE.md**
- [ ] **Step 2: Migrate both lifecycle pages**
- [ ] **Step 3: Run CI checks and commit**

```bash
git commit -m "feat(lifecycles): add service layer, query hooks, and CLAUDE.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: API Map Feature — Services, Hooks, CLAUDE.md, Page Migration

**Files:**

- Create: `src/features/api-map/services/api-groups.ts`
- Create: `src/features/api-map/hooks/use-api-groups.ts`
- Create: `src/features/api-map/index.ts`
- Create: `src/features/api-map/CLAUDE.md`
- Modify: `src/app/[branch]/api-map/page.tsx`

Service exposes:

- `getApiGroups(branch)` → `ApiGroup[]`
- `getTotalEndpoints(branch)` → `number`

- [ ] **Step 1: Create service, hook, barrel export, CLAUDE.md**
- [ ] **Step 2: Migrate api-map page**
- [ ] **Step 3: Run CI checks and commit**

```bash
git commit -m "feat(api-map): add service layer, query hooks, and CLAUDE.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Architecture Feature — Services, Hooks, CLAUDE.md, Page Migration

**Files:**

- Create: `src/features/architecture/services/arch-diagrams.ts`
- Create: `src/features/architecture/hooks/use-arch-diagrams.ts`
- Create: `src/features/architecture/index.ts`
- Create: `src/features/architecture/CLAUDE.md`
- Modify: `src/app/[branch]/architecture/page.tsx`
- Modify: `src/app/[branch]/architecture/[slug]/page.tsx`

Service exposes:

- `getArchDiagrams(branch)` → `ArchDiagram[]`
- `getArchDiagram(branch, slug)` → `ArchDiagram | undefined`

- [ ] **Step 1: Create service, hook, barrel export, CLAUDE.md**
- [ ] **Step 2: Migrate both architecture pages**
- [ ] **Step 3: Run CI checks and commit**

```bash
git commit -m "feat(architecture): add service layer, query hooks, and CLAUDE.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Feature Domain Feature — Services, Hooks, CLAUDE.md, Page Migration

**Files:**

- Create: `src/features/feature-domain/services/features.ts`
- Create: `src/features/feature-domain/hooks/use-features.ts`
- Create: `src/features/feature-domain/index.ts`
- Create: `src/features/feature-domain/CLAUDE.md`
- Modify: `src/app/[branch]/features/[domain]/page.tsx`

This is the most complex page — it calls `getFeatureDomains`, `getFeaturesByDomain`, `getChangelogByDomain`, and filters journeys/entities by domain. The service should encapsulate all of this:

- `getFeatureDomains(branch)` → domain list with counts
- `getFeaturesByDomain(branch, domain)` → features for a domain
- `getFeatureDomainPageData(branch, domain)` → all data the page needs (features, changelog, journeys, entities)

Read the page file carefully to capture the full data preparation.

- [ ] **Step 1: Create service, hook, barrel export, CLAUDE.md**
- [ ] **Step 2: Migrate features/[domain] page**
- [ ] **Step 3: Run CI checks and commit**

```bash
git commit -m "feat(feature-domain): add service layer, query hooks, and CLAUDE.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Config Feature — Services, Hooks, CLAUDE.md, Page Migration

**Files:**

- Create: `src/features/config/services/config.ts`
- Create: `src/features/config/hooks/use-config.ts`
- Create: `src/features/config/index.ts`
- Create: `src/features/config/CLAUDE.md`
- Modify: `src/app/[branch]/config/page.tsx`

Service exposes:

- `getConfigEnums(branch)` → `ConfigEnum[]`
- `getRoles(branch)` → `Role[]`

- [ ] **Step 1: Create service, hook, barrel export, CLAUDE.md**
- [ ] **Step 2: Migrate config page**
- [ ] **Step 3: Run CI checks and commit**

```bash
git commit -m "feat(config): add service layer, query hooks, and CLAUDE.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Changelog Feature — Services, Hooks, CLAUDE.md, Page Migration

**Files:**

- Create: `src/features/changelog/services/changelog.ts`
- Create: `src/features/changelog/hooks/use-changelog.ts`
- Create: `src/features/changelog/index.ts`
- Create: `src/features/changelog/CLAUDE.md`
- Modify: `src/app/[branch]/changelog/page.tsx`

Service exposes:

- `getChangelog(branch)` → `ChangelogEntry[]`

- [ ] **Step 1: Create service, hook, barrel export, CLAUDE.md**
- [ ] **Step 2: Migrate changelog page**
- [ ] **Step 3: Run CI checks and commit**

```bash
git commit -m "feat(changelog): add service layer, query hooks, and CLAUDE.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Dashboard Feature — Services, Hooks, CLAUDE.md, Page Migration

**Files:**

- Create: `src/features/dashboard/services/dashboard.ts`
- Create: `src/features/dashboard/hooks/use-dashboard.ts`
- Create: `src/features/dashboard/index.ts`
- Create: `src/features/dashboard/CLAUDE.md`
- Modify: `src/app/[branch]/page.tsx` (dashboard page)

Service exposes:

- `getDashboardData(branch)` → `{ metrics, domains, recentChanges }` — consolidates the 3 function calls the page currently makes

Read the dashboard page to see how it calls `getDashboardMetrics()`, `getFeatureDomains()`, and slices `data.changelog`. Wrap all of that in one service function.

- [ ] **Step 1: Create service, hook, barrel export, CLAUDE.md**
- [ ] **Step 2: Migrate dashboard page**
- [ ] **Step 3: Run CI checks and commit**

```bash
git commit -m "feat(dashboard): add service layer, query hooks, and CLAUDE.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Diff Overview Feature — Services, Hooks, CLAUDE.md, Consumer Migration

**Files:**

- Create: `src/features/diff-overview/services/diff.ts`
- Create: `src/features/diff-overview/hooks/use-diff.ts`
- Create: `src/features/diff-overview/index.ts`
- Create: `src/features/diff-overview/CLAUDE.md`
- Delete: `src/hooks/use-diff-result.ts`
- Modify: 15+ files that import `useDiffResult`

This is the most impactful migration because `useDiffResult` is imported by 15 files across the codebase.

- [ ] **Step 1: Create the diff service**

Create `src/features/diff-overview/services/diff.ts`:

```typescript
import { loadBranch } from '@/data/branch-loader';
import { computeDiff } from '@/data/diff-engine';
import type { DiffResult } from '@/types/diff';

export function getDiff(baseBranch: string, headBranch: string): DiffResult | null {
  const baseData = loadBranch(baseBranch);
  const headData = loadBranch(headBranch);
  if (!baseData || !headData) return null;
  return computeDiff(baseData, headData);
}
```

- [ ] **Step 2: Create the diff query hook**

Create `src/features/diff-overview/hooks/use-diff.ts`:

Read the current `src/hooks/use-diff-result.ts` to understand its interface. The new hook should maintain the same return shape for easy migration:

```typescript
'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { getDiff } from '../services/diff';

/**
 * Returns diff result for the current branch comparison.
 * Drop-in replacement for the old useDiffResult hook.
 */
export function useDiffResult() {
  const mode = useAppStore.use.mode();
  const activeBranch = useAppStore.use.activeBranch();
  const comparisonBranch = useAppStore.use.comparisonBranch();
  const activeData = useAppStore.use.activeData();
  const allBranchData = useAppStore.use.allBranchData();

  const isActive = mode === 'diff' && !!comparisonBranch;

  const diffResult = useMemo(() => {
    if (!isActive || !comparisonBranch) return null;
    const comparisonData = allBranchData[comparisonBranch];
    if (!activeData || !comparisonData) return null;
    return getDiff(activeBranch, comparisonBranch);
  }, [isActive, activeBranch, comparisonBranch, activeData, allBranchData]);

  return {
    isActive,
    compareBranch: comparisonBranch,
    diffResult,
  };
}
```

**Important:** Keep the function name as `useDiffResult` (matching the current name) to minimize consumer changes. Consumers just change their import path.

- [ ] **Step 3: Create barrel export and CLAUDE.md**

Create `src/features/diff-overview/index.ts`:

```typescript
// Services
export { getDiff } from './services/diff';

// Hooks
export { useDiffResult } from './hooks/use-diff';

// Components
export { DiffOverviewView } from './diff-overview-view';
export { DiffDomainGroup } from './diff-domain-group';
export { DiffEmptyState } from './diff-empty-state';
```

Create `src/features/diff-overview/CLAUDE.md`.

- [ ] **Step 4: Update all useDiffResult imports**

In all 15 files that import `useDiffResult`, change the import from:

```typescript
import { useDiffResult } from '@/hooks/use-diff-result';
```

To:

```typescript
import { useDiffResult } from '@/features/diff-overview';
```

Files to update:

1. `src/features/data-model/erd-canvas/index.tsx`
2. `src/features/data-model/entity-list/index.tsx`
3. `src/features/journeys/journey-canvas/index.tsx`
4. `src/features/journeys/domain-grid/index.tsx`
5. `src/features/lifecycles/lifecycle-list/index.tsx`
6. `src/features/lifecycles/lifecycle-canvas/index.tsx`
7. `src/features/api-map/api-list/index.tsx`
8. `src/features/architecture/architecture-canvas/index.tsx`
9. `src/features/architecture/architecture-list/index.tsx`
10. `src/features/config/config-list/index.tsx`
11. `src/features/diff-overview/diff-overview-view/index.tsx`
12. `src/features/feature-domain/feature-domain-view/index.tsx`
13. `src/components/navigation/comparison-selector/index.tsx`
14. `src/components/layout/diff-toolbar/index.tsx`
15. `src/components/navigation/sidebar/index.tsx`

- [ ] **Step 5: Delete the old hook file**

Delete `src/hooks/use-diff-result.ts`.

- [ ] **Step 6: Run CI checks**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: All pass. No remaining imports of the old hook path.

- [ ] **Step 7: Commit**

```bash
git add src/features/diff-overview/ src/hooks/ src/features/ src/components/
git commit -m "feat(diff-overview): add service layer, migrate useDiffResult to feature

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Layout Migration — Branch Layout + generateStaticParams

**Files:**

- Modify: `src/app/[branch]/layout.tsx`

The branch layout is the most complex page — it calls `loadBranch()`, `getAllBranchData()`, `getBranchNames()`, and `getFeatureDomains()`. These come from multiple features.

- [ ] **Step 1: Update layout imports**

In `src/app/[branch]/layout.tsx`, replace direct data imports with feature service imports. The layout needs:

- `loadBranch` and `getAllBranchData` → These stay as direct imports from `@/data/branch-loader` since they serve the `BranchInit` provider (store initialization, not feature-specific)
- `getBranchNames` → stays from `@/data/branch-registry` (used for `generateStaticParams`)
- `getFeatureDomains` → import from `@/features/feature-domain`

Update the import of `getFeatureDomains` from `@/data` to `@/features/feature-domain`.

Note: `loadBranch` and `getAllBranchData` in the layout serve the `BranchInit` provider which initializes the Zustand store — this is infrastructure, not feature-specific. They stay as `@/data/branch-loader` imports.

- [ ] **Step 2: Run CI checks and commit**

Run: `pnpm typecheck && pnpm lint && pnpm build`

```bash
git add src/app/[branch]/layout.tsx
git commit -m "refactor: migrate layout imports to feature services

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Final Verification and Cleanup

**Files:** Verification only + minor cleanup

- [ ] **Step 1: Verify no pages import from @/data directly (except layout)**

Search for remaining `@/data/branch-loader` or `@/data/index` imports in page files:

Run: `grep -rn '@/data' src/app/ --include='*.tsx' | grep -v 'layout.tsx'`

Expected: Zero results. All pages should import from `@/features/` now.

- [ ] **Step 2: Verify no remaining useDiffResult imports from old path**

Run: `grep -rn "from '@/hooks/use-diff-result'" src/ --include='*.ts' --include='*.tsx'`

Expected: Zero results.

- [ ] **Step 3: Run full CI check**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck && pnpm build`
Expected: All pass.

- [ ] **Step 4: Verify all features have the required files**

Check each feature directory has `services/`, `hooks/`, `index.ts`, and `CLAUDE.md`:

Run: `for d in data-model journeys lifecycles api-map architecture feature-domain config changelog dashboard diff-overview; do echo "=== $d ==="; ls src/features/$d/services/ src/features/$d/hooks/ src/features/$d/index.ts src/features/$d/CLAUDE.md 2>&1; done`

Expected: All files present for all 10 features.

- [ ] **Step 5: Commit if any adjustments needed**

```bash
git commit -m "chore: Phase 7 final verification and cleanup

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```
