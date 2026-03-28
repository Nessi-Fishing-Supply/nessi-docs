# GitHub Source Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every artifact in nessi-docs links to its source code on GitHub — endpoints to route files, entities to migrations, lifecycles to enum definitions, journey steps to feature code.

**Architecture:** Three extractors in nessi-web-app gain a `sourceFile` field that preserves file paths they already read. nessi-docs gets a `GitHubLink` component and a `githubUrl()` helper that constructs URLs from a base constant. The component is integrated into tooltips and panels across all views.

**Tech Stack:** TypeScript, Next.js, SCSS Modules, react-icons (for GitHub icon)

---

## File Map

### nessi-web-app (extraction side)

| File                                         | Action | Purpose                                            |
| -------------------------------------------- | ------ | -------------------------------------------------- |
| `scripts/docs-extract/types.ts`              | Modify | Add `sourceFile` to ApiEndpoint, Entity, Lifecycle |
| `scripts/docs-extract/extract-api-routes.ts` | Modify | Preserve route file path as `sourceFile`           |
| `scripts/docs-extract/extract-database.ts`   | Modify | Track migration file per entity as `sourceFile`    |
| `scripts/docs-extract/extract-lifecycles.ts` | Modify | Track source file per lifecycle as `sourceFile`    |

### nessi-docs (rendering side)

| File                                                       | Action | Purpose                                |
| ---------------------------------------------------------- | ------ | -------------------------------------- |
| `src/constants/github.ts`                                  | Create | GitHub base URL + `githubUrl()` helper |
| `src/components/ui/github-link/index.tsx`                  | Create | Shared `GitHubLink` component          |
| `src/components/ui/github-link/github-link.module.scss`    | Create | Styles for GitHubLink                  |
| `src/components/ui/index.ts`                               | Modify | Re-export GitHubLink                   |
| `src/types/api-contract.ts`                                | Modify | Add `sourceFile` to ApiEndpoint        |
| `src/types/data-model.ts`                                  | Modify | Add `sourceFile` to Entity             |
| `src/types/lifecycle.ts`                                   | Modify | Add `sourceFile` to Lifecycle          |
| `src/features/canvas/components/node-tooltip.tsx`          | Modify | Replace plain codeRef with GitHubLink  |
| `src/components/layout/detail-panel/panels/step-panel.tsx` | Modify | Replace plain codeRef with GitHubLink  |
| `src/features/canvas/components/entity-tooltip.tsx`        | Modify | Add source link section                |
| `src/features/canvas/components/state-tooltip.tsx`         | Modify | Add source link section                |

---

## Task 1: Add `sourceFile` to extraction types (nessi-web-app)

**Files:**

- Modify: `scripts/docs-extract/types.ts`

- [ ] **Step 1: Add `sourceFile` to ApiEndpoint**

In `scripts/docs-extract/types.ts`, add `sourceFile` to the `ApiEndpoint` interface (after the `tags` field):

```typescript
export interface ApiEndpoint {
  method: string;
  path: string;
  label: string;
  auth: 'user' | 'admin' | 'none';
  access: string[];
  errorCodes: number[];
  requestFields: RequestField[];
  description?: string;
  tags: string[];
  sourceFile?: string; // <-- add this
}
```

- [ ] **Step 2: Add `sourceFile` to Entity**

In the same file, add `sourceFile` to the `Entity` interface (after `badges`):

```typescript
export interface Entity {
  name: string;
  label: string;
  fields: EntityField[];
  badges: string[];
  sourceFile?: string; // <-- add this
}
```

- [ ] **Step 3: Add `sourceFile` to Lifecycle**

In the same file, add `sourceFile` to the `Lifecycle` interface (after `source`):

```typescript
export interface Lifecycle {
  slug: string;
  name: string;
  description: string;
  states: LifecycleState[];
  transitions: LifecycleTransition[];
  source?: 'enum' | 'check_constraint' | 'typescript';
  sourceFile?: string; // <-- add this
}
```

