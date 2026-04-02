# Phase 3: Canvas Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ~2,600 lines of duplicated behavioral logic across 5 canvas node components and 4 tooltip components by extracting shared hooks, a glow component, a tooltip wrapper, and centralized color constants.

**Architecture:** Build shared infrastructure first (hooks, components, constants), then migrate each node and tooltip one at a time. Each node keeps its unique layout; each tooltip keeps its domain-specific content. Only the duplicated behavioral/styling infrastructure gets extracted.

**Tech Stack:** React, TypeScript, SVG inline styles (foreignObject). No SCSS modules for canvas components — SVG requires inline styles. Verification is CI checks (`pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck`).

**Spec reference:** `docs/superpowers/specs/2026-04-02-phase3-canvas-refactor-design.md`

---

## File Map

### New Files

| File                                                 | Purpose                                                |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `src/features/canvas/hooks/use-node-state.ts`        | Shared diff/opacity/interactivity logic for all nodes  |
| `src/features/canvas/hooks/use-tooltip-hover.ts`     | Timer-based hover bridging for tooltips                |
| `src/features/canvas/components/node-glow.tsx`       | Reusable radial gradient glow (diff, hover, selection) |
| `src/features/canvas/components/tooltip-wrapper.tsx` | Shared tooltip positioning, backdrop, arrow            |
| `src/features/canvas/components/tooltip-parts.tsx`   | Reusable tooltip sub-components (section, badge, link) |
| `src/features/canvas/constants/canvas-colors.ts`     | Centralized color constants for SVG inline styles      |

### Modified Files

| File                                                             | Changes                                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/canvas/constants/tooltip-styles.ts`                | Update hex values to use CANVAS_COLORS references                      |
| `src/features/canvas/components/entity-node.tsx`                 | Replace behavioral code with useNodeState + NodeGlow                   |
| `src/features/canvas/components/state-node.tsx`                  | Same pattern                                                           |
| `src/features/canvas/components/step-node.tsx`                   | Same pattern                                                           |
| `src/features/canvas/components/decision-node.tsx`               | Same pattern                                                           |
| `src/features/canvas/components/entry-node.tsx`                  | Same pattern                                                           |
| `src/features/canvas/components/entity-tooltip.tsx`              | Replace wrapper with TooltipWrapper + useTooltipHover                  |
| `src/features/canvas/components/state-tooltip.tsx`               | Same pattern                                                           |
| `src/features/canvas/components/node-tooltip.tsx`                | Replace wrapper with TooltipWrapper (no hover hook — click-to-pin)     |
| `src/features/architecture/architecture-canvas/arch-tooltip.tsx` | Replace wrapper with TooltipWrapper + useTooltipHover, move to canvas/ |

---

### Task 1: Create canvas color constants

**Files:**

- Create: `src/features/canvas/constants/canvas-colors.ts`
- Modify: `src/features/canvas/constants/tooltip-styles.ts`

- [ ] **Step 1: Create `src/features/canvas/constants/canvas-colors.ts`**

Centralize all inline-style color values used across canvas components. SVG `foreignObject` requires actual color values (not CSS custom properties), so these are the single source for canvas inline styles.

```typescript
/**
 * Centralized color constants for canvas SVG inline styles.
 * SVG foreignObject can't use CSS custom properties — these mirror the theme tokens.
 * When Archway adds theming, only this file needs to change.
 */
export const CANVAS_COLORS = {
  // Text hierarchy (mirrors --text-* tokens)
  textPrimary: '#e8e6e1',
  textSecondary: '#9a9790',
  textMuted: '#6a6860',
  textDim: '#4a4840',

  // Backgrounds
  bgPanel: 'rgba(15,19,25,0.97)',
  bgSubtle: 'rgba(255,255,255,0.04)',
  bgFrost: 'rgba(20,25,32,0.15)',

  // Borders
  borderSubtle: 'rgba(255,255,255,0.12)',
  borderMedium: 'rgba(255,255,255,0.2)',

  // Shadows
  tooltipShadow: '0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.3)',

  // Category badge colors (ERD)
  category: {
    core: '#3d8c75',
    shops: '#d4923a',
    commerce: '#e27739',
    social: '#9b7bd4',
    messaging: '#5b9fd6',
    content: '#5bbfcf',
    user: '#8a8580',
  } as Record<string, string>,
  categoryDefault: '#8a8580',
} as const;
```

- [ ] **Step 2: Update `tooltip-styles.ts` to use CANVAS_COLORS**

```typescript
import type React from 'react';
import { CANVAS_COLORS } from './canvas-colors';

