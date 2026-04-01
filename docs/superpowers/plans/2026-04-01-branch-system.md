# Branch System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add URL-based environment branching with a branch switcher, enabling multiple datasets (main/staging) with a data layer shaped for future visual diffing.

**Architecture:** All routes move under `[branch]/` dynamic segment. A `BranchProvider` reads the branch from the URL param, loads the corresponding dataset via `branch-loader.ts`, and exposes it to all components. The sidebar, topbar, and cross-links become branch-aware. A switcher at the bottom of the sidebar navigates between branches with crossfade + toast feedback.

**Tech Stack:** Next.js 16 App Router, React Context, SCSS Modules, existing design tokens

**Spec:** `docs/superpowers/specs/2026-04-01-branch-system-design.md`

---

## File Map

### New Files

| File                                                                | Purpose                                               |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| `src/types/branch.ts`                                               | `BranchData` and `BranchInfo` types                   |
| `src/data/branch-registry.ts`                                       | Branch definitions (main, staging)                    |
| `src/data/branches/raw-main.ts`                                     | Re-exports raw JSON from `generated/`                 |
| `src/data/branches/raw-staging.ts`                                  | Re-exports raw JSON from `branches/staging/`          |
| `src/data/branches/staging/*.json`                                  | Copied + modified staging data (13 files)             |
| `src/data/branch-loader.ts`                                         | `loadBranch()` — transforms raw bundle → `BranchData` |
| `src/providers/branch-provider.tsx`                                 | `BranchProvider` + `useBranchData()` hook             |
| `src/app/[branch]/layout.tsx`                                       | Branch layout — wires provider, app shell, sidebar    |
| `src/app/[branch]/page.tsx`                                         | Dashboard (moved)                                     |
| `src/app/[branch]/journeys/page.tsx`                                | Journeys index (moved)                                |
| `src/app/[branch]/journeys/[domain]/page.tsx`                       | Domain journeys (moved)                               |
| `src/app/[branch]/journeys/[domain]/[slug]/page.tsx`                | Journey detail (moved)                                |
| `src/app/[branch]/journeys/[domain]/[slug]/client.tsx`              | Journey client (moved)                                |
| `src/app/[branch]/data-model/page.tsx`                              | Data model (moved)                                    |
| `src/app/[branch]/entity-relationships/page.tsx`                    | ERD (moved)                                           |
| `src/app/[branch]/lifecycles/page.tsx`                              | Lifecycles index (moved)                              |
| `src/app/[branch]/lifecycles/[slug]/page.tsx`                       | Lifecycle detail (moved)                              |
| `src/app/[branch]/lifecycles/[slug]/client.tsx`                     | Lifecycle client (moved)                              |
| `src/app/[branch]/api-map/page.tsx`                                 | API map (moved)                                       |
| `src/app/[branch]/architecture/page.tsx`                            | Architecture index (moved)                            |
| `src/app/[branch]/architecture/[slug]/page.tsx`                     | Architecture detail (moved)                           |
| `src/app/[branch]/architecture/[slug]/client.tsx`                   | Architecture client (moved)                           |
| `src/app/[branch]/features/[domain]/page.tsx`                       | Feature domain (moved)                                |
| `src/app/[branch]/config/page.tsx`                                  | Config (moved)                                        |
| `src/app/[branch]/changelog/page.tsx`                               | Changelog (moved)                                     |
| `src/components/layout/branch-switcher/index.tsx`                   | Branch dropdown UI                                    |
| `src/components/layout/branch-switcher/branch-switcher.module.scss` | Switcher styles                                       |
| `src/components/ui/toast/index.tsx`                                 | Minimal toast component                               |
| `src/components/ui/toast/toast.module.scss`                         | Toast styles                                          |

### Modified Files

| File                                                    | Change                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/data/index.ts`                                     | Delegates to `branch-loader` for main; keeps exports for `generateStaticParams` |
| `src/data/transforms/features.ts`                       | Accept raw data as params instead of importing JSON directly                    |
| `src/data/cross-links.ts`                               | Accept data as params                                                           |
| `src/data/cross-links-lifecycle.ts`                     | Accept data as params                                                           |
| `src/app/layout.tsx`                                    | Simplified — html/body/fonts/styles only (no AppShell, no data)                 |
| `src/app/page.tsx`                                      | Redirect to `/main/`                                                            |
| `src/components/layout/sidebar/index.tsx`               | Branch-aware links via context                                                  |
| `src/components/layout/sidebar/sidebar.module.scss`     | Add branch switcher section styles                                              |
| `src/components/layout/app-shell/index.tsx`             | Add crossfade class support                                                     |
| `src/components/layout/app-shell/app-shell.module.scss` | Crossfade transition styles                                                     |
| `src/components/layout/topbar/index.tsx`                | Branch-aware home link                                                          |

### Deleted Files

| File                                          | Reason                  |
| --------------------------------------------- | ----------------------- |
| `src/app/journeys/page.tsx`                   | Moved under `[branch]/` |
| `src/app/journeys/[domain]/page.tsx`          | Moved                   |
| `src/app/journeys/[domain]/[slug]/page.tsx`   | Moved                   |
| `src/app/journeys/[domain]/[slug]/client.tsx` | Moved                   |
| `src/app/data-model/page.tsx`                 | Moved                   |
| `src/app/entity-relationships/page.tsx`       | Moved                   |
| `src/app/lifecycles/page.tsx`                 | Moved                   |
| `src/app/lifecycles/[slug]/page.tsx`          | Moved                   |
| `src/app/lifecycles/[slug]/client.tsx`        | Moved                   |
| `src/app/api-map/page.tsx`                    | Moved                   |
| `src/app/architecture/page.tsx`               | Moved                   |
| `src/app/architecture/[slug]/page.tsx`        | Moved                   |
| `src/app/architecture/[slug]/client.tsx`      | Moved                   |
| `src/app/features/[domain]/page.tsx`          | Moved                   |
| `src/app/config/page.tsx`                     | Moved                   |
| `src/app/changelog/page.tsx`                  | Moved                   |

---

## Task 1: Branch Types and Registry

**Files:**

- Create: `src/types/branch.ts`
- Create: `src/data/branch-registry.ts`

- [ ] **Step 1: Create branch types**

```ts
// src/types/branch.ts
import type { ApiGroup } from '@/types/api-contract';
import type { ErdEdge } from '@/types/entity-relationship';
import type { Role } from '@/types/permission';
import type { ConfigEnum } from '@/types/config-ref';
import type { Feature } from '@/types/feature';
import type { Lifecycle } from '@/types/lifecycle';
import type { Journey } from '@/types/journey';
import type { ChangelogEntry } from '@/types/changelog';
import type { RoadmapItem } from '@/types/roadmap';
import type { ExtractionMeta } from '@/types/extraction-meta';
import type { ArchDiagram } from '@/types/architecture';
import type { Entity } from '@/types/entity';
import type { ErdNode } from '@/types/entity-relationship';

