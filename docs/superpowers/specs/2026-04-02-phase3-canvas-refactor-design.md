# Phase 3: Canvas Refactor — Shared Node System & Tooltip Unification

> Eliminate duplicated behavioral logic across 5 canvas node components and 4 tooltip implementations. Build composable infrastructure that scales to new node/tooltip types.

**Date:** 2026-04-02
**Author:** Kyle Holloway + Claude
**Status:** Approved
**Spec reference:** `docs/superpowers/specs/2026-04-02-codebase-overhaul-design.md` — Phase 3 section

---

## Problem Statement

The canvas subsystem has ~2,600 lines of duplicated code across 9 components:

**5 node components** (~1,255 lines total):

- `step-node.tsx` (349 lines), `entry-node.tsx` (285 lines), `decision-node.tsx` (254 lines), `entity-node.tsx` (194 lines), `state-node.tsx` (173 lines)
- Each reimplements: diff status → opacity/pointer-events calculation (~15 lines), three radial gradient glow patterns (~50 lines), inline style object construction
- All 5 share the same `isGhost`, `isDiffChanged`, `diffColor`, `isInteractive`, `diffOpacity`, `opacity` logic verbatim

**4 tooltip components** (~1,384 lines total):

- `node-tooltip.tsx` (482 lines), `entity-tooltip.tsx` (419 lines), `state-tooltip.tsx` (265 lines), `arch-tooltip.tsx` (218 lines)
- Each reimplements: foreignObject positioning, absolute div placement, backdrop blur/border/shadow/border-radius, SVG arrow, tooltip-in animation
- 3 of 4 implement the same timer-based hover bridging zone

**159 hardcoded hex values** across all canvas TSX files (inline styles required by SVG foreignObject).

Adding a new node type currently requires ~200 lines of boilerplate. After this refactor: ~50 lines (layout only).

---

## Solution

### Hook: `useNodeState`

**Location:** `src/features/canvas/hooks/use-node-state.ts`

Extracts all shared behavioral logic from nodes into a single hook.

```typescript
interface NodeStateInput {
  diffStatus?: DiffStatus;
  isDimmed?: boolean;
  isPlanned?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
}

interface NodeStateOutput {
  opacity: number;
  isInteractive: boolean;
  pointerEvents: 'auto' | 'none';
  cursor: 'pointer' | 'default';
  isGhost: boolean;
  isDiffChanged: boolean;
  diffColor: string | undefined;
  containerStyle: React.CSSProperties;
}

function useNodeState(input: NodeStateInput): NodeStateOutput;
```

The `containerStyle` is a pre-built inline style object combining `cursor`, `opacity`, `transition: 'opacity 400ms ease-out'`, and `pointerEvents`. Every node applies it to its root `<g>` element.

The opacity cascade:

1. `isDimmed` → 0.15 (trace mode, non-traced nodes)
2. `diffStatus === 'removed'` (ghost) → 0.35
3. `diffStatus === 'unchanged'` → 0.2
4. `isPlanned` → 0.45
5. Otherwise → 1

### Component: `NodeGlow`

**Location:** `src/features/canvas/components/node-glow.tsx`

Extracts the radial gradient SVG glow patterns. Currently each node renders 2-3 `<defs>` + `<ellipse>`/`<rect>` blocks for diff glow, hover glow, and selection glow. All use the same radial gradient structure with slightly different parameters.

```typescript
interface NodeGlowProps {
  type: 'diff' | 'hover' | 'selection';
  color: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
  shape?: 'rect' | 'ellipse';
  id: string;
}
```

Rendering logic per type:

- **diff**: animated (`glow-pulse` keyframe), higher stopOpacity (0.3→0), dashed ring border
- **hover**: no animation, subtle stopOpacity (0.08→0)
- **selection**: animated (`glow-pulse`), medium stopOpacity (0.15→0)

Each node conditionally renders `<NodeGlow>` based on `useNodeState` output instead of copy-pasting 50 lines of SVG gradient definitions.

### Component: `TooltipWrapper`

**Location:** `src/features/canvas/components/tooltip-wrapper.tsx`

Shared tooltip infrastructure — positioning, backdrop, arrow.

```typescript
interface TooltipWrapperProps {
  nodeX: number;
  nodeY: number;
  nodeWidth: number;
  tooltipWidth?: number;
  visible: boolean;
  interactive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
}
```

Internally renders:

1. `<foreignObject>` at node position with `overflow="visible"`
2. Absolute-positioned `<div>` with calculated left offset: `nodeWidth / 2 - tooltipWidth / 2`
3. Backdrop: background (`--bg-panel` at 97% opacity), 1px border, 12px blur, box shadow, 8px border-radius
4. Content: `{children}`
5. Arrow SVG: centered triangle at bottom

The backdrop values currently use `TT_BG`, `TT_BORDER`, `TT_SHADOW` constants from `canvas/constants/tooltip-styles.ts`. These get updated to use CSS variable references where possible:

