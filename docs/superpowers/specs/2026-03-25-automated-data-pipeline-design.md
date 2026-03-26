# Automated Data Pipeline: nessi-web-app → nessi-docs

**Date:** 2026-03-25
**Status:** Draft
**Goal:** nessi-docs automatically reflects the current state of nessi-web-app with zero manual intervention.

---

## Overview

A GitHub Action in `nessi-web-app` runs on every merge to `main`. It executes TypeScript extraction scripts that parse the codebase, fetches GitHub Project board data, generates structured JSON, and pushes the result to `nessi-docs`. Vercel auto-deploys nessi-docs on the push.

**Trigger:** merge to `main` in nessi-web-app (+ manual dispatch for ad-hoc runs)
**Output:** structured JSON files committed to `nessi-docs/src/data/generated/`
**Deployment:** automatic via Vercel on push to nessi-docs `main`

---

## Architecture

```
nessi-web-app (merge to main)
  │
  ├─ GitHub Action triggers
  │
  ├─ Step 1: Checkout nessi-web-app
  ├─ Step 2: Run extraction scripts (TypeScript, tsx)
  │   ├─ extract-api-routes.ts      → api-contracts.json
  │   ├─ extract-database.ts        → data-model.json, entity-relationships.json
  │   ├─ extract-permissions.ts     → permissions.json
  │   ├─ extract-config.ts          → config-reference.json
  │   ├─ extract-features.ts        → features.json
  │   ├─ extract-lifecycles.ts      → lifecycles.json
  │   ├─ extract-journeys.ts        → journeys.json
  │   └─ extract-onboarding.ts      → onboarding.json
  │
  ├─ Step 3: Fetch GitHub data via API
  │   ├─ fetch-kanban.ts            → roadmap.json
  │   └─ fetch-changelog.ts         → changelog.json
  │
  ├─ Step 4: Validate all JSON against schemas
  ├─ Step 5: Checkout nessi-docs, commit JSON to src/data/generated/
  └─ Step 6: Push → Vercel auto-deploys
```

---

## Design Decisions

### No metadata files

No `docs-meta.json` or separate description files. All labels and descriptions are derived from what already exists in the codebase:

- **API endpoints** — smart label from method + path (`POST /api/listings` → "Create Listing", `GET /api/listings/[id]` → "Get Listing")
- **Database tables** — title-case table name, column types as-is (technical audience for this section)
- **Permissions** — role names and feature names from constants (already readable)
- **Config/enums** — `label` fields already exist in constants files
- **Features** — descriptions from CLAUDE.md first paragraphs
- **Lifecycles** — state labels from constants, transition descriptions from trigger function names
- **Journeys** — already written in product language in the JSON files

If a label is wrong, fix it at the source (rename a constant, update a CLAUDE.md) — not in a sidecar file.

### GitHub App for cross-repo push

A GitHub App (not a PAT) handles the cross-repo push from nessi-web-app to nessi-docs. PATs expire and are tied to a personal account. A GitHub App installation token auto-refreshes and survives team changes.

**Setup (one-time):**
1. Create a GitHub App in the nessi-fishing-supply org (Settings → Developer settings → GitHub Apps)
2. Name: `nessi-docs-sync`
3. Permissions: `contents: write` on nessi-docs only
4. Install the app on the nessi-fishing-supply org, scoped to nessi-docs repo
5. Store the App ID and private key as secrets in nessi-web-app (`DOCS_SYNC_APP_ID`, `DOCS_SYNC_PRIVATE_KEY`)
6. The Action uses `actions/create-github-app-token` to generate a short-lived token per run

### Staleness safety net

The `_meta.json` file includes the extraction timestamp. nessi-docs displays a warning banner if data is older than 7 days. This catches silent Action failures before anyone relies on stale data.

### Language per section

| Section | Audience | Language |
|---------|----------|----------|
| API contracts | Engineers | Technical — paths, methods, status codes, auth |
| Data model | Engineers | Technical — columns, types, constraints, FK relationships |
| Entity relationships | Engineers | Technical — ERD nodes and edges |
| Permissions | Cross-functional | Mixed — role names are product, matrix is technical |
| Config / enums | Cross-functional | Product — uses existing `label` fields from constants |
| Features | Product / PM | Product — CLAUDE.md descriptions |
| Lifecycles | Cross-functional | Mixed — state names technical, transitions described in context |
| Journeys | Product | Product — labels and descriptions from journey JSON |
| Onboarding | Product | Product — step descriptions from auth CLAUDE.md |
| Roadmap | PM / Product | Product — kanban titles as written |
| Changelog | Engineering / PM | Hybrid — PR titles as written |

