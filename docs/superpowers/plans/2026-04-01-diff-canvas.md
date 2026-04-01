# Diff Canvas Overlays — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visual diff overlays to all 4 canvas types (Lifecycle, ERD, Journey, Architecture) — colored borders, glows, ghost nodes, dimmed unchanged nodes, diff-aware edges, and diff legend sections.

**Architecture:** Each canvas node component (`StateNode`, `EntityNode`, `StepNode`, `EntryNode`, `DecisionNode`) gets a `diffStatus` prop that overrides border color, glow color, opacity, and interactivity. Ghost nodes (removed from head branch) are rendered using base-branch data. A shared `useDiffNodes()` hook computes per-node diff status by comparing base and head node arrays. Edges derive status from their connected nodes. Each legend gets a "Diff" section when diff mode is active.

**Tech Stack:** React SVG components, TypeScript, inline SVG styling (matching existing pattern), `useDiffMode()` hook

---

## File Map

### New Files

| File                                                     | Responsibility                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/features/canvas/hooks/use-diff-nodes.ts`            | Generic hook: compares base/head node arrays, returns statusMap + ghost nodes |
| `src/features/canvas/components/diff-legend-section.tsx` | Shared diff legend section (4 entries: Added/Modified/Removed/Unchanged)      |

### Modified Files

| File                                                      | Change                                                                |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/features/canvas/components/state-node.tsx`           | Add `diffStatus` prop, override color/glow/opacity/dash               |
| `src/features/canvas/components/entity-node.tsx`          | Add `diffStatus` prop, same pattern                                   |
| `src/features/canvas/components/step-node.tsx`            | Add `diffStatus` prop, same pattern                                   |
| `src/features/canvas/components/entry-node.tsx`           | Add `diffStatus` prop, same pattern                                   |
| `src/features/canvas/components/decision-node.tsx`        | Add `diffStatus` prop, same pattern                                   |
| `src/features/canvas/components/edge.tsx`                 | Add `diffStatus` prop, override stroke/dash/opacity                   |
| `src/features/canvas/components/animated-edge.tsx`        | Add `diffStatus` prop, suppress animation for removed/unchanged       |
| `src/features/canvas/canvas-provider/index.tsx`           | Add diff-colored arrow marker defs                                    |
| `src/features/canvas/components/lifecycle-legend.tsx`     | Append DiffLegendSection when diff active                             |
| `src/features/canvas/components/erd-legend.tsx`           | Append DiffLegendSection when diff active                             |
| `src/features/canvas/components/legend.tsx`               | Append DiffLegendSection when diff active                             |
| `src/features/lifecycles/lifecycle-canvas/index.tsx`      | Integrate useDiffNodes, pass diffStatus to nodes/edges, render ghosts |
| `src/features/data-model/erd-canvas/index.tsx`            | Integrate useDiffNodes, pass diffStatus to nodes/edges, render ghosts |
| `src/features/journeys/journey-canvas/index.tsx`          | Integrate useDiffNodes, pass diffStatus to nodes/edges, render ghosts |
| `src/features/architecture/architecture-canvas/index.tsx` | Integrate useDiffNodes, pass diffStatus to nodes/edges, render ghosts |

---

## Task 1: `useDiffNodes` Hook

**Files:**

- Create: `src/features/canvas/hooks/use-diff-nodes.ts`

A generic hook that compares two arrays of nodes by key and returns diff status for each node, plus a list of ghost nodes (removed from head, need to be rendered from base).

- [ ] **Step 1: Create the hook**

