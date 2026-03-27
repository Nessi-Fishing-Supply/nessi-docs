# IA Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the app into a dashboard home page, feature domain pages, and three-group sidebar navigation — replacing the flat 10-item nav with a structured information architecture.

**Architecture:** Data transformer computes feature-to-domain mapping using a `FEATURE_TO_DOMAIN` map. Dashboard page aggregates metrics and changelog. Feature domain pages (`/features/[domain]`) show scoped coverage, features, API endpoints, journeys, entities, and changelog. Permissions absorbed into Config. Coverage and Permissions routes removed.

**Tech Stack:** Next.js 16 App Router (SSG), SCSS Modules, existing Nessi design tokens, existing data transformer pattern in `src/data/index.ts`

**Spec:** `docs/superpowers/specs/2026-03-27-ia-restructure-design.md`

---

## File Structure

### New Files
- `src/types/dashboard.ts` — FeatureDomain, DashboardMetrics types
- `src/features/dashboard/dashboard-view/index.tsx` — Dashboard page component
- `src/features/dashboard/dashboard-view/dashboard-view.module.scss` — Dashboard styles
- `src/features/feature-domain/feature-domain-view/index.tsx` — Feature domain page component
- `src/features/feature-domain/feature-domain-view/feature-domain-view.module.scss` — Feature domain styles
- `src/app/features/[domain]/page.tsx` — Dynamic route for feature domain pages

### Modified Files
- `src/data/index.ts` — Add FEATURE_TO_DOMAIN map, new exports (getFeatureDomains, getFeaturesByDomain, getChangelogByDomain, getDashboardMetrics)
- `src/app/page.tsx` — Replace redirect with dashboard
- `src/app/features/page.tsx` — Redirect to `/`
- `src/components/layout/sidebar/index.tsx` — Three-group navigation
- `src/features/config/config-list/index.tsx` — Add roles/permissions section
- `src/components/layout/app-shell/index.tsx` — Remove detail panel for feature domain pages

### Deleted Files
- `src/app/coverage/page.tsx`
- `src/app/permissions/page.tsx`

---

### Task 1: Types & Data Transformer

**Files:**
- Create: `src/types/dashboard.ts`
- Modify: `src/data/index.ts`

- [ ] **Step 1: Create dashboard types**

```typescript
// src/types/dashboard.ts
import type { FeatureStatus } from './feature';

export interface FeatureDomain {
  slug: string;
  label: string;
  description: string;
  featureCount: number;
  endpointCount: number;
  journeyCount: number;
  entityCount: number;
  builtCount: number;
  inProgressCount: number;
  stubbedCount: number;
  plannedCount: number;
  buildProgress: number;
}

export interface DashboardMetrics {
  totalFeatures: number;
  totalEndpoints: number;
  totalJourneys: number;
  totalEntities: number;
  totalLifecycles: number;
  builtCount: number;
  inProgressCount: number;
  stubbedCount: number;
  plannedCount: number;
}
```

- [ ] **Step 2: Add FEATURE_TO_DOMAIN map and helper functions to data transformer**

Add the following to `src/data/index.ts` after the existing `ENTITY_CATEGORY_MAP`:

