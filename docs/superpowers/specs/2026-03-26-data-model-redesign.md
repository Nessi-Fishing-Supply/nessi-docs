# Data Model Page Redesign

> Redesign the Data Model page to remove the detail panel, enrich the data layer with full
> database metadata, and render entity details inline using a width-efficient 60/40 split layout
> consistent with the approved API Map page patterns.

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Detail panel | Remove | Duplicates expanded row content; not useful for this page |
| Expansion layout | 60/40 split (Option B) | Fields left, meta right — best horizontal space usage |
| Empty meta behavior | Collapse gracefully | Field table goes full width when no RLS/triggers/indexes |
| Group dividers | Match API Map style | `Name ─── count` line-through pattern |
| Filter bar | Category chips only | 13 tables doesn't need a second filter axis |
| ERD page | Separate top-level route | Not nested under `/data-model`; cross-linked from FK refs |
| Row header info | Name, category, RLS/Trigger badges, FK count, field count, chevron | Dense but scannable |

---

## 1. Structural Changes

### Remove Detail Panel

- Remove `/data-model` from `DETAIL_PANEL_PAGES` in `src/components/layout/app-shell/index.tsx`
- Remove `setSelectedItem({ type: 'entity' })` call from entity list component
- The `EntityPanel` in `src/components/layout/detail-panel/panels/entity-panel.tsx` remains for now
  (search results still link to entities and may use the panel in the future)
- Main content area gets full width (minus sidebar)

### Promote ERD to Top-Level Route

- Move `/data-model/erd` to `/entity-relationships` (new top-level sidebar nav item)
- Update the "View Entity Relationships" link in the data model page header
- Update sidebar navigation config to add the new route
- ERD page redesign is a separate future spec; this spec only moves the route and adds
  the cross-link query param pattern (`?focus=<entity-name>`)

---

## 2. Data Layer Enrichment

### Expand Types

Update `src/types/data-model.ts`:

```typescript
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
  badge?: string;       // category (assigned by ENTITY_CATEGORY_MAP)
  badges?: string[];    // entity-level badges from JSON (e.g. "RLS", "Triggers")
  why?: string;
  fields: EntityField[];
  rlsPolicies?: RlsPolicy[];
  indexes?: TableIndex[];
  triggers?: TableTrigger[];
}
```

### Update Transform

In `src/data/index.ts`, the `transformEntities` function passes through all fields from the
JSON instead of discarding them. The only addition remains the `badge` (category) assignment
from `ENTITY_CATEGORY_MAP`.

---

## 3. Filter Bar

Single-axis category filter, matching API Map's filter chip pattern.

### Layout
- Horizontal flex row with wrapping, 6px gap
- Label: "Category" in 11px uppercase muted text
- "All" chip with total table count
- One chip per category with table count

### Behavior
- All categories active by default ("All" chip highlighted)
- Clicking a category chip when all are active → show only that category
- Clicking additional chips → additive selection
- If all deselected → revert to all active
- Chip styles: inactive = subtle glass bg; active = green-tinted bg with green text

### Empty State
- "No tables match the current filters." centered, dim text (same as API Map)

---

## 4. Group Dividers

Match API Map's line-through pattern:

```
Category Name ─────────────────── 4
```

- Group name: 13px, weight 600, primary text
- Horizontal line: flex 1, 1px, `--border-subtle`
- Count: 11px mono, muted, pill background `rgb(255 255 255 / 5%)`

---

## 5. Entity Row (Collapsed)

### Layout
Left to right in a flex row:

