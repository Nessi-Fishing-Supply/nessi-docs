# Phase 1: Foundation — Design Tokens & Style System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the design token system, add theme support (dark/light), create shared SCSS mixins, consolidate TypeScript constants, and migrate all hardcoded values to tokens. Zero behavior changes — just the substrate.

**Architecture:** The token system already partially exists (`src/styles/variables/`). This phase completes it: fills gaps in the color palette, adds the theming layer (semantic tokens that resolve per theme), creates SCSS utility mixins for repeated patterns, consolidates the 7 duplicate diff color definitions, and sweeps every SCSS module to replace hardcoded values with token references. TypeScript constants for canvas-consumed colors are centralized in `src/constants/diff.ts`.

**Tech Stack:** SCSS (Dart Sass with `@use`), CSS custom properties, Next.js `sassOptions.includePaths`

**Spec reference:** `docs/superpowers/specs/2026-04-02-codebase-overhaul-design.md` — Phase 1 section

---

## File Map

### New Files

| File                                | Purpose                                                             |
| ----------------------------------- | ------------------------------------------------------------------- |
| `src/styles/mixins/layout.scss`     | Shared flex, overflow, and container mixins                         |
| `src/styles/mixins/typography.scss` | Text style mixins (mono, label, section-header)                     |
| `src/styles/mixins/diff.scss`       | Diff row/cell styling mixins                                        |
| `src/constants/diff.ts`             | Consolidated diff colors and status config for TypeScript consumers |

### Modified Files

| File                                                      | Changes                                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/styles/variables/colors.scss`                        | Add complete primitive palette scales, add `--color-blue-*` and `--color-red-*` for diff |
| `src/styles/variables/dark-theme.scss`                    | Restructure as semantic tokens scoped to `[data-theme="dark"]`                           |
| `src/styles/variables/diff.scss`                          | Reference semantic color tokens instead of hardcoded rgb values                          |
| `src/styles/variables/typography.scss`                    | Add `--font-size-50` (9px), verify complete scale coverage                               |
| `src/styles/variables/animations.scss`                    | Add keyframes from globals.scss, consolidate stagger/glow/pulse                          |
| `src/styles/globals.scss`                                 | Import new mixins, move keyframes to animations.scss                                     |
| `src/app/layout.tsx`                                      | Add `data-theme="dark"` attribute to `<html>`                                            |
| `src/constants/colors.ts`                                 | Replace hardcoded hex values with semantic references where possible                     |
| 30+ SCSS module files                                     | Replace hardcoded px/color values with token references                                  |
| 5 canvas node files                                       | Import `DIFF_COLORS` from `src/constants/diff.ts` instead of local definitions           |
| `src/features/canvas/components/diff-tooltip-section.tsx` | Import from shared constants                                                             |
| `src/features/canvas/components/diff-legend-section.tsx`  | Import from shared constants                                                             |
| `src/types/changelog.ts`                                  | Reference shared diff config instead of duplicating colors                               |

---

### Task 1: Create shared diff constants

**Files:**

- Create: `src/constants/diff.ts`
- Modify: `src/features/canvas/components/step-node.tsx`
- Modify: `src/features/canvas/components/entity-node.tsx`
- Modify: `src/features/canvas/components/state-node.tsx`
- Modify: `src/features/canvas/components/decision-node.tsx`
- Modify: `src/features/canvas/components/entry-node.tsx`
- Modify: `src/features/canvas/components/diff-tooltip-section.tsx`
- Modify: `src/features/canvas/components/diff-legend-section.tsx`

- [ ] **Step 1: Create `src/constants/diff.ts`**

```typescript
import type { DiffStatus } from '@/types/diff';

/** Diff colors for canvas/SVG components that can't use CSS variables directly. */
export const DIFF_COLORS: Record<string, string> = {
  added: '#3d8c75',
  modified: '#7b8fcd',
  removed: '#b84040',
  unchanged: '#6a6860',
};

