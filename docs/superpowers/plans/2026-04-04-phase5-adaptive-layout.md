# Phase 5: Adaptive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app layout adaptive across desktop viewport sizes (≥1024px) with collapsible sidebar, overlay detail panel at compact sizes, and touch canvas support.

**Architecture:** CSS-first approach. Layout dimensions become CSS custom properties. Sidebar collapse is store-driven (Zustand + localStorage). Detail panel switches from inline grid column to fixed overlay at <1280px via media query. Touch input added to the existing `usePanZoom` hook.

**Tech Stack:** SCSS Modules, Zustand (existing store), React (existing components), CSS Grid, CSS custom properties

---

## File Structure

| File                                                               | Action | Responsibility                                                    |
| ------------------------------------------------------------------ | ------ | ----------------------------------------------------------------- |
| `src/styles/variables/layout.scss`                                 | Create | Layout dimension custom properties                                |
| `src/stores/app-store.ts`                                          | Modify | Add `sidebarCollapsed` + `toggleSidebar`, persist to localStorage |
| `src/components/layout/app-shell/index.tsx`                        | Modify | Wire sidebar collapse class to grid shell                         |
| `src/components/layout/app-shell/app-shell.module.scss`            | Modify | Adaptive grid, compact detail overlay, backdrop                   |
| `src/components/navigation/sidebar/index.tsx`                      | Modify | Icon rail mode, collapse toggle button, overlay expand            |
| `src/components/navigation/sidebar/sidebar.module.scss`            | Modify | Collapsed styles, icon-only layout, overlay positioning           |
| `src/features/canvas/hooks/use-pan-zoom.ts`                        | Modify | Extract shared pan/zoom helpers, add touch handlers               |
| `src/features/canvas/components/canvas-toolbar.tsx`                | Modify | Add max-width + overflow-x safety                                 |
| `src/features/dashboard/dashboard-view/dashboard-view.module.scss` | Modify | `auto-fill`/`minmax` domain grid                                  |
| `src/styles/mixins/layout.scss`                                    | Modify | Add compact padding to `page-container` mixin                     |

---

### Task 1: Layout Dimension Tokens

**Files:**

- Create: `src/styles/variables/layout.scss`
- Modify: `src/styles/variables/spacing.scss` (verify no conflicts)

- [ ] **Step 1: Create layout variables file**

Create `src/styles/variables/layout.scss`:

```scss
////////////////////////////
/// Layout Dimension Tokens
////////////////////////////
:root {
  --sidebar-width: 220px;
  --sidebar-width-compact: 56px;
  --detail-panel-width: 320px;
  --topbar-height: 48px;
}
```

- [ ] **Step 2: Import layout variables in the global styles**

Check how existing variable files are imported. Look at `src/styles/globals.scss` (or equivalent entry point) and add the layout variables import alongside the other variable imports:

```scss
@use 'variables/layout';
```

If the project uses `sassOptions.includePaths` in `next.config.mjs` (it does — `src/styles/`), the import resolves automatically.

- [ ] **Step 3: Run CI checks to verify no conflicts**

Run: `pnpm typecheck && pnpm lint:styles && pnpm build`
Expected: All pass — this is a new file with no consumers yet.

- [ ] **Step 4: Commit**

```bash
git add src/styles/variables/layout.scss
git commit -m "feat: add layout dimension CSS custom properties"
```

---

### Task 2: Zustand Store — Sidebar Collapse State

**Files:**

- Modify: `src/stores/app-store.ts:13-43` (AppState + AppActions interfaces)
- Modify: `src/stores/app-store.ts:49-83` (store implementation)

- [ ] **Step 1: Add sidebarCollapsed to AppState interface**

In `src/stores/app-store.ts`, add to the `AppState` interface (after the `theme` field on line 28):

```typescript
interface AppState {
  /* Mode */
  mode: 'default' | 'diff' | 'trace';

  /* Branch */
  activeBranch: string;
  comparisonBranch: string | null;
  activeData: BranchData | null;
  allBranchData: Record<string, BranchData>;
  branches: BranchInfo[];

  /* Selection */
  selectedItem: SelectedItem;

  /* Appearance */
  theme: 'dark' | 'light';

  /* Layout */
  sidebarCollapsed: boolean;
}
```

- [ ] **Step 2: Add toggleSidebar to AppActions interface**

In `src/stores/app-store.ts`, add to the `AppActions` interface (after `setTheme` on line 42):

```typescript
interface AppActions {
  initBranch: (name: string, data: BranchData, allData: Record<string, BranchData>) => void;
  setComparisonBranch: (name: string | null) => void;
  activateDiffMode: (branch: string) => void;
  deactivateDiffMode: () => void;
  selectItem: (item: SelectedItem) => void;
  clearSelection: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
}
```

- [ ] **Step 3: Add default + action to the store implementation**

In the store's `persist` callback, add the default value and the action:

Add default (after `theme: 'dark'` on line 60):

```typescript
sidebarCollapsed: false,
```

Add action (after `setTheme` on line 76):

```typescript
toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
```

- [ ] **Step 4: Add sidebarCollapsed to localStorage persistence**

Update the `partialize` function (line 81) to also persist sidebar state:

```typescript
partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
```

- [ ] **Step 5: Run CI checks**

Run: `pnpm typecheck && pnpm lint`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/stores/app-store.ts
git commit -m "feat: add sidebarCollapsed state with localStorage persistence"
```

---

### Task 3: AppShell Grid — Adaptive Layout

**Files:**

- Modify: `src/components/layout/app-shell/index.tsx`
- Modify: `src/components/layout/app-shell/app-shell.module.scss`

- [ ] **Step 1: Wire sidebar collapse class in AppShell component**

In `src/components/layout/app-shell/index.tsx`, read `sidebarCollapsed` from the store and apply a CSS class:

```tsx
'use client';

import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import styles from './app-shell.module.scss';

interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  detail: ReactNode;
  diffToolbar?: ReactNode;
  children: ReactNode;
}

export function AppShell({ topbar, sidebar, detail, diffToolbar, children }: AppShellProps) {
  const activeBranch = useAppStore.use.activeBranch();
  const selectedItem = useAppStore.use.selectedItem();
  const sidebarCollapsed = useAppStore.use.sidebarCollapsed();
  const clearSelection = useAppStore.getState().clearSelection;
  const mainRef = useRef<HTMLElement>(null);
  const prevBranch = useRef(activeBranch);

  const isDetailCollapsed = !selectedItem;

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

  // Escape key dismisses detail panel overlay
  useEffect(() => {
    if (isDetailCollapsed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isDetailCollapsed, clearSelection]);

  const shellClasses = [
    styles.shell,
    isDetailCollapsed ? styles.detailCollapsed : '',
    sidebarCollapsed ? styles.sidebarCollapsed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClasses}>
      <header className={styles.topbar}>{topbar}</header>
      <nav className={styles.sidebar}>{sidebar}</nav>
      <main ref={refCallback} className={styles.main}>
        {diffToolbar}
        <div className={styles.mainContent}>{children}</div>
      </main>
      {selectedItem && (
        <button
          className={styles.detailToggle}
          onClick={clearSelection}
          aria-label="Collapse detail panel"
        >
          <span className={styles.toggleArrow}>›</span>
        </button>
      )}
      <aside className={styles.detail}>{detail}</aside>
      {/* Backdrop for compact detail overlay */}
      {selectedItem && <div className={styles.detailBackdrop} onClick={clearSelection} />}
    </div>
  );
}
```

Key changes from current:

- Added `sidebarCollapsed` from store
- Renamed `isCollapsed` → `isDetailCollapsed` for clarity
- Changed `styles.collapsed` → `styles.detailCollapsed` in class names
- Added `styles.sidebarCollapsed` class
- Added `styles.detailBackdrop` element (only renders when detail is open)

- [ ] **Step 2: Rewrite AppShell SCSS with adaptive grid**

Replace `src/components/layout/app-shell/app-shell.module.scss` with:

```scss
@use 'mixins/breakpoints' as *;

// ─── Shell Grid ───

.shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr var(--detail-panel-width);
  grid-template-rows: var(--topbar-height) 1fr;
  height: 100vh;
  overflow: hidden;
  position: relative;
  transition: grid-template-columns 250ms cubic-bezier(0.16, 1, 0.3, 1);

  @media (width <= 1023px) {
    display: none;
  }

  // ── Detail collapsed ──
  &.detailCollapsed {
    grid-template-columns: var(--sidebar-width) 1fr 0;

    .detail {
      opacity: 0;
      pointer-events: none;
      padding: 0;
      border-left: none;
      overflow: hidden;
    }

    .detailToggle {
      right: 0;
      transform: translateX(-8px) translateY(-50%);
    }
  }

  // ── Sidebar collapsed (any viewport) ──
  &.sidebarCollapsed {
    grid-template-columns: var(--sidebar-width-compact) 1fr var(--detail-panel-width);

    &.detailCollapsed {
      grid-template-columns: var(--sidebar-width-compact) 1fr 0;
    }
  }

  // ── Compact viewport (<1280px) ──
  @media (max-width: 1279px) {
    // At compact, always use compact sidebar in grid
    grid-template-columns: var(--sidebar-width-compact) 1fr;

    &.sidebarCollapsed {
      grid-template-columns: var(--sidebar-width-compact) 1fr;
    }

    // Detail panel becomes overlay (not in grid)
    .detail {
      position: fixed;
      right: 0;
      top: var(--topbar-height);
      height: calc(100vh - var(--topbar-height));
      width: var(--detail-panel-width);
      z-index: 30;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
      transform: translateX(0);
      transition:
        transform 250ms cubic-bezier(0.16, 1, 0.3, 1),
        opacity 200ms ease;
    }

    &.detailCollapsed .detail {
      transform: translateX(100%);
      opacity: 0;
      pointer-events: none;
      padding: 0;
      border-left: none;
    }

    .detailToggle {
      display: none;
    }

    // Show backdrop when detail open
    .detailBackdrop {
      display: block;
    }
  }
}

// ─── Topbar ───

.topbar {
  grid-column: 1 / -1;
  grid-row: 1;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 10;
}

// ─── Sidebar ───

.sidebar {
  grid-column: 1;
  grid-row: 2;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-subtle);
  overflow: hidden auto;
}

// ─── Main ───

.main {
  grid-column: 2;
  grid-row: 2;
  position: relative;
  overflow: hidden;
  transition: opacity 150ms ease;
  display: flex;
  flex-direction: column;
}

.mainContent {
  flex: 1;
  overflow: hidden auto;
}

.fading {
  opacity: 0.3;
}

// ─── Detail Panel ───

.detail {
  grid-column: 3;
  grid-row: 2;
  background: var(--bg-panel);
  border-left: 1px solid var(--border-subtle);
  overflow-y: auto;
  padding: var(--spacing-400);
  transition:
    opacity 200ms ease,
    padding 250ms ease;
}

// ─── Detail Toggle Button ───

.detailToggle {
  position: absolute;
  right: 320px;
  top: 50%;
  transform: translateX(50%) translateY(-50%);
  width: 24px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-panel);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  cursor: pointer;
  z-index: 12;
  transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgb(var(--color-black-rgb) / var(--opacity-600));

  &:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    box-shadow: 0 2px 12px rgb(var(--color-black-rgb) / var(--opacity-700));
  }
}

.toggleArrow {
  font-size: var(--font-size-300);
  color: var(--text-muted);
  line-height: 1;

  .detailToggle:hover & {
    color: var(--text-primary);
  }
}

// ─── Detail Backdrop (compact only) ───

