# Phase 6: Animation System — Token Consolidation, Accessibility & Mode Transitions

> Consolidates the existing animation foundation into a coherent system. Migrates hardcoded transitions to tokens, adds `prefers-reduced-motion` support, and adds subtle mode transition animations. No new animation library — pure CSS.

**Date:** 2026-04-04
**Author:** Kyle Holloway + Claude
**Status:** Draft

---

## Problem Statement

The codebase has a solid animation token system (`animations.scss` with 5 duration variables, 4 easing variables, and composite transition tokens) but adoption is sparse. Of 40+ files using CSS transitions, ~90% hardcode values like `150ms ease-out` instead of using `var(--transition-fast)`. This means:

- Changing the feel of the app requires editing 40+ files
- No `prefers-reduced-motion` support — accessibility gap
- Mode transitions (entering/exiting diff mode) are instant — functional but abrupt
- Sidebar collapse labels truncate awkwardly during the width transition

The animation primitives exist. They just need to be wired up consistently and extended slightly for mode-aware behavior.

---

## Scope

### In Scope

- **Token migration sweep** — Replace hardcoded transition values in SCSS files with existing tokens
- **`prefers-reduced-motion` support** — Global CSS rule + `useStaggerEntry` hook update
- **Mode transition animations** — Diff toolbar slide, sidebar label fade sequencing, list item dimming transitions
- **Two new composite tokens** — `--transition-mode` and `--transition-toolbar`

### Out of Scope

- Micro-interactions (badge count morphs, row hover lift, button press feedback)
- New animation library or JS animation framework
- Inline style migration in canvas TSX components (SVG `foreignObject` requires inline styles)
- Page route transition animations beyond the existing branch-switch crossfade

### Decision: Why Not Micro-Interactions

Micro-interactions are polish that doesn't move the needle for Archway validation. The token system makes them trivial to add later — a `transition: transform var(--duration-100) var(--easing-out)` on a hover state is a one-line addition per component. Deferring until the product has paying customers.

---

## 1. Token Migration Sweep

### Mapping Table

| Hardcoded pattern                     | Token replacement                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| `all 150ms ease-out`                  | `var(--transition-fast)`                                                        |
| `all 150ms ease`                      | `var(--transition-fast)`                                                        |
| `all 200ms ease-out`                  | `var(--transition-fast)`                                                        |
| `all var(--transition-fast)`          | Already correct — no change                                                     |
| `opacity 200ms ease`                  | `opacity var(--duration-200) var(--easing-out)`                                 |
| `opacity 150ms ease-out`              | `opacity var(--duration-200) var(--easing-out)`                                 |
| `transform 200ms ease-out`            | `transform var(--duration-200) var(--easing-out)`                               |
| `250ms cubic-bezier(0.16, 1, 0.3, 1)` | `var(--duration-panel) var(--easing-out)`                                       |
| `color 180ms ease-out`                | Uses `var(--transition-color)` or `color var(--duration-200) var(--easing-out)` |

### Rules

- SCSS files only. Inline styles in TSX canvas components are left as-is.
- Multi-property transitions (e.g., `opacity 200ms ease, padding 250ms ease`) use per-property tokens, not the composite `--transition-fast`.
- The `--transition-fast` shorthand uses `all` — appropriate for simple hover states. For layout transitions with specific properties, spell out each property with duration/easing tokens.
- Existing files that already use tokens are left alone.

### Estimated Scope

~35-40 SCSS files need updates. Zero behavior changes — the token values match the current hardcoded values (180ms ease-out ≈ 150ms ease-out, close enough that no one will notice).

---

## 2. `prefers-reduced-motion` Support

### Global CSS Rule

Added to the bottom of `src/styles/globals.scss`:

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Uses `0.01ms` instead of `0` so `animationend`/`transitionend` events still fire — prevents JS logic from breaking if it relies on those events.

### `useStaggerEntry` Hook Update

In `src/features/canvas/hooks/use-stagger-entry.ts`:

- Check `window.matchMedia('(prefers-reduced-motion: reduce)')` on mount
- If reduced motion is preferred, return all node IDs immediately (no stagger delay)
- Otherwise, run the existing stagger logic unchanged

```typescript
export function useStaggerEntry(nodeIds: { id: string; x: number }[], delay = 30) {
  const [entered, setEntered] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntered(new Set(nodeIds.map((n) => n.id)));
      return;
    }

    // ... existing stagger logic
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return entered;
}
```

### Coverage

This handles:

