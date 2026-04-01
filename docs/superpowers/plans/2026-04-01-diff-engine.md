# Diff Engine & Visual Diff Overlay — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a centralized diff engine that compares two `BranchData` objects, a comparison selector in the sidebar, a diff toolbar banner, and visual diff overlays on all list views.

**Architecture:** Pure `computeDiff()` function produces a typed `DiffResult` comparing base and head `BranchData`. A `useDiffMode()` hook reads `?compare=` from the URL, pulls comparison data from `BranchProvider`, and memoizes the diff result. UI components consume the diff result to apply color-coded visual treatments (added/modified/removed/unchanged) to list rows.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, SCSS Modules, `useSearchParams`/`useRouter` from `next/navigation`

---

## File Map

### New Files

| File                                                                        | Responsibility                                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/types/diff.ts`                                                         | `DiffStatus`, `DiffSet<T>`, `ModifiedItem<T>`, `FieldChange`, `DiffSummary`, `DiffResult`, `ApiGroupDiff` types |
| `src/data/diff-engine.ts`                                                   | `computeDiff(base, head): DiffResult` — pure function, no side effects                                          |
| `src/hooks/use-diff-mode.ts`                                                | `useDiffMode()` — reads `?compare=` param, calls `computeDiff`, memoizes result                                 |
| `src/styles/variables/_diff.scss`                                           | CSS custom properties for diff colors/backgrounds                                                               |
| `src/components/layout/comparison-selector/index.tsx`                       | Dropdown in sidebar to pick comparison branch                                                                   |
| `src/components/layout/comparison-selector/comparison-selector.module.scss` | Styles for comparison selector                                                                                  |
| `src/components/layout/diff-toolbar/index.tsx`                              | Banner bar at top of content showing comparison state + summary counts                                          |
| `src/components/layout/diff-toolbar/diff-toolbar.module.scss`               | Styles for diff toolbar                                                                                         |
| `src/components/ui/diff-badge/index.tsx`                                    | Small colored pill ("NEW", "MODIFIED", "REMOVED") reused across list views                                      |
| `src/components/ui/diff-badge/diff-badge.module.scss`                       | Styles for diff badge                                                                                           |

### Modified Files

| File                                                                        | Change                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/styles/globals.scss`                                                   | Add `@use 'variables/diff' as *;` import                               |
| `src/providers/branch-provider.tsx`                                         | Wire `setComparisonBranch` to URL `?compare=` param (sync state ↔ URL) |
| `src/components/layout/sidebar/index.tsx`                                   | Render `ComparisonSelector` above `BranchSwitcher`                     |
| `src/components/layout/sidebar/sidebar.module.scss`                         | Add `.comparisonSection` spacing                                       |
| `src/components/layout/app-shell/index.tsx`                                 | Accept `diffToolbar` slot, render above `{children}` in `<main>`       |
| `src/app/[branch]/layout.tsx`                                               | Render `DiffToolbar` in `AppShell`                                     |
| `src/features/data-model/entity-list/index.tsx`                             | Consume `useDiffMode`, apply diff row styling                          |
| `src/features/data-model/entity-list/entity-list.module.scss`               | Add diff row classes                                                   |
| `src/features/api-map/api-list/index.tsx`                                   | Consume `useDiffMode`, apply diff row styling                          |
| `src/features/api-map/api-list/api-list.module.scss`                        | Add diff row classes                                                   |
| `src/features/lifecycles/lifecycle-list/index.tsx`                          | Consume `useDiffMode`, apply diff row styling                          |
| `src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss`         | Add diff row classes                                                   |
| `src/features/architecture/architecture-list/index.tsx`                     | Consume `useDiffMode`, apply diff row styling                          |
| `src/features/architecture/architecture-list/architecture-list.module.scss` | Add diff row classes                                                   |
| `src/features/config/config-list/index.tsx`                                 | Consume `useDiffMode`, apply diff row styling                          |
| `src/features/config/config-list/config-list.module.scss`                   | Add diff row classes                                                   |

---

## Task 1: Diff Types

**Files:**

- Create: `src/types/diff.ts`

- [ ] **Step 1: Create the diff type definitions**

```ts
// src/types/diff.ts

import type { Entity } from '@/types/data-model';
import type { Journey } from '@/types/journey';
import type { Lifecycle } from '@/types/lifecycle';
import type { ApiGroup, ApiEndpoint } from '@/types/api-contract';
import type { ArchDiagram } from '@/types/architecture';
import type { Feature } from '@/types/feature';
import type { ErdNode, ErdEdge } from '@/types/entity-relationship';
import type { ConfigEnum } from '@/types/config-ref';

export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

export interface FieldChange {
  field: string;
  baseValue: unknown;
  headValue: unknown;
}

export interface ModifiedItem<T> {
  base: T;
  head: T;
  changes: FieldChange[];
}

export interface DiffSet<T> {
  added: T[];
  removed: T[];
  modified: ModifiedItem<T>[];
  unchanged: T[];
  statusMap: Map<string, DiffStatus>;
}

export interface ApiGroupDiff {
  group: ApiGroup;
  status: DiffStatus;
  endpointDiffs: {
    added: ApiEndpoint[];
    removed: ApiEndpoint[];
    modified: { base: ApiEndpoint; head: ApiEndpoint; changes: FieldChange[] }[];
    unchanged: ApiEndpoint[];
  };
}

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  byDomain: Record<string, { added: number; removed: number; modified: number }>;
}

export interface DiffResult {
  entities: DiffSet<Entity>;
  journeys: DiffSet<Journey>;
  lifecycles: DiffSet<Lifecycle>;
  apiGroups: DiffSet<ApiGroup>;
  apiGroupDiffs: ApiGroupDiff[];
  archDiagrams: DiffSet<ArchDiagram>;
  features: DiffSet<Feature>;
  erdNodes: DiffSet<ErdNode>;
  erdEdges: DiffSet<ErdEdge>;
  configEnums: DiffSet<ConfigEnum>;
  summary: DiffSummary;
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS (types are only definitions, no consumers yet)

- [ ] **Step 3: Commit**

```bash
git add src/types/diff.ts
git commit -m "feat(diff): add diff engine type definitions"
```

---

## Task 2: Diff Engine — Core `diffSet` Function

**Files:**

- Create: `src/data/diff-engine.ts`

This task builds the generic `diffSet<T>()` function that compares two arrays by a key extractor.

- [ ] **Step 1: Create `diff-engine.ts` with `diffSet` and `computeDiff`**

```ts
// src/data/diff-engine.ts