export interface BranchInfo {
  /** URL segment: 'main', 'staging' */
  name: string;
  /** Display label: 'Production', 'Staging' */
  label: string;
  /** Short description for switcher */
  description: string;
  /** Dot color CSS value */
  color: string;
  /** Default branch gets used for redirects */
  isDefault: boolean;
}

export interface BranchData {
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

Note: Check `src/types/` for the exact `Entity` and `ErdNode` type export locations — they may be in `entity.ts` or `entity-relationship.ts`. Adjust imports accordingly. If `Entity` isn't exported as a standalone type, check how `entities` is typed in `src/data/index.ts` — you may need to check what `transformEntities` returns.

- [ ] **Step 2: Create branch registry**

```ts
// src/data/branch-registry.ts
import type { BranchInfo } from '@/types/branch';

export const BRANCHES: BranchInfo[] = [
  {
    name: 'main',
    label: 'Production',
    description: 'Live production data',
    color: 'var(--color-green-500, #22c55e)',
    isDefault: true,
  },
  {
    name: 'staging',
    label: 'Staging',
    description: 'Pre-release changes',
    color: 'var(--color-orange-500, #f97316)',
    isDefault: false,
  },
];

export function getBranch(name: string): BranchInfo | undefined {
  return BRANCHES.find((b) => b.name === name);
}

export function getDefaultBranch(): BranchInfo {
  return BRANCHES.find((b) => b.isDefault) ?? BRANCHES[0];
}

export function getBranchNames(): string[] {
  return BRANCHES.map((b) => b.name);
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: PASS (new files only, no consumers yet)

- [ ] **Step 4: Commit**

```bash
git add src/types/branch.ts src/data/branch-registry.ts
git commit -m "feat(branch): add BranchData type and branch registry"
```

---

## Task 2: Raw Data Bundle Modules

Create per-branch modules that re-export raw JSON. These are the entry points for the branch loader.

**Files:**

- Create: `src/data/branches/raw-main.ts`
- Create: `src/data/branches/raw-staging.ts` (points to main data initially)

- [ ] **Step 1: Create main raw bundle**

```ts
// src/data/branches/raw-main.ts
export { default as apiContracts } from '../generated/api-contracts.json';
export { default as dataModel } from '../generated/data-model.json';
export { default as entityRelationships } from '../generated/entity-relationships.json';
export { default as permissions } from '../generated/permissions.json';
export { default as configReference } from '../generated/config-reference.json';
export { default as features } from '../generated/features.json';
export { default as lifecycles } from '../generated/lifecycles.json';
export { default as journeys } from '../generated/journeys.json';
export { default as changelog } from '../generated/changelog.json';
export { default as roadmap } from '../generated/roadmap.json';
export { default as architecture } from '../generated/architecture.json';
export { default as meta } from '../generated/_meta.json';
```

- [ ] **Step 2: Create staging raw bundle (initially mirrors main)**

```ts
// src/data/branches/raw-staging.ts
// Initially same as main — staging JSON files are created in Task 5
export { default as apiContracts } from '../generated/api-contracts.json';
export { default as dataModel } from '../generated/data-model.json';
export { default as entityRelationships } from '../generated/entity-relationships.json';
export { default as permissions } from '../generated/permissions.json';
export { default as configReference } from '../generated/config-reference.json';
export { default as features } from '../generated/features.json';
export { default as lifecycles } from '../generated/lifecycles.json';
export { default as journeys } from '../generated/journeys.json';
export { default as changelog } from '../generated/changelog.json';
export { default as roadmap } from '../generated/roadmap.json';
export { default as architecture } from '../generated/architecture.json';
export { default as meta } from '../generated/_meta.json';
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/data/branches/raw-main.ts src/data/branches/raw-staging.ts
git commit -m "feat(branch): add raw data bundle modules for main and staging"
```

---

## Task 3: Refactor Transform Functions to Accept Data Params

Currently `transforms/features.ts`, `cross-links.ts`, and `cross-links-lifecycle.ts` import raw JSON directly. Refactor them to accept data as parameters so they can be called with any branch's data.

**Files:**

- Modify: `src/data/transforms/features.ts`
- Modify: `src/data/cross-links.ts`
- Modify: `src/data/cross-links-lifecycle.ts`

- [ ] **Step 1: Refactor `transforms/features.ts`**

Remove all direct JSON imports at the top of the file. Change each exported function to accept the raw data it needs as parameters. The `FEATURE_TO_DOMAIN`, `SCOPE_TO_DOMAIN` maps and `hasProductSurface` helper remain unchanged.

Changes to each function:

`getFeatureDomains()` → `getFeatureDomains(allFeatures: Feature[], allJourneys: RawJourney[])`:

- Remove the local `featuresRaw` and `journeysRaw` references
- Accept `allFeatures` and `allJourneys` as params

`getFeaturesByDomain(domain)` → `getFeaturesByDomain(allFeatures: Feature[], domain: string)`:

- Accept `allFeatures` as first param

`getDomainForScope(scope)` — no change needed (pure lookup, no data dependency)

`getChangelogByDomain(domain)` → `getChangelogByDomain(rawChangelog: RawChangelogEntry[], domain: string)`:

- Accept raw changelog entries as first param
- Define `RawChangelogEntry` type inline or import it

`getDashboardMetrics()` → `getDashboardMetrics(data: { features: Feature[]; apiGroups: ApiGroup[]; journeys: RawJourney[]; entities: RawEntity[]; lifecycles: RawLifecycle[] })`:

- Accept a data bag with all needed collections

Remove these imports from the top of the file:

```ts
// REMOVE these:
import apiContractsRaw from '../generated/api-contracts.json';
import featuresRaw from '../generated/features.json';
import journeysRaw from '../generated/journeys.json';
import dataModelRaw from '../generated/data-model.json';
import lifecyclesRaw from '../generated/lifecycles.json';
import changelogRaw from '../generated/changelog.json';
```

- [ ] **Step 2: Refactor `cross-links.ts`**

This file builds the bidirectional endpoint↔table index at module load time using `apiContractsRaw` and `dataModelRaw`. Refactor so the index-building functions accept data as params.

Remove the top-level JSON imports:

```ts
// REMOVE:
import apiContractsRaw from './generated/api-contracts.json';
import dataModelRaw from './generated/data-model.json';
```

The module currently computes the index eagerly at import time via module-level code. Wrap the index building in a function:

```ts
export function buildCrossLinkIndex(
  apiGroups: { name: string; endpoints: { method: string; path: string }[] }[],
  entities: { name: string; label?: string; badges?: string[] }[],
) {
  // ... existing index-building logic, moved from module scope into this function
  // Returns: { getEndpointsForTable, getTablesForEndpoint, getBestEndpointForOperation, getEndpointsForOperation }
}
```

Return an object with the lookup functions. The types `EndpointRef` and `TableRef` remain exported from this file.

- [ ] **Step 3: Refactor `cross-links-lifecycle.ts`**

Remove direct JSON imports and transform calls:

```ts
// REMOVE:
import lifecyclesRaw from './generated/lifecycles.json';
import journeysRaw from './generated/journeys.json';
import { transformLifecycles } from './layout/lifecycle-layout';
import { transformJourneys } from './layout/journey-layout';

const _lifecycles = transformLifecycles(...);
const _journeys = transformJourneys(...);
```

Refactor each exported function to accept the data it needs:

`getLifecycleForEntity(lifecycles: Lifecycle[], tableName: string)`
`getEntitiesForLifecycle(lifecycles: Lifecycle[], slug: string)` (uses `LIFECYCLE_ENTITY_MAP`)
`getJourneysForLifecycle(journeys: Journey[], lifecycles: Lifecycle[], slug: string)`
`getLifecyclesForJourney(journeys: Journey[], lifecycles: Lifecycle[], journeySlug: string)`
`getLifecyclesForRoute(journeys: Journey[], lifecycles: Lifecycle[], route: string)`

Keep the `LIFECYCLE_ENTITY_MAP` as a module constant (it's a static lookup table, not data-dependent).

The import of `getTablesForEndpoint` from `./cross-links` needs to change — it now needs to accept a cross-link index object. Adjust the calls to use the index returned by `buildCrossLinkIndex`.

- [ ] **Step 4: Update `src/data/index.ts` callers**

Update `index.ts` to call the refactored functions with the raw data it already has imported. This keeps existing behavior working — `index.ts` still imports from `generated/` directly and passes data to the refactored functions.

For example:

```ts
// Before:
import { getFeatureDomains, getFeaturesByDomain, ... } from './transforms/features';

// After — create wrapper functions that pass the loaded data:
export function getFeatureDomains() {
  return _getFeatureDomains(features, journeysRaw.journeys as unknown as RawJourney[]);
}
```

Rename the imported functions with a `_` prefix or use inline wrappers to maintain the existing public API of `index.ts`. This is temporary — these wrappers will be removed when pages switch to `useBranchData()`.

Similarly update cross-link function calls in `index.ts` to pass data.

- [ ] **Step 5: Verify typecheck + build pass**

Run: `pnpm typecheck && pnpm build`
Expected: PASS — no behavioral change, just refactored function signatures

- [ ] **Step 6: Commit**

```bash
git add src/data/transforms/features.ts src/data/cross-links.ts src/data/cross-links-lifecycle.ts src/data/index.ts
git commit -m "refactor(data): parameterize transform and cross-link functions for branch support"
```

---

## Task 4: Branch Loader

Create the central `loadBranch()` function that takes a branch name, loads its raw JSON bundle, runs all transforms, and returns a typed `BranchData` object.

**Files:**

- Create: `src/data/branch-loader.ts`
- Modify: `src/data/index.ts` — delegate to branch loader for main

- [ ] **Step 1: Create branch loader**

```ts
// src/data/branch-loader.ts
import type { BranchData } from '@/types/branch';
import type { ApiGroup } from '@/types/api-contract';
import type { ErdEdge } from '@/types/entity-relationship';
import type { Role } from '@/types/permission';
import type { ConfigEnum } from '@/types/config-ref';
import type { Feature } from '@/types/feature';
import type { ArchDiagram } from '@/types/architecture';
import type { RoadmapItem } from '@/types/roadmap';
import type { ExtractionMeta } from '@/types/extraction-meta';
import type { RawJourney, RawLifecycle, RawErdNode, RawEntity } from './raw-types';

import { transformJourneys } from './layout/journey-layout';
import { transformLifecycles } from './layout/lifecycle-layout';
import { transformErdNodes } from './layout/erd-layout';
import { transformEntities } from './transforms/entities';
import { transformChangelog } from './transforms/changelog';

import * as mainRaw from './branches/raw-main';
import * as stagingRaw from './branches/raw-staging';

type RawBundle = typeof mainRaw;

const RAW_BUNDLES: Record<string, RawBundle> = {
  main: mainRaw,
  staging: stagingRaw,
};

function transformBundle(raw: RawBundle): BranchData {
  const apiGroups = raw.apiContracts.groups as unknown as ApiGroup[];
  const entities = transformEntities(raw.dataModel.entities as RawEntity[]);
  const erdNodes = transformErdNodes(
    raw.entityRelationships.nodes as RawErdNode[],
    raw.dataModel.entities as RawEntity[],
  );
  const erdEdges = raw.entityRelationships.edges as unknown as ErdEdge[];
  const roles = raw.permissions.roles as unknown as Role[];
  const configEnums = raw.configReference.configs as unknown as ConfigEnum[];
  const features = raw.features.features as unknown as Feature[];
  const lifecycles = transformLifecycles(raw.lifecycles.lifecycles as RawLifecycle[]);
  const journeys = transformJourneys(raw.journeys.journeys as unknown as RawJourney[]);
  const changelog = transformChangelog(
    raw.changelog.entries as {
      title?: string;
      mergedAt?: string;
      type?: string;
      area?: string;
      number?: number;
      url?: string;
    }[],
  );
  const roadmapItems = raw.roadmap.items as unknown as RoadmapItem[];
  const archDiagrams = (raw.architecture as { diagrams: ArchDiagram[] }).diagrams;
  const meta = raw.meta as unknown as ExtractionMeta;

  return {
    meta,
    entities,
    journeys,
    lifecycles,
    erdNodes,
    erdEdges,
    apiGroups,
    archDiagrams,
    features,
    roles,
    configEnums,
    changelog,
    roadmapItems,
  };
}

// Pre-compute all branches at module load time
const BRANCH_CACHE: Record<string, BranchData> = {};

for (const [name, raw] of Object.entries(RAW_BUNDLES)) {
  BRANCH_CACHE[name] = transformBundle(raw);
}

export function loadBranch(name: string): BranchData | null {
  return BRANCH_CACHE[name] ?? null;
}

export function getAllBranchData(): Record<string, BranchData> {
  return BRANCH_CACHE;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/data/branch-loader.ts
git commit -m "feat(branch): add branch loader with transform pipeline"
```

---

## Task 5: Create Staging Data

Copy the production JSON files and make targeted modifications to create a meaningful delta for demo purposes.

**Files:**

- Create: `src/data/branches/staging/` (13 JSON files)
- Modify: `src/data/branches/raw-staging.ts` — point to staging JSON

- [ ] **Step 1: Copy all generated JSON to staging directory**

```bash
mkdir -p src/data/branches/staging
cp src/data/generated/*.json src/data/branches/staging/
```

- [ ] **Step 2: Modify staging `_meta.json`**

Update the `extractedAt` to a future date and change the description to indicate staging:

```json
{
  "extractedAt": "2026-04-01T12:00:00.000Z",
  "sourceCommit": "staging-demo-snapshot",
  "sourceRepo": "nessi-fishing-supply/Nessi-Web-App",
  "scriptVersion": "1.0.0",
  "itemCounts": {}
}
```

The `itemCounts` will be updated after the data modifications below.

- [ ] **Step 3: Add wishlist entity to staging `data-model.json`**

Add a new entity object to the `entities` array:

```json
{
  "name": "wishlists",
  "label": "Wishlists",
  "badges": ["shopping"],
  "fields": [
    {
      "name": "id",
      "type": "uuid",
      "nullable": false,
      "isPrimaryKey": true,
      "default": "gen_random_uuid()"
    },
    {
      "name": "profile_id",
      "type": "uuid",
      "nullable": false,
      "references": { "table": "profiles", "column": "id", "onDelete": "CASCADE" }
    },
    { "name": "name", "type": "text", "nullable": false },
    { "name": "is_public", "type": "boolean", "nullable": false, "default": "false" },
    { "name": "created_at", "type": "timestamptz", "nullable": false, "default": "now()" }
  ],
  "rlsPolicies": [
    { "name": "wishlists_select_own", "operation": "SELECT", "using": "auth.uid() = profile_id" },
    {
      "name": "wishlists_insert_own",
      "operation": "INSERT",
      "withCheck": "auth.uid() = profile_id"
    },
    { "name": "wishlists_delete_own", "operation": "DELETE", "using": "auth.uid() = profile_id" }
  ],
  "indexes": [{ "name": "wishlists_profile_id_idx", "columns": ["profile_id"], "unique": false }],
  "triggers": []
}
```

- [ ] **Step 4: Add wishlist ERD node and edges to staging `entity-relationships.json`**

Add to `nodes` array:

```json
{ "id": "wishlists", "label": "Wishlists" }
```

Add to `edges` array:

```json
{ "source": "wishlists", "target": "profiles", "label": "belongs to", "type": "many-to-one" }
```

- [ ] **Step 5: Add wishlist API endpoints to staging `api-contracts.json`**

Add a new group to the `groups` array:

```json
{
  "name": "Wishlists",
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/wishlists",
      "description": "List user wishlists",
      "auth": true
    },
    {
      "method": "POST",
      "path": "/api/wishlists",
      "description": "Create a wishlist",
      "auth": true
    },
    {
      "method": "DELETE",
      "path": "/api/wishlists/[id]",
      "description": "Delete a wishlist",
      "auth": true
    }
  ]
}
```

- [ ] **Step 6: Add `archived` state to listing lifecycle in staging `lifecycles.json`**

Find the lifecycle with `"slug": "listing"` and:

- Add to `states` array: `{ "id": "archived", "label": "Archived" }`
- Add to `transitions` array: `{ "from": "active", "to": "archived", "label": "Archive" }`

- [ ] **Step 7: Update staging `_meta.json` item counts**

Update `itemCounts` to reflect the changes (increment entities by 1, add wishlists group count, etc.). Match the actual counts after modifications.

- [ ] **Step 8: Update `raw-staging.ts` to point to staging JSON**

```ts
// src/data/branches/raw-staging.ts
export { default as apiContracts } from './staging/api-contracts.json';
export { default as dataModel } from './staging/data-model.json';
export { default as entityRelationships } from './staging/entity-relationships.json';
export { default as permissions } from './staging/permissions.json';
export { default as configReference } from './staging/config-reference.json';
export { default as features } from './staging/features.json';
export { default as lifecycles } from './staging/lifecycles.json';
export { default as journeys } from './staging/journeys.json';
export { default as changelog } from './staging/changelog.json';
export { default as roadmap } from './staging/roadmap.json';
export { default as architecture } from './staging/architecture.json';
export { default as meta } from './staging/_meta.json';
```

- [ ] **Step 9: Verify typecheck + build pass**

Run: `pnpm typecheck && pnpm build`
Expected: PASS — both branches now load and transform successfully

- [ ] **Step 10: Commit**

```bash
git add src/data/branches/staging/ src/data/branches/raw-staging.ts
git commit -m "feat(branch): add staging data with wishlist entity and listing lifecycle change"
```

---

## Task 6: BranchProvider

Create the React context provider that reads the branch from route params and exposes branch data to all components.

**Files:**

- Create: `src/providers/branch-provider.tsx`

- [ ] **Step 1: Create BranchProvider**

```tsx
// src/providers/branch-provider.tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { BranchData, BranchInfo } from '@/types/branch';
import { BRANCHES } from '@/data/branch-registry';

interface BranchContextValue {
  activeBranch: string;
  activeData: BranchData;

  // Comparison branch for future diffing
  comparisonBranch: string | null;
  comparisonData: BranchData | null;
  setComparisonBranch: (name: string | null) => void;

  isDiffMode: boolean;
  branches: BranchInfo[];
}

const BranchContext = createContext<BranchContextValue | null>(null);

interface BranchProviderProps {
  branchName: string;
  branchData: BranchData;
  allBranchData: Record<string, BranchData>;
  children: ReactNode;
}

export function BranchProvider({
  branchName,
  branchData,
  allBranchData,
  children,
}: BranchProviderProps) {
  const [comparisonBranch, setComparisonBranch] = useState<string | null>(null);

  const comparisonData = comparisonBranch ? (allBranchData[comparisonBranch] ?? null) : null;

  const handleSetComparison = useCallback((name: string | null) => {
    setComparisonBranch(name);
  }, []);

  return (
    <BranchContext.Provider
      value={{
        activeBranch: branchName,
        activeData: branchData,
        comparisonBranch,
        comparisonData,
        setComparisonBranch: handleSetComparison,
        isDiffMode: comparisonBranch !== null,
        branches: BRANCHES,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchData(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranchData must be used within BranchProvider');
  return ctx;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/providers/branch-provider.tsx
git commit -m "feat(branch): add BranchProvider with comparison slot for future diffing"
```

---

## Task 7: Route Restructure

Move all routes under the `[branch]/` dynamic segment. Create the branch layout that wires the provider. Simplify the root layout. Add root redirect.

**Files:**

- Create: `src/app/[branch]/layout.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx` — becomes redirect
- Move: All route files from `src/app/{page}/` to `src/app/[branch]/{page}/`

- [ ] **Step 1: Create `[branch]/layout.tsx`**

This layout loads the branch data and wires the providers + app shell. It takes the role that the current root layout plays for data/providers.

```tsx
// src/app/[branch]/layout.tsx
import { notFound } from 'next/navigation';
import { DocsProvider } from '@/providers/docs-provider';
import { BranchProvider } from '@/providers/branch-provider';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { Sidebar } from '@/components/layout/sidebar';
import { DetailPanel } from '@/components/layout/detail-panel';
import { SearchTrigger } from '@/features/search/search-trigger';
import { loadBranch, getAllBranchData } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { getFeatureDomains as _getFeatureDomains } from '@/data/transforms/features';
import type { Feature } from '@/types/feature';
import type { RawJourney } from '@/data/raw-types';

export function generateStaticParams() {
  return getBranchNames().map((branch) => ({ branch }));
}

export default async function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  const branchData = loadBranch(branch);
  if (!branchData) notFound();

  const allBranchData = getAllBranchData();

  // Compute feature domains for sidebar from this branch's data
  const featureDomains = _getFeatureDomains(
    branchData.features,
    branchData.journeys as unknown as RawJourney[],
  ).map((d) => ({ slug: d.slug, label: d.label }));

  return (
    <BranchProvider branchName={branch} branchData={branchData} allBranchData={allBranchData}>
      <DocsProvider>
        <AppShell
          topbar={<Topbar />}
          sidebar={<Sidebar lifecycles={branchData.lifecycles} featureDomains={featureDomains} />}
          detail={<DetailPanel />}
        >
          {children}
        </AppShell>
        <SearchTrigger />
      </DocsProvider>
    </BranchProvider>
  );
}
```

Note: The `_getFeatureDomains` import will need the refactored signature from Task 3. Adjust the call based on the actual refactored function signature. The `journeys` in `BranchData` are transformed `Journey[]` — check whether `getFeatureDomains` needs `RawJourney[]` or `Journey[]` and adjust.

- [ ] **Step 2: Simplify root `layout.tsx`**

Remove the AppShell, providers, sidebar, and data imports. Keep only html/body/fonts/global styles:

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { StalenessBanner } from '@/components/layout/staleness-banner';
import { DeviceGate } from '@/components/layout/device-gate';
import '@/styles/globals.scss';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: { template: '%s | Nessi Docs', default: 'Nessi Docs' },
  description: 'Documentation and testing tool for the Nessi fishing marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={dmSans.className}>
        <StalenessBanner />
        <DeviceGate />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Convert root `page.tsx` to redirect**

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation';
import { getDefaultBranch } from '@/data/branch-registry';

export default function RootPage() {
  redirect(`/${getDefaultBranch().name}/`);
}
```

- [ ] **Step 4: Move all route files under `[branch]/`**

This is a mechanical file move. Move each directory/file from `src/app/{page}` to `src/app/[branch]/{page}`. The page content stays exactly the same for now (they still import from `@/data`).

```bash
# Create the [branch] directory structure
mkdir -p "src/app/[branch]/journeys/[domain]/[slug]"
mkdir -p "src/app/[branch]/data-model"
mkdir -p "src/app/[branch]/entity-relationships"
mkdir -p "src/app/[branch]/lifecycles/[slug]"
mkdir -p "src/app/[branch]/api-map"
mkdir -p "src/app/[branch]/architecture/[slug]"
mkdir -p "src/app/[branch]/features/[domain]"
mkdir -p "src/app/[branch]/config"
mkdir -p "src/app/[branch]/changelog"

# Move all page files (adjust for each route)
# Dashboard
cp src/app/page.tsx src/app/[branch]/page.tsx  # Will be overwritten with branch-aware version in Task 8

# Journeys
mv src/app/journeys/page.tsx "src/app/[branch]/journeys/page.tsx"
mv src/app/journeys/[domain]/page.tsx "src/app/[branch]/journeys/[domain]/page.tsx"
mv src/app/journeys/[domain]/[slug]/page.tsx "src/app/[branch]/journeys/[domain]/[slug]/page.tsx"
mv src/app/journeys/[domain]/[slug]/client.tsx "src/app/[branch]/journeys/[domain]/[slug]/client.tsx"

# Data model
mv src/app/data-model/page.tsx "src/app/[branch]/data-model/page.tsx"

# Entity relationships
mv src/app/entity-relationships/page.tsx "src/app/[branch]/entity-relationships/page.tsx"

# Lifecycles
mv src/app/lifecycles/page.tsx "src/app/[branch]/lifecycles/page.tsx"
mv src/app/lifecycles/[slug]/page.tsx "src/app/[branch]/lifecycles/[slug]/page.tsx"
mv src/app/lifecycles/[slug]/client.tsx "src/app/[branch]/lifecycles/[slug]/client.tsx"

# API Map
mv src/app/api-map/page.tsx "src/app/[branch]/api-map/page.tsx"

# Architecture
mv src/app/architecture/page.tsx "src/app/[branch]/architecture/page.tsx"
mv src/app/architecture/[slug]/page.tsx "src/app/[branch]/architecture/[slug]/page.tsx"
mv src/app/architecture/[slug]/client.tsx "src/app/[branch]/architecture/[slug]/client.tsx"

# Features
mv src/app/features/[domain]/page.tsx "src/app/[branch]/features/[domain]/page.tsx"

# Config
mv src/app/config/page.tsx "src/app/[branch]/config/page.tsx"

# Changelog
mv src/app/changelog/page.tsx "src/app/[branch]/changelog/page.tsx"
```

After moving, remove the now-empty old directories:

```bash
rm -rf src/app/journeys src/app/data-model src/app/entity-relationships src/app/lifecycles src/app/api-map src/app/architecture src/app/features src/app/config src/app/changelog
```

- [ ] **Step 5: Create branch-aware dashboard page**

The `[branch]/page.tsx` needs to be the dashboard, not the redirect:

```tsx
// src/app/[branch]/page.tsx
import { getDashboardMetrics, getFeatureDomains, changelog } from '@/data';
import { DashboardView } from '@/features/dashboard/dashboard-view';

export const metadata = { title: 'Dashboard | Nessi Docs' };

export default function DashboardPage() {
  return (
    <DashboardView
      metrics={getDashboardMetrics()}
      domains={getFeatureDomains()}
      recentChanges={changelog.slice(0, 5)}
    />
  );
}
```

(This still uses the old `@/data` imports — will be refactored in Task 8.)

- [ ] **Step 6: Update root `page.tsx` to be the redirect**

Make sure `src/app/page.tsx` is the redirect (from Step 3), not the dashboard.

- [ ] **Step 7: Verify typecheck + build pass**

Run: `pnpm typecheck && pnpm build`
Expected: PASS — routes moved, app still works but pages always show main data regardless of URL branch. The branch layout provides the context but pages don't read from it yet.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(branch): restructure routes under [branch]/ dynamic segment"
```

---

## Task 8: Refactor All Pages to Use Branch Data

Update every page to get data from the `BranchProvider` context (via the layout's props) instead of importing from `@/data` directly. Since these are server components, they receive branch data through the layout → page prop chain, not through hooks.

**Important architectural note:** Server components can't use React hooks (`useBranchData()`). The `[branch]/layout.tsx` loads the data and passes it down. There are two patterns:

1. **Page-level data access:** Since the page knows its branch from `params`, it can call `loadBranch(branch)` directly in the server component.
2. **Client components:** Use `useBranchData()` hook from the provider.

We'll use pattern 1 for server component pages — each page reads the `branch` param and calls `loadBranch()`. This is simple and explicit.

**Files:**

- Modify: All 15 page files under `src/app/[branch]/`

- [ ] **Step 1: Update `[branch]/page.tsx` (Dashboard)**

```tsx
// src/app/[branch]/page.tsx
import { loadBranch } from '@/data/branch-loader';
import { notFound } from 'next/navigation';
import { DashboardView } from '@/features/dashboard/dashboard-view';
import { getFeatureDomains, getDashboardMetrics } from '@/data/transforms/features';
import type { RawJourney } from '@/data/raw-types';

export const metadata = { title: 'Dashboard | Nessi Docs' };

export default async function DashboardPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  return (
    <DashboardView
      metrics={getDashboardMetrics({
        features: data.features,
        apiGroups: data.apiGroups,
        journeys: data.journeys as unknown as RawJourney[],
        entities: data.entities as unknown as RawEntity[],
        lifecycles: data.lifecycles as unknown as RawLifecycle[],
      })}
      domains={getFeatureDomains(data.features, data.journeys as unknown as RawJourney[])}
      recentChanges={data.changelog.slice(0, 5)}
    />
  );
}
```

Note: Adjust the type assertions based on what `getDashboardMetrics` and `getFeatureDomains` actually accept after the Task 3 refactor. The `BranchData` stores transformed data, but these helpers may need raw types — check and adjust.

- [ ] **Step 2: Update `[branch]/journeys/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { DomainGrid } from '@/features/journeys/domain-grid';
import { DOMAINS } from '@/constants/domains';

export default async function JourneysIndex({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  // Replicate getDomains() logic with branch data
  const domains = DOMAINS.map((d) => {
    const dJourneys = data.journeys.filter((j) => j.domain === d.slug);
    const allNodes = dJourneys.flatMap((j) => j.nodes);
    return {
      ...d,
      journeyCount: dJourneys.length,
      stepCount: allNodes.filter((n) => n.type === 'step').length,
      decisionCount: allNodes.filter((n) => n.type === 'decision').length,
    };
  }).filter((d) => d.journeyCount > 0);

  return <DomainGrid domains={domains} />;
}
```

- [ ] **Step 3: Update remaining journey pages**

Apply the same pattern to:

- `[branch]/journeys/[domain]/page.tsx` — use `data.journeys` instead of `getJourneysByDomain()`
- `[branch]/journeys/[domain]/[slug]/page.tsx` — use `data.journeys.find()` instead of `getJourney()`

Each page receives `params: Promise<{ branch: string; domain?: string; slug?: string }>`, loads branch data, and queries it directly.

Update `generateStaticParams` in each to iterate over all branches:

```tsx
import { getBranchNames } from '@/data/branch-registry';
import { loadBranch } from '@/data/branch-loader';

export function generateStaticParams() {
  return getBranchNames().flatMap((branch) => {
    const data = loadBranch(branch);
    if (!data) return [];
    // ... map data to params, adding { branch } to each
  });
}
```

- [ ] **Step 4: Update simple pages (data-model, api-map, config, changelog, entity-relationships)**

These pages are straightforward — they just need the branch data arrays:

- `[branch]/data-model/page.tsx` → `data.entities`
- `[branch]/api-map/page.tsx` → `data.apiGroups`
- `[branch]/config/page.tsx` → `data.configEnums`, `data.roles`
- `[branch]/changelog/page.tsx` → `data.changelog`
- `[branch]/entity-relationships/page.tsx` → `data.erdNodes`, `data.erdEdges`, `data.entities`

Each gets `params: Promise<{ branch: string }>` and calls `loadBranch()`.

For entity-relationships, the `getErdCategoryGroups()` function will need to be called with the branch's ERD data. Check how it works and adjust.

- [ ] **Step 5: Update pages with generateStaticParams (lifecycles, architecture, features)**

These pages have dynamic segments beyond `[branch]`. Update `generateStaticParams` to iterate branches × slugs:

- `[branch]/lifecycles/[slug]/page.tsx`
- `[branch]/architecture/[slug]/page.tsx`
- `[branch]/features/[domain]/page.tsx`
- `[branch]/journeys/[domain]/page.tsx`
- `[branch]/journeys/[domain]/[slug]/page.tsx`

Pattern:

```tsx
export function generateStaticParams() {
  return getBranchNames().flatMap((branch) => {
    const data = loadBranch(branch);
    if (!data) return [];
    return data.lifecycles.map((l) => ({ branch, slug: l.slug }));
  });
}
```

- [ ] **Step 6: Remove unused imports from `src/data/index.ts`**

Now that no page imports from `@/data` directly, clean up `index.ts`. Keep it as a convenience module that exports main branch data for any remaining consumers (e.g., `StalenessBanner`), but remove the wrapper functions that are no longer called.

- [ ] **Step 7: Verify typecheck + build pass**

Run: `pnpm typecheck && pnpm build`
Expected: PASS — all pages now load branch-specific data based on URL

- [ ] **Step 8: Verify dev server manually**

Run: `pnpm dev`

- Visit `http://localhost:3000` → should redirect to `/main/`
- Visit `/main/journeys` → should show journeys
- Visit `/staging/data-model` → should show data model including wishlists entity
- Visit `/staging/lifecycles/listing` → should show listing lifecycle with `archived` state

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(branch): refactor all pages to use branch-specific data from URL"
```

---

## Task 9: Branch-Aware Sidebar Navigation

Update the sidebar so all links include the active branch prefix. The sidebar reads the branch from the URL (via `usePathname()` or from the `BranchProvider` context).

**Files:**

- Modify: `src/components/layout/sidebar/index.tsx`
- Modify: `src/components/layout/topbar/index.tsx`

- [ ] **Step 1: Update sidebar to use branch-aware links**

```tsx
// src/components/layout/sidebar/index.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBranchData } from '@/providers/branch-provider';
// ... existing icon imports ...
import type { Lifecycle } from '@/types/lifecycle';
import styles from './sidebar.module.scss';

const SYSTEM_ITEMS = [
  { id: 'journeys', label: 'Journeys', icon: HiOutlineMap, path: '/journeys' },
  { id: 'api', label: 'API Map', icon: HiOutlineServer, path: '/api-map' },
  { id: 'data', label: 'Data Model', icon: HiOutlineDatabase, path: '/data-model' },
  { id: 'erd', label: 'Relationships', icon: HiOutlineLink, path: '/entity-relationships' },
  { id: 'lifecycles', label: 'Lifecycles', icon: HiOutlineRefresh, path: '/lifecycles' },
  { id: 'architecture', label: 'Architecture', icon: HiOutlineChip, path: '/architecture' },
];

const REFERENCE_ITEMS = [
  { id: 'config', label: 'Config', icon: HiOutlineCog, path: '/config' },
  { id: 'changelog', label: 'Changelog', icon: HiOutlineClock, path: '/changelog' },
];

interface SidebarProps {
  lifecycles: Lifecycle[];
  featureDomains: { slug: string; label: string }[];
}

export function Sidebar({ featureDomains }: SidebarProps) {
  const pathname = usePathname();
  const { activeBranch } = useBranchData();
  const branchPrefix = `/${activeBranch}`;

  const isDashboardActive = pathname === branchPrefix || pathname === `${branchPrefix}/`;

  return (
    <div className={styles.sidebar}>
      <Link
        href={`${branchPrefix}/`}
        className={`${styles.navItem} ${isDashboardActive ? styles.active : ''}`}
      >
        <HiOutlineHome className={styles.navIcon} />
        <span>Dashboard</span>
      </Link>

      <div className={styles.sectionLabel}>System Views</div>
      <div className={styles.nav}>
        {SYSTEM_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = `${branchPrefix}${item.path}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={item.id}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon className={styles.navIcon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.sectionLabel}>Features</div>
      <div className={styles.nav}>
        {featureDomains.map((domain) => {
          const href = `${branchPrefix}/features/${domain.slug}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={domain.slug}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <HiOutlineLightningBolt className={styles.navIcon} />
              <span>{domain.label}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.sectionLabel}>Reference</div>
      <div className={styles.nav}>
        {REFERENCE_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = `${branchPrefix}${item.path}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={item.id}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon className={styles.navIcon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Branch switcher added in Task 10 */}
    </div>
  );
}
```

Key change: Renamed `href` to `path` in the static items arrays (path without branch prefix), then construct full hrefs with `${branchPrefix}${item.path}`. Active detection now compares against the full branch-prefixed path.

- [ ] **Step 2: Update topbar home link**

The topbar currently has a static logo without a home link. Add one that's branch-aware:

```tsx
// src/components/layout/topbar/index.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useBranchData } from '@/providers/branch-provider';
import styles from './topbar.module.scss';

