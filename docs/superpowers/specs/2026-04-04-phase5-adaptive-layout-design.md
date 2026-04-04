# Phase 5: Adaptive Layout — Collapsible Panels & Compact Viewport

> Replaces the original Phase 5 "Responsive Design" scope. Desktop remains the primary target. This phase makes the layout adaptive across desktop viewport sizes (≥1024px) and adds touch input support for canvas pan-zoom.

**Date:** 2026-04-04
**Author:** Kyle Holloway + Claude
**Status:** Draft

---

## Problem Statement

The app is locked to a single layout: 220px sidebar + flexible main + 320px detail panel. Below 1024px, `DeviceGate` blocks access entirely. This creates two concrete problems:

1. **Wasted space on large screens.** Users exploring canvases (journeys, ERD, architecture) can't reclaim the sidebar or detail panel space. On a 1440px screen, the sidebar and detail panel consume 540px — 37% of the viewport — even when unused.

2. **Broken on compact desktops.** At 1024–1279px (common for laptops, split-screen workflows, external monitors), the 3-panel grid leaves only ~740px for main content. Canvas views are cramped, list views feel squeezed.

Neither problem requires mobile layouts. Both are solved by making the existing panels collapsible and the grid adaptive.

---

## Scope

### In Scope

- Collapsible sidebar (icon rail) — works at all viewport sizes
- Detail panel overlay at compact viewports
- CSS custom properties for layout dimensions
- Content grid reflow (dashboard domain grid)
- Canvas toolbar overflow handling
- Touch input for canvas pan-zoom
- Breakpoint mixin usage (existing mixin, currently unused)

### Out of Scope

- Mobile layouts (< 1024px) — DeviceGate stays unchanged
- Hamburger menu, bottom sheets, mobile card layouts
- Native mobile app considerations
- New navigation patterns (search, command palette)

### Decision: Why Not Mobile

Enterprise SaaS platforms with canvas-heavy UIs (Figma, FullStory, Grafana) are desktop-only or desktop-primary. Platforms that do offer mobile (Datadog, GitHub, Linear) provide a lean monitoring/triage subset, not the full experience. Until Archway has enterprise customers requesting mobile access, the ROI doesn't justify the implementation cost. The breakpoint foundation laid here makes adding mobile layouts straightforward when that validation arrives.

---

## Layout Tiers

| Tier        | Viewport    | Sidebar default  | Detail panel               | Grid     |
| ----------- | ----------- | ---------------- | -------------------------- | -------- |
| **Full**    | ≥1280px     | Expanded (220px) | Inline grid column (320px) | 3-column |
| **Compact** | 1024–1279px | Icon rail (56px) | Fixed overlay              | 2-column |

Below 1024px: `DeviceGate` blocks access (unchanged).

---

## 1. Breakpoint System & Layout Variables

### Layout Custom Properties

Added to the token system (`src/styles/variables/`):

```scss
:root {
  --sidebar-width: 220px;
  --sidebar-width-compact: 56px;
  --detail-panel-width: 320px;
  --topbar-height: 48px;
}
```

These replace the hardcoded values currently in `app-shell.module.scss`.

### Active Breakpoint

Only one breakpoint threshold matters today:

```scss
$breakpoint-compact: 1280px;
```

The existing breakpoint mixin (`@include breakpoint(xl)`) maps to this. The five defined breakpoints (xs through xl) remain for future use.

### AppShell Grid

```scss
// Full (≥1280px)
.shell {
  grid-template-columns: var(--sidebar-width) 1fr var(--detail-panel-width);
}

// Compact (<1280px)
@media (max-width: 1279px) {
  .shell {
    grid-template-columns: var(--sidebar-width-compact) 1fr;
  }
}

// Sidebar collapsed (any viewport)
.shell.sidebarCollapsed {
  grid-template-columns: var(--sidebar-width-compact) 1fr var(--detail-panel-width);
}

// Sidebar collapsed + compact
@media (max-width: 1279px) {
  .shell.sidebarCollapsed {
    grid-template-columns: var(--sidebar-width-compact) 1fr;
  }
}
```

---

## 2. Collapsible Sidebar

### Universal Feature

The sidebar collapse works at all viewport sizes. It is not viewport-dependent — it's a user preference.

### States

| State                     | Width | Content              | Section labels           |
| ------------------------- | ----- | -------------------- | ------------------------ |
| **Expanded**              | 220px | Icons + labels       | Text labels              |
| **Collapsed (icon rail)** | 56px  | Icons only, centered | Thin horizontal dividers |

### Behavior by Viewport

