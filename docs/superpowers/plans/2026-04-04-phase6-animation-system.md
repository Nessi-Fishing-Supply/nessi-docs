# Phase 6: Animation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate hardcoded transitions to design tokens, add `prefers-reduced-motion` accessibility support, and add subtle mode transition animations (diff toolbar slide, sidebar label sequencing, list dimming).

**Architecture:** CSS-first, no JS animation library. Token migration is a mechanical sweep of ~30 SCSS files. Reduced-motion is one global CSS rule plus one hook update. Mode transitions are CSS transitions with timing coordination via token variables.

**Tech Stack:** SCSS Modules, CSS custom properties, existing Zustand store

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/styles/variables/animations.scss` | Modify | Add `--transition-mode` and `--transition-toolbar` tokens |
| `src/styles/globals.scss` | Modify | Add `prefers-reduced-motion` global rule |
| `src/features/canvas/hooks/use-stagger-entry.ts` | Modify | Skip stagger when reduced motion preferred |
| `src/components/layout/diff-toolbar/index.tsx` | Modify | Always render, toggle visibility via class |
| `src/components/layout/diff-toolbar/diff-toolbar.module.scss` | Modify | Add slide transition styles |
| `src/components/navigation/sidebar/sidebar.module.scss` | Modify | Add label fade sequencing |
| ~30 SCSS files | Modify | Replace hardcoded transition values with tokens |

---

### Task 1: New Animation Tokens

**Files:**
- Modify: `src/styles/variables/animations.scss`

- [ ] **Step 1: Add mode transition tokens**

In `src/styles/variables/animations.scss`, add two new composite tokens inside the `:root` block, after the existing `--duration-panel` line:

```scss
  // Mode transitions (diff enter/exit, list dimming)
  --transition-mode: opacity var(--duration-200) var(--easing-out);
  --transition-toolbar: transform var(--duration-200) var(--easing-out);
```

- [ ] **Step 2: Run CI checks**

Run: `pnpm lint:styles && pnpm build`
Expected: All pass.

- [ ] **Step 3: Commit**

```bash
git add src/styles/variables/animations.scss
git commit -m "feat: add mode transition animation tokens

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `prefers-reduced-motion` Support

**Files:**
- Modify: `src/styles/globals.scss`
- Modify: `src/features/canvas/hooks/use-stagger-entry.ts`

- [ ] **Step 1: Add global reduced-motion rule**

At the bottom of `src/styles/globals.scss`, add:

```scss
// ─── Accessibility: Reduced Motion ───
// Disables all CSS animations and transitions for users who prefer reduced motion.
// Uses 0.01ms (not 0) so animationend/transitionend events still fire.
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

- [ ] **Step 2: Update useStaggerEntry to respect reduced motion**

Replace `src/features/canvas/hooks/use-stagger-entry.ts` with:

```typescript
'use client';

import { useState, useEffect } from 'react';

/**
 * Returns a Set of node IDs that have "entered" (should be visible).
 * Nodes enter one by one with a stagger delay, sorted left-to-right by x position.
 * Respects prefers-reduced-motion — all nodes enter immediately if user prefers reduced motion.
 */
