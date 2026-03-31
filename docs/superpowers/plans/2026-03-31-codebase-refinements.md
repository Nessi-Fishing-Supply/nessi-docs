# Codebase Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 1,310-line data transformer, extract duplicate tooltip constants, add React.memo to canvas nodes, remove dead serif font, add canvas empty states, and break up oversized components.

**Architecture:** The data layer (`src/data/index.ts`) splits into focused modules under `src/data/layout/` and `src/data/transforms/` with a thin barrel re-export. Shared tooltip constants move to a single file. Canvas node components get React.memo wrappers. The architecture canvas splits its layout engine from its renderer.

**Tech Stack:** Next.js 16, React 19, TypeScript, SCSS Modules

---

## File Structure

### New files

| File                                                              | Responsibility                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/data/layout/journey-layout.ts`                               | Journey topological layout engine + back-edge detection     |
| `src/data/layout/lifecycle-layout.ts`                             | Lifecycle BFS layout + state color assignment               |
| `src/data/layout/erd-layout.ts`                                   | ERD category-clustered layout engine                        |
| `src/data/transforms/changelog.ts`                                | Changelog grouping + conventional commit parsing            |
| `src/data/transforms/entities.ts`                                 | Entity category mapping + transformation                    |
| `src/data/transforms/features.ts`                                 | Feature domain mapping, domain helpers, dashboard metrics   |
| `src/data/transforms/journeys.ts`                                 | Journey title cleaning, normalization, domain aliases       |
| `src/data/raw-types.ts`                                           | Raw interface types (RawJourneyNode, RawLifecycle, etc.)    |
| `src/features/canvas/constants/tooltip-styles.ts`                 | Shared TT_BG, TT_BORDER, TT_SHADOW, sectionLabel, monoBlock |
| `src/features/architecture/architecture-canvas/arch-layout.ts`    | Architecture layout engine (computeLayout)                  |
| `src/features/architecture/architecture-canvas/arch-tooltip.tsx`  | ArchTooltip component (extracted from index.tsx)            |
| `src/features/architecture/architecture-canvas/use-arch-trace.ts` | useArchTrace hook (extracted from index.tsx)                |
| `src/features/canvas/components/canvas-empty-state.tsx`           | "No results match your filters" overlay for canvases        |

### Modified files

| File                                                      | Changes                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| `src/data/index.ts`                                       | Slim down to imports + re-exports only (~120 lines)        |
| `src/features/canvas/components/node-tooltip.tsx`         | Import shared tooltip constants                            |
| `src/features/canvas/components/entity-tooltip.tsx`       | Import shared tooltip constants                            |
| `src/features/canvas/components/state-tooltip.tsx`        | Import shared tooltip constants                            |
| `src/features/architecture/architecture-canvas/index.tsx` | Import shared constants, extracted layout/tooltip/hook     |
| `src/features/canvas/components/step-node.tsx`            | Wrap in React.memo                                         |
| `src/features/canvas/components/entry-node.tsx`           | Wrap in React.memo, remove local TT_BG/TT_BORDER/TT_SHADOW |
| `src/features/canvas/components/decision-node.tsx`        | Wrap in React.memo                                         |
| `src/features/canvas/components/entity-node.tsx`          | Wrap in React.memo                                         |
| `src/features/canvas/components/state-node.tsx`           | Wrap in React.memo                                         |
| `src/features/journeys/journey-canvas/index.tsx`          | Add empty state when all nodes filtered                    |
| `src/features/data-model/erd-canvas/index.tsx`            | Add empty state when category filters hide all             |
| `src/features/lifecycles/lifecycle-canvas/index.tsx`      | Add empty state (if applicable)                            |
| `src/app/layout.tsx`                                      | Remove DM_Serif_Display import and variable                |

---

## Task 1: Extract raw types to `src/data/raw-types.ts`

**Files:**

- Create: `src/data/raw-types.ts`
- Modify: `src/data/index.ts`

- [ ] **Step 1: Create `src/data/raw-types.ts`**

Copy lines 41–132 from `src/data/index.ts` into the new file. These are the raw interfaces that multiple layout modules will need:

```typescript
import type { JourneyNode } from '@/types/journey';
import type { ErrorCase } from '@/types/journey';

