# Phase 2: Component Library — Unified Primitives

> Consolidate all UI primitives into a categorical directory structure. Every repeated UI pattern gets one canonical component.

**Date:** 2026-04-02
**Author:** Kyle Holloway + Claude
**Status:** Approved
**Spec reference:** `docs/superpowers/specs/2026-04-02-codebase-overhaul-design.md` — Phase 2 section

---

## Problem Statement

The codebase has ~1,400 lines of duplicated list/page component code across 6 feature directories:

- **4 collapsible row implementations** (entity, endpoint, config, feature) — each reimplements expand/collapse, deep-linking, border-trace highlight, diff styling, and stagger animation (~634 lines)
- **6 badge/pill implementations** — `Badge`, `DiffBadge`, `LabelPill`, plus inline variants in entity-list, lifecycle-list, architecture-list, api-list (~200 lines)
- **5 filter bar implementations** — `DiffFilterBar`, entity category filters, API method filters, journey layer filters, canvas filters-dropup (~336 lines)
- **3 field table implementations** — entity fields, API request fields, config values (~100 lines)
- **2 non-expanding row patterns** — lifecycle-list and architecture-list (~190 lines)

Components are also poorly organized — everything lives in either `components/ui/` or `components/layout/` with no further categorization.

---

## Solution

### Directory Reorganization

Adopt categorical structure mirroring `nessi-web-app`:

```
src/components/
├── controls/              # Interactive elements
│   └── (future: button, toggle, search-input)
├── indicators/            # Status display
│   ├── badge/             # Unified badge (replaces badge/ + diff-badge/)
│   ├── diff-indicator/    # Sidebar multi-dot indicator (future)
│   └── toast/             # Toast notification
├── layout/                # Structural components
│   ├── app-shell/         # Main app layout
│   ├── collapsible-row/   # Shared expandable row
│   ├── detail-panel/      # Side panel + sub-panels
│   ├── device-gate/       # Mobile blocker
│   ├── diff-toolbar/      # Diff mode toolbar
│   ├── filter-bar/        # Composable filter bar + chips
│   ├── list-row/          # Non-expanding linked row
│   ├── page-header/       # Page title + metrics
│   ├── section-label/     # Section heading
│   └── staleness-banner/  # Stale data warning
├── navigation/            # Navigation components
│   ├── sidebar/           # Main navigation sidebar
│   ├── topbar/            # Header bar
│   ├── breadcrumb/        # Navigation breadcrumb
│   ├── branch-switcher/   # Branch selection dropdown
│   └── comparison-selector/ # Diff comparison selector
├── data-display/          # Content rendering
│   ├── field-table/       # Configurable field table with diff
│   ├── key-value-row/     # Key-value pair display
│   ├── cross-link/        # Cross-reference link
│   ├── github-link/       # GitHub source file link
│   ├── info-block/        # Info callout
│   └── border-trace/      # Animated border highlight
└── canvas/                # (Phase 3 — not moved yet)
```

Each category gets a barrel `index.ts` export:

```typescript
// src/components/indicators/index.ts
export { Badge } from './badge';
export { Toast, useToast } from './toast';

// Consumer:
import { Badge } from '@/components/indicators';
```

### Component: Badge

**Replaces:** `components/ui/badge/`, `components/ui/diff-badge/`, inline badge patterns in 4 feature files

**Props:**

```typescript
interface BadgeProps {
  variant: 'category' | 'method' | 'diff' | 'count' | 'subtle';
  children?: ReactNode;

  // variant="category" — colored label
  color?: string;

  // variant="method" — HTTP method
  method?: string;

  // variant="diff" — diff status badge
  status?: DiffStatus;
  count?: number;
}
```

**Usage:**

```tsx
<Badge variant="diff" status="added" count={3} />     // "New (3)"
<Badge variant="category" color="#3d8c75">CORE</Badge> // Colored label
<Badge variant="method" method="GET" />                 // HTTP method
<Badge variant="count">12</Badge>                       // Numeric count
<Badge variant="subtle">optional</Badge>                // Muted label
```

**Implementation:** Single SCSS module with variant classes. Diff variant uses `DIFF_STATUS_CONFIG` from `@/constants/diff` for labels and colors. Method variant uses a local color map. Category variant takes color as prop.

**Migration:** Replace all `<DiffBadge>` usage with `<Badge variant="diff">`. Replace inline badge JSX in feature files. Delete `components/ui/diff-badge/` when empty.

### Component: CollapsibleRow

**Replaces:** EntityRow, EndpointRow, ConfigEnumBlock, FeatureRow accordion patterns

**Props:**

```typescript
interface CollapsibleRowProps {
  id: string;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  diffStatus?: DiffStatus;
  onExpand?: () => void;
  header: ReactNode;
  children: ReactNode;
}
```

**Internally manages:**

