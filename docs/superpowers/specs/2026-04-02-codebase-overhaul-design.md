# Codebase Overhaul — Architecture & Component System Redesign

> A 7-phase plan to consolidate nessi-docs from a fast-shipped prototype into a scalable, consistent, enterprise-ready codebase. Every phase is independently deliverable. Each builds on the last.

**Date:** 2026-04-02
**Author:** Kyle Holloway + Claude
**Status:** Draft

---

## Problem Statement

The nessi-docs codebase was built feature-first at high velocity. This produced a working product with strong UX — but accumulated significant technical debt:

- **7 duplicate definitions** of the same diff color values across TypeScript and SCSS
- **5 canvas node components** each reimplementing identical diff logic, hover state, and opacity calculations
- **4 tooltip implementations** totaling 1,387 lines with 108 inline style objects
- **3 separate badge/pill implementations** with duplicated styling
- **32+ files** with hardcoded font sizes instead of design tokens
- **250+ inline style objects** in canvas components
- **8 files** duplicating the same `pointer-events: none` / `opacity` diff pattern
- **No shared layout mixins** despite 25+ files repeating the same flex patterns

The cost is concrete: today's polish session spent significant time fixing the same issue (pill styling, diff badges, pointer-events, font sizes) across 8+ files. Every new feature multiplies this tax.

With the Archway product vision (multi-tenant SaaS with customer-owned canvases and themes), this architecture cannot scale. A customer requesting a custom theme would require touching 50+ files. A new canvas node type requires copying 200+ lines of boilerplate.

---

## Solution Overview

Seven phases, executed sequentially. Each phase has clear boundaries, is independently testable, and produces a working codebase at completion.

| Phase | Name              | Focus                                                | Estimated Scope                       |
| ----- | ----------------- | ---------------------------------------------------- | ------------------------------------- |
| 1     | Foundation        | Design tokens, SCSS system, shared constants         | Token files, mixins, migration sweep  |
| 2     | Component Library | Unified UI primitives, categorical organization      | ~20 components, barrel exports        |
| 3     | Canvas Refactor   | Shared node system, tooltip unification              | 5 nodes, 4 tooltips, hooks/utilities  |
| 4     | State Management  | Zustand + TanStack Query, mode system                | Store, hooks, provider migration      |
| 5     | Responsive Design | Tablet + mobile layouts                              | Breakpoint system, layout adaptations |
| 6     | Animation System  | Transitions, micro-interactions, mode animations     | Animation library, page orchestration |
| 7     | API Abstraction   | Service layer, query hooks, future-proof data access | Services, TanStack Query integration  |

---

## Organizational Model

Adopt the nessi-web-app's categorical component structure:

```
src/
├── components/
│   ├── controls/          # Interactive elements (button, toggle, search-input)
│   ├── indicators/        # Status display (badge, pill, diff-indicator, toast)
│   ├── layout/            # Structural (app-shell, detail-panel, page-header, collapsible-row, filter-bar)
│   ├── navigation/        # Nav (sidebar, topbar, breadcrumb, branch-switcher, comparison-selector)
│   ├── data-display/      # Content rendering (key-value-row, field-table, cross-link, github-link)
│   └── canvas/            # SVG canvas components (nodes, tooltips, edges, canvas-provider)
├── features/              # Feature-scoped components (journeys, data-model, api-map, etc.)
├── stores/                # Zustand stores
├── hooks/                 # Shared hooks
├── services/              # Data access layer (Phase 7)
├── constants/             # Shared constants
├── styles/                # Design tokens, mixins, utilities
├── types/                 # TypeScript types
└── app/                   # Next.js routes
```

Each category has a barrel `index.ts` export. Feature directories follow the web-app pattern: `components/`, `hooks/`, `constants/`, `types/` subdirectories as needed.

---

## Phase 1: Foundation — Design Tokens & Style System

### Goal

Establish the substrate everything else builds on. No component logic changes — just the token system, SCSS utilities, and shared constants.

### Token System

Mirror the web-app's naming conventions with docs-specific values.

**`src/styles/variables/colors.scss`**

Two-layer system for theme support:

