# Data Model Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Data Model page with enriched data types, inline 60/40 expansion, category filters, and cross-linking — removing the detail panel.

**Architecture:** Expand `Entity`/`EntityField` types to surface all JSON metadata (RLS, triggers, indexes, FK refs). Rewrite the entity list component with API Map-consistent patterns: filter bar, line-through group dividers, staggered row animations, and a 60/40 split expansion view. Promote the ERD page to a top-level route.

**Tech Stack:** Next.js 16 (App Router), React, SCSS Modules, existing Nessi design tokens

**Spec:** `docs/superpowers/specs/2026-03-26-data-model-redesign.md`

---

### Task 1: Expand Data Model Types

**Files:**

- Modify: `src/types/data-model.ts` (entire file — currently 15 lines)

- [ ] **Step 1: Replace the types file with enriched interfaces**

```typescript
// src/types/data-model.ts

export interface ForeignKeyReference {
  table: string;
  column: string;
  onDelete?: string;
}

export interface EntityField {
  name: string;
  type: string;
  description?: string;
  nullable?: boolean;
  isPrimaryKey?: boolean;
  default?: string;
  references?: ForeignKeyReference;
}

export interface RlsPolicy {
  name: string;
  operation: string;
  using?: string;
  withCheck?: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface TableTrigger {
  name: string;
  event: string;
  timing: string;
  function: string;
}

export interface Entity {
  name: string;
  label?: string;
  badge?: string;
  badges?: string[];
  why?: string;
  fields: EntityField[];
  rlsPolicies?: RlsPolicy[];
  indexes?: TableIndex[];
  triggers?: TableTrigger[];
}
```

- [ ] **Step 2: Run typecheck to verify no breaking changes**

Run: `pnpm typecheck`
Expected: PASS — the new types are additive (all new fields are optional), so existing code continues to compile.

- [ ] **Step 3: Commit**

```bash
git add src/types/data-model.ts
git commit -m "feat(data-model): expand types with RLS, triggers, indexes, FK refs"
```

---

### Task 2: Update Data Transform to Pass Through All JSON Fields

**Files:**

- Modify: `src/data/index.ts` (lines 99-104 for `RawEntity`, line 378-383 for `transformEntities`)

- [ ] **Step 1: Expand the `RawEntity` interface**

In `src/data/index.ts`, replace lines 99-104:

```typescript
// Old:
interface RawEntity {
  name: string;
  label?: string;
  badges?: string[];
  fields: { name: string; type: string; nullable?: boolean; description?: string }[];
}

// New:
interface RawEntity {
  name: string;
  label?: string;
  badges?: string[];
  fields: {
    name: string;
    type: string;
    nullable?: boolean;
    description?: string;
    isPrimaryKey?: boolean;
    default?: string;
    references?: { table: string; column: string; onDelete?: string };
  }[];
  rlsPolicies?: {
    name: string;
    operation: string;
    using?: string;
    withCheck?: string;
  }[];
  indexes?: {
    name: string;
    columns: string[];
    unique: boolean;
  }[];
  triggers?: {
    name: string;
    event: string;
    timing: string;
    function: string;
  }[];
}
```

- [ ] **Step 2: Verify the transform function still works**

The existing `transformEntities` function (lines 378-383) uses object spread (`...e`), so the new fields pass through automatically. No changes needed to the function itself.

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/data/index.ts
git commit -m "feat(data-model): expand RawEntity to pass through all JSON metadata"
```

---

### Task 3: Remove Data Model from Detail Panel Pages

**Files:**

- Modify: `src/components/layout/app-shell/index.tsx` (line 8)

- [ ] **Step 1: Remove `/data-model` from DETAIL_PANEL_PAGES**

In `src/components/layout/app-shell/index.tsx`, change line 8:

```typescript
// Old:
const DETAIL_PANEL_PAGES = ['/data-model', '/lifecycles', '/coverage', '/features'];