- **Deep-link detection** — `useDeepLink(id)` hook listens for `hashchange` + initial hash. Returns `{ isHighlighted, ref }`. When matched: expands row, scrolls into view at 100ms, clears hash at 600ms, fades highlight at 9500ms.
- **BorderTrace** — rendered when `isHighlighted` is true. Deep-link targets skip stagger delay.
- **Diff class application** — applies `diff_added`, `diff_modified`, `diff_removed`, `diff_unchanged` classes from shared diff mixin.
- **Stagger animation** — sets `--stagger` CSS variable from `staggerIndex * 20ms`.
- **Pointer-events** — disabled when `diffStatus === 'unchanged'`.
- **Expand callback** — calls `onExpand` when row opens (parent uses this to set detail panel context).

**What the caller provides:**

- `header` — domain-specific collapsed content (entity name + badges, method + path, enum name, feature title)
- `children` — domain-specific expansion content (field table, endpoint detail, config values, feature links)
- Open/close state management — parent decides single-open vs multi-open behavior

**Hook: `useDeepLink`**

```typescript
function useDeepLink(id: string): {
  isHighlighted: boolean;
  ref: RefObject<HTMLDivElement>;
};
```

Extracted from the 4 duplicate implementations. Handles hash matching, scroll-into-view, highlight lifecycle, hash cleanup. Used internally by CollapsibleRow.

### Component: ListRow

**Replaces:** Lifecycle row and architecture row patterns

**Props:**

```typescript
interface ListRowProps {
  href: string;
  staggerIndex: number;
  diffStatus?: DiffStatus;
  children: ReactNode;
}
```

Simpler than CollapsibleRow — no expand/collapse, no deep-link. Just a linked card with stagger animation and diff styling. Renders as a Next.js `Link`.

### Component: FilterBar + FilterChip

**Replaces:** `DiffFilterBar`, entity category filter, API method filter, journey layer filter

**FilterBar props:**

```typescript
interface FilterBarProps {
  children: ReactNode; // FilterChip elements
  className?: string;
}
```

**FilterChip props:**

```typescript
interface FilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  color?: string;
  count?: number;
}
```

**Hook: `useFilterToggle`**

```typescript
function useFilterToggle<T extends string>(
  allOptions: T[],
  initial?: T[],
): {
  active: Set<T>;
  toggle: (option: T) => void;
  toggleAll: () => void;
  isAllActive: boolean;
};
```

Encapsulates the multi-select logic (toggle single, toggle all/none) duplicated across 5 filter implementations.

**Migration:** `DiffFilterBar` becomes a thin wrapper composing `FilterBar` + 3 diff-status `FilterChip`s. Feature-specific filters migrate to `FilterBar` + domain-specific chips. Delete `components/ui/diff-filter-bar/` when empty.

### Component: FieldTable

**Replaces:** Entity field table, API request field table, config value rows

**Props:**

```typescript
interface FieldTableColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, field: Field) => ReactNode;
}

interface FieldTableProps {
  fields: Field[];
  columns: FieldTableColumn[];
  changedFields?: Set<string>;
  addedFields?: Field[];
}
```

**Features:**

- Configurable columns via `columns` array
- Custom cell rendering via `render` function (for PK/FK/null tags, reference links, type badges)
- Diff highlighting — `changedFields` set applies `diff-field('modified')` mixin, `addedFields` renders separate section with `diff-field('added')`
- Consistent SCSS module styling using design tokens

**Usage:**

```tsx
// Entity fields
<FieldTable
  fields={entity.fields}
  columns={[
    { key: 'name', label: 'Column', render: renderFieldName },
    { key: 'type', label: 'Type' },
    { key: 'default', label: 'Default' },
    { key: 'ref', label: 'Reference', render: renderFkLink },
  ]}
  changedFields={changedFieldNames}
  addedFields={addedFields}
/>

// API request fields
<FieldTable
  fields={endpoint.requestFields}
  columns={[
    { key: 'name', label: 'Field' },
    { key: 'type', label: 'Type' },
    { key: 'required', label: '', render: renderRequiredBadge },
  ]}
  addedFields={addedRequestFields}
/>
```

---

## Migration Strategy

1. **Build new components** in the new categorical directories
2. **Migrate one consumer at a time** — update imports, swap old component for new
3. **Delete old components** when all consumers are migrated
4. **Each task produces a working build** — CI passes at every commit

---

## What's NOT Included

- Canvas components (Phase 3)
- State management changes (Phase 4)
- Responsive layouts (Phase 5)
- Animation system (Phase 6)
- New features or behaviors — pure consolidation

---

## Success Criteria

- **One canonical component** for each UI pattern (badge, row, filter, table)
- **Categorical directory structure** with barrel exports
- **Zero duplicate row/badge/filter/table implementations** in feature directories
- **All CI checks pass** (format, lint, lint:styles, typecheck, build)
- **Visually identical** — no user-facing changes