export const TT_BG = CANVAS_COLORS.bgPanel;
export const TT_BORDER = CANVAS_COLORS.borderSubtle;
export const TT_SHADOW = CANVAS_COLORS.tooltipShadow;

export const sectionLabel: React.CSSProperties = {
  fontSize: '9px',
  color: CANVAS_COLORS.textDim,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '3px',
};

export const monoBlock: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'var(--font-family-mono)',
  background: CANVAS_COLORS.bgSubtle,
  padding: '4px 8px',
  borderRadius: '4px',
};
```

- [ ] **Step 3: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "feat: add centralized canvas color constants"
```

---

### Task 2: Create `useNodeState` hook

**Files:**

- Create: `src/features/canvas/hooks/use-node-state.ts`

- [ ] **Step 1: Create the hook**

```typescript
import type { DiffStatus } from '@/types/diff';
import { DIFF_COLORS } from '@/constants/diff';

interface NodeStateInput {
  diffStatus?: DiffStatus | null;
  isDimmed?: boolean;
  isPlanned?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
}

interface NodeStateOutput {
  /** Final computed opacity for the node container */
  opacity: number;
  /** Whether the node accepts clicks and hover */
  isInteractive: boolean;
  /** CSS pointer-events value */
  pointerEvents: 'auto' | 'none';
  /** CSS cursor value */
  cursor: 'pointer' | 'default';
  /** Node is removed in diff mode */
  isGhost: boolean;
  /** Node is added or modified in diff mode */
  isDiffChanged: boolean;
  /** Diff ring/glow color (from DIFF_COLORS), undefined when no diff or unchanged */
  diffColor: string | undefined;
  /** Pre-built inline style for the root <g> element */
  containerStyle: React.CSSProperties;
}

export function useNodeState({
  diffStatus,
  isDimmed,
  isPlanned,
  isHovered,
  isSelected,
}: NodeStateInput): NodeStateOutput {
  const isGhost = diffStatus === 'removed';
  const isDiffChanged = diffStatus === 'added' || diffStatus === 'modified';
  const diffColor = diffStatus && diffStatus !== 'unchanged' ? DIFF_COLORS[diffStatus] : undefined;

  const isInteractive = !isGhost && (!diffStatus || isDiffChanged);

  // Opacity cascade: dimmed > ghost > unchanged > planned > normal
  const diffOpacity = isGhost ? 0.35 : diffStatus === 'unchanged' ? 0.2 : 1;
  const opacity = isDimmed ? 0.15 : diffStatus != null ? diffOpacity : isPlanned ? 0.45 : 1;

  const containerStyle: React.CSSProperties = {
    cursor: isInteractive ? 'pointer' : 'default',
    opacity,
    transition: 'opacity 400ms ease-out',
    pointerEvents: isInteractive ? 'auto' : 'none',
  };

  return {
    opacity,
    isInteractive,
    pointerEvents: isInteractive ? 'auto' : 'none',
    cursor: isInteractive ? 'pointer' : 'default',
    isGhost,
    isDiffChanged,
    diffColor,
    containerStyle,
  };
}
```

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/hooks/use-node-state.ts
git commit -m "feat: add useNodeState hook for shared canvas node behavioral logic"
```

---

### Task 3: Create `NodeGlow` component

**Files:**

- Create: `src/features/canvas/components/node-glow.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { memo } from 'react';

