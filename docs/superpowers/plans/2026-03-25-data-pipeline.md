# Data Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build extraction scripts that parse nessi-web-app and output structured JSON, a GitHub Action that runs them on merge to main, and an adapter layer in nessi-docs that consumes the generated data.

**Architecture:** TypeScript extraction scripts in `nessi-web-app/scripts/docs-extract/` parse source files via regex/fs, output JSON to `_docs-output/`. A GitHub Action orchestrates extraction, validation, and cross-repo push. nessi-docs imports the JSON via an adapter in `src/data/index.ts`.

**Tech Stack:** TypeScript, Node.js fs/path, GitHub Actions, GitHub GraphQL API (for kanban), GitHub REST API (for changelog)

**Repos:**

- `WEB` = `/Users/kyleholloway/Documents/Development/nessi-web-app`
- `DOCS` = `/Users/kyleholloway/Documents/Development/nessi-docs`

---

## Task 1: Shared Utilities

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/utils/fs.ts`
- Create: `scripts/docs-extract/utils/labels.ts`
- Create: `scripts/docs-extract/utils/output.ts`
- Create: `scripts/docs-extract/types.ts`

- [ ] **Step 1: Create the scripts directory and types file**

```bash
mkdir -p scripts/docs-extract/utils
```

Create `scripts/docs-extract/types.ts` with all shared output types: ApiEndpoint, ApiGroup, EntityField, Entity, ErdNode, ErdEdge, Role, ConfigValue, ConfigEnum, Feature, LifecycleState, LifecycleTransition, Lifecycle, JourneyNode, JourneyEdge, Journey, OnboardingStep, SellerPrecondition, RoadmapItem, ChangelogEntry, ExtractionMeta.

```typescript
export interface ApiEndpoint {
  method: string;
  path: string;
  label: string;
  auth: 'user' | 'admin' | 'none';
  permissions?: { feature: string; level: string };
  errorCodes: number[];
}

export interface ApiGroup {
  name: string;
  endpoints: ApiEndpoint[];
}

export interface EntityField {
  name: string;
  type: string;
  nullable: boolean;
}

export interface Entity {
  name: string;
  label: string;
  fields: EntityField[];
  badges: string[];
}

export interface ErdNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface ErdEdge {
  from: string;
  to: string;
  label: string;
}

export interface Role {
  slug: string;
  name: string;
  description: string;
  color: string;
  permissions: Record<string, string>;
}

export interface ConfigValue {
  value: string;
  label: string;
  description?: string;
  color?: string;
}

export interface ConfigEnum {
  slug: string;
  name: string;
  description: string;
  source: string;
  values: ConfigValue[];
}

export interface Feature {
  slug: string;
  name: string;
  description: string;
  status: string;
  componentCount: number;
  endpointCount: number;
  hookCount: number;
  serviceCount: number;
}

export interface LifecycleState {
  id: string;
  label: string;
}

export interface LifecycleTransition {
  from: string;
  to: string;
  label: string;
}

export interface Lifecycle {
  slug: string;
  name: string;
  description: string;
  states: LifecycleState[];
  transitions: LifecycleTransition[];
}

export interface JourneyNode {
  id: string;
  type: 'entry' | 'step' | 'decision';
  label: string;
  x: number;
  y: number;
  layer?: string;
  status?: string;
  route?: string;
  codeRef?: string;
  notes?: string;
  why?: string;
  errorCases?: { condition: string; result: string; httpStatus?: number }[];
  options?: { label: string; to: string }[];
}

export interface JourneyEdge {
  from: string;
  to: string;
  opt?: string;
}

export interface Journey {
  slug: string;
  title: string;
  persona: string;
  description: string;
  relatedIssues?: number[];
  nodes: JourneyNode[];
  edges: JourneyEdge[];
}

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  field: string;
}

export interface SellerPrecondition {
  id: string;
  label: string;
  description: string;
}

export interface RoadmapItem {
  title: string;
  number: number;
  url: string;
  status: string;
  priority: string;
  area: string;
  executor: string;
  feature: string;
  labels: string[];
  state: string;
}

export interface ChangelogEntry {
  title: string;
  number: number;
  url: string;
  mergedAt: string;
  author: string;
  labels: string[];
  area: string;
  type: string;
}

export interface ExtractionMeta {
  extractedAt: string;
  sourceCommit: string;
  sourceRepo: string;
  scriptVersion: string;
  itemCounts: Record<string, number>;
}
```

- [ ] **Step 2: Create fs utilities**

Create `scripts/docs-extract/utils/fs.ts`:

```typescript
import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname, '..', '..', '..');

export function root(...segments: string[]): string {
  return join(ROOT, ...segments);
}

export function readFile(...segments: string[]): string {
  return readFileSync(root(...segments), 'utf-8');
}

export function walkFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  const fullDir = root(dir);

  function walk(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (pattern.test(entry.name)) {
        results.push(relative(ROOT, full));
      }
    }
  }

  walk(fullDir);
  return results.sort();
}

