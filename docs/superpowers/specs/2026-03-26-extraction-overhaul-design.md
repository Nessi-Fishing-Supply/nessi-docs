# Extraction Overhaul Design

## Problem

The nessi-web-app data extraction pipeline produces incomplete data that doesn't match what the nessi-docs UI needs. The extractors capture ~30-40% of available system knowledge, resulting in empty pages, broken layouts, and missing content in production.

Specific failures:
- Changelog shows "0 changes across 79 releases" (flat PR list, no grouped changes)
- Data Model page is empty (badges[] vs badge mismatch)
- Lifecycles shows only 1 of 3+ lifecycles (extractor only finds TypeScript constants, not DB enums)
- Lifecycle nodes are monochrome (no color data extracted)
- Journeys render vertically (extractor computes layout instead of letting nessi-docs handle it)

## Architecture

Hard separation between two layers:

```
nessi-web-app extractors     = Raw, thorough, exhaustive data. No UI opinions.
nessi-docs adapter (index.ts) = Layout, colors, categories, gap detection. All presentation.
```

### Principles

1. **Extractors output raw truth.** No coordinates, no colors, no categories. Just "what exists."
2. **Output everything found, flag gaps.** If data is incomplete, include it with `undocumented: true`. Never silently skip.
3. **nessi-docs owns presentation.** Layout engines, color schemes, category mapping, gap badges — all here.
4. **Single source of truth per domain.** DB migrations for lifecycles, `docs/journeys/*.json` for journeys, route files for API contracts.

## Extractor Specifications (nessi-web-app)

All extractors live in `scripts/docs-extract/` and output to `_docs-output/`.

### 1. extract-api-routes.ts

**Source:** `src/app/api/**/route.ts` (all 48+ route files)

**Current state:** Finds all routes, captures method/path/auth/errorCodes. Missing request/response schemas, descriptions, and endpoint tags.

**Enhanced output shape:**
```typescript
{
  groups: [{
    name: string,                    // group by first path segment
    endpoints: [{
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      path: string,                  // e.g., "/api/listings/:id"
      description: string,           // from inline comments or CLAUDE.md
      auth: 'user' | 'admin' | 'none',
      permissions?: { feature: string, level: string },
      errorCodes: number[],          // all HTTP error codes found
      requestFields?: [{             // from Zod schemas or destructured params
        name: string,
        type: string,
        required: boolean
      }],
      responseFields?: [{            // from response construction patterns
        name: string,
        type: string
      }],
      tags: string[]                 // e.g., 'file-upload', 'streaming', 'admin-only'
    }]
  }]
}
```

**Enhancement details:**
- Parse Zod validation schemas (`.parse()`, `.safeParse()`, `z.object({})`) for request field extraction
- Parse destructured `const { field1, field2 } = await req.json()` for request fields when no Zod
- Detect `formData()` calls to tag as file-upload
- Pull descriptions from JSDoc comments above handler functions
- Fall back to feature CLAUDE.md descriptions when no inline docs
- Capture all `NextResponse.json({}, { status: N })` patterns for error codes

### 2. extract-database.ts

**Source:** `src/types/database.ts` + `supabase/migrations/*.sql`

**Current state:** Gets tables + simplified field types + RLS/trigger presence badges. Missing enum values, constraints, indexes, FK cascade behavior, RLS policy rules.