| Element | Style | Condition |
|---------|-------|-----------|
| Entity name | 13px mono, green (#3d8c75), weight 600 | Always |
| Category badge | 9px uppercase pill, muted bg, dim text | Always |
| RLS badge | 9px pill, green bg/text | Only if `rlsPolicies.length > 0` |
| Triggers badge | 9px pill, orange bg/text | Only if `triggers.length > 0` |
| FK count | 10px mono, muted, e.g. "3 FK" | Only if FK count > 0 |
| Field count | 10px mono, muted, e.g. "11 fields" | Always |
| Chevron | 10px, rotates 90deg when open | Always |

Badges and counts are in a right-aligned meta group with `margin-left: auto`.

### Row Styling
- Border: 1px solid transparent (default), subtle on hover
- Background: transparent (default), green-tinted when open
- Border when open: green-tinted
- Staggered entry animation: `rowEnter 200ms ease-out` with `--stagger` CSS variable
  (20ms increment per row)
- Hover: `rgb(255 255 255 / 2%)` background

---

## 6. Entity Row (Expanded)

### Container
- Background: `rgb(15 19 25 / 50%)`
- Border-top: `1px solid rgb(61 140 117 / 10%)`
- Border-radius: `0 0 8px 8px`

### Layout: Adaptive Split
- **Has meta sections** (any of: RLS, triggers, indexes): 60/40 grid split
  - Left: field table, right: meta sections stacked
  - Vertical divider: 1px solid `--border-subtle`
- **No meta sections**: field table at full width, no split

### Left Column — Field Table

Full `<table>` element:

| Column | Width | Content |
|--------|-------|---------|
| Column | 150px | Field name in mono + inline PK/FK/null tags |
| Type | 80px | Type in mono, muted |
| Default | 120px | Default value in dim mono, or empty |
| (ref) | flex | FK reference annotation if applicable |

**Inline field tags:**
- `PK` — green bg, green text, 8px uppercase
- `FK` — purple bg, purple text, 8px uppercase
- `null` — dim glass bg, dim text, 8px uppercase (only shown if `nullable: true`)

**FK reference annotation:**
- Shown on FK fields: `→ members.id CASCADE`
- Purple mono, 9px, displayed in the rightmost column
- Clickable — for now, scrolls to + expands + highlights the target entity on the same page
  (deep-link pattern matching API Map). Future: links to `/entity-relationships?focus=<table>`

**Table header:** Sticky, 9px uppercase, dim text, border-bottom medium.

### Right Column — Meta Sections

Stacked vertically with 14px gap. Each section has a `SECTION LABEL` (10px uppercase, muted,
weight 600) followed by compact rows.

**RLS Policies:**
- Row: operation badge + policy name
- Operation badge: mono 9px, green bg, green text, min-width 48px centered
  (SELECT, INSERT, UPDATE, DELETE)
- Policy name: 10px, secondary text
- Row bg: `rgb(255 255 255 / 2%)`, 4px radius, 5px 8px padding

**Triggers:**
- Row: event badge + trigger name + function name (right-aligned)
- Event badge: mono 9px, orange bg, orange text
- Trigger name: 10px, secondary text
- Function name: mono 9px, dim text, `margin-left: auto`
- Same row styling as RLS

**Indexes:**
- Row: column names in mono + unique badge if applicable
- Column names: 10px mono, secondary text
- Unique badge: green bg, green text, 8px uppercase "UNIQUE"
- Same row styling as RLS

---

## 7. Cross-Link Patterns

### FK → Same Page (immediate)
Clicking a FK reference (e.g. `→ members.id`) on the entity list:
1. Scrolls to the target entity row
2. Expands it if collapsed
3. Applies a 2-second highlight glow animation (matching API Map's `deepLinkGlow` keyframes)

Implementation: hash-based deep linking (`#members`) with the same `useEffect` pattern
used by API Map's `EndpointRow`.

### FK → ERD Page (future)
Add a small icon/link next to FK references that navigates to
`/entity-relationships?focus=<table>`. The ERD page will read the query param and
center + highlight the target node. This is noted here for interface planning but
the ERD page changes are a separate spec.

### Header Link
The PageHeader keeps a link to the ERD page, updated from `/data-model/erd` to
`/entity-relationships`.

---

## 8. Animation & Polish

- **Staggered row entry**: `rowEnter` keyframes (opacity 0→1, translateY 6px→0),
  200ms ease-out, 20ms stagger per row via `--stagger` CSS variable
- **Expand/collapse**: Expansion area appears immediately (no height animation — matches
  API Map behavior)
- **Deep-link glow**: 2s ease-out animation on border-color and box-shadow when navigating
  to an entity via FK link or URL hash
- **Hover states**: Row border subtly strengthens; row header background lightens
- **Chevron rotation**: 200ms ease-out transform on expand

---

## 9. Files Changed

| File | Change |
|------|--------|
| `src/types/data-model.ts` | Expand types with FK refs, RLS, indexes, triggers |
| `src/data/index.ts` | Update transform to pass through all JSON fields |
| `src/features/data-model/entity-list/index.tsx` | Full rewrite — filter bar, new row layout, inline expansion |
| `src/features/data-model/entity-list/entity-list.module.scss` | Full rewrite — new styles |
| `src/components/layout/app-shell/index.tsx` | Remove `/data-model` from `DETAIL_PANEL_PAGES` |
| `src/app/data-model/page.tsx` | Pass additional data props if needed |
| `src/app/entity-relationships/page.tsx` | New route (move from `src/app/data-model/erd/`) |
| Sidebar nav config | Add `/entity-relationships` route, remove `/data-model/erd` |

---

## 10. Out of Scope

- ERD page redesign (separate spec — only route move + query param support here)
- Entity detail panel removal from `docs-context.ts` types (keep for search compatibility)
- Mobile responsive layout for expansion (desktop-first, same as rest of app)
