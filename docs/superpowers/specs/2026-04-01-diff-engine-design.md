# Diff Engine & Visual Diff Overlay Design

> Compare any two branches side-by-side with a visual diff overlay across all view types — list views, canvas views, and navigation.

---

## Context

The branch system is in place: URL-based branching (`/main/`, `/staging/`), `BranchProvider` with `comparisonBranch`/`comparisonData` slots, `loadBranch()` returning typed `BranchData`, and a branch switcher in the sidebar. This spec adds the ability to compare two branches visually.

## Goals

1. A centralized diff engine that compares two `BranchData` objects and produces a typed `DiffResult`
2. A comparison dropdown in the sidebar to select a branch to compare against
3. A diff toolbar banner showing comparison state and summary counts
4. Visual diff overlays on all view types (list views, canvas views, navigation)
5. Query-param-based diff activation (`?compare=main`) — shareable, lightweight
6. Consistent color coding matching the existing changelog convention

## Non-Goals

- Deep field-level diffing within nested arrays (e.g., which specific column changed in an entity) — first version compares top-level properties
- Side-by-side split view — this is an overlay, not two panels
- Diff for changelog or roadmap pages (these are metadata, not architecture)
- Merge or conflict resolution UI

---

## 1. Diff Engine

### 1.1 Core Types

```ts
type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

interface DiffSet<T> {
  added: T[]; // exists on head, not on base
  removed: T[]; // exists on base, not on head
  modified: ModifiedItem<T>[]; // exists on both, fields differ
  unchanged: T[]; // identical on both
  /** Quick lookup: item key → status */
  statusMap: Map<string, DiffStatus>;
}

interface ModifiedItem<T> {
  base: T;
  head: T;
  changes: FieldChange[];
}

interface FieldChange {
  field: string; // top-level property name, e.g. "description", "fields"
  baseValue: unknown;
  headValue: unknown;
}

interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  /** Per-domain breakdown */
  byDomain: Record<string, { added: number; removed: number; modified: number }>;
}

interface DiffResult {
  entities: DiffSet<Entity>;
  journeys: DiffSet<Journey>;
  lifecycles: DiffSet<Lifecycle>;
  apiGroups: DiffSet<ApiGroup>;
  archDiagrams: DiffSet<ArchDiagram>;
  features: DiffSet<Feature>;
  erdNodes: DiffSet<ErdNode>;
  configEnums: DiffSet<ConfigEnum>;
  summary: DiffSummary;
}
```

### 1.2 Matching Strategy

Items are matched between base and head by a stable key per domain:

| Domain       | Key                                 |
| ------------ | ----------------------------------- |
| entities     | `name`                              |
| journeys     | `slug`                              |
| lifecycles   | `slug`                              |
| apiGroups    | `name`                              |
| archDiagrams | `slug`                              |
| features     | `slug`                              |
| erdNodes     | `id`                                |
| configEnums  | `name` (or `slug` — check the type) |

If a key exists on both sides, the item is compared field-by-field (top-level properties). If fields differ, it's `modified` with a `FieldChange` list. If only on head, `added`. If only on base, `removed`.

### 1.3 Comparison Depth

First version: **shallow comparison** of top-level properties using `JSON.stringify` per field. Arrays are compared by length and stringified content. This catches:

- New/removed fields on entities
- Changed descriptions, titles, slugs
- Different node/edge counts in journeys
- Added/removed states in lifecycles

Deep structural diffing (e.g., "which specific column was added to this entity") is a future enhancement. The `FieldChange` type supports it — we just don't populate sub-paths yet.

### 1.4 ERD Edges

ERD edges are diffed separately from nodes. An edge is matched by `source + target` composite key. Added/removed edges follow the same color coding as nodes.

### 1.5 API Endpoints Within Groups

API groups are matched by group `name`. Within a matched group, individual endpoints are matched by `method + path`. The diff result for `apiGroups` includes both group-level and endpoint-level changes.

```ts
// Extended for API groups
interface ApiGroupDiff {
  group: ApiGroup;
  status: DiffStatus;
  endpointDiffs: {
    added: Endpoint[];
    removed: Endpoint[];
    modified: { base: Endpoint; head: Endpoint; changes: FieldChange[] }[];
    unchanged: Endpoint[];
  };
}
```

### 1.6 `computeDiff` Function

```ts
function computeDiff(base: BranchData, head: BranchData): DiffResult;
```

Pure function. No side effects. Memoizable. Takes two `BranchData` objects and returns the complete diff.

### 1.7 `useDiffMode` Hook

```ts
function useDiffMode(): {
  isActive: boolean;
  compareBranch: string | null;
  diffResult: DiffResult | null;
  activate: (branchName: string) => void;
  deactivate: () => void;
};
```

- Reads `?compare=` from the URL search params
- Pulls `activeData` and the comparison branch's data from `BranchProvider`
- Calls `computeDiff(comparisonData, activeData)` — base is what you're comparing against, head is what you're viewing
- Memoizes the result (recomputes only when branch data or compare param changes)
- `activate(name)` adds `?compare=name` to the URL
- `deactivate()` removes the query param