**Enhanced output shape:**
```typescript
{
  entities: [{
    name: string,                    // table name
    label: string,                   // titlecased
    fields: [{
      name: string,
      type: string,                  // full type, not simplified
      nullable: boolean,
      default?: string,              // DEFAULT value from migration
      isPrimaryKey: boolean,
      isUnique: boolean,
      references?: {                 // FK relationship
        table: string,
        column: string,
        onDelete: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'NO ACTION'
      }
    }],
    indexes: [{                      // from CREATE INDEX in migrations
      name: string,
      columns: string[],
      unique: boolean
    }],
    rlsPolicies: [{                  // actual policy rules, not just presence
      name: string,
      operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL',
      using?: string,                // USING clause (trimmed)
      withCheck?: string             // WITH CHECK clause (trimmed)
    }],
    triggers: [{
      name: string,
      event: 'INSERT' | 'UPDATE' | 'DELETE',
      timing: 'BEFORE' | 'AFTER',
      function: string               // trigger function name
    }]
  }],
  enums: [{                          // ALL database enums, centralized
    name: string,
    values: string[]
  }],
  nodes: [{                          // ERD nodes — NO x/y coordinates
    id: string,
    label: string
  }],
  edges: [{                          // FK relationships for ERD
    from: string,
    to: string,
    label: string,
    fk: string,                      // FK column name
    onDelete?: string
  }]
}
```

**Enhancement details:**
- Parse `CREATE TYPE ... AS ENUM (...)` from migrations for enum values
- Parse `CHECK (... IN (...))` constraints for inline enums
- Parse `CREATE INDEX` statements for index metadata
- Parse full `CREATE POLICY` statements for RLS rules (name, operation, USING, WITH CHECK)
- Parse `CREATE TRIGGER` statements for timing, event, and function name
- Extract `DEFAULT` values from column definitions
- Extract `ON DELETE CASCADE/RESTRICT/SET NULL` from FK constraints
- Mark `PRIMARY KEY` and `UNIQUE` constraints per column
- ERD nodes output WITHOUT x/y — nessi-docs computes grid layout

### 3. extract-lifecycles.ts (REWRITE)

**Source:** `supabase/migrations/*.sql` + `src/features/*/constants/*.ts`

**Current state:** Only finds `LISTING_STATUS_LABELS` constant. Misses invite_status, transfer_status, and any future status enums.

**Rewritten approach:**
1. Scan ALL migrations for `CREATE TYPE *_status AS ENUM (...)` patterns
2. Scan ALL migrations for `CHECK (column IN (...))` on status-like columns
3. Cross-reference with TypeScript `*_STATUS_LABELS` constants for display labels
4. If no TS labels found, titlecase the enum value as the label
5. Infer transitions from TypeScript constants (if `*_TRANSITIONS` or similar exists)
6. If no transitions found, output empty array with gap flag

**Output shape:**
```typescript
{
  lifecycles: [{
    slug: string,                    // e.g., "listing", "invite", "ownership-transfer"
    name: string,                    // e.g., "Listing Lifecycle"
    description: string,             // auto-generated or from CLAUDE.md
    source: 'enum' | 'check_constraint' | 'typescript',
    states: [{
      id: string,                    // enum value: "draft", "active", etc.
      label: string                  // from *_STATUS_LABELS or titlecase(id)
    }],
    transitions: [{
      from: string,
      to: string,
      label: string,                 // e.g., "Publish", "Mark as sold"
      undocumented?: boolean         // true if transition was inferred/fallback
    }]
  }]
}
```

**No x/y, no colors.** nessi-docs handles all positioning and styling.

**Gap handling:** If transitions can't be determined:
- Output all states with empty transitions array
- Add to `_meta.json` gaps: `{ domain: "lifecycles", item: "invite_status", reason: "no transitions defined" }`

### 4. extract-journeys.ts (SIMPLIFY)

**Source:** `docs/journeys/*.json`

**Current state:** Reads JSON and adds x/y coordinates. Layout computation is nessi-docs' job.

**Simplified approach:**
- Read each JSON file from `docs/journeys/`
- Validate against `docs/journeys/schema.json`
- Pass through raw data with NO coordinate computation
- Strip any existing x/y if present in source files

