# Extraction Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the nessi-web-app data extraction pipeline to be exhaustive and raw, then build a presentation-layer adapter in nessi-docs that handles layout, colors, categories, and gap detection.

**Architecture:** Two repos, hard boundary. nessi-web-app extractors output thorough raw data (no coordinates, no colors, no categories). nessi-docs adapter transforms raw data into shapes the UI components expect (layout engines, color assignment, entity categorization, gap badges).

**Tech Stack:** TypeScript, Node.js fs/path, Supabase migrations (SQL parsing), GitHub REST/GraphQL APIs, Next.js static data layer.

**Repos:**
- `nessi-web-app` at `/Users/kyleholloway/Documents/Development/nessi-web-app`
- `nessi-docs` at `/Users/kyleholloway/Documents/Development/nessi-docs`

---

## File Map

### nessi-web-app (extractors)

| File | Action | Responsibility |
|------|--------|---------------|
| `scripts/docs-extract/extract-lifecycles.ts` | **Rewrite** | Parse migrations for all status enums and CHECK constraints |
| `scripts/docs-extract/extract-journeys.ts` | **Simplify** | Raw passthrough from docs/journeys/*.json, no x/y |
| `scripts/docs-extract/extract-database.ts` | **Enhance** | Add enum values, constraints, indexes, RLS rules, triggers, FK cascade |
| `scripts/docs-extract/extract-api-routes.ts` | **Enhance** | Add request fields (Zod), response patterns, descriptions, tags |
| `scripts/docs-extract/extract-features.ts` | **Enhance** | Add entity mapping, API route mapping, journey cross-refs, real status |
| `scripts/docs-extract/extract-config.ts` | **Enhance** | Add database enum extraction from migrations |
| `scripts/docs-extract/run-all.ts` | **Update** | Add gap tracking to _meta.json |
| `scripts/docs-extract/validate.ts` | **Update** | Validate new fields, regression guards for no x/y |
| `docs/journeys/_example.json` | **Already created** | Template for authoring new journeys |

### nessi-docs (adapter)

| File | Action | Responsibility |
|------|--------|---------------|
| `src/data/index.ts` | **Rewrite** | Full adapter with layout engines, color assignment, gap detection |
| `src/types/journey.ts` | **Minor update** | Make x/y optional (adapter computes them) |
| `src/types/lifecycle.ts` | **Minor update** | Make x/y optional, add source field |
| `src/types/extraction-meta.ts` | **Update** | Add gaps array type |

---

## Task 1: Rewrite extract-lifecycles.ts

**Context:** Currently only finds `LISTING_STATUS_LABELS` in TypeScript constants. Must parse Supabase migrations for ALL status enums and CHECK constraints.

**Files:**
- Rewrite: `nessi-web-app/scripts/docs-extract/extract-lifecycles.ts`

- [ ] **Step 1: Read all migration files to understand patterns**

Run in nessi-web-app:
```bash
grep -rn "CREATE TYPE.*AS ENUM" supabase/migrations/
grep -rn "CHECK.*IN (" supabase/migrations/
```

Document every enum and CHECK constraint found. These are the lifecycles the new extractor must capture.

- [ ] **Step 2: Rewrite extract-lifecycles.ts**

Replace the entire file. The new extractor:

1. Scans `supabase/migrations/*.sql` for `CREATE TYPE {name} AS ENUM ({values})` patterns
2. Scans `supabase/migrations/*.sql` for `CHECK ({column} IN ({values}))` patterns on status-like columns
3. Cross-references with `src/features/*/constants/*.ts` for `*_STATUS_LABELS` display labels
4. For each discovered lifecycle:
   - `slug`: derived from enum name (e.g., `listing_status` -> `listing`)
   - `name`: titlecased slug + " Lifecycle"
   - `states[]`: enum values with labels (from TS constants if found, else titlecase)
   - `transitions[]`: from KNOWN_TRANSITIONS lookup, else empty array
   - `source`: 'enum' | 'check_constraint' | 'typescript'
   - NO x/y coordinates on states

The file should:
- Parse all migration SQL files in order
- Use regex to find `CREATE TYPE ... AS ENUM (...)` where name contains 'status'
- Use regex to find `CHECK (col IN (...))` where col contains 'status'
- Have a `KNOWN_TRANSITIONS` lookup for listing, invite, and ownership_transfer
- Cross-reference with TypeScript `*_STATUS_LABELS` for richer display labels
- Export a function `extractLifecycles()` returning `{ lifecycles: RawLifecycle[] }`

- [ ] **Step 3: Run the extractor locally and verify output**

Run the extractor and verify output contains at least 3 lifecycles: listing, invite, ownership_transfer. Each should have states with labels and transitions (known or empty).

- [ ] **Step 4: Commit**

```
feat(docs-extract): rewrite lifecycle extractor to parse DB migrations
```

---

## Task 2: Simplify extract-journeys.ts

**Context:** Currently computes x/y layout coordinates. Must pass through raw graph data and let nessi-docs handle layout.

**Files:**
- Rewrite: `nessi-web-app/scripts/docs-extract/extract-journeys.ts`

- [ ] **Step 1: Rewrite extract-journeys.ts**

Keep the flows-to-nodes/edges transformation logic (converts authoring format into graph). Remove ALL coordinate computation:
- Remove constants: `X_START`, `Y_SPACING`, `DECISION_X_OFFSET`
- Remove `let y = 0` counter and all `y += Y_SPACING` increments
- Remove all `x:` and `y:` property assignments on node objects
- Keep everything else: flow-to-node conversion, edge generation, decision branching, ID scoping
- Skip files starting with `_` (the template) and `schema.json`

Output nodes should have: id, type, label, layer, status, route, codeRef, notes, why, errorCases, ux, options — but NO x or y.

- [ ] **Step 2: Run the extractor and verify no x/y in output**

Verify that output nodes do not contain x or y keys, journey count >= 3, and the graph structure (nodes + edges) is intact.

- [ ] **Step 3: Commit**

```
feat(docs-extract): simplify journey extractor to raw graph data (no layout)
```

---

## Task 3: Enhance extract-database.ts

**Context:** Currently gets tables + simplified field types + RLS/trigger presence. Must add enum values, constraints, indexes, RLS policy rules, trigger details, FK cascade behavior, and DEFAULT values.

**Files:**
- Enhance: `nessi-web-app/scripts/docs-extract/extract-database.ts`

- [ ] **Step 1: Read the current file and all migrations to understand SQL patterns**

Grep for CREATE TYPE, CREATE INDEX, CREATE POLICY, CREATE TRIGGER, ON DELETE, and DEFAULT patterns in migrations. Document what exists.

- [ ] **Step 2: Add enum extraction function**

Parse ALL `CREATE TYPE ... AS ENUM (...)` from migrations (not just status enums). Return `{ name: string; values: string[] }[]`. Add to top-level output as `enums` array.

- [ ] **Step 3: Add RLS policy extraction**

Parse `CREATE POLICY name ON table FOR operation USING (expr) WITH CHECK (expr)` from migrations. Return array of `{ name, table, operation, using?, withCheck? }`. Attach to each entity by matching table name.

- [ ] **Step 4: Add index extraction**

Parse `CREATE [UNIQUE] INDEX name ON table (columns)` from migrations. Return array of `{ name, table, columns[], unique }`. Attach to each entity by matching table name.

- [ ] **Step 5: Add trigger extraction**

Parse `CREATE TRIGGER name BEFORE|AFTER INSERT|UPDATE|DELETE ON table EXECUTE FUNCTION func` from migrations. Return array of `{ name, table, event, timing, function }`. Attach to each entity.

- [ ] **Step 6: Enhance entity field output**

For each entity field, also extract:
- `default` value from migration column definitions
- `isPrimaryKey` and `isUnique` from constraints
- `references.onDelete` from FK definitions (CASCADE, RESTRICT, SET NULL)

- [ ] **Step 7: Remove x/y from ERD nodes**

Change ERD node output to only `{ id, label }` — no grid layout coordinates. nessi-docs will compute the grid.

- [ ] **Step 8: Run the extractor and verify enhanced output**

Run the full pipeline. Verify data-model.json has `enums` array with values, entities have `indexes`, `rlsPolicies`, `triggers` arrays, and ERD nodes have no x/y.

- [ ] **Step 9: Commit**

```
feat(docs-extract): enhance database extractor with enums, RLS rules, indexes, triggers
```

---

## Task 4: Enhance extract-config.ts

**Context:** Must also extract database enums as config values (listing_category, listing_condition, etc.).

**Files:**
- Enhance: `nessi-web-app/scripts/docs-extract/extract-config.ts`

- [ ] **Step 1: Add database enum config extraction**

Read all migration SQL. Parse `CREATE TYPE ... AS ENUM (...)` for NON-status enums (status enums go to lifecycles extractor). For each, create a config entry with `sourceType: 'database_enum'`, slug from enum name, titlecased labels.

- [ ] **Step 2: Integrate into main extractConfigs() function**

Call the new function after existing TypeScript extraction. Merge results. Deduplicate by slug (prefer TypeScript version for richer labels when both exist).

- [ ] **Step 3: Run and verify**

Verify config-reference.json includes database enums like listing-category, listing-condition, shipping-paid-by alongside existing TypeScript configs.

- [ ] **Step 4: Commit**

```
feat(docs-extract): add database enum extraction to config extractor
```

---

## Task 5: Enhance extract-api-routes.ts

**Context:** Must add request field extraction from Zod schemas, descriptions, and endpoint tags.

**Files:**
- Enhance: `nessi-web-app/scripts/docs-extract/extract-api-routes.ts`

- [ ] **Step 1: Add Zod schema parsing for request fields**

Parse `z.object({ field: z.string(), ... })` patterns in route files to extract field names, types, and required status. Fallback: parse `const { field1, field2 } = await req.json()` destructuring.

- [ ] **Step 2: Add description extraction**

Extract from JSDoc comments above handler functions, or single-line comments before exports. Fallback to empty string.

- [ ] **Step 3: Add endpoint tagging**

Detect patterns in route code:
- `formData()` calls -> 'file-upload' tag
- `ReadableStream` / streaming -> 'streaming' tag
- `createAdminClient` -> 'admin-only' tag
- Path contains 'webhook' -> 'webhook' tag

- [ ] **Step 4: Integrate into main extraction loop**

Add `requestFields`, `description`, and `tags` to each endpoint object.

- [ ] **Step 5: Run and verify**

Verify api-contracts.json endpoints have requestFields (where Zod schemas exist), descriptions, and tags.

- [ ] **Step 6: Commit**

```
feat(docs-extract): add request field, description, and tag extraction to API routes
```

---

## Task 6: Enhance extract-features.ts

**Context:** Must add entity mapping, API route cross-refs, journey cross-refs, and smarter status detection.

**Files:**
- Enhance: `nessi-web-app/scripts/docs-extract/extract-features.ts`

- [ ] **Step 1: Add entity mapping**

Scan feature source files for Supabase table references (`from('table_name')` patterns). Return list of referenced table names per feature.

- [ ] **Step 2: Add journey cross-referencing**

Scan journey JSON files for `codeRef` paths matching `src/features/{slug}/`. Return list of journey slugs per feature.

- [ ] **Step 3: Add smarter status detection**

Check for: explicit `status:` in CLAUDE.md, presence of components/services dirs, TODO/WIP markers. Map to 'built', 'in-progress', 'planned', 'stubbed'.

- [ ] **Step 4: Generate cross-reference links**

Build `links[]` array with type/label/href for each entity, API route, and journey reference found.

- [ ] **Step 5: Run and verify**

Verify features.json entries have `entities`, `journeySlugs`, and `links` arrays populated.

- [ ] **Step 6: Commit**

```
feat(docs-extract): add entity mapping, journey cross-refs, status detection to features
```

---

## Task 7: Update run-all.ts and validate.ts

**Context:** Orchestrator needs gap tracking in _meta.json. Validator needs to handle new fields.

**Files:**
- Update: `nessi-web-app/scripts/docs-extract/run-all.ts`
- Update: `nessi-web-app/scripts/docs-extract/validate.ts`

- [ ] **Step 1: Add gap tracking to run-all.ts**

After all extractors run, scan outputs for:
- Lifecycles with empty transitions array -> gap
- Features with missing/default descriptions -> gap
- API routes with no description -> gap

Build `gaps[]` array and include in _meta.json output.

- [ ] **Step 2: Update validate.ts for new fields**

Add validation for:
- `data-model.json` has `enums` array
- `lifecycles.json` lifecycles have `source` field
- `_meta.json` has `gaps` array (can be empty)
- ERD nodes do NOT have x/y (regression guard)
- Journey nodes do NOT have x/y (regression guard)

- [ ] **Step 3: Run full pipeline and validate**

Run `run-all.ts` then `validate.ts`. All validations pass. _meta.json should contain a `gaps` array.

- [ ] **Step 4: Commit**

```
feat(docs-extract): add gap tracking to meta, update validator for new fields
```

---

## Task 8: Update nessi-docs types for optional coordinates

**Context:** Journey nodes and lifecycle states no longer have x/y from the extractor. Types must make these optional.

**Files:**
- Update: `nessi-docs/src/types/journey.ts`
- Update: `nessi-docs/src/types/lifecycle.ts`
- Update: `nessi-docs/src/types/extraction-meta.ts`

- [ ] **Step 1: Update journey.ts**

Make `x` and `y` optional on `JourneyNode` interface.

- [ ] **Step 2: Update lifecycle.ts**

Make `x` and `y` optional on `LifecycleState`. Add optional `source` field to `Lifecycle` interface.

- [ ] **Step 3: Update extraction-meta.ts**

Add `ExtractionGap` interface and optional `gaps` array to `ExtractionMeta`.

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: Pass (fields are now optional, existing code still works).

- [ ] **Step 5: Commit**

```
chore: make journey/lifecycle coordinates optional, add extraction gap types
```

---

## Task 9: Rewrite nessi-docs adapter with layout engines

**Context:** The adapter in `src/data/index.ts` must compute all presentation data: journey horizontal layout, lifecycle state positioning + colors, entity categorization, ERD grid layout, changelog grouping, and gap surfacing.

**Files:**
- Rewrite: `nessi-docs/src/data/index.ts`

- [ ] **Step 1: Build the journey horizontal layout engine**

Function `layoutJourneyNodes(rawNodes, rawEdges)` that:
1. BFS from entry nodes to assign columns (x-axis levels)
2. Steps within same column stacked vertically
3. Decision nodes handled like regular nodes (positioned by graph level)
4. Constants: `J_NODE_W=200`, `J_NODE_H=80`, `J_H_GAP=100`, `J_V_GAP=40`

Returns nodes with computed x/y added.

- [ ] **Step 2: Build the lifecycle layout + color engine**

Reuse the existing topological layout from the current index.ts. Add semantic color assignment:
- Terminal positive (sold, accepted, completed) -> teal/green `#3d8c75`
- Active states -> green `#4a9e7a`
- Pending/draft -> gray/amber `#78756f` / `#b8860b`
- Terminal negative (deleted, revoked, cancelled) -> red `#b84040`
- Inactive (archived, expired) -> muted `#6b6966` / `#a0522d`
- Reserved/transitional -> blue `#5f7fbf`
- Unknown states -> default gray `#78756f`

- [ ] **Step 3: Update ERD layout for no incoming coordinates**

Compute grid layout from node count:
- 3-4 columns, rows auto-calculated
- `ERD_GRID_X_SPACING=280`, `ERD_GRID_Y_SPACING=160`
- Enrich with badge (from ENTITY_CATEGORY_MAP) and fieldCount (from entity data)

- [ ] **Step 4: Integrate all transforms into exports**

Wire up:
- `transformJourneys()` calls `layoutJourneyNodes()`
- `transformLifecycles()` calls topological layout + `assignLifecycleColors()`
- `transformEntities()` uses existing category mapping
- `transformErdNodes()` uses new grid layout
- `transformChangelog()` uses existing date grouping
- All helper functions (getLinksForRoute, getErrorsForEndpoint, etc.) remain unchanged

- [ ] **Step 5: Run typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: Both pass.

- [ ] **Step 6: Commit**

```
feat: rewrite adapter with horizontal journey layout, lifecycle colors, and ERD grid
```

---

## Task 10: End-to-end integration test

**Context:** Run the full pipeline and verify everything renders correctly.

**Files:**
- No new files — verification only

- [ ] **Step 1: Run full extraction in nessi-web-app**

Run `run-all.ts` then `validate.ts`. All validations pass.

- [ ] **Step 2: Copy generated files to nessi-docs**

Copy all JSON files from `nessi-web-app/_docs-output/` to `nessi-docs/src/data/generated/`.

- [ ] **Step 3: Build nessi-docs**

Run typecheck, lint, and build. All pass.

- [ ] **Step 4: Start dev server and visually verify**

Open localhost and verify each page:
- [ ] Journeys render horizontally (left-to-right flow)
- [ ] At least 3 journeys listed in sidebar
- [ ] Lifecycles shows 3+ lifecycles (listing, invite, ownership_transfer)
- [ ] Lifecycle nodes have distinct colors per state
- [ ] Data Model shows entities grouped by category (Core, Lifecycle, Junction, etc.)
- [ ] Changelog shows grouped changes with descriptions (not "0 changes")
- [ ] ERD page renders entity relationship diagram
- [ ] API Map shows all endpoints with grouping
- [ ] Features page shows cross-reference links

- [ ] **Step 5: Commit generated data in nessi-docs**

```
data: sync from nessi-web-app with overhauled extraction pipeline
```

- [ ] **Step 6: Commit all extraction changes in nessi-web-app (if not already)**

```
feat(docs-extract): overhaul extraction pipeline for thorough raw output
```
