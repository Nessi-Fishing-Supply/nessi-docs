# Phase 4: State Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace BranchProvider and DocsProvider with a centralized Zustand store, fix the `useSearchParams` Suspense build error, install TanStack Query infrastructure, and establish a first-class mode system.

**Architecture:** Build Zustand store with `createSelectors` for granular subscriptions. Create derived hooks that match existing API signatures so migration is import-path-only for most consumers. Sync branch/comparison state bidirectionally with URL params via a single `useUrlSync` hook. Install TanStack Query provider with static-data defaults.

**Tech Stack:** Zustand (state management), @tanstack/react-query (query infrastructure), Next.js App Router URL params

**Spec reference:** `docs/superpowers/specs/2026-04-02-phase4-state-management-design.md`

---

## File Map

### New Files

| File                               | Purpose                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| `src/stores/app-store.ts`          | Zustand store with mode, branch, selection, theme state  |
| `src/stores/selectors.ts`          | `createSelectors` utility for auto-generated hooks       |
| `src/hooks/use-url-sync.ts`        | Bidirectional URL ↔ store sync for branch and comparison |
| `src/hooks/use-diff-result.ts`     | Computed diff from store state (replaces useDiffMode)    |
| `src/hooks/use-branch-href.ts`     | Path helper reading from store (replaces useBranchHref)  |
| `src/providers/query-provider.tsx` | TanStack Query client and provider                       |

### Modified Files

| File                          | Changes                                                          |
| ----------------------------- | ---------------------------------------------------------------- |
| `package.json`                | Add zustand, @tanstack/react-query                               |
| `src/app/layout.tsx`          | Add QueryProvider                                                |
| `src/app/[branch]/layout.tsx` | Replace BranchProvider/DocsProvider with store init + useUrlSync |
| ~28 consumer files            | Update imports from providers to store hooks                     |

### Deleted Files

| File                                | Reason                                      |
| ----------------------------------- | ------------------------------------------- |
| `src/providers/branch-provider.tsx` | Replaced by app-store                       |
| `src/providers/docs-provider.tsx`   | Replaced by app-store                       |
| `src/hooks/use-diff-mode.ts`        | Replaced by use-diff-result + store actions |

---

### Task 1: Install dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install zustand and @tanstack/react-query**

```bash
pnpm add zustand @tanstack/react-query
```

- [ ] **Step 2: Verify and commit**

```bash
pnpm typecheck
git add package.json pnpm-lock.yaml
git commit -m "chore: add zustand and @tanstack/react-query"
```

---

### Task 2: Create Zustand store with selectors

**Files:**

- Create: `src/stores/selectors.ts`
- Create: `src/stores/app-store.ts`

- [ ] **Step 1: Create the `createSelectors` utility**

`src/stores/selectors.ts` — auto-generates `.use.fieldName()` hooks from a Zustand store:

```typescript
import type { StoreApi, UseBoundStore } from 'zustand';

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export function createSelectors<S extends UseBoundStore<StoreApi<object>>>(_store: S) {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {} as Record<string, () => unknown>;
  for (const k of Object.keys(store.getState())) {
    (store.use as Record<string, () => unknown>)[k] = () => store((s) => s[k as keyof typeof s]);
  }
  return store;
}
```

- [ ] **Step 2: Create the app store**

`src/stores/app-store.ts`:

Read the existing `src/types/docs-context.ts` for the `SelectedItem` type, and `src/types/branch.ts` for `BranchData`/`BranchInfo` types. Then create the store.

The store must hold:

- `mode: 'default' | 'diff' | 'trace'`
- `activeBranch: string` (set from route param)
- `comparisonBranch: string | null`
- `selectedItem: SelectedItem | null`
- `theme: 'dark' | 'light'`
- `activeData: BranchData | null`
- `allBranchData: Record<string, BranchData>`
- `branches: BranchInfo[]`

Actions:

- `initBranch(name, data, allData)` — called once at layout level
- `setComparisonBranch(name: string | null)`
- `activateDiffMode(branch: string)` — sets comparison + mode
- `deactivateDiffMode()` — clears comparison + mode
- `selectItem(item: SelectedItem)`
- `clearSelection()`
- `setTheme(theme)`

Persist `theme` to localStorage via zustand `persist` middleware (only theme — branch comes from URL).