.detailBackdrop {
  display: none;
  position: fixed;
  inset: 0;
  top: var(--topbar-height);
  background: rgba(0, 0, 0, 0.4);
  z-index: 29;
  cursor: pointer;
}
```

Key changes from current:

- Uses CSS custom properties (`var(--sidebar-width)`, etc.) instead of hardcoded `220px`/`320px`/`48px`
- `collapsed` → `detailCollapsed` (matches component rename)
- Added `sidebarCollapsed` class that changes grid to use `--sidebar-width-compact`
- Added compact viewport (`max-width: 1279px`) media query: 2-column grid, detail becomes fixed overlay
- Added `.detailBackdrop` — hidden by default, shown at compact viewport via media query

- [ ] **Step 3: Run CI checks**

Run: `pnpm typecheck && pnpm lint && pnpm lint:styles && pnpm build`
Expected: All pass. The app should look identical at ≥1280px.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-shell/
git commit -m "feat: adaptive AppShell grid with sidebar collapse and compact detail overlay"
```

---

### Task 4: Collapsible Sidebar — Icon Rail + Toggle

**Files:**

- Modify: `src/components/navigation/sidebar/index.tsx`
- Modify: `src/components/navigation/sidebar/sidebar.module.scss`

- [ ] **Step 1: Add collapse toggle and icon-rail mode to sidebar component**

Replace `src/components/navigation/sidebar/index.tsx` — key changes:

- Read `sidebarCollapsed` and `toggleSidebar` from the store
- In collapsed mode, hide `<span>` labels and section label text
- Add a toggle button at the bottom of the sidebar
- At compact viewport + expanded, use overlay positioning and auto-collapse on nav click

