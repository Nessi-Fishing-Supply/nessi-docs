# API Map Redesign

> Redesign the API Map page from a basic grouped list into a polished, Swagger-inspired API explorer with the same design quality as the journey canvas.

## Decisions Made

- **Structure**: Grouped list with inline expand (Swagger-style), no inner sidebar or separate detail pane
- **Filtering**: Group chips + method chips in a filter bar (toggleable, like journey canvas toolbar)
- **Search**: Deferred — 61 endpoints is scannable with filters alone; app-wide search is a separate initiative
- **Detail panel**: Hidden on the API Map page (same pattern as journey canvas)
- **Page header**: New shared `PageHeader` component with gradient glow card — replaces ad-hoc headers on all pages
- **Cross-linking**: Journey tooltips deep-link to endpoints (auto-expand + highlight animation); endpoint journey chips link back to canvas

## Architecture

### New Shared Component: `PageHeader`

**Location**: `src/components/ui/page-header/`

**Props**:

```ts
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string; // e.g. "v1" — shown next to title
  metrics?: Array<{
    value: number | string;
    label: string;
  }>;
  children?: React.ReactNode; // optional slot for page-specific controls below the header
}
```

**Visual design**: Gradient glow card

- Background: `linear-gradient(135deg, rgba(30,74,64,0.08) 0%, rgba(15,19,25,0.4) 60%, rgba(226,119,57,0.03) 100%)`
- Top-left radial glow: `radial-gradient(circle, rgba(61,140,117,0.12) 0%, transparent 70%)`
- Border: `1px solid rgba(61,140,117,0.1)`
- Border-radius: `10px`
- Title: DM Serif Display, 20px
- Badge: DM Mono, 9px, green-tinted pill
- Subtitle: 12px, muted text
- Stats: DM Mono bold numerals + label text, flex row with 16px gap

**Adoption**: Replace the inline header/title/subtitle pattern in every feature component:

- `ApiList` — "API Map" / 61 endpoints / 8 groups
- `DomainGrid` — "Journeys" / N domains / N journeys
- `EntityList` — "Data Model" / N tables
- `FeatureList` — "Feature Readiness" / N features / N components / N endpoints
- `PermissionsMatrix` — "Permissions Matrix" / N roles / N features
- `ConfigList` — "Config Reference" / N enums / N values
- `CoverageList` — "Journey Coverage" / N journeys
- `ChangelogFeed` — "Changelog" / N changes / N releases

### Redesigned API Map Page

**File changes**:

- `src/features/api-map/api-list/index.tsx` — rewrite
- `src/features/api-map/api-list/api-list.module.scss` — rewrite
- `src/app/api-map/page.tsx` — minor update (pass `hideDetailPanel` or equivalent)
- `src/components/layout/detail-panel/panels/api-panel.tsx` — can be removed or kept for backward compat
- `src/types/api-contract.ts` — no changes needed (existing type covers all data)

**Layout (top to bottom)**:

1. `<PageHeader>` — "API Map", subtitle, metrics (61 endpoints, 8 groups)
2. **Filter bar** — uses `position: sticky; top: 0` within the scrollable main area so it stays visible as the user scrolls through endpoints
3. **Endpoint list** — groups as dividers, endpoint rows, inline expand

### Filter Bar

**Group chips**: One chip per group, plus "All". Multi-select toggle. Active state uses green tint matching journey canvas filter pattern. Each chip shows group name + count.

**Method chips**: GET, POST, PUT, PATCH, DELETE. Multi-select toggle. Each uses its method color (same palette as journey canvas layers). A divider separates group chips from method chips.

**Behavior**: Filters are additive — selecting "Auth" + "Cart" shows both groups. Selecting "GET" + "POST" shows only those methods within the visible groups. "All" is a convenience toggle that selects/deselects all groups.

### Endpoint Row (Collapsed)

Each row displays:

- **Method badge**: Color-coded pill (GET=teal, POST=orange, PUT=brown, PATCH=light-orange, DELETE=red) — same colors as `src/constants/colors.ts`
- **Path**: Monospace, params highlighted in green (e.g. `:id` in teal)
- **Right-aligned meta** (flex, auto margin-left):
  - Auth badge: "user" (muted) or "admin" (purple, matching decision-node color)
  - Tag pills: e.g. "admin-only" in subtle bordered pill
  - Error count badge: red dot + count (same pattern as journey step error badges) — only shown when errors > 0
  - Chevron: rotates 90deg on expand

**Hover**: Subtle background lighten + border appear (150ms ease-out)

### Endpoint Detail (Expanded)

Slides open below the row with a connected border (top-rounded row, bottom-rounded detail). Uses a two-column grid:

**Left column**:

- **Request Body** (if `requestFields.length > 0`): Table with field name (mono), type (muted mono), required badge (orange)
- **Error Cases** (from journey cross-link data): Each case shows HTTP badge (red pill) + condition + result text

**Right column**:

- **Responses**: Status code pills — 200 green, 4xx/5xx red. Codes sourced from `endpoint.errorCodes` array + always-present 200
- **Authentication**: Auth level with colored dot (user=muted, admin=purple)
- **Used in Journeys**: Journey chips with green dot, linking to `/journeys/[slug]?node=[id]`

**If no request fields**: Single column layout, no empty left column.

### Group Dividers