```ts
// src/features/canvas/hooks/use-diff-nodes.ts

import { useMemo } from 'react';
import type { DiffStatus } from '@/types/diff';

interface DiffNodesResult<T> {
  /** Map from node key → diff status */
  statusMap: Map<string, DiffStatus>;
  /** Nodes that exist on base but not head — render as ghosts */
  ghostNodes: T[];
}

/**
 * Compare two arrays of nodes and produce per-node diff status.
 * Returns a statusMap for all nodes (head + base-only) and a ghostNodes array
 * for nodes that need to be rendered from base data.
 */
export function useDiffNodes<T>(
  headNodes: T[],
  baseNodes: T[] | null,
  getKey: (node: T) => string,
): DiffNodesResult<T> {
  return useMemo(() => {
    if (!baseNodes) {
      return { statusMap: new Map(), ghostNodes: [] };
    }

    const baseMap = new Map<string, T>();
    for (const node of baseNodes) baseMap.set(getKey(node), node);

    const headMap = new Map<string, T>();
    for (const node of headNodes) headMap.set(getKey(node), node);

    const statusMap = new Map<string, DiffStatus>();
    const ghostNodes: T[] = [];

    // Head nodes: added or check if modified
    for (const node of headNodes) {
      const key = getKey(node);
      const baseNode = baseMap.get(key);
      if (!baseNode) {
        statusMap.set(key, 'added');
      } else if (JSON.stringify(baseNode) !== JSON.stringify(node)) {
        statusMap.set(key, 'modified');
      } else {
        statusMap.set(key, 'unchanged');
      }
    }

    // Base-only nodes: removed (ghost)
    for (const node of baseNodes) {
      const key = getKey(node);
      if (!headMap.has(key)) {
        statusMap.set(key, 'removed');
        ghostNodes.push(node);
      }
    }

    return { statusMap, ghostNodes };
  }, [headNodes, baseNodes, getKey]);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/canvas/hooks/use-diff-nodes.ts
git commit -m "feat(diff): add useDiffNodes hook for canvas node comparison"
```

---

## Task 2: DiffLegendSection Component

**Files:**

- Create: `src/features/canvas/components/diff-legend-section.tsx`

- [ ] **Step 1: Create the shared diff legend section**

```tsx
// src/features/canvas/components/diff-legend-section.tsx

import { hexToRgba } from '../utils/geometry';

const DIFF_ENTRIES = [
  { label: 'Added', color: '#3d8c75' },
  { label: 'Modified', color: '#7b8fcd' },
  { label: 'Removed', color: '#b84040' },
  { label: 'Unchanged', color: '#6a6860' },
];

export function DiffLegendSection() {
  const sectionLabel: React.CSSProperties = {
    fontSize: 9,
    color: '#6a6860',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
    marginTop: 12,
  };

  const row: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 10,
    color: '#9a9790',
    marginBottom: 4,
  };

  return (
    <div>
      <div style={sectionLabel}>Diff</div>
      {DIFF_ENTRIES.map((entry) => (
        <div key={entry.label} style={row}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect
              x="1"
              y="2"
              width="12"
              height="10"
              rx="3"
              fill={hexToRgba(entry.color, 0.15)}
              stroke={hexToRgba(entry.color, 0.4)}
              strokeWidth="0.8"
            />
            <rect x="1" y="4" width="2" height="6" rx="0.5" fill={entry.color} />
          </svg>
          <span>{entry.label}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/canvas/components/diff-legend-section.tsx
git commit -m "feat(diff): add shared DiffLegendSection component for canvas legends"
```

---

## Task 3: Diff Arrow Markers in CanvasProvider

**Files:**

- Modify: `src/features/canvas/canvas-provider/index.tsx`

- [ ] **Step 1: Add diff-colored arrow markers to the SVG defs**

In `src/features/canvas/canvas-provider/index.tsx`, after the existing `arrow-back` marker (before the closing `</defs>`), add three new markers:

```tsx
          <marker
            id="arrow-diff-added"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M2,2 L10,5 L2,8 Z" fill="rgba(61,140,117,0.6)" />
          </marker>
          <marker
            id="arrow-diff-modified"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M2,2 L10,5 L2,8 Z" fill="rgba(123,143,205,0.6)" />
          </marker>
          <marker
            id="arrow-diff-removed"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M2,2 L10,5 L2,8 Z" fill="rgba(184,64,64,0.4)" />
          </marker>
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/canvas/canvas-provider/index.tsx
git commit -m "feat(diff): add diff-colored arrow markers to CanvasProvider"
```

---

## Task 4: StateNode Diff Support

**Files:**

- Modify: `src/features/canvas/components/state-node.tsx`

- [ ] **Step 1: Add diffStatus prop and diff-aware rendering**

Update the `StateNodeProps` interface:

```ts
import type { DiffStatus } from '@/types/diff';

interface StateNodeProps {
  state: LifecycleState;
  isSelected?: boolean;
  diffStatus?: DiffStatus | null;
  onClick?: () => void;
}
```

Update the component to compute diff-aware values:

