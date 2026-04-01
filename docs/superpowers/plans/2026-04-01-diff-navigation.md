# Diff Navigation Indicators — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visual diff indicators to the sidebar navigation (colored dots on domains with changes) and the journey domain grid (diff badges on domain cards).

**Architecture:** A `SidebarDiffDots` inner component reads `useDiffMode().diffResult.summary.byDomain` and maps domain keys to sidebar nav items, rendering small colored dots. The journey domain grid reads diff data to show per-domain change badges.

**Tech Stack:** React, TypeScript, SCSS Modules, `useDiffMode()` hook

---

## File Map

### Modified Files

| File                                                        | Change                                                         |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| `src/components/layout/sidebar/index.tsx`                   | Add diff dots to nav items via SidebarDiffDots inner component |
| `src/components/layout/sidebar/sidebar.module.scss`         | Add `.diffDot` style                                           |
| `src/features/journeys/domain-grid/index.tsx`               | Add diff badges to domain cards                                |
| `src/features/journeys/domain-grid/domain-grid.module.scss` | Add diff badge styles                                          |

---

## Task 1: Sidebar Diff Dots

**Files:**

- Modify: `src/components/layout/sidebar/index.tsx`
- Modify: `src/components/layout/sidebar/sidebar.module.scss`

- [ ] **Step 1: Create SidebarDiffDots inner component**

In `src/components/layout/sidebar/index.tsx`, add a new inner component that computes diff dots for each nav item. This needs Suspense since it uses `useDiffMode` → `useSearchParams`.

```tsx
const NAV_TO_DOMAIN: Record<string, string> = {
  journeys: 'journeys',
  api: 'apiGroups',
  data: 'entities',
  erd: 'erdNodes',
  lifecycles: 'lifecycles',
  architecture: 'archDiagrams',
  config: 'configEnums',
};

function useDiffDots(): Map<string, string> {
  const { isActive, diffResult } = useDiffMode();
  return useMemo(() => {
    const dots = new Map<string, string>();
    if (!isActive || !diffResult) return dots;

    for (const [navId, domainKey] of Object.entries(NAV_TO_DOMAIN)) {
      const domain = diffResult.summary.byDomain[domainKey];
      if (!domain) continue;
      if (domain.modified > 0) {
        dots.set(navId, 'var(--diff-modified)');
      } else if (domain.added > 0) {
        dots.set(navId, 'var(--diff-added)');
      }
    }
    return dots;
  }, [isActive, diffResult]);
}
```

Then create a wrapper component that exposes the dots:

```tsx
function DiffDotProvider({
  children,
}: {
  children: (dots: Map<string, string>) => React.ReactNode;
}) {
  const dots = useDiffDots();
  return <>{children(dots)}</>;
}
```

Wrap the nav sections in `<Suspense><DiffDotProvider>` and pass dots to each nav item render.

For each nav item, add the dot after the label span:

```tsx
<Icon className={styles.navIcon} />
<span>{item.label}</span>
{dotColor && <span className={styles.diffDot} style={{ background: dotColor }} />}
```

- [ ] **Step 2: Add diffDot SCSS**

In `src/components/layout/sidebar/sidebar.module.scss`, add:

```scss
.diffDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-left: auto;
}
```

- [ ] **Step 3: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck`
Commit: `feat(diff): add colored diff dots to sidebar nav items`

---

## Task 2: Journey Domain Grid Diff Badges

**Files:**

- Modify: `src/features/journeys/domain-grid/index.tsx`
- Modify: `src/features/journeys/domain-grid/domain-grid.module.scss`

- [ ] **Step 1: Add diff badges to domain cards**

In `src/features/journeys/domain-grid/index.tsx`, add imports:

```ts
import { useDiffMode } from '@/hooks/use-diff-mode';
```

Inside `DomainGrid`, call `useDiffMode`:

```ts
const { isActive: isDiffMode, diffResult } = useDiffMode();
```

Compute per-domain journey diff counts:

```ts
const domainDiffCounts = useMemo(() => {
  if (!isDiffMode || !diffResult) return new Map<string, { added: number; modified: number }>();
  const counts = new Map<string, { added: number; modified: number }>();

  for (const j of diffResult.journeys.added) {
    const prev = counts.get(j.domain) ?? { added: 0, modified: 0 };
    counts.set(j.domain, { ...prev, added: prev.added + 1 });
  }
  for (const m of diffResult.journeys.modified) {
    const domain = m.head.domain;
    const prev = counts.get(domain) ?? { added: 0, modified: 0 };
    counts.set(domain, { ...prev, modified: prev.modified + 1 });
  }

  return counts;
}, [isDiffMode, diffResult]);
```

In each domain card, after the `cardHeader` div, render diff badges:

```tsx
{
  isDiffMode &&
    (() => {
      const dc = domainDiffCounts.get(d.slug);
      if (!dc) return null;
      return (
        <div className={styles.diffBadges}>
          {dc.added > 0 && <span className={styles.diffBadgeAdded}>{dc.added} new</span>}
          {dc.modified > 0 && (
            <span className={styles.diffBadgeModified}>{dc.modified} modified</span>
          )}
        </div>
      );
    })();
}
```

- [ ] **Step 2: Add diff badge SCSS**

In `domain-grid.module.scss`, add:

```scss
.diffBadges {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  font-family: var(--font-family-mono);
  font-size: 10px;
}

.diffBadgeAdded {
  color: var(--diff-added);
}

.diffBadgeModified {
  color: var(--diff-modified);
}
```

- [ ] **Step 3: Wrap DomainGrid in Suspense in page**

The DomainGrid now calls `useDiffMode` which uses `useSearchParams`. Check if the journeys page already wraps in Suspense. If not, add it.

Read `src/app/[branch]/journeys/page.tsx` and wrap the content in `<Suspense>` if needed.

- [ ] **Step 4: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck && pnpm build`
Commit: `feat(diff): add diff badges to journey domain grid`

---

## Task 3: Full CI Validation

- [ ] **Step 1: Run all CI checks**

Run: `pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck`
Expected: All PASS

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Visual smoke test**

1. Navigate to `/staging/data-model?compare=main` — verify sidebar "Data Model" has a colored dot
2. Navigate to `/staging/journeys?compare=main` — verify domain cards show diff badges
3. Dismiss comparison — verify all dots and badges disappear

- [ ] **Step 4: Commit if fixes needed**
