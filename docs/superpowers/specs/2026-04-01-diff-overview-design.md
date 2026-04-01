# Diff Overview Page Design

> A dedicated page for browsing all changes between two branches, with deep-links into every changed item.

---

## Context

The diff engine (Phase 1) is in place: `computeDiff()` produces a typed `DiffResult`, `useDiffMode()` reads `?compare=` from the URL, the toolbar banner shows summary counts, and list views show diff-colored rows. This spec adds a diff overview page that serves as the primary entry point for comparison mode, and refines the toolbar to be a persistent navigation bar linking back to the overview.

## Goals

1. A `/[branch]/diff` page that shows all changes between two branches grouped by domain
2. An empty state with branch selector when no comparison is active
3. Clickable change items that deep-link into the target page with the item highlighted
4. Toolbar counts become links to the diff overview page (filtered by status)
5. Remove the dismiss button from the toolbar — diff mode is exited only via the sidebar comparison selector

## Non-Goals

- Field-level change detail (e.g., showing which specific column changed on an entity) — first version shows item-level changes with a "changed fields" count
- Side-by-side field comparison view — future enhancement
- Canvas diff preview on the overview page — just lists

---

## 1. Diff Overview Page

### 1.1 Route

`/[branch]/diff` — static page, same pattern as other branch-scoped pages.

When `?compare=` is not present, shows the empty state. When `?compare=main` (or another branch) is present, shows the full diff overview.

### 1.2 Empty State

Shown when no comparison branch is selected (`?compare=` absent).

**Layout:**