**Output shape:**
```typescript
{
  journeys: [{
    slug: string,                    // filename without .json
    title: string,
    persona: string,
    description: string,
    relatedIssues?: number[],
    nodes: [{
      id: string,
      type: 'entry' | 'step' | 'decision',
      label: string,
      // NO x, NO y — nessi-docs computes layout
      layer?: 'client' | 'server' | 'database' | 'background' | 'email' | 'external',
      status?: 'planned' | 'built' | 'tested',
      route?: string,                // API route reference
      codeRef?: string,              // source file path
      notes?: string,
      why?: string,
      errorCases?: [{
        condition: string,
        result: string,
        httpStatus?: number
      }],
      ux?: {
        toast?: string,
        redirect?: string,
        modal?: string,
        email?: string,
        notification?: string,
        stateChange?: string
      },
      options?: [{                   // decision branch options
        label: string,
        to: string
      }]
    }],
    edges: [{
      from: string,
      to: string,
      opt?: string                   // decision branch label
    }]
  }]
}
```

### 5. extract-features.ts (ENHANCED)

**Source:** `src/features/*/` directories + CLAUDE.md files

**Current state:** Gets counts and descriptions. Missing cross-references, real status detection, entity/route mapping.

**Enhanced output shape:**
```typescript
{
  features: [{
    slug: string,
    name: string,
    description: string,             // from CLAUDE.md first paragraph
    status: 'built' | 'in-progress' | 'planned' | 'stubbed',
    componentCount: number,
    endpointCount: number,
    hookCount: number,
    serviceCount: number,
    entities: string[],              // DB table names referenced in this feature's code
    apiRoutes: string[],             // route paths under src/app/api/{slug}/
    journeySlugs: string[],         // journey JSON files that reference this feature
    links: [{                        // cross-references
      type: 'journey' | 'api-group' | 'entity' | 'lifecycle',
      label: string,
      href: string
    }]
  }]
}
```

**Enhancement details:**
- Detect status from code patterns: `TODO`/`WIP` comments → 'in-progress', empty dirs → 'planned', test files present → 'built'
- Scan feature code for table name references (e.g., `from('listings')`, `supabase.from('...')`)
- Map feature slug → API routes by checking `src/app/api/{slug}/` existence
- Scan journey JSONs for `codeRef` paths matching feature directory
- Generate cross-reference links automatically

### 6. extract-config.ts (ENHANCED)

**Source:** `src/features/*/{constants,config}/*.ts` + `supabase/migrations/*.sql`

**Current state:** Finds TypeScript constants with value/label patterns. Misses database enums entirely.

**Enhanced output shape:**
```typescript
{
  configs: [{
    slug: string,
    name: string,
    description: string,
    source: string,                  // file path or 'migration:filename.sql'
    sourceType: 'typescript' | 'database_enum' | 'check_constraint',
    values: [{
      value: string,
      label: string,
      description?: string
    }]
  }]
}
```

**Enhancement details:**
- Include ALL database enums from migrations (listing_category, listing_condition, listing_status, invite_status, shipping_paid_by, etc.)
- For DB enums: value = enum constant, label = titlecase(value), description auto-generated
- For TS constants: existing extraction logic (4 patterns) unchanged
- Deduplicate when both DB enum and TS constant exist for same concept (prefer TS for richer labels)

### 7. extract-permissions.ts (MINOR ENHANCEMENT)

**Source:** `src/features/shops/types/permissions.ts` + `src/features/shops/constants/roles.ts`

**Current state:** Works but has hardcoded role metadata.

**Enhancement:** Read role descriptions from CLAUDE.md or inline comments instead of hardcoding. Keep current output shape — it's fine for the UI.

### 8. extract-onboarding.ts (MINOR ENHANCEMENT)

**Source:** `src/features/auth/CLAUDE.md`

**Current state:** Parses markdown sections. Works but fragile.

**Enhancement:** Add `undocumented: true` flag to steps that were auto-generated from fallback defaults rather than parsed from actual CLAUDE.md content. Keep current output shape.

### 9. fetch-changelog.ts (NO CHANGES)

Already captures all merged PRs with metadata. nessi-docs handles the grouping into dated releases with change types.

### 10. fetch-kanban.ts (NO CHANGES)