/** Complete diff status config for labels, colors, and backgrounds. */
export const DIFF_STATUS_CONFIG: Record<
  Exclude<DiffStatus, 'unchanged'>,
  { label: string; color: string; bg: string; border: string }
> = {
  added: {
    label: 'New',
    color: '#3d8c75',
    bg: 'rgba(61,140,117,0.12)',
    border: 'rgba(61,140,117,0.22)',
  },
  modified: {
    label: 'Modified',
    color: '#7b8fcd',
    bg: 'rgba(123,143,205,0.12)',
    border: 'rgba(123,143,205,0.22)',
  },
  removed: {
    label: 'Removed',
    color: '#b84040',
    bg: 'rgba(184,64,64,0.12)',
    border: 'rgba(184,64,64,0.22)',
  },
};
```

- [ ] **Step 2: Replace local `DIFF_COLORS` in all 5 canvas node files**

In each of `step-node.tsx`, `entity-node.tsx`, `state-node.tsx`, `decision-node.tsx`, `entry-node.tsx`:

- Remove the local `DIFF_COLORS` constant
- Add import: `import { DIFF_COLORS } from '@/constants/diff';`
- Verify no other local references to the removed constant

- [ ] **Step 3: Update `diff-tooltip-section.tsx` to use shared config**

Replace the local `STATUS_CONFIG` with import from shared constants:

```typescript
import { DIFF_STATUS_CONFIG } from '@/constants/diff';

// Replace local STATUS_CONFIG usage:
// Before: const config = STATUS_CONFIG[status];
// After:  const config = DIFF_STATUS_CONFIG[status as keyof typeof DIFF_STATUS_CONFIG];
```

- [ ] **Step 4: Update `diff-legend-section.tsx` to use shared config**

Replace local `DIFF_ENTRIES` with data derived from shared constants:

```typescript
import { DIFF_COLORS } from '@/constants/diff';

const DIFF_ENTRIES = [
  { label: 'New', color: DIFF_COLORS.added },
  { label: 'Modified', color: DIFF_COLORS.modified },
  { label: 'Removed', color: DIFF_COLORS.removed },
  { label: 'Unchanged', color: DIFF_COLORS.unchanged },
];
```

- [ ] **Step 5: Run checks and commit**

```bash
pnpm typecheck && pnpm lint && pnpm build
git add src/constants/diff.ts src/features/canvas/components/step-node.tsx src/features/canvas/components/entity-node.tsx src/features/canvas/components/state-node.tsx src/features/canvas/components/decision-node.tsx src/features/canvas/components/entry-node.tsx src/features/canvas/components/diff-tooltip-section.tsx src/features/canvas/components/diff-legend-section.tsx
git commit -m "refactor: consolidate diff colors into shared constants"
```

---

### Task 2: Complete the color token palette

**Files:**

- Modify: `src/styles/variables/colors.scss`

- [ ] **Step 1: Add missing primitive color scales**

The current `colors.scss` has primary, accent, surface, destructive, neutral scales. Add blue and red scales needed for diff colors, and ensure neutral scale has the fine-grained values the dark theme needs (850, 875, 950):

```scss
// Add to existing :root block in colors.scss:

// Blue (for diff-modified, links)
--color-blue-100: #dbeafe;
--color-blue-200: #bfdbfe;
--color-blue-300: #93c5fd;
--color-blue-400: #60a5fa;
--color-blue-500: #7b8fcd;
--color-blue-600: #5b6eae;
--color-blue-700: #4a5a8f;

// Red (for diff-removed, destructive states)
--color-red-100: #fee2e2;
--color-red-200: #fecaca;
--color-red-300: #fca5a5;
--color-red-400: #f87171;
--color-red-500: #b84040;
--color-red-600: #991b1b;