- Centered content, vertically offset ~30% from top
- Icon or illustration (subtle, consistent with the app's dark aesthetic)
- Heading: "Compare Branches"
- Subtext: "Select a branch to see what changed"
- Branch selector dropdown (same style as the sidebar ComparisonSelector but larger/more prominent)
  - Lists all branches except the active one
  - Selecting a branch adds `?compare=branchName` to the URL
- Below the dropdown: brief description of what the diff overview shows

### 1.3 Active Diff View

Shown when `?compare=` is present and valid.

**Page Header:**

- Title: "Diff Overview"
- Subtitle: "Comparing **Staging** against **Production**" (active branch vs comparison branch)
- Metrics: total added, modified, removed (colored)

**Filter Bar:**

- Status filter chips: All, Added (green), Modified (blue), Removed (red)
- Clicking a chip filters the domain groups to only show items of that status
- Default: All

**Domain Groups:**

Each domain that has changes is shown as a collapsible section. Domains with no changes are hidden entirely. Order follows the sidebar nav order:

1. Journeys
2. API Map
3. Data Model
4. Relationships (ERD nodes/edges)
5. Lifecycles
6. Architecture
7. Features
8. Config

**Domain Group Header:**

- Domain name (e.g., "Data Model")
- Count badge: "1 added · 1 modified" (colored inline text)
- Expand/collapse toggle (default: expanded for domains with ≤10 changes, collapsed for >10)

**Change Items (within each domain group):**

Each changed item is a row with:

- Left border colored by status (added/modified/removed)
- DiffBadge pill (NEW / CHANGED / REMOVED)
- Item name (e.g., entity name, endpoint path, lifecycle name)
- For modified items: "N fields changed" count in muted text
- Click action: navigates to the item's page with `?compare=` preserved and `#hash` for deep-linking

**Item deep-link targets:**

| Domain        | Link Pattern                                                                                           | Hash             |
| ------------- | ------------------------------------------------------------------------------------------------------ | ---------------- |
| Entities      | `/[branch]/data-model?compare=[base]#[entity.name]`                                                    | Entity name      |
| API Endpoints | `/[branch]/api-map?compare=[base]#[endpoint-slug]`                                                     | method-path slug |
| Lifecycles    | `/[branch]/lifecycles?compare=[base]#` (list) or `/[branch]/lifecycles/[slug]?compare=[base]` (canvas) | —                |
| Architecture  | `/[branch]/architecture?compare=[base]#` (list) or `/[branch]/architecture/[slug]?compare=[base]`      | —                |
| Journeys      | `/[branch]/journeys/[domain]/[slug]?compare=[base]`                                                    | —                |
| Features      | `/[branch]/features/[domain]?compare=[base]`                                                           | —                |
| ERD Nodes     | `/[branch]/entity-relationships?compare=[base]`                                                        | —                |
| Config Enums  | `/[branch]/config?compare=[base]#[enum.slug]`                                                          | Enum slug        |

**Removed items:**

- Shown with ghosted styling (60% opacity, red left border)
- Not clickable (no page to link to on the current branch)
- Show the item name for reference

### 1.4 API Group Expansion

API groups have a two-level structure. In the overview, show:

- Group name as a sub-header within the API Map domain section
- Individual endpoint changes listed under each group
- Endpoint rows show: DiffBadge + `METHOD /path`

---

## 2. Toolbar Changes

### 2.1 Remove Dismiss Button

The `&times;` button is removed from the diff toolbar. Diff mode is exited only from the sidebar's ComparisonSelector dismiss button.

### 2.2 Counts Link to Overview

Each count in the toolbar becomes a clickable link:

- "3 added" → `/[branch]/diff?compare=[base]&status=added`
- "1 modified" → `/[branch]/diff?compare=[base]&status=modified`
- "0 removed" → `/[branch]/diff?compare=[base]&status=removed`

The `status` query param pre-selects the filter chip on the overview page. If omitted, "All" is selected.

The "Comparing against **Production**" label also links to the overview page (without status filter).

### 2.3 Toolbar Visible on Overview Page

The toolbar remains visible on the diff overview page too, consistent with all other pages. On the overview page, the counts are not links (since you're already on the overview).

---

## 3. Sidebar Navigation

### 3.1 Diff Overview Nav Item

Add a nav item in the sidebar that appears **only when diff mode is active**:

- Position: at the top of the nav content, above the "Dashboard" link
- Label: "Diff Overview"
- Icon: a diff-appropriate icon (e.g., `HiOutlineScale` or similar from react-icons)
- Active state: highlighted when on `/[branch]/diff`
- Styling: same as other nav items but with a subtle diff-colored accent

### 3.2 ComparisonSelector Remains

The ComparisonSelector in the sidebar's switcher section continues to work as-is. It's the only way to exit diff mode (dismiss button) or switch the comparison branch.

---

## 4. Navigation Flow

### Entering Diff Mode

**Path A (from sidebar):**

1. Click "Compare..." in the sidebar
2. Select a branch
3. URL gets `?compare=branchName` on the current page
4. Toolbar appears, current page shows diff overlay

**Path B (from diff overview page):**

1. Navigate to `/[branch]/diff` directly (e.g., from sidebar nav)
2. See empty state with branch selector
3. Select a branch
4. Overview page shows all changes

### Navigating During Diff Mode

- Clicking a change item on the overview → navigates to target page with `?compare=` preserved
- Clicking toolbar counts → navigates to overview page with status filter
- Regular sidebar navigation → preserves `?compare=` param (already works via URL)
- Deep-linked items show the expanded/highlighted row (existing deep-link system)

### Exiting Diff Mode

- Click X on the ComparisonSelector in the sidebar
- This removes `?compare=` from the URL
- Toolbar disappears, diff overlay deactivates on all pages
- Diff Overview nav item disappears from sidebar

---

## 5. Implementation Scope

### New Files

| File                                                                           | Purpose                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------ |
| `src/app/[branch]/diff/page.tsx`                                               | Page route for diff overview               |
| `src/features/diff-overview/diff-overview-view/index.tsx`                      | Main diff overview component               |
| `src/features/diff-overview/diff-overview-view/diff-overview-view.module.scss` | Styles                                     |
| `src/features/diff-overview/diff-empty-state/index.tsx`                        | Empty state with branch selector           |
| `src/features/diff-overview/diff-empty-state/diff-empty-state.module.scss`     | Styles                                     |
| `src/features/diff-overview/diff-domain-group/index.tsx`                       | Collapsible domain group with change items |
| `src/features/diff-overview/diff-domain-group/diff-domain-group.module.scss`   | Styles                                     |

### Modified Files

| File                                                          | Change                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/components/layout/diff-toolbar/index.tsx`                | Remove dismiss button, make counts into links, suppress links on overview page |
| `src/components/layout/diff-toolbar/diff-toolbar.module.scss` | Link styling for counts                                                        |
| `src/components/layout/sidebar/index.tsx`                     | Add conditional "Diff Overview" nav item when diff mode active                 |
| `src/hooks/use-diff-mode.ts`                                  | Possibly add helper for building diff-aware hrefs                              |

---

## 6. Deep-Link Helpers

To build consistent deep-link URLs that preserve the `?compare=` param:

```ts
function diffHref(
  branchPrefix: string,
  path: string,
  compareBranch: string,
  hash?: string,
): string {
  const url = `${branchPrefix}${path}?compare=${compareBranch}`;
  return hash ? `${url}#${hash}` : url;
}
```

Each domain's change items use a mapping function to produce the correct href:

```ts
const DOMAIN_LINK_BUILDERS: Record<
  string,
  (item: unknown, branchPrefix: string, compareBranch: string) => string
> = {
  entities: (item, bp, cb) => diffHref(bp, '/data-model', cb, (item as Entity).name),
  apiEndpoints: (item, bp, cb) => {
    const ep = item as ApiEndpoint;
    const slug = `${ep.method.toLowerCase()}-${ep.path.replace(/[^a-z0-9]+/gi, '-')}`;
    return diffHref(bp, '/api-map', cb, slug);
  },
  lifecycles: (item, bp, cb) => diffHref(bp, '/lifecycles', cb),
  archDiagrams: (item, bp, cb) => diffHref(bp, '/architecture', cb),
  journeys: (item, bp, cb) => {
    const j = item as Journey;
    return diffHref(bp, `/journeys/${j.domain}/${j.slug}`, cb);
  },
  configEnums: (item, bp, cb) => diffHref(bp, '/config', cb, (item as ConfigEnum).slug),
};
```