- [ ] **Step 4: Commit**

```bash
git add scripts/docs-extract/types.ts
git commit -m "feat: add sourceFile field to extraction types"
```

---

## Task 2: Preserve file paths in API route extractor (nessi-web-app)

**Files:**

- Modify: `scripts/docs-extract/extract-api-routes.ts`

- [ ] **Step 1: Read the current endpoint construction**

Read lines 280-320 of `extract-api-routes.ts` to find where endpoints are built. The `file` variable from `walkFiles` holds the path (e.g., `src/app/api/addresses/[id]/route.ts`). Currently only `toApiPath(file)` is called, discarding the original path.

- [ ] **Step 2: Add `sourceFile` to the endpoint object**

Find the object literal where each endpoint is constructed (around line 305). Add `sourceFile: file` to the object:

```typescript
endpoints.push({
  method,
  path: apiPath,
  label: titleCase(segments[segments.length - 1]),
  auth: authType,
  access: accessContexts,
  errorCodes: [...errorCodes].sort((a, b) => a - b),
  requestFields,
  description: description || undefined,
  tags: [...tags],
  sourceFile: file, // <-- add this
});
```

- [ ] **Step 3: Run the extractor to verify**

```bash
cd /Users/kyleholloway/Documents/Development/nessi-web-app
npx tsx scripts/docs-extract/extract-api-routes.ts
```

Verify the output JSON now includes `sourceFile` fields on endpoints. Spot-check one:

```bash
cat _docs-output/api-contracts.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d['groups'][0]['endpoints'][0], indent=2))"
```

Expected: endpoint object includes `"sourceFile": "src/app/api/..."`.

- [ ] **Step 4: Commit**

```bash
git add scripts/docs-extract/extract-api-routes.ts
git commit -m "feat: preserve source file path in API route extraction"
```

---

## Task 3: Track migration files per entity in database extractor (nessi-web-app)

**Files:**

- Modify: `scripts/docs-extract/extract-database.ts`

- [ ] **Step 1: Read `scanMigrations` and `buildEntities` functions**

Read `extract-database.ts` to understand:

- `scanMigrations()` (line ~254): walks migration files, `filePath` is available at line 269
- `buildEntities()` (line ~522): constructs Entity objects from parsed data
- Need to connect migration file paths to the entities they define

- [ ] **Step 2: Track which migration creates each table**

In the `scanMigrations()` function, the code already parses `CREATE TABLE` statements from each migration file. Add a `Map<string, string>` to track `tableName → migrationFilePath`. When a `CREATE TABLE` is found, record the mapping.

Find where `CREATE TABLE` statements are matched (look for the regex that extracts table names). After the match, store:

```typescript
// At the top of scanMigrations, add:
const tableSourceFiles = new Map<string, string>();

// Inside the CREATE TABLE match block, after extracting tableName:
if (!tableSourceFiles.has(tableName)) {
  tableSourceFiles.set(tableName, filePath);
}
```

Return `tableSourceFiles` from `scanMigrations` alongside the existing return values.

- [ ] **Step 3: Pass `sourceFile` to Entity objects**

In `buildEntities()` (or wherever Entity objects are constructed), accept the `tableSourceFiles` map and set `sourceFile` on each entity:

```typescript
const entity: Entity = {
  name: table.name,
  label: titleCase(table.name),
  fields: /* ... */,
  badges: /* ... */,
  sourceFile: tableSourceFiles.get(table.name),
};
```

Thread the `tableSourceFiles` map from `scanMigrations()` through to `buildEntities()`.

- [ ] **Step 4: Run the extractor to verify**

```bash
npx tsx scripts/docs-extract/extract-database.ts
cat _docs-output/data-model.json | python3 -c "import json,sys; d=json.load(sys.stdin); e=d['entities'][0]; print(e['name'], e.get('sourceFile', 'MISSING'))"
```

Expected: entity name and a migration file path like `supabase/migrations/20260319000000_create_profiles_table.sql`.

