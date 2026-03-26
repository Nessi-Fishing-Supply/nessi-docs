# Journey Domain Tiles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat sidebar journey list with a three-level domain-grouped tile navigation (domain grid → journey list → canvas).

**Architecture:** New `domain` field on journeys groups them into feature domains. Three Next.js routes render: a card grid of domains, a journey list within a domain, and the existing canvas. Sidebar journey subnav is removed. Breadcrumbs provide back-navigation.

**Tech Stack:** Next.js 16 App Router (SSG), SCSS Modules, existing design tokens, existing data layer.

---

### Task 1: Add domain field to journey schema and data

**Files:**
- Modify: `/Users/kyleholloway/Documents/Development/nessi-web-app/docs/journeys/schema.json`
- Modify: All 29 journey JSON files in `/Users/kyleholloway/Documents/Development/nessi-web-app/docs/journeys/*.json`
- Modify: `src/types/journey.ts`
- Modify: `src/data/index.ts`

- [ ] **Step 1: Add `domain` to schema.json**

In `/Users/kyleholloway/Documents/Development/nessi-web-app/docs/journeys/schema.json`, add to the top-level `properties`:

```json
"domain": {
  "type": "string",
  "enum": ["auth", "shopping", "cart", "account", "shops", "listings", "identity"],
  "description": "Feature domain this journey belongs to. Used for grouping in the docs UI."
}
```

Add `"domain"` to the `required` array.

- [ ] **Step 2: Add `domain` to every journey JSON**

Add the `domain` field to each journey file per this mapping:

| domain | files |
|--------|-------|
| `auth` | signup, login, logout, password-reset, email-change, route-protection |
| `shopping` | guest-browse, buyer-search, buyer-recently-viewed, guest-recently-viewed |
| `cart` | guest-cart, buyer-cart, buyer-checkout |
| `account` | account-settings, buyer-addresses, account-deletion, onboarding, seller-toggle |
| `shops` | shop-create, shop-settings, shop-roles, shop-invite-acceptance, shop-member-journey, shop-member-management, shop-ownership-transfer |
| `listings` | seller-listings, seller-social-sharing |
| `identity` | context-switching, seller-context |

Example — add as a top-level field after `slug`:
```json
{
  "slug": "login",
  "domain": "auth",
  "title": "Login",
  ...
}
```

- [ ] **Step 3: Add `domain` to TypeScript types**

In `src/types/journey.ts`, add the domain type and update `Journey`:

```typescript
export type JourneyDomain = 'auth' | 'shopping' | 'cart' | 'account' | 'shops' | 'listings' | 'identity';
```

Add to the `Journey` interface:
```typescript
export interface Journey {
  slug: string;
  domain: JourneyDomain;
  title: string;
  // ... rest unchanged
}
```

- [ ] **Step 4: Add `domain` to raw journey type in data/index.ts**

In `src/data/index.ts`, add `domain: string;` to the `RawJourney` interface.

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (domain flows through the existing `...j` spread in `transformJourneys`)

- [ ] **Step 6: Commit**

```bash
git add src/types/journey.ts src/data/index.ts
git commit -m "feat: add domain field to journey types and data layer"
```

---

### Task 2: Create domain configuration and data helpers

**Files:**
- Create: `src/constants/domains.ts`
- Modify: `src/data/index.ts`

- [ ] **Step 1: Create domain config**

Create `src/constants/domains.ts`:

```typescript
export interface DomainConfig {
  slug: string;
  label: string;
  description: string;
  order: number;
}

export const DOMAINS: DomainConfig[] = [
  { slug: 'auth', label: 'Authentication', description: 'Signup, login, password management, route protection', order: 0 },
  { slug: 'shopping', label: 'Shopping', description: 'Browse, search, discovery, recently viewed', order: 1 },
  { slug: 'cart', label: 'Cart & Checkout', description: 'Guest cart, authenticated cart, checkout flow', order: 2 },
  { slug: 'account', label: 'Account', description: 'Settings, addresses, deletion, onboarding', order: 3 },
  { slug: 'shops', label: 'Shops', description: 'Create, settings, roles, invites, members, ownership', order: 4 },
  { slug: 'listings', label: 'Listings', description: 'Lifecycle management, social sharing', order: 5 },
  { slug: 'identity', label: 'Identity', description: 'Context switching, seller context', order: 6 },
];

export function getDomainConfig(slug: string): DomainConfig | undefined {
  return DOMAINS.find((d) => d.slug === slug);
}
```