```tsx
'use client';

import { Suspense, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineHome,
  HiOutlineMap,
  HiOutlineServer,
  HiOutlineDatabase,
  HiOutlineLink,
  HiOutlineRefresh,
  HiOutlineLightningBolt,
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineChip,
  HiOutlineSwitchHorizontal,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
} from 'react-icons/hi';
import { useDiffResult } from '@/hooks/use-diff-result';
import { FEATURE_TO_DOMAIN } from '@/data/transforms/features';
import type { Lifecycle } from '@/types/lifecycle';
import { useBranchHref } from '@/hooks/use-branch-href';
import { useAppStore } from '@/stores/app-store';
import styles from './sidebar.module.scss';

const SYSTEM_ITEMS = [
  { id: 'journeys', label: 'Journeys', icon: HiOutlineMap, path: '/journeys' },
  { id: 'api', label: 'API Map', icon: HiOutlineServer, path: '/api-map' },
  { id: 'data', label: 'Data Model', icon: HiOutlineDatabase, path: '/data-model' },
  { id: 'erd', label: 'Relationships', icon: HiOutlineLink, path: '/entity-relationships' },
  { id: 'lifecycles', label: 'Lifecycles', icon: HiOutlineRefresh, path: '/lifecycles' },
  { id: 'architecture', label: 'Architecture', icon: HiOutlineChip, path: '/architecture' },
];

const REFERENCE_ITEMS = [
  { id: 'config', label: 'Config', icon: HiOutlineCog, path: '/config' },
  { id: 'changelog', label: 'Changelog', icon: HiOutlineClock, path: '/changelog' },
];

const NAV_TO_DOMAIN: Record<string, string> = {
  journeys: 'journeys',
  api: 'apiGroups',
  data: 'entities',
  erd: 'erdNodes',
  lifecycles: 'lifecycles',
  architecture: 'archDiagrams',
  config: 'configEnums',
};

/* ------------------------------------------------------------------ */
/*  Compact viewport detection (for overlay behavior)                  */
/* ------------------------------------------------------------------ */

function useIsCompact() {
  // SSR-safe: default to false, update after mount
  const ref = useRef(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1279px)');
    ref.current = mql.matches;
    const handler = (e: MediaQueryListEvent) => {
      ref.current = e.matches;
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return ref;
}

/* ------------------------------------------------------------------ */
/*  Diff sub-components (unchanged from current)                       */
/* ------------------------------------------------------------------ */

function DiffNavItem() {
  const branchHref = useBranchHref();
  const pathname = usePathname();
  const { isActive } = useDiffResult();

  if (!isActive) return null;

  const isOnDiffPage = pathname.endsWith('/diff');

  return (
    <Link
      href={branchHref('/diff')}
      className={`${styles.navItem} ${styles.diffNavItem} ${isOnDiffPage ? styles.active : ''}`}
    >
      <HiOutlineSwitchHorizontal className={styles.navIcon} />
      <span className={styles.navLabel}>Compare Overview</span>
    </Link>
  );
}

interface DomainDots {
  added: number;
  modified: number;
  removed: number;
}

interface DiffNavData {
  dots: Map<string, DomainDots>;
  isDiffMode: boolean;
  featureDomainDots: Map<string, DomainDots>;
}

function DiffDots({ children }: { children: (data: DiffNavData) => React.ReactNode }) {
  const { isActive, diffResult } = useDiffResult();

  const dots = useMemo(() => {
    const map = new Map<string, DomainDots>();
    if (!isActive || !diffResult) return map;
    for (const [navId, domainKey] of Object.entries(NAV_TO_DOMAIN)) {
      const domain = diffResult.summary.byDomain[domainKey];
      if (!domain) continue;
      if (domain.added > 0 || domain.modified > 0 || domain.removed > 0) {
        map.set(navId, domain);
      }
    }
    return map;
  }, [isActive, diffResult]);

  const featureDomainDots = useMemo(() => {
    const map = new Map<string, DomainDots>();
    if (!isActive || !diffResult) return map;
    const bump = (domain: string, key: 'added' | 'modified' | 'removed') => {
      const prev = map.get(domain) ?? { added: 0, modified: 0, removed: 0 };
      prev[key]++;
      map.set(domain, prev);
    };
    for (const f of diffResult.features.added) {
      const domain = FEATURE_TO_DOMAIN[f.slug];
      if (domain) bump(domain, 'added');
    }
    for (const f of diffResult.features.removed) {
      const domain = FEATURE_TO_DOMAIN[f.slug];
      if (domain) bump(domain, 'removed');
    }
    for (const m of diffResult.features.modified) {
      const domain = FEATURE_TO_DOMAIN[m.head.slug];
      if (domain) bump(domain, 'modified');
    }
    return map;
  }, [isActive, diffResult]);

  return <>{children({ dots, isDiffMode: isActive, featureDomainDots })}</>;
}

function DiffIndicator({ counts }: { counts: DomainDots }) {
  return (
    <span className={styles.diffDots}>
      {counts.added > 0 && <span className={styles.diffDotAdded} />}
      {counts.modified > 0 && <span className={styles.diffDotModified} />}
      {counts.removed > 0 && <span className={styles.diffDotRemoved} />}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav Content                                                        */
/* ------------------------------------------------------------------ */

interface NavContentProps {
  dots: Map<string, DomainDots>;
  isDiffMode: boolean;
  featureDomainDots: Map<string, DomainDots>;
  pathname: string;
  branchPrefix: string;
  branchHref: (path: string) => string;
  featureDomains: { slug: string; label: string }[];
  collapsed: boolean;
  onNavClick: () => void;
}

function NavContent({
  dots,
  isDiffMode,
  featureDomainDots,
  pathname,
  branchPrefix,
  branchHref,
  featureDomains,
  collapsed,
  onNavClick,
}: NavContentProps) {
  const visibleSystemItems = isDiffMode
    ? SYSTEM_ITEMS.filter((item) => dots.has(item.id))
    : SYSTEM_ITEMS;

  const visibleFeatureDomains = isDiffMode
    ? featureDomains.filter((d) => featureDomainDots.has(d.slug))
    : featureDomains;

  const visibleReferenceItems = isDiffMode
    ? REFERENCE_ITEMS.filter((item) => dots.has(item.id))
    : REFERENCE_ITEMS;

  const isDashboardActive = pathname === branchPrefix || pathname === `${branchPrefix}/`;

  return (
    <>
      {!isDiffMode && (
        <Link
          href={branchHref('/')}
          className={`${styles.navItem} ${isDashboardActive ? styles.active : ''}`}
          title={collapsed ? 'Dashboard' : undefined}
          onClick={onNavClick}
        >
          <HiOutlineHome className={styles.navIcon} />
          <span className={styles.navLabel}>Dashboard</span>
        </Link>
      )}

      {isDiffMode && <DiffNavItem />}

      {visibleSystemItems.length > 0 && (
        <>
          {collapsed ? (
            <div className={styles.sectionDivider} />
          ) : (
            <div className={styles.sectionLabel}>System Views</div>
          )}
          <div className={styles.nav}>
            {visibleSystemItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(`${branchPrefix}${item.path}`);
              const counts = dots.get(item.id);
              return (
                <Link
                  key={item.id}
                  href={branchHref(item.path)}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavClick}
                >
                  <Icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {counts && <DiffIndicator counts={counts} />}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {visibleFeatureDomains.length > 0 && (
        <>
          {collapsed ? (
            <div className={styles.sectionDivider} />
          ) : (
            <div className={styles.sectionLabel}>Features</div>
          )}
          <div className={styles.nav}>
            {visibleFeatureDomains.map((domain) => {
              const isActive = pathname.startsWith(`${branchPrefix}/features/${domain.slug}`);
              const fdCounts = featureDomainDots.get(domain.slug);
              return (
                <Link
                  key={domain.slug}
                  href={branchHref(`/features/${domain.slug}`)}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={collapsed ? domain.label : undefined}
                  onClick={onNavClick}
                >
                  <HiOutlineLightningBolt className={styles.navIcon} />
                  <span className={styles.navLabel}>{domain.label}</span>
                  {fdCounts && <DiffIndicator counts={fdCounts} />}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {visibleReferenceItems.length > 0 && (
        <>
          {collapsed ? (
            <div className={styles.sectionDivider} />
          ) : (
            <div className={styles.sectionLabel}>Reference</div>
          )}
          <div className={styles.nav}>
            {visibleReferenceItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(`${branchPrefix}${item.path}`);
              const counts = dots.get(item.id);
              return (
                <Link
                  key={item.id}
                  href={branchHref(item.path)}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavClick}
                >
                  <Icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {counts && <DiffIndicator counts={counts} />}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  lifecycles: Lifecycle[];
  featureDomains: { slug: string; label: string }[];
}

export function Sidebar({ featureDomains }: SidebarProps) {
  const pathname = usePathname();
  const activeBranch = useAppStore.use.activeBranch();
  const branchHref = useBranchHref();
  const branchPrefix = `/${activeBranch}`;
  const sidebarCollapsed = useAppStore.use.sidebarCollapsed();
  const toggleSidebar = useAppStore.getState().toggleSidebar;
  const isCompactRef = useIsCompact();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // At compact viewport, auto-collapse when a nav item is clicked
  const handleNavClick = useCallback(() => {
    if (isCompactRef.current && !sidebarCollapsed) {
      toggleSidebar();
    }
  }, [sidebarCollapsed, toggleSidebar, isCompactRef]);

  // Close sidebar overlay when clicking outside (compact + expanded)
  useEffect(() => {
    if (sidebarCollapsed || !isCompactRef.current) return;

    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        toggleSidebar();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sidebarCollapsed, toggleSidebar, isCompactRef]);

  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : styles.expanded}`}
    >
      <div className={styles.navContent}>
        <Suspense
          fallback={
            <NavContent
              dots={new Map()}
              isDiffMode={false}
              featureDomainDots={new Map()}
              pathname={pathname}
              branchPrefix={branchPrefix}
              branchHref={branchHref}
              featureDomains={featureDomains}
              collapsed={sidebarCollapsed}
              onNavClick={handleNavClick}
            />
          }
        >
          <DiffDots>
            {({ dots, isDiffMode: diffActive, featureDomainDots: fdd }) => (
              <NavContent
                dots={dots}
                isDiffMode={diffActive}
                featureDomainDots={fdd}
                pathname={pathname}
                branchPrefix={branchPrefix}
                branchHref={branchHref}
                featureDomains={featureDomains}
                collapsed={sidebarCollapsed}
                onNavClick={handleNavClick}
              />
            )}
          </DiffDots>
        </Suspense>
      </div>

      <button
        className={styles.collapseToggle}
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <HiOutlineChevronRight className={styles.collapseIcon} />
        ) : (
          <HiOutlineChevronLeft className={styles.collapseIcon} />
        )}
      </button>
    </div>
  );
}
```

Key changes:

- Added `collapsed` and `onNavClick` props to `NavContent`
- Nav labels wrapped in `.navLabel` span (hidden when collapsed via CSS)
- Section labels conditionally render as `.sectionDivider` when collapsed
- `title` attribute on nav items when collapsed (tooltip on hover)
- Collapse toggle button at bottom of sidebar
- `useIsCompact` hook for overlay auto-collapse behavior
- Click-outside handler for compact overlay dismiss

- [ ] **Step 2: Update sidebar SCSS with collapsed and overlay styles**

Replace `src/components/navigation/sidebar/sidebar.module.scss`:

```scss
@use 'mixins/breakpoints' as *;