---

## 2. Diff Colors

Consistent with the existing changelog `CHANGE_TYPE_CONFIG`:

| Status    | Color | Hex       | Usage                                      |
| --------- | ----- | --------- | ------------------------------------------ |
| Added     | Green | `#3d8c75` | Left border, subtle bg tint, badges        |
| Modified  | Blue  | `#7b8fcd` | Left border, subtle bg tint, badges        |
| Removed   | Red   | `#b84040` | Left border, subtle bg tint, ghost styling |
| Unchanged | —     | —         | Dimmed to ~50% opacity in diff mode        |

These are defined as CSS custom properties for diff mode:

```scss
--diff-added: #3d8c75;
--diff-modified: #7b8fcd;
--diff-removed: #b84040;
--diff-added-bg: rgba(61, 140, 117, 0.08);
--diff-modified-bg: rgba(123, 143, 205, 0.08);
--diff-removed-bg: rgba(184, 64, 64, 0.08);
--diff-dim-opacity: 0.5;
```

---

## 3. UI Components

### 3.1 Comparison Dropdown

**Location:** Sidebar, in the switcher section at the bottom — directly above the branch switcher button.

**Appearance:**

- When no comparison active: A subtle "Compare..." button/link below the branch switcher
- When comparison active: Shows "vs **Main**" (or whatever the comparison branch is) with a dismiss (X) button

**Behavior:**

- Click opens a dropdown listing all branches except the active one
- Selecting a branch adds `?compare=branchName` to the current URL
- Dismiss removes the query param

### 3.2 Diff Toolbar Banner

**Location:** Top of the main content area, between the page header and the content. Persistent while diff mode is active.

**Content:**

- Left: "Comparing against **Production**" (or the comparison branch label)
- Center: Summary counts — "3 added · 1 modified · 0 removed" with colored dots (page-specific counts, not global)
- Right: Dismiss button (X) to exit diff mode

**Styling:** Subtle bar with `var(--bg-raised)` background, bottom border. Not loud — informational.

### 3.3 Diff Legend (Canvas Views)

Replaces or augments the existing canvas legend when diff mode is active. Shows:

- Green dot + "Added"
- Blue dot + "Modified"
- Red dot + "Removed"
- Gray dot + "Unchanged"

---

## 4. Visual Diff — List Views

Applies to: Data Model, API Map, Config, Lifecycles list, Features, Architecture list.

### 4.1 Row-Level Treatment

**Added rows:**

- Left border: 2px solid `var(--diff-added)`
- Background: `var(--diff-added-bg)`
- Small "NEW" pill badge next to the item name (same green)
- Normal interactivity (expandable, clickable)

**Modified rows:**

- Left border: 2px solid `var(--diff-modified)`
- Background: `var(--diff-modified-bg)`
- When expanded: changed fields highlighted with a subtle blue underline or background. Shows the base value struck through and the head value next to it (for simple fields like description, name). For complex fields (arrays), shows a count: "3 → 5 fields"

**Removed rows:**

- Left border: 2px solid `var(--diff-removed)`
- Background: `var(--diff-removed-bg)`
- Text at ~60% opacity (ghosted)
- Not expandable (no data on the current branch to show)
- Shown at the bottom of their category group, separated by a subtle "Removed" section label

**Unchanged rows:**

- Opacity reduced to `var(--diff-dim-opacity)` (~50%)
- Normal interactivity preserved (can still expand/click)

### 4.2 Category Headers

If a category has diff changes, show a count badge: "Core Entities · 1 new, 1 modified"

### 4.3 Page Header

The existing `PageHeader` component gets an optional diff summary prop. When diff mode is active: "22 tables · **1 added** · **1 modified**" with colored text.

---

## 5. Visual Diff — Canvas Views

Applies to: Journeys, ERD, Lifecycle detail, Architecture diagrams.

### 5.1 Node Treatment

**Added nodes:**

- Border color: `var(--diff-added)` (replaces the normal category/layer color)
- Subtle green glow (similar to selection glow but green)
- Full opacity
- Tooltip includes "New on {branch}" context

**Modified nodes:**

- Border color: `var(--diff-modified)`
- Subtle blue glow
- Full opacity
- Tooltip includes "Changed" with a list of modified fields

**Removed nodes:**

- Rendered as ghost nodes at their base-branch position
- Border color: `var(--diff-removed)`, dashed border style
- Opacity ~40%
- Not interactive (no click, no tooltip drill-down)
- Label still visible for context

**Unchanged nodes:**

- Opacity reduced to ~60%
- Normal interactivity preserved (trace mode, tooltips still work)

### 5.2 Edge Treatment

Edges follow the status of their most "significant" connected node:

- If either endpoint is added → edge is green (added)
- If either endpoint is removed → edge is red, dashed (removed)
- If either endpoint is modified → edge is blue (modified)
- If both endpoints are unchanged → edge is dimmed

### 5.3 Diff Legend