```typescript
import type { FeatureDomain, DashboardMetrics } from '@/types/dashboard';

/* ------------------------------------------------------------------ */
/*  Feature → Domain mapping (computed in transformer, not extracted)  */
/* ------------------------------------------------------------------ */

const FEATURE_TO_DOMAIN: Record<string, string> = {
  addresses: 'account',
  auth: 'auth',
  cart: 'cart',
  context: 'identity',
  dashboard: 'account',
  editorial: 'listings',
  email: 'shops',
  flags: 'shopping',
  follows: 'shopping',
  listings: 'listings',
  members: 'account',
  messaging: 'shops',
  orders: 'cart',
  'recently-viewed': 'shopping',
  shared: 'shopping',
  shops: 'shops',
};

export function getFeatureDomains(): FeatureDomain[] {
  return DOMAINS.map((d) => {
    const domainFeatures = features.filter(
      (f) => FEATURE_TO_DOMAIN[f.slug] === d.slug,
    );
    const dJourneys = journeys.filter((j) => j.domain === d.slug);
    const domainEntities = new Set(domainFeatures.flatMap((f) => (f as any).entities ?? []));

    const builtCount = domainFeatures.filter((f) => f.status === 'built').length;
    const inProgressCount = domainFeatures.filter((f) => f.status === 'in-progress').length;
    const stubbedCount = domainFeatures.filter((f) => f.status === 'stubbed').length;
    const plannedCount = domainFeatures.filter((f) => f.status === 'planned').length;
    const total = domainFeatures.length;

    return {
      slug: d.slug,
      label: d.label,
      description: d.description,
      featureCount: total,
      endpointCount: domainFeatures.reduce((sum, f) => sum + f.endpointCount, 0),
      journeyCount: dJourneys.length,
      entityCount: domainEntities.size,
      builtCount,
      inProgressCount,
      stubbedCount,
      plannedCount,
      buildProgress: total > 0 ? Math.round((builtCount / total) * 100) : 0,
    };
  }).filter((d) => d.featureCount > 0);
}

export function getFeaturesByDomain(domain: string): Feature[] {
  return features.filter((f) => FEATURE_TO_DOMAIN[f.slug] === domain);
}

/** Parse conventional commit scope from changelog title: "feat(follows): ..." → "follows" */
function parseChangelogScope(title: string): string | null {
  const match = title.match(/^\w+\(([^)]+)\):/);
  return match ? match[1] : null;
}

/** Map changelog scopes to domains */
const SCOPE_TO_DOMAIN: Record<string, string> = {
  auth: 'auth',
  cart: 'cart',
  checkout: 'cart',
  shops: 'shops',
  shop: 'shops',
  invites: 'shops',
  listings: 'listings',
  listing: 'listings',
  follows: 'shopping',
  search: 'shopping',
  recently: 'shopping',
  reports: 'shopping',
  flags: 'shopping',
  account: 'account',
  addresses: 'account',
  members: 'account',
  context: 'identity',
  orders: 'cart',
  email: 'shops',
};

export function getChangelogByDomain(domain: string): ChangelogEntry[] {
  return changelog
    .map((entry) => {
      const filtered = (entry.changes ?? []).filter((c) => {
        const scope = parseChangelogScope(c.description);
        return scope ? SCOPE_TO_DOMAIN[scope] === domain : false;
      });
      if (filtered.length === 0) return null;
      return { ...entry, changes: filtered };
    })
    .filter((e): e is ChangelogEntry => e !== null);
}

export function getDashboardMetrics(): DashboardMetrics {
  return {
    totalFeatures: features.length,
    totalEndpoints: apiGroups.reduce(
      (sum, g) => sum + g.endpoints.length,
      0,
    ),
    totalJourneys: journeys.length,
    totalEntities: entities.length,
    totalLifecycles: lifecycles.length,
    builtCount: features.filter((f) => f.status === 'built').length,
    inProgressCount: features.filter((f) => f.status === 'in-progress').length,
    stubbedCount: features.filter((f) => f.status === 'stubbed').length,
    plannedCount: features.filter((f) => f.status === 'planned').length,
  };
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/types/dashboard.ts src/data/index.ts
git commit -m "feat: add feature domain mapping and dashboard metrics to data transformer"
```

---

### Task 2: Dashboard Page

**Files:**
- Create: `src/features/dashboard/dashboard-view/index.tsx`
- Create: `src/features/dashboard/dashboard-view/dashboard-view.module.scss`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create dashboard SCSS module**