// ─── Sidebar Container ───

.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width 200ms var(--ease-out);
}

// ─── Expanded (full viewport) ───
// At compact viewport, expanded sidebar is an overlay
.expanded {
  @media (max-width: 1279px) {
    position: fixed;
    top: var(--topbar-height);
    left: 0;
    width: var(--sidebar-width);
    height: calc(100vh - var(--topbar-height));
    background: var(--bg-panel);
    border-right: 1px solid var(--border-subtle);
    z-index: 25;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
  }
}

// ─── Nav Content ───

.navContent {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-300) var(--spacing-200);

  .collapsed & {
    padding: var(--spacing-300) 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);

  .collapsed & {
    align-items: center;
  }
}

// ─── Nav Item ───

.navItem {
  display: flex;
  align-items: center;
  gap: var(--spacing-200);
  padding: var(--spacing-200) var(--spacing-300);
  border-radius: 6px;
  font-size: var(--font-size-300);
  color: var(--text-muted);
  text-decoration: none;
  transition: all var(--transition-fast);
  border-left: 2px solid transparent;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-secondary);
  }

  &.active {
    background: var(--bg-raised);
    color: var(--text-primary);
    border-left-color: var(--color-primary-500);
  }

  // Collapsed: icon-only, centered
  .collapsed & {
    justify-content: center;
    width: 40px;
    height: 36px;
    padding: 0;
    border-left: 2px solid transparent;
    border-radius: 6px;
  }
}

.diffNavItem {
  margin-top: var(--spacing-200);
}

// ─── Nav Label (hidden when collapsed) ───

.navLabel {
  .collapsed & {
    display: none;
  }
}

.navIcon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

// ─── Section Labels ───

.sectionLabel {
  font-size: var(--font-size-100);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: var(--spacing-300) var(--spacing-400) var(--spacing-100);
}

.sectionDivider {
  width: 24px;
  height: 1px;
  background: var(--border-subtle);
  margin: var(--spacing-200) 0;
}

// ─── Diff Dots ───

.diffDots {
  display: flex;
  gap: var(--spacing-100);
  margin-left: auto;
  flex-shrink: 0;

  .collapsed & {
    display: none;
  }
}

.diffDotAdded {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--diff-added);
}

.diffDotModified {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--diff-modified);
}

.diffDotRemoved {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--diff-removed);
}

// ─── Collapse Toggle ───

.collapseToggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  margin: var(--spacing-200);
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-hover);
    color: var(--text-secondary);
  }

  .collapsed & {
    margin: var(--spacing-200) auto;
    width: 40px;
  }
}

.collapseIcon {
  width: 14px;
  height: 14px;
}

// ─── Legacy classes (keep for backward compat during migration) ───

.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: var(--spacing-200) var(--spacing-300);
}

.badge {
  font-size: var(--font-size-100);
  color: var(--text-dim);
  padding: 1px var(--spacing-100);
  border-radius: 8px;
  background: var(--bg-raised);
  flex-shrink: 0;
}

.subnavLabel {
  font-size: var(--font-size-100);
  color: var(--text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: var(--spacing-100) var(--spacing-300);
  margin-bottom: var(--spacing-100);
}

.subnav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.subnavItem {
  display: flex;
  align-items: center;
  gap: var(--spacing-200);
  padding: var(--spacing-200) var(--spacing-300);
  border-radius: 4px;
  font-size: var(--font-size-200);
  color: var(--text-muted);
  text-decoration: none;
  transition: all var(--transition-fast);
  border-left: 2px solid transparent;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-secondary);
  }

  &.active {
    background: var(--bg-raised);
    color: var(--text-primary);
    border-left-color: var(--color-primary-500);
  }
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Run CI checks**

Run: `pnpm typecheck && pnpm lint && pnpm lint:styles && pnpm build`
Expected: All pass. Sidebar should toggle between expanded and icon rail.

- [ ] **Step 4: Visually verify**

Run: `pnpm dev` and test:

1. At ≥1280px: click collapse toggle → sidebar shrinks to icon rail, content reflows. Click again → expands.
2. At ≥1280px + collapsed: hover over icon → native tooltip shows label.
3. Resize browser to <1280px: sidebar defaults to icon rail in grid.
4. At <1280px: click expand toggle → sidebar overlays content at 220px. Click a nav item → auto-collapses. Click outside → collapses.
5. Reload page → sidebar state persists from localStorage.

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation/sidebar/
git commit -m "feat: collapsible sidebar with icon rail and compact overlay"
```

---

### Task 5: Compact Page Padding & Dashboard Grid Reflow

**Files:**

- Modify: `src/styles/mixins/layout.scss:31-35`
- Modify: `src/features/dashboard/dashboard-view/dashboard-view.module.scss:165-169`

- [ ] **Step 1: Add compact padding to page-container mixin**

In `src/styles/mixins/layout.scss`, update the `page-container` mixin:

```scss
/// Standard page content container.
@mixin page-container {
  padding: var(--spacing-600) var(--spacing-700);
  overflow-y: auto;
  height: 100%;

  @media (max-width: 1279px) {
    padding: var(--spacing-600) var(--spacing-500);
  }
}
```

- [ ] **Step 2: Update dashboard domain grid to use intrinsic sizing**

In `src/features/dashboard/dashboard-view/dashboard-view.module.scss`, change the `.domainGrid` rule (line 166-169):

```scss
.domainGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-300);
}
```

This replaces `repeat(3, 1fr)` with `repeat(auto-fill, minmax(280px, 1fr))`.

- [ ] **Step 3: Run CI checks**

Run: `pnpm lint:styles && pnpm build`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/styles/mixins/layout.scss src/features/dashboard/dashboard-view/dashboard-view.module.scss
git commit -m "feat: compact page padding and intrinsic dashboard grid"
```

---

### Task 6: Canvas Toolbar Overflow Safety

**Files:**

- Modify: `src/features/canvas/components/canvas-toolbar.tsx:70-85`

- [ ] **Step 1: Add max-width and overflow-x to toolbar style**

In `src/features/canvas/components/canvas-toolbar.tsx`, update the `TOOLBAR_STYLE` constant (line 70):

```typescript
const TOOLBAR_STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  height: 40,
  padding: '0 4px',
  background: 'rgba(15,19,25,0.9)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  backdropFilter: 'blur(12px)',
  maxWidth: 'calc(100% - 32px)',
  overflowX: 'auto',
};
```

Two new properties: `maxWidth: 'calc(100% - 32px)'` and `overflowX: 'auto'`.

- [ ] **Step 2: Run CI checks**

Run: `pnpm typecheck && pnpm build`
Expected: All pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/canvas/components/canvas-toolbar.tsx
git commit -m "fix: prevent canvas toolbar overflow at narrow widths"
```

---

### Task 7: Touch Support for Canvas Pan-Zoom

**Files:**

- Modify: `src/features/canvas/hooks/use-pan-zoom.ts`

This is the most complex task. The hook needs touch handlers that share math with the existing mouse handlers.

- [ ] **Step 1: Extract shared pan/zoom helpers**

In `src/features/canvas/hooks/use-pan-zoom.ts`, the mouse move handler (lines 248-269) contains pan math, and the wheel handler (lines 293-315) contains zoom math. Extract these into module-level helpers that both mouse and touch can call.

Replace the entire file with:

```typescript
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';

const ZOOM_FACTOR = 1.06;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;
const LEFT_PADDING_SVG = 60;
const INITIAL_ZOOM = 1.25;

// Smoothing parameters
const LERP_SPEED = 0.22;
const SNAP_THRESHOLD = 0.001;
const VELOCITY_FRICTION = 0.85;
const VELOCITY_MIN = 0.5;

interface PanZoomState {
  zoom: number;
  vx: number;
  vy: number;
  vbW: number;
  vbH: number;
}

// ─── External store (rendered state) ───
let state: PanZoomState = { zoom: INITIAL_ZOOM, vx: 0, vy: 0, vbW: 640, vbH: 480 };
const listeners = new Set<() => void>();
const savedViews = new Map<string, PanZoomState>();

function getSnapshot() {
  return state;
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emit(next: PanZoomState) {
  state = next;
  listeners.forEach((cb) => cb());
}

// ─── Target state (where we're animating toward) ───
let target = { zoom: INITIAL_ZOOM, vx: 0, vy: 0 };
let animating = false;
let rafId = 0;

// Pan momentum
let velocity = { vx: 0, vy: 0 };
let hasMomentum = false;

function getContainerSize(el: HTMLElement | null) {
  if (!el) return { w: 800, h: 600 };
  const r = el.getBoundingClientRect();
  return { w: r.width || 800, h: r.height || 600 };
}

function startAnimation(wrapperEl: HTMLElement | null) {
  if (animating) return;
  animating = true;

  const tick = () => {
    const c = getContainerSize(wrapperEl);

    if (hasMomentum) {
      const speed = Math.abs(velocity.vx) + Math.abs(velocity.vy);
      if (speed > VELOCITY_MIN) {
        target.vx += velocity.vx;
        target.vy += velocity.vy;
        velocity.vx *= VELOCITY_FRICTION;
        velocity.vy *= VELOCITY_FRICTION;
      } else {
        hasMomentum = false;
        velocity.vx = 0;
        velocity.vy = 0;
      }
    }

    const dz = target.zoom - state.zoom;
    const dx = target.vx - state.vx;
    const dy = target.vy - state.vy;

    const close =
      Math.abs(dz) < SNAP_THRESHOLD * state.zoom &&
      Math.abs(dx) < SNAP_THRESHOLD &&
      Math.abs(dy) < SNAP_THRESHOLD &&
      !hasMomentum;

    if (close) {
      emit({
        zoom: target.zoom,
        vx: target.vx,
        vy: target.vy,
        vbW: c.w / target.zoom,
        vbH: c.h / target.zoom,
      });
      animating = false;
      return;
    }

    const newZoom = state.zoom + dz * LERP_SPEED;
    const newVx = state.vx + dx * LERP_SPEED;
    const newVy = state.vy + dy * LERP_SPEED;

    emit({
      zoom: newZoom,
      vx: newVx,
      vy: newVy,
      vbW: c.w / newZoom,
      vbH: c.h / newZoom,
    });

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}

// ─── Shared helpers for mouse + touch ───

function applyPan(dx: number, dy: number, dt: number) {
  const z = state.zoom;
  velocity.vx = (-dx / z) * (16.67 / Math.max(1, dt));
  velocity.vy = (-dy / z) * (16.67 / Math.max(1, dt));
  target.vx -= dx / z;
  target.vy -= dy / z;
}

function applyZoom(dir: number, clientX: number, clientY: number, rect: DOMRect) {
  const z = target.zoom;
  const fx = (clientX - rect.left) / rect.width;
  const fy = (clientY - rect.top) / rect.height;
  const oldW = rect.width / z;
  const oldH = rect.height / z;
  const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * dir));
  const newW = rect.width / nz;
  const newH = rect.height / nz;

  target.zoom = nz;
  target.vx = target.vx + (oldW - newW) * fx;
  target.vy = target.vy + (oldH - newH) * fy;
}