/* ------------------------------------------------------------------ */
/*  Raw types — what the extractors produce (no x/y guaranteed)       */
/* ------------------------------------------------------------------ */

export interface RawJourneyNode {
  id: string;
  type: 'entry' | 'step' | 'decision';
  label?: string;
  title?: string;
  x?: number;
  y?: number;
  layer?: string;
  status?: string;
  route?: string;
  codeRef?: string;
  notes?: string;
  why?: string;
  tooltip?: string;
  action?: string;
  method?: string;
  errorCases?: ErrorCase[];
  ux?: JourneyNode['ux'];
  options?: JourneyNode['options'];
}

export interface RawJourneyEdge {
  from: string;
  to: string;
  opt?: string;
}

export interface RawJourney {
  slug: string;
  domain: string;
  title: string;
  persona: string;
  description: string;
  relatedIssues?: number[];
  nodes: RawJourneyNode[];
  edges: RawJourneyEdge[];
}

export interface RawLifecycleState {
  id: string;
  label: string;
}

export interface RawLifecycle {
  slug: string;
  name: string;
  badge?: string;
  description: string;
  why?: string;
  source?: 'enum' | 'check_constraint' | 'typescript';
  states: RawLifecycleState[];
  transitions: { from: string; to: string; label: string }[];
}

export interface RawErdNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
}

export interface RawEntity {
  name: string;
  label?: string;
  badges?: string[];
  fields: {
    name: string;
    type: string;
    nullable?: boolean;
    description?: string;
    isPrimaryKey?: boolean;
    default?: string;
    references?: { table: string; column: string; onDelete?: string };
  }[];
  rlsPolicies?: {
    name: string;
    operation: string;
    using?: string;
    withCheck?: string;
  }[];
  indexes?: {
    name: string;
    columns: string[];
    unique: boolean;
  }[];
  triggers?: {
    name: string;
    event: string;
    timing: string;
    function: string;
  }[];
}
```

- [ ] **Step 2: Remove raw types from `src/data/index.ts`**

Delete lines 41–132 (the raw interface block) from `index.ts` and add:

```typescript
import type {
  RawJourneyNode,
  RawJourneyEdge,
  RawJourney,
  RawLifecycle,
  RawLifecycleState,
  RawErdNode,
  RawEntity,
} from './raw-types';
```

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS with no type errors

- [ ] **Step 4: Commit**

```bash
git add src/data/raw-types.ts src/data/index.ts
git commit -m "refactor(data): extract raw types to dedicated module"
```

---

## Task 2: Extract journey layout engine to `src/data/layout/journey-layout.ts`

**Files:**

- Create: `src/data/layout/journey-layout.ts`
- Modify: `src/data/index.ts`

- [ ] **Step 1: Create `src/data/layout/journey-layout.ts`**

Move lines 135–596 from `src/data/index.ts` (everything from the layout constants through `normalizeNodes`, `idToLabel`, `cleanJourneyTitle`, `DOMAIN_ALIASES`, `transformJourneys`, `detectJourneyBackEdges`).

```typescript
import type { Journey, JourneyNode, JourneyEdge } from '@/types/journey';
import type { RawJourneyNode, RawJourneyEdge, RawJourney } from '../raw-types';

/* ------------------------------------------------------------------ */
/*  Journey Horizontal Layout Engine                                   */
/*  Topological layering with decision-aware vertical positioning      */
/* ------------------------------------------------------------------ */

const NODE_W = 200;
const NODE_H = 80;
const H_GAP = 100;
const V_GAP = 100;
const MULTI_ENTRY_GAP = 200;

// ... paste layoutJourneyNodes function (lines 145-469)
// ... paste detectJourneyBackEdges function (lines 477-561)
// ... paste cleanJourneyTitle function (lines 563-576)
// ... paste idToLabel function (lines 578-587)
// ... paste normalizeNodes function (lines 590-595)
// ... paste DOMAIN_ALIASES (lines 598-600)
// ... paste transformJourneys function (lines 602-613)