export function useStaggerEntry(nodeIds: { id: string; x: number }[], delay = 30) {
  const [entered, setEntered] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Respect reduced motion preference — show all immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntered(new Set(nodeIds.map((n) => n.id)));
      return;
    }

    // Sort by x position (left to right)
    const sorted = [...nodeIds].sort((a, b) => a.x - b.x);
    const timers: ReturnType<typeof setTimeout>[] = [];

    sorted.forEach((node, i) => {
      const t = setTimeout(() => {
        setEntered((prev) => new Set(prev).add(node.id));
      }, i * delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  }, []);

  return entered;
}
```

Only change from current: the `matchMedia` check at the top of the effect that returns early with all nodes entered.

- [ ] **Step 3: Run CI checks**

Run: `pnpm typecheck && pnpm lint && pnpm lint:styles && pnpm build`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.scss src/features/canvas/hooks/use-stagger-entry.ts
git commit -m "feat: add prefers-reduced-motion support

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Token Migration Sweep

**Files:** ~30 SCSS files with hardcoded transition values.

This is a mechanical find-and-replace task. For each file listed below, replace hardcoded transition values with the appropriate token. No behavior changes.

- [ ] **Step 1: Migrate entity-list transitions**

In `src/features/data-model/entity-list/entity-list.module.scss`, make these replacements:

| Line | Current | Replace with |
|------|---------|-------------|
| 156 | `transition: transform 200ms ease-out` | `transition: transform var(--duration-200) var(--easing-out)` |
| 270 | `transition: opacity 150ms ease-out` | `transition: opacity var(--duration-200) var(--easing-out)` |
| 319 | `transition: background 150ms ease-out` | `transition: background var(--duration-200) var(--easing-out)` |
| 336 | `transition: color 150ms ease-out` | `transition: color var(--duration-200) var(--easing-out)` |

- [ ] **Step 2: Migrate feature-domain-view transitions**

In `src/features/feature-domain/feature-domain-view/feature-domain-view.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 111 | `transition: transform 200ms ease-out` | `transition: transform var(--duration-200) var(--easing-out)` |
| 169 | `transition: all 150ms ease-out` | `transition: var(--transition-fast)` |
| 216 | `transition: opacity 150ms ease` | `transition: opacity var(--duration-200) var(--easing-out)` |
| 262 | `transition: color 150ms ease` | `transition: color var(--duration-200) var(--easing-out)` |
| 312 | `transition: all 150ms ease-out` | `transition: var(--transition-fast)` |
| 331 | `transition: all 150ms ease-out` | `transition: var(--transition-fast)` |
| 348 | `transition: opacity 150ms ease` | `transition: opacity var(--duration-200) var(--easing-out)` |

- [ ] **Step 3: Migrate api-list transitions**

In `src/features/api-map/api-list/api-list.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 127 | `transition: background 150ms ease-out` | `transition: background var(--duration-200) var(--easing-out)` |
| 281 | `transition: all 150ms ease-out` | `transition: var(--transition-fast)` |
| 359 | `transition: all 150ms ease-out` | `transition: var(--transition-fast)` |

- [ ] **Step 4: Migrate config-list transitions**

In `src/features/config/config-list/config-list.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 29 | `transition: all 150ms ease` | `transition: var(--transition-fast)` |
| 60 | `transition: all 150ms ease` | `transition: var(--transition-fast)` |
| 161 | `transition: background 100ms ease` | `transition: background var(--duration-100) var(--easing-out)` |
| 205 | `transition: border-color 150ms ease` | `transition: border-color var(--duration-200) var(--easing-out)` |

- [ ] **Step 5: Migrate changelog-feed transitions**

In `src/features/changelog/changelog-feed/changelog-feed.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 24 | `transition: all 150ms ease` | `transition: var(--transition-fast)` |
| 169 | `transition: color 150ms ease` | `transition: color var(--duration-200) var(--easing-out)` |

- [ ] **Step 6: Migrate lifecycle-list transitions**

In `src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 48 | `transition: color 150ms ease-out` | `transition: color var(--duration-200) var(--easing-out)` |

- [ ] **Step 7: Migrate layout component transitions**

In `src/components/layout/filter-bar/filter-bar.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 20 | `transition: all 150ms ease-out` | `transition: var(--transition-fast)` |

In `src/components/layout/collapsible-row/collapsible-row.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 7 | `transition: all 150ms ease-out` | `transition: var(--transition-fast)` |

In `src/components/layout/app-shell/app-shell.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 10 | `transition: grid-template-columns 250ms cubic-bezier(0.16, 1, 0.3, 1)` | `transition: grid-template-columns var(--duration-panel) var(--easing-out)` |
| 113 | `transition: opacity 150ms ease` | `transition: opacity var(--duration-200) var(--easing-out)` |
| 158 | `transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1)` | `transition: all var(--duration-panel) var(--easing-out)` |

Note: The app-shell also has multi-property transitions in the compact media query section — leave those as-is since they use specific duration/easing for the detail overlay slide effect.

- [ ] **Step 8: Migrate breadcrumb transitions**

In `src/components/navigation/breadcrumb/breadcrumb.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 88 | `transition: background 100ms var(--ease-out)` | `transition: background var(--duration-100) var(--easing-out)` |

Note: This file uses `var(--ease-out)` which is a **different** variable name than the token `var(--easing-out)`. Check which one is actually defined — the token system uses `--easing-out`. If `--ease-out` is an alias or legacy name, standardize to `--easing-out`.

- [ ] **Step 9: Migrate search-dialog transitions**