When diff mode is active, the canvas legend gets a "Diff" section appended (or replaces the existing legend content). Four entries: Added (green), Modified (blue), Removed (red), Unchanged (gray).

### 5.4 Brand-New Canvases

If a journey/lifecycle/architecture diagram exists only on the current branch (entirely new):

- Canvas renders normally with full styling (no diff coloring needed — everything is "new")
- Diff toolbar banner shows: "This {type} only exists on {branch} — not present on {comparison branch}"
- No dimming since there's nothing to compare

If a diagram was removed (exists only on base):

- The page still renders (using base data) but all nodes are ghost-styled (removed treatment)
- Diff toolbar: "This {type} was removed — it exists on {comparison branch} but not on {branch}"

---

## 6. Visual Diff — Navigation

### 6.1 Sidebar

When diff mode is active, sidebar nav items that correspond to domains with changes get a small colored dot:

- Green dot: domain has additions
- Blue dot: domain has modifications
- If both: blue dot (modifications are more interesting than additions)

Feature domain links in the sidebar: if a feature domain only exists on the current branch, it gets a green "NEW" badge.

### 6.2 Journey Domain Grid

Domain cards on the journeys index page show diff badges:

- "2 new journeys" (green badge)
- "1 modified" (blue badge)
- If a domain only exists on the current branch, the entire card gets the added treatment

### 6.3 Lifecycle / Architecture Lists

Same as list views — added/modified/removed row treatment on list items.

---

## 7. Diff Mode Activation Flow

1. User clicks "Compare..." in the sidebar comparison dropdown
2. Dropdown shows available branches (all except the active one)
3. User selects a branch (e.g., "Production")
4. URL updates: `/staging/data-model` → `/staging/data-model?compare=main`
5. `useDiffMode()` hook detects the `compare` param
6. `BranchProvider` loads the comparison branch data (already available via `allBranchData`)
7. `computeDiff()` runs, result is memoized
8. Diff toolbar banner appears at the top of the content area
9. View components read diff result and apply visual treatment
10. Sidebar shows diff dots on affected domains

**Exiting diff mode:**

- Click X on the diff toolbar banner
- Click X on the comparison indicator in the sidebar
- Select a different branch in the comparison dropdown (switches comparison)
- Both remove `?compare=` from the URL

---

## 8. Implementation Scope

### Phase 1 (This Spec)

- Diff engine (`computeDiff`, `DiffResult`, `DiffSet`)
- `useDiffMode` hook
- Comparison dropdown in sidebar
- Diff toolbar banner
- Diff colors (CSS custom properties)
- List view diff treatment (Data Model, API Map, Lifecycles list, Architecture list)

### Phase 2 (Separate Spec)

- Canvas view diff treatment (Journeys, ERD, Lifecycle detail, Architecture canvases)
- Sidebar diff dots
- Journey domain grid diff badges
- Brand-new/removed canvas handling
- Deep field-level diffing within entities

### Why Phase the Canvas Work

Canvas diff rendering is significantly more complex than list diff rendering — it requires:

- Injecting ghost nodes from the base branch into the current layout
- Modifying the shared canvas infrastructure (node components, edge components, legend)
- Handling layout recomputation when ghost nodes are added
- Trace mode interaction with diff mode

List views are self-contained per-component changes. Canvas views touch shared infrastructure. Phasing them separately keeps each spec focused and shippable.

---

## 9. File Map

### New Files

| File                                                                        | Purpose                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/data/diff-engine.ts`                                                   | `computeDiff()`, `DiffResult`, `DiffSet`, types         |
| `src/hooks/use-diff-mode.ts`                                                | `useDiffMode()` hook — reads query param, computes diff |
| `src/components/layout/comparison-selector/index.tsx`                       | Comparison dropdown in sidebar                          |
| `src/components/layout/comparison-selector/comparison-selector.module.scss` | Styles                                                  |
| `src/components/layout/diff-toolbar/index.tsx`                              | Diff banner at top of content area                      |
| `src/components/layout/diff-toolbar/diff-toolbar.module.scss`               | Styles                                                  |
| `src/styles/variables/diff.scss`                                            | Diff color CSS custom properties                        |

### Modified Files

| File                                                    | Change                                      |
| ------------------------------------------------------- | ------------------------------------------- |
| `src/components/layout/sidebar/index.tsx`               | Add ComparisonSelector below BranchSwitcher |
| `src/components/layout/sidebar/sidebar.module.scss`     | Space for comparison selector               |
| `src/components/layout/app-shell/index.tsx`             | Render DiffToolbar when diff mode active    |
| `src/features/data-model/entity-list/index.tsx`         | Diff-aware row styling                      |
| `src/features/api-map/api-list/index.tsx`               | Diff-aware row styling                      |
| `src/features/lifecycles/lifecycle-list/index.tsx`      | Diff-aware row styling                      |
| `src/features/architecture/architecture-list/index.tsx` | Diff-aware row styling                      |
| `src/features/config/config-list/index.tsx`             | Diff-aware row styling                      |
| `src/styles/globals.scss`                               | Import diff variables                       |
