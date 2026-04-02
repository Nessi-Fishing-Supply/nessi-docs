# Phase 2: Component Library — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all UI primitives into a categorical directory structure with unified Badge, CollapsibleRow, ListRow, FilterBar, and FieldTable components — eliminating ~1,400 lines of duplicated code.

**Architecture:** Move existing components from flat `ui/` and `layout/` into categorical directories (`indicators/`, `layout/`, `navigation/`, `data-display/`). Build 5 new shared components (Badge, CollapsibleRow, ListRow, FilterBar + FilterChip, FieldTable) with extracted hooks (useDeepLink, useFilterToggle). Migrate 6 feature list/view files to use the shared components. Delete old duplicates.

**Tech Stack:** React, TypeScript, SCSS Modules, Next.js App Router. No test framework — verification is CI checks (`pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck`).

**Spec reference:** `docs/superpowers/specs/2026-04-02-phase2-component-library-design.md`

---

## File Map

### New Files

| File                                                                | Purpose                                            |
| ------------------------------------------------------------------- | -------------------------------------------------- |
| `src/components/indicators/index.ts`                                | Barrel export for indicators category              |
| `src/components/layout/index.ts`                                    | Barrel export for layout category                  |
| `src/components/navigation/index.ts`                                | Barrel export for navigation category              |
| `src/components/data-display/index.ts`                              | Barrel export for data-display category            |
| `src/components/layout/collapsible-row/index.tsx`                   | Shared expandable row component                    |
| `src/components/layout/collapsible-row/collapsible-row.module.scss` | Styles for collapsible row                         |
| `src/components/layout/list-row/index.tsx`                          | Non-expanding linked row                           |
| `src/components/layout/list-row/list-row.module.scss`               | Styles for list row                                |
| `src/components/layout/filter-bar/index.tsx`                        | FilterBar + FilterChip components                  |
| `src/components/layout/filter-bar/filter-bar.module.scss`           | Styles for filter bar                              |
| `src/components/data-display/field-table/index.tsx`                 | Configurable field table with diff                 |
| `src/components/data-display/field-table/field-table.module.scss`   | Styles for field table                             |
| `src/hooks/use-deep-link.ts`                                        | Deep-link hash detection + scroll + highlight hook |
| `src/hooks/use-filter-toggle.ts`                                    | Multi-select toggle logic hook                     |

### Moved Files (directory reorganization)

| From                                         | To                                               |
| -------------------------------------------- | ------------------------------------------------ |
| `src/components/ui/badge/`                   | `src/components/indicators/badge/`               |
| `src/components/ui/diff-badge/`              | _(deleted after merge into Badge)_               |
| `src/components/ui/toast/`                   | `src/components/indicators/toast/`               |
| `src/components/ui/diff-filter-bar/`         | _(deleted after FilterBar replaces it)_          |
| `src/components/ui/border-trace/`            | `src/components/data-display/border-trace/`      |
| `src/components/ui/breadcrumb/`              | `src/components/navigation/breadcrumb/`          |
| `src/components/ui/cross-link/`              | `src/components/data-display/cross-link/`        |
| `src/components/ui/github-link/`             | `src/components/data-display/github-link/`       |
| `src/components/ui/info-block/`              | `src/components/data-display/info-block/`        |
| `src/components/ui/key-value-row/`           | `src/components/data-display/key-value-row/`     |
| `src/components/ui/page-header/`             | `src/components/layout/page-header/`             |
| `src/components/ui/section-label/`           | `src/components/layout/section-label/`           |
| `src/components/ui/tooltip/`                 | `src/components/data-display/tooltip/`           |
| `src/components/layout/branch-switcher/`     | `src/components/navigation/branch-switcher/`     |
| `src/components/layout/comparison-selector/` | `src/components/navigation/comparison-selector/` |
| `src/components/layout/sidebar/`             | `src/components/navigation/sidebar/`             |
| `src/components/layout/topbar/`              | `src/components/navigation/topbar/`              |

### Deleted Files (after migration)

| File                                 | Reason                                  |
| ------------------------------------ | --------------------------------------- |
| `src/components/ui/diff-badge/`      | Merged into unified Badge               |
| `src/components/ui/diff-filter-bar/` | Replaced by FilterBar + FilterChip      |
| `src/components/ui/index.ts`         | Replaced by per-category barrel exports |