---

## Extraction Scripts — Detail

All scripts live in `nessi-web-app/scripts/docs-extract/` and output JSON to a temporary `_docs-output/` directory during the Action run.

### 1. extract-api-routes.ts → api-contracts.json

**Source:** `src/app/api/**/route.ts`
**Method:** File-system walk + regex parsing (not full AST — routes are consistent enough)

Extracts per route:
- **path** — derived from file location (e.g., `src/app/api/listings/[id]/route.ts` → `/api/listings/:id`)
- **methods** — which HTTP methods are exported (`GET`, `POST`, `PATCH`, `DELETE`)
- **label** — auto-generated: method verb + path noun (`POST /api/listings` → "Create Listing", `DELETE /api/cart/[id]` → "Remove Cart Item")
- **auth** — whether the route calls `createServerClient()` (user auth) or `createAdminClient()` (elevated)
- **permissions** — captures `requireShopPermission(req, feature, level)` calls
- **errorCodes** — regex for `NextResponse.json(... status: NNN)` patterns with associated error identifiers
- **group** — derived from first path segment after `/api/` (listings, shops, auth, cart, etc.)

**Label generation rules:**
- `GET` (no param) → "List {resource}" or "Get {resource}"
- `GET` (with `[id]`) → "Get {resource}"
- `POST` → "Create {resource}"
- `PATCH` → "Update {resource}"
- `DELETE` → "Delete {resource}"
- Resource name derived from path, title-cased, singularized

### 2. extract-database.ts → data-model.json, entity-relationships.json

**Source:** `src/types/database.ts` (Supabase-generated types)
**Method:** Parse the `Tables` type definition — each table has `Row`, `Insert`, `Update` with typed fields.

Extracts per table:
- **name** — table name
- **label** — title-cased, spaces for underscores (e.g., `cart_items` → "Cart Items")
- **columns** — array of `{ name, type, nullable, isPrimaryKey }`
- **badges** — auto-derived: "has RLS" (if referenced in migrations), "has triggers" (if trigger exists)

For entity-relationships.json:
- **nodes** — one per table with `{ id, label, x, y }` (positions auto-calculated in grid layout)
- **edges** — foreign key relationships parsed from:
  - Column names ending in `_id` cross-referenced with table names
  - Explicit `REFERENCES` clauses in migration SQL files

### 3. extract-permissions.ts → permissions.json

**Source:** `src/features/shops/types/permissions.ts` + `src/features/shops/constants/roles.ts`
**Method:** Regex extraction of the `ShopPermissionFeature`, `ShopPermissionLevel` types, and `SYSTEM_ROLES` constant.

Extracts:
- **features** — permission feature names with auto-labels (e.g., `shop_settings` → "Shop Settings")
- **levels** — full, view, none
- **roles** — array of `{ name, slug, permissions: Record<feature, level> }`

### 4. extract-config.ts → config-reference.json

**Source:** `src/features/*/constants/*.ts` + `src/features/*/config/*.ts`
**Method:** Parse files exporting arrays of `{ value, label }` objects or `as const` objects.

Extracts per config:
- **name** — derived from filename + parent feature (e.g., `listings/constants/category.ts` → "Listing Categories")
- **feature** — parent feature directory
- **values** — array of `{ value, label, description?, color?, icon? }` — uses existing label fields

### 5. extract-features.ts → features.json

**Source:** `src/features/*/` directory structure + `src/features/*/CLAUDE.md`
**Method:** Directory scan for feature folders. Parse each CLAUDE.md for description. Count files by type.

Extracts per feature:
- **name** — title-cased from directory name (e.g., `recently-viewed` → "Recently Viewed")
- **slug** — directory name
- **description** — first paragraph from CLAUDE.md (strip markdown formatting)
- **stats** — `{ components, hooks, services, apiRoutes, types }` from file counts
- **status** — cross-referenced with kanban board items tagged with this feature name

### 6. extract-lifecycles.ts → lifecycles.json

**Source:** Status/state constants in `src/features/*/constants/*.ts` + migration trigger functions
**Method:** Scan for exported objects/arrays whose keys or names contain "status" or "state". Parse migration files for trigger functions with transition logic.

Extracts per lifecycle:
- **entity** — what has the lifecycle (listing, shop-invite, cart-item, member, ownership-transfer)
- **states** — array of `{ value, label }` from the constants (labels already exist in most constants)
- **transitions** — array of `{ from, to, trigger }` parsed from migration trigger SQL or inferred from constants ordering