// New:
const DETAIL_PANEL_PAGES = ['/lifecycles', '/coverage', '/features'];
```

- [ ] **Step 2: Remove the ERD exclusion check**

Since `/data-model` is no longer in the list, the ERD exclusion on line 25 is dead code. Update lines 23-25:

```typescript
// Old:
const pageSupportsDetail =
  DETAIL_PANEL_PAGES.some((p) => pathname.startsWith(p)) && !pathname.startsWith('/data-model/erd');

// New:
const pageSupportsDetail = DETAIL_PANEL_PAGES.some((p) => pathname.startsWith(p));
```

- [ ] **Step 3: Run typecheck and verify**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-shell/index.tsx
git commit -m "feat(data-model): remove detail panel from data model page"
```

---

### Task 4: Promote ERD to Top-Level Route

**Files:**

- Create: `src/app/entity-relationships/page.tsx`
- Delete: `src/app/data-model/erd/page.tsx`
- Modify: `src/components/layout/sidebar/index.tsx` (lines 19-29)

- [ ] **Step 1: Create the new route**

Create `src/app/entity-relationships/page.tsx`:

```typescript
import { erdNodes, erdEdges } from '@/data';
import { ErdCanvas } from '@/features/data-model/erd-canvas';

export const metadata = { title: 'Entity Relationships' };

export default function EntityRelationshipsPage() {
  return <ErdCanvas nodes={erdNodes} edges={erdEdges} />;
}
```

- [ ] **Step 2: Delete the old ERD route**

Delete: `src/app/data-model/erd/page.tsx`

Run: `rm src/app/data-model/erd/page.tsx && rmdir src/app/data-model/erd`

- [ ] **Step 3: Add the new route to sidebar navigation**

In `src/components/layout/sidebar/index.tsx`, add an import for a relationship icon and a new nav item. Add after the `HiOutlineClock` import (line 14):

```typescript
import {
  HiOutlineMap,
  HiOutlineServer,
  HiOutlineDatabase,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlinePuzzle,
  HiOutlineShieldCheck,
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineLink,
} from 'react-icons/hi';
```

Update `NAV_ITEMS` — insert after the Data Model entry (line 22):

```typescript
const NAV_ITEMS = [
  { id: 'journeys', label: 'Journeys', icon: HiOutlineMap, href: '/journeys' },
  { id: 'api', label: 'API Map', icon: HiOutlineServer, href: '/api-map' },
  { id: 'data', label: 'Data Model', icon: HiOutlineDatabase, href: '/data-model' },
  { id: 'erd', label: 'Relationships', icon: HiOutlineLink, href: '/entity-relationships' },
  { id: 'lifecycles', label: 'Lifecycles', icon: HiOutlineRefresh, href: '/lifecycles' },
  { id: 'coverage', label: 'Coverage', icon: HiOutlineChartBar, href: '/coverage' },
  { id: 'features', label: 'Features', icon: HiOutlinePuzzle, href: '/features' },
  { id: 'permissions', label: 'Permissions', icon: HiOutlineShieldCheck, href: '/permissions' },
  { id: 'config', label: 'Config', icon: HiOutlineCog, href: '/config' },
  { id: 'changelog', label: 'Changelog', icon: HiOutlineClock, href: '/changelog' },
];
```

- [ ] **Step 4: Update the ERD canvas back-link**

In `src/features/data-model/erd-canvas/index.tsx`, find the `<Link>` that points back to `/data-model` and verify it still works. The ERD canvas has a "← Data Model" link — this should remain pointing to `/data-model`.

- [ ] **Step 5: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS — new route renders, old route removed

- [ ] **Step 6: Commit**

```bash
git add src/app/entity-relationships/page.tsx src/components/layout/sidebar/index.tsx
git rm src/app/data-model/erd/page.tsx
git commit -m "feat(erd): promote entity relationships to top-level route"
```

---

### Task 5: Rewrite Entity List — Filter Bar + Group Dividers + Row Header

This is the main component rewrite. We'll build incrementally: structure first, then expansion.

**Files:**

- Rewrite: `src/features/data-model/entity-list/index.tsx`
- Rewrite: `src/features/data-model/entity-list/entity-list.module.scss`

