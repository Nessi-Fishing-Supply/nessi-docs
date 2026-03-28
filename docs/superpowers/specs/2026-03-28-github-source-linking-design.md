# GitHub Source Linking

> The final layer of the deep-dive chain: journey node → data model → endpoint → source code on GitHub.

## Goal

Every navigable artifact in nessi-docs links to its source code on GitHub. Clicking "View Source" opens the exact file on `github.com` where that endpoint, entity, lifecycle, or interaction is defined. This completes the progressive drill-down experience and proves the Archway concept of file-level, line-level traceability.

## Scope

**In scope:**

- Journey step nodes → link to source file via existing `codeRef`
- API endpoints → link to the `route.ts` file that defines them
- Database entities → link to the migration file that creates them
- Lifecycle states → link to the migration (enum) or constants file (TS) that defines them
- A shared `GitHubLink` UI component used consistently across all views

**Out of scope:**

- Inline code preview / embedded file viewer
- Line-number precision (file-level is sufficient for POC)
- Architecture diagram nodes (already have `url` field for external links)
- Cross-repo linking (single repo: `nessi-web-app`)

## URL Construction

**Base URL:** `https://github.com/Nessi-Fishing-Supply/nessi-web-app/blob/main/`

**Pattern:** `{GITHUB_BASE_URL}{sourceFile}`

**Examples:**

- `src/app/api/addresses/[id]/route.ts` → `https://github.com/Nessi-Fishing-Supply/nessi-web-app/blob/main/src/app/api/addresses/[id]/route.ts`
- `supabase/migrations/20260319000000_create_profiles_table.sql` → `https://github.com/Nessi-Fishing-Supply/nessi-web-app/blob/main/supabase/migrations/20260319000000_create_profiles_table.sql`

**Branch:** Always `main`. The extraction runs on PR merge to main, so the docs and main are always in sync. Future state: branch follows the environment being viewed (staging → staging branch, etc.).

**Links open in a new tab** (`target="_blank"`, `rel="noopener noreferrer"`).

## Changes Required

### 1. nessi-web-app: Extraction Types

Add `sourceFile?: string` to three types in `scripts/docs-extract/types.ts`:

```typescript
// In ApiEndpoint
sourceFile?: string;  // e.g., "src/app/api/addresses/[id]/route.ts"

// In Entity
sourceFile?: string;  // e.g., "supabase/migrations/20260319000000_create_profiles_table.sql"

// In Lifecycle
sourceFile?: string;  // e.g., "supabase/migrations/20260321100000_listings_schema.sql"
```

`JourneyNode` already has `codeRef?: string` — no type change needed.

### 2. nessi-web-app: Extractor Updates

**`extract-api-routes.ts`**

- The extractor walks `src/app/api/` and reads each `route.ts`. The `file` variable holds the relative path.
- Preserve `file` as `sourceFile` on the endpoint output object.

**`extract-database.ts`**

- The extractor walks `supabase/migrations/*.sql` and parses `CREATE TABLE` statements.
- Track which migration file defines each table. When building the entity object, include `sourceFile` pointing to the migration file.
- Use the first migration that creates the table (not later ALTER TABLE migrations).

**`extract-lifecycles.ts`**

- Three discovery passes each have a file path available:
  1. Enum types from migrations → store the migration file path
  2. Check constraints from migrations → store the migration file path
  3. TS constants from `src/features/*/constants/` → store the constants file path
- Store the file path from whichever pass discovers the lifecycle first (highest precedence wins).

### 3. nessi-docs: Type Updates

Add `sourceFile?: string` to:

- `types/api-contract.ts` → `ApiEndpoint` interface
- `types/data-model.ts` → `Entity` interface
- `types/lifecycle.ts` → `Lifecycle` interface

No change to `types/journey.ts` — `codeRef` already exists.

### 4. nessi-docs: GitHub URL Configuration

Add to `src/constants/github.ts`:

```typescript
export const GITHUB_BASE_URL = 'https://github.com/Nessi-Fishing-Supply/nessi-web-app/blob/main/';

export function githubUrl(filePath: string): string {
  return `${GITHUB_BASE_URL}${filePath}`;
}
```

### 5. nessi-docs: GitHubLink Component

A small shared component at `src/components/ui/github-link/index.tsx`:

- Accepts `filePath: string` (the relative path, e.g., `src/app/api/cart/route.ts`)
- Renders a styled external link with a GitHub icon and the file name (not the full path)
- Opens in new tab
- Monospace font, subtle styling consistent with existing tooltip/panel aesthetic

### 6. nessi-docs: Integration Points

**NodeTooltip (journey steps):**

- Currently displays `codeRef` as plain monospace text under "Source" label
- Replace with `GitHubLink` component when `codeRef` is present

**StepPanel (journey step detail):**

- Currently displays `codeRef` as plain text under "Code Reference"
- Replace with `GitHubLink` component

**API Map endpoint rows / EndpointPanel:**

- Add "Source" section with `GitHubLink` when `sourceFile` is present on the endpoint
- Display in the endpoint's expandable row or detail panel

**EntityTooltip (ERD hover):**

- Add "Source" row with `GitHubLink` when `sourceFile` is present on the entity

**Data Model rows / EntityPanel:**

- Add "Source" section with `GitHubLink` when `sourceFile` is present

**StateTooltip (lifecycle hover):**

- Add "Source" row with `GitHubLink` when `sourceFile` is present on the lifecycle

**Lifecycle detail (if applicable):**

- Display source link in the canvas or breadcrumb area

All integrations are conditional — only render when `sourceFile` or `codeRef` is present. No empty states needed.

## Data Flow

```
nessi-web-app extractors
  → preserve sourceFile paths in JSON output
  → GitHub Action syncs to nessi-docs/src/data/generated/
  → nessi-docs data layer passes sourceFile through to components
  → GitHubLink component constructs URL from GITHUB_BASE_URL + sourceFile
  → User clicks → opens GitHub in new tab
```

## Implementation Order

1. Update extraction types in nessi-web-app (`types.ts`)
2. Update `extract-api-routes.ts` to preserve file paths
3. Update `extract-database.ts` to track migration file per entity
4. Update `extract-lifecycles.ts` to track source file per lifecycle
5. Re-run extraction, verify output includes `sourceFile` fields
6. Add types in nessi-docs
7. Add `github.ts` constants
8. Build `GitHubLink` component
9. Integrate into NodeTooltip and StepPanel (journey codeRef)
10. Integrate into API Map / endpoint views
11. Integrate into EntityTooltip and Data Model views
12. Integrate into StateTooltip and lifecycle views
13. Push nessi-web-app, wait for sync, pull, push nessi-docs

## Success Criteria

- Every API endpoint row shows a "View Source" link that opens the correct `route.ts` on GitHub
- Every journey step with a `codeRef` shows a clickable GitHub link in tooltip and detail panel
- Every data model entity shows a link to its migration file
- Every lifecycle shows a link to its enum definition or constants file
- All links open correct files on GitHub `main` branch
- Links that don't have source data gracefully don't render (no broken states)
