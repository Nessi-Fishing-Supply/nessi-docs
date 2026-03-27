# Information Architecture Restructure — Feature Domains & Dashboard

**Date:** 2026-03-27
**Status:** Approved
**Scope:** Dashboard home page, feature domain pages, sidebar navigation, config/permissions merge, data transformer updates

---

## Problem

The current flat navigation treats 10 pages as equal weight: Journeys, API Map, Data Model, Relationships, Lifecycles, Coverage, Features, Permissions, Config, Changelog. But they aren't equal — the first five are system-level views that cut across the whole product, while Coverage, Features, and Permissions are feature-scoped and only make sense in context. The home page is a redirect to `/journeys` with no dashboard.

## Solution

Restructure the app into three tiers: a dashboard landing page, system-level views (unchanged), and feature domain pages that aggregate all scoped information (coverage, API endpoints, journeys, data model, changelog) into per-domain dashboards.

---

## Information Architecture

### Before (flat)

```
/ → redirect to /journeys
/journeys, /api-map, /data-model, /entity-relationships, /lifecycles
/coverage, /features, /permissions, /config, /changelog
```

### After (structured)

```
/ → Dashboard (metrics + changelog + feature domain grid)

System Views (unchanged):
  /journeys/**
  /api-map
  /data-model
  /entity-relationships
  /lifecycles/**

Feature Domains (new):
  /features/shops
  /features/listings
  /features/auth
  /features/cart
  /features/account
  /features/shopping
  /features/identity

Reference:
  /config (absorbs permissions/roles as a section)
  /changelog (full rollup, unchanged)

Removed as top-level routes:
  /coverage → widget on feature domain pages
  /features (flat list) → redirect to / or domain index grid
  /permissions → folded into /config as roles section
```

### Sidebar Navigation — Three Labeled Groups

```
Dashboard              (top, always visible)
─────────────────────
SYSTEM VIEWS
  Journeys
  API Map
  Data Model
  Relationships
  Lifecycles
─────────────────────
FEATURES
  Shops
  Listings
  Auth
  Cart
  Account
  Shopping
  Identity
─────────────────────
REFERENCE
  Config
  Changelog
```

Feature domain list is dynamic — derived from the data transformer's domain mapping. Section labels use the same uppercase muted style as existing sidebar patterns.

---

## Dashboard Page (`/`)

**Layout:** Two-column hero at top, feature domain grid below.

### Top-left: Build Progress + Metrics

- Aggregate progress bar showing built / in-progress / stubbed / planned proportions
- 2x2 metric card grid:
  - Journeys (count, "across N domains")
  - Endpoints (count, "documented")
  - Entities (count, "N relationships")
  - Lifecycles (count)
- All metrics computed in the data transformer from existing exports

### Top-right: Recent Changes

- Latest 5-8 changelog entries with type badges (added/changed/fixed/removed)
- Date stamps per entry
- "View all" link to `/changelog`

### Bottom: Feature Domain Grid

- Section label: "Feature Domains"
- Grid of domain tiles (responsive, ~3 columns)
- Each tile shows: domain name, feature count, endpoint count
- Click navigates to `/features/[domain]`
- Domain list is dynamic from data transformer

---

## Feature Domain Page (`/features/[domain]`)

**Layout:** Coverage hero, feature list (primary content), connections footer.

### Header

- Domain name (e.g., "Shops")
- Description from domain config
- Badge pills: feature count, endpoint count, journey count, entity count

### Coverage Hero

- Large build percentage with progress bar
- Status breakdown pills: N built, N in-progress, N stubbed, N planned
- Compact metric pills for endpoints, journeys, entities alongside progress bar

### Feature List (primary content)

- Accordion rows with stagger entry animation
- Each row: status dot (color-coded by built/in-progress/stubbed/planned), feature name, endpoint count, chevron
- Click to expand — expanded content shows:
  - Feature description
  - API endpoints with method badges (clickable deep-link to `/api-map#slug`)
  - Related entities (clickable deep-link to `/data-model#entity`)
  - Related journeys (clickable deep-link to `/journeys/domain/slug`)
  - Related lifecycles (clickable deep-link to `/lifecycles/slug`)
  - Scoped error cases if present