import type { BranchData } from '@/types/branch';
import type { ApiEndpoint, ApiGroup } from '@/types/api-contract';
import type {
  DiffSet,
  DiffResult,
  DiffSummary,
  DiffStatus,
  FieldChange,
  ModifiedItem,
  ApiGroupDiff,
} from '@/types/diff';

/**
 * Compare two arrays by a stable key. Produces added/removed/modified/unchanged
 * buckets plus a statusMap for O(1) lookup.
 */
function diffSet<T extends Record<string, unknown>>(
  baseItems: T[],
  headItems: T[],
  getKey: (item: T) => string,
): DiffSet<T> {
  const baseMap = new Map<string, T>();
  for (const item of baseItems) baseMap.set(getKey(item), item);

  const headMap = new Map<string, T>();
  for (const item of headItems) headMap.set(getKey(item), item);

  const added: T[] = [];
  const removed: T[] = [];
  const modified: ModifiedItem<T>[] = [];
  const unchanged: T[] = [];
  const statusMap = new Map<string, DiffStatus>();

  // Check head items against base
  for (const [key, headItem] of headMap) {
    const baseItem = baseMap.get(key);
    if (!baseItem) {
      added.push(headItem);
      statusMap.set(key, 'added');
    } else {
      const changes = diffFields(baseItem, headItem);
      if (changes.length > 0) {
        modified.push({ base: baseItem, head: headItem, changes });
        statusMap.set(key, 'modified');
      } else {
        unchanged.push(headItem);
        statusMap.set(key, 'unchanged');
      }
    }
  }

  // Items only in base are removed
  for (const [key, baseItem] of baseMap) {
    if (!headMap.has(key)) {
      removed.push(baseItem);
      statusMap.set(key, 'removed');
    }
  }

  return { added, removed, modified, unchanged, statusMap };
}

/**
 * Shallow field comparison: compare top-level properties via JSON.stringify.
 */
function diffFields<T extends Record<string, unknown>>(base: T, head: T): FieldChange[] {
  const changes: FieldChange[] = [];
  const allKeys = new Set([...Object.keys(base), ...Object.keys(head)]);

  for (const field of allKeys) {
    const baseVal = base[field];
    const headVal = head[field];
    if (JSON.stringify(baseVal) !== JSON.stringify(headVal)) {
      changes.push({ field, baseValue: baseVal, headValue: headVal });
    }
  }

  return changes;
}

/**
 * Diff API endpoints within a matched group pair.
 */
function diffEndpoints(
  baseEndpoints: ApiEndpoint[],
  headEndpoints: ApiEndpoint[],
): ApiGroupDiff['endpointDiffs'] {
  const getKey = (ep: ApiEndpoint) => `${ep.method}:${ep.path}`;
  const baseMap = new Map<string, ApiEndpoint>();
  for (const ep of baseEndpoints) baseMap.set(getKey(ep), ep);
  const headMap = new Map<string, ApiEndpoint>();
  for (const ep of headEndpoints) headMap.set(getKey(ep), ep);

  const added: ApiEndpoint[] = [];
  const removed: ApiEndpoint[] = [];
  const modified: { base: ApiEndpoint; head: ApiEndpoint; changes: FieldChange[] }[] = [];
  const unchanged: ApiEndpoint[] = [];

  for (const [key, headEp] of headMap) {
    const baseEp = baseMap.get(key);
    if (!baseEp) {
      added.push(headEp);
    } else {
      const changes = diffFields(
        baseEp as unknown as Record<string, unknown>,
        headEp as unknown as Record<string, unknown>,
      );
      if (changes.length > 0) {
        modified.push({ base: baseEp, head: headEp, changes });
      } else {
        unchanged.push(headEp);
      }
    }
  }

  for (const [key, baseEp] of baseMap) {
    if (!headMap.has(key)) removed.push(baseEp);
  }

  return { added, removed, modified, unchanged };
}

/**
 * Build per-group diffs for API groups, including endpoint-level diffing.
 */
function diffApiGroups(baseGroups: ApiGroup[], headGroups: ApiGroup[]): ApiGroupDiff[] {
  const baseMap = new Map<string, ApiGroup>();
  for (const g of baseGroups) baseMap.set(g.name, g);
  const headMap = new Map<string, ApiGroup>();
  for (const g of headGroups) headMap.set(g.name, g);

  const result: ApiGroupDiff[] = [];

  for (const [name, headGroup] of headMap) {
    const baseGroup = baseMap.get(name);
    if (!baseGroup) {
      result.push({
        group: headGroup,
        status: 'added',
        endpointDiffs: {
          added: headGroup.endpoints,
          removed: [],
          modified: [],
          unchanged: [],
        },
      });
    } else {
      const endpointDiffs = diffEndpoints(baseGroup.endpoints, headGroup.endpoints);
      const hasChanges =
        endpointDiffs.added.length > 0 ||
        endpointDiffs.removed.length > 0 ||
        endpointDiffs.modified.length > 0;
      result.push({
        group: headGroup,
        status: hasChanges ? 'modified' : 'unchanged',
        endpointDiffs,
      });
    }
  }

  for (const [name, baseGroup] of baseMap) {
    if (!headMap.has(name)) {
      result.push({
        group: baseGroup,
        status: 'removed',
        endpointDiffs: {
          added: [],
          removed: baseGroup.endpoints,
          modified: [],
          unchanged: [],
        },
      });
    }
  }

  return result;
}

/**
 * Build summary counts from individual DiffSets.
 */
function buildSummary(
  sets: Record<string, { added: unknown[]; removed: unknown[]; modified: unknown[] }>,
): DiffSummary {
  let added = 0;
  let removed = 0;
  let modified = 0;
  const byDomain: DiffSummary['byDomain'] = {};

  for (const [domain, set] of Object.entries(sets)) {
    const a = set.added.length;
    const r = set.removed.length;
    const m = set.modified.length;
    added += a;
    removed += r;
    modified += m;
    if (a > 0 || r > 0 || m > 0) {
      byDomain[domain] = { added: a, removed: r, modified: m };
    }
  }

  return { added, removed, modified, byDomain };
}

/**
 * Compare two BranchData objects and produce a full DiffResult.
 * `base` is what you're comparing against, `head` is what you're viewing.
 */
