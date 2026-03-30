# Journey Layout Engine Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the BFS-based journey layout engine with a topological layering algorithm that produces Miro/FigJam-style left-to-right flows with proper decision fork handling.

**Architecture:** New `layoutJourneyNodes()` in `src/data/index.ts` using longest-path column assignment, DFS-based back-edge detection, decision-aware vertical positioning with happy-path y-inheritance, and branch isolation via subtree extent tracking. Edge routing changes in `geometry.ts` and `edge.tsx` add journey-specific port selection and back-edge arc rendering.

**Tech Stack:** TypeScript, SVG, React (existing canvas infrastructure unchanged)

**Spec:** `docs/superpowers/specs/2026-03-30-journey-layout-engine-design.md`

---

### Task 1: Add `journeyPortSides()` to geometry.ts

Journey edges should always flow left-to-right. This function replaces `autoPortSides` for journey canvases specifically.

**Files:**

- Modify: `src/features/canvas/utils/geometry.ts`

- [ ] **Step 1: Add `journeyPortSides` function after `autoPortSides` (after line 69)**

```typescript
/**
 * Journey-specific port selection: always left-to-right flow.
 * - Same column + vertical offset → bottom/top
 * - Back-edge (target left of source) → top/top (arc above)
 * - Default → right/left
 * - Decision alternate branches → bottom/left (fork down then continue right)
 */
export function journeyPortSides(
  from: { x: number; y: number; type: string },
  to: { x: number; y: number; type: string },
  opts?: { isBackEdge?: boolean; isDecisionBranch?: boolean },
): [PortSide, PortSide] {
  const fw = from.type === 'decision' ? DECISION_SIZE : NODE_WIDTH;
  const tw = to.type === 'decision' ? DECISION_SIZE : NODE_WIDTH;
  const fromCx = from.x + fw / 2;
  const toCx = to.x + tw / 2;

  // Back-edges: arc above via top ports
  if (opts?.isBackEdge) {
    return ['top', 'top'];
  }

  // Same column (vertical edge within a fork group)
  if (Math.abs(fromCx - toCx) < 10) {
    const fromCy = from.y + (from.type === 'decision' ? DECISION_SIZE / 2 : NODE_HEIGHT / 2);
    const toCy = to.y + (to.type === 'decision' ? DECISION_SIZE / 2 : NODE_HEIGHT / 2);
    return toCy > fromCy ? ['bottom', 'top'] : ['top', 'bottom'];
  }

  // Decision alternate branch: exit bottom, enter left
  if (opts?.isDecisionBranch && from.type === 'decision') {
    return ['bottom', 'left'];
  }

  // Default: strict left-to-right
  return ['right', 'left'];
}
```

- [ ] **Step 2: Add `backEdgeArc` path function after `smoothPath` (after line 101)**

Back-edges need a distinct curved arc that goes above the flow (negative y) so they don't collide with forward edges.

```typescript
/**
 * Back-edge arc: curves above the flow from a later node back to an earlier one.
 * Uses a large vertical offset to arc above intervening nodes.
 */
export function backEdgeArc(fx: number, fy: number, tx: number, ty: number): string {
  const dx = Math.abs(tx - fx);
  const arcHeight = Math.max(dx * 0.3, 60);
  const midX = (fx + tx) / 2;
  const midY = Math.min(fy, ty) - arcHeight;
  return `M${fx},${fy} Q${midX},${midY} ${tx},${ty}`;
}
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm typecheck`
Expected: PASS (new functions are exported but not yet consumed)

- [ ] **Step 4: Commit**

```bash
git add src/features/canvas/utils/geometry.ts
git commit -m "feat(canvas): add journey-specific port selection and back-edge arc routing"
```

---

### Task 2: Replace `layoutJourneyNodes()` in data/index.ts

This is the core algorithm change. Replace the BFS-based layout with topological layering.

**Files:**

- Modify: `src/data/index.ts:135-315` (replace `layoutJourneyNodes` function entirely)

- [ ] **Step 1: Replace the layout constants and function signature (lines 135-151)**

Keep the same function signature. Update the constants — `NODE_W` and `NODE_H` stay the same, but add a comment about what they represent in the new algorithm.