In `src/features/search/search-dialog/search-dialog.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 141 | `transition: background 60ms ease` | `transition: background var(--duration-100) var(--easing-out)` |
| 236 | `transition: background 60ms ease` | `transition: background var(--duration-100) var(--easing-out)` |
| 252 | `transition: opacity 100ms ease` | `transition: opacity var(--duration-100) var(--easing-out)` |

- [ ] **Step 10: Migrate sidebar width transition**

In `src/components/navigation/sidebar/sidebar.module.scss`:

| Line | Current | Replace with |
|------|---------|-------------|
| 7 | `transition: width 200ms var(--ease-out)` | `transition: width var(--duration-200) var(--easing-out)` |

Same `--ease-out` → `--easing-out` standardization as breadcrumb.

- [ ] **Step 11: Run CI checks**

Run: `pnpm format && pnpm lint:styles && pnpm build`
Expected: All pass. Zero behavior changes — token values match the hardcoded values.

- [ ] **Step 12: Commit**

```bash
git add -u '*.scss'
git commit -m "refactor: migrate hardcoded transitions to animation tokens

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Diff Toolbar Slide Transition

**Files:**
- Modify: `src/components/layout/diff-toolbar/index.tsx`
- Modify: `src/components/layout/diff-toolbar/diff-toolbar.module.scss`

- [ ] **Step 1: Update DiffToolbar to always render**

Currently `DiffToolbar` returns `null` when not active (line 32: `if (!isActive || !diffResult) return null`). Change it to always render a wrapper div, with the content inside hidden when inactive.

In `src/components/layout/diff-toolbar/index.tsx`, replace the early return and the render:

The current code has:
```tsx
if (!isActive || !diffResult) return null;
// ... lots of content setup ...
return (
  <div className={styles.toolbar}>
    ...
  </div>
);
```

Change to:
```tsx
const isVisible = isActive && !!diffResult;

if (!isVisible) {
  return <div className={`${styles.toolbar} ${styles.hidden}`} />;
}

// ... existing content setup stays the same ...
return (
  <div className={styles.toolbar}>
    ...
  </div>
);
```

This renders an empty collapsed toolbar div when inactive (no content, just the wrapper for CSS transitions), and the full toolbar when active.

- [ ] **Step 2: Add slide transition styles**

In `src/components/layout/diff-toolbar/diff-toolbar.module.scss`, add the transition and hidden state to the `.toolbar` rule:

Add to the existing `.toolbar` block:

```scss
.toolbar {
  // ... existing styles ...
  transition: var(--transition-toolbar), var(--transition-mode);
  transform: translateY(0);
  max-height: 48px;
  overflow: hidden;
}

.hidden {
  transform: translateY(-100%);
  opacity: 0;
  max-height: 0;
  padding: 0;
  border-bottom: none;
  pointer-events: none;
}
```

The toolbar slides down from behind the topbar on enter and collapses to 0 height when hidden. Using `max-height` and `padding: 0` so it takes no space when hidden.

- [ ] **Step 3: Run CI checks**

Run: `pnpm typecheck && pnpm lint && pnpm lint:styles && pnpm build`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/diff-toolbar/
git commit -m "feat: diff toolbar slides down on enter, collapses on exit

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Sidebar Label Fade Sequencing

**Files:**
- Modify: `src/components/navigation/sidebar/sidebar.module.scss`

- [ ] **Step 1: Add label fade transitions**

In `src/components/navigation/sidebar/sidebar.module.scss`, update the `.navLabel` and `.sectionDivider` rules to add transition timing:

Find the `.navLabel` rule (which currently only has `.collapsed & { display: none }`). Replace `display: none` with an opacity transition — `display: none` prevents transitions from running:

```scss
.navLabel {
  opacity: 1;
  transition: opacity 100ms var(--easing-out);
  white-space: nowrap;
  overflow: hidden;

  .collapsed & {
    opacity: 0;
    width: 0;
    overflow: hidden;
  }
}
```

Note: Using `opacity: 0` + `width: 0` + `overflow: hidden` instead of `display: none` so the transition can animate. The `width: 0` collapses the space.

Find the `.sectionDivider` rule and add transition:

```scss
.sectionDivider {
  width: 24px;
  height: 1px;
  background: var(--border-subtle);
  margin: var(--spacing-200) 0;
  opacity: 1;
  transition: opacity 100ms var(--easing-out) 100ms; // 100ms delay — appears after labels fade
}
```

For the expanded state, labels should fade in with a delay (after width expands):

Add to the `.expanded` rule or create a new rule:

```scss
.expanded .navLabel {
  transition-delay: 150ms; // Labels appear after sidebar width settles
}

.expanded .sectionDivider {
  // No delay needed — dividers aren't visible in expanded state
}
```

- [ ] **Step 2: Run CI checks**

Run: `pnpm lint:styles && pnpm build`
Expected: All pass.

- [ ] **Step 3: Visually verify**

Run `pnpm dev` and test:
1. Click sidebar collapse toggle — labels should fade out (100ms), then width shrinks
2. Click expand — width expands, then labels fade in (after 150ms delay)
3. Section dividers appear after labels fade out when collapsing

- [ ] **Step 4: Commit**

```bash
git add src/components/navigation/sidebar/sidebar.module.scss
git commit -m "feat: sidebar labels fade before/after width transition

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: List Item Diff Dimming Transitions

**Files:**
- Modify: `src/features/data-model/entity-list/entity-list.module.scss`
- Modify: `src/features/api-map/api-list/api-list.module.scss`
- Modify: `src/features/config/config-list/config-list.module.scss`
- Modify: `src/features/feature-domain/feature-domain-view/feature-domain-view.module.scss`
- Modify: `src/features/changelog/changelog-feed/changelog-feed.module.scss`
- Modify: `src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss`

- [ ] **Step 1: Identify diff dimming selectors**

Search each list view for places where `opacity` is set for diff mode dimming. These are typically on row/item classes that get `opacity: 0.4` or similar when the item is not in the diff set.

Run: Search for `opacity:` patterns in these files to identify the exact selectors.

The goal: add `transition: var(--transition-mode)` to any element that dims during diff mode, so the opacity change animates instead of being instant.

- [ ] **Step 2: Add transition-mode to entity-list rows**

In `src/features/data-model/entity-list/entity-list.module.scss`, find the row or container element that receives the diff dimming opacity and ensure it has:

```scss
transition: var(--transition-mode);
```

If the element already has a transition from the token migration (Task 3), extend it:

```scss
transition: var(--transition-fast), var(--transition-mode);
```

This ensures both hover states and diff dimming animate smoothly.

- [ ] **Step 3: Add transition-mode to api-list rows**

Same pattern in `src/features/api-map/api-list/api-list.module.scss`.

- [ ] **Step 4: Add transition-mode to config-list rows**

Same pattern in `src/features/config/config-list/config-list.module.scss`.

- [ ] **Step 5: Add transition-mode to feature-domain-view rows**

Same pattern in `src/features/feature-domain/feature-domain-view/feature-domain-view.module.scss`.

- [ ] **Step 6: Add transition-mode to changelog-feed rows**

Same pattern in `src/features/changelog/changelog-feed/changelog-feed.module.scss`.

- [ ] **Step 7: Add transition-mode to lifecycle-list rows**

Same pattern in `src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss`.

- [ ] **Step 8: Run CI checks**

Run: `pnpm lint:styles && pnpm build`
Expected: All pass.

- [ ] **Step 9: Commit**

```bash
git add -u '*.scss'
git commit -m "feat: smooth diff dimming transitions on list items

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full CI check**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck && pnpm build`
Expected: All pass.

- [ ] **Step 2: Verify token migration completeness**

Search for remaining hardcoded transitions:

Run: `grep -rn 'transition:.*[0-9]\+ms' src/ --include='*.scss' | grep -v node_modules | grep -v '.module.scss.d.ts'`

Expected: Zero results in SCSS files (canvas inline styles in TSX are exempt).

- [ ] **Step 3: Verify reduced-motion**

In Chrome DevTools, enable "Prefers reduced motion" in Rendering panel. Load the app:
- No CSS animations should play (no flow-pulse, glow-pulse, row-enter)
- No CSS transitions should be visible (hover states should be instant)
- Canvas stagger entry should show all nodes immediately
- Pan/zoom momentum should still work (physics, not CSS animation)

- [ ] **Step 4: Verify diff toolbar slide**

Toggle diff mode on/off:
- Toolbar should slide down smoothly when diff activates
- Toolbar should collapse up when diff deactivates
- Content below should reflow smoothly (no jump)

- [ ] **Step 5: Verify sidebar label sequencing**

Toggle sidebar collapse:
- Collapsing: labels fade out first, then width shrinks
- Expanding: width expands first, then labels fade in
- No mid-word truncation during the transition

- [ ] **Step 6: Commit if any final adjustments needed**

```bash
git add -A
git commit -m "chore: Phase 6 final verification and adjustments

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```