export { transformJourneys, detectJourneyBackEdges };
```

The file should contain all journey-related layout and transformation logic, exported as `transformJourneys` and `detectJourneyBackEdges`.

- [ ] **Step 2: Update `src/data/index.ts`**

Remove lines 135–613 and replace with:

```typescript
import { transformJourneys, detectJourneyBackEdges } from './layout/journey-layout';
export { detectJourneyBackEdges };
```

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/data/layout/journey-layout.ts src/data/index.ts
git commit -m "refactor(data): extract journey layout engine to dedicated module"
```

---

## Task 3: Extract lifecycle layout to `src/data/layout/lifecycle-layout.ts`

**Files:**

- Create: `src/data/layout/lifecycle-layout.ts`
- Modify: `src/data/index.ts`

- [ ] **Step 1: Create `src/data/layout/lifecycle-layout.ts`**

Move the lifecycle section (lines 615–728 in the original, after Task 2 removal adjust accordingly). This includes `LC_NODE_W/H/H_GAP/V_GAP`, `STATE_COLOR_MAP`, `DEFAULT_STATE_COLOR`, `getStateColor`, and `transformLifecycles`.

```typescript
import type { Lifecycle } from '@/types/lifecycle';
import type { RawLifecycle } from '../raw-types';

/* ------------------------------------------------------------------ */
/*  Lifecycle Layout + Color Assignment                                */
/*  Topological sort via transitions → left-to-right positions        */
/* ------------------------------------------------------------------ */

const LC_NODE_W = 140;
const LC_NODE_H = 60;
const LC_H_GAP = 140;
const LC_V_GAP = 120;

const STATE_COLOR_MAP: Record<string, string> = {
  sold: '#3d8c75',
  accepted: '#3d8c75',
  completed: '#3d8c75',
  active: '#4a9e7a',
  published: '#4a9e7a',
  draft: '#78756f',
  pending: '#b8860b',
  deleted: '#b84040',
  revoked: '#b84040',
  cancelled: '#b84040',
  rejected: '#b84040',
  archived: '#6b6966',
  deactivated: '#6b6966',
  expired: '#a0522d',
  reserved: '#5f7fbf',
};
const DEFAULT_STATE_COLOR = '#78756f';

function getStateColor(stateId: string): string {
  return STATE_COLOR_MAP[stateId] ?? DEFAULT_STATE_COLOR;
}

// ... paste transformLifecycles function (lines 648-728)

export { transformLifecycles };
```

- [ ] **Step 2: Update `src/data/index.ts`**

Remove the lifecycle section and add:

```typescript
import { transformLifecycles } from './layout/lifecycle-layout';
```

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/data/layout/lifecycle-layout.ts src/data/index.ts
git commit -m "refactor(data): extract lifecycle layout to dedicated module"
```

---

## Task 4: Extract ERD layout to `src/data/layout/erd-layout.ts`

**Files:**

- Create: `src/data/layout/erd-layout.ts`
- Modify: `src/data/index.ts`

- [ ] **Step 1: Create `src/data/layout/erd-layout.ts`**

Move the ERD section (section 4 in the original, lines ~912–1071). This includes `ErdCategoryGroup` interface, all `ERD_*` constants, `ERD_CATEGORY_ORDER`, `_erdCategoryGroups`, `transformErdNodes`, and `getErdCategoryGroups`.

Also needs `ENTITY_CATEGORY_MAP` from the entity categorization section.

```typescript
import type { ErdNode } from '@/types/entity-relationship';
import type { RawErdNode, RawEntity } from '../raw-types';
import { ENTITY_CATEGORY_MAP } from '../transforms/entities';

/* ------------------------------------------------------------------ */
/*  ERD Category-Clustered Layout                                      */
/*  Groups entities by category into containers, lays out in 2 cols   */
/* ------------------------------------------------------------------ */