```typescript
/*  1. Journey Horizontal Layout Engine                                */
/*  Topological layering with decision-aware vertical positioning      */
/* ------------------------------------------------------------------ */

const NODE_W = 200;
const NODE_H = 80;
const H_GAP = 100;
const V_GAP = 100;
const MULTI_ENTRY_GAP = 200; // Extra vertical gap between sub-journeys

function layoutJourneyNodes(rawNodes: RawJourneyNode[], rawEdges: RawJourneyEdge[]): JourneyNode[] {
  // If all nodes already have x/y, use them as-is (backwards compat)
  const allHavePositions = rawNodes.every(
    (n) => typeof n.x === 'number' && typeof n.y === 'number',
  );
  if (allHavePositions) {
    return rawNodes as JourneyNode[];
  }
```

- [ ] **Step 2: Build adjacency and detect back-edges via DFS**

Replace the old BFS seeding + back-edge detection (lines 153-212) with:

```typescript
// Build adjacency from edges
const outgoing = new Map<string, string[]>();
const incoming = new Map<string, string[]>();
for (const node of rawNodes) {
  outgoing.set(node.id, []);
  incoming.set(node.id, []);
}
for (const edge of rawEdges) {
  outgoing.get(edge.from)?.push(edge.to);
  incoming.get(edge.to)?.push(edge.from);
}

// Detect back-edges via DFS (edges that form cycles)
const backEdgeSet = new Set<number>();
const visited = new Set<string>();
const inStack = new Set<string>();

function dfsDetectBack(nodeId: string) {
  visited.add(nodeId);
  inStack.add(nodeId);
  for (const next of outgoing.get(nodeId) ?? []) {
    if (inStack.has(next)) {
      // This edge forms a cycle — mark it as a back-edge
      const ei = rawEdges.findIndex((e) => e.from === nodeId && e.to === next);
      if (ei >= 0) backEdgeSet.add(ei);
    } else if (!visited.has(next)) {
      dfsDetectBack(next);
    }
  }
  inStack.delete(nodeId);
}

// Find entry/root nodes
const entryIds = rawNodes
  .filter((n) => n.type === 'entry' || (incoming.get(n.id) ?? []).length === 0)
  .map((n) => n.id);
const roots = entryIds.length > 0 ? entryIds : [rawNodes[0]?.id].filter(Boolean);

for (const r of roots) {
  if (!visited.has(r)) dfsDetectBack(r);
}
// Visit any remaining unreachable nodes
for (const node of rawNodes) {
  if (!visited.has(node.id)) dfsDetectBack(node.id);
}

// Build DAG adjacency (excluding back-edges)
const dagOutgoing = new Map<string, string[]>();
for (const node of rawNodes) dagOutgoing.set(node.id, []);
rawEdges.forEach((edge, i) => {
  if (!backEdgeSet.has(i)) {
    dagOutgoing.get(edge.from)?.push(edge.to);
  }
});
```

- [ ] **Step 3: Longest-path column assignment**

Replace the old BFS leveling + merge promotion + cascade (lines 165-252) with:

```typescript
// ── Longest-path column assignment ──
// Each node's column = longest path from any root to that node in the DAG.
// This guarantees every node is strictly right of ALL predecessors.
const column = new Map<string, number>();
const memo = new Map<string, number>();

function longestPathTo(nodeId: string): number {
  if (memo.has(nodeId)) return memo.get(nodeId)!;
  // Prevent infinite recursion on missed cycles
  memo.set(nodeId, 0);

  const parents = (incoming.get(nodeId) ?? []).filter((p) => {
    const ei = rawEdges.findIndex((e) => e.from === p && e.to === nodeId);
    return !backEdgeSet.has(ei);
  });

  if (parents.length === 0) {
    memo.set(nodeId, 0);
    return 0;
  }

  const maxParent = Math.max(...parents.map((p) => longestPathTo(p)));
  const result = maxParent + 1;
  memo.set(nodeId, result);
  return result;
}

for (const node of rawNodes) {
  column.set(node.id, longestPathTo(node.id));
}
```

- [ ] **Step 4: Group entries and identify sub-journeys**

For multi-entry journeys (like cart), group nodes by which entry they're reachable from.

```typescript
// ── Identify sub-journeys (connected components from each entry) ──
// Each entry node roots a sub-journey. Nodes reachable from multiple entries
// are assigned to the first entry that reaches them.
const nodeEntry = new Map<string, string>(); // nodeId → entryId

function assignEntry(entryId: string) {
  const queue = [entryId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (nodeEntry.has(cur)) continue;
    nodeEntry.set(cur, entryId);
    for (const next of dagOutgoing.get(cur) ?? []) {
      if (!nodeEntry.has(next)) queue.push(next);
    }
  }
}

for (const r of roots) assignEntry(r);
// Assign any orphans
for (const node of rawNodes) {
  if (!nodeEntry.has(node.id)) nodeEntry.set(node.id, node.id);
}

// Group entries in order of appearance
const entryOrder = roots.filter((r) => rawNodes.some((n) => nodeEntry.get(n.id) === r));
```