```scss
// Primitive palette — raw colors, never change between themes
:root {
  --color-green-50: #f0fdf4;
  --color-green-500: #3d8c75;
  --color-green-700: #2d6b59;
  // ... full scale for primary, accent, neutral, destructive, status colors
}

// Semantic tokens — what components use, resolve per theme
:root,
[data-theme='dark'] {
  --bg-page: var(--color-neutral-950);
  --bg-panel: var(--color-neutral-900);
  --bg-raised: var(--color-neutral-850);
  --bg-hover: var(--color-neutral-800);
  --bg-input: var(--color-neutral-875);
  --text-primary: var(--color-neutral-100);
  --text-secondary: var(--color-neutral-300);
  --text-muted: var(--color-neutral-500);
  --text-dim: var(--color-neutral-600);
  --border-subtle: rgba(255 255 255 / 6%);
  --border-medium: rgba(255 255 255 / 10%);
  --border-strong: rgba(255 255 255 / 16%);
  --diff-added: var(--color-green-500);
  --diff-modified: var(--color-blue-400);
  --diff-removed: var(--color-red-500);
  --diff-added-bg: rgb(61 140 117 / 12%);
  --diff-modified-bg: rgb(123 143 205 / 12%);
  --diff-removed-bg: rgb(184 64 64 / 12%);
  --diff-added-border: rgb(61 140 117 / 22%);
  --diff-modified-border: rgb(123 143 205 / 22%);
  --diff-removed-border: rgb(184 64 64 / 22%);
}

[data-theme='light'] {
  --bg-page: var(--color-neutral-50);
  --bg-panel: #ffffff;
  --bg-raised: var(--color-neutral-100);
  --bg-hover: var(--color-neutral-150);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-700);
  --text-muted: var(--color-neutral-500);
  --text-dim: var(--color-neutral-400);
  --border-subtle: rgba(0 0 0 / 6%);
  --border-medium: rgba(0 0 0 / 10%);
  --border-strong: rgba(0 0 0 / 16%);
  // Diff colors — same hues, adjusted for light backgrounds
  --diff-added-bg: rgb(61 140 117 / 8%);
  --diff-modified-bg: rgb(123 143 205 / 8%);
  --diff-removed-bg: rgb(184 64 64 / 8%);
}
```

**`src/styles/variables/spacing.scss`**

```scss
:root {
  --spacing-50: 2px;
  --spacing-100: 4px;
  --spacing-200: 8px;
  --spacing-300: 12px;
  --spacing-400: 16px;
  --spacing-500: 20px;
  --spacing-600: 24px;
  --spacing-700: 28px;
  --spacing-800: 32px;
  --spacing-900: 40px;
  --spacing-1000: 48px;
  --spacing-1100: 64px;
  --spacing-1200: 80px;
  --page-margin: var(--spacing-600);
  --page-margin-mobile: var(--spacing-400);
}
```

**`src/styles/variables/typography.scss`**
Complete scale with named sizes. Font sizes tuned for information-dense dark UI:

```scss
:root {
  --font-family-body: 'DM Sans', sans-serif;
  --font-family-mono: 'DM Mono', 'SF Mono', monospace;
  --font-size-50: 9px;
  --font-size-100: 10px;
  --font-size-200: 11px;
  --font-size-300: 12px;
  --font-size-400: 13px;
  --font-size-500: 14px;
  --font-size-600: 16px;
  --font-size-700: 18px;
  --font-size-800: 20px;
  --font-size-900: 24px;
  --font-size-1000: 28px;
  --font-size-1100: 32px;
  --font-size-1200: 40px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --line-height-tight: 1.2;
  --line-height-normal: 1.4;
  --line-height-relaxed: 1.6;
}
```

**Additional token files:** `shadows.scss`, `radius.scss`, `z-index.scss`, `animations.scss` — same pattern, named scales.

### SCSS Mixins

**`src/styles/mixins/layout.scss`**

```scss
@mixin flex-row($gap: var(--spacing-200)) {
  display: flex;
  align-items: center;
  gap: $gap;
}

@mixin flex-col($gap: var(--spacing-200)) {
  display: flex;
  flex-direction: column;
  gap: $gap;
}

@mixin overflow-scroll {
  overflow-y: auto;
  scrollbar-width: thin;
}
```

**`src/styles/mixins/diff.scss`**

```scss
@mixin diff-row($status) {
  border-left: 2px solid var(--diff-#{$status});
  background: var(--diff-#{$status}-bg);
  @if $status == 'removed' {
    opacity: 0.7;
  }
}
```

### Shared Constants