// Extended neutral (fine grain for dark theme surfaces)
--color-neutral-850: #1e2028;
--color-neutral-875: #1a1d24;
--color-neutral-950: #0f1319;
```

- [ ] **Step 2: Run checks and commit**

```bash
pnpm lint:styles && pnpm build
git add src/styles/variables/colors.scss
git commit -m "refactor: add blue, red, and extended neutral color scales"
```

---

### Task 3: Add theme support infrastructure

**Files:**

- Modify: `src/styles/variables/dark-theme.scss`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Restructure `dark-theme.scss` with theme scoping**

Wrap existing dark theme tokens in `[data-theme="dark"]` selector (alongside `:root` for default). Add the light theme block with inverted values:

```scss
// Dark theme (default)
:root,
[data-theme='dark'] {
  // Existing tokens — keep all current values:
  --bg-body: #0f1319;
  --bg-panel: #161a21;
  --bg-raised: rgb(255 255 255 / 4%);
  --bg-hover: rgb(255 255 255 / 6%);
  --bg-active: rgb(255 255 255 / 8%);
  --bg-input: rgb(255 255 255 / 4%);
  --text-primary: #e8e6e1;
  --text-secondary: #9a9790;
  --text-muted: #78756f;
  --text-dim: #5a5750;
  --border-subtle: rgb(255 255 255 / 6%);
  --border-medium: rgb(255 255 255 / 10%);
  --border-strong: rgb(255 255 255 / 16%);
  --glow-green: rgb(61 140 117 / 30%);
  --glow-orange: rgb(226 119 57 / 25%);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-fast: 120ms;
  --transition-base: 200ms;
}

