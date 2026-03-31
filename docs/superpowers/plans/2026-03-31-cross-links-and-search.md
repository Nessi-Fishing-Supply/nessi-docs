# Cross-Link Expansion & Search Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Entity ↔ Lifecycle and Lifecycle ↔ Journey cross-links throughout the app, and redesign the search dialog with a 3-column grouped layout, hover-scroll on truncated text, and recent searches.

**Architecture:** New `src/data/cross-links-lifecycle.ts` module builds computed indexes mapping lifecycles to entities and journeys via the existing cross-links infrastructure. Search dialog gets a full rewrite of its results rendering (3-column grouped layout) and a new `OverflowText` component for hover-scroll. Cross-links surface in entity rows, ERD tooltips, lifecycle list, lifecycle canvas header, and journey step tooltips.

**Tech Stack:** Next.js 16, React 19, TypeScript, SCSS Modules

---

## File Structure

### New files

| File                                                  | Responsibility                                              |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| `src/data/cross-links-lifecycle.ts`                   | Lifecycle ↔ Entity and Lifecycle ↔ Journey computed indexes |
| `src/features/search/search-dialog/overflow-text.tsx` | OverflowText component — hover-scroll on truncated text     |
| `src/features/search/recent-searches.ts`              | localStorage wrapper for recent search queries              |

### Modified files

| File                                                          | Changes                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/data/index.ts`                                           | Re-export lifecycle cross-link functions                                    |
| `src/features/data-model/entity-list/index.tsx`               | Add lifecycle link pill to entity rows                                      |
| `src/features/canvas/components/entity-tooltip.tsx`           | Add "Lifecycle" section below "API Endpoints"                               |
| `src/features/canvas/components/node-tooltip.tsx`             | Add "Lifecycle" section when step route affects a lifecycle-governed entity |
| `src/features/lifecycles/lifecycle-list/index.tsx`            | Add entity + journey links to lifecycle rows                                |
| `src/app/lifecycles/[slug]/client.tsx`                        | Add "Governs: tablename" link below breadcrumb                              |
| `src/features/search/search-index.ts`                         | Add `searchGrouped()` function for grouped-by-category results              |
| `src/features/search/search-dialog/index.tsx`                 | 3-column grouped layout, recent searches, keyboard nav                      |
| `src/features/search/search-dialog/search-dialog.module.scss` | Wider dialog, 3-column grid, category headers, hover-scroll animation       |

---

## Task 1: Create lifecycle cross-link index

**Files:**

- Create: `src/data/cross-links-lifecycle.ts`
- Modify: `src/data/index.ts`

- [ ] **Step 1: Create `src/data/cross-links-lifecycle.ts`**

```typescript
import { lifecycles, getAllJourneys } from '@/data/index';
import { getTablesForEndpoint } from './cross-links';

/* ------------------------------------------------------------------ */
/*  Lifecycle ↔ Entity mapping                                        */
/* ------------------------------------------------------------------ */

/** Explicit map: lifecycle slug → entity table name. */
const LIFECYCLE_ENTITY_MAP: Record<string, string> = {
  listing: 'listings',
  invite: 'shop_invites',
  flag: 'flags',
  member: 'members',
  shop: 'shops',
  thread: 'message_threads',
  offer: 'offers',
  ownership_transfers: 'shop_ownership_transfers',
  // subscription: no matching table yet
};

interface LifecycleRef {
  slug: string;
  name: string;
}

interface JourneyRef {
  slug: string;
  domain: string;
  title: string;
}

// Build entity → lifecycle index
const _entityToLifecycle = new Map<string, LifecycleRef>();
const _lifecycleToEntities = new Map<string, string[]>();

for (const lc of lifecycles) {
  const tableName = LIFECYCLE_ENTITY_MAP[lc.slug];
  if (!tableName) continue;

  _entityToLifecycle.set(tableName, { slug: lc.slug, name: lc.name });

  const existing = _lifecycleToEntities.get(lc.slug) ?? [];
  existing.push(tableName);
  _lifecycleToEntities.set(lc.slug, existing);
}