export function Topbar() {
  const { activeBranch } = useBranchData();

  return (
    <div className={styles.topbar}>
      <Link href={`/${activeBranch}/`} className={styles.brand}>
        <Image
          src="/logo_full.svg"
          alt="Nessi"
          width={68}
          height={27}
          className={styles.logo}
          priority
        />
        <span className={styles.docs}>Docs</span>
      </Link>
      {/* ... rest unchanged ... */}
    </div>
  );
}
```

Add `'use client'` directive since it now uses a hook. Wrap the brand div with a `Link`. Ensure the `brand` styles include `text-decoration: none` and `color: inherit`.

- [ ] **Step 3: Verify typecheck + build pass**

Run: `pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 4: Verify manually**

Run: `pnpm dev`

- On `/main/journeys`, click "Data Model" in sidebar → should go to `/main/data-model`
- On `/staging/journeys`, click "Data Model" → should go to `/staging/data-model`
- Click Nessi logo → should go to `/main/` or `/staging/` depending on current branch

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar/index.tsx src/components/layout/topbar/index.tsx
git commit -m "feat(branch): make sidebar and topbar navigation branch-aware"
```

---

## Task 10: Branch Switcher Component

Add a branch dropdown to the bottom of the sidebar that shows the current branch and allows switching.

**Files:**

- Create: `src/components/layout/branch-switcher/index.tsx`
- Create: `src/components/layout/branch-switcher/branch-switcher.module.scss`
- Modify: `src/components/layout/sidebar/index.tsx` — add switcher
- Modify: `src/components/layout/sidebar/sidebar.module.scss` — layout for switcher at bottom

- [ ] **Step 1: Create BranchSwitcher component**

```tsx
// src/components/layout/branch-switcher/index.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useBranchData } from '@/providers/branch-provider';
import styles from './branch-switcher.module.scss';