```scss
// src/features/dashboard/dashboard-view/dashboard-view.module.scss
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  gap: 24px;
}

// ─── Hero section ───

.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

// ─── Progress column ───

.progressCard {
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progressLabel {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.progressBar {
  height: 6px;
  background: rgb(255 255 255 / 6%);
  border-radius: 3px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  border-radius: 3px;
  transition: width 600ms ease-out;
}

.progressStats {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-family: var(--font-family-mono);
}

.metricGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.metricCard {
  background: rgb(255 255 255 / 2%);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px;
}

.metricValue {
  font-size: 20px;
  font-weight: 600;
  font-family: var(--font-family-mono);
}

.metricLabel {
  font-size: 9px;
  color: var(--text-muted);
}

// ─── Changelog column ───

.changelogCard {
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.changelogHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.changelogList {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.changeEntry {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.changeBadge {
  font-size: 9px;
  padding: 1px 7px;
  border-radius: 10px;
  flex-shrink: 0;
}

.changeText {
  flex: 1;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.changeDate {
  font-size: 9px;
  color: var(--text-muted);
  font-family: var(--font-family-mono);
  flex-shrink: 0;
}

.viewAll {
  font-size: 10px;
  color: var(--text-muted);
  text-decoration: none;
  font-family: var(--font-family-mono);

  &:hover {
    color: var(--text-secondary);
  }
}

// ─── Domain grid ───

.domainSection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sectionLabel {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.domainGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.domainTile {
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px;
  text-decoration: none;
  transition: all var(--transition-fast);
  cursor: pointer;

  &:hover {
    border-color: var(--border-medium);
    background: rgb(255 255 255 / 3%);
  }
}

.domainName {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.domainMeta {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-family-mono);
}
```

- [ ] **Step 2: Create dashboard component**