- [ ] **Step 1: Write the new entity list component (collapsed rows only)**

Replace `src/features/data-model/entity-list/index.tsx` entirely:

```tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Entity } from '@/types/data-model';
import { PageHeader } from '@/components/ui/page-header';
import styles from './entity-list.module.scss';

/* ── Constants ── */

const CATEGORY_ORDER = [
  'core',
  'lifecycle',
  'junction',
  'config',
  'media',
  'tracking',
  'discovery',
  'user',
  'system',
];

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core Entities',
  lifecycle: 'Lifecycle & State',
  junction: 'Junction Tables',
  config: 'Configuration',
  media: 'Media',
  tracking: 'Tracking',
  discovery: 'Discovery',
  user: 'User Data',
  system: 'System',
};

/* ── Helpers ── */

function countForeignKeys(entity: Entity): number {
  return entity.fields.filter((f) => f.references).length;
}

function hasMetaSections(entity: Entity): boolean {
  return (
    (entity.rlsPolicies?.length ?? 0) > 0 ||
    (entity.triggers?.length ?? 0) > 0 ||
    (entity.indexes?.length ?? 0) > 0
  );
}

/* ── Filter Bar ── */

function FilterBar({
  categories,
  activeCategories,
  onToggleCategory,
  onToggleAll,
  totalCount,
}: {
  categories: { name: string; label: string; count: number }[];
  activeCategories: Set<string>;
  onToggleCategory: (name: string) => void;
  onToggleAll: () => void;
  totalCount: number;
}) {
  const allActive = activeCategories.size === categories.length;

  return (
    <div className={styles.filterBar}>
      <span className={styles.filterLabel}>Category</span>
      <button
        className={`${styles.filterChip} ${allActive ? styles.filterChipActive : ''}`}
        onClick={onToggleAll}
      >
        All <span className={styles.chipCount}>{totalCount}</span>
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          className={`${styles.filterChip} ${activeCategories.has(cat.name) ? styles.filterChipActive : ''}`}
          onClick={() => onToggleCategory(cat.name)}
        >
          {cat.label} <span className={styles.chipCount}>{cat.count}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Entity Row ── */

function EntityRow({
  entity,
  staggerIndex,
  isOpen,
  onToggle,
}: {
  entity: Entity;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const fkCount = countForeignKeys(entity);

  return (
    <div
      id={entity.name}
      className={`${styles.entityRow} ${isOpen ? styles.entityRowOpen : ''}`}
      style={{ '--stagger': `${staggerIndex * 20}ms` } as React.CSSProperties}
    >
      <button className={styles.entityRowHeader} onClick={onToggle}>
        <span className={styles.entityName}>{entity.name}</span>
        <span className={styles.categoryBadge}>{entity.badge}</span>
        <span className={styles.entityMeta}>
          {(entity.rlsPolicies?.length ?? 0) > 0 && <span className={styles.rlsBadge}>RLS</span>}
          {(entity.triggers?.length ?? 0) > 0 && (
            <span className={styles.triggerBadge}>Triggers</span>
          )}
          {fkCount > 0 && <span className={styles.fkCount}>{fkCount} FK</span>}
          <span className={styles.fieldCount}>{entity.fields.length} fields</span>
          <span className={styles.chevron}>&#9656;</span>
        </span>
      </button>

      {isOpen && <EntityExpansion entity={entity} />}
    </div>
  );
}

/* ── Entity Expansion (placeholder — built in Task 6) ── */

function EntityExpansion({ entity }: { entity: Entity }) {
  return (
    <div className={styles.expansion}>
      <p style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: '12px' }}>
        Expansion view — {entity.fields.length} fields
      </p>
    </div>
  );
}

/* ── Main Component ── */

interface EntityListProps {
  entities: Entity[];
}

export function EntityList({ entities }: EntityListProps) {
  const [openEntities, setOpenEntities] = useState<Set<string>>(new Set());
  const [activeCategories, setActiveCategories] = useState<Set<string>>(() => {
    const cats = new Set<string>();
    for (const e of entities) {
      if (e.badge) cats.add(e.badge);
    }
    return cats;
  });

  const allCategoryNames = useMemo(() => {
    const cats = new Set<string>();
    for (const e of entities) {
      if (e.badge) cats.add(e.badge);
    }
    return cats;
  }, [entities]);

  const categories = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => allCategoryNames.has(cat)).map((cat) => ({
      name: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      count: entities.filter((e) => e.badge === cat).length,
    }));
  }, [entities, allCategoryNames]);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => activeCategories.has(cat) && allCategoryNames.has(cat))
      .map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        entities: entities.filter((e) => e.badge === cat),
      }))
      .filter((g) => g.entities.length > 0);
  }, [entities, activeCategories, allCategoryNames]);

  const toggleCategory = (name: string) => {
    setActiveCategories((prev) => {
      const allSelected = prev.size === allCategoryNames.size;
      if (allSelected) return new Set([name]);
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        return next.size === 0 ? new Set(allCategoryNames) : next;
      }
      next.add(name);
      return next;
    });
  };

  const toggleAll = () => setActiveCategories(new Set(allCategoryNames));

  const toggleEntity = (name: string) => {
    setOpenEntities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  let staggerIndex = 0;

  return (
    <div className={styles.container}>
      <PageHeader title="Data Model" metrics={[{ value: entities.length, label: 'tables' }]}>
        <Link href="/entity-relationships" className={styles.erdLink}>
          View Entity Relationships →
        </Link>
      </PageHeader>

      <FilterBar
        categories={categories}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        onToggleAll={toggleAll}
        totalCount={entities.length}
      />

      <div className={styles.entityContainer}>
        {grouped.map((group) => (
          <div key={group.category}>
            <div className={styles.groupDivider}>
              <span className={styles.groupName}>{group.label}</span>
              <span className={styles.groupLine} />
              <span className={styles.groupCount}>{group.entities.length}</span>
            </div>

            {group.entities.map((entity) => {
              const idx = staggerIndex++;
              return (
                <EntityRow
                  key={entity.name}
                  entity={entity}
                  staggerIndex={idx}
                  isOpen={openEntities.has(entity.name)}
                  onToggle={() => toggleEntity(entity.name)}
                />
              );
            })}
          </div>
        ))}

        {grouped.length === 0 && (
          <div className={styles.emptyState}>No tables match the current filters.</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the SCSS module (filter bar + group dividers + row headers)**

Replace `src/features/data-model/entity-list/entity-list.module.scss` entirely:

```scss
.container {
  padding: 24px 28px;
  overflow-y: auto;
  height: 100%;
}