Export `useAppStore` wrapped with `createSelectors`.

- [ ] **Step 3: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "feat: add Zustand app store with mode system and selectors"
```

---

### Task 3: Create derived hooks

**Files:**

- Create: `src/hooks/use-diff-result.ts`
- Create: `src/hooks/use-branch-href.ts`

- [ ] **Step 1: Create `use-diff-result.ts`**

Replaces `useDiffMode`. Reads from store, computes diff result:

```typescript
'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { computeDiff } from '@/data/diff-engine';
import type { DiffResult } from '@/types/diff';

export function useDiffResult(): {
  isActive: boolean;
  compareBranch: string | null;
  diffResult: DiffResult | null;
} {
  const mode = useAppStore.use.mode();
  const comparisonBranch = useAppStore.use.comparisonBranch();
  const activeData = useAppStore.use.activeData();
  const allBranchData = useAppStore.use.allBranchData();

  const comparisonData = comparisonBranch ? (allBranchData[comparisonBranch] ?? null) : null;

  const diffResult = useMemo<DiffResult | null>(() => {
    if (!comparisonData || !activeData) return null;
    return computeDiff(activeData, comparisonData);
  }, [comparisonData, activeData]);

  return {
    isActive: mode === 'diff' && !!comparisonData,
    compareBranch: comparisonBranch,
    diffResult,
  };
}
```

- [ ] **Step 2: Create `use-branch-href.ts`**

Replaces the `useBranchHref` from branch-provider. Reads from store:

```typescript
'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';

