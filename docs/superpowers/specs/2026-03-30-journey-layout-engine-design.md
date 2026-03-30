# Journey Layout Engine Redesign

## Problem

The current BFS-based layout engine for journey canvases produces layouts that don't match how product teams expect to see user journey flows (Miro/FigJam style). Specific issues:

- **Backward node placement** — Decision branches can place nodes to the left of their parent, breaking the left-to-right flow expectation
- **Edge crossings** — Branches from different decisions overlap and cross each other
- **No fork/join awareness** — Decision branches don't fan out vertically; they scatter based on BFS hop count
- **No happy path emphasis** — Primary flow and error branches get equal visual treatment

## Design Decisions

- **Happy path horizontal, forks vertical, back-edges distinct** — The primary flow reads as a straight horizontal line. Decision forks fan downward. Retry/loop edges render as dashed arcs above the flow.
- **Merge at max branch depth** — Merge points placed at `max(all predecessor columns) + 1`. Short branches get a long spanning edge to the merge, visually communicating "this path is simpler."
- **Topological layering with decision-aware vertical grouping** — Strict left-to-right via longest-path column assignment, decision branches grouped vertically, happy path emphasized but not forced.

## Data Context

- 26 journeys total
- Most have 1-3 decisions (simple forks)
- `cart` is most complex: 46 nodes, 11 decisions, 5 entry points
- 3 journeys have back-edges (retry loops): password-reset, email-change, signup
- `route-protection` has 3 sequential decisions — the most problematic current layout

## Algorithm

### 1. Column Assignment (Topological Layering)

Replace BFS with longest-path-from-entry. Each node's column = the longest path from any entry to that node.

Guarantees:

- Every node is strictly right of all its predecessors
- Decision branches that reconverge get proper spacing
- No backward flow possible

Back-edges (cycles) are detected first via DFS and excluded from layering.

### 2. Decision Fork Handling

When a decision node is at column `C`, all direct branch targets are assigned to column `C+1` minimum (may be pushed further right by their own predecessors). Branch targets are stacked vertically — first option stays closest to the decision's y-position, alternates fan downward.

### 3. Merge Point Placement

A merge node (multiple incoming non-back-edges) is placed at `max(all predecessor columns) + 1`. Shorter branches get long spanning edges to reach it.

### 4. Back-Edge Detection

Any edge where `to` is an ancestor of `from` in the DAG is a back-edge. Back-edges are excluded from column/row assignment entirely. Rendered as visually distinct arcs.

### 5. Vertical Positioning

**Happy path y-inheritance:** Each decision's first option inherits the parent's y-position (same horizontal line). Subsequent options stack below with `V_GAP` spacing.

**Branch isolation:** Each branch from a decision owns a vertical lane. Walk branches depth-first, track the vertical extent (min/max y) of each subtree. Sibling branches start below the previous branch's full extent + gap. This prevents crossings.

**Multi-entry journeys:** Multiple entry nodes (e.g., cart with 5 sub-journeys) get separate horizontal lanes, separated by `2 * V_GAP`.

**Origin:** After positioning, translate so the first entry node is at (0, 0). No centering relative to tallest column.

### 6. Edge Routing

**Forward edges:** Exit `right`, enter `left`. Exception: same-column vertical edges use `bottom` → `top`.

**Decision branch edges:** First option exits `right`. Alternate options exit `bottom` from decision, curve right to enter branch target from `left`.

**Back-edges:** Dashed arc curving above the flow (negative y). Exit `top` of later node, enter `top` of earlier node. Distinct dash pattern.

**Long spanning edges:** Straight `right` → `left` bezier for short branches reaching distant merge points.

**Note:** Journey canvases don't use `LabelPill` — decision options are rendered as pills directly on the `DecisionNode` component, so no label pill changes needed.

## Files Changed

| File                                             | Change                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `src/data/index.ts`                              | Replace `layoutJourneyNodes()` with new topological layering algorithm                            |
| `src/features/canvas/utils/geometry.ts`          | Add `journeyPortSides()` for journey-specific port logic (keep `autoPortSides` for ERD/lifecycle) |
| `src/features/canvas/components/edge.tsx`        | Use `journeyPortSides` for journey edges; back-edge arc routing                                   |
| `src/features/journeys/journey-canvas/index.tsx` | Pass back-edge set to Edge components for visual treatment                                        |

## Files NOT Changed

- Decision node, step node, entry node components (rendering is fine)
- Canvas provider, pan/zoom, minimap, toolbar
- All non-journey canvases (ERD, lifecycle, architecture)
- Journey JSON data files
- Types (x/y are computed fields, no schema changes)

## Constants

Keep `NODE_W=200, NODE_H=80, H_GAP=100, V_GAP=100` initially. Tune after seeing results — the new layout's branch subtrees may need adjustment.