.erdLink {
  font-size: 11px;
  color: #3d8c75;
  text-decoration: none;
  display: inline-block;

  &:hover {
    text-decoration: underline;
  }
}

// ─── Filter Bar ───

.filterBar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 0;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.filterLabel {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 600;
  margin-right: 2px;
  white-space: nowrap;
}

.filterChip {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 6px;
  background: rgb(255 255 255 / 3%);
  border: 1px solid rgb(255 255 255 / 6%);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 150ms ease-out;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: rgb(255 255 255 / 12%);
    color: var(--text-secondary);
    background: rgb(255 255 255 / 5%);
  }
}

.filterChipActive {
  background: rgb(30 74 64 / 12%);
  border-color: rgb(61 140 117 / 25%);
  color: #3d8c75;
}

.chipCount {
  font-size: 10px;
  color: var(--text-muted);

  .filterChipActive & {
    color: rgb(61 140 117 / 80%);
  }
}

// ─── Entity Container ───

.entityContainer {
  padding-top: 4px;
}

// ─── Group Dividers ───

.groupDivider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0 8px;

  &:first-child {
    margin-top: 0;
  }
}

.groupName {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.groupLine {
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}

.groupCount {
  font-size: 11px;
  color: var(--text-muted);
  background: rgb(255 255 255 / 5%);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--font-family-mono);
}

// ─── Entity Row ───