Lightweight visual separators between groups:

- Group name (11px, 600 weight, secondary text color)
- Horizontal line (flex: 1, subtle border color)
- Endpoint count pill (9px, muted background)

No click behavior — these are pure visual structure.

### Cross-Linking

**Inbound (journey canvas → API Map)**:

- Journey step tooltips and detail panel show endpoint paths as clickable links
- Link format: `/api-map#[endpoint-slug]`
- On arrival: auto-expand the target endpoint row, smooth scroll to it, apply a glow highlight animation (same radial gradient glow as journey node selection, using the endpoint's method color, 2s fade-out)

**Outbound (API Map → journey canvas)**:

- Journey chips in expanded endpoint detail link to `/journeys/[slug]?node=[nodeId]`
- Existing `getLinksForEndpoint()` already provides `href` with node targeting
- Canvas already handles `?node=` param for auto-selection

**Highlight animation on deep-link arrival**:

- Endpoint row gets a temporary glow: `box-shadow: 0 0 20px rgba(method-color, 0.15)` + elevated border opacity
- Glow pulses once (like journey node `glow-pulse`) then fades to normal over 2s
- Implemented via CSS animation class added on mount, removed after animation ends

### Detail Panel Hiding

The `AppShell` already supports hiding the detail panel (the journey canvas does this). The API Map page signals that it doesn't need the panel. When hidden:

- Grid goes from `220px 1fr 280px` to `220px 1fr`
- Smooth transition on the grid columns (same 250ms cubic-bezier as existing)

### Animations

Pulling from the journey canvas design language:

- **Filter chip toggle**: 150ms ease-out on background/border/color
- **Endpoint row hover**: 150ms ease-out background + border
- **Expand/collapse**: 300ms ease-out on height (CSS `grid-template-rows: 0fr` → `1fr` pattern for smooth height animation), opacity fade on inner content
- **Staggered row entry on filter change**: When filters change and the list re-renders, rows enter with 20ms stagger (opacity 0→1, translateY 6px→0, 200ms ease-out) — same technique as journey canvas node entry
- **Deep-link glow**: Method-colored radial gradient glow, 2s total (0.5s hold, 1.5s fade), applied via temporary CSS class
- **Chevron rotation**: 200ms ease-out transform rotate

### Color Palette (from existing design tokens)

| Element          | Color                   | Source                       |
| ---------------- | ----------------------- | ---------------------------- |
| GET badge        | `#3d8c75`               | `src/constants/colors.ts`    |
| POST badge       | `#e27739`               | same                         |
| PUT badge        | `#b86e0a`               | same                         |
| PATCH badge      | `#e89048`               | same                         |
| DELETE badge     | `#b84040`               | same                         |
| Admin auth       | `#a78bfa`               | Decision node purple         |
| User auth        | `#6a6860`               | Muted text                   |
| Journey chip     | `#3d8c75`               | Primary green                |
| Error badge      | `#b84040`               | Destructive red              |
| Page header glow | `rgba(61,140,117,0.12)` | Primary green at low opacity |

## Data Flow

No changes to the data layer. The existing pipeline provides everything needed:

```
api-contracts.json (raw, from extractor)
  → src/data/index.ts (imports + casts to ApiGroup[])
  → apiGroups export
  → ApiList component (receives as prop)

Cross-link data:
  → getLinksForEndpoint(method, path) → CrossLink[]
  → getErrorsForEndpoint(method, path) → ErrorCase[]
  (Both scan all journeys, already implemented)
```

## Files to Create

| File                                                    | Purpose                     |
| ------------------------------------------------------- | --------------------------- |
| `src/components/ui/page-header/index.tsx`               | Shared PageHeader component |
| `src/components/ui/page-header/page-header.module.scss` | PageHeader styles           |

## Files to Modify

| File                                                    | Change                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/features/api-map/api-list/index.tsx`               | Rewrite — new filter bar, endpoint rows, inline expand, remove old header/TOC |
| `src/features/api-map/api-list/api-list.module.scss`    | Rewrite — all new styles matching canvas design language                      |
| `src/app/api-map/page.tsx`                              | Use PageHeader, signal detail panel hide                                      |
| `src/features/journeys/domain-grid/index.tsx`           | Replace inline header with PageHeader                                         |
| `src/features/data-model/entity-list/index.tsx`         | Replace inline header with PageHeader                                         |
| `src/features/feature-readiness/feature-list/index.tsx` | Replace inline header with PageHeader                                         |
| `src/features/permissions/permissions-matrix/index.tsx` | Replace inline header with PageHeader                                         |
| `src/features/config/config-list/index.tsx`             | Replace inline header with PageHeader                                         |
| `src/features/coverage/coverage-list/index.tsx`         | Replace inline header with PageHeader                                         |
| `src/features/changelog/changelog-feed/index.tsx`       | Replace inline header with PageHeader                                         |

## Files to Remove

| File                                                      | Reason                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/components/layout/detail-panel/panels/api-panel.tsx` | No longer needed — detail panel hidden on API Map, all info lives inline |

## Out of Scope

- App-wide search — separate initiative
- Changes to the journey canvas itself (cross-link targets already work)
- New data extraction — existing `api-contracts.json` fields are sufficient
- Response body schemas — not in the current data, would require extractor changes
- API versioning UI — only v1 exists