export interface ErdCategoryGroup {
  key: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const ERD_NODE_W = 160;
const ERD_NODE_H = 52;
const ERD_NODE_GAP_X = 80;
const ERD_NODE_GAP_Y = 70;
const ERD_GROUP_PADDING = 32;
const ERD_GROUP_HEADER = 36;
const ERD_GROUP_GAP = 100;
const ERD_GROUP_COL_GAP = 160;
const ERD_NODES_PER_ROW = 3;

const ERD_CATEGORY_ORDER: { key: string; label: string; color: string }[] = [
  { key: 'core', label: 'Core', color: '#3d8c75' },
  { key: 'shops', label: 'Shop Management', color: '#d4923a' },
  { key: 'commerce', label: 'Commerce', color: '#e27739' },
  { key: 'social', label: 'Social', color: '#9b7bd4' },
  { key: 'messaging', label: 'Messaging', color: '#5b9fd6' },
  { key: 'content', label: 'Content & Discovery', color: '#5bbfcf' },
  { key: 'user', label: 'User', color: '#8a8580' },
];

let _erdCategoryGroups: ErdCategoryGroup[] = [];

// ... paste transformErdNodes function (lines 949-1067)
// ... paste getErdCategoryGroups function (lines 1069-1071)

export { transformErdNodes, getErdCategoryGroups };
```

**Important:** This file imports `ENTITY_CATEGORY_MAP` from `../transforms/entities`, so Task 5 (entities) must be created first or simultaneously. If executing sequentially, create the entities file first (Task 5) then come back to wire this up.

- [ ] **Step 2: Update `src/data/index.ts`**

Remove the ERD section and add:

```typescript
import { transformErdNodes, getErdCategoryGroups } from './layout/erd-layout';
export type { ErdCategoryGroup } from './layout/erd-layout';
export { getErdCategoryGroups };
```

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/data/layout/erd-layout.ts src/data/index.ts
git commit -m "refactor(data): extract ERD layout to dedicated module"
```

---

## Task 5: Extract entity + feature transforms

**Files:**

- Create: `src/data/transforms/entities.ts`
- Create: `src/data/transforms/features.ts`
- Create: `src/data/transforms/changelog.ts`
- Create: `src/data/transforms/journeys.ts` (re-exports for cross-link helpers)
- Modify: `src/data/index.ts`

- [ ] **Step 1: Create `src/data/transforms/entities.ts`**

Extract `ENTITY_CATEGORY_MAP` and `transformEntities`:

```typescript
import type { Entity } from '@/types/data-model';
import type { RawEntity } from '../raw-types';

/* ------------------------------------------------------------------ */
/*  Entity Categorization                                              */
/*  Map table names → semantic categories for entity list badges      */
/* ------------------------------------------------------------------ */

export const ENTITY_CATEGORY_MAP: Record<string, string> = {
  members: 'core',
  shops: 'core',
  listings: 'core',
  cart_items: 'core',
  shop_members: 'shops',
  shop_roles: 'shops',
  shop_invites: 'shops',
  shop_ownership_transfers: 'shops',
  offers: 'commerce',
  watchers: 'commerce',
  price_drop_notifications: 'commerce',
  follows: 'social',
  member_blocks: 'social',
  flags: 'social',
  message_threads: 'messaging',
  message_thread_participants: 'messaging',
  messages: 'messaging',
  listing_photos: 'content',
  recently_viewed: 'content',
  search_suggestions: 'content',
  addresses: 'user',
  slugs: 'user',
};

export function transformEntities(raw: RawEntity[]): Entity[] {
  return raw.map((e) => ({
    ...e,
    badge: ENTITY_CATEGORY_MAP[e.name] ?? 'system',
  }));
}
```

- [ ] **Step 2: Create `src/data/transforms/features.ts`**

Extract `FEATURE_TO_DOMAIN`, `SCOPE_TO_DOMAIN`, `hasProductSurface`, `getFeatureDomains`, `getFeaturesByDomain`, `getDomainForScope`, `getChangelogByDomain`, `getDashboardMetrics`:

```typescript
import type { Feature } from '@/types/feature';
import type { ApiGroup } from '@/types/api-contract';
import type { FeatureDomain, DashboardMetrics } from '@/types/dashboard';
import type { ChangelogEntry } from '@/types/changelog';
import type { RawJourney, RawEntity } from '../raw-types';
import { DOMAINS } from '@/constants/domains';
import { transformChangelog } from './changelog';

import apiContractsRaw from '../generated/api-contracts.json';
import featuresRaw from '../generated/features.json';
import journeysRaw from '../generated/journeys.json';
import dataModelRaw from '../generated/data-model.json';
import changelogRaw from '../generated/changelog.json';

// ... paste FEATURE_TO_DOMAIN (lines 779-798)
// ... paste SCOPE_TO_DOMAIN (lines 800-829)
// ... paste hasProductSurface (lines 831-835)
// ... paste getFeatureDomains (lines 837-864)
// ... paste getFeaturesByDomain (lines 866-869)
// ... paste getDomainForScope (lines 871-873)
// ... paste getChangelogByDomain (lines 875-894)
// ... paste getDashboardMetrics (lines 896-910)

export {
  getFeatureDomains,
  getFeaturesByDomain,
  getDomainForScope,
  getChangelogByDomain,
  getDashboardMetrics,
};
```

- [ ] **Step 3: Create `src/data/transforms/changelog.ts`**

Extract `TYPE_TO_CHANGE_TYPE` and `transformChangelog`:

```typescript
import type { ChangelogEntry, ChangelogChange, ChangeType } from '@/types/changelog';

/* ------------------------------------------------------------------ */
/*  Changelog Grouping                                                 */
/*  Flat PR entries → grouped by date with change types                */
/* ------------------------------------------------------------------ */

const TYPE_TO_CHANGE_TYPE: Record<string, ChangeType> = {
  feature: 'added',
  fix: 'fixed',
  refactor: 'changed',
  chore: 'changed',
  docs: 'changed',
};

export function transformChangelog(
  raw: {
    title?: string;
    mergedAt?: string;
    type?: string;
    area?: string;
    number?: number;
    url?: string;
  }[],
): ChangelogEntry[] {
  // ... paste full function body (lines 1096-1124)
  const byDate = new Map<string, ChangelogChange[]>();

  for (const entry of raw) {
    const date = entry.mergedAt ? entry.mergedAt.slice(0, 10) : 'unknown';
    if (!byDate.has(date)) byDate.set(date, []);

    const description = (entry.title ?? '')
      .replace(
        /^(feat|fix|chore|refactor|docs|style|test|perf|ci|build|revert)(\([^)]*\))?:\s*/i,
        '',
      )
      .replace(/^#\d+\s*/, '');

    byDate.get(date)!.push({
      type: TYPE_TO_CHANGE_TYPE[entry.type ?? ''] ?? 'changed',
      description: description || entry.title || 'No description',
      area: entry.area,
      prNumber: entry.number,
      prUrl: entry.url,
    });
  }

  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, changes]) => ({ date, changes }));
}
```

- [ ] **Step 4: Update `src/data/index.ts`**

Remove all the extracted sections and replace with imports. The remaining `index.ts` should be ~120 lines: imports, JSON imports, static exports, and helper functions (journey/domain/lifecycle/architecture helpers that reference the `journeys` and `lifecycles` module-level arrays, plus the cross-link helpers `getLinksForRoute`, `getErrorsForEndpoint`, `getLinksForEndpoint`).

```typescript
import { transformEntities } from './transforms/entities';
import { transformChangelog } from './transforms/changelog';
import {
  getFeatureDomains,
  getFeaturesByDomain,
  getDomainForScope,
  getChangelogByDomain,
  getDashboardMetrics,
} from './transforms/features';
export {
  getFeatureDomains,
  getFeaturesByDomain,
  getDomainForScope,
  getChangelogByDomain,
  getDashboardMetrics,
};
```

- [ ] **Step 5: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/data/transforms/ src/data/index.ts
git commit -m "refactor(data): extract entity, feature, and changelog transforms"
```

---

## Task 6: Extract shared tooltip constants

**Files:**

- Create: `src/features/canvas/constants/tooltip-styles.ts`
- Modify: `src/features/canvas/components/node-tooltip.tsx`
- Modify: `src/features/canvas/components/entity-tooltip.tsx`
- Modify: `src/features/canvas/components/state-tooltip.tsx`
- Modify: `src/features/canvas/components/entry-node.tsx`
- Modify: `src/features/architecture/architecture-canvas/index.tsx`

- [ ] **Step 1: Create `src/features/canvas/constants/tooltip-styles.ts`**

```typescript
export const TT_BG = 'rgba(15,19,25,0.97)';
export const TT_BORDER = 'rgba(255,255,255,0.12)';
export const TT_SHADOW = '0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.3)';

export const sectionLabel: React.CSSProperties = {
  fontSize: '9px',
  color: '#4a4840',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '3px',
};

export const monoBlock: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'var(--font-family-mono)',
  background: 'rgba(255,255,255,0.04)',
  padding: '4px 8px',
  borderRadius: '4px',
};
```

- [ ] **Step 2: Update `node-tooltip.tsx`**

Remove lines 10–28 (local `TT_BG`, `TT_BORDER`, `TT_SHADOW`, `sectionLabel`, `monoBlock` declarations) and add:

```typescript
import { TT_BG, TT_BORDER, TT_SHADOW, sectionLabel, monoBlock } from '../constants/tooltip-styles';
```

- [ ] **Step 3: Update `entity-tooltip.tsx`**

Same change — remove lines 11–29 and add the import.

- [ ] **Step 4: Update `state-tooltip.tsx`**

Remove lines 8–18 (local `TT_BG`, `TT_BORDER`, `TT_SHADOW`, `sectionLabel`) and add:

```typescript
import { TT_BG, TT_BORDER, TT_SHADOW, sectionLabel } from '../constants/tooltip-styles';
```

- [ ] **Step 5: Update `entry-node.tsx`**

Remove local `TT_BG`, `TT_BORDER`, `TT_SHADOW` declarations (lines ~8–10) and add:

```typescript
import { TT_BG, TT_BORDER, TT_SHADOW } from '../constants/tooltip-styles';
```

- [ ] **Step 6: Update `architecture-canvas/index.tsx`**

Remove lines 27–29 (local tooltip constants) and add:

```typescript
import {
  TT_BG,
  TT_BORDER,
  TT_SHADOW,
  sectionLabel,
} from '@/features/canvas/constants/tooltip-styles';
```

- [ ] **Step 7: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/canvas/constants/tooltip-styles.ts \
  src/features/canvas/components/node-tooltip.tsx \
  src/features/canvas/components/entity-tooltip.tsx \
  src/features/canvas/components/state-tooltip.tsx \
  src/features/canvas/components/entry-node.tsx \
  src/features/architecture/architecture-canvas/index.tsx
git commit -m "refactor(canvas): extract shared tooltip styles to constants module"
```

