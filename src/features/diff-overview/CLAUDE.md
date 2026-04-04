# diff-overview

Diff comparison feature: computes and renders the diff between two branch snapshots.

## Exports (`index.ts`)

- `useDiffResult` — hook: reads Zustand store, returns `{ isActive, compareBranch, diffResult }`
- `getDiff` — service: wraps `computeDiff` from `@/data/diff-engine`
- `DiffOverviewView` — full diff page view
- `DiffDomainGroup` — collapsible domain section within the diff view
- `DiffEmptyState` — empty/inactive state shown when no comparison is selected

## Structure

```
diff-overview/
├── services/diff.ts          # getDiff — pure service wrapping diff-engine
├── hooks/use-diff.ts         # useDiffResult — store-connected hook
├── diff-overview-view/       # Page-level component
├── diff-domain-group/        # Per-domain diff section
└── diff-empty-state/         # Empty state UI
```

## Design Notes

- `useDiffResult` is the single hook all consumers use — name is intentional for backward compat
- The service layer (`getDiff`) exists so the hook delegates computation rather than calling `computeDiff` directly
- All consumers import from `@/features/diff-overview` (the barrel), never from sub-paths