```tsx
export const StateNode = memo(function StateNode({ state, isSelected, diffStatus, onClick }: StateNodeProps) {
  const [hovered, setHovered] = useState(false);
  const naturalColor = state.color ?? DEFAULT_STATE_COLOR;
  const isGhost = diffStatus === 'removed';

  // Diff overrides the node's color
  const color = diffStatus === 'added' ? '#3d8c75'
    : diffStatus === 'modified' ? '#7b8fcd'
    : diffStatus === 'removed' ? '#b84040'
    : naturalColor;

  const diffOpacity = diffStatus === 'removed' ? 0.4
    : diffStatus === 'unchanged' ? 0.6
    : 1;

  const showHoverGlow = hovered && !isSelected && !isGhost;
  const showDiffGlow = (diffStatus === 'added' || diffStatus === 'modified') && !isSelected;

  return (
    <g
      transform={`translate(${state.x},${state.y})`}
      onClick={isGhost ? undefined : onClick}
      onMouseEnter={isGhost ? undefined : () => setHovered(true)}
      onMouseLeave={isGhost ? undefined : () => setHovered(false)}
      style={{
        cursor: isGhost ? 'default' : 'pointer',
        opacity: diffOpacity,
        transition: 'opacity 400ms ease-out',
        pointerEvents: isGhost ? 'none' : undefined,
      }}
    >
      {/* Diff glow */}
      {showDiffGlow && (
        <>
          <defs>
            <radialGradient id={`lc-diff-${state.id}`}>
              <stop offset="0%" stopColor={color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            cx={LIFECYCLE_NODE_WIDTH / 2}
            cy={LIFECYCLE_NODE_HEIGHT / 2}
            r={LIFECYCLE_NODE_WIDTH * 0.55}
            fill={`url(#lc-diff-${state.id})`}
            style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
          />
        </>
      )}
      {/* Hover glow */}
      {showHoverGlow && (
        // ... existing hover glow code unchanged ...
      )}
      {/* Selection glow */}
      {isSelected && (
        // ... existing selection glow code unchanged ...
      )}
      {/* Frosted glass backdrop */}
      <foreignObject ... />
      {/* Colored card */}
      <rect
        width={LIFECYCLE_NODE_WIDTH}
        height={LIFECYCLE_NODE_HEIGHT}
        rx={8}
        fill={hexToRgba(color, 0.12)}
        stroke={isSelected ? color : hovered ? hexToRgba(color, 0.4) : hexToRgba(color, 0.3)}
        strokeWidth={isSelected ? 1.5 : 1}
        strokeDasharray={isGhost ? '4 3' : undefined}
      />
      {/* Left accent bar */}
      <rect x={0} y={8} width={3} height={LIFECYCLE_NODE_HEIGHT - 16} rx={1.5} fill={color} />
      {/* State label */}
      <text ...>{state.label}</text>
    </g>
  );
});
```

The key changes:

- `color` is overridden based on `diffStatus`
- `diffOpacity` dims unchanged (0.6) and ghosts (0.4)
- `showDiffGlow` adds a pulsing glow for added/modified
- `isGhost` disables interactivity and adds dashed stroke
- Existing hover/selection glow code stays unchanged (just guard against ghost)

NOTE TO IMPLEMENTER: Read the full current file first. The code above shows the pattern — merge it with the existing code, keeping all existing hover glow, selection glow, frosted glass, and label rendering intact. Only add/modify the diff-related parts.

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/canvas/components/state-node.tsx
git commit -m "feat(diff): add diffStatus prop to StateNode with color/glow/opacity overrides"
```

---

## Task 5: EntityNode Diff Support

**Files:**

- Modify: `src/features/canvas/components/entity-node.tsx`

Apply the exact same pattern as Task 4 to `EntityNode`. The changes are identical:

- [ ] **Step 1: Add diffStatus prop**

Add `import type { DiffStatus } from '@/types/diff';`

Update `EntityNodeProps`:

```ts
interface EntityNodeProps {
  node: ErdNode;
  isSelected?: boolean;
  diffStatus?: DiffStatus | null;
  onClick?: () => void;
}
```

Apply the same diff-aware logic:

- Override `color` based on `diffStatus` (added→green, modified→blue, removed→red, else normal `BADGE_COLORS` color)
- Compute `diffOpacity` (removed→0.4, unchanged→0.6, else 1)
- Add diff glow for added/modified (radial gradient with `id={`erd-diff-${node.id}`}`)
- Add `strokeDasharray={isGhost ? '4 3' : undefined}` on the main rect
- Disable interactivity when ghost (`pointerEvents: 'none'`, no onClick/mouse handlers)

NOTE TO IMPLEMENTER: Read the full current `entity-node.tsx` first. Keep all existing code (hover glow, selection glow, frosted glass, badge, field count). Only add diff-related changes following the exact same pattern as StateNode.