interface NodeGlowProps {
  /** Unique ID for the SVG gradient definition */
  id: string;
  /** Glow type determines animation and intensity */
  type: 'diff' | 'hover' | 'selection';
  /** Glow color */
  color: string;
  /** Center X position */
  cx: number;
  /** Center Y position */
  cy: number;
  /** Glow radius (or rx for ellipse) */
  rx: number;
  /** Glow ry (only for ellipse shape) */
  ry?: number;
}

const GLOW_CONFIG = {
  diff: { innerOpacity: 0.3, animation: 'glow-pulse 3s ease-in-out infinite' },
  hover: { innerOpacity: 0.08, animation: undefined },
  selection: { innerOpacity: 0.15, animation: 'glow-pulse 3s ease-in-out infinite' },
} as const;

export const NodeGlow = memo(function NodeGlow({ id, type, color, cx, cy, rx, ry }: NodeGlowProps) {
  const config = GLOW_CONFIG[type];
  const gradientId = `glow-${type}-${id}`;

  return (
    <>
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor={color} stopOpacity={config.innerOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry ?? rx}
        fill={`url(#${gradientId})`}
        style={config.animation ? { animation: config.animation } : undefined}
      />
    </>
  );
});
```

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/node-glow.tsx
git commit -m "feat: add NodeGlow component for shared radial gradient glows"
```

---

### Task 4: Create `useTooltipHover` hook

**Files:**

- Create: `src/features/canvas/hooks/use-tooltip-hover.ts`

- [ ] **Step 1: Create the hook**

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_CLOSE_DELAY = 120;

/**
 * Timer-based hover bridging for canvas tooltips.
 * Shows tooltip on enter, delays close on leave to allow bridging the gap
 * between node and tooltip.
 */
export function useTooltipHover(closeDelay = DEFAULT_CLOSE_DELAY) {
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setVisible(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setVisible(false), closeDelay);
  }, [closeDelay]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return { visible, show, scheduleClose };
}
```

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/hooks/use-tooltip-hover.ts
git commit -m "feat: add useTooltipHover hook for tooltip bridging zone"
```

---

### Task 5: Create `TooltipWrapper` component

**Files:**

- Create: `src/features/canvas/components/tooltip-wrapper.tsx`

- [ ] **Step 1: Create the component**

Read the exact tooltip wrapper pattern from `src/features/canvas/components/state-tooltip.tsx` (lines 40-80) to understand the foreignObject + absolute div + backdrop + arrow structure, then extract it.

The component must render:

1. `<foreignObject>` positioned at `nodeX, nodeY - 8`, width 320, height 1, overflow visible
2. Absolute `<div>` at `bottom: 4`, `left: nodeWidth / 2 - tooltipWidth / 2`, with `tooltip-in 120ms` animation
3. Backdrop `<div>` with `TT_BG` background, `TT_BORDER` border, 8px radius, 12px blur, `TT_SHADOW`
4. Children content
5. Arrow SVG triangle at bottom center

Props: `nodeX`, `nodeY`, `nodeWidth`, `tooltipWidth` (default 280), `visible`, `interactive` (default true), `onMouseEnter`, `onMouseLeave`, `children`.

When `visible` is false, return null.

Import `TT_BG`, `TT_BORDER`, `TT_SHADOW` from the constants file.

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/tooltip-wrapper.tsx
git commit -m "feat: add TooltipWrapper for shared tooltip positioning and backdrop"
```

---

### Task 6: Create tooltip sub-components

**Files:**

- Create: `src/features/canvas/components/tooltip-parts.tsx`

- [ ] **Step 1: Create the sub-components**

Three small components that replace duplicated inline style objects across tooltips:

```tsx
import { CANVAS_COLORS } from '../constants/canvas-colors';
import { sectionLabel as sectionLabelStyle } from '../constants/tooltip-styles';

/** Labeled section with consistent spacing */
export function TooltipSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={sectionLabelStyle}>{label}</div>
      {children}
    </div>
  );
}