- Hash anchoring: `/features/shops#invites` auto-expands the row with border trace animation
- Deep-link target rows skip stagger delay (same pattern as Data Model and API Map)
- Hashchange listener for client-side navigation support
- Hash cleanup after scroll settles (prevents stale hash stacking)

### Bottom: Two-Column Footer

- Left: Recent Changes — changelog entries filtered by domain/area
- Right: Quick Links — aggregated deep-links to related journeys, entities, lifecycles for the entire domain

---

## Config Page Update

### Permissions Absorption

- New collapsible section at the top: "Roles & Permissions"
- Renders shop roles matrix (role cards + permission grid) inside the config accordion pattern
- Same visual treatment as existing enum blocks — consistent with the page
- Data source: existing `roles` export from data transformer

### Existing Content

- All enum reference blocks remain unchanged
- Accordion expand/collapse behavior unchanged

---

## Data Transformer Updates (`src/data/index.ts`)

### Domain Mapping Strategy

Feature-to-domain mapping is computed in the transformer, not stored in extracted JSON. This preserves the extraction boundary: `features.json` stays raw, the transformer handles view-layer grouping.

**Approach:** A `FEATURE_TO_DOMAIN` map that maps feature slugs to domain slugs. Explicit mapping, no inference. Features not in the map fall to a "general" bucket. When new features are extracted, they need a one-line addition to the map.

Domain slugs reuse the existing journey domain set: `auth`, `shopping`, `cart`, `account`, `shops`, `listings`, `identity`.

### New Exports

- `getFeatureDomains(): FeatureDomain[]` — list of domains with: slug, label, description, featureCount, endpointCount, journeyCount, entityCount, buildProgress (percentage)
- `getFeaturesByDomain(domain: string): Feature[]` — features scoped to a domain with computed relationships
- `getChangelogByDomain(domain: string): ChangelogEntry[]` — changelog entries filtered by area field matching the domain
- `getDashboardMetrics(): DashboardMetrics` — aggregate stats: total features, endpoints, journeys, entities, build percentages

### New Types

```typescript
interface FeatureDomain {
  slug: string;
  label: string;
  description: string;
  featureCount: number;
  endpointCount: number;
  journeyCount: number;
  entityCount: number;
  buildProgress: number; // 0-100
}

interface DashboardMetrics {
  totalFeatures: number;
  totalEndpoints: number;
  totalJourneys: number;
  totalEntities: number;
  totalLifecycles: number;
  builtCount: number;
  inProgressCount: number;
  stubbedCount: number;
  plannedCount: number;
}
```

---

## Routes Removed

| Route | Disposition |
|-------|-------------|
| `/coverage` | Deleted. Coverage is now a widget on each feature domain page. |
| `/features` (flat list) | Becomes redirect to `/` or a simple domain index grid. |
| `/permissions` | Deleted. Roles section absorbed into `/config`. |

---

## Implementation Sequence

1. **Data transformer** — add domain mapping, new exports, new types
2. **Dashboard page** (`/`) — replace redirect with dashboard component
3. **Feature domain pages** (`/features/[domain]`) — new dynamic route with accordion rows
4. **Config update** — add roles/permissions section
5. **Sidebar navigation** — restructure into three groups, dynamic feature list
6. **Route cleanup** — remove old routes, add redirects

---

## Design Patterns Reused

All new UI follows established patterns from Journeys, API Map, Data Model, Relationships, and Lifecycles:

- **Page headers** with metric badges (from Data Model, API Map)
- **Accordion rows** with stagger entry, deep-link hash anchoring, border trace animation (from Data Model, API Map)
- **Deep-link timing** — immediate expand, scroll at 100ms, hash cleanup at 600ms, highlight for 9.5s
- **Skip stagger for deep-link targets** — `--stagger: 0ms` on targeted rows
- **Cross-link pills** with method badges and external icons (from EntityTooltip)
- **Progress bars** with status color segments (from Coverage page, adapted)
- **Dark theme** with frosted glass effects, Nessi design tokens
- **Widget cards** with section labels, muted borders, subtle backgrounds