| Viewport    | Default   | Expanded behavior                                                                  | Collapsed behavior                                    |
| ----------- | --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| ≥1280px     | Expanded  | Inline — grid column is 220px                                                      | Inline — grid column shrinks to 56px, content reflows |
| 1024–1279px | Collapsed | **Overlay** — floats over content at 220px with shadow, auto-collapses on navigate | Inline — 56px icon rail in grid                       |

### Store Integration

```typescript
// In app-store.ts
interface AppState {
  // ... existing fields
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}
```

Persisted to `localStorage` so the preference survives page reloads. Initialized from localStorage on mount, with expanded as the default if no saved preference.

### Toggle Button

A chevron button at the bottom of the sidebar in both states:

- Collapsed: right-pointing chevron (`›`), click to expand
- Expanded: left-pointing chevron (`‹`), click to collapse

### Icon Rail Details

- Icons: 16px, centered in 40px hit targets
- Active indicator: left border accent (same as expanded, 2px solid primary)
- Hover: tooltip with the label name (native `title` attribute initially, upgrade to styled tooltip later if needed)
- Diff dots: visible on the rail, positioned to the right of the icon within the 40px target
- Section dividers: 24px-wide centered horizontal rule, replacing section label text

### Overlay Expand (Compact Viewport)

When expanded at <1280px, the sidebar:

- Renders at 220px width
- Uses `position: fixed` (or absolute within the grid area), overlaying main content
- Has a `box-shadow` for depth separation (no backdrop scrim — sidebar overlay is lighter than a modal)
- Auto-collapses when user clicks a nav item (navigates)
- Auto-collapses when user clicks outside the sidebar

### CSS Transition

```scss
.sidebar {
  width: var(--sidebar-width);
  transition: width 200ms var(--ease-out);
}

.sidebar.collapsed {
  width: var(--sidebar-width-compact);
}
```

The grid column transition is already in `app-shell.module.scss` (`transition: grid-template-columns 250ms`). This reuses that.

---

## 3. Detail Panel — Overlay at Compact

### Current Behavior (Unchanged at ≥1280px)

Inline grid column. 320px when open (item selected), 0px when collapsed (no selection). Animated via `grid-template-columns` transition. Toggle chevron button on the left edge.

### Compact Behavior (<1280px)

The detail panel switches from inline grid column to fixed overlay:

```scss
@media (max-width: 1279px) {
  .detailPanel {
    position: fixed;
    right: 0;
    top: var(--topbar-height);
    height: calc(100vh - var(--topbar-height));
    width: var(--detail-panel-width);
    z-index: var(--z-overlay);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
  }
}
```

### Backdrop Scrim

A semi-transparent backdrop (`rgba(0, 0, 0, 0.4)`) appears behind the detail panel overlay. Clicking the backdrop closes the panel (calls `clearSelection()`). The backdrop fades in/out with the panel.

### Dismiss Methods

- Click the toggle chevron button
- Click the backdrop scrim
- Press `Escape` key
- Navigate to a different page (clears selection naturally)

### What Doesn't Change

- Selection state management (Zustand store `selectedItem`)
- Panel content components (StepPanel, EntityPanel, etc.)
- Panel width (320px in both modes)
- How items get selected (node click, row click, etc.)

---

## 4. Content Grid Adaptations

### Dashboard Domain Grid

Replace hardcoded 3-column with intrinsic sizing:

```scss
// Before
.domainGrid {
  grid-template-columns: repeat(3, 1fr);
}

// After
.domainGrid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
```

This naturally drops to 2 columns when the main content area narrows (sidebar expanded + detail panel open on a smaller screen, or compact viewport). No media query needed.

### Dashboard Hero & Metrics

These are already 2-column grids. They stay 2-column — enough room at all desktop sizes.

### List Views

API Map, Data Model, Config, Features, Changelog — all single-column lists. No changes needed. They fill available width naturally.

### Canvas Views

Canvas SVG is already `width: 100%; height: 100%`. When sidebar collapses or detail panel is absent, the canvas gets more space automatically. No canvas component changes.

### Canvas Toolbar

Add overflow safety:

```scss
.canvasToolbar {
  max-width: calc(100% - 32px); // 16px margin each side
  overflow-x: auto;
}
```

This prevents toolbar buttons from overflowing off-screen at narrow main content widths.

### Page Container Padding

Reduce horizontal padding at compact:

```scss
@mixin page-container {
  padding: var(--spacing-600) var(--spacing-700); // 24px 32px

  @media (max-width: 1279px) {
    padding: var(--spacing-600) var(--spacing-500); // 24px 20px
  }
}
```

---

