# Journey Domain Tiles — Design Spec

**Date:** 2026-03-26
**Status:** Approved
**Scope:** Replace flat journey sidebar list with domain-grouped tile navigation

---

## Problem

The journeys section has a flat sidebar list of 29+ journeys that's hard to scan, provides no grouping context, and will only get worse as more journeys are added. The persona-colored dots next to each name are meaningless without a legend.

## Solution

Three-level navigation replacing the flat list:

1. **Domain Grid** (`/journeys`) — card tiles grouped by feature domain
2. **Journey List** (`/journeys/[domain]`) — domain header + compact journey rows
3. **Canvas** (`/journeys/[domain]/[slug]`) — existing journey canvas with breadcrumb

Sidebar journey subnav is removed entirely. "Journeys" becomes a single nav item linking to the domain grid.

---

## Data Changes

### New `domain` field on journey schema

Add to `schema.json` in nessi-web-app and to the `Journey` type in nessi-docs:

```typescript
domain: 'auth' | 'shopping' | 'cart' | 'account' | 'shops' | 'listings' | 'identity'
```

Each journey gets an explicit domain tag. The domain is the grouping key for tiles and routing.

### Domain configuration

A static config object in nessi-docs maps domain slugs to display metadata:

```typescript
interface DomainConfig {
  slug: string;
  label: string;          // "Authentication", "Cart & Checkout"
  description: string;    // One-line summary of what's in this domain
  order: number;          // Sort order for the grid
}
```

Defined in `src/constants/domains.ts`. Not in the journey data — this is renderer-side display config.

### Domain assignments

| Domain | Slug | Journeys |
|--------|------|----------|
| Authentication | `auth` | signup, login, logout, password-reset, email-change, route-protection |
| Shopping | `shopping` | guest-browse, buyer-search, buyer-recently-viewed, guest-recently-viewed |
| Cart & Checkout | `cart` | guest-cart, buyer-cart, buyer-checkout |
| Account | `account` | account-settings, buyer-addresses, account-deletion, onboarding, seller-toggle |
| Shops | `shops` | shop-create, shop-settings, shop-roles, shop-invite-acceptance, shop-member-journey, shop-member-management, shop-ownership-transfer |
| Listings | `listings` | seller-listings, seller-social-sharing |
| Identity | `identity` | context-switching, seller-context |

---

## Route Structure

| Route | View | Component |
|-------|------|-----------|
| `/journeys` | Domain grid | `DomainGrid` |
| `/journeys/[domain]` | Journey list within domain | `DomainJourneyList` |
| `/journeys/[domain]/[slug]` | Journey canvas | Existing `JourneyPageClient` |

The old `/journeys/[slug]` route is replaced by `/journeys/[domain]/[slug]`. Redirect old URLs if needed.

---

## Components

### `DomainGrid` (new)

**Location:** `src/features/journeys/domain-grid/`

Renders a 3-column CSS grid of domain cards. Each card shows:
- Domain name (DM Serif Display, 14px)
- Journey count (monospace, top-right)
- Description (muted, 11px)
- Stats: total steps, total decisions (monospace, 10px)
- Build coverage percentage + thin 2px progress bar
- Coverage color: green (>75%), orange (50-75%), muted (<50%)

Card styling matches existing app aesthetic:
- Background: `rgba(15,19,25,0.6)` with `backdrop-filter: blur(8px)`
- Border: `1px solid var(--border-subtle)`
- Radius: 8px
- Hover: border brightens to `var(--border-medium)`, subtle transition

Cards link to `/journeys/[domain]`.

Stats are computed at build time from journey data (step count, decision count, coverage %).

**Animations:**
- Cards stagger-enter on page load (opacity + translateY, 50ms delay between cards)
- Hover: border brightens, subtle scale lift (`transform: scale(1.01)`), box-shadow deepens — all with 200ms ease-out transitions
- Progress bar fills animate on enter (width transition from 0%)
- Journey rows in the domain list also stagger-enter
- Breadcrumb segments fade in on navigation
- All transitions use the existing `--ease-out` / `--transition-fast` tokens

### `DomainJourneyList` (new)

**Location:** `src/features/journeys/domain-journey-list/`

Two sections:

**Domain header:**
- Domain name (DM Serif Display, 18px)
- Description (muted)
- Aggregate stats (journey count, step count, coverage %)
- Bottom border separator

**Journey rows:**
- Each row: title, description, persona badge, step count, coverage bar, chevron
- Rows link to `/journeys/[domain]/[slug]`
- Hover: subtle background change
- Row styling: 6px radius, `rgba(255,255,255,0.02)` background, 1px gap

### `Breadcrumb` (new)

**Location:** `src/components/ui/breadcrumb/`

Renders breadcrumb navigation above the content:
- Domain list: `Journeys`
- Journey list: `Journeys › Authentication`
- Canvas: `Journeys › Authentication › Login`

Each segment except the last is a clickable link (primary color). Last segment is muted text. Separator is `›`.

Rendered inside the main content area, not the topbar. Appears on domain list and canvas pages. On the domain grid itself, no breadcrumb (it's the root).

### Sidebar changes

Remove the journey subnav from the sidebar. The "Journeys" nav item links to `/journeys` (domain grid). No expandable sub-items.

---

## Data Flow

1. **Build time:** `src/data/index.ts` groups journeys by `domain` field
2. **New exports:**
   - `getDomains()` — returns domain configs with computed stats
   - `getJourneysByDomain(domain)` — returns journeys for a domain
   - `getJourney(domain, slug)` — returns a specific journey
3. **Domain grid page** calls `getDomains()` for tile data
4. **Journey list page** calls `getJourneysByDomain(domain)` for rows
5. **Canvas page** calls `getJourney(domain, slug)` — same data, new lookup path

All computed at build time via `generateStaticParams`. No runtime data fetching.

---

## Static Generation

```typescript
// /journeys/[domain]/page.tsx
export function generateStaticParams() {
  return getDomains().map(d => ({ domain: d.slug }));
}

// /journeys/[domain]/[slug]/page.tsx
export function generateStaticParams() {
  return getDomains().flatMap(d =>
    getJourneysByDomain(d.slug).map(j => ({ domain: d.slug, slug: j.slug }))
  );
}
```

---

## What Doesn't Change

- Journey canvas component — renders exactly as-is
- Canvas toolbar, legend, minimap — unchanged
- Node components, tooltips, trace mode — unchanged
- Detail panel behavior — stays hidden on journey pages
- All other pages (API map, data model, etc.) — unchanged
- Sidebar structure for non-journey pages — unchanged

---

## Migration Notes

- Old `/journeys/[slug]` URLs will break. Add a catch-all redirect that looks up the journey's domain and redirects to `/journeys/[domain]/[slug]`.
- The `domain` field must be added to every journey JSON in nessi-web-app before this ships.
- The data sync pipeline (GitHub Action) doesn't need changes — it copies JSON as-is. The domain field flows through automatically.