---

## Task 7: Wrap canvas node components in React.memo

**Files:**

- Modify: `src/features/canvas/components/step-node.tsx`
- Modify: `src/features/canvas/components/entry-node.tsx`
- Modify: `src/features/canvas/components/decision-node.tsx`
- Modify: `src/features/canvas/components/entity-node.tsx`
- Modify: `src/features/canvas/components/state-node.tsx`

- [ ] **Step 1: Wrap `StepNode` in React.memo**

In `step-node.tsx`, change:

```typescript
// Before
import { useState } from 'react';
// ...
export function StepNode({ node, isSelected, isDimmed, onClick }: StepNodeProps) {
```

To:

```typescript
// After
import { useState, memo } from 'react';
// ...
export const StepNode = memo(function StepNode({
  node,
  isSelected,
  isDimmed,
  onClick,
}: StepNodeProps) {
  // ... existing body unchanged ...
});
```

Add closing `);` at the end of the function.

- [ ] **Step 2: Wrap `EntryNode` in React.memo**

Same pattern in `entry-node.tsx`:

```typescript
import { useState, memo } from 'react';
// ...
export const EntryNode = memo(function EntryNode({
  x,
  y,
  label,
  isDimmed,
  isActive,
  meta,
  onClick,
}: EntryNodeProps) {
  // ... existing body ...
});
```