/** Small inline badge (colored dot or background tint + text) */
export function TooltipBadge({ label, color }: { label: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '9px',
        fontWeight: 600,
        padding: '1px 6px',
        borderRadius: '3px',
        color: color ?? CANVAS_COLORS.textSecondary,
        background: color ? `${color}1a` : CANVAS_COLORS.bgSubtle,
      }}
    >
      {label}
    </span>
  );
}

/** Hover-highlighted link row */
export function TooltipLink({
  label,
  href,
  color,
  onClick,
}: {
  label: string;
  href?: string;
  color?: string;
  onClick?: () => void;
}) {
  const Tag = href ? 'a' : 'span';
  return (
    <Tag
      href={href}
      onClick={onClick}
      style={{
        display: 'block',
        fontSize: '10px',
        fontFamily: 'var(--font-family-mono)',
        color: color ?? CANVAS_COLORS.textSecondary,
        cursor: href || onClick ? 'pointer' : 'default',
        padding: '2px 0',
        textDecoration: 'none',
      }}
    >
      {label}
    </Tag>
  );
}
```

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/tooltip-parts.tsx
git commit -m "feat: add tooltip sub-components (TooltipSection, TooltipBadge, TooltipLink)"
```

---

### Task 7: Migrate `entity-node.tsx`

**Files:**

- Modify: `src/features/canvas/components/entity-node.tsx`

- [ ] **Step 1: Read the file and migrate**

This is the cleanest node (194 lines) — good first migration.

Changes:

1. Import `useNodeState` from `../hooks/use-node-state` and `NodeGlow` from `./node-glow`
2. Import `CANVAS_COLORS` from `../constants/canvas-colors`
3. Replace the `BADGE_COLORS` constant with `CANVAS_COLORS.category` and `CANVAS_COLORS.categoryDefault`
4. Replace lines 52-59 (diff logic) with: `const { containerStyle, isGhost, isDiffChanged, diffColor, isInteractive } = useNodeState({ diffStatus, isHovered: hovered, isSelected });`
5. Remove local `diffOpacity` calculation
6. Replace root `<g>` inline style with `style={containerStyle}`
7. Replace the three glow blocks (diff ~78-94, hover ~96-111, selection ~113-129) with three `<NodeGlow>` renders
8. Replace hardcoded hex colors in text fills (`"rgba(255,255,255,0.3)"`) with `CANVAS_COLORS` references

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/entity-node.tsx
git commit -m "refactor: migrate entity-node to useNodeState + NodeGlow"
```

---

### Task 8: Migrate `state-node.tsx`

**Files:**

- Modify: `src/features/canvas/components/state-node.tsx`

- [ ] **Step 1: Read the file and migrate**

Same pattern as entity-node:

1. Import `useNodeState` and `NodeGlow`
2. Replace diff logic (lines 27-30) with `useNodeState` call
3. Replace `<g>` inline style with `containerStyle`
4. Replace glow blocks with `<NodeGlow>` renders
5. Replace hardcoded hex values with `CANVAS_COLORS`

Note: state-node has a unique diff ring with `strokeDasharray` that differs per status (solid for added, dashed for modified). Keep this logic but use `diffColor` from `useNodeState`.

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/state-node.tsx
git commit -m "refactor: migrate state-node to useNodeState + NodeGlow"
```

---

### Task 9: Migrate `step-node.tsx`

**Files:**

- Modify: `src/features/canvas/components/step-node.tsx`

- [ ] **Step 1: Read the file and migrate**

StepNode is the largest (349 lines) with unique rendering: method pill, sublabel, error badge. Only the behavioral infrastructure changes.

