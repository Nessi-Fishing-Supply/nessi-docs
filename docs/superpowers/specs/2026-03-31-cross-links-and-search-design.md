# Cross-Link Expansion & Search Redesign — Design Spec

> Designed collaboratively between Kyle Holloway and Claude on 2026-03-31.

---

## Goal

Expand the cross-linking system with Entity ↔ Lifecycle and Lifecycle ↔ Journey connections, and redesign the search dialog with a 3-column grouped layout, hover-scroll on truncated text, and recent searches.

---

## 1. Entity ↔ Lifecycle Cross-Links

### Matching Strategy

Build a computed index that maps entities to their lifecycle state machines. Match lifecycle `slug` to entity table `name` using pluralization + explicit aliases:

```
listing              → listings                (pluralize)
invite               → shop_invites            (alias)
flag                 → flags                   (pluralize)
member               → members                 (pluralize)
shop                 → shops                   (pluralize)
thread               → message_threads         (alias)
offer                → offers                  (pluralize)
subscription         → (no matching table yet)  (skip)
ownership_transfers  → shop_ownership_transfers (alias)
```

**Alias map:** A `LIFECYCLE_ENTITY_MAP` record explicitly maps each lifecycle slug to its entity table name. Simple pluralization handles most cases; aliases handle the rest (`invite` → `shop_invites`, `thread` → `message_threads`, `ownership_transfers` → `shop_ownership_transfers`). Lifecycles with no matching entity (e.g., `subscription`) are silently skipped. Add new entries when new lifecycles are extracted.

**Produces two maps:**
- `entityToLifecycle: Map<string, { slug: string; name: string }>` — table name → lifecycle ref
- `lifecycleToEntities: Map<string, string[]>` — lifecycle slug → table names

### Where Links Appear

**Data Model page (entity-list rows):**
- Entity rows that have a lifecycle show a small link after the badges: `Lifecycle: Listing →`
- Links to `/lifecycles/{slug}` (direct page navigation)
- Styled consistently with existing badge/link patterns in entity rows

**ERD entity tooltip:**
- New "Lifecycle" section in the tooltip (below existing "API Endpoints" section)
- Shows lifecycle name as a clickable link to `/lifecycles/{slug}`
- Uses existing `HoverLink` pattern from the tooltip

**Lifecycle list page:**
- Each lifecycle row shows "Table: `listings` →" linking to `/data-model#listings`
- Uses the existing deep-link hash pattern → expand row → highlight → scroll → fade

**Lifecycle canvas (header/breadcrumb area):**
- Breadcrumb already shows "Lifecycles > Listing Lifecycle"
- Add "Governs: `listings`" as a subtle link below the breadcrumb, linking to `/data-model#listings`

---

## 2. Lifecycle ↔ Journey Cross-Links

### Matching Strategy — Entity Overlap

Infer lifecycle-to-journey connections through the existing cross-link indexes:

1. Journey step has a `route` (e.g., `POST /api/listings`)
2. That route touches entities via `getTablesForEndpoint()` (e.g., `listings`)
3. That entity has a lifecycle via `entityToLifecycle` (e.g., `listing` lifecycle)
4. Therefore: this journey relates to the Listing Lifecycle

**Produces:**
- `lifecycleToJourneys: Map<string, { slug: string; domain: string; title: string }[]>` — lifecycle slug → journeys that interact with its governed entities
- `journeyToLifecycles: Map<string, { slug: string; name: string }[]>` — journey slug → lifecycles its steps affect

### Where Links Appear

**Lifecycle list page:**
- Each lifecycle row shows "Related Journeys:" with linked journey titles
- Links to `/journeys/{domain}/{slug}` (direct navigation)
- Show max 3 journeys, with "+N more" if overflow

**Lifecycle canvas header:**
- "Used in N journeys" as a subtle indicator (not a link — journeys are multiple targets)