- [ ] **Step 5: Decision-aware vertical positioning with branch isolation**

This is the core vertical layout logic. For each sub-journey, walk the DAG depth-first, assigning y positions with happy-path y-inheritance and branch subtree isolation.

```typescript
  // ── Decision-aware vertical positioning ──
  // Walk each sub-journey depth-first. At decision nodes, the first option
  // inherits the parent's y (stays on the happy-path horizontal line).
  // Alternate options stack below. Each branch's subtree is isolated vertically.
  const positions = new Map<string, { x: number; y: number }>();

  // Build a map from decision node id → ordered option target ids
  const decisionOptions = new Map<string, string[]>();
  for (const node of rawNodes) {
    if (node.type === 'decision' && node.options) {
      decisionOptions.set(node.id, node.options.map((o) => o.to));
    }
  }

  // Get the ordered children of a node in the DAG, respecting decision option order
  function getOrderedChildren(nodeId: string): string[] {
    const optOrder = decisionOptions.get(nodeId);
    const children = dagOutgoing.get(nodeId) ?? [];
    if (optOrder) {
      // Sort children by decision option order; any not in options go last
      const ordered: string[] = [];
      for (const target of optOrder) {
        if (children.includes(target)) ordered.push(target);
      }
      for (const c of children) {
        if (!ordered.includes(c)) ordered.push(c);
      }
      return ordered;
    }
    return children;
  }

  // Compute the vertical extent (height) of a subtree rooted at a node.
  // This is used to reserve vertical space for branches so they don't overlap.
  const subtreeExtentCache = new Map<string, number>();

  function subtreeExtent(nodeId: string, visitedSet: Set<string>): number {
    if (subtreeExtentCache.has(nodeId) && !visitedSet.has(nodeId)) {
      return subtreeExtentCache.get(nodeId)!;
    }
    if (visitedSet.has(nodeId)) return NODE_H;
    visitedSet.add(nodeId);

    const children = getOrderedChildren(nodeId);
    if (children.length === 0) {
      subtreeExtentCache.set(nodeId, NODE_H);
      return NODE_H;
    }

    // For decision nodes, branches stack vertically
    const parentNode = rawNodes.find((n) => n.id === nodeId);
    if (parentNode?.type === 'decision' && children.length > 1) {
      let totalHeight = 0;
      for (let i = 0; i < children.length; i++) {
        if (i > 0) totalHeight += V_GAP;
        totalHeight += subtreeExtent(children[i], new Set(visitedSet));
      }
      subtreeExtentCache.set(nodeId, totalHeight);
      return totalHeight;
    }

    // For linear nodes, extent = max of children extents
    const maxChildExtent = Math.max(
      ...children.map((c) => subtreeExtent(c, new Set(visitedSet))),
    );
    subtreeExtentCache.set(nodeId, maxChildExtent);
    return maxChildExtent;
  }

  // Layout a sub-journey starting from an entry node at a given y offset
  function layoutSubJourney(entryId: string, yStart: number): number {
    const placed = new Set<string>();

    function placeNode(nodeId: string, y: number) {
      if (placed.has(nodeId)) return;
      placed.add(nodeId);

      const col = column.get(nodeId) ?? 0;
      positions.set(nodeId, {
        x: col * (NODE_W + H_GAP),
        y,
      });

      const children = getOrderedChildren(nodeId);
      const node = rawNodes.find((n) => n.id === nodeId);

      if (node?.type === 'decision' && children.length > 1) {
        // Decision fork: first option inherits y, alternates stack below
        let currentY = y;
        for (let i = 0; i < children.length; i++) {
          if (i === 0) {
            // Happy path — same y as decision
            placeNode(children[i], currentY);
            currentY += subtreeExtent(children[i], new Set()) + V_GAP;
          } else {
            // Alternate branch — below previous branch's extent
            placeNode(children[i], currentY);
            currentY += subtreeExtent(children[i], new Set()) + V_GAP;
          }
        }
      } else {
        // Linear flow or single child — place all children at same y
        for (const child of children) {
          placeNode(child, y);
        }
      }
    }

    placeNode(entryId, yStart);

    // Find the max y extent of this sub-journey
    let maxY = yStart;
    for (const [nid, pos] of positions) {
      if (nodeEntry.get(nid) === entryId) {
        maxY = Math.max(maxY, pos.y + NODE_H);
      }
    }
    return maxY;
  }

  // Layout each sub-journey with vertical separation
  let currentYOffset = 0;
  for (const entryId of entryOrder) {
    const maxY = layoutSubJourney(entryId, currentYOffset);
    currentYOffset = maxY + MULTI_ENTRY_GAP;
  }

  // ── Normalize: translate so first entry is at (0, 0) ──
  const firstEntry = positions.get(roots[0]);
  if (firstEntry) {
    const dx = firstEntry.x;
    const dy = firstEntry.y;
    for (const [id, pos] of positions) {
      positions.set(id, { x: pos.x - dx, y: pos.y - dy });
    }
  }

  return rawNodes.map((node) => ({
    ...node,
    x: positions.get(node.id)?.x ?? 0,
    y: positions.get(node.id)?.y ?? 0,
  })) as JourneyNode[];
}
```