- [ ] **Step 3: Wrap `DecisionNode` in React.memo**

Same pattern in `decision-node.tsx`:

```typescript
import { useState, memo } from 'react';
// ...
export const DecisionNode = memo(function DecisionNode({
  x,
  y,
  label,
  options,
  chosenOpt,
  isDimmed,
  onChoose,
}: DecisionNodeProps) {
  // ... existing body ...
});
```

- [ ] **Step 4: Wrap `EntityNode` in React.memo**

Same pattern in `entity-node.tsx`:

```typescript
import { useState, memo } from 'react';
// ...
export const EntityNode = memo(function EntityNode({ node, isSelected, onClick }: EntityNodeProps) {
  // ... existing body ...
});
```

- [ ] **Step 5: Wrap `StateNode` in React.memo**

Same pattern in `state-node.tsx`:

```typescript
import { useState, memo } from 'react';
// ...
export const StateNode = memo(function StateNode({ state, isSelected, onClick }: StateNodeProps) {
  // ... existing body ...
});
```

- [ ] **Step 6: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/canvas/components/step-node.tsx \
  src/features/canvas/components/entry-node.tsx \
  src/features/canvas/components/decision-node.tsx \
  src/features/canvas/components/entity-node.tsx \
  src/features/canvas/components/state-node.tsx