- [ ] **Step 2: Add data helper functions to src/data/index.ts**

Add these exports after the existing journey helpers:

```typescript
import { DOMAINS } from '@/constants/domains';
import type { DomainConfig } from '@/constants/domains';

export interface DomainWithStats extends DomainConfig {
  journeyCount: number;
  stepCount: number;
  decisionCount: number;
  builtPercent: number;
}

export function getDomains(): DomainWithStats[] {
  return DOMAINS.map((d) => {
    const dJourneys = journeys.filter((j) => j.domain === d.slug);
    const allNodes = dJourneys.flatMap((j) => j.nodes);
    const steps = allNodes.filter((n) => n.type === 'step');
    const built = steps.filter((s) => s.status === 'built' || s.status === 'tested').length;
    const total = steps.length;
    return {
      ...d,
      journeyCount: dJourneys.length,
      stepCount: total,
      decisionCount: allNodes.filter((n) => n.type === 'decision').length,
      builtPercent: total > 0 ? Math.round((built / total) * 100) : 0,
    };
  }).filter((d) => d.journeyCount > 0);
}

export function getJourneysByDomain(domain: string): Journey[] {
  return journeys.filter((j) => j.domain === domain);
}

export function getDomainSlugs(): string[] {
  return getDomains().map((d) => d.slug);
}
```

Update the existing `getJourney` to also accept domain (backwards compat):

```typescript
export function getJourney(slugOrDomain: string, slug?: string): Journey | undefined {
  if (slug) {
    return journeys.find((j) => j.domain === slugOrDomain && j.slug === slug);
  }
  return journeys.find((j) => j.slug === slugOrDomain);
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/constants/domains.ts src/data/index.ts
git commit -m "feat: add domain config and journey grouping helpers"
```

---

### Task 3: Create Breadcrumb component

**Files:**
- Create: `src/components/ui/breadcrumb/index.tsx`
- Create: `src/components/ui/breadcrumb/breadcrumb.module.scss`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Create breadcrumb SCSS module**

Create `src/components/ui/breadcrumb/breadcrumb.module.scss`:

```scss
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-200);
  color: var(--text-dim);
  margin-bottom: 20px;
  animation: fadeIn 200ms ease-out;
}

.link {
  color: var(--color-primary-400);
  text-decoration: none;
  opacity: 0.6;
  transition: opacity var(--transition-fast);

  &:hover {
    opacity: 1;
  }
}

.separator {
  font-size: var(--font-size-100);
  color: var(--text-dim);
  opacity: 0.5;
}

.current {
  color: var(--text-secondary);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 2: Create breadcrumb component**

Create `src/components/ui/breadcrumb/index.tsx`:

```tsx
import Link from 'next/link';
import styles from './breadcrumb.module.scss';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
}