export function computeDiff(base: BranchData, head: BranchData): DiffResult {
  const entities = diffSet(base.entities, head.entities, (e) => e.name);
  const journeys = diffSet(base.journeys, head.journeys, (j) => j.slug);
  const lifecycles = diffSet(base.lifecycles, head.lifecycles, (l) => l.slug);
  const apiGroups = diffSet(base.apiGroups, head.apiGroups, (g) => g.name);
  const apiGroupDiffs = diffApiGroups(base.apiGroups, head.apiGroups);
  const archDiagrams = diffSet(base.archDiagrams, head.archDiagrams, (d) => d.slug);
  const features = diffSet(base.features, head.features, (f) => f.slug);
  const erdNodes = diffSet(base.erdNodes, head.erdNodes, (n) => n.id);
  const erdEdges = diffSet(base.erdEdges, head.erdEdges, (e) => `${e.from}:${e.to}`);
  const configEnums = diffSet(base.configEnums, head.configEnums, (c) => c.slug);

  const summary = buildSummary({
    entities,
    journeys,
    lifecycles,
    apiGroups,
    archDiagrams,
    features,
    erdNodes,
    erdEdges,
    configEnums,
  });

  return {
    entities,
    journeys,
    lifecycles,
    apiGroups,
    apiGroupDiffs,
    archDiagrams,
    features,
    erdNodes,
    erdEdges,
    configEnums,
    summary,
  };
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/data/diff-engine.ts
git commit -m "feat(diff): implement computeDiff engine with diffSet, field diffing, and API group diffing"
```

---

## Task 3: Diff CSS Custom Properties

**Files:**

- Create: `src/styles/variables/_diff.scss`
- Modify: `src/styles/globals.scss`

- [ ] **Step 1: Create diff SCSS variables**

```scss
// src/styles/variables/_diff.scss

// Diff mode colors — matches CHANGE_TYPE_CONFIG from changelog
:root {
  --diff-added: #3d8c75;
  --diff-modified: #7b8fcd;
  --diff-removed: #b84040;

  --diff-added-bg: rgb(61 140 117 / 8%);
  --diff-modified-bg: rgb(123 143 205 / 8%);
  --diff-removed-bg: rgb(184 64 64 / 8%);

  --diff-added-border: rgb(61 140 117 / 25%);
  --diff-modified-border: rgb(123 143 205 / 25%);
  --diff-removed-border: rgb(184 64 64 / 25%);

  --diff-dim-opacity: 0.5;
}
```

- [ ] **Step 2: Import in globals.scss**

In `src/styles/globals.scss`, add the diff import after the existing variable imports. The file currently has:

```scss
@use 'variables/dark-theme' as *;
```

Add after that line:

```scss
@use 'variables/diff' as *;
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: PASS — SCSS compiles with new variables

- [ ] **Step 4: Commit**

```bash
git add src/styles/variables/_diff.scss src/styles/globals.scss
git commit -m "feat(diff): add diff mode CSS custom properties"
```

---

## Task 4: `useDiffMode` Hook

**Files:**

- Create: `src/hooks/use-diff-mode.ts`
- Modify: `src/providers/branch-provider.tsx`

The spec says diff mode is driven by `?compare=branchName` in the URL. The hook reads this param, syncs it to `BranchProvider.setComparisonBranch`, calls `computeDiff`, and memoizes.

- [ ] **Step 1: Update BranchProvider to accept external comparison sync**

The existing `BranchProvider` already has `comparisonBranch`, `comparisonData`, `setComparisonBranch`, and `isDiffMode`. No changes needed to the provider itself — the hook will call `setComparisonBranch` to sync URL state into context.

However, we need to also expose `allBranchData` from the context so the hook can load comparison data without an extra prop. Update `src/providers/branch-provider.tsx`:

In the `BranchContextValue` interface, add `allBranchData`:

```ts
interface BranchContextValue {
  activeBranch: string;
  activeData: BranchData;
  comparisonBranch: string | null;
  comparisonData: BranchData | null;
  setComparisonBranch: (name: string | null) => void;
  isDiffMode: boolean;
  branches: BranchInfo[];
  allBranchData: Record<string, BranchData>;
}
```

In the `BranchProvider` component, add `allBranchData` to the props destructuring (already there) and the context value:

```ts
  return (
    <BranchContext.Provider
      value={{
        activeBranch: branchName,
        activeData: branchData,
        comparisonBranch,
        comparisonData,
        setComparisonBranch: handleSetComparison,
        isDiffMode: comparisonBranch !== null,
        branches: BRANCHES,
        allBranchData,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
```

- [ ] **Step 2: Create `useDiffMode` hook**

```ts
// src/hooks/use-diff-mode.ts

'use client';

import { useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useBranchData } from '@/providers/branch-provider';
import { computeDiff } from '@/data/diff-engine';
import type { DiffResult } from '@/types/diff';

export function useDiffMode(): {
  isActive: boolean;
  compareBranch: string | null;
  diffResult: DiffResult | null;
  activate: (branchName: string) => void;
  deactivate: () => void;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { activeData, setComparisonBranch, allBranchData, activeBranch } = useBranchData();

  const compareBranch = searchParams.get('compare');

  // Sync URL param → context state
  useEffect(() => {
    // Only set comparison if the branch exists and isn't the active branch
    if (compareBranch && compareBranch !== activeBranch && allBranchData[compareBranch]) {
      setComparisonBranch(compareBranch);
    } else {
      setComparisonBranch(null);
    }
  }, [compareBranch, activeBranch, allBranchData, setComparisonBranch]);

  const comparisonData = compareBranch ? (allBranchData[compareBranch] ?? null) : null;

  const diffResult = useMemo<DiffResult | null>(() => {
    if (!comparisonData) return null;
    return computeDiff(comparisonData, activeData);
  }, [comparisonData, activeData]);

  const activate = (branchName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('compare', branchName);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const deactivate = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('compare');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return {
    isActive: !!compareBranch && !!comparisonData,
    compareBranch,
    diffResult,
    activate,
    deactivate,
  };
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-diff-mode.ts src/providers/branch-provider.tsx
git commit -m "feat(diff): add useDiffMode hook with URL-driven comparison state"
```

---

## Task 5: DiffBadge Component

**Files:**

- Create: `src/components/ui/diff-badge/index.tsx`
- Create: `src/components/ui/diff-badge/diff-badge.module.scss`

Small reusable pill used across all list views.

- [ ] **Step 1: Create DiffBadge component**

```tsx
// src/components/ui/diff-badge/index.tsx

import type { DiffStatus } from '@/types/diff';
import styles from './diff-badge.module.scss';

const LABELS: Record<Exclude<DiffStatus, 'unchanged'>, string> = {
  added: 'NEW',
  modified: 'CHANGED',
  removed: 'REMOVED',
};

interface DiffBadgeProps {
  status: Exclude<DiffStatus, 'unchanged'>;
}

export function DiffBadge({ status }: DiffBadgeProps) {
  return <span className={`${styles.badge} ${styles[status]}`}>{LABELS[status]}</span>;
}
```

- [ ] **Step 2: Create DiffBadge styles**

```scss
// src/components/ui/diff-badge/diff-badge.module.scss

.badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-family-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.4;
  flex-shrink: 0;
}

.added {
  color: var(--diff-added);
  background: var(--diff-added-bg);
  border: 1px solid var(--diff-added-border);
}

.modified {
  color: var(--diff-modified);
  background: var(--diff-modified-bg);
  border: 1px solid var(--diff-modified-border);
}

.removed {
  color: var(--diff-removed);
  background: var(--diff-removed-bg);
  border: 1px solid var(--diff-removed-border);
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/diff-badge/index.tsx src/components/ui/diff-badge/diff-badge.module.scss
git commit -m "feat(diff): add DiffBadge pill component"
```

---

## Task 6: Comparison Selector

**Files:**

- Create: `src/components/layout/comparison-selector/index.tsx`
- Create: `src/components/layout/comparison-selector/comparison-selector.module.scss`
- Modify: `src/components/layout/sidebar/index.tsx`
- Modify: `src/components/layout/sidebar/sidebar.module.scss`

- [ ] **Step 1: Create ComparisonSelector component**

```tsx
// src/components/layout/comparison-selector/index.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { useBranchData } from '@/providers/branch-provider';
import { useDiffMode } from '@/hooks/use-diff-mode';
import styles from './comparison-selector.module.scss';

export function ComparisonSelector() {
  const { activeBranch, branches } = useBranchData();
  const { isActive, compareBranch, activate, deactivate } = useDiffMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const otherBranches = branches.filter((b) => b.name !== activeBranch);
  const compareBranchInfo = branches.find((b) => b.name === compareBranch);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (isActive) {
    return (
      <div className={styles.selector} ref={ref}>
        <div className={styles.activeState}>
          <span className={styles.vsLabel}>
            vs <strong>{compareBranchInfo?.label ?? compareBranch}</strong>
          </span>
          <button
            className={styles.dismissBtn}
            onClick={deactivate}
            aria-label="Exit comparison mode"
          >
            &times;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.selector} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(!open)}>
        Compare...
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          {otherBranches.map((b) => (
            <button
              key={b.name}
              className={styles.option}
              onClick={() => {
                activate(b.name);
                setOpen(false);
              }}
              role="option"
              aria-selected={false}
            >
              <span className={styles.dot} style={{ background: b.color }} />
              <span className={styles.optionLabel}>{b.label}</span>
              <span className={styles.optionDesc}>{b.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create ComparisonSelector styles**

```scss
// src/components/layout/comparison-selector/comparison-selector.module.scss

.selector {
  position: relative;
}

.trigger {
  display: block;
  width: 100%;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-muted);
  background: transparent;
  border: 1px dashed var(--border-medium);
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);

  &:hover {
    color: var(--text-secondary);
    border-color: var(--border-strong);
    background: var(--bg-hover);
  }
}