git commit -m "perf(canvas): wrap node components in React.memo"
```

---

## Task 8: Remove dead serif font

**Files:**

- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Remove serif font from layout.tsx**

In `src/app/layout.tsx`:

1. Remove the `DM_Serif_Display` import from the `next/font/google` import line:

```typescript
// Before
import { DM_Sans, DM_Serif_Display } from 'next/font/google';

// After
import { DM_Sans } from 'next/font/google';
```

2. Remove lines 21–26 (the `dmSerif` const):

```typescript
// Remove this entire block
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif',
  weight: '400',
});
```

3. Remove `${dmSerif.variable}` from the html className on line 35:

```typescript
// Before
<html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>

// After
<html lang="en" className={dmSans.variable}>
```

- [ ] **Step 2: Check for any remaining `--font-dm-serif` references**

Run: `grep -r "font-dm-serif\|DM_Serif\|dm-serif" src/`

If any SCSS/CSS files reference `--font-dm-serif`, remove those references too. Based on CLAUDE.md, the serif font is no longer applied anywhere, so this should find nothing meaningful.

- [ ] **Step 3: Verify build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS (build confirms no runtime references to the removed font)

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "chore: remove unused DM Serif Display font"
```

---

## Task 9: Add canvas empty state component + wire into canvases

**Files:**

- Create: `src/features/canvas/components/canvas-empty-state.tsx`
- Create: `src/features/canvas/components/canvas-empty-state.module.scss`
- Modify: `src/features/journeys/journey-canvas/index.tsx`

- [ ] **Step 1: Create `canvas-empty-state.module.scss`**

```scss
.wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  border-radius: 12px;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 13px;
  pointer-events: auto;
}

.icon {
  font-size: 24px;
  opacity: 0.5;
}
```

- [ ] **Step 2: Create `canvas-empty-state.tsx`**

