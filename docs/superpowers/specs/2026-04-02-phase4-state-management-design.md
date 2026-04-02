# Phase 4: State Management — Zustand + Mode System

> Migrate from scattered React Context to a centralized Zustand store with first-class mode system. Install TanStack Query infrastructure for future API readiness.

**Date:** 2026-04-02
**Author:** Kyle Holloway + Claude
**Status:** Approved
**Spec reference:** `docs/superpowers/specs/2026-04-02-codebase-overhaul-design.md` — Phase 4 section

---

## Problem Statement

The current state management works but doesn't scale:

- **3 nested contexts** (Toast → Branch → Docs) — adding new global state means adding new contexts and more nesting
- **Diff mode is bolted on** — `useDiffMode` syncs URL params to BranchProvider via `useEffect`, causing the `useSearchParams` Suspense boundary build error on the features page
- **No mode system** — diff and trace modes are ad-hoc boolean checks scattered across components, not first-class app states
- **No persistence** — theme preference, last active branch, filter states reset on reload
- **No data fetching infrastructure** — when Archway adds a live API, every data access point needs to be wrapped in query hooks from scratch

---

## Solution

### Zustand Store

**File:** `src/stores/app-store.ts`

Single store replacing BranchProvider and DocsProvider:

```typescript
interface AppState {
  // Mode
  mode: 'default' | 'diff' | 'trace';

  // Branch
  activeBranch: string;
  comparisonBranch: string | null;

  // Selection (detail panel)
  selectedItem: SelectedItem | null;

  // Theme
  theme: 'dark' | 'light';

  // Actions
  setMode: (mode: 'default' | 'diff' | 'trace') => void;
  activateDiffMode: (branch: string) => void;
  deactivateDiffMode: () => void;
  setActiveBranch: (branch: string) => void;
  selectItem: (item: SelectedItem) => void;
  clearSelection: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}
```

Persisted to localStorage: `theme`, `activeBranch`.

Wrapped with `createSelectors` for granular subscriptions — components only re-render when their specific slice changes:

```typescript
const isDiffMode = useAppStore.use.mode() === 'diff';
const selectedItem = useAppStore.use.selectedItem();
```

### Derived Hooks

Convenience hooks built on the store, replacing the scattered context hooks:

```typescript
// Replaces useBranchData().isDiffMode
export const useIsDiffMode = () => useAppStore.use.mode() === 'diff';

// Replaces useBranchData().comparisonBranch
export const useComparisonBranch = () => useAppStore.use.comparisonBranch();

// Replaces useDocsContext().selectedItem
export const useSelectedItem = () => useAppStore.use.selectedItem();

// Replaces useDiffMode() — computes diff result from store state
export function useDiffResult() { ... }

// Replaces useBranchHref() — reads from store instead of context
export function useBranchHref() { ... }
```

### URL Sync

Branch and comparison state stay URL-driven (correct for Next.js SSG) but the sync is cleaner:

- `activeBranch` comes from the `[branch]` route param — set once at layout level via `useEffect`
- `comparisonBranch` syncs bidirectionally with `?compare=` query param
- A single `useUrlSync` hook in the branch layout handles both directions, replacing the current `useDiffMode` + `useSearchParams` chain that causes the Suspense error

### TanStack Query Setup

Install `@tanstack/react-query` and add the provider. Not used for data fetching today (static site) but the infrastructure is in place:

- `QueryClientProvider` wraps the app
- `queryClient` configured with `staleTime: Infinity` default (static data)
- When Archway ships a live API, data access hooks switch from `useMemo` to `useQuery` — same interface, different implementation

### Migration Kill List

| Current                                                       | Replacement                             |
| ------------------------------------------------------------- | --------------------------------------- |
| `DocsProvider` (selectedItem, clearSelection)                 | `useAppStore`                           |
| `BranchProvider` (activeBranch, comparisonBranch, isDiffMode) | `useAppStore` + derived hooks           |
| `useDiffMode` hook                                            | `useAppStore` actions + `useDiffResult` |
| `useBranchHref` in branch-provider                            | Standalone hook reading from store      |
| `useBranchData`                                               | `useAppStore` selectors                 |

### Migration Approach

Build new store alongside existing providers. Migrate one consumer at a time. Delete old providers when all consumers are migrated. The `useSearchParams` Suspense error gets fixed as a side effect of the cleaner URL sync.

---

## What's NOT Included

- Canvas state (pan/zoom) — stays in `usePanZoom` external store (correct for 60fps rendering)
- Toast state — stays in its own small provider (isolated concern)
- Filter state in list components — stays local (page-scoped, not global)
- Actual API data fetching — TanStack Query is infrastructure only

---

## Success Criteria

- **Zero React Context** for branch/selection state (Zustand replaces both)
- **First-class mode system** — `mode: 'default' | 'diff' | 'trace'` as a single state field
- **`useSearchParams` build error fixed** — cleaner URL sync eliminates the Suspense boundary issue
- **localStorage persistence** for theme and branch
- **TanStack Query provider** installed and configured
- **All CI checks pass**
- **Visually identical** — no user-facing changes