- All CSS `@keyframes` animations (flow-pulse, glow-pulse, tooltip-in, row-enter, etc.)
- All CSS transitions (hover states, panel slides, opacity changes)
- Canvas stagger entry (via hook)
- Does NOT affect the pan-zoom momentum/lerp system (that's physics simulation, not animation — should always be active)

---

## 3. Mode Transition Animations

### Design Principle

Subtle and fast. 200-300ms total. CSS transitions with appropriate delays — no JS orchestration.

### New Tokens

Added to `src/styles/variables/animations.scss`:

```scss
:root {
  // ... existing tokens ...

  // Mode transition composites
  --transition-mode: opacity var(--duration-200) var(--easing-out);
  --transition-toolbar: transform var(--duration-200) var(--easing-out);
}
```

### Diff Toolbar Slide

**File:** `src/components/layout/diff-toolbar/diff-toolbar.module.scss`

Currently the diff toolbar appears/disappears instantly when diff mode is toggled. Add a slide-down entrance:

- Default state: `transform: translateY(-100%); opacity: 0`
- Active state (diff mode on): `transform: translateY(0); opacity: 1`
- Transition: `var(--transition-toolbar), var(--transition-mode)`

The toolbar component already conditionally renders based on diff mode — wrap it so the CSS transition can fire (render always, toggle visibility via class).

**Note:** If the toolbar is conditionally rendered with `{diffMode && <DiffToolbar />}`, the mount/unmount prevents CSS transitions from running. Two options:

1. Always render, toggle a `.visible` class — CSS transition works
2. Keep conditional render — no entrance animation, just exit

Option 1 is better for the UX. The toolbar should always be in the DOM with `pointer-events: none` and `opacity: 0` when inactive, then transition to visible.

### Sidebar Label Fade Sequencing

**File:** `src/components/navigation/sidebar/sidebar.module.scss`

Currently, when the sidebar collapses, labels and width change simultaneously — labels get truncated mid-word. Improve the sequence:

- **Collapsing:** Labels fade out first (opacity 0 over 100ms), then width shrinks (200ms)
- **Expanding:** Width expands first (200ms), then labels fade in (100ms with 150ms delay)

Implementation:

```scss
.navLabel {
  transition: opacity 100ms var(--easing-out);

  .collapsed & {
    opacity: 0;
    transition-delay: 0ms; // Fade out immediately on collapse
  }
}

// When expanding (not collapsed), labels appear after width settles
.expanded .navLabel {
  transition-delay: 150ms;
}

.sectionDivider {
  transition: opacity 100ms var(--easing-out);
  opacity: 0;

  .collapsed & {
    opacity: 1;
    transition-delay: 100ms; // Appear after labels fade
  }
}
```

### List Item Diff Dimming

**Files:** Various list view SCSS files (entity-list, api-list, config-list, feature-domain-view, changelog-feed)

Currently, when diff mode activates, items not in the diff set have `opacity: 0.4` applied instantly. Add a transition so they fade smoothly:

```scss
.row {
  transition: var(--transition-mode); // opacity 200ms ease-out
}
```

This is a one-line addition to each list view's row styles. The opacity value is already set by the diff logic — adding the transition just makes the change animate.

---

## Migration Notes

### Files Modified

| Category         | Files                                                   | Change                                                 |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Token sweep      | ~35-40 SCSS files                                       | Hardcoded transitions → token references               |
| Reduced motion   | `src/styles/globals.scss`                               | Global `prefers-reduced-motion` rule                   |
| Reduced motion   | `src/features/canvas/hooks/use-stagger-entry.ts`        | Early return when reduced motion preferred             |
| Animation tokens | `src/styles/variables/animations.scss`                  | Add `--transition-mode`, `--transition-toolbar`        |
| Diff toolbar     | `src/components/layout/diff-toolbar/`                   | Slide-down/up transition                               |
| Sidebar labels   | `src/components/navigation/sidebar/sidebar.module.scss` | Label fade sequencing                                  |
| List views       | 5-6 list view SCSS files                                | Add `transition: var(--transition-mode)` to row styles |

### No Breaking Changes

- Token values match existing hardcoded values (within 30ms)
- `prefers-reduced-motion` only affects users who opt in
- Mode transitions add animation to previously-instant changes — same end state, just smoother path
- Canvas inline styles untouched

---

## Success Criteria

- [ ] Zero hardcoded transition values in SCSS files (outside canvas inline styles)
- [ ] `prefers-reduced-motion: reduce` disables all CSS animations and transitions
- [ ] `useStaggerEntry` skips stagger when reduced motion is preferred
- [ ] Diff toolbar slides down when diff mode activates, slides up when deactivated
- [ ] Sidebar labels fade before/after width transition (no mid-word truncation)
- [ ] List items in diff mode dim with a smooth 200ms transition
- [ ] All CI checks pass (`format`, `lint`, `lint:styles`, `typecheck`, `build`)
- [ ] No visual regressions in default (non-diff, non-reduced-motion) mode