.entityRow {
  margin-bottom: 2px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 150ms ease-out;
  animation: rowEnter 200ms ease-out both;
  animation-delay: var(--stagger);
}

@keyframes rowEnter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.entityRowHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: 8px;
  transition: background 150ms ease-out;
  color: inherit;
  font: inherit;

  &:hover {
    background: rgb(255 255 255 / 2%);
  }
}

.entityRow:hover {
  border-color: rgb(255 255 255 / 4%);
}

.entityRowOpen {
  background: rgb(30 74 64 / 5%);
  border-color: rgb(61 140 117 / 15%);

  .entityRowHeader {
    border-radius: 8px 8px 0 0;
  }
}

.entityName {
  font-size: 13px;
  font-family: var(--font-family-mono);
  color: #3d8c75;
  font-weight: 600;
}

.categoryBadge {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--text-muted);
  background: rgb(255 255 255 / 4%);
}

.entityMeta {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rlsBadge {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  color: #3d8c75;
  background: rgb(61 140 117 / 10%);
}

.triggerBadge {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  color: #e27739;
  background: rgb(226 119 57 / 10%);
}

.fkCount {
  font-size: 10px;
  font-family: var(--font-family-mono);
  color: var(--text-muted);
}

.fieldCount {
  font-size: 10px;
  font-family: var(--font-family-mono);
  color: var(--text-muted);
}

.chevron {
  font-size: 12px;
  color: var(--text-muted);
  transition: transform 200ms ease-out;

  .entityRowOpen & {
    transform: rotate(90deg);
  }
}

// ─── Expansion (placeholder — styles added in Task 6) ───

.expansion {
  border-top: 1px solid rgb(61 140 117 / 10%);
  border-radius: 0 0 8px 8px;
  background: rgb(15 19 25 / 50%);
}

// ─── Empty State ───

.emptyState {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 12px;
  color: var(--text-dim);
}
```

- [ ] **Step 3: Run typecheck and dev server**

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm dev` — navigate to `/data-model`, verify:

- Filter bar renders with category chips
- Group dividers use line-through pattern
- Entity rows show name, category badge, RLS/Trigger badges, FK count, field count
- Rows animate in with stagger
- Clicking a row expands to show placeholder expansion
- No detail panel on the right

- [ ] **Step 4: Commit**

```bash
git add src/features/data-model/entity-list/index.tsx src/features/data-model/entity-list/entity-list.module.scss
git commit -m "feat(data-model): rewrite entity list with filters, group dividers, enriched row headers"
```

---

### Task 6: Build the Expansion View (60/40 Split)

**Files:**

- Modify: `src/features/data-model/entity-list/index.tsx` (replace `EntityExpansion` placeholder)
- Modify: `src/features/data-model/entity-list/entity-list.module.scss` (add expansion styles)

- [ ] **Step 1: Replace the `EntityExpansion` placeholder component**

In `src/features/data-model/entity-list/index.tsx`, replace the `EntityExpansion` function with:

```tsx
/* ── Field Table ── */

function FieldTable({ entity }: { entity: Entity }) {
  return (
    <table className={styles.fieldTable}>
      <thead>
        <tr>
          <th className={styles.fieldThName}>Column</th>
          <th className={styles.fieldThType}>Type</th>
          <th className={styles.fieldThDefault}>Default</th>
          <th className={styles.fieldThRef}></th>
        </tr>
      </thead>
      <tbody>
        {entity.fields.map((f) => (
          <tr key={f.name} className={styles.fieldRow}>
            <td className={styles.fieldName}>
              {f.name}
              {f.isPrimaryKey && <span className={styles.tagPk}>PK</span>}
              {f.references && <span className={styles.tagFk}>FK</span>}
              {f.nullable && !f.isPrimaryKey && !f.references && (
                <span className={styles.tagNull}>null</span>
              )}
            </td>
            <td className={styles.fieldType}>{f.type}</td>
            <td className={styles.fieldDefault}>{f.default ?? ''}</td>
            <td className={styles.fieldRef}>
              {f.references && (
                <a
                  href={`#${f.references.table}`}
                  className={styles.fkRef}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToEntity(f.references!.table);
                  }}
                >
                  → {f.references.table}.{f.references.column}
                  {f.references.onDelete ? ` ${f.references.onDelete}` : ''}
                </a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Meta Sections ── */