- `TT_BG` → `rgb(var(--bg-panel-rgb) / 97%)`
- `TT_BORDER` → `rgb(var(--color-white-rgb) / var(--opacity-300))`
- `TT_SHADOW` → uses `--color-black-rgb` with opacity tokens

### Hook: `useTooltipHover`

**Location:** `src/features/canvas/hooks/use-tooltip-hover.ts`

Extracts the timer-based hover bridging pattern from entity-tooltip, state-tooltip, arch-tooltip.

```typescript
function useTooltipHover(closeDelay?: number): {
  visible: boolean;
  show: () => void;
  scheduleClose: () => void;
};
```

Default `closeDelay` = 120ms (matches current `CLOSE_DELAY`). Handles: show on enter (clears pending close timer), schedule close on leave (delayed), cleanup on unmount.

Node-tooltip uses a different pattern (click-to-pin, not hover) — it doesn't use this hook.

### Tooltip Sub-Components

**Location:** `src/features/canvas/components/tooltip-parts.tsx`

Small reusable building blocks for tooltip content, replacing ~20 duplicate inline style objects.

```typescript
// Labeled section with consistent spacing
function TooltipSection({ label, children }: { label: string; children: ReactNode });

// Small inline badge (colored dot + text)
function TooltipBadge({ label, color }: { label: string; color: string });

// Hover-highlighted link row
function TooltipLink({ label, href, icon?: ReactNode }: TooltipLinkProps);
```

These use the `sectionLabel` and `monoBlock` style constants from `tooltip-styles.ts`, updated to reference CSS variables.

### Canvas Color Tokens

**Location:** Update `src/features/canvas/constants/tooltip-styles.ts`

SVG inline styles can't use CSS custom properties directly (they need actual color values at render time). The existing `DIFF_COLORS` constant from `@/constants/diff` handles diff colors. For tooltip/node styles, update the constants file to:

1. Replace hardcoded hex values with references to the `DIFF_COLORS` map where applicable
2. Centralize remaining canvas-specific colors (text-muted, text-dim, background tints) into a `CANVAS_COLORS` constant that mirrors the CSS variables
3. Add a `CANVAS_TEXT` constant for the text color hierarchy used in inline styles

```typescript
export const CANVAS_COLORS = {
  textPrimary: '#e8e6e1',
  textSecondary: '#9a9790',
  textMuted: '#6a6860',
  textDim: '#4a4840',
  bgPanel: 'rgba(15,19,25,0.97)',
  bgSubtle: 'rgba(255,255,255,0.04)',
  borderSubtle: 'rgba(255,255,255,0.12)',
} as const;
```

This doesn't eliminate the hex values (SVG requires them) but centralizes them in one file instead of 9 files. When the Archway product adds theming (Phase 4+), only this file needs to change.

---

## Migration Plan

### Node migrations (5 tasks)

For each node component:

1. Import `useNodeState` and call it with the node's state props
2. Replace inline diff/opacity/pointer-events logic with `useNodeState` output
3. Replace glow SVG blocks with `<NodeGlow>` components
4. Replace hardcoded hex values with `CANVAS_COLORS` / `DIFF_COLORS` references
5. Delete removed code

Node components keep their unique layout/rendering:

- **StepNode**: method pill, sublabel, error badge
- **EntityNode**: frosted glass backdrop, category badge, field count
- **StateNode**: lifecycle color, centered label
- **DecisionNode**: diamond shape, option pills, choice highlighting
- **EntryNode**: pill shape, play icon, rich hover info

### Tooltip migrations (4 tasks)

For each tooltip:

1. Replace foreignObject/div/backdrop/arrow with `<TooltipWrapper>`
2. Replace inline section labels/badges with `<TooltipSection>`, `<TooltipBadge>`
3. For hover tooltips: replace timer logic with `useTooltipHover`
4. Replace hardcoded hex values with `CANVAS_COLORS` references
5. Move `arch-tooltip.tsx` from `features/architecture/` to `features/canvas/components/`

Tooltip components keep their domain-specific content:

- **NodeTooltip**: route links, lifecycle impacts, UX flags, error cases (click-to-pin)
- **EntityTooltip**: PK/FK badges, endpoint links, lifecycle links (hover with bridging)
- **StateTooltip**: transition lists (incoming/outgoing), terminal indicator (hover with bridging)
- **ArchTooltip**: connection lists (incoming/outgoing), external URL (hover with bridging)

---

## What's NOT Included

- No new canvas features or node types
- No changes to pan/zoom, edge rendering, minimap, toolbar, legend
- No responsive canvas changes (Phase 5)
- No animation system changes (Phase 6)
- No state management changes (Phase 4)

---

## Success Criteria

- **Zero duplicated** diff/opacity/pointer-events logic across node components
- **Zero duplicated** tooltip positioning/backdrop/arrow code
- **All canvas hex values** centralized in constants (not scattered across 9 files)
- **New node type** requires ~50 lines (layout only), not ~200 lines (layout + behavior + styling)
- **New tooltip type** requires content component only, not infrastructure
- **All CI checks pass** (format, lint, lint:styles, typecheck)
- **Visually identical** — no user-facing changes