```tsx
import styles from './canvas-empty-state.module.scss';

interface CanvasEmptyStateProps {
  message?: string;
}

export function CanvasEmptyState({
  message = 'No items match the current filters.',
}: CanvasEmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.icon}>⊘</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire into journey canvas**

In `src/features/journeys/journey-canvas/index.tsx`, add the import and compute visible count:

```typescript
import { CanvasEmptyState } from '@/features/canvas/components/canvas-empty-state';
```

After the `isNodeVisible` function, compute whether any nodes are visible:

```typescript
const hasVisibleNodes = journey.nodes.some(isNodeVisible);
```

Then, inside the `CanvasProvider` render, before the SVG content or right after the toolbar, add:

```tsx
{
  !hasVisibleNodes && <CanvasEmptyState />;
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/canvas/components/canvas-empty-state.tsx \
  src/features/canvas/components/canvas-empty-state.module.scss \
  src/features/journeys/journey-canvas/index.tsx
git commit -m "feat(canvas): add empty state when all nodes are filtered out"
```

---

## Task 10: Split architecture canvas into layout + tooltip + hook

**Files:**

- Create: `src/features/architecture/architecture-canvas/arch-layout.ts`
- Create: `src/features/architecture/architecture-canvas/arch-tooltip.tsx`
- Create: `src/features/architecture/architecture-canvas/use-arch-trace.ts`
- Modify: `src/features/architecture/architecture-canvas/index.tsx`

- [ ] **Step 1: Create `arch-layout.ts`**

Extract `computeLayout` (lines 50–104 of architecture-canvas/index.tsx), the layout constants (lines 14–21), `PositionedNode` interface (lines 35–40), and `LAYER_HEADER_HEIGHT`:

```typescript
import type { ArchDiagram, ArchNode } from '@/types/architecture';

export const LAYER_PADDING = 28;
export const LAYER_GAP = 60;
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 58;
export const NODE_GAP_X = 50;
export const NODE_GAP_Y = 40;
export const NODES_PER_ROW = 4;
export const LAYER_HEADER_HEIGHT = 36;

export interface PositionedNode {
  node: ArchNode;
  layerId: string;
  x: number;
  y: number;
}

export interface LayoutResult {
  positionedNodes: PositionedNode[];
  layerRects: { id: string; label: string; x: number; y: number; w: number; h: number }[];
  totalW: number;
  totalH: number;
}

// ... paste computeLayout function
export function computeLayout(diagram: ArchDiagram): LayoutResult {
  // ... full body from lines 50-104
}
```

- [ ] **Step 2: Create `use-arch-trace.ts`**

Extract the `useArchTrace` hook (lines 110–149):

```typescript
import { useState, useCallback } from 'react';
import type { ArchDiagram } from '@/types/architecture';

// ... paste full useArchTrace hook
export function useArchTrace(diagram: ArchDiagram) {
  // ... full body from lines 110-149
}
```

- [ ] **Step 3: Create `arch-tooltip.tsx`**

Extract the `ArchTooltip` component (lines 187–397). It needs the `TT_BG`, `TT_BORDER`, `TT_SHADOW` imports from the shared constants:

```tsx
'use client';

import type { ArchNode, ArchConnection } from '@/types/architecture';
import {
  TT_BG,
  TT_BORDER,
  TT_SHADOW,
  sectionLabel,
} from '@/features/canvas/constants/tooltip-styles';
import { NODE_WIDTH } from './arch-layout';

// ... paste full ArchTooltip component and its props interface
```

- [ ] **Step 4: Update `architecture-canvas/index.tsx`**

Replace extracted code with imports:

```typescript
import {
  computeLayout,
  NODE_WIDTH,
  NODE_HEIGHT,
  LAYER_PADDING,
  type PositionedNode,
} from './arch-layout';
import { useArchTrace } from './use-arch-trace';
import { ArchTooltip } from './arch-tooltip';
```

Remove the local layout constants, `computeLayout`, `useArchTrace`, `ArchTooltip`, and the local tooltip constants. The file should shrink from ~730 lines to ~350 lines (just rendering logic + edge paths).

- [ ] **Step 5: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/architecture/architecture-canvas/
git commit -m "refactor(architecture): split canvas into layout, tooltip, and trace hook modules"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full CI checks**

```bash
pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck && pnpm build
```

Expected: All pass.

- [ ] **Step 2: Verify `src/data/index.ts` line count**

```bash
wc -l src/data/index.ts
```

Expected: ~120–150 lines (down from 1,310).

- [ ] **Step 3: Visual spot-check**

Run `pnpm dev` and verify:

- Journey canvases render correctly
- ERD canvas shows category clusters
- Lifecycle canvas shows state transitions
- Architecture canvas shows layers + tooltip works
- Filter to empty state shows the "No items match" message
- Tooltips appear and style correctly across all canvases