```typescript
// src/features/dashboard/dashboard-view/index.tsx
import Link from 'next/link';
import type { FeatureDomain, DashboardMetrics } from '@/types/dashboard';
import type { ChangelogEntry } from '@/types/changelog';
import { CHANGE_TYPE_CONFIG } from '@/types/changelog';
import styles from './dashboard-view.module.scss';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  domains: FeatureDomain[];
  recentChanges: ChangelogEntry[];
}

export function DashboardView({ metrics, domains, recentChanges }: DashboardViewProps) {
  const totalFeatures = metrics.totalFeatures;
  const builtPct = totalFeatures > 0 ? Math.round((metrics.builtCount / totalFeatures) * 100) : 0;
  const ipPct = totalFeatures > 0 ? Math.round((metrics.inProgressCount / totalFeatures) * 100) : 0;

  // Flatten recent changelog entries for display
  const flatChanges = recentChanges
    .flatMap((entry) =>
      (entry.changes ?? []).map((c) => ({ ...c, date: entry.date })),
    )
    .slice(0, 8);

  return (
    <div className={styles.container}>
      {/* Hero: progress + changelog */}
      <div className={styles.hero}>
        {/* Left: build progress + metrics */}
        <div className={styles.progressCard}>
          <div className={styles.progressLabel}>Build Progress</div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${builtPct + ipPct}%`,
                background: `linear-gradient(90deg, #3d8c75 ${builtPct}%, #d4923a ${builtPct}% ${builtPct + ipPct}%, #78756f ${builtPct + ipPct}%)`,
              }}
            />
          </div>
          <div className={styles.progressStats}>
            <span style={{ color: '#3d8c75' }}>{metrics.builtCount} built</span>
            <span style={{ color: '#d4923a' }}>{metrics.inProgressCount} in-progress</span>
            <span style={{ color: '#78756f' }}>{metrics.plannedCount} planned</span>
          </div>
          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue} style={{ color: '#3d8c75' }}>
                {metrics.totalJourneys}
              </div>
              <div className={styles.metricLabel}>Journeys</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue} style={{ color: '#e27739' }}>
                {metrics.totalEndpoints}
              </div>
              <div className={styles.metricLabel}>Endpoints</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue} style={{ color: '#9b7bd4' }}>
                {metrics.totalEntities}
              </div>
              <div className={styles.metricLabel}>Entities</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue} style={{ color: '#d4923a' }}>
                {metrics.totalLifecycles}
              </div>
              <div className={styles.metricLabel}>Lifecycles</div>
            </div>
          </div>
        </div>

        {/* Right: changelog */}
        <div className={styles.changelogCard}>
          <div className={styles.changelogHeader}>
            <div className={styles.progressLabel}>Recent Changes</div>
            <Link href="/changelog" className={styles.viewAll}>
              View all →
            </Link>
          </div>
          <div className={styles.changelogList}>
            {flatChanges.map((change, i) => {
              const cfg = CHANGE_TYPE_CONFIG[change.type];
              return (
                <div key={i} className={styles.changeEntry}>
                  <span
                    className={styles.changeBadge}
                    style={{
                      background: `${cfg.color}1a`,
                      color: cfg.color,
                    }}
                  >
                    {cfg.label.toLowerCase()}
                  </span>
                  <span className={styles.changeText}>{change.description}</span>
                  {change.date && (
                    <span className={styles.changeDate}>{change.date}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature domain grid */}
      <div className={styles.domainSection}>
        <div className={styles.sectionLabel}>Feature Domains</div>
        <div className={styles.domainGrid}>
          {domains.map((d) => (
            <Link
              key={d.slug}
              href={`/features/${d.slug}`}
              className={styles.domainTile}
            >
              <div className={styles.domainName}>{d.label}</div>
              <div className={styles.domainMeta}>
                {d.featureCount} features · {d.endpointCount} endpoints
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update home page to render dashboard**

Replace `src/app/page.tsx`:

```typescript
import { getDashboardMetrics, getFeatureDomains, changelog } from '@/data';
import { DashboardView } from '@/features/dashboard/dashboard-view';

export const metadata = { title: 'Dashboard | Nessi Docs' };

export default function DashboardPage() {
  return (
    <DashboardView
      metrics={getDashboardMetrics()}
      domains={getFeatureDomains()}
      recentChanges={changelog.slice(0, 5)}
    />
  );
}
```

- [ ] **Step 4: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint && pnpm lint:styles`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/ src/app/page.tsx
git commit -m "feat: add dashboard home page with metrics, changelog, and domain grid"
```

---

### Task 3: Feature Domain Page

**Files:**
- Create: `src/features/feature-domain/feature-domain-view/index.tsx`
- Create: `src/features/feature-domain/feature-domain-view/feature-domain-view.module.scss`
- Create: `src/app/features/[domain]/page.tsx`

- [ ] **Step 1: Create feature domain SCSS module**

Create `src/features/feature-domain/feature-domain-view/feature-domain-view.module.scss` with styles for:
- Container with scrollable layout
- Coverage hero with progress bar and metric pills
- Feature rows (accordion) with status dots, stagger animation, expand/collapse
- Expanded content with API endpoint links, entity links, journey links
- Hash-targeted row highlight with border trace
- Bottom two-column footer for changelog and quick links

Follow the exact patterns from `src/features/data-model/entity-list/entity-list.module.scss` for row styling, stagger animation (`@keyframes row-enter`, `animation-delay: var(--stagger)`), and highlight state.

- [ ] **Step 2: Create feature domain page component**

Create `src/features/feature-domain/feature-domain-view/index.tsx` as a `'use client'` component:

- Props: `{ domain: FeatureDomain; features: Feature[]; changelog: ChangelogEntry[]; journeys: { slug: string; title: string; domain: string }[]; entities: { name: string; label?: string; fieldCount: number }[] }`
- State: `openFeatures: Set<string>` for accordion expand/collapse
- `openFeature(slug)` function (add to set, never toggle — for deep-link safety)
- `toggleFeature(slug)` function (toggle — for click)
- Coverage hero at top: big percentage, progress bar, status pills, metric badges
- Feature rows with stagger animation: status dot, name, endpoint count, chevron
- Expanded row content: description, API endpoints (method badge + path as `Link` to `/api-map#slug`), entities (as `Link` to `/data-model#name`), journeys (as `Link` to `/journeys/domain/slug`), lifecycle links
- Deep-link: `useEffect` with `hashchange` listener, calls `openFeature(slug)`, sets highlight, scrolls into view at 100ms, clears hash at 600ms, highlight fades at 9500ms
- `isDeepLinkTarget` via `useState` initializer for skipping stagger delay
- `BorderTrace` component on each row for highlight animation
- Bottom footer: two-column grid with scoped changelog (left) and quick links (right)

This component is large (~300 lines). Follow the exact patterns from `src/features/data-model/entity-list/index.tsx` for accordion, deep-link, stagger, and border trace behavior.

- [ ] **Step 3: Create the dynamic route page**

```typescript
// src/app/features/[domain]/page.tsx
import { notFound } from 'next/navigation';
import { getFeatureDomains, getFeaturesByDomain, getChangelogByDomain, getAllJourneys, entities } from '@/data';
import { FeatureDomainView } from '@/features/feature-domain/feature-domain-view';

export function generateStaticParams() {
  return getFeatureDomains().map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: slug } = await params;
  const domains = getFeatureDomains();
  const domain = domains.find((d) => d.slug === slug);
  return { title: domain ? `${domain.label} | Nessi Docs` : 'Feature' };
}

export default async function FeatureDomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: slug } = await params;
  const domains = getFeatureDomains();
  const domain = domains.find((d) => d.slug === slug);
  if (!domain) notFound();

  const domainFeatures = getFeaturesByDomain(slug);
  const domainChangelog = getChangelogByDomain(slug);
  const allJourneys = getAllJourneys();
  const domainJourneys = allJourneys
    .filter((j) => j.domain === slug)
    .map((j) => ({ slug: j.slug, title: j.title, domain: j.domain }));

  // Entities related to this domain's features
  const entityNames = new Set(domainFeatures.flatMap((f) => (f as any).entities ?? []));
  const domainEntities = entities
    .filter((e) => entityNames.has(e.name))
    .map((e) => ({ name: e.name, label: e.label, fieldCount: e.fields.length }));

  return (
    <FeatureDomainView
      domain={domain}
      features={domainFeatures}
      changelog={domainChangelog}
      journeys={domainJourneys}
      entities={domainEntities}
    />
  );
}
```

- [ ] **Step 4: Update features index page to redirect**

Replace `src/app/features/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function FeaturesIndex() {
  redirect('/');
}
```

- [ ] **Step 5: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint && pnpm lint:styles`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/feature-domain/ src/app/features/
git commit -m "feat: add feature domain pages with accordion, deep-links, coverage hero"
```

---

### Task 4: Config Page — Absorb Permissions

**Files:**
- Modify: `src/features/config/config-list/index.tsx`
- Modify: `src/app/config/page.tsx`

- [ ] **Step 1: Update config page to pass roles data**

```typescript
// src/app/config/page.tsx
import { configEnums, roles } from '@/data';
import { ConfigList } from '@/features/config/config-list';

export const metadata = { title: 'Config' };

export default function ConfigPage() {
  return <ConfigList enums={configEnums} roles={roles} />;
}
```

- [ ] **Step 2: Add roles section to ConfigList component**

Update `src/features/config/config-list/index.tsx`:

- Add `roles?: Role[]` to `ConfigListProps` interface
- Import `Role` from `@/types/permission` and `PERMISSION_FEATURES`, `LEVEL_CONFIG` from `@/types/permission`
- Before the existing enum sections, render a "Roles & Permissions" collapsible block if `roles` is provided
- Use the same accordion pattern as enum blocks: section header with role count, expand/collapse, table of roles × permission features
- Follow the visual treatment from `src/features/permissions/permissions-matrix/index.tsx` for the matrix table styling (role cards, permission level badges with colors)
- Update `PageHeader` metrics to include role count when roles are present

- [ ] **Step 3: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint && pnpm lint:styles`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/config/ src/app/config/page.tsx
git commit -m "feat: absorb roles/permissions section into config page"
```

---

### Task 5: Sidebar Navigation Restructure

**Files:**
- Modify: `src/components/layout/sidebar/index.tsx`

- [ ] **Step 1: Restructure sidebar into three groups**

Update `src/components/layout/sidebar/index.tsx`:

- Replace flat `NAV_ITEMS` array with three groups:
  - `SYSTEM_ITEMS`: Journeys, API Map, Data Model, Relationships, Lifecycles (same icons as current)
  - `REFERENCE_ITEMS`: Config, Changelog
- Feature domain items: dynamic, derived from `getFeatureDomains()` called at render time (or passed as prop)
- Add section labels using the pattern: `<div className={styles.sectionLabel}>SYSTEM VIEWS</div>`
- Dashboard link at the very top (above all sections) with a home/hexagon icon
- Feature items link to `/features/[slug]`
- Active state detection: for features, check if pathname starts with `/features/[slug]`
- Remove the lifecycle subnav (lifecycle pages still work, but the subnav is replaced by the three-group structure)
- Add `HiOutlineHome` or `HiOutlineViewGrid` icon for Dashboard
- Add `HiOutlineLightningBolt` or `HiOutlineCollection` icon for feature domain items

- [ ] **Step 2: Add section label styling to sidebar SCSS**

Update `src/components/layout/sidebar/sidebar.module.scss`:

```scss
.sectionLabel {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 12px 16px 4px;
}
```

- [ ] **Step 3: Update sidebar props**

The sidebar currently receives `lifecycles` as a prop. Update to also receive feature domains, or compute them internally by importing `getFeatureDomains` from `@/data`. Since the sidebar is a client component, it should receive the data as a serializable prop from the layout.

Update `src/app/layout.tsx` to pass `featureDomains={getFeatureDomains()}` to the Sidebar.

- [ ] **Step 4: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint && pnpm lint:styles`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar/ src/app/layout.tsx
git commit -m "feat: restructure sidebar into system views, features, reference groups"
```

---

### Task 6: Route Cleanup

**Files:**
- Delete: `src/app/coverage/page.tsx`
- Delete: `src/app/permissions/page.tsx`
- Modify: `src/components/layout/app-shell/index.tsx`

- [ ] **Step 1: Delete coverage and permissions routes**

```bash
rm src/app/coverage/page.tsx
rm src/app/permissions/page.tsx
```

- [ ] **Step 2: Update app shell detail panel pages**

In `src/components/layout/app-shell/index.tsx`, the `DETAIL_PANEL_PAGES` array currently includes `/coverage` and `/features`. Update:

```typescript
// Pages that support detail panel selection (canvas pages use tooltips instead)
const DETAIL_PANEL_PAGES = ['/features'];
```

This keeps the detail panel for feature domain pages (where clicking a feature row could populate it), but removes coverage and permissions which no longer exist.

Actually, based on the spec, feature domain pages use inline accordion expansion, not the detail panel. So:

```typescript
const DETAIL_PANEL_PAGES: string[] = [];
```

If no pages need the detail panel anymore, the panel still renders but stays in its empty/collapsed state by default, which is fine.

- [ ] **Step 3: Run build to verify all routes resolve**

Run: `pnpm build`
Expected: PASS — all static pages generate, no 404 references to deleted routes

- [ ] **Step 4: Run full CI checks**

Run: `pnpm format:check && pnpm lint && pnpm lint:styles && pnpm typecheck`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove coverage and permissions routes, clean up app shell"
```

---

### Task 7: Final Integration Verification

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: All pages generate. Check output for:
- `/` (dashboard)
- `/features/shops`, `/features/listings`, `/features/auth`, `/features/cart`, `/features/account`, `/features/shopping`, `/features/identity`
- No `/coverage`, `/permissions` in output

- [ ] **Step 2: Visual smoke test**

Start dev server and verify:
- `/` shows dashboard with metrics, changelog, domain grid
- Clicking a domain tile navigates to `/features/[domain]`
- Feature domain page shows coverage hero, feature list, connections
- Feature rows expand on click with API links, entity links, journey links
- Deep-links work: `/features/shops#invites` auto-expands and highlights
- Config page has roles/permissions section
- Sidebar shows three groups with correct active states
- Old routes `/coverage` and `/permissions` return 404

- [ ] **Step 3: Format and commit any final fixes**

Run: `pnpm format && pnpm lint && pnpm lint:styles && pnpm typecheck`
Fix any issues, commit.