.activeState {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  font-size: 11px;
  border-radius: 6px;
  background: var(--diff-modified-bg);
  border: 1px solid var(--diff-modified-border);
}

.vsLabel {
  color: var(--text-secondary);

  strong {
    color: var(--text-primary);
  }
}

.dismissBtn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;

  &:hover {
    color: var(--text-primary);
  }
}

.dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 4px;
  background: var(--bg-raised);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  padding: 4px;
  z-index: 20;
  box-shadow: 0 4px 16px rgb(0 0 0 / 40%);
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--bg-hover);
  }
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.optionLabel {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.optionDesc {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: auto;
}
```

- [ ] **Step 3: Add ComparisonSelector to Sidebar**

In `src/components/layout/sidebar/index.tsx`, add the import at the top:

```ts
import { ComparisonSelector } from '@/components/layout/comparison-selector';
```

Then replace the `.switcherSection` div at the bottom of the Sidebar return:

```tsx
<div className={styles.switcherSection}>
  <div className={styles.comparisonSection}>
    <ComparisonSelector />
  </div>
  <BranchSwitcher />
</div>
```

- [ ] **Step 4: Add sidebar spacing style**

In `src/components/layout/sidebar/sidebar.module.scss`, add after the `.switcherSection` block:

```scss
.comparisonSection {
  margin-bottom: 6px;
}
```

- [ ] **Step 5: Verify build and lint**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/comparison-selector/index.tsx \
  src/components/layout/comparison-selector/comparison-selector.module.scss \
  src/components/layout/sidebar/index.tsx \
  src/components/layout/sidebar/sidebar.module.scss
git commit -m "feat(diff): add comparison selector dropdown in sidebar"
```

---

## Task 7: Diff Toolbar Banner

**Files:**

- Create: `src/components/layout/diff-toolbar/index.tsx`
- Create: `src/components/layout/diff-toolbar/diff-toolbar.module.scss`
- Modify: `src/components/layout/app-shell/index.tsx`
- Modify: `src/components/layout/app-shell/app-shell.module.scss`
- Modify: `src/app/[branch]/layout.tsx`

- [ ] **Step 1: Create DiffToolbar component**

```tsx
// src/components/layout/diff-toolbar/index.tsx

'use client';

import { useBranchData } from '@/providers/branch-provider';
import { useDiffMode } from '@/hooks/use-diff-mode';
import styles from './diff-toolbar.module.scss';

export function DiffToolbar() {
  const { branches } = useBranchData();
  const { isActive, compareBranch, diffResult, deactivate } = useDiffMode();

  if (!isActive || !diffResult) return null;

  const branchLabel = branches.find((b) => b.name === compareBranch)?.label ?? compareBranch;
  const { added, modified, removed } = diffResult.summary;

  return (
    <div className={styles.toolbar}>
      <span className={styles.label}>
        Comparing against <strong>{branchLabel}</strong>
      </span>

      <div className={styles.counts}>
        <span className={styles.countAdded}>
          <span className={styles.dot} /> {added} added
        </span>
        <span className={styles.separator}>&middot;</span>
        <span className={styles.countModified}>
          <span className={styles.dot} /> {modified} modified
        </span>
        <span className={styles.separator}>&middot;</span>
        <span className={styles.countRemoved}>
          <span className={styles.dot} /> {removed} removed
        </span>
      </div>

      <button className={styles.dismissBtn} onClick={deactivate} aria-label="Exit comparison mode">
        &times;
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create DiffToolbar styles**

```scss
// src/components/layout/diff-toolbar/diff-toolbar.module.scss

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 20px;
  background: var(--bg-raised);
  border-bottom: 1px solid var(--border-subtle);
  font-size: 12px;
  flex-shrink: 0;
}