- [ ] **Step 5: Commit**

```bash
git add scripts/docs-extract/extract-database.ts
git commit -m "feat: track migration source file per entity in database extraction"
```

---

## Task 4: Track source files in lifecycle extractor (nessi-web-app)

**Files:**

- Modify: `scripts/docs-extract/extract-lifecycles.ts`

- [ ] **Step 1: Read the three passes in `extractLifecycles()`**

The function has three passes:

- Pass 1 (enums): iterates `migrations` which is `Array<{ filePath, content }>` from `readMigrationFiles()`
- Pass 2 (check constraints): same `migrations` array
- Pass 3 (TS constants): iterates files from `walkFiles('src/features', /\.ts$/)`

Each pass already has the file path available but doesn't store it.

- [ ] **Step 2: Add `sourceFile` to Pass 1 (enum types)**

In Pass 1, the loop is `for (const { content } of migrations)`. Change to destructure `filePath` too, and pass it to the lifecycle object:

```typescript
// Pass 1: ENUM types from migrations
for (const { filePath, content } of migrations) {
  for (const { enumName, values } of parseEnumTypes(content)) {
    const resolvedName = typeRenames.get(enumName) ?? enumName;
    const slug = deriveSlug(resolvedName);
    if (seen.has(slug)) continue;
    seen.add(slug);

    lifecycles.push({
      slug,
      name: `${titleCase(slug)} Lifecycle`,
      description: `Status lifecycle for ${titleCase(slug).toLowerCase()} entities`,
      states: buildStates(values, labelMaps.get(slug)),
      transitions: KNOWN_TRANSITIONS[slug] ?? [],
      source: 'enum',
      sourceFile: filePath, // <-- add this
    });
  }
}
```

- [ ] **Step 3: Add `sourceFile` to Pass 2 (check constraints)**

Same pattern for Pass 2:

```typescript
// Pass 2: CHECK constraints from migrations
for (const { filePath, content } of migrations) {
  for (const { columnName, values } of parseCheckConstraints(content)) {
    const slug = deriveSlug(columnName);
    if (seen.has(slug)) continue;
    seen.add(slug);

    lifecycles.push({
      slug,
      name: `${titleCase(slug)} Lifecycle`,
      description: `Status lifecycle for ${titleCase(slug).toLowerCase()} entities`,
      states: buildStates(values, labelMaps.get(slug)),
      transitions: KNOWN_TRANSITIONS[slug] ?? [],
      source: 'check_constraint',
      sourceFile: filePath, // <-- add this
    });
  }
}
```

- [ ] **Step 4: Add `sourceFile` to Pass 3 (TS constants)**

For Pass 3, `collectStatusLabelMaps()` currently returns just the labels map. Modify it to also return the file path where each slug was found. The simplest approach: change the return type to include file paths.

In `collectStatusLabelMaps()`, change the combined map to track file paths:

```typescript
function collectStatusLabelMaps(): Map<string, { labels: Map<string, string>; filePath: string }> {
  const combined = new Map<string, { labels: Map<string, string>; filePath: string }>();
  const files = walkFiles('src/features', /\.ts$/);
  const constantsFiles = files.filter((f) => /\/constants\//.test(f));

  for (const filePath of constantsFiles) {
    const content = readFile(filePath);
    const parsed = parseStatusLabelsMap(content);
    for (const [slug, labels] of parsed) {
      combined.set(slug, { labels, filePath });
    }
  }
  return combined;
}
```

Then update all references to `labelMaps` in `extractLifecycles()`:

- `labelMaps.get(slug)` becomes `labelMaps.get(slug)?.labels`

And in Pass 3:

```typescript
// Pass 3: TS constants not already discovered by migrations
for (const [slug, { labels: labelsMap, filePath }] of labelMaps) {
  if (seen.has(slug)) continue;
  seen.add(slug);

  const states = [...labelsMap.entries()].map(([id, label]) => ({ id, label }));
  lifecycles.push({
    slug,
    name: `${titleCase(slug)} Lifecycle`,
    description: `Status lifecycle for ${titleCase(slug).toLowerCase()} entities`,
    states,
    transitions: KNOWN_TRANSITIONS[slug] ?? [],
    source: 'typescript',
    sourceFile: filePath, // <-- from the constants file
  });
}
```

- [ ] **Step 5: Run the extractor to verify**

```bash
npx tsx scripts/docs-extract/extract-lifecycles.ts
```

Expected output should now show source files:

```
Found 7 lifecycle(s)
  - Listing Lifecycle [enum]: 6 states, 8 transitions
  ...
```

Verify with:

```bash
cat _docs-output/lifecycles.json | python3 -c "import json,sys; d=json.load(sys.stdin); [print(l['slug'], l.get('sourceFile', 'MISSING')) for l in d['lifecycles']]"
```

- [ ] **Step 6: Commit**

```bash
git add scripts/docs-extract/extract-lifecycles.ts
git commit -m "feat: track source file per lifecycle in extraction"
```

---

## Task 5: Run full extraction, format, push nessi-web-app

**Files:**

- No new files — run extraction pipeline and push

- [ ] **Step 1: Run full extraction**

```bash
cd /Users/kyleholloway/Documents/Development/nessi-web-app
npx tsx scripts/docs-extract/run-all.ts
```

Verify output includes `sourceFile` fields in:

- `_docs-output/api-contracts.json`
- `_docs-output/data-model.json`
- `_docs-output/lifecycles.json`

- [ ] **Step 2: Format and lint**

```bash
pnpm format
pnpm lint
```

Fix any issues.

- [ ] **Step 3: Push to main**

```bash
git push
```

- [ ] **Step 4: Wait for CI and Sync Docs Data to pass**

```bash
gh run list --limit 4
```

Wait for both workflows to succeed. The Sync Docs Data workflow will push the updated JSON to nessi-docs.

- [ ] **Step 5: Pull synced data into nessi-docs**

```bash
cd /Users/kyleholloway/Documents/Development/nessi-docs
git stash  # if there are local changes
git pull
git stash pop  # if stashed
```

Verify `src/data/generated/api-contracts.json`, `data-model.json`, and `lifecycles.json` now contain `sourceFile` fields.

---

## Task 6: Add GitHub URL constant and GitHubLink component (nessi-docs)

**Files:**

- Create: `src/constants/github.ts`
- Create: `src/components/ui/github-link/index.tsx`
- Create: `src/components/ui/github-link/github-link.module.scss`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Create GitHub constants**

Create `src/constants/github.ts`:

```typescript
export const GITHUB_BASE_URL = 'https://github.com/Nessi-Fishing-Supply/nessi-web-app/blob/main/';

export function githubUrl(filePath: string): string {
  return `${GITHUB_BASE_URL}${filePath}`;
}
```

- [ ] **Step 2: Create GitHubLink component**

Create `src/components/ui/github-link/index.tsx`:

```tsx
import { VscGithub } from 'react-icons/vsc';
import { githubUrl } from '@/constants/github';
import styles from './github-link.module.scss';

interface GitHubLinkProps {
  filePath: string;
}

export function GitHubLink({ filePath }: GitHubLinkProps) {
  const fileName = filePath.split('/').pop() ?? filePath;

  return (
    <a
      href={githubUrl(filePath)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
      title={filePath}
    >
      <VscGithub className={styles.icon} />
      <span className={styles.fileName}>{fileName}</span>
    </a>
  );
}
```

- [ ] **Step 3: Create GitHubLink styles**

Create `src/components/ui/github-link/github-link.module.scss`:

```scss
.link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-family: var(--font-family-mono);
  color: #3d8c75;
  text-decoration: none;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
  transition:
    background 150ms var(--ease-out),
    color 150ms var(--ease-out);

  &:hover {
    background: rgba(61, 140, 117, 0.1);
    color: #4aaf8f;
  }
}

.icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.fileName {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 4: Check if react-icons/vsc is available**

The project uses `react-icons`. The `VscGithub` icon is from the VS Code icon set in `react-icons/vsc`. Verify it's available:

```bash
node -e "const {VscGithub} = require('react-icons/vsc'); console.log(typeof VscGithub)"
```

If not available, use `VscGithubInverted` or fall back to `HiOutlineExternalLink` from `react-icons/hi` which is already imported elsewhere.

- [ ] **Step 5: Re-export from UI barrel**

Read `src/components/ui/index.ts` and add the GitHubLink export:

```typescript
export { GitHubLink } from './github-link';
```

- [ ] **Step 6: Commit**

```bash
git add src/constants/github.ts src/components/ui/github-link/ src/components/ui/index.ts
git commit -m "feat: add GitHubLink component and GitHub URL constants"
```

---

## Task 7: Add `sourceFile` to nessi-docs types

**Files:**

- Modify: `src/types/api-contract.ts`
- Modify: `src/types/data-model.ts`
- Modify: `src/types/lifecycle.ts`

- [ ] **Step 1: Add `sourceFile` to ApiEndpoint**

In `src/types/api-contract.ts`, add to the `ApiEndpoint` interface:

```typescript
sourceFile?: string;
```

- [ ] **Step 2: Add `sourceFile` to Entity**

In `src/types/data-model.ts`, add to the `Entity` interface:

```typescript
sourceFile?: string;
```

- [ ] **Step 3: Add `sourceFile` to Lifecycle**

In `src/types/lifecycle.ts`, add to the `Lifecycle` interface:

```typescript
sourceFile?: string;
```

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```

Should pass — these are optional fields.

- [ ] **Step 5: Commit**

```bash
git add src/types/api-contract.ts src/types/data-model.ts src/types/lifecycle.ts
git commit -m "feat: add sourceFile to ApiEndpoint, Entity, and Lifecycle types"
```

---

## Task 8: Integrate GitHubLink into journey tooltips and panels

**Files:**

- Modify: `src/features/canvas/components/node-tooltip.tsx`
- Modify: `src/components/layout/detail-panel/panels/step-panel.tsx`

- [ ] **Step 1: Update NodeTooltip**

In `src/features/canvas/components/node-tooltip.tsx`, find the codeRef display section (around line 351-356):

```typescript
{node.codeRef && (
  <div>
    <div style={sectionLabel}>Source</div>
    <div style={{ ...monoBlock, color: '#3d8c75' }}>{node.codeRef}</div>
  </div>
)}
```

Replace with:

```typescript
{node.codeRef && (
  <div>
    <div style={sectionLabel}>Source</div>
    <GitHubLink filePath={node.codeRef} />
  </div>
)}
```

Add the import at the top:

```typescript
import { GitHubLink } from '@/components/ui/github-link';
```

- [ ] **Step 2: Update StepPanel**

In `src/components/layout/detail-panel/panels/step-panel.tsx`, find the codeRef display section (around lines 66-71):

```typescript
{node.codeRef && (
  <>
    <SectionLabel>Code Reference</SectionLabel>
    <div className={styles.codeBlockPrimary}>{node.codeRef}</div>
  </>
)}
```

Replace with:

```typescript
{node.codeRef && (
  <>
    <SectionLabel>Code Reference</SectionLabel>
    <GitHubLink filePath={node.codeRef} />
  </>
)}
```

Add the import at the top:

```typescript
import { GitHubLink } from '@/components/ui/github-link';
```

- [ ] **Step 3: Verify in browser**

Navigate to any journey with codeRef data (e.g., buyer-recently-viewed) and hover a step node. The "Source" section should now show a clickable GitHub link instead of plain text. Click it — should open the correct file on GitHub in a new tab.

- [ ] **Step 4: Commit**

```bash
git add src/features/canvas/components/node-tooltip.tsx src/components/layout/detail-panel/panels/step-panel.tsx
git commit -m "feat: replace plain codeRef with clickable GitHub links in journey views"
```