---

### Task 1: Directory reorganization — indicators and data-display

**Files:**

- Move: `badge/`, `toast/` → `src/components/indicators/`
- Move: `border-trace/`, `cross-link/`, `github-link/`, `info-block/`, `key-value-row/`, `tooltip/` → `src/components/data-display/`
- Create: `src/components/indicators/index.ts`, `src/components/data-display/index.ts`
- Modify: All files that import from `@/components/ui/badge`, `@/components/ui/toast`, `@/components/ui/border-trace`, `@/components/ui/cross-link`, `@/components/ui/github-link`, `@/components/ui/info-block`, `@/components/ui/key-value-row`, `@/components/ui/tooltip`

- [ ] **Step 1: Create the indicator and data-display directories and move files**

```bash
# indicators
mkdir -p src/components/indicators
mv src/components/ui/badge src/components/indicators/badge
mv src/components/ui/toast src/components/indicators/toast

# data-display
mkdir -p src/components/data-display
mv src/components/ui/border-trace src/components/data-display/border-trace
mv src/components/ui/cross-link src/components/data-display/cross-link
mv src/components/ui/github-link src/components/data-display/github-link
mv src/components/ui/info-block src/components/data-display/info-block
mv src/components/ui/key-value-row src/components/data-display/key-value-row
mv src/components/ui/tooltip src/components/data-display/tooltip
```

- [ ] **Step 2: Create barrel exports**

`src/components/indicators/index.ts`:

```typescript
export { Badge } from './badge';
export { Toast, useToast } from './toast';
```

`src/components/data-display/index.ts`:

```typescript
export { BorderTrace } from './border-trace';
export { CrossLink } from './cross-link';
export { GitHubLink } from './github-link';
export { InfoBlock } from './info-block';
export { KeyValueRow } from './key-value-row';
export { Tooltip } from './tooltip';
```

- [ ] **Step 3: Update all imports**

Find and replace across the codebase:

- `@/components/ui/badge` → `@/components/indicators/badge`
- `@/components/ui/toast` → `@/components/indicators/toast`
- `@/components/ui/border-trace` → `@/components/data-display/border-trace`
- `@/components/ui/cross-link` → `@/components/data-display/cross-link`
- `@/components/ui/github-link` → `@/components/data-display/github-link`
- `@/components/ui/info-block` → `@/components/data-display/info-block`
- `@/components/ui/key-value-row` → `@/components/data-display/key-value-row`
- `@/components/ui/tooltip` → `@/components/data-display/tooltip`
- `@/components/ui` (bare import used in entity-list for Tooltip) → `@/components/data-display`

Known consumers to update:

- `src/features/data-model/entity-list/index.tsx` — BorderTrace, Tooltip, DiffBadge, DiffFilterBar
- `src/features/api-map/api-list/index.tsx` — BorderTrace, GitHubLink, DiffBadge, DiffFilterBar
- `src/features/config/config-list/index.tsx` — BorderTrace, DiffBadge, DiffFilterBar
- `src/features/feature-domain/feature-domain-view/index.tsx` — BorderTrace, DiffBadge, DiffFilterBar
- `src/features/canvas/components/node-tooltip.tsx` — GitHubLink
- `src/features/canvas/components/entity-tooltip.tsx` — GitHubLink
- `src/features/canvas/components/state-tooltip.tsx` — GitHubLink
- `src/components/layout/detail-panel/panels/step-panel.tsx` — GitHubLink
- `src/components/layout/branch-switcher/index.tsx` — useToast

Note: Leave `diff-badge/`, `diff-filter-bar/`, `page-header/`, `section-label/` in `ui/` for now — they move or get replaced in later tasks.

