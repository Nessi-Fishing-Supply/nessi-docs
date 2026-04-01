# Branch System Design

> Environment branching with URL-based routing, branch-aware navigation, and a data architecture that supports future visual diffing.

---

## Context

Nessi Docs currently renders a single dataset — production data extracted from `nessi-web-app`. The Archway product vision (PRODUCT_VISION.md §Environments & Diffing) calls for environment branching and visual diffing as core differentiators. This spec implements the branching foundation: multiple named datasets (branches), URL-based routing, a branch switcher, and a data layer shaped for diffing.

## Goals

1. Support multiple named branches of extracted data (starting with `main` and `staging`)
2. URL-based branch routing — every page is shareable with branch context (`/staging/journeys/checkout`)
3. Branch-aware navigation — switching branches keeps you in that branch's context across all links
4. Data architecture supports loading two branches simultaneously for future diff overlay
5. Clear UX feedback when switching branches (crossfade + toast)

## Non-Goals (This Phase)

- Diff engine / visual overlay (future phase — but the data layer is shaped for it)
- Branch creation UI (branches defined in code via registry)
- Merge/conflict resolution (read-only visualization tool)
- Dynamic branch creation from GitHub webhooks (enterprise feature)

---

## 1. Data Layer

### 1.1 Branch Data Structure

```
src/data/
├── generated/                  # Main/prod data (unchanged, continues as "main")
├── branches/
│   └── staging/                # Hand-crafted staging variant
│       ├── _meta.json
│       ├── journeys.json
│       ├── data-model.json
│       ├── entity-relationships.json
│       ├── lifecycles.json
│       ├── api-contracts.json
│       ├── features.json
│       ├── architecture.json
│       ├── config-reference.json
│       ├── permissions.json
│       ├── changelog.json
│       └── roadmap.json
├── branch-registry.ts          # Branch definitions
├── branch-loader.ts            # Loads & transforms raw JSON → BranchData
└── index.ts                    # Existing file — becomes the "main" loader internally
```

### 1.2 BranchData Interface

A single typed object containing the full dataset for one branch. This is the unit of comparison for diffing.

```ts
interface BranchData {
  meta: ExtractionMeta;
  entities: Entity[];
  journeys: Journey[];
  lifecycles: Lifecycle[];
  erdNodes: ErdNode[];
  erdEdges: ErdEdge[];
  apiGroups: ApiGroup[];
  archDiagrams: ArchDiagram[];
  features: Feature[];
  roles: Role[];
  configEnums: ConfigEnum[];
  changelog: ChangelogEntry[];
  roadmapItems: RoadmapItem[];
}
```

### 1.3 Branch Registry

```ts
// src/data/branch-registry.ts
interface BranchInfo {
  name: string;        // URL segment: 'main', 'staging'
  label: string;       // Display: 'Production', 'Staging'
  description: string; // 'Live production data', 'Pre-release changes'
  color: string;       // Dot color in switcher: green, orange, etc.
  isDefault: boolean;  // true for 'main'
}
```

### 1.4 Branch Loader

`loadBranch(name: string): BranchData` — imports the raw JSON for the given branch and runs it through the same transform pipeline that `index.ts` uses today (layout engines, color assignment, cross-links, etc.).

- `main` → loads from `src/data/generated/`
- `staging` → loads from `src/data/branches/staging/`
- Unknown branch → returns `null` (handled as 404 at the route level)

### 1.5 Helper Function Refactor

Current helpers read from module-level constants:

```ts
// Before
export function getJourney(slug: string): Journey | undefined {
  return journeys.find((j) => j.slug === slug);
}
```

Refactored to accept `BranchData`:

```ts
// After
export function getJourney(data: BranchData, slug: string): Journey | undefined {
  return data.journeys.find((j) => j.slug === slug);
}
```

Existing `index.ts` static exports (`entities`, `journeys`, etc.) are removed. All runtime data access goes through `useBranchData()`. The only remaining use of direct imports is in `generateStaticParams` functions, which need data at build time outside of React context — these call `loadBranch('main')` (or iterate all branches) directly.

---

## 2. Routing

### 2.1 URL Structure

All existing routes move under a `[branch]` dynamic segment:

```
/                              → redirect to /main/
/main/                         → dashboard
/main/journeys/               → journey domain grid
/main/journeys/auth/login     → specific journey
/main/data-model              → entity list
/main/entity-relationships    → ERD canvas
/main/lifecycles              → lifecycle list
/main/lifecycles/listing      → specific lifecycle
/main/api-map                 → API endpoint list
/main/architecture            → architecture diagram list
/main/features/commerce       → feature domain page
/main/config                  → config reference
/main/changelog               → changelog feed
/staging/journeys/auth/login  → same page, staging data
```

Future diff URLs:

```
/diff/main...staging/journeys/checkout
```

### 2.2 Route Implementation