export function BranchSwitcher() {
  const { activeBranch, branches } = useBranchData();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = branches.find((b) => b.name === activeBranch);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSwitch(branchName: string) {
    if (branchName === activeBranch) {
      setOpen(false);
      return;
    }
    // Replace the branch segment in the current path
    const pathWithoutBranch = pathname.replace(`/${activeBranch}`, '') || '/';
    router.push(`/${branchName}${pathWithoutBranch}`);
    setOpen(false);
  }

  return (
    <div className={styles.switcher} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.dot} style={{ background: current?.color }} />
        <span className={styles.label}>{current?.label ?? activeBranch}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.open : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 5L6 2L9 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          {branches.map((b) => (
            <button
              key={b.name}
              className={`${styles.option} ${b.name === activeBranch ? styles.active : ''}`}
              onClick={() => handleSwitch(b.name)}
              role="option"
              aria-selected={b.name === activeBranch}
            >
              <span className={styles.dot} style={{ background: b.color }} />
              <div className={styles.optionText}>
                <span className={styles.optionLabel}>{b.label}</span>
                <span className={styles.optionDesc}>{b.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create BranchSwitcher styles**

```scss
// src/components/layout/branch-switcher/branch-switcher.module.scss
.switcher {
  position: relative;
}

.trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-hover);
    border-color: var(--border-medium);
    color: var(--text-primary);
  }
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.label {
  flex: 1;
  text-align: left;
}

.chevron {
  color: var(--text-dim);
  transition: transform var(--transition-fast);

  &.open {
    transform: rotate(180deg);
  }
}

.dropdown {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-panel);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  box-shadow: 0 -4px 16px rgb(0 0 0 / 30%);
  overflow: hidden;
  z-index: 100;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--bg-hover);
  }

  &.active {
    background: var(--bg-raised);
    color: var(--text-primary);
  }
}

.optionText {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.optionLabel {
  font-size: 12px;
  font-weight: 500;
}

.optionDesc {
  font-size: 10px;
  color: var(--text-dim);
}
```

- [ ] **Step 3: Add switcher to sidebar**

Update the sidebar to include the switcher at the bottom. The sidebar needs flexbox layout with the nav content taking available space and the switcher pinned to the bottom.

In `sidebar/index.tsx`, add the import and render at the bottom:

```tsx
import { BranchSwitcher } from '@/components/layout/branch-switcher';

// In the return JSX, wrap everything in a flex container:
return (
  <div className={styles.sidebar}>
    <div className={styles.navContent}>
      {/* ... all existing nav sections (Dashboard, System Views, Features, Reference) ... */}
    </div>
    <div className={styles.switcherSection}>
      <BranchSwitcher />
    </div>
  </div>
);
```

- [ ] **Step 4: Update sidebar SCSS for bottom-pinned switcher**

```scss
// Add to sidebar.module.scss:

.sidebar {
  // Add these to the existing .sidebar rule:
  display: flex;
  flex-direction: column;
}

.navContent {
  flex: 1;
  overflow-y: auto;
  padding: 12px 8px 0;
}

.switcherSection {
  padding: 8px;
  border-top: 1px solid var(--border-subtle);
}
```

Adjust the existing `.sidebar` padding — move the `padding: 12px 8px` to `.navContent` instead, since the sidebar is now a flex container with the nav and switcher as separate sections.

- [ ] **Step 5: Verify typecheck + build pass**

Run: `pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 6: Verify manually**

Run: `pnpm dev`

- Branch switcher visible at bottom of sidebar
- Shows "Production" with green dot on `/main/`
- Click → dropdown opens upward with both branches
- Select "Staging" → navigates to `/staging/` (same page path)
- Sidebar links now show `/staging/` prefix
- Switcher shows "Staging" with orange dot

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/branch-switcher/ src/components/layout/sidebar/
git commit -m "feat(branch): add branch switcher to sidebar"
```

---

## Task 11: Toast Component

Create a minimal toast notification component for branch switch feedback.

**Files:**

- Create: `src/components/ui/toast/index.tsx`
- Create: `src/components/ui/toast/toast.module.scss`
- Modify: `src/components/layout/branch-switcher/index.tsx` — trigger toast on switch

- [ ] **Step 1: Create toast component**

```tsx
// src/components/ui/toast/index.tsx
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import styles from './toast.module.scss';

interface Toast {
  id: number;
  message: string;
  color?: string;
}

interface ToastContextValue {
  showToast: (message: string, color?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, color?: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, color }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className={styles.container}>
          {toasts.map((toast) => (
            <div key={toast.id} className={styles.toast}>
              {toast.color && <span className={styles.dot} style={{ background: toast.color }} />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
```

- [ ] **Step 2: Create toast styles**

```scss
// src/components/ui/toast/toast.module.scss
.container {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-panel);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 30%);
  font-size: 13px;
  color: var(--text-primary);
  animation:
    toast-in 200ms ease-out,
    toast-out 200ms ease-in 2800ms forwards;
  pointer-events: auto;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}
```

- [ ] **Step 3: Wire ToastProvider into the branch layout**

In `src/app/[branch]/layout.tsx`, wrap children with `ToastProvider`:

```tsx
import { ToastProvider } from '@/components/ui/toast';

// In the return JSX, wrap inside BranchProvider:
<BranchProvider ...>
  <ToastProvider>
    <DocsProvider>
      {/* ... */}
    </DocsProvider>
  </ToastProvider>
</BranchProvider>
```

- [ ] **Step 4: Trigger toast from branch switcher**

Update `BranchSwitcher` to call `useToast()` on switch:

```tsx
import { useToast } from '@/components/ui/toast';

// Inside BranchSwitcher component:
const { showToast } = useToast();

function handleSwitch(branchName: string) {
  if (branchName === activeBranch) {
    setOpen(false);
    return;
  }
  const target = branches.find((b) => b.name === branchName);
  const pathWithoutBranch = pathname.replace(`/${activeBranch}`, '') || '/';
  router.push(`/${branchName}${pathWithoutBranch}`);
  showToast(`Switched to ${target?.label ?? branchName}`, target?.color);
  setOpen(false);
}
```

- [ ] **Step 5: Verify typecheck + build pass**

Run: `pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/toast/ src/components/layout/branch-switcher/index.tsx src/app/\[branch\]/layout.tsx
git commit -m "feat(branch): add toast notifications for branch switching"
```

---

## Task 12: Crossfade Transition

Add a subtle crossfade to the main content area when switching branches.

**Files:**

- Modify: `src/components/layout/app-shell/index.tsx`
- Modify: `src/components/layout/app-shell/app-shell.module.scss`

- [ ] **Step 1: Add crossfade support to AppShell**

The crossfade triggers when the branch changes. Since AppShell is a client component, it can detect branch changes via the provider.

```tsx
// src/components/layout/app-shell/index.tsx
'use client';

import { type ReactNode, useState, useEffect, useRef } from 'react';
import { useBranchData } from '@/providers/branch-provider';
import styles from './app-shell.module.scss';

interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  detail: ReactNode;
  children: ReactNode;
}

export function AppShell({ topbar, sidebar, detail, children }: AppShellProps) {
  const { activeBranch } = useBranchData();
  const [fading, setFading] = useState(false);
  const prevBranch = useRef(activeBranch);

  useEffect(() => {
    if (prevBranch.current !== activeBranch) {
      setFading(true);
      const timer = setTimeout(() => setFading(false), 300);
      prevBranch.current = activeBranch;
      return () => clearTimeout(timer);
    }
  }, [activeBranch]);

  return (
    <div className={`${styles.shell} ${styles.collapsed}`}>
      <header className={styles.topbar}>{topbar}</header>
      <nav className={styles.sidebar}>{sidebar}</nav>
      <main className={`${styles.main} ${fading ? styles.fading : ''}`}>{children}</main>
      <aside className={styles.detail}>{detail}</aside>
    </div>
  );
}
```

- [ ] **Step 2: Add crossfade CSS**

Add to `app-shell.module.scss`:

```scss
.main {
  // ... existing styles ...
  transition: opacity 150ms ease;
}

.fading {
  opacity: 0.3;
}
```

- [ ] **Step 3: Verify typecheck + build pass**

Run: `pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 4: Full manual verification**

Run: `pnpm dev`

- Navigate to `/main/data-model`
- Click "Staging" in branch switcher
- Content should fade briefly, then show staging data with wishlists entity
- Toast should appear: "Switched to Staging" with orange dot
- URL should be `/staging/data-model`
- All sidebar links should point to `/staging/*`
- Click Nessi logo → `/staging/`
- Switch back to Production → same flow in reverse

- [ ] **Step 5: Run CI checks**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck && pnpm build`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/app-shell/
git commit -m "feat(branch): add crossfade transition on branch switch"
```

---

## Post-Implementation Notes

### What's Ready for Diffing

The architecture is set up so that adding diff support requires:

1. A diff utility: `computeDiff(branchA: BranchData, branchB: BranchData) → DiffResult` — compares arrays by slug/id, detects additions/removals/modifications per domain
2. A `comparisonBranch` toggle in the UI (the provider already has the slot)
3. Visual overlay rendering on canvases (colored highlights for added/removed/changed nodes)
4. A `/diff/main...staging/*` route structure (the app routing already supports adding this)

### Future Cleanup

- `src/data/index.ts` can be simplified further once all consumers use `loadBranch()` directly
- Cross-link functions can be pre-computed per branch in the loader and stored on `BranchData`
- When moving to DB-backed storage, `loadBranch()` becomes an async function and pages add `await`