.label {
  color: var(--text-secondary);

  strong {
    color: var(--text-primary);
    font-weight: 600;
  }
}

.counts {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  font-family: var(--font-family-mono);
  font-size: 11px;
}

.separator {
  color: var(--text-dim);
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

.countAdded {
  color: var(--diff-added);

  .dot {
    background: var(--diff-added);
  }
}

.countModified {
  color: var(--diff-modified);

  .dot {
    background: var(--diff-modified);
  }
}

.countRemoved {
  color: var(--diff-removed);

  .dot {
    background: var(--diff-removed);
  }
}

.dismissBtn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 2px 4px;
  margin-left: 8px;

  &:hover {
    color: var(--text-primary);
  }
}
```

- [ ] **Step 3: Update AppShell to render DiffToolbar above content**

In `src/components/layout/app-shell/index.tsx`, the `<main>` currently just renders `{children}`. We need to add a `diffToolbar` slot. Update the component:

Replace the entire file content with:

```tsx
'use client';

import { type ReactNode, useCallback, useRef } from 'react';
import { useBranchData } from '@/providers/branch-provider';
import styles from './app-shell.module.scss';

interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  detail: ReactNode;
  diffToolbar?: ReactNode;
  children: ReactNode;
}

export function AppShell({ topbar, sidebar, detail, diffToolbar, children }: AppShellProps) {
  const { activeBranch } = useBranchData();
  const mainRef = useRef<HTMLElement>(null);
  const prevBranch = useRef(activeBranch);

  // Trigger crossfade via DOM class toggle — avoids setState-in-effect lint issue
  const refCallback = useCallback(
    (node: HTMLElement | null) => {
      mainRef.current = node;
      if (node && prevBranch.current !== activeBranch) {
        node.classList.add(styles.fading);
        const timer = setTimeout(() => node.classList.remove(styles.fading), 300);
        prevBranch.current = activeBranch;
        return () => clearTimeout(timer);
      }
    },
    [activeBranch],
  );

  return (
    <div className={`${styles.shell} ${styles.collapsed}`}>
      <header className={styles.topbar}>{topbar}</header>
      <nav className={styles.sidebar}>{sidebar}</nav>
      <main ref={refCallback} className={styles.main}>
        {diffToolbar}
        <div className={styles.mainContent}>{children}</div>
      </main>
      <aside className={styles.detail}>{detail}</aside>
    </div>
  );
}
```

- [ ] **Step 4: Update AppShell SCSS for main content wrapper**

In `src/components/layout/app-shell/app-shell.module.scss`, add after the `.main` block:

```scss
.mainContent {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
```

And update the `.main` block to use flex column layout so the toolbar stays pinned at the top:

Replace `.main` with:

```scss
.main {
  grid-column: 2;
  grid-row: 2;
  position: relative;
  overflow: hidden;
  transition: opacity 150ms ease;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 5: Wire DiffToolbar in the branch layout**

In `src/app/[branch]/layout.tsx`, add the import:

```ts
import { DiffToolbar } from '@/components/layout/diff-toolbar';
```

Then update the `AppShell` usage to pass the `diffToolbar` prop:

```tsx
<AppShell
  topbar={<Topbar />}
  sidebar={<Sidebar lifecycles={branchData.lifecycles} featureDomains={featureDomains} />}
  detail={<DetailPanel />}
  diffToolbar={<DiffToolbar />}
>
  {children}
</AppShell>
```

- [ ] **Step 6: Verify build and lint**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/diff-toolbar/index.tsx \
  src/components/layout/diff-toolbar/diff-toolbar.module.scss \
  src/components/layout/app-shell/index.tsx \
  src/components/layout/app-shell/app-shell.module.scss \
  src/app/[branch]/layout.tsx
git commit -m "feat(diff): add diff toolbar banner with summary counts"
```

---

## Task 8: List View Diff — Entity List (Data Model)

**Files:**

- Modify: `src/features/data-model/entity-list/index.tsx`
- Modify: `src/features/data-model/entity-list/entity-list.module.scss`

This is the first list view integration and establishes the pattern for all others.

- [ ] **Step 1: Add diff-aware styling to EntityList**

In `src/features/data-model/entity-list/index.tsx`, add imports at the top:

```ts
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
import type { DiffStatus } from '@/types/diff';
```

- [ ] **Step 2: Create a helper to get entity diff status**

Add this helper function after the existing helpers section (after `hasMetaSections`):

```ts
function getEntityDiffStatus(
  entityName: string,
  statusMap: Map<string, DiffStatus> | undefined,
): DiffStatus | null {
  if (!statusMap) return null;
  return statusMap.get(entityName) ?? null;
}
```

- [ ] **Step 3: Update EntityRow to accept and use diff status**

Add `diffStatus` prop to `EntityRow`:

```ts
function EntityRow({
  entity,
  staggerIndex,
  isOpen,
  isHighlighted,
  diffStatus,
  onToggle,
  onOpen,
  onScrollToEntity,
}: {
  entity: Entity;
  staggerIndex: number;
  isOpen: boolean;
  isHighlighted: boolean;
  diffStatus: DiffStatus | null;
  onToggle: () => void;
  onOpen: () => void;
  onScrollToEntity: (name: string) => void;
}) {
```

Update the root `<div>` className to include diff status:

```tsx
    <div
      ref={rowRef}
      id={entity.name}
      className={`${styles.entityRow} ${isOpen ? styles.entityRowOpen : ''} ${diffStatus ? styles[`diff_${diffStatus}`] : ''}`}
      style={
        { '--stagger': isDeepLinkTarget ? '0ms' : `${staggerIndex * 20}ms` } as React.CSSProperties
      }
    >
```

Add the DiffBadge next to the entity name inside the `<button className={styles.entityRowHeader}>`, right after the `<span className={styles.entityName}>`:

```tsx
<span className={styles.entityName}>{entity.name}</span>;
{
  diffStatus && diffStatus !== 'unchanged' && <DiffBadge status={diffStatus} />;
}
```

For removed rows, prevent expansion by wrapping the `onToggle` call:

```tsx
      <button
        className={styles.entityRowHeader}
        onClick={diffStatus === 'removed' ? undefined : onToggle}
        style={diffStatus === 'removed' ? { cursor: 'default' } : undefined}
      >
```

- [ ] **Step 4: Update EntityList to pass diff status**

In the `EntityList` component, call `useDiffMode` at the top:

```ts
const { isActive: isDiffMode, diffResult } = useDiffMode();
const entityStatusMap = isDiffMode ? diffResult?.entities.statusMap : undefined;
```

Update the `grouped` memo to include removed entities when in diff mode. After the existing `grouped` memo, add:

```ts
// In diff mode, add removed entities to their category groups
const removedEntities = useMemo(() => {
  if (!isDiffMode || !diffResult) return [];
  return diffResult.entities.removed;
}, [isDiffMode, diffResult]);
```

Pass `diffStatus` to each `EntityRow` in the render:

```tsx
<EntityRow
  key={entity.name}
  entity={entity}
  staggerIndex={idx}
  isOpen={openEntities.has(entity.name)}
  isHighlighted={highlightedEntity === entity.name}
  diffStatus={getEntityDiffStatus(entity.name, entityStatusMap)}
  onToggle={() => toggleEntity(entity.name)}
  onOpen={() => openEntity(entity.name)}
  onScrollToEntity={scrollToAndExpand}
/>
```

After rendering each group's entities, render removed entities at the end of that group (only items matching the group's category):

```tsx
{
  isDiffMode &&
    removedEntities
      .filter((e) => e.badge === group.category)
      .map((entity) => (
        <EntityRow
          key={`removed-${entity.name}`}
          entity={entity}
          staggerIndex={0}
          isOpen={false}
          isHighlighted={false}
          diffStatus="removed"
          onToggle={() => {}}
          onOpen={() => {}}
          onScrollToEntity={() => {}}
        />
      ));
}
```

- [ ] **Step 5: Update the group divider to show diff counts**

In the group render, update `GroupDivider` equivalent area to show diff counts when in diff mode:

```tsx
<div className={styles.groupDivider}>
  <span className={styles.groupName}>{group.label}</span>
  <span className={styles.groupLine} />
  <span className={styles.groupCount}>{group.entities.length}</span>
  {isDiffMode &&
    entityStatusMap &&
    (() => {
      const addedCount = group.entities.filter(
        (e) => entityStatusMap.get(e.name) === 'added',
      ).length;
      const modifiedCount = group.entities.filter(
        (e) => entityStatusMap.get(e.name) === 'modified',
      ).length;
      if (addedCount === 0 && modifiedCount === 0) return null;
      return (
        <span className={styles.diffCounts}>
          {addedCount > 0 && <span className={styles.diffCountAdded}>{addedCount} new</span>}
          {modifiedCount > 0 && (
            <span className={styles.diffCountModified}>{modifiedCount} modified</span>
          )}
        </span>
      );
    })()}
</div>
```

- [ ] **Step 6: Add diff SCSS classes to entity-list.module.scss**

Append to `src/features/data-model/entity-list/entity-list.module.scss`:

```scss
// ─── Diff Mode ───

.diff_added {
  border-left: 2px solid var(--diff-added);
  background: var(--diff-added-bg);
}

.diff_modified {
  border-left: 2px solid var(--diff-modified);
  background: var(--diff-modified-bg);
}

.diff_removed {
  border-left: 2px solid var(--diff-removed);
  background: var(--diff-removed-bg);
  opacity: 0.6;
  pointer-events: none;
}

.diff_unchanged {
  opacity: var(--diff-dim-opacity);
}

.diffCounts {
  display: flex;
  gap: 8px;
  margin-left: 8px;
  font-size: 10px;
  font-family: var(--font-family-mono);
}

.diffCountAdded {
  color: var(--diff-added);
}

.diffCountModified {
  color: var(--diff-modified);
}
```

- [ ] **Step 7: Verify build and lint**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/data-model/entity-list/index.tsx \
  src/features/data-model/entity-list/entity-list.module.scss
git commit -m "feat(diff): add diff overlay to entity list (data model)"
```

---

## Task 9: List View Diff — API Map

**Files:**

- Modify: `src/features/api-map/api-list/index.tsx`
- Modify: `src/features/api-map/api-list/api-list.module.scss`

- [ ] **Step 1: Add diff imports to ApiList**

In `src/features/api-map/api-list/index.tsx`, add:

```ts
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
import type { DiffStatus, ApiGroupDiff } from '@/types/diff';
```

- [ ] **Step 2: Create helper to get endpoint diff status from ApiGroupDiff**

```ts
function getEndpointDiffStatus(
  method: string,
  path: string,
  groupDiffs: ApiGroupDiff[] | undefined,
  groupName: string,
): DiffStatus | null {
  if (!groupDiffs) return null;
  const gd = groupDiffs.find((g) => g.group.name === groupName);
  if (!gd) return null;
  const key = `${method}:${path}`;
  if (gd.endpointDiffs.added.some((ep) => `${ep.method}:${ep.path}` === key)) return 'added';
  if (gd.endpointDiffs.removed.some((ep) => `${ep.method}:${ep.path}` === key)) return 'removed';
  if (gd.endpointDiffs.modified.some((m) => `${m.head.method}:${m.head.path}` === key))
    return 'modified';
  return 'unchanged';
}
```

- [ ] **Step 3: Update EndpointRow to accept and render diff status**

Add `diffStatus` prop to `EndpointRow`:

```ts
function EndpointRow({
  endpoint,
  staggerIndex,
  diffStatus,
}: {
  endpoint: ApiEndpoint;
  staggerIndex: number;
  diffStatus: DiffStatus | null;
}) {
```

Update the root div className:

```tsx
      className={`${styles.epRow} ${isOpen ? styles.epRowOpen : ''} ${diffStatus ? styles[`diff_${diffStatus}`] : ''}`}
```

Add DiffBadge after the method badge:

```tsx
<span className={styles.methodBadge}>{endpoint.method}</span>;
{
  diffStatus && diffStatus !== 'unchanged' && <DiffBadge status={diffStatus} />;
}
```

- [ ] **Step 4: Update ApiList main component**

Call `useDiffMode` at the top of `ApiList`:

```ts
const { isActive: isDiffMode, diffResult } = useDiffMode();
const apiGroupDiffs = isDiffMode ? diffResult?.apiGroupDiffs : undefined;
```

Pass `diffStatus` to `EndpointRow`:

```tsx
<EndpointRow
  key={`${ep.method}-${ep.path}`}
  endpoint={ep}
  staggerIndex={idx}
  diffStatus={getEndpointDiffStatus(ep.method, ep.path, apiGroupDiffs, group.name)}
/>
```

After each group's endpoints, render removed endpoints from that group's diff:

```tsx
{
  isDiffMode &&
    apiGroupDiffs &&
    (() => {
      const gd = apiGroupDiffs.find((g) => g.group.name === group.name);
      if (!gd) return null;
      return gd.endpointDiffs.removed.map((ep) => (
        <EndpointRow
          key={`removed-${ep.method}-${ep.path}`}
          endpoint={ep}
          staggerIndex={0}
          diffStatus="removed"
        />
      ));
    })();
}
```

Also render entirely removed groups at the end of the list (after `filteredGroups.map`):

```tsx
{
  isDiffMode &&
    apiGroupDiffs &&
    apiGroupDiffs
      .filter((gd) => gd.status === 'removed')
      .map((gd) => (
        <div key={`removed-group-${gd.group.name}`}>
          <GroupDivider name={gd.group.name} count={gd.group.endpoints.length} />
          {gd.group.endpoints.map((ep) => (
            <EndpointRow
              key={`removed-${ep.method}-${ep.path}`}
              endpoint={ep}
              staggerIndex={0}
              diffStatus="removed"
            />
          ))}
        </div>
      ));
}
```

- [ ] **Step 5: Add diff SCSS classes to api-list.module.scss**

Append to `src/features/api-map/api-list/api-list.module.scss`:

```scss
// ─── Diff Mode ───

.diff_added {
  border-left: 2px solid var(--diff-added);
  background: var(--diff-added-bg);
}

.diff_modified {
  border-left: 2px solid var(--diff-modified);
  background: var(--diff-modified-bg);
}

.diff_removed {
  border-left: 2px solid var(--diff-removed);
  background: var(--diff-removed-bg);
  opacity: 0.6;
  pointer-events: none;
}

.diff_unchanged {
  opacity: var(--diff-dim-opacity);
}
```

- [ ] **Step 6: Verify build and lint**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/api-map/api-list/index.tsx \
  src/features/api-map/api-list/api-list.module.scss
git commit -m "feat(diff): add diff overlay to API map list"
```

---

## Task 10: List View Diff — Lifecycle List

**Files:**

- Modify: `src/features/lifecycles/lifecycle-list/index.tsx`
- Modify: `src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss`

- [ ] **Step 1: Add diff imports to LifecycleList**

In `src/features/lifecycles/lifecycle-list/index.tsx`, add:

```ts
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
import type { DiffStatus } from '@/types/diff';
```

- [ ] **Step 2: Update LifecycleList to use diff mode**

Call `useDiffMode` at the top of the component:

```ts
const { isActive: isDiffMode, diffResult } = useDiffMode();
const lifecycleStatusMap = isDiffMode ? diffResult?.lifecycles.statusMap : undefined;
```

Update each list row's `<Link>` to include diff class and badge. The current `className` is `styles.row`. Update to:

```tsx
            <Link
              key={lc.slug}
              href={branchHref(`/lifecycles/${lc.slug}`)}
              className={`${styles.row} ${lifecycleStatusMap ? styles[`diff_${lifecycleStatusMap.get(lc.slug) ?? 'unchanged'}`] : ''}`}
              style={{
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateY(0)' : 'translateY(4px)',
                transition: `opacity 200ms ease-out ${i * 30}ms, transform 200ms ease-out ${i * 30}ms, background 150ms ease-out`,
              }}
            >
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>
                  {lc.name}
                  {lifecycleStatusMap && lifecycleStatusMap.get(lc.slug) !== 'unchanged' && (
                    <DiffBadge status={lifecycleStatusMap.get(lc.slug) as Exclude<DiffStatus, 'unchanged'>} />
                  )}
                </div>
```

After the main `lifecycles.map`, render removed lifecycles:

```tsx
{
  isDiffMode &&
    diffResult &&
    diffResult.lifecycles.removed.map((lc) => (
      <div
        key={`removed-${lc.slug}`}
        className={`${styles.row} ${styles.diff_removed}`}
        style={{ opacity: 1 }}
      >
        <div className={styles.rowContent}>
          <div className={styles.rowTitle}>
            {lc.name}
            <DiffBadge status="removed" />
          </div>
          <div className={styles.rowDesc}>{lc.description}</div>
        </div>
        <span className={styles.statCount}>{lc.states.length} states</span>
        <span className={styles.statCount}>{lc.transitions.length} transitions</span>
      </div>
    ));
}
```

- [ ] **Step 3: Add diff SCSS classes to lifecycle-list.module.scss**

Append to `src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss`:

```scss
// ─── Diff Mode ───

.diff_added {
  border-left: 2px solid var(--diff-added) !important;
  background: var(--diff-added-bg) !important;
}

.diff_modified {
  border-left: 2px solid var(--diff-modified) !important;
  background: var(--diff-modified-bg) !important;
}

.diff_removed {
  border-left: 2px solid var(--diff-removed) !important;
  background: var(--diff-removed-bg) !important;
  opacity: 0.6 !important;
  pointer-events: none;
}

.diff_unchanged {
  opacity: var(--diff-dim-opacity) !important;
}
```

Note: `!important` is needed here because the lifecycle rows use inline `opacity` for the stagger animation. The diff class needs to override that.

- [ ] **Step 4: Verify build and lint**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/lifecycles/lifecycle-list/index.tsx \
  src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss
git commit -m "feat(diff): add diff overlay to lifecycle list"
```

---

## Task 11: List View Diff — Architecture List

**Files:**

- Modify: `src/features/architecture/architecture-list/index.tsx`
- Modify: `src/features/architecture/architecture-list/architecture-list.module.scss`

- [ ] **Step 1: Add diff imports to ArchitectureList**

In `src/features/architecture/architecture-list/index.tsx`, add:

```ts
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
import type { DiffStatus } from '@/types/diff';
```

- [ ] **Step 2: Update ArchitectureList to use diff mode**

Call `useDiffMode` at the top:

```ts
const { isActive: isDiffMode, diffResult } = useDiffMode();
const archStatusMap = isDiffMode ? diffResult?.archDiagrams.statusMap : undefined;
```

Update each `<Link>` className:

```tsx
              className={`${styles.row} ${archStatusMap ? styles[`diff_${archStatusMap.get(d.slug) ?? 'unchanged'}`] : ''}`}
```

Add DiffBadge after the title:

```tsx
<div className={styles.rowTitle}>
  {d.title}
  {archStatusMap && archStatusMap.get(d.slug) !== 'unchanged' && (
    <DiffBadge status={archStatusMap.get(d.slug) as Exclude<DiffStatus, 'unchanged'>} />
  )}
</div>
```

After `diagrams.map`, render removed diagrams:

```tsx
{
  isDiffMode &&
    diffResult &&
    diffResult.archDiagrams.removed.map((d) => {
      const cat = CATEGORY_CONFIG[d.category] ?? {
        label: d.category,
        color: 'rgba(106,104,96,0.5)',
      };
      const nodeCount = d.layers.reduce((s, l) => s + l.nodes.length, 0);
      return (
        <div
          key={`removed-${d.slug}`}
          className={`${styles.row} ${styles.diff_removed}`}
          style={{ opacity: 1 }}
        >
          <div className={styles.rowContent}>
            <div className={styles.rowTitle}>
              {d.title}
              <DiffBadge status="removed" />
            </div>
            <div className={styles.rowDesc}>{d.description}</div>
          </div>
          <span
            className={styles.categoryBadge}
            style={{ background: `${cat.color}25`, color: cat.color }}
          >
            {cat.label}
          </span>
          <span className={styles.statCount}>{d.layers.length} layers</span>
          <span className={styles.statCount}>{nodeCount} nodes</span>
          <span className={styles.statCount}>{d.connections.length} edges</span>
        </div>
      );
    });
}
```

- [ ] **Step 3: Add diff SCSS classes to architecture-list.module.scss**

Append to `src/features/architecture/architecture-list/architecture-list.module.scss`:

```scss
// ─── Diff Mode ───

.diff_added {
  border-left: 2px solid var(--diff-added) !important;
  background: var(--diff-added-bg) !important;
}

.diff_modified {
  border-left: 2px solid var(--diff-modified) !important;
  background: var(--diff-modified-bg) !important;
}

.diff_removed {
  border-left: 2px solid var(--diff-removed) !important;
  background: var(--diff-removed-bg) !important;
  opacity: 0.6 !important;
  pointer-events: none;
}

.diff_unchanged {
  opacity: var(--diff-dim-opacity) !important;
}
```

- [ ] **Step 4: Verify build and lint**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/architecture/architecture-list/index.tsx \
  src/features/architecture/architecture-list/architecture-list.module.scss
git commit -m "feat(diff): add diff overlay to architecture list"
```

---

## Task 12: List View Diff — Config List

**Files:**

- Modify: `src/features/config/config-list/index.tsx`
- Modify: `src/features/config/config-list/config-list.module.scss`

- [ ] **Step 1: Add diff imports to ConfigList**

In `src/features/config/config-list/index.tsx`, add:

```ts
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
```

- [ ] **Step 2: Update ConfigList to use diff mode**

Call `useDiffMode` at the top:

```ts
const { isActive: isDiffMode, diffResult } = useDiffMode();
const configStatusMap = isDiffMode ? diffResult?.configEnums.statusMap : undefined;
```

Update each enum block's `<div>` className to include diff status:

```tsx
            <div
              key={e.slug}
              id={e.slug}
              ref={(el) => {
                if (el) blockRefs.current.set(e.slug, el);
              }}
              className={`${styles.enumBlock} ${isOpen ? styles.enumOpen : ''} ${configStatusMap ? styles[`diff_${configStatusMap.get(e.slug) ?? 'unchanged'}`] : ''}`}
            >
```

Add DiffBadge to the enum header, after `<span className={styles.enumName}>`:

```tsx
<button className={styles.enumHeader} onClick={() => toggleSlug(e.slug)}>
  <span className={styles.enumName}>{e.name}</span>
  {configStatusMap && configStatusMap.get(e.slug) !== 'unchanged' && (
    <DiffBadge status={configStatusMap.get(e.slug) as Exclude<DiffStatus, 'unchanged'>} />
  )}
  <span className={styles.enumCount}>{e.values.length} values</span>
  <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
</button>
```

After the `enums.map`, render removed config enums:

```tsx
{
  isDiffMode &&
    diffResult &&
    diffResult.configEnums.removed.map((e) => (
      <div key={`removed-${e.slug}`} className={`${styles.enumBlock} ${styles.diff_removed}`}>
        <div className={styles.enumHeader}>
          <span className={styles.enumName}>{e.name}</span>
          <DiffBadge status="removed" />
          <span className={styles.enumCount}>{e.values.length} values</span>
        </div>
      </div>
    ));
}
```

- [ ] **Step 3: Add diff SCSS classes to config-list.module.scss**

Append to `src/features/config/config-list/config-list.module.scss`:

```scss
// ─── Diff Mode ───

.diff_added {
  border-left: 2px solid var(--diff-added);
  background: var(--diff-added-bg);
}

.diff_modified {
  border-left: 2px solid var(--diff-modified);
  background: var(--diff-modified-bg);
}

.diff_removed {
  border-left: 2px solid var(--diff-removed);
  background: var(--diff-removed-bg);
  opacity: 0.6;
  pointer-events: none;
}

.diff_unchanged {
  opacity: var(--diff-dim-opacity);
}
```

- [ ] **Step 4: Verify build and lint**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/config/config-list/index.tsx \
  src/features/config/config-list/config-list.module.scss
git commit -m "feat(diff): add diff overlay to config list"
```

---

## Task 13: Full CI Validation

- [ ] **Step 1: Run all CI checks**

Run: `pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck`
Expected: All PASS

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: PASS — static site generates successfully

- [ ] **Step 3: Fix any issues found**

If any check fails, fix the issue and re-run. Common issues:

- Formatting: run `pnpm format` first
- Lint: check for unused imports or variables
- Stylelint: check SCSS syntax (e.g., `!important` placement)
- Typecheck: ensure all imports resolve and types match

- [ ] **Step 4: Visual smoke test**

Run: `pnpm dev`

1. Navigate to `/staging/data-model`
2. Click "Compare..." in the sidebar (below branch switcher)
3. Select "Production" from the dropdown
4. Verify:
   - URL updates to `/staging/data-model?compare=main`
   - Diff toolbar banner appears at top showing "Comparing against Production" with counts
   - Entity rows show colored left borders and DiffBadge pills
   - Unchanged rows are dimmed to 50% opacity
   - Removed entities (if any) appear ghosted at bottom of their category
5. Navigate to `/staging/api-map` — verify diff persists via `?compare=main`
6. Click X on toolbar — verify diff mode exits, URL clears `?compare`
7. Click X on sidebar comparison indicator — verify same exit behavior

- [ ] **Step 5: Final commit (if any fixes were made)**

```bash
git add -u
git commit -m "fix(diff): address CI and visual review issues"
```