export function useBranchHref() {
  const activeBranch = useAppStore.use.activeBranch();
  const comparisonBranch = useAppStore.use.comparisonBranch();

  return useCallback(
    (path: string) => {
      const base = `/${activeBranch}${path.startsWith('/') ? path : `/${path}`}`;
      if (!comparisonBranch) return base;
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}compare=${comparisonBranch}`;
    },
    [activeBranch, comparisonBranch],
  );
}
```

- [ ] **Step 3: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "feat: add derived hooks (useDiffResult, useBranchHref) reading from Zustand store"
```

---

### Task 4: Create URL sync hook and QueryProvider

**Files:**

- Create: `src/hooks/use-url-sync.ts`
- Create: `src/providers/query-provider.tsx`

- [ ] **Step 1: Create `use-url-sync.ts`**

Single hook that syncs URL `?compare=` param ↔ store. Replaces the `useDiffMode` sync logic that caused the Suspense error.

```typescript
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';

/**
 * Bidirectional sync between URL params and Zustand store.
 * Must be rendered inside a Suspense boundary (uses useSearchParams).
 */
export function useUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const store = useAppStore;

  const urlCompare = searchParams.get('compare');
  const storeCompare = store.use.comparisonBranch();
  const allBranchData = store.use.allBranchData();
  const activeBranch = store.use.activeBranch();

  // URL → Store: sync compare param to store on URL change
  useEffect(() => {
    if (urlCompare && urlCompare !== activeBranch && allBranchData[urlCompare]) {
      if (storeCompare !== urlCompare) {
        store.getState().activateDiffMode(urlCompare);
      }
    } else if (!urlCompare && storeCompare) {
      store.getState().deactivateDiffMode();
    }
  }, [urlCompare, activeBranch, allBranchData, storeCompare, store]);

  // Expose URL mutation functions for consumers that need to change the URL
  return {
    activateDiff: (branchName: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('compare', branchName);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    deactivateDiff: () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('compare');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
  };
}
```

- [ ] **Step 2: Create `src/providers/query-provider.tsx`**

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity, // Static data — never stale
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "feat: add URL sync hook and TanStack Query provider"
```

---

### Task 5: Wire up layouts with new store

**Files:**

- Modify: `src/app/layout.tsx`
- Modify: `src/app/[branch]/layout.tsx`

- [ ] **Step 1: Read both layout files**

- [ ] **Step 2: Update root layout**

Add `QueryProvider` wrapping `ToastProvider`:

```tsx
import { QueryProvider } from '@/providers/query-provider';

// In the JSX:
<QueryProvider>
  <ToastProvider>{children}</ToastProvider>
</QueryProvider>;
```

- [ ] **Step 3: Update branch layout**

Replace `BranchProvider` + `DocsProvider` with store initialization + URL sync. The branch layout is a server component that passes data down to a client component wrapper.

Create a client component `BranchInit` that:

1. Calls `useAppStore.getState().initBranch(name, data, allData)` on mount
2. Renders `useUrlSync()` inside a Suspense boundary
3. Renders children

Replace the provider nesting in the layout with `<BranchInit>`.

Keep the layout as a server component — only the BranchInit wrapper is client.

- [ ] **Step 4: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "feat: wire Zustand store and QueryProvider into app layouts"
```

---

### Task 6: Migrate DocsProvider consumers

**Files:**

- Modify: 11 files that import `useDocsContext`

- [ ] **Step 1: Migrate all useDocsContext consumers**

In each file, replace:

```typescript
import { useDocsContext } from '@/providers/docs-provider';
const { selectedItem, setSelectedItem, clearSelection } = useDocsContext();
```

With:

```typescript
import { useAppStore } from '@/stores/app-store';
const selectedItem = useAppStore.use.selectedItem();
const selectItem = useAppStore.use.selectItem();
const clearSelection = useAppStore.use.clearSelection();
```

Or for files that only call `setSelectedItem`:

```typescript
import { useAppStore } from '@/stores/app-store';
const selectItem = useAppStore.use.selectItem();
```

Files to update:

- `src/components/layout/app-shell/index.tsx`
- `src/components/layout/detail-panel/index.tsx`
- `src/features/data-model/entity-list/index.tsx`
- `src/features/data-model/erd-canvas/index.tsx`
- `src/features/api-map/api-list/index.tsx`
- `src/features/config/config-list/index.tsx`
- `src/features/architecture/architecture-list/index.tsx`
- `src/features/diff-overview/diff-overview-view/index.tsx`
- `src/features/feature-domain/feature-domain-view/index.tsx`
- `src/features/journeys/journey-canvas/index.tsx`
- `src/features/lifecycles/lifecycle-list/index.tsx`

Note: The store action is `selectItem` (not `setSelectedItem`). Update call sites accordingly.

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "refactor: migrate DocsProvider consumers to Zustand store"
```

---

### Task 7: Migrate BranchProvider consumers (useBranchData)

**Files:**

- Modify: 9 files that import `useBranchData`

- [ ] **Step 1: Migrate useBranchData consumers**

Each consumer needs different slices. Replace `useBranchData()` destructuring with specific store selectors:

- `activeBranch` → `useAppStore.use.activeBranch()`
- `activeData` → `useAppStore.use.activeData()`
- `comparisonBranch` → `useAppStore.use.comparisonBranch()`
- `comparisonData` → derive from `allBranchData[comparisonBranch]`
- `isDiffMode` → `useAppStore.use.mode() === 'diff'`
- `setComparisonBranch` → `useAppStore.use.setComparisonBranch()`
- `branches` → `useAppStore.use.branches()`
- `allBranchData` → `useAppStore.use.allBranchData()`

Files:

- `src/components/layout/app-shell/index.tsx`
- `src/components/layout/diff-toolbar/index.tsx`
- `src/components/navigation/branch-switcher/index.tsx`
- `src/components/navigation/comparison-selector/index.tsx`
- `src/components/navigation/topbar/index.tsx`
- `src/components/navigation/sidebar/index.tsx`
- `src/features/diff-overview/diff-empty-state/index.tsx`
- `src/features/diff-overview/diff-overview-view/index.tsx`
- `src/features/lifecycles/lifecycle-canvas/index.tsx`

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "refactor: migrate useBranchData consumers to Zustand store"
```

---

### Task 8: Migrate useBranchHref consumers

**Files:**

- Modify: 18 files that import `useBranchHref` from `@/providers/branch-provider`

- [ ] **Step 1: Update imports**

In each file, replace:

```typescript
import { useBranchHref } from '@/providers/branch-provider';
```

With:

```typescript
import { useBranchHref } from '@/hooks/use-branch-href';
```

The hook API is identical — no call site changes needed.

Files (18):

- `src/app/[branch]/architecture/[slug]/client.tsx`
- `src/app/[branch]/journeys/[domain]/[slug]/client.tsx`
- `src/app/[branch]/lifecycles/[slug]/client.tsx`
- `src/components/layout/detail-panel/panels/step-panel.tsx`
- `src/components/navigation/sidebar/index.tsx`
- `src/features/api-map/api-list/index.tsx`
- `src/features/architecture/architecture-list/index.tsx`
- `src/features/canvas/components/entity-tooltip.tsx`
- `src/features/canvas/components/node-tooltip.tsx`
- `src/features/changelog/changelog-feed/index.tsx`
- `src/features/config/config-list/index.tsx`
- `src/features/data-model/entity-list/index.tsx`
- `src/features/feature-domain/feature-domain-view/index.tsx`
- `src/features/journeys/domain-grid/index.tsx`
- `src/features/journeys/domain-journey-list/index.tsx`
- `src/features/lifecycles/lifecycle-list/index.tsx`
- `src/features/search/search-dialog/index.tsx`
- `src/features/dashboard/dashboard-view/index.tsx`

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "refactor: migrate useBranchHref consumers to standalone hook"
```

---

### Task 9: Migrate useDiffMode consumers

**Files:**

- Modify: 16 files that import `useDiffMode`

- [ ] **Step 1: Migrate useDiffMode consumers**

Replace `useDiffMode()` with `useDiffResult()` + store actions. The API changes:

Old:

```typescript
import { useDiffMode } from '@/hooks/use-diff-mode';
const { isActive, compareBranch, diffResult, activate, deactivate } = useDiffMode();
```

New:

```typescript
import { useDiffResult } from '@/hooks/use-diff-result';
const { isActive, compareBranch, diffResult } = useDiffResult();
// For activate/deactivate, use useUrlSync in comparison-selector only
```

Most consumers only read `isActive`, `compareBranch`, `diffResult` — they don't call `activate`/`deactivate`. Only `comparison-selector` calls those, and it should use `useUrlSync()`.

For components that were wrapped in `<Suspense>` because of `useSearchParams` in `useDiffMode` — they no longer need it since `useDiffResult` doesn't use `useSearchParams`.

Files (16):

- `src/components/layout/diff-toolbar/index.tsx`
- `src/components/navigation/comparison-selector/index.tsx`
- `src/components/navigation/sidebar/index.tsx`
- `src/features/api-map/api-list/index.tsx`
- `src/features/architecture/architecture-canvas/index.tsx`
- `src/features/architecture/architecture-list/index.tsx`
- `src/features/config/config-list/index.tsx`
- `src/features/data-model/entity-list/index.tsx`
- `src/features/data-model/erd-canvas/index.tsx`
- `src/features/diff-overview/diff-empty-state/index.tsx`
- `src/features/diff-overview/diff-overview-view/index.tsx`
- `src/features/feature-domain/feature-domain-view/index.tsx`
- `src/features/journeys/domain-grid/index.tsx`
- `src/features/journeys/journey-canvas/index.tsx`
- `src/features/lifecycles/lifecycle-canvas/index.tsx`
- `src/features/lifecycles/lifecycle-list/index.tsx`

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "refactor: migrate useDiffMode consumers to useDiffResult + store"
```

---

### Task 10: Delete old providers and hooks

**Files:**

- Delete: `src/providers/branch-provider.tsx`
- Delete: `src/providers/docs-provider.tsx`
- Delete: `src/hooks/use-diff-mode.ts`

- [ ] **Step 1: Verify no remaining imports**

```bash
grep -rn "branch-provider\|docs-provider\|use-diff-mode" src/ --include="*.tsx" --include="*.ts"
```

Should return zero results (excluding the files being deleted).

- [ ] **Step 2: Delete files**

```bash
rm src/providers/branch-provider.tsx
rm src/providers/docs-provider.tsx
rm src/hooks/use-diff-mode.ts
```

- [ ] **Step 3: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "refactor: delete old providers and useDiffMode — Zustand store is sole state source"
```

---

### Task 11: Final validation

- [ ] **Step 1: Full CI check**

```bash
pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck
```

- [ ] **Step 2: Verify no old provider references**

```bash
grep -rn "DocsProvider\|BranchProvider\|useDocsContext\|useBranchData\|useDiffMode" src/ --include="*.tsx" --include="*.ts"
```

Should return zero results.

- [ ] **Step 3: Verify store is the sole state source**

```bash
# Only store should have branch/selection state
grep -rn "createContext" src/providers/ --include="*.tsx"
# Should only show query-provider (QueryClientProvider) and toast
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: Phase 4 complete — Zustand store with mode system, TanStack Query infrastructure"
```
