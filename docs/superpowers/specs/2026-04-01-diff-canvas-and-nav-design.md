# Diff Canvas Views & Navigation — Phase 2 Design

> Visual diff overlays on all canvas views (Journeys, ERD, Lifecycle, Architecture) plus sidebar diff dots and journey domain grid badges.

---

## Context

Phase 1 is complete: diff engine, list view overlays, compare overview page, toolbar with clickable counts, sidebar with comparison selector. Phase 2 adds diff-awareness to the canvas visualizations and navigation elements.

## Scope

This spec covers all remaining Phase 2 items from the original diff engine design:

1. Canvas diff overlays (Lifecycle, ERD, Journey, Architecture)
2. Sidebar diff dots on nav items
3. Journey domain grid diff badges
4. Diff legend section on canvases

---

## 1. Canvas Node Diff Treatment

All canvas node components (`StateNode`, `EntityNode`, `StepNode`, `EntryNode`, `DecisionNode`) get a new optional `diffStatus` prop.

### 1.1 Prop Addition

Each node component gets:

```ts
diffStatus?: DiffStatus | null;
```

When `diffStatus` is set and not `'unchanged'`, the node's visual treatment changes.

### 1.2 Added Nodes

- Border stroke color: `var(--diff-added)` / `#3d8c75` (replaces normal category color)
- Radial gradient glow: green, pulsing (`glow-pulse` animation)
- Full opacity
- Normal interactivity (click, tooltip)

### 1.3 Modified Nodes

- Border stroke color: `var(--diff-modified)` / `#7b8fcd` (replaces normal category color)
- Radial gradient glow: blue, pulsing
- Full opacity
- Normal interactivity

### 1.4 Removed Nodes (Ghost Nodes)

- Border stroke: `var(--diff-removed)` / `#b84040`, dashed (`strokeDasharray="4 3"`)
- Opacity: 0.4
- No glow
- Not interactive: `pointerEvents: 'none'`, no click handler, no tooltip

### 1.5 Unchanged Nodes

- Opacity: 0.6
- Normal interactivity preserved (trace mode, tooltips)

### 1.6 Implementation Pattern

The diff status overrides both border color and glow color. In each node component:

```tsx
// Compute diff-aware color
const effectiveColor =
  diffStatus === 'added'
    ? '#3d8c75'
    : diffStatus === 'modified'
      ? '#7b8fcd'
      : diffStatus === 'removed'
        ? '#b84040'
        : color; // normal category color

// Compute diff-aware opacity
const diffOpacity = diffStatus === 'removed' ? 0.4 : diffStatus === 'unchanged' ? 0.6 : 1;

// Compute diff-aware stroke
const strokeDash = diffStatus === 'removed' ? '4 3' : undefined;

// Show diff glow for added/modified
const showDiffGlow = diffStatus === 'added' || diffStatus === 'modified';

// Disable interactivity for removed
const isGhost = diffStatus === 'removed';
```

The node's `<g>` wrapper gets `opacity: diffOpacity` and `pointerEvents: isGhost ? 'none' : undefined`.

---

## 2. Canvas Edge Diff Treatment

Edges derive their diff status from their connected nodes.

### 2.1 Edge Status Derivation

In each canvas implementation, compute edge diff status:

```ts
function getEdgeDiffStatus(
  fromStatus: DiffStatus | null,
  toStatus: DiffStatus | null,
): DiffStatus | null {
  if (!fromStatus && !toStatus) return null;
  if (fromStatus === 'removed' || toStatus === 'removed') return 'removed';
  if (fromStatus === 'added' || toStatus === 'added') return 'added';
  if (fromStatus === 'modified' || toStatus === 'modified') return 'modified';
  return 'unchanged';
}
```

### 2.2 Edge Visual Treatment

Add `diffStatus` prop to `Edge` and `AnimatedEdge`:

- **Added**: stroke `rgba(61, 140, 117, 0.7)`, normal dash
- **Modified**: stroke `rgba(123, 143, 205, 0.7)`, normal dash
- **Removed**: stroke `rgba(184, 64, 64, 0.5)`, dashed `strokeDasharray="3 5"`
- **Unchanged**: dimmed opacity 0.15 (same as trace-mode dim)

### 2.3 Arrow Markers

Add diff-colored arrow markers to `CanvasProvider` defs:

```tsx
<marker id="arrow-diff-added" fill="rgba(61,140,117,0.6)" .../>
<marker id="arrow-diff-modified" fill="rgba(123,143,205,0.6)" .../>
<marker id="arrow-diff-removed" fill="rgba(184,64,64,0.4)" .../>
```

---

## 3. Diff Legend

When diff mode is active, each canvas legend gets a "Diff" section appended.

### 3.1 DiffLegendSection Component

A shared component rendered inside each legend:

```tsx
function DiffLegendSection() {
  return (
    <>
      <div className="legend-section-label">Diff</div>
      <div className="legend-row">
        <circle fill="#3d8c75" /> Added
      </div>
      <div className="legend-row">
        <circle fill="#7b8fcd" /> Modified
      </div>
      <div className="legend-row">
        <circle fill="#b84040" /> Removed
      </div>
      <div className="legend-row">
        <circle fill="#6a6860" /> Unchanged
      </div>
    </>
  );
}
```

Rendered at the bottom of `Legend`, `ErdLegend`, and `LifecycleLegend` when `useDiffMode().isActive` is true.

---

## 4. Ghost Nodes from Base Branch

When a node exists on the base branch but not on the head (removed), it needs to be rendered as a ghost at its base-branch position.

### 4.1 Lifecycle Canvas

Compare `lifecycle.states` (head) with the base lifecycle's states. States that exist only on base are rendered as ghost `StateNode`s with `diffStatus="removed"`.

### 4.2 ERD Canvas

Compare `erdNodes` (head) with base `erdNodes`. Removed nodes render as ghost `EntityNode`s.

### 4.3 Journey Canvas

Compare `journey.nodes` (head) with base journey nodes. Removed nodes render as ghost `StepNode`s.

### 4.4 Architecture Canvas

Compare diagram nodes (head) with base diagram nodes. Removed nodes render as ghost nodes.

### 4.5 Data Source

Each canvas reads the comparison data via `useDiffMode()`:

- `diffResult.lifecycles` gives added/removed/modified lifecycles
- For node-level diffing within a lifecycle, compare `diffResult` doesn't go that deep — we need to compare individual state arrays between base and head lifecycle objects

The canvas implementations will need to:

1. Get the base lifecycle/journey/diagram from `comparisonData`
2. Diff the individual nodes (states/steps/erd nodes) between base and head
3. Render ghost nodes for removed items

This is a lightweight diff at the canvas level — compare node arrays by ID, similar to the engine's `diffSet` but using the raw state/node objects.

---

## 5. Brand-New & Removed Canvases

### 5.1 Brand-New Canvas

If a lifecycle/journey/architecture diagram exists only on the head branch:

- Render normally (all nodes at full styling)
- No dimming (everything is "new")
- Toolbar shows contextual message (already handled by existing DiffToolbar)

### 5.2 Removed Canvas

If a diagram exists only on the base branch:

- Render using base data, but all nodes get `diffStatus="removed"` (ghost treatment)
- All edges get removed treatment
- Page route needs to handle this — currently it would 404 since the data doesn't exist on head

For removed canvases, the page component needs to fall back to base branch data when head data is missing but comparison mode is active.

---

## 6. Sidebar Diff Dots

When diff mode is active, sidebar nav items that correspond to domains with changes show a small colored dot.

### 6.1 Dot Logic

- Green dot: domain has additions only
- Blue dot: domain has modifications (or both additions and modifications)
- No dot: domain has no changes (or only unchanged items)

### 6.2 Implementation

The `Sidebar` component reads `useDiffMode().diffResult.summary.byDomain` and renders a dot next to affected nav items.

Create a `SidebarDiffDots` inner component (wrapped in Suspense since it uses `useDiffMode`) that computes the dot colors and passes them down.

Map sidebar nav items to domain keys:

```ts
const NAV_TO_DOMAIN: Record<string, string> = {
  journeys: 'journeys',
  api: 'apiGroups',
  data: 'entities',
  erd: 'erdNodes',
  lifecycles: 'lifecycles',
  architecture: 'archDiagrams',
  config: 'configEnums',
};
```

### 6.3 Dot Rendering

Small 6px circle positioned to the right of the nav item label:

```tsx
{
  dotColor && <span className={styles.diffDot} style={{ background: dotColor }} />;
}
```

---

## 7. Journey Domain Grid Diff Badges

The journeys index page (`/[branch]/journeys`) shows domain cards. When diff mode is active:

### 7.1 Badge Content

Each domain card shows:

- "N new journeys" (green text) if there are added journeys in that domain
- "N modified" (blue text) if there are modified journeys

### 7.2 Implementation

The `DomainGrid` component reads `useDiffMode()` and computes per-domain journey counts from `diffResult.journeys`.

---

## 8. Implementation Order

The work naturally splits into independent chunks:

1. **Shared canvas diff utilities** — `getEdgeDiffStatus()`, diff arrow markers in CanvasProvider, `DiffLegendSection` component
2. **Lifecycle canvas diff** — StateNode diffStatus prop, ghost nodes, edge treatment, legend
3. **ERD canvas diff** — EntityNode diffStatus prop, ghost nodes, edge treatment, legend
4. **Journey canvas diff** — StepNode/EntryNode/DecisionNode diffStatus prop, ghost nodes, edge treatment, legend
5. **Architecture canvas diff** — Node diffStatus, ghost nodes, edge treatment, legend
6. **Sidebar diff dots** — Small colored dots on nav items
7. **Journey domain grid badges** — Diff count badges on domain cards