- [ ] **Step 4: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "refactor: move indicator and data-display components to categorical directories"
```

---

### Task 2: Directory reorganization — navigation

**Files:**

- Move: `breadcrumb/` → `src/components/navigation/`
- Move: `sidebar/`, `topbar/`, `branch-switcher/`, `comparison-selector/` from `src/components/layout/` → `src/components/navigation/`
- Create: `src/components/navigation/index.ts`
- Modify: All files that import from the moved paths

- [ ] **Step 1: Move files and create barrel export**

```bash
mkdir -p src/components/navigation
mv src/components/ui/breadcrumb src/components/navigation/breadcrumb
mv src/components/layout/sidebar src/components/navigation/sidebar
mv src/components/layout/topbar src/components/navigation/topbar
mv src/components/layout/branch-switcher src/components/navigation/branch-switcher
mv src/components/layout/comparison-selector src/components/navigation/comparison-selector
```

`src/components/navigation/index.ts`:

```typescript
export { Breadcrumb } from './breadcrumb';
export type { SwitcherItem } from './breadcrumb';
export { Sidebar } from './sidebar';
export { Topbar } from './topbar';
export { BranchSwitcher } from './branch-switcher';
export { ComparisonSelector } from './comparison-selector';
```

- [ ] **Step 2: Update all imports**

Find and replace:

- `@/components/ui/breadcrumb` → `@/components/navigation/breadcrumb`
- `@/components/layout/sidebar` → `@/components/navigation/sidebar`
- `@/components/layout/topbar` → `@/components/navigation/topbar`
- `@/components/layout/branch-switcher` → `@/components/navigation/branch-switcher`
- `@/components/layout/comparison-selector` → `@/components/navigation/comparison-selector`

Known consumers:

- `src/app/[branch]/layout.tsx` — Sidebar, Topbar, DetailPanel, DiffToolbar
- `src/app/[branch]/architecture/[slug]/client.tsx` — SwitcherItem from breadcrumb
- `src/app/[branch]/lifecycles/[slug]/client.tsx` — SwitcherItem from breadcrumb
- `src/app/[branch]/journeys/[domain]/[slug]/client.tsx` — SwitcherItem from breadcrumb
- `src/components/navigation/topbar/index.tsx` — BranchSwitcher, ComparisonSelector (internal refs update)

- [ ] **Step 3: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "refactor: move navigation components to categorical directory"
```

---

### Task 3: Directory reorganization — layout cleanup and page-header/section-label move

**Files:**

- Move: `page-header/`, `section-label/` from `src/components/ui/` → `src/components/layout/`
- Delete: `src/components/ui/index.ts` and `src/components/ui/` directory (should be empty except diff-badge and diff-filter-bar which stay until replaced)
- Create: `src/components/layout/index.ts` barrel export

- [ ] **Step 1: Move remaining ui components to layout**

```bash
mv src/components/ui/page-header src/components/layout/page-header
mv src/components/ui/section-label src/components/layout/section-label
```

- [ ] **Step 2: Update imports**

Find and replace:

- `@/components/ui/page-header` → `@/components/layout/page-header`
- `@/components/ui/section-label` → `@/components/layout/section-label`

Known consumers of PageHeader:

- `src/features/changelog/changelog-feed/index.tsx`
- `src/features/config/config-list/index.tsx`
- `src/features/diff-overview/diff-overview-view/index.tsx`
- `src/features/architecture/architecture-list/index.tsx`
- `src/features/lifecycles/lifecycle-list/index.tsx`
- `src/features/api-map/api-list/index.tsx`
- `src/features/journeys/domain-grid/index.tsx`
- `src/features/data-model/entity-list/index.tsx`

- [ ] **Step 3: Create layout barrel export**

`src/components/layout/index.ts`:

```typescript
export { AppShell } from './app-shell';
export { DetailPanel } from './detail-panel';
export { DeviceGate } from './device-gate';
export { DiffToolbar } from './diff-toolbar';
export { PageHeader } from './page-header';
export { SectionLabel } from './section-label';
export { StalenessBanner } from './staleness-banner';
```

- [ ] **Step 4: Clean up old ui directory**

`src/components/ui/` should now only contain `diff-badge/` and `diff-filter-bar/` (both get replaced in later tasks). Update `src/components/ui/index.ts` to only export what remains, or delete it if nothing imports from the bare `@/components/ui` path anymore.

- [ ] **Step 5: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "refactor: move page-header and section-label to layout, create barrel exports"
```

---

### Task 4: Unified Badge component

**Files:**

- Modify: `src/components/indicators/badge/index.tsx`
- Modify: `src/components/indicators/badge/badge.module.scss`
- Modify: `src/components/indicators/index.ts`
- Modify: All consumers of `DiffBadge` (7 files)
- Delete: `src/components/ui/diff-badge/`

- [ ] **Step 1: Read the existing Badge and DiffBadge components**

Read both components to understand current props and styling before modifying.

- [ ] **Step 2: Rewrite Badge to support all variants**

`src/components/indicators/badge/index.tsx`:

```tsx
import type { DiffStatus } from '@/types/diff';
import { DIFF_STATUS_CONFIG } from '@/constants/diff';
import styles from './badge.module.scss';

