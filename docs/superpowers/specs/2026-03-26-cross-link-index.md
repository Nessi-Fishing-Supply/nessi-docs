# Cross-Link Index

> A computed index that derives relationships between tables, API endpoints, journeys,
> and other data domains — enabling automatic deep-linking across all pages.

## Problem

Pages need to cross-link to each other (e.g. RLS policies → API Map, FK refs → Data Model,
endpoints → Journeys). Manual mappings don't scale as new data is added.

## Solution

A module (`src/data/cross-links.ts`) that computes bidirectional indexes from existing data
at import time (build time for SSG). Any page can import lookup functions to get cross-links.

## Matching Algorithm: Endpoint ↔ Table

API paths and table names share vocabulary. The algorithm extracts "resource segments" from
endpoint paths and matches them against table names.

**Step 1: Extract resource segments from path**

Strip `/api/` prefix, remove param segments (`:id`, `:slug`, etc.), normalize kebab-case
to snake_case.

```
/api/shops/:id/members/:memberId/role → ["shops", "members", "role"]
/api/cart/:id                         → ["cart"]
/api/recently-viewed                  → ["recently_viewed"]
/api/listings/:id/view                → ["listings", "view"]
```

**Step 2: Match segments against table names**

For each endpoint, try these strategies (first match wins per table):

1. **Leaf match**: The last resource segment matches a table name directly or with
   plural normalization (`addresses` = `addresses`, `cart` ≈ `cart_items`)
2. **Compound match**: Singularize a parent segment + `_` + child segment matches a table
   (`shops` + `members` → `shop_members`, `shops` + `invites` → `shop_invites`)
3. **Action segments ignored**: Terminal segments that are verbs/actions (`merge`, `validate`,
   `search`, `count`, `check`, `view`, `duplicate`, `accept`) don't affect the table match —
   they indicate the operation on the matched resource

**Plural/singular normalization**: Simple `s` suffix stripping. `shops` → `shop`,
`addresses` → `address`. Edge cases handled by also checking without normalization.

**Expected mappings from current data:**

| API Group | Path Pattern | Matched Table(s) |
|-----------|-------------|-------------------|
| Addresses | /api/addresses/* | addresses |
| Auth | /api/auth/* | members |
| Cart | /api/cart/* | cart_items |
| Invites | /api/invites/* | shop_invites |
| Listings | /api/listings/* | listings |
| Listings | /api/listings/*/upload* | listing_photos |
| Members | /api/members/* | members |
| Recently Viewed | /api/recently-viewed/* | recently_viewed |
| Shops | /api/shops/* | shops |
| Shops | /api/shops/*/invites/* | shop_invites |
| Shops | /api/shops/*/members/* | shop_members |
| Shops | /api/shops/*/roles | shop_roles |
| Shops | /api/shops/*/ownership* | shop_ownership_transfers |

Auth → members is a special case (auth endpoints are about member authentication).
This can be handled with a small override map for cases where the path vocabulary
doesn't match the table name at all.

## Data Structures

```typescript
export interface EndpointRef {
  method: string;
  path: string;
  group: string;
  anchor: string;  // e.g. "get-api-cart" for deep-link to API Map
}

export interface TableRef {
  name: string;
  label: string;
  badge: string;   // category badge
}

export function getEndpointsForTable(tableName: string): EndpointRef[];
export function getTablesForEndpoint(method: string, path: string): TableRef[];
```

Anchors use the same slug format as API Map: `method-path` lowercased, non-alphanumeric
replaced with hyphens (matching the `slug` computation in `EndpointRow`).

## RLS Operation Colors

Map RLS operations to HTTP method colors using `getMethodColors` from `src/constants/colors.ts`:

| RLS Operation | HTTP Method | Color |
|---------------|-------------|-------|
| SELECT | GET | green (#3d8c75) |
| INSERT | POST | orange (#e27739) |
| UPDATE | PUT | amber (#b86e0a) |
| DELETE | DELETE | red (#b84040) |

## Immediate Integration Points

1. **Data Model → API Map**: RLS policy rows become clickable links. The operation badge
   uses method colors. Clicking a policy row navigates to `/api-map#anchor` targeting
   the most relevant endpoint for that table + operation combo.

2. **Data Model → Data Model**: FK references already cross-link (implemented in Task 6).

3. **Future**: API Map → Data Model, Journey steps → API Map (already exists),
   Journey steps → Data Model, Lifecycle states → Journeys, etc.

## Files

| File | Change |
|------|--------|
| `src/data/cross-links.ts` | New — computed index module |
| `src/features/data-model/entity-list/index.tsx` | Update RLS section with colors + links |
| `src/features/data-model/entity-list/entity-list.module.scss` | Update policy badge styles for method colors |

## Out of Scope

- API Map → Data Model links (separate task)
- Journey → Data Model links (separate task)
- Any changes to the extraction pipeline