// Light theme (future — values designed but not activated until toggle UI is built)
[data-theme='light'] {
  --bg-body: #f8f7f5;
  --bg-panel: #ffffff;
  --bg-raised: #f0efed;
  --bg-hover: #e8e7e5;
  --bg-active: #e0dfdd;
  --bg-input: #f4f3f1;
  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-muted: #7a7a7a;
  --text-dim: #a0a0a0;
  --border-subtle: rgb(0 0 0 / 6%);
  --border-medium: rgb(0 0 0 / 12%);
  --border-strong: rgb(0 0 0 / 20%);
  --glow-green: rgb(61 140 117 / 20%);
  --glow-orange: rgb(226 119 57 / 15%);
}
```

- [ ] **Step 2: Add `data-theme` attribute to root layout**

In `src/app/layout.tsx`, add the `data-theme` attribute to the `<html>` element:

```tsx
// Find the <html> tag and add data-theme:
<html lang="en" data-theme="dark" className={...}>
```

This ensures dark theme is explicit (not just `:root` default) so the light theme selector works when activated later.

- [ ] **Step 3: Run checks and commit**

```bash
pnpm lint:styles && pnpm typecheck && pnpm build
git add src/styles/variables/dark-theme.scss src/app/layout.tsx
git commit -m "refactor: add theme scoping infrastructure (dark default, light ready)"
```

---

### Task 4: Update diff tokens to use semantic references

**Files:**

- Modify: `src/styles/variables/diff.scss`

- [ ] **Step 1: Update diff.scss to reference palette tokens**

```scss
:root {
  --diff-added: var(--color-primary-500, #3d8c75);
  --diff-modified: var(--color-blue-500, #7b8fcd);
  --diff-removed: var(--color-red-500, #b84040);
  --diff-added-bg: rgb(61 140 117 / 12%);
  --diff-modified-bg: rgb(123 143 205 / 12%);
  --diff-removed-bg: rgb(184 64 64 / 12%);
  --diff-added-border: rgb(61 140 117 / 22%);
  --diff-modified-border: rgb(123 143 205 / 22%);
  --diff-removed-border: rgb(184 64 64 / 22%);
  --diff-dim-opacity: 0.5;
}
```

Note: the `rgb()` values can't reference CSS variables for the opacity variant, so they stay as explicit values. The base colors reference the palette with fallbacks.

- [ ] **Step 2: Run checks and commit**

```bash
pnpm lint:styles && pnpm build
git add src/styles/variables/diff.scss
git commit -m "refactor: diff tokens reference palette with fallbacks"
```

---

### Task 5: Create SCSS layout mixins

**Files:**

- Create: `src/styles/mixins/layout.scss`
- Modify: `src/styles/globals.scss`

- [ ] **Step 1: Create `src/styles/mixins/layout.scss`**

```scss
/// Horizontal flex row with centered alignment.
/// @param {Length} $gap [var(--spacing-200)] — gap between items
@mixin flex-row($gap: var(--spacing-200)) {
  display: flex;
  align-items: center;
  gap: $gap;
}

/// Vertical flex column.
/// @param {Length} $gap [var(--spacing-200)] — gap between items
@mixin flex-col($gap: var(--spacing-200)) {
  display: flex;
  flex-direction: column;
  gap: $gap;
}

/// Centered flex container (both axes).
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/// Scrollable overflow container with thin scrollbar.
@mixin overflow-scroll {
  overflow-y: auto;
  scrollbar-width: thin;
}

/// Standard page content container.
@mixin page-container {
  padding: var(--spacing-600) var(--spacing-700);
  overflow-y: auto;
  height: 100%;
}
```

- [ ] **Step 2: Import in globals.scss**

Add to the imports section in `src/styles/globals.scss`:

```scss
@use 'mixins/layout' as *;
```

- [ ] **Step 3: Run checks and commit**

```bash
pnpm lint:styles && pnpm build
git add src/styles/mixins/layout.scss src/styles/globals.scss
git commit -m "feat: add shared layout SCSS mixins"
```

---

### Task 6: Create SCSS diff mixins

**Files:**

- Create: `src/styles/mixins/diff.scss`
- Modify: `src/styles/globals.scss`

- [ ] **Step 1: Create `src/styles/mixins/diff.scss`**

```scss
/// Apply diff status styling to a row/block element.
/// Adds colored left border and tinted background.
/// @param {String} $status — 'added', 'modified', or 'removed'
@mixin diff-row($status) {
  border-left: 2px solid var(--diff-#{$status});
  background: var(--diff-#{$status}-bg);

  @if $status == 'removed' {
    opacity: 0.7;
  }
}

/// Apply diff status styling to an inline field/cell.
/// Lighter treatment — just background tint and left border on first child.
/// @param {String} $status — 'added' or 'modified'
@mixin diff-field($status) {
  background: var(--diff-#{$status}-bg);

  &:first-child,
  td:first-child {
    border-left: 2px solid var(--diff-#{$status});
  }
}

/// Standard unchanged item styling in diff mode.
@mixin diff-unchanged {
  opacity: 0.3;
  pointer-events: none;
  cursor: default;
}
```

- [ ] **Step 2: Import in globals.scss**

Add to the imports section in `src/styles/globals.scss`:

```scss
@use 'mixins/diff' as *;
```

- [ ] **Step 3: Run checks and commit**

```bash
pnpm lint:styles && pnpm build
git add src/styles/mixins/diff.scss src/styles/globals.scss
git commit -m "feat: add shared diff SCSS mixins"
```

---

### Task 7: Create SCSS typography mixins

**Files:**

- Create: `src/styles/mixins/typography.scss`
- Modify: `src/styles/globals.scss`

- [ ] **Step 1: Create `src/styles/mixins/typography.scss`**

```scss
/// Monospace text for code, field names, paths.
@mixin text-mono {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-300);
  letter-spacing: 0.02em;
}

/// Small label text (section headers, filter labels).
@mixin text-label {
  font-size: var(--font-size-200);
  font-weight: var(--font-weight-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

/// Section header text.
@mixin text-section-header {
  font-size: var(--font-size-400);
  font-weight: var(--font-weight-600);
  color: var(--text-primary);
}
```

- [ ] **Step 2: Import in globals.scss**

Add to the imports section in `src/styles/globals.scss`:

```scss
@use 'mixins/typography' as *;
```

- [ ] **Step 3: Run checks and commit**

```bash
pnpm lint:styles && pnpm build
git add src/styles/mixins/typography.scss src/styles/globals.scss
git commit -m "feat: add shared typography SCSS mixins"
```

---

### Task 8: Consolidate animation keyframes

**Files:**

- Modify: `src/styles/variables/animations.scss`
- Modify: `src/styles/globals.scss`

- [ ] **Step 1: Move keyframes from globals.scss to animations.scss**

Move these keyframe definitions from `globals.scss` into `animations.scss` (which already has `progress-fill` and `spin`):

- `flow-pulse`
- `tooltip-in`
- `glow-pulse`
- `row-enter` (if defined)

Add stagger and transition tokens:

```scss
// Add to existing :root block in animations.scss:
--stagger-delay: 20ms;
--duration-tooltip: 120ms;
--duration-panel: 250ms;
```

- [ ] **Step 2: Remove moved keyframes from globals.scss**

Delete the keyframe blocks from `globals.scss` that were moved to `animations.scss`. The `@use 'variables/animations'` import is already in globals, so they'll still be available.

- [ ] **Step 3: Run checks and commit**

```bash
pnpm lint:styles && pnpm build
git add src/styles/variables/animations.scss src/styles/globals.scss
git commit -m "refactor: consolidate keyframes into animations.scss"
```

---

### Task 9: Migration sweep — SCSS hardcoded font sizes

**Files:**

- Modify: All SCSS module files with hardcoded `font-size: Npx` values (~30 files)

- [ ] **Step 1: Find all hardcoded font sizes**

```bash
grep -rn "font-size: [0-9]" src/ --include="*.scss" | grep -v "variables/" | grep -v "node_modules"
```

- [ ] **Step 2: Replace each with the matching token**

Mapping:
| Hardcoded | Token |
|-----------|-------|
| `9px` | `var(--font-size-50)` |
| `10px` | `var(--font-size-100)` |
| `11px` | `var(--font-size-200)` |
| `12px` | `var(--font-size-300)` |
| `13px` | `var(--font-size-400)` |
| `14px` | `var(--font-size-500)` |
| `16px` | `var(--font-size-600)` |
| `18px` | `var(--font-size-700)` |
| `20px` | `var(--font-size-800)` |
| `22px` | `var(--font-size-900)` |
| `24px` | `var(--font-size-1000)` |
| `32px` | `var(--font-size-1100)` |

Process each file, replacing `font-size: Npx` with the token equivalent. Do NOT change `font-size: var(--font-size-*)` — those are already correct.

- [ ] **Step 3: Run checks and commit**

```bash
pnpm lint:styles && pnpm build
# Verify no hardcoded font sizes remain:
grep -rn "font-size: [0-9]" src/ --include="*.scss" | grep -v "variables/" | grep -v "node_modules"
# Should return zero results
git add -A
git commit -m "refactor: replace all hardcoded font sizes with design tokens"
```

---

### Task 10: Migration sweep — SCSS hardcoded colors

**Files:**

- Modify: All SCSS module files with hardcoded color values (~25 files)

- [ ] **Step 1: Find all hardcoded hex colors and rgb values**

```bash
grep -rn "#[0-9a-fA-F]\{6\}" src/ --include="*.scss" | grep -v "variables/" | grep -v "node_modules"
```

- [ ] **Step 2: Replace with semantic tokens**

Key mappings:
| Hardcoded | Token |
|-----------|-------|
| `#3d8c75` | `var(--color-primary-500)` or `var(--diff-added)` depending on context |
| `#e27739` | `var(--color-accent-500)` |
| `#b84040` | `var(--color-destructive-500)` or `var(--diff-removed)` |
| `#7b8fcd` | `var(--color-blue-500)` or `var(--diff-modified)` |
| `#78756f` | `var(--text-muted)` |
| `#e8e6e1` | `var(--text-primary)` |
| `#9a9790` | `var(--text-secondary)` |

For `rgb()` values with opacity variants of these colors, use the token with opacity:

- `rgb(61 140 117 / X%)` → keep as-is if it's in a diff context (already covered by `--diff-added-bg`), or use `color-mix()` if the context warrants it

Focus on clear wins — hex colors that map 1:1 to tokens. Leave complex `rgb()` gradients for a separate pass if needed.

- [ ] **Step 3: Run checks and commit**

```bash
pnpm lint:styles && pnpm build
git add -A
git commit -m "refactor: replace hardcoded colors with design tokens"
```

---

### Task 11: Migration sweep — diff row patterns in SCSS

**Files:**

- Modify: `src/features/data-model/entity-list/entity-list.module.scss`
- Modify: `src/features/api-map/api-list/api-list.module.scss`
- Modify: `src/features/config/config-list/config-list.module.scss`
- Modify: `src/features/lifecycles/lifecycle-list/lifecycle-list.module.scss`
- Modify: `src/features/architecture/architecture-list/architecture-list.module.scss`
- Modify: `src/features/feature-domain/feature-domain-view/feature-domain-view.module.scss`
- Modify: `src/features/diff-overview/diff-domain-group/diff-domain-group.module.scss`

- [ ] **Step 1: Replace duplicated diff patterns with mixins**

In each file, find the `.diff_added`, `.diff_modified`, `.diff_removed`, `.diff_unchanged` classes and replace with mixin calls:

Before (repeated in 7+ files):

```scss
.diff_added {
  border-left: 2px solid var(--diff-added);
  background: var(--diff-added-bg);
}
.diff_modified {
  border-left: 2px solid var(--diff-modified);
  background: var(--diff-modified-bg);
}
.diff_removed {
  border-left: 2px solid var(--diff-removed);
  background: var(--diff-removed-bg);
  opacity: 0.7;
}
.diff_unchanged {
  opacity: 0.3;
  pointer-events: none;
  cursor: default;
}
```

After:

```scss
@use 'mixins/diff' as *;

.diff_added {
  @include diff-row('added');
}
.diff_modified {
  @include diff-row('modified');
}
.diff_removed {
  @include diff-row('removed');
}
.diff_unchanged {
  @include diff-unchanged;
}
```

Some files use `!important` overrides (architecture, lifecycles) — keep those as-is but add a comment explaining why.

- [ ] **Step 2: Replace field-level diff highlighting with mixin**

In `entity-list.module.scss` and `api-list.module.scss`, replace:

```scss
.fieldRowChanged { ... }
.fieldRowAdded { ... }
```

with:

```scss
.fieldRowChanged {
  @include diff-field('modified');
}
.fieldRowAdded {
  @include diff-field('added');
}
```

- [ ] **Step 3: Run checks and commit**

```bash
pnpm lint:styles && pnpm build
git add -A
git commit -m "refactor: replace duplicated diff styles with shared mixins"
```

---

### Task 12: Final validation

- [ ] **Step 1: Run full CI check**

```bash
pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck && pnpm build
```

All must pass.

- [ ] **Step 2: Visual regression check**

Start dev server and spot-check these pages:

- Dashboard (normal mode)
- Data Model (compare mode — check diff badges, field highlighting)
- API Map (compare mode — check filter bar, endpoint badges)
- Compare Overview (check pills, domain groups)
- Config (compare mode — check value highlighting)
- Journey canvas (check node diff rings)
- ERD canvas (check entity node styling)

Everything should look identical to before the refactor. If any visual differences, the token mapping was wrong — fix before committing.

- [ ] **Step 3: Audit for remaining hardcoded values**

```bash
# Font sizes (should return 0 results outside variables/):
grep -rn "font-size: [0-9]" src/ --include="*.scss" | grep -v "variables/"

# Hex colors (some may remain in complex gradients — that's OK for now):
grep -rn "#[0-9a-fA-F]\{6\}" src/ --include="*.scss" | grep -v "variables/" | grep -v "node_modules"

# Duplicate diff patterns (should return 0 — all using mixins now):
grep -rn "border-left: 2px solid var(--diff-" src/ --include="*.scss" | grep -v "mixins/"
```

Document any remaining items that need follow-up in Phase 2.

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "refactor: Phase 1 complete — foundation design tokens and style system"
```