- [ ] **Step 6: Also export `backEdgeSet` for use by the canvas**

The journey canvas needs to know which edges are back-edges for visual treatment. Add a separate exported function that computes back-edges, or better: modify the data transformer to include this info.

Add a new exported helper after `layoutJourneyNodes` (but before `cleanJourneyTitle`):

```typescript
/**
 * Detect back-edges (cycle edges) in a journey's edge list.
 * Returns a Set of edge indices that are back-edges.
 * Used by JourneyCanvas to render back-edges with distinct visual treatment.
 */
export function detectJourneyBackEdges(
  nodes: { id: string; type: string }[],
  edges: { from: string; to: string }[],
): Set<number> {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const node of nodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }
  for (const edge of edges) {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.get(edge.to)?.push(edge.from);
  }

  const backEdges = new Set<number>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string) {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const next of outgoing.get(nodeId) ?? []) {
      if (inStack.has(next)) {
        const ei = edges.findIndex((e) => e.from === nodeId && e.to === next);
        if (ei >= 0) backEdges.add(ei);
      } else if (!visited.has(next)) {
        dfs(next);
      }
    }
    inStack.delete(nodeId);
  }

  const roots = nodes
    .filter((n) => n.type === 'entry' || (incoming.get(n.id) ?? []).length === 0)
    .map((n) => n.id);
  for (const r of roots) {
    if (!visited.has(r)) dfs(r);
  }
  for (const node of nodes) {
    if (!visited.has(node.id)) dfs(node.id);
  }

  return backEdges;
}
```

- [ ] **Step 7: Verify build passes**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/data/index.ts
git commit -m "feat(layout): replace BFS journey layout with topological layering engine"
```

---

### Task 3: Update Edge and AnimatedEdge to support journey port selection and back-edges

**Files:**

- Modify: `src/features/canvas/components/edge.tsx`
- Modify: `src/features/canvas/components/animated-edge.tsx`

- [ ] **Step 1: Update Edge component to accept journey-specific props and use `journeyPortSides`**

Replace the entire `edge.tsx`:

```typescript
import {
  getPort,
  smoothPath,
  backEdgeArc,
  autoPortSides,
  journeyPortSides,
} from '../utils/geometry';

interface EdgeProps {
  from: { x: number; y: number; type: string };
  to: { x: number; y: number; type: string };
  isDecision?: boolean;
  isLit?: boolean;
  isDimmed?: boolean;
  isBackEdge?: boolean;
  isDecisionBranch?: boolean;
  useJourneyPorts?: boolean;
}