export function getLifecycleForEntity(tableName: string): LifecycleRef | null {
  return _entityToLifecycle.get(tableName) ?? null;
}

export function getEntitiesForLifecycle(lifecycleSlug: string): string[] {
  return _lifecycleToEntities.get(lifecycleSlug) ?? [];
}

/* ------------------------------------------------------------------ */
/*  Lifecycle ↔ Journey mapping (via entity overlap)                   */
/* ------------------------------------------------------------------ */

const _lifecycleToJourneys = new Map<string, JourneyRef[]>();
const _journeyToLifecycles = new Map<string, LifecycleRef[]>();

// Set of lifecycle-governed table names for quick lookup
const governedTables = new Set(_entityToLifecycle.keys());

for (const journey of getAllJourneys()) {
  const journeyLifecycles = new Set<string>();

  for (const node of journey.nodes) {
    if (node.type !== 'step' || !node.route) continue;

    // Parse "METHOD /path" from route
    const spaceIdx = node.route.indexOf(' ');
    if (spaceIdx < 0) continue;
    const method = node.route.slice(0, spaceIdx);
    const path = node.route.slice(spaceIdx + 1);

    const tables = getTablesForEndpoint(method, path);
    for (const table of tables) {
      if (governedTables.has(table.name)) {
        const lcRef = _entityToLifecycle.get(table.name)!;
        journeyLifecycles.add(lcRef.slug);
      }
    }
  }

  if (journeyLifecycles.size > 0) {
    const jRef: JourneyRef = { slug: journey.slug, domain: journey.domain, title: journey.title };
    const lcRefs: LifecycleRef[] = [];

    for (const lcSlug of journeyLifecycles) {
      // Add journey to lifecycle's list
      const existing = _lifecycleToJourneys.get(lcSlug) ?? [];
      existing.push(jRef);
      _lifecycleToJourneys.set(lcSlug, existing);

      // Collect lifecycle refs for this journey
      const lc = lifecycles.find((l) => l.slug === lcSlug);
      if (lc) lcRefs.push({ slug: lc.slug, name: lc.name });
    }

    _journeyToLifecycles.set(journey.slug, lcRefs);
  }
}

export function getJourneysForLifecycle(lifecycleSlug: string): JourneyRef[] {
  return _lifecycleToJourneys.get(lifecycleSlug) ?? [];
}

export function getLifecyclesForJourney(journeySlug: string): LifecycleRef[] {
  return _journeyToLifecycles.get(journeySlug) ?? [];
}

export function getLifecyclesForRoute(route: string): LifecycleRef[] {
  const spaceIdx = route.indexOf(' ');
  if (spaceIdx < 0) return [];
  const method = route.slice(0, spaceIdx);
  const path = route.slice(spaceIdx + 1);

  const tables = getTablesForEndpoint(method, path);
  const result: LifecycleRef[] = [];
  const seen = new Set<string>();

  for (const table of tables) {
    const lc = _entityToLifecycle.get(table.name);
    if (lc && !seen.has(lc.slug)) {
      seen.add(lc.slug);
      result.push(lc);
    }
  }
  return result;
}
```

- [ ] **Step 2: Add re-exports to `src/data/index.ts`**

Add at the end of the imports section:

```typescript
export {
  getLifecycleForEntity,
  getEntitiesForLifecycle,
  getJourneysForLifecycle,
  getLifecyclesForJourney,
  getLifecyclesForRoute,
} from './cross-links-lifecycle';
```

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/data/cross-links-lifecycle.ts src/data/index.ts
git commit -m "feat(data): add lifecycle cross-link index for entity and journey mapping"
```

---

## Task 2: Add lifecycle link to Data Model entity rows

**Files:**

- Modify: `src/features/data-model/entity-list/index.tsx`