export function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <nav className={styles.breadcrumb}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={seg.label} style={{ display: 'contents' }}>
            {i > 0 && <span className={styles.separator}>›</span>}
            {isLast || !seg.href ? (
              <span className={styles.current}>{seg.label}</span>
            ) : (
              <Link href={seg.href} className={styles.link}>{seg.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Add to barrel export**

In `src/components/ui/index.ts`, add:
```typescript
export { Breadcrumb } from './breadcrumb';
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/breadcrumb/ src/components/ui/index.ts
git commit -m "feat: add Breadcrumb UI component"
```

---

### Task 4: Create DomainGrid component

**Files:**
- Create: `src/features/journeys/domain-grid/index.tsx`
- Create: `src/features/journeys/domain-grid/domain-grid.module.scss`

- [ ] **Step 1: Create domain grid SCSS module**

Create `src/features/journeys/domain-grid/domain-grid.module.scss`:

```scss
.container {
  padding: 28px 32px;
  overflow-y: auto;
  height: 100%;
}

.header {
  margin-bottom: 24px;
}

.title {
  font-family: var(--font-family-serif);
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.subtitle {
  font-size: var(--font-size-200);
  color: var(--text-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.card {
  background: rgba(15, 19, 25, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 18px 20px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  text-decoration: none;
  display: block;
  transition:
    border-color 200ms var(--ease-out),
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out);

  &:hover {
    border-color: var(--border-medium);
    transform: scale(1.01);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.cardName {
  font-family: var(--font-family-serif);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.cardCount {
  font-size: var(--font-size-100);
  font-family: var(--font-family-mono);
  color: var(--text-dim);
}

.cardDesc {
  font-size: var(--font-size-200);
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 14px;
  opacity: 0.7;
}

.cardStats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statGroup {
  display: flex;
  gap: 10px;
  font-size: var(--font-size-100);
  font-family: var(--font-family-mono);
  color: var(--text-dim);
}

.coveragePercent {
  font-size: var(--font-size-100);
  font-family: var(--font-family-mono);
}

.progressTrack {
  height: 2px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 1px;
  margin-top: 8px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  border-radius: 1px;
  transition: width 600ms var(--ease-out);
}
```

- [ ] **Step 2: Create DomainGrid component**

Create `src/features/journeys/domain-grid/index.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DomainWithStats } from '@/data';
import styles from './domain-grid.module.scss';

interface DomainGridProps {
  domains: DomainWithStats[];
}

function coverageColor(percent: number): string {
  if (percent >= 75) return 'rgba(61,140,117,0.7)';
  if (percent >= 50) return 'rgba(226,119,57,0.7)';
  return 'rgba(106,104,96,0.5)';
}

export function DomainGrid({ domains }: DomainGridProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Journeys</h2>
        <p className={styles.subtitle}>
          {domains.length} domains · {domains.reduce((s, d) => s + d.journeyCount, 0)} journeys
        </p>
      </div>

      <div className={styles.grid}>
        {domains.map((d, i) => (
          <Link
            key={d.slug}
            href={`/journeys/${d.slug}`}
            className={styles.card}
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateY(0)' : 'translateY(8px)',
              transition: `opacity 300ms ease-out ${i * 50}ms, transform 300ms ease-out ${i * 50}ms, border-color 200ms ease-out, box-shadow 200ms ease-out`,
            }}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardName}>{d.label}</span>
              <span className={styles.cardCount}>{d.journeyCount}</span>
            </div>
            <div className={styles.cardDesc}>{d.description}</div>
            <div className={styles.cardStats}>
              <div className={styles.statGroup}>
                <span>{d.stepCount} steps</span>
                <span>{d.decisionCount} decisions</span>
              </div>
              <span className={styles.coveragePercent} style={{ color: coverageColor(d.builtPercent) }}>
                {d.builtPercent}%
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{
                  width: entered ? `${d.builtPercent}%` : '0%',
                  background: coverageColor(d.builtPercent),
                  transitionDelay: `${i * 50 + 300}ms`,
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/journeys/domain-grid/
git commit -m "feat: add DomainGrid component with stagger animations"
```

---

### Task 5: Create DomainJourneyList component

**Files:**
- Create: `src/features/journeys/domain-journey-list/index.tsx`
- Create: `src/features/journeys/domain-journey-list/domain-journey-list.module.scss`

- [ ] **Step 1: Create journey list SCSS module**

Create `src/features/journeys/domain-journey-list/domain-journey-list.module.scss`:

```scss
.container {
  padding: 28px 32px;
  overflow-y: auto;
  height: 100%;
}

.domainHeader {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.domainTitle {
  font-family: var(--font-family-serif);
  font-size: 18px;
  color: var(--text-primary);
}

.domainDesc {
  font-size: var(--font-size-200);
  color: var(--text-muted);
  margin-top: 4px;
}

.domainStats {
  display: flex;
  gap: 14px;
  font-size: var(--font-size-100);
  font-family: var(--font-family-mono);
  color: var(--text-dim);
  margin-top: 8px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  gap: 14px;
  background: rgba(255, 255, 255, 0.02);
  text-decoration: none;
  transition:
    background 150ms var(--ease-out),
    border-color 150ms var(--ease-out);

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
}

.rowContent {
  flex: 1;
  min-width: 0;
}

.rowTitle {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.rowDesc {
  font-size: var(--font-size-100);
  color: var(--text-muted);
  margin-top: 2px;
  opacity: 0.7;
}

.personaBadge {
  font-size: var(--font-size-100);
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.stepCount {
  font-size: var(--font-size-100);
  font-family: var(--font-family-mono);
  color: var(--text-dim);
  width: 55px;
  text-align: right;
  flex-shrink: 0;
}

.progressTrack {
  width: 50px;
  height: 2px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  flex-shrink: 0;
}

.progressFill {
  height: 100%;
  border-radius: 1px;
  transition: width 600ms var(--ease-out);
}

.chevron {
  font-size: var(--font-size-100);
  color: var(--text-dim);
  opacity: 0.3;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Create DomainJourneyList component**

Create `src/features/journeys/domain-journey-list/index.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Journey } from '@/types/journey';
import { PERSONA_CONFIG } from '@/types/journey';
import type { DomainConfig } from '@/constants/domains';
import { Breadcrumb } from '@/components/ui';
import styles from './domain-journey-list.module.scss';

interface DomainJourneyListProps {
  domain: DomainConfig;
  journeys: Journey[];
  stats: { stepCount: number; builtPercent: number };
}

function coverageColor(percent: number): string {
  if (percent >= 75) return 'rgba(61,140,117,0.7)';
  if (percent >= 50) return 'rgba(226,119,57,0.7)';
  return 'rgba(106,104,96,0.5)';
}

function journeyCoverage(journey: Journey): number {
  const steps = journey.nodes.filter((n) => n.type === 'step');
  const built = steps.filter((s) => s.status === 'built' || s.status === 'tested').length;
  return steps.length > 0 ? Math.round((built / steps.length) * 100) : 0;
}

export function DomainJourneyList({ domain, journeys, stats }: DomainJourneyListProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  return (
    <div className={styles.container}>
      <Breadcrumb segments={[
        { label: 'Journeys', href: '/journeys' },
        { label: domain.label },
      ]} />

      <div className={styles.domainHeader}>
        <div className={styles.domainTitle}>{domain.label}</div>
        <div className={styles.domainDesc}>{domain.description}</div>
        <div className={styles.domainStats}>
          <span>{journeys.length} journeys</span>
          <span>{stats.stepCount} steps</span>
          <span style={{ color: coverageColor(stats.builtPercent) }}>{stats.builtPercent}% built</span>
        </div>
      </div>

      <div className={styles.list}>
        {journeys.map((j, i) => {
          const persona = PERSONA_CONFIG[j.persona];
          const stepCount = j.nodes.filter((n) => n.type === 'step').length;
          const coverage = journeyCoverage(j);

          return (
            <Link
              key={j.slug}
              href={`/journeys/${domain.slug}/${j.slug}`}
              className={styles.row}
              style={{
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateY(0)' : 'translateY(4px)',
                transition: `opacity 200ms ease-out ${i * 30}ms, transform 200ms ease-out ${i * 30}ms, background 150ms ease-out`,
              }}
            >
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>{j.title}</div>
                <div className={styles.rowDesc}>{j.description}</div>
              </div>
              <span
                className={styles.personaBadge}
                style={{ background: `${persona.color}15`, color: `${persona.color}99` }}
              >
                {persona.label}
              </span>
              <span className={styles.stepCount}>{stepCount} steps</span>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: entered ? `${coverage}%` : '0%',
                    background: coverageColor(coverage),
                    transitionDelay: `${i * 30 + 200}ms`,
                  }}
                />
              </div>
              <span className={styles.chevron}>›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/journeys/domain-journey-list/
git commit -m "feat: add DomainJourneyList component with stagger animations"
```

---

### Task 6: Restructure routes

**Files:**
- Modify: `src/app/journeys/page.tsx`
- Create: `src/app/journeys/[domain]/page.tsx`
- Create: `src/app/journeys/[domain]/[slug]/page.tsx`
- Create: `src/app/journeys/[domain]/[slug]/client.tsx`
- Delete: `src/app/journeys/[slug]/page.tsx`
- Delete: `src/app/journeys/[slug]/client.tsx`

- [ ] **Step 1: Update `/journeys` index to render DomainGrid**

Replace `src/app/journeys/page.tsx`:

```tsx
import { getDomains } from '@/data';
import { DomainGrid } from '@/features/journeys/domain-grid';

export default function JourneysIndex() {
  const domains = getDomains();
  return <DomainGrid domains={domains} />;
}
```

- [ ] **Step 2: Create domain list page**

Create `src/app/journeys/[domain]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getDomains, getJourneysByDomain } from '@/data';
import { getDomainConfig } from '@/constants/domains';
import { DomainJourneyList } from '@/features/journeys/domain-journey-list';

export function generateStaticParams() {
  return getDomains().map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const config = getDomainConfig(domain);
  return { title: config?.label ?? 'Journeys' };
}

export default async function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const config = getDomainConfig(domain);
  if (!config) notFound();

  const journeys = getJourneysByDomain(domain);
  const allSteps = journeys.flatMap((j) => j.nodes.filter((n) => n.type === 'step'));
  const built = allSteps.filter((s) => s.status === 'built' || s.status === 'tested').length;
  const builtPercent = allSteps.length > 0 ? Math.round((built / allSteps.length) * 100) : 0;

  return (
    <DomainJourneyList
      domain={config}
      journeys={journeys}
      stats={{ stepCount: allSteps.length, builtPercent }}
    />
  );
}
```

- [ ] **Step 3: Create journey canvas page (new route)**

Create `src/app/journeys/[domain]/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getDomains, getJourneysByDomain, getJourney } from '@/data';
import { JourneyPageClient } from './client';

export function generateStaticParams() {
  return getDomains().flatMap((d) =>
    getJourneysByDomain(d.slug).map((j) => ({ domain: d.slug, slug: j.slug })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string; slug: string }> }) {
  const { domain, slug } = await params;
  const journey = getJourney(domain, slug);
  return { title: journey?.title ?? 'Journey' };
}

export default async function JourneyPage({ params }: { params: Promise<{ domain: string; slug: string }> }) {
  const { domain, slug } = await params;
  const journey = getJourney(domain, slug);
  if (!journey) notFound();
  return <JourneyPageClient journey={journey} domain={domain} />;
}
```

- [ ] **Step 4: Create client component with breadcrumb**

Create `src/app/journeys/[domain]/[slug]/client.tsx`:

```tsx
'use client';

import { useState, useCallback } from 'react';
import type { Journey, StepLayer, StepStatus } from '@/types/journey';
import { getDomainConfig } from '@/constants/domains';
import { Breadcrumb } from '@/components/ui';
import { JourneyCanvas } from '@/features/journeys/journey-canvas';

const ALL_LAYERS: StepLayer[] = ['client', 'server', 'database', 'background', 'email', 'external'];
const ALL_STATUSES: StepStatus[] = ['planned', 'built', 'tested'];

interface JourneyPageClientProps {
  journey: Journey;
  domain: string;
}

export function JourneyPageClient({ journey, domain }: JourneyPageClientProps) {
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(ALL_LAYERS));
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(new Set(ALL_STATUSES));
  const domainConfig = getDomainConfig(domain);

  const toggleLayer = useCallback((layer: StepLayer) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const toggleStatus = useCallback((status: StepStatus) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <Breadcrumb segments={[
          { label: 'Journeys', href: '/journeys' },
          { label: domainConfig?.label ?? domain, href: `/journeys/${domain}` },
          { label: journey.title },
        ]} />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <JourneyCanvas
          journey={journey}
          visibleLayers={visibleLayers}
          visibleStatuses={visibleStatuses}
          onToggleLayer={toggleLayer}
          onToggleStatus={toggleStatus}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Delete old route files**

```bash
rm src/app/journeys/\[slug\]/page.tsx
rm src/app/journeys/\[slug\]/client.tsx
rmdir src/app/journeys/\[slug\]
```

- [ ] **Step 6: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS — all routes generate statically

- [ ] **Step 7: Commit**

```bash
git add src/app/journeys/
git commit -m "feat: restructure journey routes to domain/slug pattern with breadcrumbs"
```

---

### Task 7: Remove sidebar journey subnav

**Files:**
- Modify: `src/components/layout/sidebar/index.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Remove journey subnav from sidebar**

In `src/components/layout/sidebar/index.tsx`:

Remove the `journeys` prop from `SidebarProps` (keep `lifecycles`):
```typescript
interface SidebarProps {
  lifecycles: Lifecycle[];
}
```

Remove the `Journey` type import and `PERSONA_CONFIG` import.

Remove the entire `{showJourneySubnav && (...)}` block (lines 67-88).

Remove `showJourneySubnav` variable.

Update the component signature:
```typescript
export function Sidebar({ lifecycles }: SidebarProps) {
```

- [ ] **Step 2: Update layout.tsx**

In `src/app/layout.tsx`:

Remove `getAllJourneys` from the import:
```typescript
import { lifecycles } from '@/data';
```

Remove `const journeys = getAllJourneys();` line.

Update the Sidebar prop:
```tsx
<Sidebar lifecycles={lifecycles} />
```

- [ ] **Step 3: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar/ src/app/layout.tsx
git commit -m "feat: remove journey subnav from sidebar — navigation moved to domain tiles"
```

---

### Task 8: Update root page redirect

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update root redirect**

The root page currently redirects to the first journey. Update to redirect to the domain grid:

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/journeys');
}
```

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: PASS — all pages generate

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "chore: update root redirect to journeys domain grid"
```

---

### Task 9: Add domain field to nessi-web-app journey files and sync

**Files:**
- Modify: All 29 journey JSON files in `/Users/kyleholloway/Documents/Development/nessi-web-app/docs/journeys/`
- Modify: `src/data/generated/journeys.json` (manual sync or re-extract)

- [ ] **Step 1: Add domain to each journey JSON in nessi-web-app**

Run a script or manually add the `"domain"` field to each file per the mapping in Task 1 Step 2.

- [ ] **Step 2: Commit nessi-web-app changes**

```bash
cd /Users/kyleholloway/Documents/Development/nessi-web-app
git add docs/journeys/
git commit -m "docs: add domain field to all journey files"
git push
```

- [ ] **Step 3: Sync data to nessi-docs**

Re-run the data sync (GitHub Action or manual copy) so `src/data/generated/journeys.json` has the domain field.

- [ ] **Step 4: Run full build**

```bash
cd /Users/kyleholloway/Documents/Development/nessi-docs
pnpm build
```

Expected: All domain pages, journey list pages, and canvas pages generate statically.

- [ ] **Step 5: Commit**

```bash
git add src/data/generated/
git commit -m "data: sync journeys with domain field"
```

---

### Task 10: Final verification and cleanup

- [ ] **Step 1: Verify all routes**

Run `pnpm build` and check output:
- `/journeys` → domain grid (static)
- `/journeys/auth` → journey list (SSG)
- `/journeys/auth/login` → canvas (SSG)
- All other domain/slug combos generate

- [ ] **Step 2: Verify sidebar**

- "Journeys" is a single nav item linking to `/journeys`
- No journey subnav appears when on journey pages
- Lifecycle subnav still works

- [ ] **Step 3: Verify navigation flow**

- Domain grid → click card → journey list with breadcrumb
- Journey list → click row → canvas with breadcrumb
- Breadcrumb "Journeys" → back to grid
- Breadcrumb domain name → back to domain list

- [ ] **Step 4: Verify animations**

- Domain cards stagger-enter
- Progress bars animate from 0%
- Journey rows stagger-enter
- Card hover: border brightens, subtle scale, shadow

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: journey domain tiles navigation — complete"
git push
```