- [ ] **Step 2: Verify and commit**

Run: `pnpm typecheck && pnpm format`
Commit: `feat(diff): add diffStatus prop to EntityNode`

---

## Task 6: Edge Diff Support

**Files:**

- Modify: `src/features/canvas/components/edge.tsx`
- Modify: `src/features/canvas/components/animated-edge.tsx`

- [ ] **Step 1: Update Edge component**

Add `diffStatus` prop to `EdgeProps`:

```ts
import type { DiffStatus } from '@/types/diff';

interface EdgeProps {
  from: { x: number; y: number; type: string };
  to: { x: number; y: number; type: string };
  isDecision?: boolean;
  isLit?: boolean;
  isDimmed?: boolean;
  isBackEdge?: boolean;
  isDecisionBranch?: boolean;
  useJourneyPorts?: boolean;
  diffStatus?: DiffStatus | null;
}
```

When `diffStatus` is set, override stroke color, opacity, dash, and marker:

```ts
// After existing stroke/opacity/marker computation, add diff overrides:
if (diffStatus) {
  if (diffStatus === 'added') {
    stroke = 'rgba(61,140,117,0.7)';
    marker = 'url(#arrow-diff-added)';
    opacity = 1;
  } else if (diffStatus === 'modified') {
    stroke = 'rgba(123,143,205,0.7)';
    marker = 'url(#arrow-diff-modified)';
    opacity = 1;
  } else if (diffStatus === 'removed') {
    stroke = 'rgba(184,64,64,0.5)';
    strokeDasharray = '3 5';
    marker = 'url(#arrow-diff-removed)';
    opacity = 0.5;
  } else if (diffStatus === 'unchanged') {
    opacity = 0.15;
  }
}
```

NOTE: Make `opacity`, `stroke`, `strokeDasharray`, and `marker` into `let` variables instead of `const` so they can be overridden.

- [ ] **Step 2: Update AnimatedEdge**

Add `diffStatus` prop. Suppress the animated edge entirely when `diffStatus` is `'removed'` or `'unchanged'`:

```ts
// At the top of the render:
if (diffStatus === 'removed' || diffStatus === 'unchanged') return null;
```

For added/modified, override the stroke color to match the diff color.

- [ ] **Step 3: Verify and commit**

Run: `pnpm typecheck && pnpm format`
Commit: `feat(diff): add diffStatus prop to Edge and AnimatedEdge`

---

## Task 7: Lifecycle Canvas Integration

**Files:**

- Modify: `src/features/lifecycles/lifecycle-canvas/index.tsx`
- Modify: `src/features/canvas/components/lifecycle-legend.tsx`

This is the first full canvas integration — it wires `useDiffNodes` into the lifecycle canvas, passes `diffStatus` to nodes and edges, renders ghost nodes, and adds the diff legend section.

- [ ] **Step 1: Add diff mode to LifecycleCanvas**

In `src/features/lifecycles/lifecycle-canvas/index.tsx`, add imports:

```ts
import { useDiffMode } from '@/hooks/use-diff-mode';
import { useDiffNodes } from '@/features/canvas/hooks/use-diff-nodes';
import type { DiffStatus } from '@/types/diff';
```

Inside the `LifecycleCanvas` component, after existing hook calls:

```ts
// Diff mode integration
const { isActive: isDiffMode, diffResult } = useDiffMode();

// Get base lifecycle for node-level comparison
const baseLifecycle =
  isDiffMode && diffResult
    ? (() => {
        // Find matching lifecycle in the base data by slug
        const baseLc = diffResult.lifecycles.modified.find((m) => m.base.slug === lifecycle.slug);
        if (baseLc) return baseLc.base;
        // If lifecycle is added (not in base), no base to compare
        return null;
      })()
    : null;

const { statusMap: nodeStatusMap, ghostNodes: ghostStates } = useDiffNodes(
  lifecycle.states,
  baseLifecycle?.states ?? null,
  (s) => s.id,
);
```

Helper to compute edge diff status:

```ts
function getEdgeDiffStatus(
  fromId: string,
  toId: string,
  nodeStatusMap: Map<string, DiffStatus>,
): DiffStatus | null {
  if (nodeStatusMap.size === 0) return null;
  const fromStatus = nodeStatusMap.get(fromId);
  const toStatus = nodeStatusMap.get(toId);
  if (fromStatus === 'removed' || toStatus === 'removed') return 'removed';
  if (fromStatus === 'added' || toStatus === 'added') return 'added';
  if (fromStatus === 'modified' || toStatus === 'modified') return 'modified';
  return 'unchanged';
}
```