- [ ] **Step 1: Add import**

Add to the imports at the top of the file:

```typescript
import { getLifecycleForEntity } from '@/data';
```

- [ ] **Step 2: Add lifecycle link in EntityRow**

Inside the `EntityRow` component, after the entity name/badge area and before the existing stats (RLS, TRIGGERS, FK badges), add a lifecycle link. Find the row header area where the entity name and badge are rendered. After the badge, add:

```tsx
{
  (() => {
    const lc = getLifecycleForEntity(entity.name);
    if (!lc) return null;
    return (
      <Link
        href={`/lifecycles/${lc.slug}`}
        className={styles.lifecycleLink}
        onClick={(e) => e.stopPropagation()}
      >
        ↻ {lc.name}
      </Link>
    );
  })();
}
```

- [ ] **Step 3: Add styles**

Add to `entity-list.module.scss`:

```scss
.lifecycleLink {
  font-size: 10px;
  color: var(--text-muted);
  text-decoration: none;
  padding: 1px 8px;
  border-radius: 4px;
  background: rgba(95, 127, 191, 0.1);
  border: 1px solid rgba(95, 127, 191, 0.15);
  transition:
    background 150ms ease-out,
    color 150ms ease-out;
  white-space: nowrap;

  &:hover {
    background: rgba(95, 127, 191, 0.2);
    color: var(--text-primary);
  }
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/data-model/entity-list/index.tsx src/features/data-model/entity-list/entity-list.module.scss
git commit -m "feat(data-model): add lifecycle link to entity rows"
```

---

## Task 3: Add lifecycle section to ERD entity tooltip

**Files:**

- Modify: `src/features/canvas/components/entity-tooltip.tsx`

- [ ] **Step 1: Add import**

```typescript
import { getLifecycleForEntity } from '@/data';
```

- [ ] **Step 2: Add lifecycle section**

Inside the `EntityTooltip` component, after the existing "API Endpoints" section (around line 355), add:

```tsx
{
  /* Lifecycle */
}
{
  (() => {
    const lc = entity ? getLifecycleForEntity(entity.name) : null;
    if (!lc) return null;
    return (
      <div>
        <div style={sectionLabel}>Lifecycle</div>
        <HoverLink href={`/lifecycles/${lc.slug}`}>
          <span style={{ color: '#5f7fbf' }}>↻</span>
          <span style={{ flex: 1 }}>{lc.name}</span>
          {linkIcon}
        </HoverLink>
      </div>
    );
  })();
}
```