```
src/app/
├── page.tsx                   # Root redirect → /main/
├── [branch]/
│   ├── layout.tsx             # BranchProvider — reads [branch] param, loads data
│   ├── page.tsx               # Dashboard
│   ├── journeys/
│   │   ├── page.tsx
│   │   └── [domain]/[slug]/page.tsx
│   ├── data-model/page.tsx
│   ├── entity-relationships/page.tsx
│   ├── lifecycles/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── api-map/page.tsx
│   ├── architecture/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── features/[domain]/page.tsx
│   ├── config/page.tsx
│   └── changelog/page.tsx
└── diff/                      # Future — not built now
    └── [comparison]/[...path]/page.tsx
```

### 2.3 Static Generation

`generateStaticParams` at the `[branch]` layout level returns all registered branch names. Each leaf page's `generateStaticParams` generates params for all branches × all slugs.

### 2.4 Root Redirect

`src/app/page.tsx` becomes a redirect to `/main/` (using `redirect()` from `next/navigation`).

---

## 3. BranchProvider

### 3.1 Context Shape

```ts
interface BranchContextValue {
  // Active branch (always set, read from URL)
  activeBranch: string;
  activeData: BranchData;

  // Comparison (null when not diffing — future use)
  comparisonBranch: string | null;
  comparisonData: BranchData | null;
  setComparisonBranch: (name: string | null) => void;

  // Convenience
  isDiffMode: boolean;
  branches: BranchInfo[];
}
```

### 3.2 Provider Placement

Lives in `src/app/[branch]/layout.tsx`. Wraps `DocsProvider`. Reads the `[branch]` param and loads data via `loadBranch()`.

### 3.3 Hook

```ts
function useBranchData(): BranchContextValue
```

All page components use this hook instead of importing data directly from `@/data`.

---

## 4. Branch-Aware Navigation

### 4.1 Sidebar

The sidebar reads the current branch from `useBranchData()` and prefixes all nav links:

```ts
const { activeBranch } = useBranchData();
// "Journeys" link → `/${activeBranch}/journeys`
```

### 4.2 Deep-Links and Cross-Links

All deep-link hrefs (data model rows → API map, journey nodes → data model, etc.) are prefixed with the active branch. The `CrossLink` type already has an `href` field — the cross-link builders need the branch param.

### 4.3 Branch Switcher

- **Location:** Bottom of sidebar, above any footer content
- **Appearance:** Compact row showing colored dot + branch name + chevron
- **Interaction:** Click opens a dropup popover listing all branches
- **Each option:** Colored dot, branch label, description
- **On select:** Navigate to `/${newBranch}/${currentPath}` — same page, different branch

### 4.4 Logo / Home Link

The Nessi logo in the topbar links to `/${activeBranch}/` instead of `/`.

---

## 5. UX Feedback

### 5.1 Crossfade

On branch switch (detected via route param change in BranchProvider):
- Main content area fades out (opacity 1→0, 150ms)
- Data swaps
- Main content area fades in (opacity 0→1, 150ms)
- Implemented as a CSS class toggle on the app shell content wrapper

### 5.2 Toast

- New minimal toast component (no library dependency)
- Appears bottom-right, auto-dismisses after 3 seconds
- Content: colored dot + "Switched to **{branch label}**"
- Slide-in + fade-out CSS animation
- Managed via a simple toast context or callback from the branch switcher

### 5.3 Branch Indicator

The branch switcher in the sidebar serves as the persistent indicator of which branch you're viewing. The colored dot provides at-a-glance recognition.

---

## 6. Staging Data (Demo Content)

Hand-crafted mutations to the staging dataset to create a meaningful delta:

1. **New entity:** `wishlists` table with fields (id, profile_id, name, created_at)
2. **Modified entity:** Add `wishlist_count` field to `profiles` table
3. **New ERD node + edges:** `wishlists` node with relationship edges to `profiles`
4. **New API endpoints:** `GET /api/wishlists`, `POST /api/wishlists`, `DELETE /api/wishlists/[id]`
5. **Modified lifecycle:** Add `archived` state to the `listing` lifecycle with a transition from `active`
6. **New journey (optional, if time permits):** "Add to Wishlist" — 3-4 step journey

This gives a mix of additions and modifications across multiple domains, providing a rich demo for the eventual diff overlay.

---

## 7. Migration Path

### 7.1 What Changes

- All route files move from `src/app/{page}/` to `src/app/[branch]/{page}/`
- All page components switch from `import { x } from '@/data'` to `useBranchData()`
- Sidebar, topbar home link, and all cross-link builders become branch-aware
- New files: `branch-registry.ts`, `branch-loader.ts`, `BranchProvider`, branch switcher component, toast component

### 7.2 What Doesn't Change

- Canvas infrastructure (CanvasProvider, nodes, edges, hooks) — receives data via props, doesn't care about branches
- Detail panels — receive data via selection state, unaffected
- Styling / design tokens — no changes
- DocsProvider — still manages selection state, unchanged
- DeviceGate, StalenessBanner — unchanged

### 7.3 Backwards Compatibility

None needed. This is a structural change — old URLs (`/journeys/checkout`) will 404. Since this is an internal tool, there's no SEO or external link concern. If needed, a simple middleware redirect from `/{page}` to `/main/{page}` could be added.