Update the `stateMap` to include ghost states for position lookup:

```ts
const allStates = [...lifecycle.states, ...ghostStates];
const stateMap = new Map(allStates.map((s) => [s.id, s]));
```

Update viewBox computation to include ghost state positions.

Pass `diffStatus` to `StateNode`:

```tsx
<StateNode
  state={state}
  isSelected={litNodes.has(state.id) && hasTrace}
  diffStatus={isDiffMode ? (nodeStatusMap.get(state.id) ?? null) : null}
  onClick={() => toggleFocus(state.id)}
/>
```

After normal state nodes, render ghost states:

```tsx
{
  isDiffMode &&
    ghostStates.map((state) => (
      <g key={`ghost-${state.id}`}>
        <StateNode state={state} diffStatus="removed" />
      </g>
    ));
}
```

Pass `diffStatus` to each transition edge:

```tsx
const edgeDiffStatus = isDiffMode ? getEdgeDiffStatus(t.from, t.to, nodeStatusMap) : null;
```

Then use `edgeDiffStatus` to override the edge's stroke/dash/opacity in the existing inline rendering (the lifecycle canvas renders edges inline, not via the `Edge` component).

- [ ] **Step 2: Add DiffLegendSection to LifecycleLegend**

In `src/features/canvas/components/lifecycle-legend.tsx`:

Add import:

```ts
import { DiffLegendSection } from './diff-legend-section';
```

Add a `isDiffMode` prop:

```ts
interface LifecycleLegendProps {
  visible: boolean;
  isDiffMode?: boolean;
}
```

At the bottom of the legend content (after the "Transitions" section), add:

```tsx
{
  isDiffMode && <DiffLegendSection />;
}
```

In the `LifecycleCanvas`, pass `isDiffMode` to the legend:

```tsx
legend={<LifecycleLegend visible={legendVisible} isDiffMode={isDiffMode} />}
```

- [ ] **Step 3: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Commit: `feat(diff): integrate diff overlays into lifecycle canvas`

---

## Task 8: ERD Canvas Integration

**Files:**

- Modify: `src/features/data-model/erd-canvas/index.tsx`
- Modify: `src/features/canvas/components/erd-legend.tsx`

Same pattern as Task 7 but for the ERD canvas. Key differences:

- ERD nodes use `node.id` as key
- ERD edges use `from`+`to` as composite key
- ERD canvas uses the shared `Edge` and `AnimatedEdge` components (unlike lifecycle which renders inline)
- ERD uses `EntityNode` not `StateNode`
- Ghost nodes need their base-branch positions

- [ ] **Step 1: Add diff mode to ERD canvas**

Read `src/features/data-model/erd-canvas/index.tsx` first. Add imports for `useDiffMode`, `useDiffNodes`, `DiffStatus`.

Get base ERD nodes from `diffResult`:

```ts
const { isActive: isDiffMode, diffResult } = useDiffMode();
const baseErdNodes = isDiffMode && diffResult ? /* base erdNodes from comparison data */ : null;
```