This uses the existing `HoverLink` and `linkIcon` patterns already in the tooltip.

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/canvas/components/entity-tooltip.tsx
git commit -m "feat(erd): add lifecycle section to entity tooltip"
```

---

## Task 4: Add lifecycle section to journey step tooltip

**Files:**

- Modify: `src/features/canvas/components/node-tooltip.tsx`

- [ ] **Step 1: Add import**

```typescript
import { getLifecyclesForRoute } from '@/data';
```

- [ ] **Step 2: Add lifecycle section**

Inside the `NodeTooltip` component, after the existing route/API link section, add a lifecycle section. This should appear when the step's `route` touches a lifecycle-governed entity:

```tsx
{
  /* Lifecycle impact */
}
{
  node.route &&
    (() => {
      const lcRefs = getLifecyclesForRoute(node.route);
      if (lcRefs.length === 0) return null;
      return (
        <div style={{ marginTop: '8px' }}>
          <div style={sectionLabel}>Affects Lifecycle</div>
          {lcRefs.map((lc) => (
            <Link
              key={lc.slug}
              href={`/lifecycles/${lc.slug}`}
              style={{
                ...monoBlock,
                color: '#5f7fbf',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'background 150ms ease-out',
                marginTop: '2px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <span>↻</span>
              <span style={{ flex: 1 }}>{lc.name}</span>
            </Link>
          ))}
        </div>
      );
    })();
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/canvas/components/node-tooltip.tsx
git commit -m "feat(journeys): add lifecycle section to step tooltip"
```

---

## Task 5: Add entity + journey links to lifecycle list

**Files:**

- Modify: `src/features/lifecycles/lifecycle-list/index.tsx`
- Modify: `src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss`

- [ ] **Step 1: Add imports**

```typescript
import { getEntitiesForLifecycle, getJourneysForLifecycle } from '@/data';
```

- [ ] **Step 2: Add entity and journey info to lifecycle rows**

Inside the row content div (after `rowDesc`), add:

```tsx
<div className={styles.rowMeta}>
  {(() => {
    const entityNames = getEntitiesForLifecycle(lc.slug);
    if (entityNames.length === 0) return null;
    return (
      <Link
        href={`/data-model#${entityNames[0]}`}
        className={styles.metaLink}
        onClick={(e) => e.stopPropagation()}
      >
        Table: {entityNames[0]}
      </Link>
    );
  })()}
  {(() => {
    const journeys = getJourneysForLifecycle(lc.slug);
    if (journeys.length === 0) return null;
    return (
      <span className={styles.metaText}>
        {journeys.length} {journeys.length === 1 ? 'journey' : 'journeys'}
      </span>
    );
  })()}
</div>
```

- [ ] **Step 3: Add styles**

Add to `lifecycle-list.module.scss`:

```scss
.rowMeta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 10px;
}

.metaLink {
  color: var(--text-muted);
  text-decoration: none;
  font-family: var(--font-family-mono);
  transition: color 150ms ease-out;

  &:hover {
    color: var(--text-primary);
  }
}

.metaText {
  color: var(--text-dim);
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/lifecycles/lifecycle-list/index.tsx src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss
git commit -m "feat(lifecycles): add entity and journey links to lifecycle list rows"
```

---

## Task 6: Add "Governs" entity link to lifecycle canvas header

**Files:**

- Modify: `src/app/lifecycles/[slug]/client.tsx`

- [ ] **Step 1: Add import**

```typescript
import Link from 'next/link';
import { getEntitiesForLifecycle } from '@/data';
```

- [ ] **Step 2: Add governs link below breadcrumb**

After the `Breadcrumb` component, add a subtle link:

```tsx
{
  (() => {
    const entityNames = getEntitiesForLifecycle(lifecycle.slug);
    if (entityNames.length === 0) return null;
    return (
      <div style={{ padding: '0 16px 4px', fontSize: '11px' }}>
        <span style={{ color: 'var(--text-dim)' }}>Governs: </span>
        <Link
          href={`/data-model#${entityNames[0]}`}
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '11px',
          }}
        >
          {entityNames[0]} →
        </Link>
      </div>
    );
  })();
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/lifecycles/[slug]/client.tsx
git commit -m "feat(lifecycles): add governs entity link to canvas header"
```

---

## Task 7: Create OverflowText component for hover-scroll

**Files:**

- Create: `src/features/search/search-dialog/overflow-text.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useRef, useState, useCallback } from 'react';

interface OverflowTextProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}