const METHOD_COLORS: Record<string, string> = {
  GET: '#3d8c75',
  POST: '#e27739',
  PUT: '#7b8fcd',
  PATCH: '#7b8fcd',
  DELETE: '#b84040',
};

interface BadgeProps {
  variant?: 'category' | 'method' | 'diff' | 'count' | 'subtle';
  children?: React.ReactNode;
  color?: string;
  method?: string;
  status?: Exclude<DiffStatus, 'unchanged'>;
  count?: number;
}

export function Badge({
  variant = 'category',
  children,
  color,
  method,
  status,
  count,
}: BadgeProps) {
  if (variant === 'diff' && status) {
    const config = DIFF_STATUS_CONFIG[status];
    return (
      <span className={`${styles.badge} ${styles.diff} ${styles[status]}`}>
        {config.label}
        {count != null && count > 0 && <span className={styles.count}>({count})</span>}
      </span>
    );
  }

  if (variant === 'method' && method) {
    const c = METHOD_COLORS[method] ?? '#9a9790';
    return (
      <span
        className={`${styles.badge} ${styles.method}`}
        style={{ color: c, background: `${c}1a` }}
      >
        {method}
      </span>
    );
  }

  if (variant === 'count') {
    return <span className={`${styles.badge} ${styles.count}`}>{children}</span>;
  }

  if (variant === 'subtle') {
    return <span className={`${styles.badge} ${styles.subtle}`}>{children}</span>;
  }

  // category (default)
  return (
    <span className={styles.badge} style={color ? { color, background: `${color}1a` } : undefined}>
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Update Badge SCSS**

`src/components/indicators/badge/badge.module.scss`:

Extend the existing SCSS to add `.diff`, `.added`, `.modified`, `.removed`, and `.count` classes. Import the diff status colors from CSS variables (`--diff-added`, `--diff-modified`, `--diff-removed`, `--diff-added-bg`, etc.).

- [ ] **Step 4: Migrate all DiffBadge consumers to Badge**

In each of these files, replace:

```typescript
import { DiffBadge } from '@/components/ui/diff-badge';
// ...
<DiffBadge status={status} count={count} />
```

With:

```typescript
import { Badge } from '@/components/indicators';
// ...
<Badge variant="diff" status={status} count={count} />
```

Files to update:

- `src/features/data-model/entity-list/index.tsx`
- `src/features/api-map/api-list/index.tsx`
- `src/features/config/config-list/index.tsx`
- `src/features/feature-domain/feature-domain-view/index.tsx`
- `src/features/architecture/architecture-list/index.tsx`
- `src/features/lifecycles/lifecycle-list/index.tsx`
- `src/features/diff-overview/diff-domain-group/index.tsx`
- `src/components/layout/detail-panel/panels/diff-panel.tsx`

- [ ] **Step 5: Delete DiffBadge**

```bash
rm -rf src/components/ui/diff-badge
```

Remove from `src/components/ui/index.ts` if it still exists.

- [ ] **Step 6: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "refactor: unify Badge component — merge DiffBadge into Badge variant='diff'"
```

---

### Task 5: Extract useDeepLink hook

**Files:**

- Create: `src/hooks/use-deep-link.ts`

- [ ] **Step 1: Create the hook**

`src/hooks/use-deep-link.ts`:

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

interface UseDeepLinkResult {
  isHighlighted: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useDeepLink(id: string, onMatch?: () => void): UseDeepLinkResult {
  const ref = useRef<HTMLDivElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    function checkHash() {
      const hashes = window.location.hash.split('#').filter(Boolean);
      if (hashes.includes(id)) {
        onMatch?.();
        setIsHighlighted(true);
        history.replaceState(null, '', window.location.pathname);
        setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        setTimeout(() => setIsHighlighted(false), 9500);
      }
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { isHighlighted, ref };
}
```

The `onMatch` callback lets CollapsibleRow trigger expand when the hash matches. The 100ms scroll delay and 9500ms highlight duration match the existing behavior exactly.

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/hooks/use-deep-link.ts
git commit -m "feat: extract useDeepLink hook from duplicated row implementations"
```

---

### Task 6: Extract useFilterToggle hook

**Files:**

- Create: `src/hooks/use-filter-toggle.ts`

- [ ] **Step 1: Create the hook**

`src/hooks/use-filter-toggle.ts`:

```typescript
'use client';

import { useCallback, useState } from 'react';

interface UseFilterToggleResult<T> {
  active: Set<T>;
  toggle: (option: T) => void;
  toggleAll: () => void;
  isAllActive: boolean;
}

export function useFilterToggle<T extends string>(
  allOptions: T[],
  initial?: T[],
): UseFilterToggleResult<T> {
  const [active, setActive] = useState<Set<T>>(() => new Set(initial ?? allOptions));

  const isAllActive = active.size === allOptions.length;

  const toggle = useCallback(
    (option: T) => {
      setActive((prev) => {
        const next = new Set(prev);
        if (next.has(option)) {
          next.delete(option);
          // If nothing active, reactivate all
          if (next.size === 0) return new Set(allOptions);
        } else {
          next.add(option);
        }
        return next;
      });
    },
    [allOptions],
  );

  const toggleAll = useCallback(() => {
    setActive(new Set(allOptions));
  }, [allOptions]);

  return { active, toggle, toggleAll, isAllActive };
}
```

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/hooks/use-filter-toggle.ts
git commit -m "feat: extract useFilterToggle hook from duplicated filter implementations"
```

---

### Task 7: CollapsibleRow component

**Files:**

- Create: `src/components/layout/collapsible-row/index.tsx`
- Create: `src/components/layout/collapsible-row/collapsible-row.module.scss`
- Modify: `src/components/layout/index.ts`

- [ ] **Step 1: Create the CollapsibleRow component**

`src/components/layout/collapsible-row/index.tsx`:

```tsx
'use client';

import type { DiffStatus } from '@/types/diff';
import { useDeepLink } from '@/hooks/use-deep-link';
import { BorderTrace } from '@/components/data-display/border-trace';
import styles from './collapsible-row.module.scss';

interface CollapsibleRowProps {
  id: string;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  diffStatus?: DiffStatus;
  onExpand?: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function CollapsibleRow({
  id,
  staggerIndex,
  isOpen,
  onToggle,
  diffStatus,
  onExpand,
  header,
  children,
}: CollapsibleRowProps) {
  const { isHighlighted, ref } = useDeepLink(id, () => {
    onToggle();
    onExpand?.();
  });

  const isUnchanged = diffStatus === 'unchanged';
  const diffClass =
    diffStatus && diffStatus !== 'unchanged'
      ? styles[`diff_${diffStatus}`]
      : isUnchanged
        ? styles.diff_unchanged
        : '';

  function handleClick() {
    if (isUnchanged) return;
    onToggle();
    if (!isOpen) onExpand?.();
  }

  return (
    <div
      ref={ref}
      className={`${styles.row} ${diffClass} ${isOpen ? styles.open : ''}`}
      style={
        { '--stagger': isHighlighted ? '0ms' : `${staggerIndex * 20}ms` } as React.CSSProperties
      }
    >
      {isHighlighted && <BorderTrace active />}
      <div className={styles.header} onClick={handleClick}>
        {header}
      </div>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Create the SCSS module**

`src/components/layout/collapsible-row/collapsible-row.module.scss`:

```scss
@use 'mixins/diff' as *;

.row {
  margin-bottom: var(--spacing-50);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 150ms ease-out;
  animation: row-enter 200ms ease-out both;
  animation-delay: var(--stagger);
  position: relative;

  &:hover {
    border-color: var(--border-subtle);
  }
}

.open {
  border-color: var(--border-medium);
  background: rgb(var(--color-white-rgb) / var(--opacity-100));
}

.header {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: var(--spacing-200) var(--spacing-300);
  gap: var(--spacing-200);
  user-select: none;
}

.content {
  padding: 0 var(--spacing-300) var(--spacing-300);
}

.diff_added {
  @include diff-row('added');
}

.diff_modified {
  @include diff-row('modified');
}

.diff_removed {
  @include diff-row('removed');
}

.diff_unchanged {
  @include diff-unchanged;
}

@keyframes row-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Add to layout barrel export**

Add to `src/components/layout/index.ts`:

```typescript
export { CollapsibleRow } from './collapsible-row';
```

- [ ] **Step 4: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "feat: add CollapsibleRow shared component with deep-link and diff support"
```

---

### Task 8: ListRow component

**Files:**

- Create: `src/components/layout/list-row/index.tsx`
- Create: `src/components/layout/list-row/list-row.module.scss`
- Modify: `src/components/layout/index.ts`

- [ ] **Step 1: Create the ListRow component**

`src/components/layout/list-row/index.tsx`:

```tsx
import Link from 'next/link';
import type { DiffStatus } from '@/types/diff';
import styles from './list-row.module.scss';

interface ListRowProps {
  href: string;
  staggerIndex: number;
  diffStatus?: DiffStatus;
  children: React.ReactNode;
}

export function ListRow({ href, staggerIndex, diffStatus, children }: ListRowProps) {
  const diffClass =
    diffStatus && diffStatus !== 'unchanged'
      ? styles[`diff_${diffStatus}`]
      : diffStatus === 'unchanged'
        ? styles.diff_unchanged
        : '';

  return (
    <Link
      href={href}
      className={`${styles.row} ${diffClass}`}
      style={{ '--stagger': `${staggerIndex * 30}ms` } as React.CSSProperties}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Create the SCSS module**

`src/components/layout/list-row/list-row.module.scss`:

```scss
@use 'mixins/diff' as *;

.row {
  display: flex;
  align-items: center;
  gap: var(--spacing-300);
  padding: var(--spacing-300) var(--spacing-400);
  border-radius: 8px;
  border: 1px solid transparent;
  text-decoration: none;
  color: inherit;
  transition:
    opacity 200ms ease-out,
    transform 200ms ease-out,
    border-color 150ms ease-out;
  animation: row-enter 200ms ease-out both;
  animation-delay: var(--stagger);

  &:hover {
    border-color: var(--border-subtle);
    background: rgb(var(--color-white-rgb) / var(--opacity-100));
  }
}

.diff_added {
  @include diff-row('added');
}

.diff_modified {
  @include diff-row('modified');
}

.diff_removed {
  @include diff-row('removed');
}

.diff_unchanged {
  @include diff-unchanged;
}

@keyframes row-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Add to layout barrel export**

Add to `src/components/layout/index.ts`:

```typescript
export { ListRow } from './list-row';
```

- [ ] **Step 4: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "feat: add ListRow shared component for non-expanding linked rows"
```

---

### Task 9: FilterBar + FilterChip components

**Files:**

- Create: `src/components/layout/filter-bar/index.tsx`
- Create: `src/components/layout/filter-bar/filter-bar.module.scss`
- Modify: `src/components/layout/index.ts`

- [ ] **Step 1: Create FilterBar and FilterChip**

`src/components/layout/filter-bar/index.tsx`:

```tsx
import styles from './filter-bar.module.scss';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return <div className={`${styles.bar} ${className ?? ''}`}>{children}</div>;
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  color?: string;
  count?: number;
}

export function FilterChip({ label, active, onToggle, color, count }: FilterChipProps) {
  return (
    <button
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      onClick={onToggle}
      style={
        active && color
          ? ({
              '--chip-color': color,
              '--chip-bg': `${color}1a`,
              '--chip-border': `${color}33`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {label}
      {count != null && <span className={styles.chipCount}>{count}</span>}
    </button>
  );
}
```

- [ ] **Step 2: Create the SCSS module**

`src/components/layout/filter-bar/filter-bar.module.scss`:

```scss
.bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-100);
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-100);
  padding: var(--spacing-50) var(--spacing-200);
  border-radius: 99px;
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--font-size-100);
  font-family: var(--font-family-sans);
  cursor: pointer;
  transition: all 150ms ease-out;
  white-space: nowrap;

  &:hover {
    border-color: var(--border-medium);
    color: var(--text-secondary);
  }
}

.chipActive {
  color: var(--chip-color, var(--text-primary));
  background: var(--chip-bg, rgb(var(--color-white-rgb) / var(--opacity-200)));
  border-color: var(--chip-border, var(--border-medium));
}

.chipCount {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-100);
  opacity: 0.6;
}
```

- [ ] **Step 3: Add to layout barrel export**

Add to `src/components/layout/index.ts`:

```typescript
export { FilterBar, FilterChip } from './filter-bar';
```

- [ ] **Step 4: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "feat: add FilterBar and FilterChip shared components"
```

---

### Task 10: FieldTable component

**Files:**

- Create: `src/components/data-display/field-table/index.tsx`
- Create: `src/components/data-display/field-table/field-table.module.scss`
- Modify: `src/components/data-display/index.ts`

- [ ] **Step 1: Read the existing entity field table and API request field table**

Read `src/features/data-model/entity-list/index.tsx` (lines 234-311 for FieldTable) and `src/features/api-map/api-list/index.tsx` (lines 194-213 for request fields) to understand the exact rendering patterns before building the shared component.

- [ ] **Step 2: Create the FieldTable component**

`src/components/data-display/field-table/index.tsx`:

```tsx
import styles from './field-table.module.scss';

interface FieldTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, field: T) => React.ReactNode;
}

interface FieldTableProps<T extends Record<string, unknown>> {
  fields: T[];
  columns: FieldTableColumn<T>[];
  changedFields?: Set<string>;
  addedFields?: T[];
  nameKey?: string;
}

export function FieldTable<T extends Record<string, unknown>>({
  fields,
  columns,
  changedFields,
  addedFields,
  nameKey = 'name',
}: FieldTableProps<T>) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={col.width ? { width: col.width } : undefined}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => {
          const name = field[nameKey] as string;
          const isChanged = changedFields?.has(name);
          return (
            <tr key={name} className={isChanged ? styles.fieldChanged : ''}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(field[col.key], field)
                    : ((field[col.key] as React.ReactNode) ?? '—')}
                </td>
              ))}
            </tr>
          );
        })}
        {addedFields?.map((field) => {
          const name = field[nameKey] as string;
          return (
            <tr key={`added-${name}`} className={styles.fieldAdded}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(field[col.key], field)
                    : ((field[col.key] as React.ReactNode) ?? '—')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: Create the SCSS module**

`src/components/data-display/field-table/field-table.module.scss`:

```scss
@use 'mixins/diff' as *;

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-100);

  th {
    text-align: left;
    padding: var(--spacing-100) var(--spacing-200);
    color: var(--text-muted);
    font-weight: var(--font-weight-500);
    font-size: var(--font-size-100);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border-subtle);
  }

  td {
    padding: var(--spacing-100) var(--spacing-200);
    color: var(--text-secondary);
    border-bottom: 1px solid rgb(var(--color-white-rgb) / var(--opacity-100));
    font-family: var(--font-family-mono);
  }

  tbody tr:hover td {
    background: rgb(var(--color-white-rgb) / var(--opacity-100));
  }
}

.fieldChanged {
  @include diff-field('modified');
}

.fieldAdded {
  @include diff-field('added');
}
```

- [ ] **Step 4: Add to data-display barrel export**

Add to `src/components/data-display/index.ts`:

```typescript
export { FieldTable } from './field-table';
```

- [ ] **Step 5: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "feat: add FieldTable shared component with diff highlighting"
```

---

### Task 11: Migrate entity-list to shared components

**Files:**

- Modify: `src/features/data-model/entity-list/index.tsx`

This is the most complex migration — entity-list uses CollapsibleRow, FieldTable, Badge, and FilterBar patterns.

- [ ] **Step 1: Read the full entity-list file**

Read `src/features/data-model/entity-list/index.tsx` to understand the complete component structure before modifying.

- [ ] **Step 2: Replace EntityRow with CollapsibleRow**

Remove the EntityRow component definition (~124 lines) and replace with CollapsibleRow usage. The EntityRow's `header` prop content becomes the JSX passed to CollapsibleRow's `header`. The expansion content becomes `children`. Remove the inline deep-link logic, BorderTrace import, stagger animation code — all handled by CollapsibleRow.

- [ ] **Step 3: Replace inline FieldTable with shared FieldTable**

Remove the local FieldTable component (~77 lines) and import from `@/components/data-display`. Configure columns to match the entity field layout (Column name, Type, Default, Reference with FK link rendering).

- [ ] **Step 4: Replace DiffFilterBar with FilterBar + FilterChip**

Replace the DiffFilterBar import and usage with FilterBar + FilterChip composition. Import `useFilterToggle` from `@/hooks/use-filter-toggle` to manage the category filter state.

- [ ] **Step 5: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "refactor: migrate entity-list to CollapsibleRow, FieldTable, FilterBar"
```

---

### Task 12: Migrate api-list to shared components

**Files:**

- Modify: `src/features/api-map/api-list/index.tsx`

- [ ] **Step 1: Read the full api-list file**

- [ ] **Step 2: Replace EndpointRow with CollapsibleRow**

Same pattern as entity-list. Remove EndpointRow (~120 lines), replace with CollapsibleRow. Header content = method badge + path + diff badge. Children = endpoint detail expansion.

- [ ] **Step 3: Replace inline request field table with shared FieldTable**

Configure columns for API fields (Field name, Type, Required badge).

- [ ] **Step 4: Replace DiffFilterBar + method filters with FilterBar + FilterChip**

- [ ] **Step 5: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "refactor: migrate api-list to CollapsibleRow, FieldTable, FilterBar"
```

---

### Task 13: Migrate config-list to shared components

**Files:**

- Modify: `src/features/config/config-list/index.tsx`

- [ ] **Step 1: Read the full config-list file**

- [ ] **Step 2: Replace enum block accordion with CollapsibleRow**

Config uses `openSlugs` Set instead of individual boolean state, but the pattern maps to CollapsibleRow. Replace the manual expand/collapse JSX with CollapsibleRow, keeping the parent `openSlugs` state management.

- [ ] **Step 3: Replace DiffFilterBar with FilterBar + FilterChip**

- [ ] **Step 4: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "refactor: migrate config-list to CollapsibleRow, FilterBar"
```

---

### Task 14: Migrate feature-domain-view to shared components

**Files:**

- Modify: `src/features/feature-domain/feature-domain-view/index.tsx`

- [ ] **Step 1: Read the full feature-domain-view file**

- [ ] **Step 2: Replace FeatureRow with CollapsibleRow**

Remove FeatureRow (~190 lines). Header = feature title + badges. Children = description + categorized link lists.

- [ ] **Step 3: Replace DiffFilterBar with FilterBar + FilterChip**

- [ ] **Step 4: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "refactor: migrate feature-domain-view to CollapsibleRow, FilterBar"
```

---

### Task 15: Migrate lifecycle-list and architecture-list to ListRow

**Files:**

- Modify: `src/features/lifecycles/lifecycle-list/index.tsx`
- Modify: `src/features/architecture/architecture-list/index.tsx`

- [ ] **Step 1: Read both list files**

- [ ] **Step 2: Replace lifecycle row pattern with ListRow**

Remove inline stagger animation logic, diff class logic, and Link wrapper. Replace with `<ListRow href={...} staggerIndex={i} diffStatus={status}>` containing the row content.

- [ ] **Step 3: Replace architecture row pattern with ListRow**

Same transformation as lifecycle-list.

- [ ] **Step 4: Replace DiffFilterBar with FilterBar + FilterChip in both files**

- [ ] **Step 5: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
git add -A
git commit -m "refactor: migrate lifecycle-list and architecture-list to ListRow, FilterBar"
```

---

### Task 16: Cleanup and final validation

**Files:**

- Delete: `src/components/ui/diff-filter-bar/`
- Delete: `src/components/ui/` (should be empty)
- Modify: Any remaining references to old paths

- [ ] **Step 1: Delete old components**

```bash
rm -rf src/components/ui/diff-filter-bar
rm -rf src/components/ui  # should be empty now
```

- [ ] **Step 2: Search for stale imports**

```bash
grep -rn "@/components/ui/" src/ --include="*.tsx" --include="*.ts"
```

Should return zero results. Fix any remaining references.

- [ ] **Step 3: Full CI check**

```bash
pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck
```

All must pass.

- [ ] **Step 4: Audit for remaining duplication**

Verify the consolidation targets are eliminated:

```bash
# No more local FieldTable/EntityRow/EndpointRow components in feature files
grep -rn "function EntityRow\|function EndpointRow\|function FeatureRow" src/features/

# No more local deep-link hash logic in feature files
grep -rn "hashchange" src/features/

# No more DiffBadge or DiffFilterBar imports
grep -rn "diff-badge\|diff-filter-bar" src/
```

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "refactor: Phase 2 complete — component library with categorical structure"
```