**Journey step tooltip (node-tooltip.tsx):**
- If the step's endpoint touches a lifecycle-governed entity, add a "Lifecycle" section
- Shows "Affects: Listing Lifecycle →" linking to `/lifecycles/listing`
- Only shown when the connection exists (many steps won't have one)

---

## 3. Data Layer

### New file: `src/data/cross-links-lifecycle.ts`

Keeps lifecycle cross-link logic separate from the existing entity-endpoint cross-links. Exports:

```typescript
// Lifecycle ↔ Entity
export function getLifecycleForEntity(tableName: string): { slug: string; name: string } | null;
export function getEntitiesForLifecycle(lifecycleSlug: string): string[];

// Lifecycle ↔ Journey
export function getJourneysForLifecycle(lifecycleSlug: string): { slug: string; domain: string; title: string }[];
export function getLifecyclesForJourney(journeySlug: string): { slug: string; name: string }[];
export function getLifecyclesForRoute(route: string): { slug: string; name: string }[];
```

**Index building:** Computed at module scope (same pattern as `cross-links.ts`). Imports from `src/data/index.ts` for lifecycles, journeys, and from `src/data/cross-links.ts` for `getTablesForEndpoint`.

### Re-exports from `src/data/index.ts`

Add re-exports so consumers can import from `@/data`:

```typescript
export {
  getLifecycleForEntity,
  getEntitiesForLifecycle,
  getJourneysForLifecycle,
  getLifecyclesForJourney,
  getLifecyclesForRoute,
} from './cross-links-lifecycle';
```

---

## 4. Search Redesign

### Layout Changes

- **Dialog width:** Increase from ~480px to ~720px
- **Results layout:** 3-column CSS grid (`grid-template-columns: 1fr 1fr 1fr; gap: 14px`)
- **Category assignment:** Categories fill columns using balanced height — assign each category to the shortest column to minimize vertical imbalance
- **Category order:** Journeys, Endpoints, Entities, Lifecycles, Features, Architecture, Config
- **Max results per category:** 5 (with header showing total if more exist, e.g., "Endpoints (12)")
- **Empty categories:** Hidden entirely
- **Category headers:** Colored uppercase label matching the existing canvas/badge colors per domain

### Search Algorithm

Keep the existing scoring algorithm unchanged. After scoring, group results by `type` field and distribute into columns.

### Hover-Scroll on Truncated Text

When text is truncated with ellipsis and the user hovers:

1. Check if `element.scrollWidth > element.clientWidth` (text is actually truncated)
2. If yes, add a CSS class that triggers a `translateX` animation
3. Animation speed: proportional to overflow amount (~50px/s), so short overflows are quick and long strings take longer
4. Animation: pause 300ms → scroll left to show full text → pause 500ms at end → reset to start
5. On mouse leave: cancel animation, reset to start position

**Implementation:** A `useOverflowScroll` hook or a small `OverflowText` wrapper component. Applied to result title and subtitle elements.

### Recent Searches

- **Storage:** `localStorage` key `nessi-docs:recent-searches`, JSON array of strings
- **Max entries:** 8
- **Display:** When search input is empty, show recent searches instead of hint categories
- **Interactions:** Click to re-run query, small `×` to remove individual entries, "Clear all" link
- **Deduplication:** New searches push to front, duplicates removed

### Keyboard Navigation

Flatten all visible results into a single linear sequence (left-to-right, top-to-bottom across columns). Arrow up/down navigates linearly. Enter navigates to selected result. Escape closes dialog. No column-aware tabbing — keep it simple.

---

## 5. Out of Scope

- Config ↔ Entity cross-links (data not available in extracted JSON)
- Backend/persistence infrastructure
- Search API or server-side search
- Cross-links from Architecture nodes to other pages (architecture node metadata doesn't currently reference features/endpoints)

---

## 6. Files Summary

### New files
| File | Responsibility |
|------|---------------|
| `src/data/cross-links-lifecycle.ts` | Lifecycle ↔ Entity and Lifecycle ↔ Journey computed indexes |

### Modified files
| File | Changes |
|------|---------|
| `src/data/index.ts` | Re-export lifecycle cross-link functions |
| `src/features/data-model/entity-list/index.tsx` | Add lifecycle link to entity rows |
| `src/features/canvas/components/entity-tooltip.tsx` | Add lifecycle section to ERD tooltip |
| `src/features/canvas/components/node-tooltip.tsx` | Add lifecycle section to journey step tooltip |
| `src/features/lifecycles/lifecycle-list/index.tsx` | Add entity + journey links to lifecycle rows |
| `src/app/lifecycles/[slug]/client.tsx` | Add "Governs" entity link in canvas header |
| `src/features/search/search-index.ts` | Add grouped-by-category export |
| `src/features/search/search-dialog/index.tsx` | 3-column layout, recent searches, hover-scroll |
| `src/features/search/search-dialog/search-dialog.module.scss` | Updated styles for 3-column grid, hover-scroll animation |