export function OverflowText({ children, className, style }: OverflowTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [overflow, setOverflow] = useState(0);

  const handleMouseEnter = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const diff = el.scrollWidth - el.clientWidth;
    if (diff > 0) {
      setOverflow(diff);
      setScrolling(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setScrolling(false);
    setOverflow(0);
  }, []);

  // Animation duration proportional to overflow: ~50px/s
  const duration = overflow > 0 ? (overflow / 50) * 1000 + 800 : 0; // +800ms for pauses

  return (
    <span
      ref={ref}
      className={className}
      style={{
        ...style,
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: scrolling ? 'clip' : 'ellipsis',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        style={
          {
            display: 'inline-block',
            transition: scrolling ? 'none' : undefined,
            animation: scrolling ? `overflow-scroll ${duration}ms linear` : undefined,
            '--scroll-distance': `-${overflow}px`,
          } as React.CSSProperties
        }
      >
        {children}
      </span>
    </span>
  );
}
```

- [ ] **Step 2: Add keyframe animation to search-dialog.module.scss**

Add at the bottom:

```scss
:global {
  @keyframes overflow-scroll {
    0% {
      transform: translateX(0);
    }

    15% {
      transform: translateX(0);
    }

    85% {
      transform: translateX(var(--scroll-distance));
    }

    100% {
      transform: translateX(var(--scroll-distance));
    }
  }
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/search/search-dialog/overflow-text.tsx src/features/search/search-dialog/search-dialog.module.scss
git commit -m "feat(search): add OverflowText component with hover-scroll animation"
```

---

## Task 8: Create recent searches localStorage wrapper

**Files:**

- Create: `src/features/search/recent-searches.ts`

- [ ] **Step 1: Create the module**

```typescript
const STORAGE_KEY = 'nessi-docs:recent-searches';
const MAX_ENTRIES = 8;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const current = getRecentSearches().filter((q) => q !== trimmed);
  current.unshift(trimmed);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage full or unavailable
  }
}

export function removeRecentSearch(query: string): void {
  const current = getRecentSearches().filter((q) => q !== query);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // noop
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/search/recent-searches.ts
git commit -m "feat(search): add recent searches localStorage wrapper"
```

---

## Task 9: Add grouped search function to search-index.ts

**Files:**

- Modify: `src/features/search/search-index.ts`

- [ ] **Step 1: Add SearchCategory type and searchGrouped function**

Add after the existing `search` function:

```typescript
export interface SearchCategory {
  type: SearchResult['type'];
  label: string;
  color: string;
  results: SearchResult[];
}

const CATEGORY_CONFIG: { type: SearchResult['type']; label: string; color: string }[] = [
  { type: 'journey', label: 'Journeys', color: '#3d8c75' },
  { type: 'step', label: 'Steps', color: '#3d8c75' },
  { type: 'endpoint', label: 'Endpoints', color: '#e27739' },
  { type: 'entity', label: 'Entities', color: '#8a8580' },
  { type: 'lifecycle', label: 'Lifecycles', color: '#5f7fbf' },
  { type: 'state', label: 'States', color: '#5f7fbf' },
  { type: 'feature', label: 'Features', color: '#9b7bd4' },
  { type: 'architecture', label: 'Architecture', color: '#d4923a' },
  { type: 'config', label: 'Config', color: '#78756f' },
];

export function searchGrouped(query: string, maxPerCategory = 5): SearchCategory[] {
  if (!query.trim()) return [];
  const index = getSearchIndex();
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);

  // Score all results
  const scored: { result: SearchResult; score: number }[] = [];
  for (const result of index) {
    const titleLower = result.title.toLowerCase();
    const subtitleLower = result.subtitle.toLowerCase();
    const combined = titleLower + ' ' + subtitleLower;

    let score = 0;
    if (titleLower === q) score += 100;
    else if (titleLower.startsWith(q)) score += 60;
    else if (titleLower.includes(q)) score += 40;

    const allTokensMatch = tokens.every((t) => combined.includes(t));
    if (allTokensMatch) score += 30;

    for (const t of tokens) {
      if (titleLower.includes(t)) score += 10;
      if (subtitleLower.includes(t)) score += 5;
    }

    if (score > 0) scored.push({ result, score });
  }

  // Group by type, sorted by score within each group
  scored.sort((a, b) => b.score - a.score);

  const groups = new Map<string, SearchResult[]>();
  for (const { result } of scored) {
    const existing = groups.get(result.type) ?? [];
    existing.push(result);
    groups.set(result.type, existing);
  }

  // Build categories in defined order, skip empty
  return CATEGORY_CONFIG.filter((cfg) => groups.has(cfg.type)).map((cfg) => ({
    type: cfg.type,
    label: cfg.label,
    color: cfg.color,
    results: groups.get(cfg.type)!.slice(0, maxPerCategory),
  }));
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/search/search-index.ts
git commit -m "feat(search): add searchGrouped function for category-based results"
```

---

## Task 10: Rewrite search dialog with 3-column grouped layout

**Files:**

- Modify: `src/features/search/search-dialog/index.tsx`
- Modify: `src/features/search/search-dialog/search-dialog.module.scss`

- [ ] **Step 1: Rewrite search-dialog/index.tsx**

Replace the entire file:

```tsx
'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchGrouped, type SearchResult, type SearchCategory } from '../search-index';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '../recent-searches';
import { OverflowText } from './overflow-text';
import styles from './search-dialog.module.scss';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Flatten grouped categories into a linear list for keyboard navigation. */
function flattenResults(categories: SearchCategory[]): SearchResult[] {
  return categories.flatMap((cat) => cat.results);
}

/** Assign categories to 3 columns, balancing by result count (shortest column gets next). */
function assignColumns(categories: SearchCategory[]): SearchCategory[][] {
  const columns: SearchCategory[][] = [[], [], []];
  const heights = [0, 0, 0];

  for (const cat of categories) {
    // Find shortest column
    const minIdx = heights.indexOf(Math.min(...heights));
    columns[minIdx].push(cat);
    heights[minIdx] += cat.results.length + 1; // +1 for header
  }

  return columns;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
      setRecentSearches(getRecentSearches());
    }
  }, [isOpen]);

  const categories = useMemo(() => searchGrouped(query), [query]);
  const flatResults = useMemo(() => flattenResults(categories), [categories]);
  const columns = useMemo(() => assignColumns(categories), [categories]);

  const navigate = useCallback(
    (result: SearchResult) => {
      if (query.trim()) addRecentSearch(query.trim());
      router.push(result.href);
      onClose();
    },
    [router, onClose, query],
  );

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIndex(0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && flatResults[activeIndex]) {
        navigate(flatResults[activeIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [flatResults, activeIndex, navigate, onClose],
  );

  const handleRecentClick = useCallback((q: string) => {
    setQuery(q);
    setActiveIndex(0);
  }, []);

  const handleRecentRemove = useCallback((q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentSearch(q);
    setRecentSearches(getRecentSearches());
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  if (!isOpen) return null;

  // Track flat index across columns for active highlighting
  let flatIdx = 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <span className={styles.searchIcon}>⌘K</span>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search journeys, endpoints, tables, states..."
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
          />
          <button className={styles.closeBtn} onClick={onClose}>
            esc
          </button>
        </div>

        {categories.length > 0 && (
          <div className={styles.results}>
            <div className={styles.columnGrid}>
              {columns.map((colCategories, colIdx) => (
                <div key={colIdx} className={styles.column}>
                  {colCategories.map((cat) => {
                    const catResults = cat.results.map((result, i) => {
                      const currentFlatIdx = flatIdx++;
                      return (
                        <button
                          key={`${result.type}-${result.title}-${i}`}
                          className={`${styles.result} ${currentFlatIdx === activeIndex ? styles.active : ''}`}
                          onClick={() => navigate(result)}
                          onMouseEnter={() => setActiveIndex(currentFlatIdx)}
                        >
                          <span className={styles.resultIcon} style={{ color: result.color }}>
                            {result.icon}
                          </span>
                          <div className={styles.resultText}>
                            <OverflowText className={styles.resultTitle}>
                              {result.title}
                            </OverflowText>
                            <OverflowText className={styles.resultSubtitle}>
                              {result.subtitle}
                            </OverflowText>
                          </div>
                        </button>
                      );
                    });

                    return (
                      <div key={cat.type} className={styles.category}>
                        <div className={styles.categoryHeader} style={{ color: cat.color }}>
                          {cat.label}
                        </div>
                        {catResults}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {query && categories.length === 0 && (
          <div className={styles.empty}>No results for &ldquo;{query}&rdquo;</div>
        )}

        {!query && recentSearches.length > 0 && (
          <div className={styles.recentSearches}>
            <div className={styles.recentHeader}>
              <span>Recent</span>
              <button className={styles.clearRecent} onClick={handleClearRecent}>
                Clear all
              </button>
            </div>
            {recentSearches.map((q) => (
              <button key={q} className={styles.recentItem} onClick={() => handleRecentClick(q)}>
                <span className={styles.recentQuery}>{q}</span>
                <span className={styles.recentRemove} onClick={(e) => handleRecentRemove(q, e)}>
                  ×
                </span>
              </button>
            ))}
          </div>
        )}

        {!query && recentSearches.length === 0 && (
          <div className={styles.hints}>
            <span>Journeys</span>
            <span>API endpoints</span>
            <span>Tables</span>
            <span>Lifecycles</span>
            <span>Architecture</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update search-dialog.module.scss**

Replace the `.dialog` width, `.results`, and add new classes. Keep existing `.overlay`, `.inputWrapper`, `.searchIcon`, `.input`, `.closeBtn`, `.empty` styles. Replace/add:

```scss
.dialog {
  width: 720px;
  max-height: 520px;
  background: var(--bg-panel);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
  box-shadow: 0 24px 64px rgb(0 0 0 / 50%);
  overflow: hidden;
  animation: dialog-in 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.results {
  max-height: 420px;
  overflow-y: auto;
  padding: 12px;
}

.columnGrid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category {
  display: flex;
  flex-direction: column;
}

.categoryHeader {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
  padding: 0 4px;
}

.result {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 6px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 60ms ease;

  &:hover,
  &.active {
    background: var(--bg-raised);
  }
}

.resultIcon {
  font-size: 12px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.resultText {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.resultTitle {
  font-size: 12px;
  color: var(--text-primary);
}

.resultSubtitle {
  font-size: 10px;
  color: var(--text-muted);
}

// Recent searches
.recentSearches {
  padding: 8px 12px;
}

.recentHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 4px 8px;
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.clearRecent {
  font-size: 10px;
  color: var(--text-dim);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: var(--text-muted);
  }
}

.recentItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 8px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 60ms ease;

  &:hover {
    background: var(--bg-raised);
  }
}

.recentQuery {
  font-size: 13px;
  color: var(--text-primary);
}

.recentRemove {
  font-size: 14px;
  color: var(--text-dim);
  opacity: 0;
  transition: opacity 100ms ease;

  .recentItem:hover & {
    opacity: 1;
  }

  &:hover {
    color: var(--text-muted);
  }
}
```

Remove the old `.resultType` class (no longer used — type is shown via category headers).

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/search/search-dialog/index.tsx src/features/search/search-dialog/search-dialog.module.scss
git commit -m "feat(search): 3-column grouped layout with recent searches and hover-scroll"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full CI checks**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck
```

Expected: All pass.

- [ ] **Step 2: Visual spot-check with dev server**

Run `pnpm dev` and verify:

1. **Data Model page** — entity rows for `listings`, `members`, `shops`, `flags`, `offers` show lifecycle link pills
2. **ERD canvas** — hover over `listings` entity node, tooltip shows "Lifecycle: Listing Lifecycle" with link
3. **Journey canvas** — click a step node that has a route (e.g., POST /api/listings), tooltip shows "Affects Lifecycle: Listing Lifecycle"
4. **Lifecycle list** — each row shows "Table: tablename" and journey count
5. **Lifecycle canvas** — header shows "Governs: listings →" below breadcrumb
6. **Search (Cmd+K)** — type "listing", see 3-column grouped results
7. **Search hover-scroll** — hover over a truncated result, text scrolls to reveal full content
8. **Recent searches** — search something, close, reopen, see recent query in empty state
9. **Deep-links** — click lifecycle→data-model links, verify hash highlight animation works