export function Edge({
  from,
  to,
  isDecision,
  isLit,
  isDimmed,
  isBackEdge,
  isDecisionBranch,
  useJourneyPorts,
}: EdgeProps) {
  const [fDir, tDir] = useJourneyPorts
    ? journeyPortSides(from, to, { isBackEdge, isDecisionBranch })
    : autoPortSides(from, to);
  const fp = getPort(from, fDir);
  const tp = getPort(to, tDir);

  const d = isBackEdge
    ? backEdgeArc(fp.x, fp.y, tp.x, tp.y)
    : smoothPath(fp.x, fp.y, fDir, tp.x, tp.y, tDir);

  // When lit, this edge becomes a subtle track — the AnimatedEdge is the primary visual
  const opacity = isDimmed ? 0.06 : isLit ? 0.2 : 0.25;
  const strokeWidth = isLit ? 1.5 : 1.5;
  const stroke = isBackEdge
    ? 'rgba(234,179,8,0.5)'
    : isDecision
      ? 'rgba(167,139,250,0.6)'
      : 'rgba(61,140,117,0.6)';
  const marker = isLit ? undefined : isBackEdge ? 'url(#arrow-back)' : isDecision ? 'url(#arrow-decision)' : 'url(#arrow)';

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={isDecision || isBackEdge ? '5 5' : undefined}
      markerEnd={marker}
      style={{ opacity, transition: 'opacity 400ms ease-out, stroke-width 300ms ease-out' }}
    />
  );
}
```

- [ ] **Step 2: Update AnimatedEdge to accept the same journey-specific props**

Replace the entire `animated-edge.tsx`:

```typescript
import {
  getPort,
  smoothPath,
  backEdgeArc,
  autoPortSides,
  journeyPortSides,
} from '../utils/geometry';

interface AnimatedEdgeProps {
  from: { x: number; y: number; type: string };
  to: { x: number; y: number; type: string };
  isLit?: boolean;
  isDimmed?: boolean;
  hasActivePath?: boolean;
  isBackEdge?: boolean;
  isDecisionBranch?: boolean;
  useJourneyPorts?: boolean;
}

export function AnimatedEdge({
  from,
  to,
  isLit,
  isDimmed,
  hasActivePath,
  isBackEdge,
  isDecisionBranch,
  useJourneyPorts,
}: AnimatedEdgeProps) {
  // When path is active: only show on lit edges
  // When no path: show ambient on all edges
  if (hasActivePath && (!isLit || isDimmed)) return null;

  // Don't animate back-edges
  if (isBackEdge) return null;

  const [fDir, tDir] = useJourneyPorts
    ? journeyPortSides(from, to, { isBackEdge, isDecisionBranch })
    : autoPortSides(from, to);
  const fp = getPort(from, fDir);
  const tp = getPort(to, tDir);
  const d = smoothPath(fp.x, fp.y, fDir, tp.x, tp.y, tDir);

  const opacity = isLit ? 0.85 : 0.08;
  const color = isLit ? 'rgba(61,140,117,0.7)' : 'rgba(255,255,255,0.15)';
  const marker = isLit ? 'url(#arrow-lit)' : undefined;

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={isLit ? 2.5 : 1}
      strokeDasharray="4 16"
      strokeLinecap="round"
      markerEnd={marker}
      style={{
        animation: 'flow-pulse 1.8s linear infinite',
        opacity,
        transition: 'opacity 400ms ease-out',
      }}
    />
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm typecheck`
Expected: PASS (new props are optional, existing callers unaffected)

- [ ] **Step 4: Commit**

```bash
git add src/features/canvas/components/edge.tsx src/features/canvas/components/animated-edge.tsx
git commit -m "feat(canvas): add journey port selection and back-edge rendering to Edge components"
```

---

### Task 4: Update JourneyCanvas to pass back-edge and decision-branch info to edges

**Files:**

- Modify: `src/features/journeys/journey-canvas/index.tsx`

- [ ] **Step 1: Import `detectJourneyBackEdges` and compute back-edges + decision branch info**

Add import at top of file (after existing imports, around line 21):

```typescript
import { detectJourneyBackEdges } from '@/data/index';
```

Add computation inside the component, after the `nodeMap` line (after line 81):

```typescript
// Detect back-edges and decision branch edges for visual treatment
const backEdges = detectJourneyBackEdges(journey.nodes, journey.edges);

// Build set of decision option target IDs for identifying decision branches
const decisionBranchTargets = new Map<string, Set<string>>();
for (const node of journey.nodes) {
  if (node.type === 'decision' && node.options) {
    const targets = new Set<string>();
    // Skip first option (happy path exits right, not bottom)
    for (let i = 1; i < node.options.length; i++) {
      targets.add(node.options[i].to);
    }
    decisionBranchTargets.set(node.id, targets);
  }
}
```

- [ ] **Step 2: Pass new props to Edge and AnimatedEdge in the edges render block**

Replace the edge rendering section (lines 141-171) with:

```typescript
      {/* Edges */}
      {journey.edges.map((edge, i) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return null;
        if (!isNodeVisible(fromNode) || !isNodeVisible(toNode)) return null;

        const isLit = litEdges.has(i);
        const isDimmed = hasPath && !isLit;
        const isBackEdge = backEdges.has(i);
        const isDecisionBranch = decisionBranchTargets.get(edge.from)?.has(edge.to) ?? false;

        return (
          <g
            key={`${edge.from}-${edge.to}-${edge.opt ?? ''}`}
            style={{ opacity: edgesVisible ? 1 : 0, transition: 'opacity 400ms ease-out' }}
          >
            <Edge
              from={fromNode}
              to={toNode}
              isDecision={!!edge.opt}
              isLit={isLit}
              isDimmed={isDimmed}
              isBackEdge={isBackEdge}
              isDecisionBranch={isDecisionBranch}
              useJourneyPorts
            />
            <AnimatedEdge
              from={fromNode}
              to={toNode}
              isLit={isLit}
              isDimmed={isDimmed}
              hasActivePath={hasPath}
              isBackEdge={isBackEdge}
              isDecisionBranch={isDecisionBranch}
              useJourneyPorts
            />
          </g>
        );
      })}