### 7. extract-journeys.ts → journeys.json

**Source:** `docs/journeys/*.json`
**Method:** Read JSON files, validate against `docs/journeys/schema.json`, transform from flows/steps format to nodes/edges format for the canvas renderer.

The transformation:
- Each step becomes a **node** with `{ id, type, label, layer, status, x, y }` — x/y coordinates auto-calculated using a top-down flow layout algorithm
- Each step-to-step sequence becomes an **edge** `{ from, to }`
- Branch decision points become **decision nodes** with options
- Entry points become **entry nodes**
- `persona`, `title`, `description`, `relatedIssues` preserved from the source

### 8. extract-onboarding.ts → onboarding.json

**Source:** `src/features/auth/CLAUDE.md` + `src/app/(frontend)/` route structure for onboarding paths
**Method:** Parse auth CLAUDE.md for onboarding flow section. Scan for onboarding-related page routes.

Extracts:
- **steps** — ordered onboarding actions with labels from CLAUDE.md
- **sellerPreconditions** — requirements before a user can sell, from CLAUDE.md or auth constants

### 9. fetch-kanban.ts → roadmap.json

**Source:** GitHub Projects v2 GraphQL API — project #2 in nessi-fishing-supply org
**Method:** Paginated fetch of all items (current count: 191). Uses `GITHUB_TOKEN` for the current repo or App token if needed.

Extracts per item:
- **title** — issue/PR title
- **number** — issue/PR number
- **url** — GitHub issue/PR URL
- **status** — Pre-Launch, Todo, In Progress, Blocked, Ready for Review, Done
- **priority** — P0-critical through P3-low
- **area** — Frontend, Backend, Database, Full-stack, Infra
- **executor** — Conductor, Manual
- **feature** — free text feature tag
- **labels** — array of label names
- **state** — OPEN/CLOSED
- **linkedPRs** — associated pull request numbers

**Pagination:** Uses cursor-based pagination, fetches in batches of 100.

### 10. fetch-changelog.ts → changelog.json

**Source:** GitHub REST API — merged PRs to `main` in nessi-web-app
**Method:** Fetch all merged PRs (paginated). Categorize by labels.

Extracts per entry:
- **title** — PR title
- **number** — PR number
- **url** — GitHub PR URL
- **mergedAt** — ISO date
- **author** — GitHub username
- **labels** — array of label names
- **area** — derived from labels (frontend, backend, database, full-stack, infra)
- **type** — derived from labels or PR title prefix (feat, fix, chore, refactor, docs)

---

## nessi-docs Consumption

### Directory structure change

```
src/data/
├── generated/           ← NEW: auto-generated JSON from pipeline
│   ├── api-contracts.json
│   ├── data-model.json
│   ├── entity-relationships.json
│   ├── permissions.json
│   ├── config-reference.json
│   ├── features.json
│   ├── lifecycles.json
│   ├── journeys.json
│   ├── onboarding.json
│   ├── roadmap.json
│   ├── changelog.json
│   └── _meta.json       ← extraction timestamp, commit SHA, item counts
├── index.ts             ← UPDATED: reads from generated/ JSON, maps to existing types
└── (old hardcoded .ts files removed after validation)
```

### Adapter layer

`src/data/index.ts` imports the JSON and maps it to the existing TypeScript types the UI expects. This means the UI components don't change at all — they still consume the same types from `@/data`.

```typescript
// src/data/index.ts (after migration)
import apiContractsRaw from './generated/api-contracts.json';
import type { ApiGroup } from '@/types/api-contract';

export const apiGroups: ApiGroup[] = apiContractsRaw.groups;
// ... same exports as today, backed by JSON instead of hardcoded data
```

### _meta.json

```json
{
  "extractedAt": "2026-03-25T14:30:00Z",
  "sourceCommit": "abc123f",
  "sourceRepo": "nessi-fishing-supply/Nessi-Web-App",
  "scriptVersion": "1.0.0",
  "itemCounts": {
    "apiRoutes": 48,
    "tables": 14,
    "features": 12,
    "kanbanItems": 191,
    "journeys": 6,
    "changelog": 25
  }
}
```

Powers a "Last synced" indicator in the UI. If `extractedAt` is older than 7 days, a yellow warning banner appears.

---

## GitHub Action Workflow

**File:** `nessi-web-app/.github/workflows/sync-docs.yml`