1. Import `useNodeState` and `NodeGlow`
2. Replace diff logic (lines 160-171) with `useNodeState` call — note StepNode also uses `isDimmed` and `isPlanned` props
3. Replace `<g>` inline style with `containerStyle`
4. Replace glow blocks (lines 223-274) with `<NodeGlow>` renders
5. Replace hardcoded hex values with `CANVAS_COLORS`

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/step-node.tsx
git commit -m "refactor: migrate step-node to useNodeState + NodeGlow"
```

---

### Task 10: Migrate `decision-node.tsx`

**Files:**

- Modify: `src/features/canvas/components/decision-node.tsx`

- [ ] **Step 1: Read the file and migrate**

DecisionNode has unique rendering: diamond shape (rotated rect), option pills with choice highlighting. Only behavioral infrastructure changes.

1. Import `useNodeState` and `NodeGlow`
2. Replace diff logic (lines 55-66) with `useNodeState` call — note uses `isDimmed`
3. Replace `<g>` inline style with `containerStyle`
4. Replace glow blocks (lines 103-119) with `<NodeGlow>` render
5. Replace hardcoded hex values with `CANVAS_COLORS`

Note: decision-node only has diff glow, no separate hover/selection glow patterns. Keep the outer ring (`strokeOpacity: 0.7`) as-is — it's unique to the diamond shape.

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/decision-node.tsx
git commit -m "refactor: migrate decision-node to useNodeState + NodeGlow"
```

---

### Task 11: Migrate `entry-node.tsx`

**Files:**

- Modify: `src/features/canvas/components/entry-node.tsx`

- [ ] **Step 1: Read the file and migrate**

EntryNode has unique rendering: pill shape with play icon, rich hover info. Uses ellipse-shaped glow (not circle).

1. Import `useNodeState` and `NodeGlow`
2. Replace diff logic (lines 46-57) with `useNodeState` call — note uses `isDimmed`
3. Replace `<g>` inline style with `containerStyle`
4. Replace glow blocks (lines 90-126) with `<NodeGlow>` renders — use `ry` prop for ellipse shape (`ry={h * 1.2}` where h is the node height)
5. Replace hardcoded hex values with `CANVAS_COLORS`

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/entry-node.tsx
git commit -m "refactor: migrate entry-node to useNodeState + NodeGlow"
```

---

### Task 12: Migrate `entity-tooltip.tsx`

**Files:**

- Modify: `src/features/canvas/components/entity-tooltip.tsx`

- [ ] **Step 1: Read the full file**

Read `src/features/canvas/components/entity-tooltip.tsx` to understand the full structure before modifying.

- [ ] **Step 2: Migrate to TooltipWrapper + useTooltipHover**

1. Import `TooltipWrapper` from `./tooltip-wrapper`, `useTooltipHover` from `../hooks/use-tooltip-hover`, `TooltipSection`/`TooltipBadge` from `./tooltip-parts`
2. Replace the internal `visible`/`show`/`scheduleClose` state with `useTooltipHover()` hook
3. Replace the foreignObject + absolute div + backdrop + arrow (the outer ~60 lines of wrapper JSX) with `<TooltipWrapper nodeX={node.x} nodeY={node.y} nodeWidth={ERD_NODE_WIDTH} visible={visible} onMouseEnter={show} onMouseLeave={scheduleClose}>`
4. Keep ALL domain-specific content inside the wrapper: entity badges, PK/FK sections, endpoint links, lifecycle links
5. Replace inline `sectionLabel` style objects with `<TooltipSection label="...">` where practical
6. Replace hardcoded hex values with `CANVAS_COLORS` references

- [ ] **Step 3: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/entity-tooltip.tsx
git commit -m "refactor: migrate entity-tooltip to TooltipWrapper + useTooltipHover"
```

---

### Task 13: Migrate `state-tooltip.tsx`

**Files:**

- Modify: `src/features/canvas/components/state-tooltip.tsx`

- [ ] **Step 1: Read the file and migrate**

Same pattern as entity-tooltip:

1. Replace wrapper with `<TooltipWrapper nodeX={state.x} nodeY={state.y} nodeWidth={LIFECYCLE_NODE_WIDTH} tooltipWidth={280} ...>`
2. The hover bridging is handled by the PARENT component (lifecycle-canvas) which passes `onMouseEnter`/`onMouseLeave` — pass these through to TooltipWrapper
3. Replace inline `sectionLabel` usages with `<TooltipSection>`
4. Replace hardcoded hex values with `CANVAS_COLORS`
5. Keep domain content: lifecycle badge, transitions, terminal indicator

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/state-tooltip.tsx
git commit -m "refactor: migrate state-tooltip to TooltipWrapper"
```

---

### Task 14: Migrate `node-tooltip.tsx`

**Files:**

- Modify: `src/features/canvas/components/node-tooltip.tsx`

- [ ] **Step 1: Read the file and migrate**

NodeTooltip is click-to-pin (not hover-based) — it does NOT use `useTooltipHover`. It uses `isSelected` prop to control visibility.

1. Replace wrapper with `<TooltipWrapper nodeX={node.x} nodeY={node.y} nodeWidth={NODE_WIDTH} tooltipWidth={300} visible={isSelected} interactive={isSelected} ...>`
2. Replace inline style objects with `CANVAS_COLORS` references and `<TooltipSection>` components
3. Keep domain content: layer/status badges, route links, lifecycle impacts, UX flags, error cases

This is the largest tooltip (482 lines) — only the wrapper infrastructure changes. The domain-specific content sections stay.

- [ ] **Step 2: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add src/features/canvas/components/node-tooltip.tsx
git commit -m "refactor: migrate node-tooltip to TooltipWrapper"
```

---

### Task 15: Migrate `arch-tooltip.tsx` and move to canvas

**Files:**

- Modify + Move: `src/features/architecture/architecture-canvas/arch-tooltip.tsx` → `src/features/canvas/components/arch-tooltip.tsx`
- Modify: `src/features/architecture/architecture-canvas/index.tsx` (update import path)

- [ ] **Step 1: Read the file**

Read `src/features/architecture/architecture-canvas/arch-tooltip.tsx` to understand the structure.

- [ ] **Step 2: Move to canvas components directory**

```bash
mv src/features/architecture/architecture-canvas/arch-tooltip.tsx src/features/canvas/components/arch-tooltip.tsx
```

- [ ] **Step 3: Migrate to TooltipWrapper**

1. Replace wrapper with `<TooltipWrapper>` — arch-tooltip uses hover bridging via `onMouseEnter`/`onMouseLeave` props
2. Replace hardcoded hex values with `CANVAS_COLORS`
3. Keep domain content: node sublabel, description, incoming/outgoing connections, external URL link

- [ ] **Step 4: Update the import in architecture-canvas**

In `src/features/architecture/architecture-canvas/index.tsx`, change:

```typescript
import { ArchTooltip } from './arch-tooltip';
```

to:

```typescript
import { ArchTooltip } from '@/features/canvas/components/arch-tooltip';
```

- [ ] **Step 5: Run checks and commit**

```bash
pnpm format && pnpm lint && pnpm typecheck
git add -A
git commit -m "refactor: migrate arch-tooltip to TooltipWrapper, move to shared canvas components"
```

---

### Task 16: Final validation

- [ ] **Step 1: Full CI check**

```bash
pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck
```

All must pass.

- [ ] **Step 2: Audit for remaining duplication**

```bash
# No more duplicated diff/opacity logic in node files
grep -rn "isGhost.*=.*diffStatus.*removed" src/features/canvas/components/ --include="*.tsx"
# Should return ONLY the hook file, not individual nodes

# No more duplicated tooltip wrapper infrastructure
grep -rn "backdropFilter.*blur.*12" src/features/canvas/components/ --include="*.tsx"
# Should return ONLY tooltip-wrapper.tsx

# Hardcoded hex count should be dramatically reduced
grep -roh "'#[0-9a-fA-F]\{6\}'" src/features/canvas/components/ --include="*.tsx" | wc -l
# Should be significantly less than the original 159
```

- [ ] **Step 3: Commit final state**

```bash
git add -A
git commit -m "refactor: Phase 3 complete — canvas node and tooltip infrastructure unified"
```