```

- [ ] **Step 3: Add back-edge arrow marker definition**

In `src/features/canvas/canvas-provider/index.tsx`, add a new marker after the `arrow-decision` marker (after line 75, before the closing `</defs>`):

```tsx
<marker
  id="arrow-back"
  viewBox="0 0 10 10"
  refX="10"
  refY="5"
  markerWidth="5"
  markerHeight="5"
  orient="auto"
>
  <path d="M2,2 L10,5 L2,8 Z" fill="rgba(234,179,8,0.5)" />
</marker>
```

**Files:**

- Modify: `src/features/canvas/canvas-provider/index.tsx:75` (add after `arrow-decision` marker)

- [ ] **Step 4: Verify build passes**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/journeys/journey-canvas/index.tsx
git commit -m "feat(journeys): wire back-edge detection and journey port selection into canvas"
```

---

### Task 5: Visual verification and tuning

**Files:**

- Possibly tune: `src/data/index.ts` (constants), `src/features/canvas/utils/geometry.ts` (arc params)

- [ ] **Step 1: Start dev server and check key journeys**

Run: `pnpm dev`

Open in browser and check these journeys (ordered by complexity):

1. **`password-reset`** — Simple linear + 1 decision + 1 back-edge (retry loop). Verify:
   - Flow goes strictly left to right
   - "OTP valid?" decision forks: Yes continues right, No arcs back to "Enter OTP"
   - Back-edge is dashed, curves above, distinct color

2. **`shop-create`** — Linear + 1 decision. Verify:
   - "Slug available?" forks: Yes → Enter Description continues right on happy path line
   - No → Show Slug Error appears BELOW, not to the left
   - No more backward-flowing edges

3. **`route-protection`** — 3 sequential decisions. Verify:
   - All 3 decisions fork vertically with options stacking below
   - No edge crossings between the different decision branches
   - Flow moves strictly left to right

4. **`cart`** — 5 entry points, 11 decisions. Verify:
   - Each sub-journey (add-to-cart, view-cart, cart-actions, merge-on-login, pre-checkout-validation) has its own horizontal lane
   - Sub-journeys are vertically separated with clear gaps
   - Decision branches within each sub-journey are isolated

- [ ] **Step 2: Check that non-journey canvases are unaffected**

Open ERD canvas, a lifecycle canvas, and an architecture canvas. Verify they render identically (they don't use `journeyPortSides` or the new layout engine).

- [ ] **Step 3: Tune constants if needed**

If branches are too close vertically, increase `V_GAP`. If sub-journeys are too far apart, decrease `MULTI_ENTRY_GAP`. If back-edge arcs clip through nodes, increase the `arcHeight` factor in `backEdgeArc`.

- [ ] **Step 4: Run full CI checks**

Run: `pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck && pnpm build`
Expected: All PASS

- [ ] **Step 5: Commit any tuning changes**

```bash
git add -u
git commit -m "fix(layout): tune journey layout constants after visual verification"
```

---

### Task 6: Final build verification

- [ ] **Step 1: Full production build**

Run: `pnpm build`
Expected: PASS — all pages generate successfully (SSG)

- [ ] **Step 2: Spot-check built output**

Run: `pnpm start`
Open browser, check password-reset, shop-create, route-protection, and cart journeys render correctly in the production build.

- [ ] **Step 3: Commit if any final fixes needed**

```bash
git add -u
git commit -m "fix: final journey layout adjustments"
```