**`src/constants/diff.ts`**
Single TypeScript source for diff colors consumed by canvas components:

```typescript
export const DIFF_COLORS: Record<string, string> = {
  added: 'var(--diff-added)',
  modified: 'var(--diff-modified)',
  removed: 'var(--diff-removed)',
};

export const DIFF_STATUS_CONFIG = {
  added: { label: 'New', color: '#3d8c75', bg: 'rgba(61,140,117,0.12)' },
  modified: { label: 'Modified', color: '#7b8fcd', bg: 'rgba(123,143,205,0.12)' },
  removed: { label: 'Removed', color: '#b84040', bg: 'rgba(184,64,64,0.12)' },
} as const;
```

### Migration Sweep

File-by-file replacement of hardcoded values with token references. Zero behavior changes. Success criteria: no hardcoded font sizes, colors, or spacing values outside the token files.

---

## Phase 2: Component Library — Unified Primitives

### Goal

Consolidate all UI primitives into the categorical structure. Every repeated UI pattern gets one canonical component.

### Component Inventory

**indicators/**

| Component       | Replaces                                                        | Variants                              |
| --------------- | --------------------------------------------------------------- | ------------------------------------- |
| `Badge`         | `badge/`, `diff-badge/`, inline tooltip badges                  | `category`, `method`, `diff`, `count` |
| `Pill`          | `diff-filter-bar` pills, domain grid pills, toolbar count pills | `filter`, `status`, `count`           |
| `DiffIndicator` | Sidebar multi-dot indicator                                     | (single implementation)               |
| `Toast`         | existing toast                                                  | (no change needed)                    |

`Badge` is the workhorse. One component, multiple variants:

```tsx
<Badge variant="diff" status="added" count={3} />     // "New (3)" pill
<Badge variant="diff" status="modified" />              // "Modified" pill
<Badge variant="category">CORE</Badge>                  // Category badge
<Badge variant="method" method="GET" />                  // HTTP method badge
```

**layout/**

| Component        | Replaces                                                                             | Purpose                                   |
| ---------------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| `CollapsibleRow` | Entity row, endpoint row, config block, lifecycle row, architecture row, feature row | Shared expandable row with diff-awareness |
| `FilterBar`      | Category filters, group filters, method filters, diff status filters                 | Mode-aware filter component               |
| `PageHeader`     | existing (stays)                                                                     | No change needed                          |
| `SectionLabel`   | existing (stays)                                                                     | No change needed                          |
| `DetailPanel`    | existing (restructured)                                                              | Cleaner variant switching                 |
| `FieldTable`     | Entity field table, endpoint request fields, config values table                     | Shared table with diff highlighting       |

`CollapsibleRow` is the biggest win. Currently 6 different row implementations with the same accordion + border-trace + diff-status + stagger-entry pattern:

```tsx
<CollapsibleRow
  id={entity.name}
  diffStatus="modified"
  isOpen={isOpen}
  onToggle={toggle}
  header={<EntityRowHeader entity={entity} />}
  staggerIndex={idx}
>
  <EntityExpansion entity={entity} changedFields={changes} />
</CollapsibleRow>
```

**data-display/**

`FieldTable` consolidates the repeated pattern of name/type/value rows with diff highlighting:

```tsx
<FieldTable
  fields={entity.fields}
  columns={['name', 'type', 'default', 'ref']}
  addedFields={addedFields}
  changedFieldNames={changedFieldNames}
/>
```

### Barrel Exports

Each category exports everything from `index.ts`:

```typescript
// src/components/indicators/index.ts
export { Badge } from './badge';
export { Pill } from './pill';
export { DiffIndicator } from './diff-indicator';
export { Toast, useToast } from './toast';
```

Consumer imports:

```typescript
import { Badge, Pill } from '@/components/indicators';
import { CollapsibleRow, FilterBar } from '@/components/layout';
```

---

## Phase 3: Canvas Refactor — Shared Node System & Tooltip Unification

### Goal

Eliminate 5x node duplication and 4x tooltip duplication. Build a composable system that scales to new node types.

### Node System

**`useNodeState` hook:**

```typescript
function useNodeState({
  diffStatus,
  isGhost,
  isTraceActive,
  isSelected,
  isHovered,
}: NodeStateInput): NodeStateOutput {
  return {
    opacity, // Computed from diff/ghost/trace state
    isInteractive, // Whether clicks/hovers are enabled
    pointerEvents, // 'auto' | 'none'
    glowColor, // Selection glow radial gradient
    borderStyle, // Solid, dashed (diff ring), or none
    diffRingColor, // Color for diff mode dashed border
    cursorStyle, // 'pointer' | 'default'
  };
}
```

Every node component calls `useNodeState` instead of reimplementing the same 15 lines.

**`nodeStyles` utility:**
Generates inline style objects from tokens. SVG `foreignObject` requires inline styles, but they're generated from a single source:

```typescript
export const nodeStyles = {
  container: (opts: ContainerOpts) => ({ ... }),
  glass: (opts: GlassOpts) => ({ ... }),
  diffRing: (status: DiffStatus) => ({ ... }),
  label: (opts: LabelOpts) => ({ ... }),
};
```

**Node components remain separate** — `StepNode`, `EntityNode`, `StateNode`, `DecisionNode`, `EntryNode` have genuinely different layouts. But they share:

- `useNodeState` for all behavioral logic
- `nodeStyles.*` for all styling
- `NodeProps` base interface
- Click → detail panel via shared `onNodeClick` callback

### Tooltip System

**`TooltipWrapper` component:**

```tsx
<TooltipWrapper nodeRef={nodeRef} width={300} position="bottom" bridging={true}>
  <EntityTooltipContent entity={entity} diffStatus={diffStatus} />
</TooltipWrapper>
```

Handles: positioning, backdrop (glass blur, border, shadow), arrow SVG, enter/exit animation, bridging zone.

**Shared tooltip sub-components:**

- `TooltipBadge` — small inline badge (replaces 4 copies of the same inline style)
- `TooltipSection` — labeled section with consistent spacing
- `TooltipLink` — hover-highlighted link row with arrow
- `TooltipDiffSection` — diff status display (already exists, promoted to shared)

**Content components** (`NodeTooltipContent`, `EntityTooltipContent`, `StateTooltipContent`, `ArchTooltipContent`) receive data as props and compose from shared sub-components. No positioning logic, no inline style objects.

### Estimated Impact

~1,400 lines of duplicated code consolidated into ~400 lines of shared infrastructure. New node types require ~50 lines (layout only) instead of ~200 lines (layout + behavior + styling).

---

## Phase 4: State Management & Mode System

### Goal

Move from scattered React Context to Zustand + TanStack Query. Establish app-wide mode system.

### Zustand Store

**`src/stores/app-store.ts`:**

```typescript
interface AppState {
  // Mode
  mode: 'default' | 'diff' | 'trace';

  // Branch
  activeBranch: string;
  comparisonBranch: string | null;

  // Selection & Panel
  selectedItem: SelectedItem | null;
  panelOpen: boolean;

  // Theme
  theme: 'dark' | 'light';

  // Actions
  activateDiffMode: (branch: string) => void;
  deactivateDiffMode: () => void;
  activateTraceMode: () => void;
  deactivateTraceMode: () => void;
  selectItem: (item: SelectedItem) => void;
  clearSelection: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  switchBranch: (branch: string) => void;
}
```

Wrapped with `createSelectors` for granular subscriptions:

```typescript
const useAppStore = createSelectors(useAppStoreBase);

// Usage — only re-renders when this specific value changes:
const isDiffMode = useAppStore.use.mode() === 'diff';
const selectedItem = useAppStore.use.selectedItem();
const theme = useAppStore.use.theme();
```

Persisted to localStorage: `theme`, `activeBranch`.

### Derived Selectors

Convenience hooks built on the store:

```typescript
export const useIsDiffMode = () => useAppStore.use.mode() === 'diff';
export const useIsTraceMode = () => useAppStore.use.mode() === 'trace';
export const useIsCompanionPanelOpen = () => useAppStore.use.selectedItem() !== null;
```

### TanStack Query Setup

Provider installed, client configured. Not used for data fetching today (static site) but ready for Archway:

```typescript
// Today:
export function useDiffResult() {
  const activeBranch = useAppStore.use.activeBranch();
  const comparisonBranch = useAppStore.use.comparisonBranch();
  // Computed from static branch data
  return useMemo(() => computeDiff(activeData, comparisonData), [activeData, comparisonData]);
}

// Future (Archway) — same interface, different implementation:
export function useDiffResult() {
  const activeBranch = useAppStore.use.activeBranch();
  const comparisonBranch = useAppStore.use.comparisonBranch();
  return useQuery({
    queryKey: ['diff', activeBranch, comparisonBranch],
    queryFn: () => fetchDiff(activeBranch, comparisonBranch),
    enabled: !!comparisonBranch,
  });
}
```

### Kill List

| Current                                                       | Replacement                                  |
| ------------------------------------------------------------- | -------------------------------------------- |
| `DocsProvider` (selectedItem, clearSelection)                 | `useAppStore`                                |
| `BranchProvider` (activeBranch, comparisonBranch, isDiffMode) | `useAppStore` + `useBranchData` hook         |
| `useDiffMode` hook                                            | `useAppStore.use.mode()` + `useDiffResult()` |
| `useBranchHref`                                               | Standalone utility reading from store        |

### Migration Approach

Build new store alongside existing providers. Migrate one consumer at a time. Delete old providers when all consumers are migrated. App never breaks during transition.

---

## Phase 5: Responsive Design — Tablet & Mobile Support

### Goal

Make the app usable across screen sizes. Desktop remains primary. Tablet gets a functional layout. Mobile gets a focused read-only view.

### Breakpoint Strategy

| Breakpoint | Range       | Target        | Layout                                                    |
| ---------- | ----------- | ------------- | --------------------------------------------------------- |
| `xl`       | 1280px+     | Desktop       | Full 3-panel (sidebar + main + detail)                    |
| `lg`       | 1024–1279px | Small desktop | Sidebar collapses to icon rail. Detail panel overlays.    |
| `md`       | 768–1023px  | Tablet        | Hamburger menu. Full-width main. Bottom sheet detail.     |
| `sm`       | 375–767px   | Mobile        | Single column. List views only. Full-screen bottom sheet. |
| `xs`       | 320–374px   | Small mobile  | Same as `sm`, tighter spacing.                            |

### Layout Adaptations

**`lg` (compact desktop):**

- Sidebar → icon-only rail with hover tooltips
- Detail panel → overlay slide-in from right
- Canvas views → full width
- Compare toolbar → condensed pills only

**`md` (tablet):**

- Sidebar → hidden, hamburger menu with slide-over drawer
- Branch switcher → in drawer header
- Page header → stacked (title above metrics)
- Canvas → functional with pinch-to-zoom, no minimap
- Detail panel → bottom sheet
- Filter bars → horizontal scroll

**`sm/xs` (mobile):**

- Replace `DeviceGate` blocker with actual mobile layout
- Canvas views → not rendered, show list summary with "View on desktop" nudge
- List views → simplified single-column cards
- Detail panel → full-screen bottom sheet
- Diff toolbar → icon-only with badge counts
- Search → full-screen overlay

### Foundation Requirements (from Phase 1)

- Breakpoint mixins at the scale above
- Touch-target minimum (44px) as a design token
- Spacing tokens that work at mobile density

### Not Building

- Native mobile app
- Offline support
- Mobile-specific features
- Canvas rendering on mobile (summary view instead)

---

## Phase 6: Animation System

### Goal

Establish a centralized animation library. Every state change, page load, and mode transition feels intentional and polished.

### Animation Categories

**Entrance animations:**

- Page content stagger-in on route change (rows, cards, sections appear sequentially)
- Canvas node entrance with scale + fade
- Panel slide-in/slide-out
- Tooltip appear/disappear

**Mode transitions:**

- Entering diff mode: unchanged items fade out, diff toolbar slides down, filter bar fades in, sidebar items animate to filtered state
- Exiting diff mode: reverse — items fade back in, toolbar slides up
- Trace mode activation: non-traced nodes dim, traced path glows, edges animate flow

**Micro-interactions:**

- Button/pill press feedback (subtle scale)
- Row hover lift (translateY or box-shadow change)
- Selection glow pulse
- Badge count transitions (number morphs)
- Expand/collapse accordion with height animation

**Canvas-specific:**

- Edge flow animation (animated dash offset for traced paths)
- Node hover glow (radial gradient)
- Pan/zoom momentum with smooth deceleration
- Diff ring pulse on first appearance

### Implementation

**`src/styles/variables/animations.scss`:**
Centralized keyframes and transition presets:

```scss
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
  --stagger-delay: 20ms;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slide-up {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes slide-down {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes glow-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
  50% {
    box-shadow: 0 0 12px 2px var(--glow-color);
  }
}
```

**`useStaggerEntry` hook** (already exists, gets promoted):
Standardized stagger animation for list items with configurable delay and animation preset.

**`prefers-reduced-motion` respect:**
All animations wrapped in `@media (prefers-reduced-motion: no-preference)`. Reduced motion falls back to instant state changes — still functional, just no motion.

---

## Phase 7: API Abstraction Layer

### Goal

Build the client-side service layer so that when the Archway backend arrives, the swap is seamless. Zero component-level changes required to go from static JSON to live API.

### Service Layer Pattern

Following the web-app's pattern: `services/` per domain, client vs server separation.

```
src/services/
├── branches.ts         # Branch data access
├── diff.ts             # Diff computation / fetching
├── entities.ts         # Entity data
├── journeys.ts         # Journey data
├── lifecycles.ts       # Lifecycle data
├── api-contracts.ts    # API endpoint data
├── architecture.ts     # Architecture diagram data
├── features.ts         # Feature data
├── config.ts           # Config enum data
├── changelog.ts        # Changelog data
└── index.ts            # Barrel export
```

**Today (static):**

```typescript
// src/services/entities.ts
import { loadBranch } from '@/data/branch-loader';

export function getEntities(branch: string): Entity[] {
  const data = loadBranch(branch);
  return data?.entities ?? [];
}
```

**Future (Archway):**

```typescript
// src/services/entities.ts
export async function getEntities(branch: string): Promise<Entity[]> {
  const response = await fetch(`/api/branches/${branch}/entities`);
  return response.json();
}
```

Same function signature. Same return type. Component layer unchanged.

### TanStack Query Hooks

Every data access point wrapped in a query hook:

```typescript
// src/hooks/use-entities.ts
export function useEntities(branch: string) {
  return useQuery({
    queryKey: ['entities', branch],
    queryFn: () => getEntities(branch),
    staleTime: Infinity, // Static data today, configurable for live API
  });
}
```

Components consume hooks, not services directly:

```typescript
// In a component:
const { data: entities } = useEntities(activeBranch);
```

### Optimistic Update Patterns

Established for future write operations (Archway will have branch creation, exploratory edits):

```typescript
export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createBranch(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['branches'] });
      const previous = queryClient.getQueryData(['branches']);
      // Optimistic insert
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['branches'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}
```

### API Contract Types

TypeScript types designed to match future OpenAPI generation:

```typescript
// src/types/api/branch.ts
export interface BranchResponse {
  name: string;
  label: string;
  description: string;
  color: string;
  isDefault: boolean;
  lastSync: string;
}

export interface DiffResponse {
  base: string;
  head: string;
  summary: DiffSummary;
  entities: DiffSet<Entity>;
  journeys: DiffSet<Journey>;
  // ...
}
```

### Cache Strategy

Designed for when data becomes server-fetched:

- Branch data: `staleTime: 30s`, refetch on window focus
- Diff results: cached by `[base, head]` key pair, invalidated on branch sync
- Static reference data (config, roles): `staleTime: Infinity`, manual invalidation
- Changelog: `staleTime: 60s`, newest-first pagination

---

## Execution Principles

1. **One phase at a time.** Each phase produces a working, shippable codebase.
2. **Migrate, don't rewrite.** Build new alongside old, move consumers one at a time, delete old when empty.
3. **Zero regressions.** Every phase must pass the full CI check (`format`, `lint`, `lint:styles`, `typecheck`, `build`).
4. **Follow the web-app.** When in doubt about a pattern, check how `nessi-web-app` does it.
5. **Keep shipping features.** This overhaul doesn't block feature work — new features use new patterns, old features get migrated incrementally.

---

## Success Criteria

At completion of all 7 phases:

- **Zero hardcoded values** in component files — all styling from tokens
- **One canonical component** for every UI pattern (badge, pill, row, table, tooltip)
- **Theme switchable** — dark/light mode via data attribute, zero component changes
- **Responsive** — functional at tablet and mobile breakpoints
- **Mode-aware** — diff and trace modes as first-class app states, not bolted-on checks
- **API-ready** — swap static JSON for live API by changing service implementations only
- **Animated** — every state change has an intentional transition
- **Scalable** — new node types, new canvas views, new themes require minimal boilerplate