```yaml
name: Sync Docs Data

on:
  push:
    branches: [main]
  workflow_dispatch:  # manual trigger for ad-hoc runs

jobs:
  extract-and-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # full history for changelog

      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      # Generate GitHub App token for cross-repo push
      - name: Generate token
        id: app-token
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ secrets.DOCS_SYNC_APP_ID }}
          private-key: ${{ secrets.DOCS_SYNC_PRIVATE_KEY }}
          repositories: nessi-docs

      # Run all extraction scripts
      - name: Extract docs data
        run: pnpm tsx scripts/docs-extract/run-all.ts
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SOURCE_COMMIT: ${{ github.sha }}

      # Validate output
      - name: Validate generated JSON
        run: pnpm tsx scripts/docs-extract/validate.ts

      # Push to nessi-docs
      - name: Checkout nessi-docs
        uses: actions/checkout@v4
        with:
          repository: nessi-fishing-supply/nessi-docs
          path: nessi-docs
          token: ${{ steps.app-token.outputs.token }}

      - name: Copy and commit
        run: |
          cp -r _docs-output/* nessi-docs/src/data/generated/
          cd nessi-docs
          git config user.name "nessi-docs-sync[bot]"
          git config user.email "nessi-docs-sync[bot]@users.noreply.github.com"
          git add src/data/generated/
          git diff --staged --quiet && echo "No changes to sync" && exit 0
          git commit -m "data: sync from nessi-web-app@${GITHUB_SHA::7}"
          git push
```

### GitHub App setup (one-time)

1. Go to nessi-fishing-supply org → Settings → Developer settings → GitHub Apps → New GitHub App
2. Name: `nessi-docs-sync`
3. Homepage URL: `https://github.com/nessi-fishing-supply/nessi-docs` (any URL, required field)
4. Uncheck Webhook (not needed)
5. Repository permissions: **Contents → Read and write**
6. Where can this app be installed: **Only on this account**
7. Create the app, note the **App ID**
8. Generate a **private key** (downloads a .pem file)
9. Install the app: Settings → GitHub Apps → nessi-docs-sync → Install → select **nessi-docs** repo only
10. In nessi-web-app repo → Settings → Secrets → Actions:
    - `DOCS_SYNC_APP_ID` = the App ID from step 7
    - `DOCS_SYNC_PRIVATE_KEY` = contents of the .pem file from step 8

---

## Validation

The `validate.ts` script runs after extraction and before push. It checks:

1. **Presence** — all 11 expected JSON files exist in `_docs-output/`
2. **Parse** — each file is valid JSON
3. **Schema** — each file matches its expected shape (using zod schemas that mirror the TypeScript types)
4. **Non-empty** — every array has at least 1 item (catches broken extraction that produces empty arrays)
5. **Regression** — if a previous `_meta.json` exists in nessi-docs, warn if any count drops by >20%

If any check fails, the Action exits with code 1 and nessi-docs is not updated.

---

## What stays manual

- **Journey authoring** — new journeys are still written as JSON in `nessi-web-app/docs/journeys/`. The pipeline transforms and syncs them automatically, but doesn't invent new journeys.
- **CLAUDE.md maintenance** — feature descriptions come from these files. Keep them accurate as you build features (you're likely doing this anyway for Claude Code).

Everything else is fully automated. No metadata files to maintain, no manual syncing, no manual deploys.

---

## Rollout Plan

### Phase 1: Extraction scripts + local validation
- Build all extraction scripts in `nessi-web-app/scripts/docs-extract/`
- Add `tsx` as a dev dependency for running TypeScript scripts
- Run locally against the codebase, compare output against current hardcoded data in nessi-docs
- Fix gaps and tune extraction logic until output matches or improves on current data

### Phase 2: GitHub Action + cross-repo push
- Create the `nessi-docs-sync` GitHub App (one-time setup, ~5 minutes)
- Add `sync-docs.yml` workflow to nessi-web-app
- Store App ID + private key as repo secrets
- Run via `workflow_dispatch`, verify nessi-docs receives correct JSON

### Phase 3: nessi-docs migration
- Create `src/data/generated/` directory with `.gitkeep`
- Update `src/data/index.ts` to import from generated JSON files
- Add adapter mappings where JSON shape differs from existing TypeScript types
- Remove old hardcoded `.ts` data files
- Verify UI renders identically by comparing before/after

### Phase 4: Polish
- Add staleness banner component (reads `_meta.json`, warns if >7 days old)
- Add "Last synced" indicator to sidebar or footer
- Add `src/data/generated/` to nessi-docs `.gitignore` exceptions (tracked, not ignored)
- Remove old journey JSON files from nessi-docs root