## 5. Touch Support for Canvas Pan-Zoom

### Touch-to-Mouse Mapping

| Gesture            | Action | Logic                                                                                                |
| ------------------ | ------ | ---------------------------------------------------------------------------------------------------- |
| Single finger drag | Pan    | Same as mouse drag — read `touches[0].clientX/Y`, feed into existing pan logic                       |
| Two finger pinch   | Zoom   | Track distance between `touches[0]` and `touches[1]`, compute scale delta, apply existing zoom logic |
| Two finger drag    | Pan    | When both fingers move in the same direction (distance stable), average the two touch points and pan |

### Implementation in `usePanZoom`

**New handlers:** `onTouchStart`, `onTouchMove`, `onTouchEnd`

**Shared internals:** Extract pan and zoom math from mouse handlers into internal helpers:

- `applyPan(dx, dy)` — updates offset, tracks velocity
- `applyZoom(scaleDelta, centerX, centerY)` — updates zoom centered on a point

Mouse handlers and touch handlers both call these. No duplication of the core math.

**Touch state ref:**

```typescript
const touchRef = useRef<{
  startTouches: Touch[];
  lastDistance: number;
  lastCenter: { x: number; y: number };
}>({ startTouches: [], lastDistance: 0, lastCenter: { x: 0, y: 0 } });
```

### Passive Event Listeners

Touch events need `{ passive: false }` to call `preventDefault()` and prevent the browser from scrolling/bouncing while the user pans the canvas. React synthetic events don't support the `passive` option, so these are attached via `useEffect` + `addEventListener`:

```typescript
useEffect(
  () => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: TouchEvent) => {
      e.preventDefault();
      handleTouchMove(e);
    };
    el.addEventListener('touchmove', handler, { passive: false });
    return () => el.removeEventListener('touchmove', handler);
  },
  [
    /* deps */
  ],
);
```

### Momentum

Touch drag feeds into the same velocity tracking as mouse drag. Flick-to-pan works identically — release finger, canvas coasts with friction decay.

### What Doesn't Change

- Zoom constants (factor, min, max)
- Lerp smoothing, snap threshold, friction
- View persistence / saved views
- SVG viewBox calculation
- Any canvas component code

---

## Migration Notes

### Files Modified

| File                                        | Change                                                            |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `src/styles/variables/layout.scss`          | **New** — layout dimension custom properties                      |
| `src/stores/app-store.ts`                   | Add `sidebarCollapsed`, `toggleSidebar`, localStorage persistence |
| `src/components/layout/app-shell/`          | Grid template switches per viewport + sidebar state               |
| `src/components/navigation/sidebar/`        | Icon rail mode, collapse toggle, overlay expand                   |
| `src/components/layout/detail-panel/`       | Overlay positioning at compact, backdrop scrim                    |
| `src/features/canvas/hooks/use-pan-zoom.ts` | Touch handlers, shared pan/zoom helpers                           |
| `src/features/canvas/canvas-toolbar/`       | `max-width` + `overflow-x` safety                                 |
| `src/features/dashboard/`                   | `auto-fill`/`minmax` domain grid                                  |
| `src/styles/mixins/layout.scss`             | Compact padding in `page-container`                               |

### No Breaking Changes

- All existing behavior preserved at ≥1280px (full tier matches current layout)
- Sidebar defaults to expanded at full tier (current behavior)
- Detail panel is inline at full tier (current behavior)
- DeviceGate unchanged at <1024px
- Canvas components untouched — only the hook changes

### Future-Proofing

The `sidebarCollapsed` store field, layout custom properties, and breakpoint mixin usage make it straightforward to add a third tier (tablet, 768–1023px) later by:

1. Updating `DeviceGate` threshold from 1024px to 768px
2. Adding `@include breakpoint(md)` rules
3. Adding hamburger toggle and bottom sheet detail panel

That work is explicitly deferred until enterprise customer validation.

---

## Success Criteria

- [ ] Sidebar collapses to 56px icon rail at any viewport size via toggle
- [ ] Sidebar preference persists across page reloads (localStorage)
- [ ] At <1280px, sidebar defaults to collapsed, expands as overlay
- [ ] At <1280px, detail panel renders as fixed overlay with backdrop
- [ ] Dashboard domain grid reflows to 2 columns at narrower widths
- [ ] Canvas toolbar doesn't overflow at narrow main content widths
- [ ] Canvas supports single-finger pan and pinch-to-zoom
- [ ] All CI checks pass (`format`, `lint`, `lint:styles`, `typecheck`, `build`)
- [ ] No visual regressions at ≥1280px (current layout preserved)