---

## Task 9: Integrate GitHubLink into entity tooltip

**Files:**

- Modify: `src/features/canvas/components/entity-tooltip.tsx`

- [ ] **Step 1: Add source link to EntityTooltip**

In `src/features/canvas/components/entity-tooltip.tsx`, find the end of the existing content sections (after the API Endpoints section, before the deep-link section). Add a Source section when `sourceFile` is present:

```typescript
{entity.sourceFile && (
  <div>
    <div style={sectionLabel}>Source</div>
    <GitHubLink filePath={entity.sourceFile} />
  </div>
)}
```

Add the import at the top:

```typescript
import { GitHubLink } from '@/components/ui/github-link';
```

- [ ] **Step 2: Verify in browser**

Navigate to the ERD canvas (`/entity-relationships`), hover an entity node. The tooltip should now include a "Source" row with a link to the migration file.

- [ ] **Step 3: Commit**

```bash
git add src/features/canvas/components/entity-tooltip.tsx
git commit -m "feat: add GitHub source link to entity tooltips"
```

---

## Task 10: Integrate GitHubLink into lifecycle tooltip

**Files:**

- Modify: `src/features/canvas/components/state-tooltip.tsx`

- [ ] **Step 1: Add source link to StateTooltip**

In `src/features/canvas/components/state-tooltip.tsx`, add a Source section. The lifecycle's `sourceFile` is available on the `lifecycle` prop. Add after the description section and before the incoming transitions section:

```typescript
{lifecycle.sourceFile && (
  <div>
    <div style={sectionLabel}>Source</div>
    <GitHubLink filePath={lifecycle.sourceFile} />
  </div>
)}
```

Add the import at the top:

```typescript
import { GitHubLink } from '@/components/ui/github-link';
```

- [ ] **Step 2: Verify in browser**

Navigate to any lifecycle canvas (e.g., `/lifecycles/listing`), hover a state node. The tooltip should include a "Source" row linking to the migration or constants file.

- [ ] **Step 3: Commit**

```bash
git add src/features/canvas/components/state-tooltip.tsx
git commit -m "feat: add GitHub source link to lifecycle state tooltips"
```

---

## Task 11: Integrate GitHubLink into API Map

**Files:**

- Explore and modify: the API Map endpoint display (likely in `src/features/api-map/`)

- [ ] **Step 1: Find the API endpoint row/panel component**

```bash
ls src/features/api-map/
```

Find the component that renders individual endpoint rows or the expandable detail view.

- [ ] **Step 2: Add source link**

In the endpoint detail/expanded view, add a `GitHubLink` when `sourceFile` is present on the endpoint:

```typescript
{endpoint.sourceFile && (
  <GitHubLink filePath={endpoint.sourceFile} />
)}
```

Add the import. Place it near the existing endpoint metadata (method, path, auth, etc.).

- [ ] **Step 3: Verify in browser**

Navigate to `/api-map`, expand an endpoint. Should show a GitHub link to the route file.

- [ ] **Step 4: Commit**

```bash
git add src/features/api-map/
git commit -m "feat: add GitHub source link to API Map endpoints"
```

---

## Task 12: Final checks, format, push nessi-docs

- [ ] **Step 1: Run full CI checks**

```bash
pnpm format
pnpm lint
pnpm lint:styles
pnpm typecheck
```

Fix any issues.

- [ ] **Step 2: Build**

```bash
pnpm build
```

Verify all pages generate successfully.

- [ ] **Step 3: Manual smoke test**

Open the dev server and verify GitHub links work in:

- Journey step tooltips (hover a step with codeRef)
- Journey step detail panel (click a step)
- ERD entity tooltips (hover an entity)
- Lifecycle state tooltips (hover a state)
- API Map endpoint rows (expand an endpoint)

Each link should open the correct file on GitHub `main` branch in a new tab.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat: GitHub source linking across all views"
git push
```