function MetaSections({ entity }: { entity: Entity }) {
  return (
    <div className={styles.metaSections}>
      {entity.rlsPolicies && entity.rlsPolicies.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>RLS Policies</div>
          {entity.rlsPolicies.map((p, i) => (
            <div key={i} className={styles.metaRow}>
              <span className={styles.policyOp}>{p.operation}</span>
              <span className={styles.metaText}>{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {entity.triggers && entity.triggers.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>Triggers</div>
          {entity.triggers.map((t, i) => (
            <div key={i} className={styles.metaRow}>
              <span className={styles.triggerEvent}>{t.event}</span>
              <span className={styles.metaText}>{t.name}</span>
              <span className={styles.triggerFn}>{t.function}</span>
            </div>
          ))}
        </div>
      )}

      {entity.indexes && entity.indexes.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>Indexes</div>
          {entity.indexes.map((idx, i) => (
            <div key={i} className={styles.metaRow}>
              <span className={styles.indexCols}>{idx.columns.join(', ')}</span>
              {idx.unique && <span className={styles.indexUnique}>unique</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Entity Expansion ── */

function EntityExpansion({ entity }: { entity: Entity }) {
  const hasMeta = hasMetaSections(entity);

  return (
    <div className={styles.expansion}>
      <div className={hasMeta ? styles.splitLayout : undefined}>
        <div className={hasMeta ? styles.splitLeft : styles.fullWidth}>
          <FieldTable entity={entity} />
        </div>
        {hasMeta && (
          <div className={styles.splitRight}>
            <MetaSections entity={entity} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the `scrollToEntity` helper**

Add this helper function near the top of the file, after the `hasMetaSections` helper:

```tsx
function scrollToEntity(entityName: string) {
  const el = document.getElementById(entityName);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add(styles.entityRowHighlight);
    setTimeout(() => el.classList.remove(styles.entityRowHighlight), 2000);
  }
}
```

Also update the `EntityRow` component to auto-expand when the target entity is scrolled to. In the `EntityRow` component, add a ref and a mount effect for deep-link support:

```tsx
import { useState, useMemo, useEffect, useRef } from 'react';
```

Update `EntityRow` — add to the function body before the return:

```tsx
function EntityRow({
  entity,
  staggerIndex,
  isOpen,
  onToggle,
}: {
  entity: Entity;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const fkCount = countForeignKeys(entity);
  const rowRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === `#${entity.name}`) {
      if (!isOpen) onToggle();
      setHighlight(true);
      setTimeout(
        () => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        100,
      );
      setTimeout(() => setHighlight(false), 2000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={rowRef}
      id={entity.name}
      className={`${styles.entityRow} ${isOpen ? styles.entityRowOpen : ''} ${highlight ? styles.entityRowHighlight : ''}`}
      style={{ '--stagger': `${staggerIndex * 20}ms` } as React.CSSProperties}
    >
      {/* ... rest unchanged ... */}
    </div>
  );
}
```

Also update the `scrollToEntity` helper to trigger expansion. This requires lifting entity toggle to the parent. Update the helper to accept a callback:

Actually, a simpler approach: `scrollToEntity` just does the scroll + highlight + updates the URL hash. The `EntityRow` `useEffect` handles expansion on hash match. Update `scrollToEntity`:

```tsx
function scrollToEntity(entityName: string) {
  // Update hash so EntityRow's useEffect can pick it up on re-render
  window.location.hash = entityName;
  const el = document.getElementById(entityName);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
```

Wait — this won't trigger re-render because the hash change doesn't cause a React update. Better approach: pass `toggleEntity` down and call it directly.

Update `scrollToEntity` to accept a toggle callback. In the main `EntityList` component, create the handler:

```tsx
// In EntityList component body, after toggleEntity:
const scrollToAndExpand = (entityName: string) => {
  // Ensure entity is open
  setOpenEntities((prev) => {
    const next = new Set(prev);
    next.add(entityName);
    return next;
  });
  // Scroll after React renders
  setTimeout(() => {
    const el = document.getElementById(entityName);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add(styles.entityRowHighlight);
      setTimeout(() => el.classList.remove(styles.entityRowHighlight), 2000);
    }
  }, 50);
};
```

Pass `scrollToAndExpand` through the component tree:

- `EntityList` → `EntityRow` via prop `onScrollToEntity`
- `EntityRow` → `EntityExpansion` → `FieldTable` via prop

Update `EntityRow` props:

```tsx
function EntityRow({
  entity,
  staggerIndex,
  isOpen,
  onToggle,
  onScrollToEntity,
}: {
  entity: Entity;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onScrollToEntity: (name: string) => void;
}) {
```

Pass through to expansion:

```tsx
{
  isOpen && <EntityExpansion entity={entity} onScrollToEntity={onScrollToEntity} />;
}
```

Update `EntityExpansion` and `FieldTable` similarly to accept and use `onScrollToEntity`.

In `FieldTable`, the FK link becomes:

```tsx
<a
  href={`#${f.references.table}`}
  className={styles.fkRef}
  onClick={(e) => {
    e.preventDefault();
    onScrollToEntity(f.references!.table);
  }}
>
```

- [ ] **Step 3: Add expansion styles to the SCSS module**

Append to `entity-list.module.scss`:

```scss
// ─── Expansion Layout ───

.splitLayout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
}

.splitLeft {
  padding: 16px 18px;
  border-right: 1px solid var(--border-subtle);
}

.splitRight {
  padding: 16px 18px;
}

.fullWidth {
  padding: 16px 18px;
}

// ─── Field Table ───

.fieldTable {
  width: 100%;
  border-collapse: collapse;
}

.fieldThName,
.fieldThType,
.fieldThDefault,
.fieldThRef {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
  font-weight: 600;
  text-align: left;
  padding: 4px 8px 6px;
  border-bottom: 1px solid var(--border-medium);
  position: sticky;
  top: 0;
  background: rgb(15 19 25 / 50%);
  z-index: 1;
}

.fieldThName {
  width: 150px;
}
.fieldThType {
  width: 80px;
}
.fieldThDefault {
  width: 120px;
}

.fieldRow td {
  padding: 5px 8px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.fieldRow:last-child td {
  border-bottom: none;
}

.fieldRow:hover td {
  background: rgb(255 255 255 / 2%);
}

.fieldName {
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--text-primary);
}

.fieldType {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: var(--text-muted);
}

.fieldDefault {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: var(--text-dim);
}

.fieldRef {
  // no fixed width — takes remaining space
}

.tagPk,
.tagFk,
.tagNull {
  display: inline-block;
  font-size: 8px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-left: 4px;
  vertical-align: middle;
}

.tagPk {
  color: #3d8c75;
  background: rgb(61 140 117 / 10%);
}

.tagFk {
  color: #b8a0f0;
  background: rgb(139 92 246 / 10%);
}

.tagNull {
  color: var(--text-dim);
  background: rgb(255 255 255 / 4%);
}

.fkRef {
  font-family: var(--font-family-mono);
  font-size: 9px;
  color: #b8a0f0;
  opacity: 0.8;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 150ms ease-out;

  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
}

// ─── Meta Sections ───

.metaSections {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sectionLabel {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 8px;
}

.metaRow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  margin-bottom: 3px;
  background: rgb(255 255 255 / 2%);
}

.policyOp {
  font-family: var(--font-family-mono);
  font-size: 9px;
  font-weight: 700;
  color: #3d8c75;
  background: rgb(61 140 117 / 10%);
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 48px;
  text-align: center;
}

.triggerEvent {
  font-family: var(--font-family-mono);
  font-size: 9px;
  font-weight: 700;
  color: #e27739;
  background: rgb(226 119 57 / 10%);
  padding: 2px 6px;
  border-radius: 3px;
}

.metaText {
  font-size: 10px;
  color: var(--text-secondary);
}

.triggerFn {
  font-family: var(--font-family-mono);
  font-size: 9px;
  color: var(--text-dim);
  margin-left: auto;
}

.indexCols {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: var(--text-secondary);
}

.indexUnique {
  font-size: 8px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 700;
  text-transform: uppercase;
  color: #3d8c75;
  background: rgb(61 140 117 / 10%);
}

// ─── Deep-link highlight ───

.entityRowHighlight {
  animation: deepLinkGlow 2s ease-out;
}

@keyframes deepLinkGlow {
  0% {
    box-shadow: 0 0 20px rgb(61 140 117 / 20%);
    border-color: rgb(61 140 117 / 40%);
  }
  30% {
    box-shadow: 0 0 20px rgb(61 140 117 / 20%);
    border-color: rgb(61 140 117 / 40%);
  }
  100% {
    box-shadow: none;
    border-color: transparent;
  }
}
```

- [ ] **Step 4: Run typecheck and verify in browser**

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm dev` — navigate to `/data-model`, verify:

- Expanding `addresses` shows 60/40 split: field table left, RLS + Triggers + Indexes right
- PK/FK/null tags render correctly on field names
- FK references show `→ members.id CASCADE` in purple
- Clicking a FK reference scrolls to + expands + highlights the target entity
- Expanding `slugs` (no RLS/triggers/indexes) shows field table at full width
- Deep-link glow animation works

- [ ] **Step 5: Commit**

```bash
git add src/features/data-model/entity-list/index.tsx src/features/data-model/entity-list/entity-list.module.scss
git commit -m "feat(data-model): add 60/40 expansion view with field table, RLS, triggers, indexes, FK cross-links"
```

---

### Task 7: Update Page Component and Clean Up

**Files:**

- Modify: `src/app/data-model/page.tsx`
- Verify: `src/features/search/search-index.ts` (line 59 — search href still points to `/data-model`)

- [ ] **Step 1: Verify the page component still works**

`src/app/data-model/page.tsx` currently passes `entities` to `EntityList`. Since the `EntityList` props interface hasn't changed (still just `{ entities: Entity[] }`), no changes should be needed. Verify:

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 2: Verify search index entity references**

Check that the search index in `src/features/search/search-index.ts` (line 59) still points to `/data-model`. It does — no change needed since the data model page stays at that route.

- [ ] **Step 3: Run full build**

Run: `pnpm build`
Expected: PASS — all pages generate statically

- [ ] **Step 4: Run lint**

Run: `pnpm lint`
Expected: PASS (or only pre-existing warnings)

- [ ] **Step 5: Commit any final fixes**

If lint or build surfaced issues, fix and commit:

```bash
git add -A
git commit -m "fix(data-model): address lint and build issues from redesign"
```

If no fixes needed, skip this step.

---

### Task 8: Final Verification

- [ ] **Step 1: Verify all pages work**

Run: `pnpm dev` and check:

1. `/data-model` — full redesigned page with filter bar, groups, expansion, cross-links
2. `/entity-relationships` — ERD page loads at new route
3. Old route `/data-model/erd` — returns 404 (expected)
4. Sidebar shows "Relationships" nav item between "Data Model" and "Lifecycles"
5. No detail panel appears on `/data-model`
6. Detail panel still works on `/lifecycles`, `/coverage`, `/features`

- [ ] **Step 2: Test filter behavior**

1. Click "Core Entities" chip → only core entities shown
2. Click "Junction Tables" chip → core + junction shown
3. Click "All" chip → all categories shown
4. When only one category active, removing it → reverts to all

- [ ] **Step 3: Test expansion behavior**

1. Expand `addresses` → 60/40 split with RLS, triggers, indexes
2. Expand `slugs` → full-width field table (no meta sections)
3. Click FK ref `→ members.id CASCADE` on addresses → scrolls to + expands `members`, glow animation
4. Multiple entities can be open simultaneously

- [ ] **Step 4: Commit verification notes**

No commit needed — this is a verification task only.