function getTouchDistance(a: Touch, b: Touch): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(a: Touch, b: Touch): { x: number; y: number } {
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  };
}

// ─── Hook ───

export function usePanZoom(
  baseViewBox: { minX: number; minY: number; width: number; height: number },
  viewKey?: string,
) {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const currentKey = useRef<string | undefined>(undefined);
  const initialized = useRef(false);

  // Touch state
  const touchState = useRef<{
    active: boolean;
    count: number;
    lastCenter: { x: number; y: number };
    lastDistance: number;
    lastTime: number;
  }>({
    active: false,
    count: 0,
    lastCenter: { x: 0, y: 0 },
    lastDistance: 0,
    lastTime: 0,
  });

  const getContainer = useCallback(() => getContainerSize(wrapperRef.current), []);

  const kick = useCallback(() => startAnimation(wrapperRef.current), []);

  const buildTarget = useCallback(
    (zoom: number, vx: number, vy: number) => {
      target = { zoom, vx, vy };
      kick();
    },
    [kick],
  );

  const setImmediate = useCallback(
    (zoom: number, vx: number, vy: number) => {
      const c = getContainer();
      const s = { zoom, vx, vy, vbW: c.w / zoom, vbH: c.h / zoom };
      target = { zoom, vx, vy };
      emit(s);
    },
    [getContainer],
  );

  const saveCurrentView = useCallback(() => {
    if (currentKey.current) savedViews.set(currentKey.current, { ...state });
  }, []);

  const computeInitialView = useCallback((): PanZoomState => {
    const c = getContainer();
    const vbH = c.h / INITIAL_ZOOM;
    const centerY = baseViewBox.minY + baseViewBox.height / 2;
    return {
      zoom: INITIAL_ZOOM,
      vx: baseViewBox.minX - LEFT_PADDING_SVG,
      vy: centerY - vbH / 2,
      vbW: c.w / INITIAL_ZOOM,
      vbH,
    };
  }, [baseViewBox, getContainer]);

  // Handle view key changes
  const prevKey = useRef(viewKey);
  useEffect(() => {
    const keyChanged = prevKey.current !== viewKey;
    const firstMount = !initialized.current;

    if (keyChanged || firstMount) {
      if (keyChanged) saveCurrentView();
      prevKey.current = viewKey;
      currentKey.current = viewKey;
      initialized.current = true;

      const saved = viewKey ? savedViews.get(viewKey) : undefined;
      if (saved) {
        setImmediate(saved.zoom, saved.vx, saved.vy);
      } else {
        const iv = computeInitialView();
        setImmediate(iv.zoom, iv.vx, iv.vy);
        requestAnimationFrame(() => {
          const iv2 = computeInitialView();
          setImmediate(iv2.zoom, iv2.vx, iv2.vy);
        });
      }
    }
  }, [viewKey, saveCurrentView, computeInitialView, setImmediate]);

  useEffect(() => {
    return () => {
      if (currentKey.current) savedViews.set(currentKey.current, { ...state });
      cancelAnimationFrame(rafId);
      animating = false;
    };
  }, []);

  // ─── Touch event listeners (non-passive for preventDefault) ───
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      const ts = touchState.current;
      ts.active = true;
      ts.count = e.touches.length;
      ts.lastTime = performance.now();

      hasMomentum = false;
      velocity = { vx: 0, vy: 0 };

      if (e.touches.length === 1) {
        ts.lastCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        ts.lastDistance = getTouchDistance(e.touches[0], e.touches[1]);
        ts.lastCenter = getTouchCenter(e.touches[0], e.touches[1]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent browser scroll/bounce
      const ts = touchState.current;
      if (!ts.active) return;

      const now = performance.now();
      const dt = now - ts.lastTime;
      ts.lastTime = now;

      if (e.touches.length === 1 && ts.count === 1) {
        // Single finger pan
        const dx = e.touches[0].clientX - ts.lastCenter.x;
        const dy = e.touches[0].clientY - ts.lastCenter.y;
        ts.lastCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        applyPan(dx, dy, dt);
        kick();
      } else if (e.touches.length === 2) {
        const newDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const newCenter = getTouchCenter(e.touches[0], e.touches[1]);

        // Pinch zoom
        if (ts.lastDistance > 0) {
          const scale = newDistance / ts.lastDistance;
          const rect = el.getBoundingClientRect();
          applyZoom(scale, newCenter.x, newCenter.y, rect);
        }

        // Two-finger pan
        const dx = newCenter.x - ts.lastCenter.x;
        const dy = newCenter.y - ts.lastCenter.y;
        applyPan(dx, dy, dt);

        ts.lastDistance = newDistance;
        ts.lastCenter = newCenter;
        kick();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const ts = touchState.current;
      if (e.touches.length === 0) {
        ts.active = false;
        // Enable momentum coasting
        const speed = Math.abs(velocity.vx) + Math.abs(velocity.vy);
        if (speed > VELOCITY_MIN) {
          hasMomentum = true;
          kick();
        }
      } else if (e.touches.length === 1) {
        // Went from 2 fingers to 1 — reset to single-finger pan
        ts.count = 1;
        ts.lastCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        ts.lastDistance = 0;
        ts.lastTime = performance.now();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [kick]);

  const vb = { x: s.vx, y: s.vy, w: s.vbW, h: s.vbH };

  const zoomIn = useCallback(() => {
    const nz = Math.min(target.zoom * ZOOM_FACTOR, MAX_ZOOM);
    buildTarget(nz, target.vx, target.vy);
  }, [buildTarget]);

  const zoomOut = useCallback(() => {
    const nz = Math.max(target.zoom / ZOOM_FACTOR, MIN_ZOOM);
    buildTarget(nz, target.vx, target.vy);
  }, [buildTarget]);

  const resetView = useCallback(() => {
    const iv = computeInitialView();
    hasMomentum = false;
    velocity = { vx: 0, vy: 0 };
    buildTarget(iv.zoom, iv.vx, iv.vy);
    if (currentKey.current) savedViews.delete(currentKey.current);
  }, [computeInitialView, buildTarget]);

  const panTo = useCallback(
    (svgCenterX: number, svgCenterY: number) => {
      const c = getContainer();
      const z = target.zoom;
      hasMomentum = false;
      buildTarget(z, svgCenterX - c.w / z / 2, svgCenterY - c.h / z / 2);
    },
    [getContainer, buildTarget],
  );

  const handlers = {
    onMouseDown: useCallback((e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      hasMomentum = false;
      velocity = { vx: 0, vy: 0 };
      lastMouse.current = { x: e.clientX, y: e.clientY };
      lastTime.current = performance.now();
    }, []),

    onMouseMove: useCallback(
      (e: React.MouseEvent) => {
        if (!isPanning.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        const now = performance.now();
        const dt = now - lastTime.current;

        lastMouse.current = { x: e.clientX, y: e.clientY };
        lastTime.current = now;

        applyPan(dx, dy, dt);
        kick();
      },
      [kick],
    ),

    onMouseUp: useCallback(() => {
      if (!isPanning.current) return;
      isPanning.current = false;
      const speed = Math.abs(velocity.vx) + Math.abs(velocity.vy);
      if (speed > VELOCITY_MIN) {
        hasMomentum = true;
        kick();
      }
    }, [kick]),

    onMouseLeave: useCallback(() => {
      if (!isPanning.current) return;
      isPanning.current = false;
      const speed = Math.abs(velocity.vx) + Math.abs(velocity.vy);
      if (speed > VELOCITY_MIN) {
        hasMomentum = true;
        kick();
      }
    }, [kick]),

    onWheel: useCallback(
      (e: React.WheelEvent) => {
        e.preventDefault();
        const el = wrapperRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dir = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
        applyZoom(dir, e.clientX, e.clientY, rect);
        kick();
      },
      [kick],
    ),
  };

  return {
    zoom: Math.round((s.zoom / INITIAL_ZOOM) * 100),
    viewBoxString: `${vb.x} ${vb.y} ${vb.w} ${vb.h}`,
    zoomIn,
    zoomOut,
    resetView,
    panTo,
    handlers,
    wrapperRef,
  };
}
```

Key changes:

- Extracted `applyPan(dx, dy, dt)` and `applyZoom(dir, clientX, clientY, rect)` as module-level helpers
- Added `getTouchDistance` and `getTouchCenter` utility functions
- Added `touchState` ref for tracking multi-touch state
- Added `useEffect` that attaches `touchstart`, `touchmove` (non-passive), `touchend` to the wrapper element
- Mouse `onMouseMove` and `onWheel` now call the shared `applyPan`/`applyZoom` helpers
- Touch handlers call the same helpers — no duplication of the core math

- [ ] **Step 2: Run CI checks**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: All pass.

- [ ] **Step 3: Visually verify touch support**

Test on a touchscreen device or Chrome DevTools device emulation:

1. Single finger drag → canvas pans
2. Two finger pinch → canvas zooms centered on pinch point
3. Two finger drag → canvas pans
4. Flick (quick drag + release) → momentum coasting
5. Mouse interactions unchanged (regression check)

- [ ] **Step 4: Commit**

```bash
git add src/features/canvas/hooks/use-pan-zoom.ts
git commit -m "feat: add touch pan and pinch-to-zoom for canvas"
```

---

### Task 8: Globals Import & Verification

**Files:**

- Modify: globals entry point (verify layout.scss is imported)

- [ ] **Step 1: Verify layout variables are loaded**

Check the global styles entry point to confirm `src/styles/variables/layout.scss` is imported. Look at `src/styles/globals.scss` or the app layout that imports global styles. If the variables file from Task 1 isn't imported yet, add the import.

Check in the browser dev tools that `--sidebar-width`, `--sidebar-width-compact`, `--detail-panel-width`, `--topbar-height` are defined on `:root`.

- [ ] **Step 2: Run full CI check**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck && pnpm build`
Expected: All pass. This is the final verification that everything works together.

- [ ] **Step 3: Visually verify the complete feature**

Test the full flow:

1. ≥1280px: sidebar toggle works, detail panel inline, domain grid 3-column
2. ≥1280px + sidebar collapsed + no selection: full-screen canvas
3. Resize to <1280px: sidebar becomes icon rail, detail panel becomes overlay with backdrop
4. <1280px: expand sidebar → overlay, click nav → auto-collapse
5. <1280px: select item → detail overlay with backdrop, click backdrop → closes
6. Canvas: mouse pan/zoom still works, touch pan/zoom works
7. Canvas toolbar: doesn't overflow at narrow widths
8. Dashboard domain grid: drops to 2 columns when space is tight
9. Page reload: sidebar state persists

- [ ] **Step 4: Commit if any final adjustments were needed**

```bash
git add -A
git commit -m "chore: verify globals import and final Phase 5 adjustments"
```