GitHub Projects integration works as-is.

### 11. _meta.json (ENHANCED)

**Enhanced output shape:**
```typescript
{
  extractedAt: string,               // ISO timestamp
  sourceCommit: string,              // git SHA
  sourceRepo: string,
  scriptVersion: string,
  itemCounts: {
    apiGroups: number,
    entities: number,
    enums: number,                   // NEW
    roles: number,
    permissionFeatures: number,
    configs: number,
    features: number,
    lifecycles: number,
    journeys: number,
    onboardingSteps: number,
    roadmapItems: number,
    changelogEntries: number
  },
  gaps: [{                           // NEW — things found but incomplete
    domain: string,                  // e.g., "lifecycles", "api-routes"
    item: string,                    // e.g., "invite_status", "POST /api/listings"
    reason: string                   // e.g., "no transitions defined"
  }]
}
```

## nessi-docs Adapter Layer

All transforms live in `src/data/index.ts`. The adapter takes raw extraction output and produces the exact shapes the UI components expect.

### Journey Layout Engine

Computes horizontal (left-to-right) positions from the node graph:

1. BFS from entry nodes to assign columns (x-axis levels)
2. Steps within same column stacked vertically
3. Decision nodes offset to create branch lanes
4. Constants: NODE_WIDTH, NODE_HEIGHT, H_GAP, V_GAP (tunable)

### Lifecycle Layout + Colors

1. Topological sort of states via transitions → assign x positions
2. States at same level stacked vertically
3. Color assignment based on state semantics:
   - Terminal positive states (sold, accepted) → teal/green
   - Terminal negative states (deleted, revoked, cancelled) → red
   - Active/in-progress states → green
   - Pending/draft states → gray/amber
   - Archived/deactivated → muted
4. Fallback: cycle through a palette for unknown semantics

### Entity Categorization

Maps table names → semantic categories for the entity list grouping:
- core, lifecycle, junction, config, media, tracking, discovery, user, system
- New tables default to 'system' with a "Needs Review" indicator

### ERD Layout

Grid layout computed from node count:
- 3-4 columns, rows auto-calculated
- Enriched with badge (from category map) and fieldCount (from entity data)

### Changelog Grouping

Groups flat PR entries by date, maps conventional commit types to change types (added/changed/fixed/removed).

### Gap Detection

Surfaces `undocumented` flags and `_meta.gaps` as "Needs Review" badges in the UI. This turns missing documentation into actionable items.

## Sync Pipeline

No changes to the GitHub Action workflow (`sync-docs.yml`):

1. Push to main in nessi-web-app triggers extraction
2. `pnpm tsx scripts/docs-extract/run-all.ts` runs all extractors
3. `validate.ts` checks all output files exist and are non-empty
4. Output committed to nessi-docs `src/data/generated/` via GitHub API
5. Vercel auto-deploys nessi-docs on the incoming commit

## Scope

### In scope (this spec)
- Rewrite/enhance all 10 extractors in nessi-web-app
- Enhanced `_meta.json` with gap tracking
- Updated adapter transforms in nessi-docs `src/data/index.ts`
- Journey horizontal layout engine
- Lifecycle auto-layout with colors
- Gap badge surfacing in UI

### Out of scope
- Backfilling journey JSON files (user will do manually)
- New nessi-docs pages or components (existing UI is sufficient)
- Changes to the GitHub Action workflow
- Changes to journey JSON schema

## Success Criteria

1. All pages in nessi-docs render with complete, accurate data
2. Lifecycles page shows all status enums from DB migrations (listing, invite, transfer)
3. Lifecycle nodes have distinct colors per state
4. Journeys render horizontally (left-to-right flow)
5. Changelog shows grouped changes with descriptions, not "0 changes"
6. Data Model shows entities grouped by semantic category
7. Missing/incomplete data surfaces as "Needs Review" badges
8. Adding a new DB enum or API route in nessi-web-app automatically appears in docs after next sync