For ERD, the base nodes come from `useBranchData().comparisonData.erdNodes` (since the diff engine doesn't store individual ERD node diffs with base objects — the `DiffSet<ErdNode>` does have `removed` array which IS the base nodes).

Actually, use `diffResult.erdNodes.removed` for ghost nodes directly, and `diffResult.erdNodes.statusMap` for status lookup. This is simpler than `useDiffNodes` since the diff engine already computed this.

```ts
const erdNodeStatusMap = isDiffMode ? diffResult?.erdNodes.statusMap : undefined;
const ghostErdNodes = isDiffMode ? (diffResult?.erdNodes.removed ?? []) : [];
```

Pass `diffStatus` to `EntityNode`:

```tsx
<EntityNode
  node={node}
  isSelected={...}
  diffStatus={isDiffMode ? erdNodeStatusMap?.get(node.id) ?? null : null}
  onClick={...}
/>
```

Render ghost nodes with `diffStatus="removed"`. Pass `diffStatus` to `Edge` components using the `getEdgeDiffStatus` helper.

- [ ] **Step 2: Add DiffLegendSection to ErdLegend**

Same pattern: add `isDiffMode` prop, render `<DiffLegendSection />` at bottom.

- [ ] **Step 3: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Commit: `feat(diff): integrate diff overlays into ERD canvas`

---

## Task 9: StepNode, EntryNode, DecisionNode Diff Support

**Files:**

- Modify: `src/features/canvas/components/step-node.tsx`
- Modify: `src/features/canvas/components/entry-node.tsx`
- Modify: `src/features/canvas/components/decision-node.tsx`

Apply the same `diffStatus` prop pattern to all three journey node types.

- [ ] **Step 1: Update StepNode**

Read full file first. Add `diffStatus?: DiffStatus | null` to `StepNodeProps`. Apply same pattern:

- Override layer color with diff color when `diffStatus` is set
- Compute `diffOpacity` and apply to `<g>` wrapper
- Add diff glow for added/modified
- Ghost (removed): dashed stroke, no interactivity, 0.4 opacity
- Unchanged: 0.6 opacity

Important: StepNode already has `isDimmed` for trace mode. The diff opacity should compose with this — when both trace and diff are active, use the more restrictive opacity.

- [ ] **Step 2: Update EntryNode**

Same pattern. EntryNode has a fixed blue color (`#3ba8d4`) — override with diff color when `diffStatus` is set.

- [ ] **Step 3: Update DecisionNode**

Same pattern. DecisionNode has a fixed purple color (`#a78bfa`) — override with diff color.

- [ ] **Step 4: Verify and commit**

Run: `pnpm typecheck && pnpm format`
Commit: `feat(diff): add diffStatus prop to StepNode, EntryNode, DecisionNode`

---

## Task 10: Journey Canvas Integration

**Files:**

- Modify: `src/features/journeys/journey-canvas/index.tsx`
- Modify: `src/features/canvas/components/legend.tsx`

- [ ] **Step 1: Add diff mode to Journey canvas**

Read full file first. Add imports. Journey nodes use `node.id` as key.

Get base journey data:

```ts
const { isActive: isDiffMode, diffResult } = useDiffMode();
```

For journey node diffing, compare the current journey's nodes against the base journey's nodes (if the journey exists on both branches):

```ts
const baseJourney =
  isDiffMode && diffResult
    ? diffResult.journeys.modified.find((m) => m.base.slug === journey.slug)?.base
    : null;
```

Use `useDiffNodes` to compare nodes:

```ts
const { statusMap: nodeStatusMap, ghostNodes } = useDiffNodes(
  journey.nodes,
  baseJourney?.nodes ?? null,
  (n) => n.id,
);
```

Pass `diffStatus` to each node type and edge. Render ghost nodes.

- [ ] **Step 2: Add DiffLegendSection to Journey Legend**

Same pattern in `legend.tsx`.

- [ ] **Step 3: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Commit: `feat(diff): integrate diff overlays into journey canvas`

---

## Task 11: Architecture Canvas Integration

**Files:**

- Modify: `src/features/architecture/architecture-canvas/index.tsx`

Architecture canvas is unique — nodes are inline SVG (not a shared component), and the layout is computed from layers. Apply diff treatment to the inline node rendering.

- [ ] **Step 1: Add diff mode to Architecture canvas**

Read full file first. Architecture nodes are identified by `id` within layers. The diff is at the diagram level (from `diffResult.archDiagrams`), but for node-level diffing, compare the `layers[].nodes[]` arrays between base and head.

Compute a flat node status map from the base/head diagram comparison. Apply diff coloring to the inline `<rect>` and `<text>` elements that render each architecture node.

- [ ] **Step 2: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm typecheck`
Commit: `feat(diff): integrate diff overlays into architecture canvas`

---

## Task 12: Full CI Validation

- [ ] **Step 1: Run all CI checks**

Run: `pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck`
Expected: All PASS

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Visual smoke test**

Run: `pnpm dev`

1. Navigate to `/staging/lifecycles/listing?compare=main`
   - Verify: modified states show blue border + glow, unchanged states are dimmed
   - If any states were removed, verify ghost nodes with dashed red border
2. Navigate to `/staging/entity-relationships?compare=main`
   - Verify: ERD nodes show diff colors, edges follow node status
3. Navigate to a journey canvas with `?compare=main`
   - Verify: step nodes show diff colors
4. Navigate to an architecture diagram with `?compare=main`
   - Verify: architecture nodes show diff colors
5. Toggle legend on each canvas — verify "Diff" section appears
6. Verify trace mode still works alongside diff mode

- [ ] **Step 4: Commit if fixes needed**