export function listDirs(dir: string): string[] {
  const fullDir = root(dir);
  return readdirSync(fullDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}
```

- [ ] **Step 3: Create label utilities**

Create `scripts/docs-extract/utils/labels.ts`:

```typescript
export function titleCase(str: string): string {
  return str.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function singularize(word: string): string {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('ses')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

export function endpointLabel(method: string, path: string): string {
  const segments = path
    .replace(/^\/api\//, '')
    .split('/')
    .filter(Boolean);
  const hasIdParam = segments.some((s) => s.startsWith('['));
  const resourceSegments = segments.filter((s) => !s.startsWith('['));
  const resource = resourceSegments[resourceSegments.length - 1] || 'Resource';
  const lastSegment = segments[segments.length - 1];
  const isSubAction = !lastSegment.startsWith('[') && resourceSegments.length > 1;
  const resourceLabel = titleCase(singularize(resource));

  if (isSubAction && method !== 'GET') {
    const action = titleCase(lastSegment);
    const parentResource = titleCase(
      singularize(resourceSegments[resourceSegments.length - 2] || ''),
    );
    return `${action} ${parentResource}`;
  }

  const verbs: Record<string, string> = {
    GET: hasIdParam ? 'Get' : 'List',
    POST: 'Create',
    PATCH: 'Update',
    PUT: 'Update',
    DELETE: 'Delete',
  };

  return `${verbs[method] || method} ${resourceLabel}`;
}

export function apiGroup(path: string): string {
  const segments = path.replace(/^\/api\//, '').split('/');
  return segments[0] || 'other';
}
```

- [ ] **Step 4: Create output utility**

Create `scripts/docs-extract/utils/output.ts`:

```typescript
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = join(import.meta.dirname, '..', '..', '..', '_docs-output');

export function ensureOutputDir(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

export function writeJson(filename: string, data: unknown): void {
  ensureOutputDir();
  const path = join(OUTPUT_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓ ${filename} (${JSON.stringify(data).length} bytes)`);
}
```

- [ ] **Step 5: Verify tsx is available**

Run: `pnpm tsx --version`

If not installed: `pnpm add -D tsx`

- [ ] **Step 6: Commit**

```bash
git add scripts/docs-extract/
git commit -m "feat(docs-extract): add shared utilities and types"
```

---

## Task 2: Extract API Routes

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/extract-api-routes.ts`

- [ ] **Step 1: Write the extractor**

Create `scripts/docs-extract/extract-api-routes.ts`. Logic:

- Walk `src/app/api/**/route.ts` files
- For each file, derive the API path from its filesystem location (`src/app/api/listings/[id]/route.ts` → `/api/listings/:id`)
- Detect exported HTTP methods via regex: `export (async )?function (GET|POST|PATCH|DELETE)`
- Detect auth by checking for `createServerClient` (user) or `createAdminClient` (admin)
- Detect permissions via `requireShopPermission(req, 'feature', 'level')` regex
- Detect error codes via `status: NNN` regex (400+)
- Generate labels using `endpointLabel()` utility
- Group by first path segment after `/api/`

```typescript
import { walkFiles, readFile } from './utils/fs.js';
import { endpointLabel, apiGroup, titleCase } from './utils/labels.js';
import { writeJson } from './utils/output.js';
import type { ApiEndpoint, ApiGroup } from './types.js';

const HTTP_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const;

function filePathToApiPath(filePath: string): string {
  return filePath
    .replace(/^src\/app/, '')
    .replace(/\/route\.ts$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1');
}

function detectAuth(content: string): 'user' | 'admin' | 'none' {
  if (content.includes('createAdminClient')) return 'admin';
  if (content.includes('createServerClient')) return 'user';
  return 'none';
}

function detectPermissions(content: string): { feature: string; level: string } | undefined {
  const match = content.match(/requireShopPermission\([^,]+,\s*'(\w+)',\s*'(\w+)'\)/);
  if (match) return { feature: match[1], level: match[2] };
  return undefined;
}

function detectErrorCodes(content: string): number[] {
  const codes = new Set<number>();
  const regex = /status:\s*(\d{3})/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const code = parseInt(match[1], 10);
    if (code >= 400) codes.add(code);
  }
  return [...codes].sort();
}

function detectMethods(content: string): string[] {
  return HTTP_METHODS.filter((m) => {
    const pattern = new RegExp(
      `export\\s+(async\\s+)?function\\s+${m}\\b|export\\s+const\\s+${m}\\b`,
    );
    return pattern.test(content);
  });
}

export function extractApiRoutes(): ApiGroup[] {
  const routeFiles = walkFiles('src/app/api', /^route\.ts$/);
  const endpointsByGroup = new Map<string, ApiEndpoint[]>();

  for (const file of routeFiles) {
    const content = readFile(file);
    const apiPath = filePathToApiPath(file);
    const methods = detectMethods(content);
    const auth = detectAuth(content);
    const permissions = detectPermissions(content);
    const errorCodes = detectErrorCodes(content);
    const group = apiGroup(apiPath);

    for (const method of methods) {
      const endpoint: ApiEndpoint = {
        method,
        path: apiPath,
        label: endpointLabel(method, apiPath),
        auth,
        errorCodes,
      };
      if (permissions) endpoint.permissions = permissions;

      if (!endpointsByGroup.has(group)) endpointsByGroup.set(group, []);
      endpointsByGroup.get(group)!.push(endpoint);
    }
  }

  return [...endpointsByGroup.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, endpoints]) => ({
      name: titleCase(name),
      endpoints: endpoints.sort(
        (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
      ),
    }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Extracting API routes...');
  const groups = extractApiRoutes();
  const total = groups.reduce((sum, g) => sum + g.endpoints.length, 0);
  writeJson('api-contracts.json', { groups });
  console.log(`  Found ${total} endpoints in ${groups.length} groups`);
}
```

- [ ] **Step 2: Run and verify**

Run: `pnpm tsx scripts/docs-extract/extract-api-routes.ts`
Then: `cat _docs-output/api-contracts.json | head -40`

Expected: JSON with groups array, ~48+ endpoints across ~10 groups.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/extract-api-routes.ts
git commit -m "feat(docs-extract): add API route extractor"
```

---

## Task 3: Extract Database Schema

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/extract-database.ts`

- [ ] **Step 1: Write the extractor**

Parses `src/types/database.ts` for the `Tables` type. Each table has `Row` with typed fields. Also scans migration SQL for RLS policies and triggers for badges. Builds ERD from `_id` foreign key columns.

```typescript
import { readFile, walkFiles } from './utils/fs.js';
import { titleCase } from './utils/labels.js';
import { writeJson } from './utils/output.js';
import type { Entity, EntityField, ErdNode, ErdEdge } from './types.js';

function parseTablesFromDatabaseTs(): Entity[] {
  const content = readFile('src/types/database.ts');
  const entities: Entity[] = [];
  const tableRegex = /(\w+):\s*\{\s*Row:\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const rowBlock = match[2];
    const fields: EntityField[] = [];
    const fieldRegex = /(\w+):\s*([^;\n]+)/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRegex.exec(rowBlock)) !== null) {
      const name = fieldMatch[1];
      let type = fieldMatch[2].trim();
      const nullable = type.includes('| null');
      type = type.replace(/\s*\|\s*null/, '').trim();
      fields.push({ name, type, nullable });
    }

    entities.push({ name: tableName, label: titleCase(tableName), fields, badges: [] });
  }

  return entities;
}

function detectBadgesFromMigrations(entities: Entity[]): void {
  const migrationFiles = walkFiles('supabase/migrations', /\.sql$/);
  const allSql = migrationFiles.map((f) => readFile(f)).join('\n');

  for (const entity of entities) {
    if (
      allSql.includes(`ENABLE ROW LEVEL SECURITY`) &&
      new RegExp(`ON\\s+(public\\.)?${entity.name}`, 'i').test(allSql)
    ) {
      entity.badges.push('RLS');
    }
    if (
      new RegExp(`CREATE TRIGGER\\s+\\w+[\\s\\S]*?ON\\s+(public\\.)?${entity.name}\\b`, 'i').test(
        allSql,
      )
    ) {
      entity.badges.push('Triggers');
    }
  }
}

function buildErd(entities: Entity[]): { nodes: ErdNode[]; edges: ErdEdge[] } {
  const tableNames = new Set(entities.map((e) => e.name));
  const nodes: ErdNode[] = [];
  const edges: ErdEdge[] = [];
  const cols = 3;

  entities.forEach((entity, i) => {
    nodes.push({
      id: entity.name,
      label: entity.label,
      x: (i % cols) * 280 + 40,
      y: Math.floor(i / cols) * 160 + 40,
    });

    for (const field of entity.fields) {
      if (field.name.endsWith('_id') && field.name !== 'id') {
        const refTable = field.name.replace(/_id$/, '');
        const candidates = [refTable, refTable + 's', refTable + 'es'];
        const found = candidates.find((c) => tableNames.has(c));
        if (found) {
          edges.push({ from: entity.name, to: found, label: field.name });
        }
      }
    }
  });

  return { nodes, edges };
}

export function extractDatabase() {
  const entities = parseTablesFromDatabaseTs();
  detectBadgesFromMigrations(entities);
  const erd = buildErd(entities);
  return { entities, erd };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Extracting database schema...');
  const { entities, erd } = extractDatabase();
  writeJson('data-model.json', { entities });
  writeJson('entity-relationships.json', erd);
  console.log(`  Found ${entities.length} tables, ${erd.edges.length} relationships`);
}
```

- [ ] **Step 2: Run and verify**

Run: `pnpm tsx scripts/docs-extract/extract-database.ts`
Expected: 10+ tables with fields, badges, and ERD edges.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/extract-database.ts
git commit -m "feat(docs-extract): add database schema extractor"
```

---

## Task 4: Extract Permissions

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/extract-permissions.ts`

- [ ] **Step 1: Write the extractor**

Parses `src/features/shops/types/permissions.ts` for `ShopPermissionFeature` union type, and `src/features/shops/constants/roles.ts` for role slugs. Permission matrices are derived from the migration seed data (known values: owner=all full, manager=mixed, contributor=listings only).

```typescript
import { readFile } from './utils/fs.js';
import { titleCase } from './utils/labels.js';
import { writeJson } from './utils/output.js';
import type { Role } from './types.js';

function parsePermissionFeatures(): string[] {
  const content = readFile('src/features/shops/types/permissions.ts');
  const match = content.match(/ShopPermissionFeature\s*=\s*([\s\S]*?);/);
  if (!match) return [];
  const features: string[] = [];
  const re = /'(\w+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(match[1])) !== null) features.push(m[1]);
  return features;
}

function parseRoles(features: string[]): Role[] {
  const rolesContent = readFile('src/features/shops/constants/roles.ts');
  const slugMatch = rolesContent.match(/SYSTEM_ROLE_SLUGS\s*=\s*\{([\s\S]*?)\}/);
  const slugs: string[] = [];
  if (slugMatch) {
    const re = /(\w+):\s*'(\w+)'/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(slugMatch[1])) !== null) slugs.push(m[2]);
  }

  const permissionMatrices: Record<string, Record<string, string>> = {
    owner: Object.fromEntries(features.map((f) => [f, 'full'])),
    manager: {
      listings: 'full',
      pricing: 'full',
      orders: 'full',
      messaging: 'full',
      shop_settings: 'view',
      members: 'none',
    },
    contributor: {
      listings: 'full',
      pricing: 'none',
      orders: 'none',
      messaging: 'none',
      shop_settings: 'none',
      members: 'none',
    },
  };

  const colors: Record<string, string> = {
    owner: '#e27739',
    manager: '#b86e0a',
    contributor: '#78756f',
  };
  const descs: Record<string, string> = {
    owner: 'Full access to all shop features and settings',
    manager: 'Operational access to listings, pricing, orders, and messaging',
    contributor: 'Can create and edit listings only',
  };

  return slugs.map((slug) => ({
    slug,
    name: titleCase(slug),
    description: descs[slug] || '',
    color: colors[slug] || '#78756f',
    permissions: permissionMatrices[slug] || Object.fromEntries(features.map((f) => [f, 'none'])),
  }));
}

export function extractPermissions() {
  const features = parsePermissionFeatures();
  const roles = parseRoles(features);
  return { features, roles };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Extracting permissions...');
  const data = extractPermissions();
  writeJson('permissions.json', data);
  console.log(`  Found ${data.features.length} features, ${data.roles.length} roles`);
}
```

- [ ] **Step 2: Run and verify**

Run: `pnpm tsx scripts/docs-extract/extract-permissions.ts`
Expected: 6 features, 3 roles with full permission matrices.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/extract-permissions.ts
git commit -m "feat(docs-extract): add permissions extractor"
```

---

## Task 5: Extract Config / Enums

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/extract-config.ts`

- [ ] **Step 1: Write the extractor**

Walks `src/features/*/constants/*.ts` and `src/features/*/config/*.ts`. Parses files for arrays of `{ value, label }` objects or `Record<Type, string>` label maps. Outputs config enums with slug, name, source path, and values.

```typescript
import { walkFiles, readFile } from './utils/fs.js';
import { titleCase } from './utils/labels.js';
import { writeJson } from './utils/output.js';
import type { ConfigEnum, ConfigValue } from './types.js';

function extractValuesFromContent(content: string): ConfigValue[] | null {
  const values: ConfigValue[] = [];

  // Pattern 1: { value: 'x', label: 'X', ... }
  const objRegex =
    /\{\s*value:\s*'([^']+)',\s*label:\s*'([^']+)'(?:,\s*(?:shortLabel|description):\s*'([^']*)')?[^}]*\}/g;
  let match: RegExpExecArray | null;
  while ((match = objRegex.exec(content)) !== null) {
    const val: ConfigValue = { value: match[1], label: match[2] };
    if (match[3]) val.description = match[3];
    values.push(val);
  }
  if (values.length > 0) return values;

  // Pattern 2: Record<EnumType, string> = { key: 'Label', ... }
  const recordRegex = /:\s*Record<[^,]+,\s*string>\s*=\s*\{([\s\S]*?)\}/g;
  while ((match = recordRegex.exec(content)) !== null) {
    const entryRegex = /(\w+):\s*'([^']+)'/g;
    let entryMatch: RegExpExecArray | null;
    while ((entryMatch = entryRegex.exec(match[1])) !== null) {
      values.push({ value: entryMatch[1], label: entryMatch[2] });
    }
  }
  if (values.length > 0) return values;

  return null;
}

export function extractConfig(): ConfigEnum[] {
  const files = walkFiles('src/features', /\.ts$/).filter(
    (f) => (f.includes('/constants/') || f.includes('/config/')) && !f.includes('.test.'),
  );

  const configs: ConfigEnum[] = [];

  for (const filePath of files) {
    const parts = filePath.split('/');
    const featureIdx = parts.indexOf('features') + 1;
    const feature = parts[featureIdx] || 'unknown';
    const fileName = parts[parts.length - 1].replace(/\.ts$/, '');
    if (fileName === 'index') continue;

    const content = readFile(filePath);
    const values = extractValuesFromContent(content);
    if (!values || values.length === 0) continue;

    configs.push({
      slug: `${feature}-${fileName}`,
      name: `${titleCase(feature)} ${titleCase(fileName)}`,
      description: `${titleCase(fileName)} options for ${titleCase(feature)}`,
      source: filePath,
      values,
    });
  }

  return configs.sort((a, b) => a.slug.localeCompare(b.slug));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Extracting config/enums...');
  const configs = extractConfig();
  writeJson('config-reference.json', { configs });
  console.log(`  Found ${configs.length} config enums`);
}
```

- [ ] **Step 2: Run and verify**

Run: `pnpm tsx scripts/docs-extract/extract-config.ts`
Expected: configs array with Listings Category (10 values), Listings Condition (6), Listings Status (6), etc.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/extract-config.ts
git commit -m "feat(docs-extract): add config/enum extractor"
```

---

## Task 6: Extract Features

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/extract-features.ts`

- [ ] **Step 1: Write the extractor**

Scans `src/features/*/` directories. Reads each feature's CLAUDE.md for description (first paragraph after heading). Counts components, hooks, services by walking subdirectories. Counts API routes matching the feature name.

```typescript
import { existsSync } from 'fs';
import { listDirs, readFile, walkFiles, root } from './utils/fs.js';
import { titleCase } from './utils/labels.js';
import { writeJson } from './utils/output.js';
import type { Feature } from './types.js';

function getDescription(slug: string): string {
  try {
    const content = readFile(`src/features/${slug}/CLAUDE.md`);
    const lines = content.split('\n');
    let foundHeading = false;
    const para: string[] = [];
    for (const line of lines) {
      if (line.startsWith('#')) {
        if (foundHeading && para.length > 0) break;
        foundHeading = true;
        continue;
      }
      if (!foundHeading) continue;
      if (line.trim() === '' && para.length > 0) break;
      if (line.trim() === '') continue;
      if (line.startsWith('-') || line.startsWith('|')) break;
      para.push(line.trim());
    }
    return para.join(' ').replace(/\*\*/g, '').replace(/`/g, '') || `${titleCase(slug)} feature`;
  } catch {
    return `${titleCase(slug)} feature`;
  }
}

function countFiles(slug: string, subdir: string, pattern: RegExp): number {
  const dir = `src/features/${slug}/${subdir}`;
  if (!existsSync(root(dir))) return 0;
  return walkFiles(dir, pattern).length;
}

export function extractFeatures(): Feature[] {
  const allRoutes = walkFiles('src/app/api', /^route\.ts$/);
  return listDirs('src/features').map((slug) => ({
    slug,
    name: titleCase(slug),
    description: getDescription(slug),
    status: 'built',
    componentCount: countFiles(slug, 'components', /\.tsx$/),
    endpointCount: allRoutes.filter((r) => r.includes(`/api/${slug}/`)).length,
    hookCount: countFiles(slug, 'hooks', /\.ts$/),
    serviceCount: countFiles(slug, 'services', /\.ts$/),
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Extracting features...');
  const features = extractFeatures();
  writeJson('features.json', { features });
  console.log(`  Found ${features.length} features`);
}
```

- [ ] **Step 2: Run and verify**

Run: `pnpm tsx scripts/docs-extract/extract-features.ts`
Expected: ~12-15 features with descriptions from CLAUDE.md and file counts.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/extract-features.ts
git commit -m "feat(docs-extract): add feature extractor"
```

---

## Task 7: Extract Lifecycles

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/extract-lifecycles.ts`

- [ ] **Step 1: Write the extractor**

Scans constants files for `_STATUS_LABELS: Record<Type, string>` patterns. Extracts state values and labels. Infers transitions from known patterns (listing lifecycle has defined transitions; others use linear progression).

```typescript
import { walkFiles, readFile } from './utils/fs.js';
import { titleCase } from './utils/labels.js';
import { writeJson } from './utils/output.js';
import type { Lifecycle, LifecycleState, LifecycleTransition } from './types.js';

function inferTransitions(states: LifecycleState[], entityName: string): LifecycleTransition[] {
  const known: Record<string, [string, string, string][]> = {
    listing: [
      ['draft', 'active', 'Publish'],
      ['active', 'sold', 'Mark as sold'],
      ['active', 'archived', 'Deactivate'],
      ['draft', 'deleted', 'Delete draft'],
      ['active', 'reserved', 'Reserve'],
      ['reserved', 'sold', 'Complete sale'],
    ],
  };
  if (known[entityName]) {
    return known[entityName]
      .filter(([from, to]) => states.some((s) => s.id === from) && states.some((s) => s.id === to))
      .map(([from, to, label]) => ({ from, to, label }));
  }
  const transitions: LifecycleTransition[] = [];
  for (let i = 0; i < states.length - 1; i++) {
    transitions.push({
      from: states[i].id,
      to: states[i + 1].id,
      label: `→ ${states[i + 1].label}`,
    });
  }
  return transitions;
}

export function extractLifecycles(): Lifecycle[] {
  const files = walkFiles('src/features', /\.ts$/).filter((f) => f.includes('/constants/'));
  const lifecycles: Lifecycle[] = [];

  for (const file of files) {
    const content = readFile(file);
    const recordRegex = /(\w+)_STATUS_LABELS\s*:\s*Record<(\w+),\s*string>\s*=\s*\{([\s\S]*?)\}/g;
    let match: RegExpExecArray | null;

    while ((match = recordRegex.exec(content)) !== null) {
      const constName = match[1].toLowerCase();
      const body = match[3];
      const states: LifecycleState[] = [];
      const entryRegex = /(\w+):\s*'([^']+)'/g;
      let entryMatch: RegExpExecArray | null;
      while ((entryMatch = entryRegex.exec(body)) !== null) {
        states.push({ id: entryMatch[1], label: entryMatch[2] });
      }
      if (states.length === 0) continue;

      const parts = file.split('/');
      const feature = parts[parts.indexOf('features') + 1] || constName;
      lifecycles.push({
        slug: constName.replace(/_/g, '-'),
        name: titleCase(constName),
        description: `Status lifecycle for ${titleCase(feature)}`,
        states,
        transitions: inferTransitions(states, constName),
      });
    }
  }

  return lifecycles;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Extracting lifecycles...');
  const lifecycles = extractLifecycles();
  writeJson('lifecycles.json', { lifecycles });
  console.log(`  Found ${lifecycles.length} lifecycles`);
}
```

- [ ] **Step 2: Run and verify**

Run: `pnpm tsx scripts/docs-extract/extract-lifecycles.ts`
Expected: At least listing lifecycle with 6 states and transitions.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/extract-lifecycles.ts
git commit -m "feat(docs-extract): add lifecycle extractor"
```

---

## Task 8: Extract Journeys

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/extract-journeys.ts`

- [ ] **Step 1: Write the extractor**

Reads JSON files from `docs/journeys/` (excluding schema.json). Transforms from flows/steps/branches format to nodes/edges format for the canvas renderer. Auto-calculates x/y coordinates using a top-down flow layout.

```typescript
import { readdirSync } from 'fs';
import { readFile, root } from './utils/fs.js';
import { writeJson } from './utils/output.js';
import type { Journey, JourneyNode, JourneyEdge } from './types.js';

const NODE_SPACING_Y = 120;
const FLOW_GAP_Y = 80;
const NODE_SPACING_X = 240;

interface SourceFlow {
  id: string;
  title: string;
  trigger: string;
  steps: {
    id: string;
    label: string;
    layer: string;
    status?: string;
    route?: string;
    codeRef?: string;
    notes?: string;
    why?: string;
    errorCases?: { condition: string; result: string; httpStatus?: number }[];
  }[];
  branches?: { afterStep: string; condition: string; paths: { label: string; goTo: string }[] }[];
  connections?: { from: string; to: string; label?: string }[];
}

interface SourceJourney {
  slug: string;
  title: string;
  persona: string;
  description: string;
  relatedIssues?: number[];
  flows: SourceFlow[];
}

function transformJourney(source: SourceJourney): Journey {
  const nodes: JourneyNode[] = [];
  const edges: JourneyEdge[] = [];
  let currentY = 40;

  for (const flow of source.flows) {
    const entryId = `${flow.id}-entry`;
    nodes.push({ id: entryId, type: 'entry', label: flow.title, x: 40, y: currentY });
    let prevId = entryId;

    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      const nodeY = currentY + (i + 1) * NODE_SPACING_Y;
      const node: JourneyNode = {
        id: step.id,
        type: 'step',
        label: step.label,
        x: 40,
        y: nodeY,
        layer: step.layer,
        status: step.status || 'built',
      };
      if (step.route) node.route = step.route;
      if (step.codeRef) node.codeRef = step.codeRef;
      if (step.notes) node.notes = step.notes;
      if (step.why) node.why = step.why;
      if (step.errorCases?.length) node.errorCases = step.errorCases;
      nodes.push(node);
      edges.push({ from: prevId, to: step.id });
      prevId = step.id;
    }

    if (flow.branches) {
      for (const branch of flow.branches) {
        const decisionId = `${flow.id}-decision-${branch.afterStep}`;
        const afterNode = nodes.find((n) => n.id === branch.afterStep);
        nodes.push({
          id: decisionId,
          type: 'decision',
          label: branch.condition,
          x: 40 + NODE_SPACING_X,
          y: afterNode ? afterNode.y + NODE_SPACING_Y / 2 : currentY,
          options: branch.paths.map((p) => ({ label: p.label, to: p.goTo })),
        });
        edges.push({ from: branch.afterStep, to: decisionId });
        for (const path of branch.paths)
          edges.push({ from: decisionId, to: path.goTo, opt: path.label });
      }
    }

    if (flow.connections) {
      for (const conn of flow.connections)
        edges.push({ from: conn.from, to: conn.to, opt: conn.label });
    }

    currentY += (flow.steps.length + 2) * NODE_SPACING_Y + FLOW_GAP_Y;
  }

  return {
    slug: source.slug,
    title: source.title,
    persona: source.persona,
    description: source.description,
    relatedIssues: source.relatedIssues,
    nodes,
    edges,
  };
}

export function extractJourneys(): Journey[] {
  const dir = root('docs/journeys');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'schema.json')
    .sort()
    .map((file) => transformJourney(JSON.parse(readFile(`docs/journeys/${file}`))));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Extracting journeys...');
  const journeys = extractJourneys();
  writeJson('journeys.json', { journeys });
  console.log(`  Found ${journeys.length} journeys`);
}
```

- [ ] **Step 2: Run and verify**

Run: `pnpm tsx scripts/docs-extract/extract-journeys.ts`
Expected: 3 journeys (signup, guest-cart, shop-invite-acceptance) with nodes/edges.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/extract-journeys.ts
git commit -m "feat(docs-extract): add journey extractor"
```

---

## Task 9: Extract Onboarding

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/extract-onboarding.ts`

- [ ] **Step 1: Write the extractor**

Parses `src/features/auth/CLAUDE.md` for onboarding-related sections. Falls back to sensible defaults based on known auth flow if no structured section found.

```typescript
import { readFile } from './utils/fs.js';
import { writeJson } from './utils/output.js';
import type { OnboardingStep, SellerPrecondition } from './types.js';

export function extractOnboarding(): {
  steps: OnboardingStep[];
  sellerPreconditions: SellerPrecondition[];
} {
  let content: string;
  try {
    content = readFile('src/features/auth/CLAUDE.md');
  } catch {
    content = '';
  }

  const steps: OnboardingStep[] = [];
  const sellerPreconditions: SellerPrecondition[] = [];
  const lines = content.split('\n');
  let inOnboarding = false;
  let inSeller = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('onboarding') && line.startsWith('#')) {
      inOnboarding = true;
      inSeller = false;
      continue;
    }
    if (lower.includes('seller') && lower.includes('precondition') && line.startsWith('#')) {
      inSeller = true;
      inOnboarding = false;
      continue;
    }
    if (line.startsWith('#')) {
      inOnboarding = false;
      inSeller = false;
      continue;
    }

    const listMatch = line.match(/^[-*]\s+\*?\*?(.+?)\*?\*?\s*[-–—:]\s*(.+)/);
    if (!listMatch) continue;
    const label = listMatch[1].replace(/\*\*/g, '').trim();
    const description = listMatch[2].trim();

    if (inOnboarding) {
      steps.push({
        id: label.toLowerCase().replace(/\s+/g, '-'),
        label,
        description,
        required: description.toLowerCase().includes('required'),
        field: label.toLowerCase().replace(/\s+/g, '_'),
      });
    } else if (inSeller) {
      sellerPreconditions.push({
        id: label.toLowerCase().replace(/\s+/g, '-'),
        label,
        description,
      });
    }
  }

  if (steps.length === 0) {
    steps.push(
      {
        id: 'avatar',
        label: 'Profile Photo',
        description: 'Upload an avatar image',
        required: false,
        field: 'avatar_url',
      },
      {
        id: 'display-name',
        label: 'Display Name',
        description: 'Set a public display name',
        required: true,
        field: 'display_name',
      },
      { id: 'bio', label: 'Bio', description: 'Write a short bio', required: false, field: 'bio' },
      {
        id: 'favorite-species',
        label: 'Favorite Species',
        description: 'Select preferred fishing species',
        required: false,
        field: 'favorite_species',
      },
    );
  }

  return { steps, sellerPreconditions };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Extracting onboarding...');
  const data = extractOnboarding();
  writeJson('onboarding.json', data);
  console.log(
    `  Found ${data.steps.length} steps, ${data.sellerPreconditions.length} preconditions`,
  );
}
```

- [ ] **Step 2: Run and verify**

Run: `pnpm tsx scripts/docs-extract/extract-onboarding.ts`
Expected: steps array and sellerPreconditions array.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/extract-onboarding.ts
git commit -m "feat(docs-extract): add onboarding extractor"
```

---

## Task 10: Fetch Kanban Board

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/fetch-kanban.ts`

- [ ] **Step 1: Write the fetcher**

Uses GitHub GraphQL API to fetch all items from project #2 in nessi-fishing-supply org. Paginates in batches of 100. Extracts custom fields (Status, Priority, Area, Executor, Feature).

```typescript
import { writeJson } from './utils/output.js';
import type { RoadmapItem } from './types.js';

const ORG = 'nessi-fishing-supply';
const PROJECT_NUMBER = 2;

const QUERY = `
query($org: String!, $number: Int!, $cursor: String) {
  organization(login: $org) {
    projectV2(number: $number) {
      items(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          fieldValues(first: 15) {
            nodes {
              ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2Field { name } } }
              ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2SingleSelectField { name } } }
            }
          }
          content {
            ... on Issue { title number url state labels(first: 10) { nodes { name } } }
            ... on PullRequest { title number url state labels(first: 10) { nodes { name } } }
          }
        }
      }
    }
  }
}`;

function getField(node: any, fieldName: string): string {
  for (const fv of node.fieldValues.nodes) {
    if (fv.field?.name === fieldName) return fv.name || fv.text || '';
  }
  return '';
}

export async function fetchKanban(): Promise<RoadmapItem[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN environment variable required');

  const items: RoadmapItem[] = [];
  let cursor: string | null = null;

  while (true) {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { org: ORG, number: PROJECT_NUMBER, cursor },
      }),
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const json: any = await res.json();
    const page = json.data.organization.projectV2.items;

    for (const node of page.nodes) {
      const content = node.content;
      if (!content?.title) continue;
      items.push({
        title: content.title,
        number: content.number,
        url: content.url || '',
        status: getField(node, 'Status'),
        priority: getField(node, 'Priority'),
        area: getField(node, 'Area'),
        executor: getField(node, 'Executor'),
        feature: getField(node, 'Feature'),
        labels: (content.labels?.nodes || []).map((l: any) => l.name),
        state: content.state || 'OPEN',
      });
    }

    if (!page.pageInfo.hasNextPage) break;
    cursor = page.pageInfo.endCursor;
  }

  return items;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Fetching kanban board...');
  const items = await fetchKanban();
  writeJson('roadmap.json', { items });
  console.log(`  Found ${items.length} kanban items`);
}
```

- [ ] **Step 2: Run and verify**

Run: `GITHUB_TOKEN=$(gh auth token) pnpm tsx scripts/docs-extract/fetch-kanban.ts`
Expected: ~191 items with status, priority, area, executor fields.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/fetch-kanban.ts
git commit -m "feat(docs-extract): add kanban board fetcher"
```

---

## Task 11: Fetch Changelog

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/fetch-changelog.ts`

- [ ] **Step 1: Write the fetcher**

Fetches all merged PRs from nessi-web-app via GitHub REST API. Derives area from labels and type from PR title prefix or labels.

```typescript
import { writeJson } from './utils/output.js';
import type { ChangelogEntry } from './types.js';

const OWNER = 'nessi-fishing-supply';
const REPO = 'Nessi-Web-App';

function deriveArea(labels: string[]): string {
  const areas = ['frontend', 'backend', 'database', 'full-stack', 'infra'];
  for (const l of labels) {
    if (areas.includes(l.toLowerCase())) return l.toLowerCase();
  }
  return 'full-stack';
}

function deriveType(title: string, labels: string[]): string {
  const map: Record<string, string> = {
    feature: 'feature',
    feat: 'feature',
    enhancement: 'feature',
    bug: 'fix',
    fix: 'fix',
    chore: 'chore',
    refactor: 'refactor',
    docs: 'docs',
  };
  for (const l of labels) {
    if (map[l.toLowerCase()]) return map[l.toLowerCase()];
  }
  const prefix = title.match(/^(feat|fix|chore|refactor|docs|test|ci)\b/i);
  if (prefix) return map[prefix[1].toLowerCase()] || prefix[1].toLowerCase();
  return 'chore';
}

export async function fetchChangelog(): Promise<ChangelogEntry[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN environment variable required');

  const entries: ChangelogEntry[] = [];
  let page = 1;

  while (true) {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}`;
    const res = await fetch(url, {
      headers: { Authorization: `bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data: any[] = await res.json();

    for (const pr of data) {
      if (!pr.merged_at) continue;
      const labels = pr.labels.map((l: any) => l.name);
      entries.push({
        title: pr.title,
        number: pr.number,
        url: pr.html_url,
        mergedAt: pr.merged_at,
        author: pr.user.login,
        labels,
        area: deriveArea(labels),
        type: deriveType(pr.title, labels),
      });
    }

    if (data.length < 100) break;
    page++;
  }

  return entries.sort((a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Fetching changelog...');
  const entries = await fetchChangelog();
  writeJson('changelog.json', { entries });
  console.log(`  Found ${entries.length} merged PRs`);
}
```

- [ ] **Step 2: Run and verify**

Run: `GITHUB_TOKEN=$(gh auth token) pnpm tsx scripts/docs-extract/fetch-changelog.ts`
Expected: Merged PRs sorted by date, each with type and area.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-extract/fetch-changelog.ts
git commit -m "feat(docs-extract): add changelog fetcher"
```

---

## Task 12: Orchestrator + Validator

**Repo:** WEB
**Files:**

- Create: `scripts/docs-extract/run-all.ts`
- Create: `scripts/docs-extract/validate.ts`

- [ ] **Step 1: Write the orchestrator**

Create `scripts/docs-extract/run-all.ts` that imports all extractors, runs them in order (sync extractors first, async GitHub fetchers second), writes `_meta.json` with timestamp and counts.

```typescript
import { extractApiRoutes } from './extract-api-routes.js';
import { extractDatabase } from './extract-database.js';
import { extractPermissions } from './extract-permissions.js';
import { extractConfig } from './extract-config.js';
import { extractFeatures } from './extract-features.js';
import { extractLifecycles } from './extract-lifecycles.js';
import { extractJourneys } from './extract-journeys.js';
import { extractOnboarding } from './extract-onboarding.js';
import { fetchKanban } from './fetch-kanban.js';
import { fetchChangelog } from './fetch-changelog.js';
import { writeJson } from './utils/output.js';
import type { ExtractionMeta } from './types.js';

async function main() {
  const start = Date.now();
  console.log('=== Nessi Docs Data Extraction ===\n');
  const counts: Record<string, number> = {};

  console.log('[1/10] API routes...');
  const groups = extractApiRoutes();
  writeJson('api-contracts.json', { groups });
  counts.apiRoutes = groups.reduce((s, g) => s + g.endpoints.length, 0);

  console.log('[2/10] Database schema...');
  const { entities, erd } = extractDatabase();
  writeJson('data-model.json', { entities });
  writeJson('entity-relationships.json', erd);
  counts.tables = entities.length;

  console.log('[3/10] Permissions...');
  const perms = extractPermissions();
  writeJson('permissions.json', perms);
  counts.roles = perms.roles.length;

  console.log('[4/10] Config/enums...');
  const configs = extractConfig();
  writeJson('config-reference.json', { configs });
  counts.configs = configs.length;

  console.log('[5/10] Features...');
  const features = extractFeatures();
  writeJson('features.json', { features });
  counts.features = features.length;

  console.log('[6/10] Lifecycles...');
  const lifecycles = extractLifecycles();
  writeJson('lifecycles.json', { lifecycles });
  counts.lifecycles = lifecycles.length;

  console.log('[7/10] Journeys...');
  const journeys = extractJourneys();
  writeJson('journeys.json', { journeys });
  counts.journeys = journeys.length;

  console.log('[8/10] Onboarding...');
  const onboarding = extractOnboarding();
  writeJson('onboarding.json', onboarding);
  counts.onboardingSteps = onboarding.steps.length;

  console.log('[9/10] Kanban board...');
  const kanban = await fetchKanban();
  writeJson('roadmap.json', { items: kanban });
  counts.kanbanItems = kanban.length;

  console.log('[10/10] Changelog...');
  const changelog = await fetchChangelog();
  writeJson('changelog.json', { entries: changelog });
  counts.changelog = changelog.length;

  const meta: ExtractionMeta = {
    extractedAt: new Date().toISOString(),
    sourceCommit: process.env.SOURCE_COMMIT || 'local',
    sourceRepo: 'nessi-fishing-supply/Nessi-Web-App',
    scriptVersion: '1.0.0',
    itemCounts: counts,
  };
  writeJson('_meta.json', meta);

  console.log(`\n=== Done in ${((Date.now() - start) / 1000).toFixed(1)}s ===`);
  console.log('Counts:', JSON.stringify(counts, null, 2));
}

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Write the validator**

Create `scripts/docs-extract/validate.ts`:

```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = join(import.meta.dirname, '..', '..', '_docs-output');
const EXPECTED = [
  'api-contracts.json',
  'data-model.json',
  'entity-relationships.json',
  'permissions.json',
  'config-reference.json',
  'features.json',
  'lifecycles.json',
  'journeys.json',
  'onboarding.json',
  'roadmap.json',
  'changelog.json',
  '_meta.json',
];

let hasErrors = false;
console.log('=== Validation Results ===\n');

for (const file of EXPECTED) {
  const path = join(OUTPUT_DIR, file);
  if (!existsSync(path)) {
    console.log(`  ✗ ${file}: MISSING`);
    hasErrors = true;
    continue;
  }
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    if (file === '_meta.json') {
      if (!data.extractedAt) {
        console.log(`  ✗ ${file}: missing extractedAt`);
        hasErrors = true;
        continue;
      }
    } else {
      const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
      if (arrayKey && data[arrayKey].length === 0) {
        console.log(`  ✗ ${file}: empty array "${arrayKey}"`);
        hasErrors = true;
        continue;
      }
    }
    console.log(`  ✓ ${file}`);
  } catch (e) {
    console.log(`  ✗ ${file}: invalid JSON`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.log('\n❌ Validation failed');
  process.exit(1);
} else {
  console.log('\n✅ All files valid');
}
```

- [ ] **Step 3: Run the full pipeline**

```bash
GITHUB_TOKEN=$(gh auth token) pnpm tsx scripts/docs-extract/run-all.ts
pnpm tsx scripts/docs-extract/validate.ts
```

Expected: All 12 files written, all pass validation.

- [ ] **Step 4: Add \_docs-output to .gitignore**

Append `_docs-output/` to `.gitignore`.

- [ ] **Step 5: Commit**

```bash
git add scripts/docs-extract/run-all.ts scripts/docs-extract/validate.ts .gitignore
git commit -m "feat(docs-extract): add orchestrator and validator"
```

---

## Task 13: GitHub Action Workflow

**Repo:** WEB
**Files:**

- Create: `.github/workflows/sync-docs.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/sync-docs.yml`:

```yaml
name: Sync Docs Data

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  extract-and-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Generate token
        id: app-token
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ secrets.DOCS_SYNC_APP_ID }}
          private-key: ${{ secrets.DOCS_SYNC_PRIVATE_KEY }}
          repositories: nessi-docs

      - name: Extract docs data
        run: pnpm tsx scripts/docs-extract/run-all.ts
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SOURCE_COMMIT: ${{ github.sha }}

      - name: Validate generated JSON
        run: pnpm tsx scripts/docs-extract/validate.ts

      - name: Checkout nessi-docs
        uses: actions/checkout@v4
        with:
          repository: nessi-fishing-supply/nessi-docs
          path: nessi-docs
          token: ${{ steps.app-token.outputs.token }}

      - name: Sync to nessi-docs
        env:
          SHA: ${{ github.sha }}
        run: |
          mkdir -p nessi-docs/src/data/generated
          cp -r _docs-output/* nessi-docs/src/data/generated/
          cd nessi-docs
          git config user.name "nessi-docs-sync[bot]"
          git config user.email "nessi-docs-sync[bot]@users.noreply.github.com"
          git add src/data/generated/
          git diff --staged --quiet && echo "No changes to sync" && exit 0
          git commit -m "data: sync from nessi-web-app@${SHA:0:7}"
          git push
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/sync-docs.yml
git commit -m "feat: add docs data sync GitHub Action"
```

- [ ] **Step 3: Manual setup required (user action)**

User must create `nessi-docs-sync` GitHub App and add secrets. See spec for full instructions.

---

## Task 14: nessi-docs — Generated Data + Adapter Layer

**Repo:** DOCS
**Files:**

- Create: `src/data/generated/.gitkeep`
- Modify: `src/data/index.ts`
- Delete: old hardcoded data files (after build passes)

- [ ] **Step 1: Create generated directory and seed data**

```bash
mkdir -p src/data/generated
```

Copy extraction output:

```bash
cp /Users/kyleholloway/Documents/Development/nessi-web-app/_docs-output/* src/data/generated/
```

- [ ] **Step 2: Update src/data/index.ts to read from generated JSON**

Replace contents of `src/data/index.ts`:

```typescript
import type { ApiGroup } from '@/types/api-contract';
import type { Entity } from '@/types/data-model';
import type { Lifecycle } from '@/types/lifecycle';
import type { Feature } from '@/types/feature';
import type { Role } from '@/types/permission';
import type { ConfigEnum } from '@/types/config-ref';
import type { Journey } from '@/types/journey';

import apiContractsRaw from './generated/api-contracts.json';
import dataModelRaw from './generated/data-model.json';
import erdRaw from './generated/entity-relationships.json';
import permissionsRaw from './generated/permissions.json';
import configRaw from './generated/config-reference.json';
import featuresRaw from './generated/features.json';
import lifecyclesRaw from './generated/lifecycles.json';
import journeysRaw from './generated/journeys.json';
import onboardingRaw from './generated/onboarding.json';
import changelogRaw from './generated/changelog.json';
import roadmapRaw from './generated/roadmap.json';
import metaRaw from './generated/_meta.json';

export const apiGroups: ApiGroup[] = apiContractsRaw.groups as ApiGroup[];
export const entities: Entity[] = dataModelRaw.entities as Entity[];
export const erdNodes = erdRaw.nodes;
export const erdEdges = erdRaw.edges;
export const roles: Role[] = permissionsRaw.roles as Role[];
export const configEnums: ConfigEnum[] = configRaw.configs as ConfigEnum[];
export const features: Feature[] = featuresRaw.features as Feature[];
export const lifecycles: Lifecycle[] = lifecyclesRaw.lifecycles as Lifecycle[];

export function getLifecycle(slug: string): Lifecycle | undefined {
  return lifecycles.find((l) => l.slug === slug);
}
export function getLifecycleSlugs(): string[] {
  return lifecycles.map((l) => l.slug);
}

const journeys: Journey[] = journeysRaw.journeys as Journey[];
export function getAllJourneys(): Journey[] {
  return journeys;
}
export function getJourney(slug: string): Journey | undefined {
  return journeys.find((j) => j.slug === slug);
}
export function getJourneySlugs(): string[] {
  return journeys.map((j) => j.slug);
}

export const onboardingSteps = onboardingRaw.steps;
export const sellerPreconditions = onboardingRaw.sellerPreconditions;
export const changelog = changelogRaw.entries;
export const roadmapItems = roadmapRaw.items;

export function getLinksForRoute(route: string) {
  const links: { label: string; href: string }[] = [];
  for (const group of apiGroups) {
    for (const ep of group.endpoints) {
      if (ep.path === route)
        links.push({ label: `${ep.method} ${ep.path}`, href: `/api-map?highlight=${ep.path}` });
    }
  }
  return links;
}

export function getLinksForEndpoint(path: string) {
  const links: { label: string; href: string }[] = [];
  for (const j of journeys) {
    for (const n of j.nodes) {
      if (n.route === path) links.push({ label: j.title, href: `/journeys/${j.slug}` });
    }
  }
  return links;
}

export function getErrorsForEndpoint(path: string) {
  const errors: { condition: string; result: string; httpStatus?: number }[] = [];
  for (const j of journeys) {
    for (const n of j.nodes) {
      if (n.route === path && n.errorCases) errors.push(...n.errorCases);
    }
  }
  return errors;
}

export const extractionMeta = metaRaw;
```

- [ ] **Step 3: Run typecheck and fix any type mismatches**

Run: `pnpm typecheck`

Fix any issues — likely need `as` casts where generated JSON shapes differ slightly from existing types. The existing types in `src/types/` may need minor updates to match the generated JSON (e.g., adding optional fields, relaxing required fields).

- [ ] **Step 4: Run build**

Run: `pnpm build`

Fix any build errors.

- [ ] **Step 5: Remove old hardcoded data files**

```bash
rm src/data/api-contracts.ts src/data/data-model.ts src/data/lifecycles.ts
rm src/data/features.ts src/data/permissions.ts src/data/config-reference.ts
rm src/data/changelog.ts src/data/onboarding.ts src/data/entity-relationships.ts
rm src/data/cross-links.ts
rm -rf src/data/journeys/
```

- [ ] **Step 6: Verify build again**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 7: Commit**

```bash
git add src/data/ -A
git commit -m "feat: migrate data layer to generated JSON from extraction pipeline"
```

---

## Task 15: Staleness Banner

**Repo:** DOCS
**Files:**

- Create: `src/components/layout/staleness-banner/index.tsx`
- Create: `src/components/layout/staleness-banner/staleness-banner.module.scss`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create the banner component**

Create `src/components/layout/staleness-banner/index.tsx`:

```tsx
import { extractionMeta } from '@/data';
import styles from './staleness-banner.module.scss';

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function StalenessBanner() {
  const extractedAt = new Date(extractionMeta.extractedAt);
  const age = Date.now() - extractedAt.getTime();
  if (age <= STALE_THRESHOLD_MS) return null;

  const daysAgo = Math.floor(age / (24 * 60 * 60 * 1000));
  return (
    <div className={styles.banner}>
      Data last synced {daysAgo} days ago from <code>{extractionMeta.sourceCommit}</code>. Pipeline
      may need attention.
    </div>
  );
}
```

Create `src/components/layout/staleness-banner/staleness-banner.module.scss`:

```scss
.banner {
  background: var(--color-warning-bg, #b86e0a);
  color: var(--color-warning-text, #fff);
  padding: 8px 16px;
  font-size: 0.8rem;
  text-align: center;

  code {
    background: rgba(0, 0, 0, 0.15);
    padding: 1px 5px;
    border-radius: 3px;
  }
}
```

- [ ] **Step 2: Add to layout**

In `src/app/layout.tsx`, add import and render `<StalenessBanner />` as first child of `<body>`:

```typescript
import { StalenessBanner } from '@/components/layout/staleness-banner';
```

```tsx
<body className={dmSans.className}>
  <StalenessBanner />
  <DocsProvider>
    ...
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/staleness-banner/ src/app/layout.tsx
git commit -m "feat: add staleness warning banner"
```

---

## Task 16: Final Verification

- [ ] **Step 1: Run full extraction from nessi-web-app**

```bash
cd /Users/kyleholloway/Documents/Development/nessi-web-app
GITHUB_TOKEN=$(gh auth token) pnpm tsx scripts/docs-extract/run-all.ts
pnpm tsx scripts/docs-extract/validate.ts
```

- [ ] **Step 2: Copy to nessi-docs and build**

```bash
cp _docs-output/* /Users/kyleholloway/Documents/Development/nessi-docs/src/data/generated/
cd /Users/kyleholloway/Documents/Development/nessi-docs
pnpm build
```

- [ ] **Step 3: Start dev server and visually verify**

Run: `pnpm dev`

Open http://localhost:3000 and verify all pages render with extracted data: journeys, API map, data model, permissions, features, config, lifecycles.

- [ ] **Step 4: Commit any remaining fixes in both repos**
