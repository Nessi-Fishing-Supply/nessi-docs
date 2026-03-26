# Nessi Docs Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 new features to nessi-docs: Feature Readiness Dashboard, Permissions Matrix, Entity Relationship Diagram, Error Catalog, Config Reference, Onboarding Tracker, Changelog, and enhanced Search.

**Architecture:** Each feature follows the established pattern — a data file in `src/data/`, a type in `src/types/`, a page in `src/app/`, a feature component in `src/features/`, a sidebar nav entry, and search index entries. All data is static (build-time). All list pages are `'use client'` components using `useDocsContext` for detail panel selection. Styles use SCSS Modules with the existing dark theme CSS custom properties.

**Tech Stack:** Next.js 16 (App Router, SSG), TypeScript, SCSS Modules, react-icons (HiOutline\* icon set)

---

## File Structure

### New Files (by task)

**Task 1 — Feature Readiness:**

- `src/types/feature.ts` — `Feature`, `FeatureStatus` types
- `src/data/features.ts` — All 16 feature domains with status, counts, links
- `src/app/features/page.tsx` — Page route
- `src/features/feature-readiness/feature-list/index.tsx` — List component
- `src/features/feature-readiness/feature-list/feature-list.module.scss` — Styles

**Task 2 — Permissions Matrix:**

- `src/types/permission.ts` — `Role`, `Permission`, `PermissionLevel` types
- `src/data/permissions.ts` — 3 system roles with permission data
- `src/app/permissions/page.tsx` — Page route
- `src/features/permissions/permissions-matrix/index.tsx` — Matrix component
- `src/features/permissions/permissions-matrix/permissions-matrix.module.scss` — Styles

**Task 3 — Entity Relationship Diagram:**

- `src/data/entity-relationships.ts` — FK relationships between entities
- `src/app/data-model/erd/page.tsx` — Page route (nested under data-model)
- `src/features/data-model/erd-canvas/index.tsx` — Canvas component
- `src/features/data-model/erd-canvas/erd-canvas.module.scss` — Styles

**Task 4 — Error Catalog:**

- `src/app/errors/page.tsx` — Page route
- `src/features/errors/error-catalog/index.tsx` — Catalog component
- `src/features/errors/error-catalog/error-catalog.module.scss` — Styles

**Task 5 — Config Reference:**

- `src/types/config-ref.ts` — `ConfigEnum` type
- `src/data/config-reference.ts` — All enums/options
- `src/app/config/page.tsx` — Page route
- `src/features/config/config-list/index.tsx` — List component
- `src/features/config/config-list/config-list.module.scss` — Styles

**Task 6 — Onboarding Tracker:**

- `src/data/onboarding.ts` — Onboarding steps data
- `src/app/onboarding/page.tsx` — Page route
- `src/features/onboarding/onboarding-tracker/index.tsx` — Tracker component
- `src/features/onboarding/onboarding-tracker/onboarding-tracker.module.scss` — Styles

**Task 7 — Changelog:**

- `src/data/changelog.ts` — Changelog entries
- `src/app/changelog/page.tsx` — Page route
- `src/features/changelog/changelog-feed/index.tsx` — Feed component
- `src/features/changelog/changelog-feed/changelog-feed.module.scss` — Styles

**Task 8 — Search Enhancement + Sidebar Update:**

- Modify: `src/features/search/search-index.ts` — Add new data types
- Modify: `src/components/layout/sidebar/index.tsx` — Add nav items
- Modify: `src/types/docs-context.ts` — Add new SelectedItem variants
- Modify: `src/components/layout/detail-panel/index.tsx` — Add new panels
- `src/components/layout/detail-panel/panels/feature-panel.tsx` — Feature detail
- `src/components/layout/detail-panel/panels/permission-panel.tsx` — Role detail
- `src/components/layout/detail-panel/panels/error-panel.tsx` — Error detail

### Modified Files

- `src/components/layout/sidebar/index.tsx` — Add 6 new nav items
- `src/features/search/search-index.ts` — Index new data types
- `src/types/docs-context.ts` — Add SelectedItem variants
- `src/components/layout/detail-panel/index.tsx` — Render new panels
- `src/data/index.ts` — Export new data

---

## Task 1: Feature Readiness Dashboard

**Files:**

- Create: `src/types/feature.ts`
- Create: `src/data/features.ts`
- Create: `src/app/features/page.tsx`
- Create: `src/features/feature-readiness/feature-list/index.tsx`
- Create: `src/features/feature-readiness/feature-list/feature-list.module.scss`

- [ ] **Step 1: Create feature types**

```typescript
// src/types/feature.ts
export type FeatureStatus = 'built' | 'in-progress' | 'stubbed' | 'planned';

export interface FeatureLink {
  type: 'journey' | 'api-group' | 'entity' | 'lifecycle';
  label: string;
  href: string;
}

export interface Feature {
  slug: string;
  name: string;
  status: FeatureStatus;
  description: string;
  componentCount: number;
  endpointCount: number;
  journeyCoverage: boolean;
  links: FeatureLink[];
}

export const STATUS_COLORS: Record<FeatureStatus, string> = {
  built: '#3d8c75',
  'in-progress': '#b86e0a',
  stubbed: '#78756f',
  planned: '#5c5a55',
};
```

- [ ] **Step 2: Create features data**

```typescript
// src/data/features.ts
import type { Feature } from '@/types/feature';

export const features: Feature[] = [
  {
    slug: 'auth',
    name: 'Authentication',
    status: 'built',
    description:
      'Email/OTP signup, login, password reset, account deletion, session management via Supabase Auth with cookie sessions.',
    componentCount: 8,
    endpointCount: 4,
    journeyCoverage: true,
    links: [
      { type: 'journey', label: 'Signup Journey', href: '/journeys/signup' },
      { type: 'api-group', label: 'Auth API', href: '/api-map#authentication' },
      { type: 'lifecycle', label: 'Member Lifecycle', href: '/lifecycles/member' },
    ],
  },
  {
    slug: 'members',
    name: 'Members & Profiles',
    status: 'built',
    description:
      'User profiles with avatar upload, bio, species/technique tags, home state, seller toggle, and onboarding wizard.',
    componentCount: 12,
    endpointCount: 3,
    journeyCoverage: true,
    links: [
      { type: 'journey', label: 'Onboarding Journey', href: '/journeys/onboarding' },
      { type: 'api-group', label: 'Members API', href: '/api-map#members' },
      { type: 'entity', label: 'members table', href: '/data-model' },
    ],
  },
  {
    slug: 'listings',
    name: 'Listings',
    status: 'built',
    description:
      'Full listing lifecycle: create, edit, draft management, photo upload (WebP), search, autocomplete, recommendations.',
    componentCount: 44,
    endpointCount: 13,
    journeyCoverage: true,
    links: [
      { type: 'journey', label: 'Create Listing Journey', href: '/journeys/create-listing' },
      { type: 'api-group', label: 'Listings CRUD', href: '/api-map#listings---crud' },
      {
        type: 'api-group',
        label: 'Search & Discovery',
        href: '/api-map#listings---search---discovery',
      },
      { type: 'lifecycle', label: 'Listing Lifecycle', href: '/lifecycles/listing' },
      { type: 'entity', label: 'listings table', href: '/data-model' },
    ],
  },
  {
    slug: 'cart',
    name: 'Shopping Cart',
    status: 'built',
    description:
      'Guest and authenticated cart with merge-on-login, 30-day expiry, price tracking at add time, validation.',
    componentCount: 6,
    endpointCount: 8,
    journeyCoverage: true,
    links: [
      { type: 'journey', label: 'Guest Cart Journey', href: '/journeys/guest-cart' },
      { type: 'api-group', label: 'Cart API', href: '/api-map#cart' },
      { type: 'lifecycle', label: 'Cart Item Lifecycle', href: '/lifecycles/cart-item' },
      { type: 'entity', label: 'cart_items table', href: '/data-model' },
    ],
  },
  {
    slug: 'shops',
    name: 'Shops',
    status: 'built',
    description:
      'Shop creation, member management with RBAC, invites with token-based acceptance, ownership transfer, slug management.',
    componentCount: 18,
    endpointCount: 19,
    journeyCoverage: true,
    links: [
      { type: 'journey', label: 'Shop Creation Journey', href: '/journeys/shop-creation' },
      { type: 'journey', label: 'Shop Invite Journey', href: '/journeys/shop-invite' },
      { type: 'api-group', label: 'Shops CRUD', href: '/api-map#shops---crud' },
      { type: 'api-group', label: 'Members & Invites', href: '/api-map#shops---members---invites' },
      { type: 'lifecycle', label: 'Shop Invite Lifecycle', href: '/lifecycles/shop-invite' },
      { type: 'lifecycle', label: 'Ownership Transfer', href: '/lifecycles/ownership-transfer' },
    ],
  },
  {
    slug: 'context',
    name: 'Context Switching',
    status: 'built',
    description:
      'Identity switching between member and shop context via Zustand store. Controls which entity the user acts as.',
    componentCount: 3,
    endpointCount: 0,
    journeyCoverage: false,
    links: [],
  },
  {
    slug: 'addresses',
    name: 'Addresses',
    status: 'built',
    description: 'Saved shipping addresses with 5-address cap, default management, Yup validation.',
    componentCount: 4,
    endpointCount: 5,
    journeyCoverage: false,
    links: [
      { type: 'api-group', label: 'Addresses API', href: '/api-map#addresses' },
      { type: 'entity', label: 'addresses table', href: '/data-model' },
    ],
  },
  {
    slug: 'recently-viewed',
    name: 'Recently Viewed',
    status: 'built',
    description: 'Tracks viewed listing IDs with guest/authenticated merge. Capped at 50 per user.',
    componentCount: 2,
    endpointCount: 3,
    journeyCoverage: false,
    links: [
      { type: 'api-group', label: 'Recently Viewed API', href: '/api-map#recently-viewed' },
      { type: 'entity', label: 'recently_viewed table', href: '/data-model' },
    ],
  },
  {
    slug: 'search',
    name: 'Search & Discovery',
    status: 'built',
    description:
      'Full-text search with trigram fallback, autocomplete from 3 sources, popularity tracking.',
    componentCount: 5,
    endpointCount: 4,
    journeyCoverage: false,
    links: [
      { type: 'api-group', label: 'Search API', href: '/api-map#listings---search---discovery' },
      { type: 'entity', label: 'search_suggestions table', href: '/data-model' },
    ],
  },
  {
    slug: 'email',
    name: 'Email',
    status: 'built',
    description:
      'Resend client integration with branded email templates for invites, transfers, and notifications.',
    componentCount: 2,
    endpointCount: 0,
    journeyCoverage: false,
    links: [],
  },
  {
    slug: 'shared',
    name: 'Shared Utilities',
    status: 'built',
    description:
      'Shared hooks (use-form, use-form-state), utilities (format price, calculate fees), and types.',
    componentCount: 6,
    endpointCount: 0,
    journeyCoverage: false,
    links: [],
  },
  {
    slug: 'messaging',
    name: 'Messaging',
    status: 'planned',
    description: 'Buyer-seller messaging system. Not yet implemented.',
    componentCount: 0,
    endpointCount: 0,
    journeyCoverage: false,
    links: [],
  },
  {
    slug: 'orders',
    name: 'Orders',
    status: 'planned',
    description: 'Order processing, payment capture, shipping coordination. Not yet implemented.',
    componentCount: 0,
    endpointCount: 0,
    journeyCoverage: false,
    links: [],
  },
  {
    slug: 'editorial',
    name: 'Editorial',
    status: 'planned',
    description:
      'Content management for fishing guides, tips, and editorial content. Not yet implemented.',
    componentCount: 0,
    endpointCount: 0,
    journeyCoverage: false,
    links: [],
  },
  {
    slug: 'dashboard',
    name: 'Dashboard Home',
    status: 'stubbed',
    description: 'Main dashboard landing page with activity feed and quick actions. Stub exists.',
    componentCount: 1,
    endpointCount: 0,
    journeyCoverage: false,
    links: [],
  },
  {
    slug: 'payments',
    name: 'Payments (Stripe)',
    status: 'planned',
    description:
      'Stripe Connect for sellers, payment processing, fee calculation. Preconditions check exists.',
    componentCount: 0,
    endpointCount: 0,
    journeyCoverage: false,
    links: [],
  },
];
```

- [ ] **Step 3: Create page route**

```typescript
// src/app/features/page.tsx
import { features } from '@/data/features';
import { FeatureList } from '@/features/feature-readiness/feature-list';

export const metadata = { title: 'Features' };

export default function FeaturesPage() {
  return <FeatureList features={features} />;
}
```

- [ ] **Step 4: Create feature list component**

```tsx
// src/features/feature-readiness/feature-list/index.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { Feature } from '@/types/feature';
import { STATUS_COLORS } from '@/types/feature';
import { useDocsContext } from '@/providers/docs-provider';
import styles from './feature-list.module.scss';

interface FeatureListProps {
  features: Feature[];
}

export function FeatureList({ features }: FeatureListProps) {
  const { setSelectedItem } = useDocsContext();

  const stats = useMemo(() => {
    const total = features.length;
    const built = features.filter((f) => f.status === 'built').length;
    const inProgress = features.filter((f) => f.status === 'in-progress').length;
    const stubbed = features.filter((f) => f.status === 'stubbed').length;
    const planned = features.filter((f) => f.status === 'planned').length;
    const totalComponents = features.reduce((s, f) => s + f.componentCount, 0);
    const totalEndpoints = features.reduce((s, f) => s + f.endpointCount, 0);
    const withJourneys = features.filter((f) => f.journeyCoverage).length;
    return {
      total,
      built,
      inProgress,
      stubbed,
      planned,
      totalComponents,
      totalEndpoints,
      withJourneys,
    };
  }, [features]);

  const grouped = useMemo(() => {
    const order: Feature['status'][] = ['built', 'in-progress', 'stubbed', 'planned'];
    const labels: Record<string, string> = {
      built: 'Built',
      'in-progress': 'In Progress',
      stubbed: 'Stubbed',
      planned: 'Planned',
    };
    return order
      .filter((s) => features.some((f) => f.status === s))
      .map((s) => ({
        status: s,
        label: labels[s],
        color: STATUS_COLORS[s],
        items: features.filter((f) => f.status === s),
      }));
  }, [features]);

  const builtPct = Math.round((stats.built / stats.total) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Feature Readiness</h1>
        <p className={styles.subtitle}>
          {stats.total} features · {stats.totalComponents} components · {stats.totalEndpoints}{' '}
          endpoints
        </p>
      </div>

      {/* Summary bar */}
      <div className={styles.summary}>
        <div className={styles.progressBar}>
          {grouped.map((g) => (
            <div
              key={g.status}
              className={styles.progressSegment}
              style={{
                width: `${(g.items.length / stats.total) * 100}%`,
                background: g.color,
              }}
              title={`${g.label}: ${g.items.length}`}
            />
          ))}
        </div>
        <div className={styles.summaryStats}>
          <span className={styles.summaryItem} style={{ color: STATUS_COLORS.built }}>
            {stats.built} built
          </span>
          {stats.inProgress > 0 && (
            <span className={styles.summaryItem} style={{ color: STATUS_COLORS['in-progress'] }}>
              {stats.inProgress} in progress
            </span>
          )}
          <span className={styles.summaryItem} style={{ color: STATUS_COLORS.stubbed }}>
            {stats.stubbed} stubbed
          </span>
          <span className={styles.summaryItem} style={{ color: STATUS_COLORS.planned }}>
            {stats.planned} planned
          </span>
          <span className={styles.summaryItem}>
            {stats.withJourneys}/{stats.total} with journeys
          </span>
          <span className={styles.summaryPct}>{builtPct}%</span>
        </div>
      </div>

      {/* Grouped features */}
      {grouped.map((group) => (
        <div key={group.status} className={styles.group}>
          <div className={styles.groupHeader}>
            <div className={styles.groupDot} style={{ background: group.color }} />
            <h2 className={styles.groupName}>{group.label}</h2>
            <span className={styles.groupCount}>{group.items.length}</span>
          </div>
          <div className={styles.cards}>
            {group.items.map((feature) => (
              <button
                key={feature.slug}
                className={styles.card}
                onClick={() => setSelectedItem({ type: 'feature', feature })}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardName}>{feature.name}</span>
                  <span className={styles.cardStatus} style={{ color: group.color }}>
                    {group.label}
                  </span>
                </div>
                <p className={styles.cardDesc}>{feature.description}</p>
                <div className={styles.cardMeta}>
                  {feature.componentCount > 0 && <span>{feature.componentCount} components</span>}
                  {feature.endpointCount > 0 && <span>{feature.endpointCount} endpoints</span>}
                  {feature.journeyCoverage && (
                    <span className={styles.hasJourney}>has journey</span>
                  )}
                </div>
                {feature.links.length > 0 && (
                  <div className={styles.cardLinks}>
                    {feature.links.map((link, i) => (
                      <Link
                        key={i}
                        href={link.href}
                        className={styles.cardLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create feature list styles**

```scss
// src/features/feature-readiness/feature-list/feature-list.module.scss
.container {
  padding: 24px 28px;
  overflow-y: auto;
  height: 100%;
}

.header {
  margin-bottom: 20px;
}

.title {
  font-family: var(--font-family-serif);
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-weight: 400;
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

// ─── Summary ───

.summary {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.progressBar {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--bg-raised);
  margin-bottom: 10px;
  gap: 2px;
}

.progressSegment {
  height: 100%;
  border-radius: 3px;
  transition: width 300ms ease;
}

.summaryStats {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.summaryItem {
  font-size: 11px;
  color: var(--text-muted);
}

.summaryPct {
  margin-left: auto;
  font-family: var(--font-family-mono);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

// ─── Groups ───

.group {
  margin-bottom: 28px;
}

.groupHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.groupDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.groupName {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
}

.groupCount {
  font-size: 10px;
  color: var(--text-dim);
  font-family: var(--font-family-mono);
}

// ─── Cards ───

.cards {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card {
  display: block;
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: border-color 150ms ease;

  &:hover {
    border-color: var(--border-medium);
  }
}

.cardTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.cardName {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.cardStatus {
  font-size: 9px;
  font-family: var(--font-family-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.cardDesc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0 0 8px;
}

.cardMeta {
  display: flex;
  gap: 10px;
  font-size: 10px;
  color: var(--text-dim);
  font-family: var(--font-family-mono);
}

.hasJourney {
  color: #3d8c75;
}

.cardLinks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.cardLink {
  font-size: 10px;
  color: #3d8c75;
  text-decoration: none;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(61, 140, 117, 0.06);
  border: 1px solid rgba(61, 140, 117, 0.12);

  &:hover {
    background: rgba(61, 140, 117, 0.12);
  }
}
```

- [ ] **Step 6: Verify it builds**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm build`
Expected: Build succeeds (the page won't be linked yet but should compile)

- [ ] **Step 7: Commit**

```bash
git add src/types/feature.ts src/data/features.ts src/app/features/page.tsx src/features/feature-readiness/
git commit -m "feat: add feature readiness dashboard page"
```

---

## Task 2: Permissions Matrix

**Files:**

- Create: `src/types/permission.ts`
- Create: `src/data/permissions.ts`
- Create: `src/app/permissions/page.tsx`
- Create: `src/features/permissions/permissions-matrix/index.tsx`
- Create: `src/features/permissions/permissions-matrix/permissions-matrix.module.scss`

- [ ] **Step 1: Create permission types**

```typescript
// src/types/permission.ts
export type PermissionLevel = 'full' | 'view' | 'none';
export type PermissionFeature =
  | 'listings'
  | 'pricing'
  | 'orders'
  | 'messaging'
  | 'shop_settings'
  | 'members';

export interface Role {
  slug: string;
  name: string;
  description: string;
  color: string;
  permissions: Record<PermissionFeature, PermissionLevel>;
}

export const PERMISSION_FEATURES: { key: PermissionFeature; label: string; description: string }[] =
  [
    {
      key: 'listings',
      label: 'Listings',
      description: 'Create, edit, and manage product listings',
    },
    { key: 'pricing', label: 'Pricing', description: 'Set and modify listing prices' },
    { key: 'orders', label: 'Orders', description: 'View and manage orders' },
    { key: 'messaging', label: 'Messaging', description: 'Send and receive messages' },
    {
      key: 'shop_settings',
      label: 'Shop Settings',
      description: 'Edit shop name, avatar, banner, slug',
    },
    { key: 'members', label: 'Members', description: 'Invite, remove, and change member roles' },
  ];

export const LEVEL_CONFIG: Record<PermissionLevel, { label: string; color: string }> = {
  full: { label: 'Full', color: '#3d8c75' },
  view: { label: 'View', color: '#b86e0a' },
  none: { label: 'None', color: '#5c5a55' },
};
```

- [ ] **Step 2: Create permissions data**

```typescript
// src/data/permissions.ts
import type { Role } from '@/types/permission';

export const roles: Role[] = [
  {
    slug: 'owner',
    name: 'Owner',
    description: 'Full control over all shop features. Can transfer ownership. One owner per shop.',
    color: '#e27739',
    permissions: {
      listings: 'full',
      pricing: 'full',
      orders: 'full',
      messaging: 'full',
      shop_settings: 'full',
      members: 'full',
    },
  },
  {
    slug: 'manager',
    name: 'Manager',
    description:
      'Operational access to listings, pricing, orders, and messaging. Can view but not change shop settings. Cannot manage members.',
    color: '#b86e0a',
    permissions: {
      listings: 'full',
      pricing: 'full',
      orders: 'full',
      messaging: 'full',
      shop_settings: 'view',
      members: 'none',
    },
  },
  {
    slug: 'contributor',
    name: 'Contributor',
    description:
      'Can create and edit listings only. No access to pricing, orders, messaging, settings, or member management.',
    color: '#78756f',
    permissions: {
      listings: 'full',
      pricing: 'none',
      orders: 'none',
      messaging: 'none',
      shop_settings: 'none',
      members: 'none',
    },
  },
];
```

- [ ] **Step 3: Create page route**

```typescript
// src/app/permissions/page.tsx
import { roles } from '@/data/permissions';
import { PermissionsMatrix } from '@/features/permissions/permissions-matrix';

export const metadata = { title: 'Permissions' };

export default function PermissionsPage() {
  return <PermissionsMatrix roles={roles} />;
}
```

- [ ] **Step 4: Create matrix component**

```tsx
// src/features/permissions/permissions-matrix/index.tsx
'use client';

import type { Role } from '@/types/permission';
import { PERMISSION_FEATURES, LEVEL_CONFIG } from '@/types/permission';
import styles from './permissions-matrix.module.scss';

interface PermissionsMatrixProps {
  roles: Role[];
}

export function PermissionsMatrix({ roles }: PermissionsMatrixProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Permissions Matrix</h1>
        <p className={styles.subtitle}>
          {roles.length} roles · {PERMISSION_FEATURES.length} features · RBAC via shop_roles table
        </p>
      </div>

      {/* Role cards */}
      <div className={styles.roleCards}>
        {roles.map((role) => (
          <div key={role.slug} className={styles.roleCard}>
            <div className={styles.roleName} style={{ color: role.color }}>
              {role.name}
            </div>
            <p className={styles.roleDesc}>{role.description}</p>
          </div>
        ))}
      </div>

      {/* Matrix table */}
      <div className={styles.matrix}>
        <div className={styles.matrixHeader}>
          <div className={styles.featureCol}>Feature</div>
          {roles.map((role) => (
            <div key={role.slug} className={styles.roleCol} style={{ color: role.color }}>
              {role.name}
            </div>
          ))}
        </div>
        {PERMISSION_FEATURES.map((feature) => (
          <div key={feature.key} className={styles.matrixRow}>
            <div className={styles.featureCol}>
              <span className={styles.featureLabel}>{feature.label}</span>
              <span className={styles.featureDesc}>{feature.description}</span>
            </div>
            {roles.map((role) => {
              const level = role.permissions[feature.key];
              const cfg = LEVEL_CONFIG[level];
              return (
                <div key={role.slug} className={styles.roleCol}>
                  <span
                    className={styles.levelBadge}
                    style={{ color: cfg.color, borderColor: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className={styles.notes}>
        <h3 className={styles.notesTitle}>Notes</h3>
        <ul className={styles.notesList}>
          <li>System roles use deterministic UUIDs (…101, …102, …103) and are immutable</li>
          <li>Custom roles per shop are supported in the schema but not yet in the UI</li>
          <li>
            Permission checks use <code>requireShopPermission()</code> server-side
          </li>
          <li>Owner role cannot be assigned via role change — only via ownership transfer</li>
          <li>Members can always leave a shop (self-removal), regardless of permissions</li>
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create matrix styles**

```scss
// src/features/permissions/permissions-matrix/permissions-matrix.module.scss
.container {
  padding: 24px 28px;
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
  font-weight: 400;
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

// ─── Role Cards ───

.roleCards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 28px;
}

.roleCard {
  padding: 14px;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.roleName {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.roleDesc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

// ─── Matrix ───

.matrix {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 28px;
}

.matrixHeader {
  display: grid;
  grid-template-columns: 1fr repeat(3, 100px);
  gap: 0;
  padding: 10px 16px;
  background: var(--bg-raised);
  border-bottom: 1px solid var(--border-medium);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}

.matrixRow {
  display: grid;
  grid-template-columns: 1fr repeat(3, 100px);
  gap: 0;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-subtle);
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.01);
  }
}

.featureCol {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.featureLabel {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.featureDesc {
  font-size: 10px;
  color: var(--text-dim);
}

.roleCol {
  text-align: center;
  font-size: 11px;
}

.levelBadge {
  font-size: 10px;
  font-family: var(--font-family-mono);
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 4px;
  border: 1px solid;
  opacity: 0.85;
}

// ─── Notes ───

.notes {
  padding: 16px;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.notesTitle {
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 8px;
  font-weight: 600;
}

.notesList {
  margin: 0;
  padding: 0 0 0 16px;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.8;

  code {
    font-family: var(--font-family-mono);
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    background: var(--bg-body);
    color: var(--text-secondary);
  }
}
```

- [ ] **Step 6: Verify it builds**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm build`

- [ ] **Step 7: Commit**

```bash
git add src/types/permission.ts src/data/permissions.ts src/app/permissions/page.tsx src/features/permissions/
git commit -m "feat: add permissions matrix page"
```

---

## Task 3: Entity Relationship Diagram

**Files:**

- Create: `src/data/entity-relationships.ts`
- Create: `src/app/data-model/erd/page.tsx`
- Create: `src/features/data-model/erd-canvas/index.tsx`
- Create: `src/features/data-model/erd-canvas/erd-canvas.module.scss`

- [ ] **Step 1: Create entity relationships data**

```typescript
// src/data/entity-relationships.ts

export interface ErdNode {
  id: string;
  label: string;
  badge: string;
  fieldCount: number;
  x: number;
  y: number;
}

export interface ErdEdge {
  from: string;
  to: string;
  label: string;
  cardinality: '1:1' | '1:N' | 'N:M';
  fk: string;
}

export const erdNodes: ErdNode[] = [
  { id: 'members', label: 'members', badge: 'core', fieldCount: 20, x: 400, y: 60 },
  { id: 'shops', label: 'shops', badge: 'core', fieldCount: 16, x: 400, y: 300 },
  { id: 'listings', label: 'listings', badge: 'core', fieldCount: 25, x: 60, y: 180 },
  { id: 'shop_members', label: 'shop_members', badge: 'junction', fieldCount: 5, x: 400, y: 180 },
  { id: 'shop_roles', label: 'shop_roles', badge: 'config', fieldCount: 7, x: 650, y: 180 },
  { id: 'shop_invites', label: 'shop_invites', badge: 'lifecycle', fieldCount: 8, x: 650, y: 300 },
  {
    id: 'shop_ownership_transfers',
    label: 'shop_ownership_transfers',
    badge: 'lifecycle',
    fieldCount: 8,
    x: 650,
    y: 420,
  },
  { id: 'listing_photos', label: 'listing_photos', badge: 'media', fieldCount: 5, x: 60, y: 340 },
  { id: 'cart_items', label: 'cart_items', badge: 'lifecycle', fieldCount: 7, x: 200, y: 420 },
  {
    id: 'recently_viewed',
    label: 'recently_viewed',
    badge: 'tracking',
    fieldCount: 4,
    x: 60,
    y: 60,
  },
  { id: 'addresses', label: 'addresses', badge: 'user', fieldCount: 10, x: 200, y: 60 },
  {
    id: 'search_suggestions',
    label: 'search_suggestions',
    badge: 'discovery',
    fieldCount: 4,
    x: 60,
    y: 480,
  },
  { id: 'slugs', label: 'slugs', badge: 'system', fieldCount: 4, x: 400, y: 420 },
];

export const erdEdges: ErdEdge[] = [
  { from: 'listings', to: 'members', label: 'seller_id', cardinality: '1:N', fk: 'seller_id' },
  { from: 'listings', to: 'shops', label: 'shop_id', cardinality: '1:N', fk: 'shop_id' },
  {
    from: 'listing_photos',
    to: 'listings',
    label: 'listing_id',
    cardinality: '1:N',
    fk: 'listing_id',
  },
  { from: 'shop_members', to: 'shops', label: 'shop_id', cardinality: '1:N', fk: 'shop_id' },
  { from: 'shop_members', to: 'members', label: 'member_id', cardinality: '1:N', fk: 'member_id' },
  { from: 'shop_members', to: 'shop_roles', label: 'role_id', cardinality: '1:N', fk: 'role_id' },
  { from: 'shops', to: 'members', label: 'owner_id', cardinality: '1:N', fk: 'owner_id' },
  { from: 'shop_invites', to: 'shops', label: 'shop_id', cardinality: '1:N', fk: 'shop_id' },
  { from: 'shop_invites', to: 'shop_roles', label: 'role_id', cardinality: '1:N', fk: 'role_id' },
  {
    from: 'shop_invites',
    to: 'members',
    label: 'invited_by',
    cardinality: '1:N',
    fk: 'invited_by',
  },
  {
    from: 'shop_ownership_transfers',
    to: 'shops',
    label: 'shop_id',
    cardinality: '1:N',
    fk: 'shop_id',
  },
  {
    from: 'shop_ownership_transfers',
    to: 'members',
    label: 'from_member_id',
    cardinality: '1:N',
    fk: 'from_member_id',
  },
  { from: 'cart_items', to: 'members', label: 'user_id', cardinality: '1:N', fk: 'user_id' },
  { from: 'cart_items', to: 'listings', label: 'listing_id', cardinality: '1:N', fk: 'listing_id' },
  { from: 'recently_viewed', to: 'members', label: 'user_id', cardinality: '1:N', fk: 'user_id' },
  {
    from: 'recently_viewed',
    to: 'listings',
    label: 'listing_id',
    cardinality: '1:N',
    fk: 'listing_id',
  },
  { from: 'addresses', to: 'members', label: 'user_id', cardinality: '1:N', fk: 'user_id' },
];
```

- [ ] **Step 2: Create ERD page route**

```typescript
// src/app/data-model/erd/page.tsx
import { erdNodes, erdEdges } from '@/data/entity-relationships';
import { ErdCanvas } from '@/features/data-model/erd-canvas';

export const metadata = { title: 'Entity Relationships' };

export default function ErdPage() {
  return <ErdCanvas nodes={erdNodes} edges={erdEdges} />;
}
```

- [ ] **Step 3: Create ERD canvas component**

```tsx
// src/features/data-model/erd-canvas/index.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { ErdNode, ErdEdge } from '@/data/entity-relationships';
import styles from './erd-canvas.module.scss';

const BADGE_COLORS: Record<string, string> = {
  core: '#3d8c75',
  lifecycle: '#b86e0a',
  junction: '#e89048',
  config: '#78756f',
  media: '#e27739',
  tracking: '#1e4a40',
  discovery: '#b86e0a',
  user: '#3d8c75',
  system: '#5c5a55',
};

const NODE_W = 160;
const NODE_H = 52;

interface ErdCanvasProps {
  nodes: ErdNode[];
  edges: ErdEdge[];
}

function getEdgePath(from: ErdNode, to: ErdNode): string {
  const fx = from.x + NODE_W / 2;
  const fy = from.y + NODE_H / 2;
  const tx = to.x + NODE_W / 2;
  const ty = to.y + NODE_H / 2;

  // Simple bezier
  const dx = tx - fx;
  const dy = ty - fy;
  const cx = fx + dx * 0.5;
  const cy = fy;
  const cx2 = tx - dx * 0.5;
  const cy2 = ty;

  return `M ${fx} ${fy} C ${cx} ${cy}, ${cx2} ${cy2}, ${tx} ${ty}`;
}

function getEdgeMidpoint(from: ErdNode, to: ErdNode): { x: number; y: number } {
  return {
    x: (from.x + to.x + NODE_W) / 2,
    y: (from.y + to.y + NODE_H) / 2,
  };
}

export function ErdCanvas({ nodes, edges }: ErdCanvasProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, ErdNode>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  }, [nodes]);

  const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_W + 60;
  const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_H + 60;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Entity Relationships</h1>
          <Link href="/data-model" className={styles.backLink}>
            ← Data Model
          </Link>
        </div>
        <p className={styles.subtitle}>
          {nodes.length} tables · {edges.length} foreign keys
        </p>
      </div>

      <div className={styles.canvas}>
        <svg width={maxX} height={maxY} className={styles.svg}>
          {/* Grid dots */}
          <defs>
            <pattern id="erd-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="rgba(255,255,255,0.04)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#erd-dots)" />

          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;
            const mid = getEdgeMidpoint(from, to);
            return (
              <g key={i}>
                <path
                  d={getEdgePath(from, to)}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                />
                <text x={mid.x} y={mid.y - 4} className={styles.edgeLabel} textAnchor="middle">
                  {edge.fk}
                </text>
                <text
                  x={mid.x}
                  y={mid.y + 10}
                  className={styles.edgeCardinality}
                  textAnchor="middle"
                >
                  {edge.cardinality}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const badgeColor = BADGE_COLORS[node.badge] ?? '#78756f';
            return (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill="var(--bg-raised)"
                  stroke={badgeColor}
                  strokeWidth={1}
                  opacity={0.9}
                />
                <text x={node.x + 12} y={node.y + 22} className={styles.nodeLabel}>
                  {node.label}
                </text>
                <text x={node.x + 12} y={node.y + 38} className={styles.nodeMeta}>
                  {node.badge} · {node.fieldCount} fields
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(BADGE_COLORS).map(([badge, color]) => (
          <span key={badge} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: color }} />
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ERD canvas styles**

```scss
// src/features/data-model/erd-canvas/erd-canvas.module.scss
.container {
  padding: 24px 28px;
  overflow: auto;
  height: 100%;
}

.header {
  margin-bottom: 16px;
}

.headerTop {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.title {
  font-family: var(--font-family-serif);
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-weight: 400;
}

.backLink {
  font-size: 11px;
  color: #3d8c75;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.canvas {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: auto;
  background: var(--bg-body);
  margin-bottom: 16px;
}

.svg {
  display: block;
}

.nodeLabel {
  font-size: 11px;
  font-family: var(--font-family-mono);
  fill: var(--text-primary);
  font-weight: 600;
}

.nodeMeta {
  font-size: 9px;
  fill: var(--text-dim);
}

.edgeLabel {
  font-size: 8px;
  font-family: var(--font-family-mono);
  fill: var(--text-muted);
}

.edgeCardinality {
  font-size: 8px;
  font-family: var(--font-family-mono);
  fill: var(--text-dim);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--text-muted);
}

.legendDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
```

- [ ] **Step 5: Verify it builds**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm build`

- [ ] **Step 6: Commit**

```bash
git add src/data/entity-relationships.ts src/app/data-model/erd/ src/features/data-model/erd-canvas/
git commit -m "feat: add entity relationship diagram page"
```

---

## Task 4: Error Catalog

**Files:**

- Create: `src/app/errors/page.tsx`
- Create: `src/features/errors/error-catalog/index.tsx`
- Create: `src/features/errors/error-catalog/error-catalog.module.scss`

This task reuses existing cross-links.ts functions to aggregate errors. No new data file needed.

- [ ] **Step 1: Create page route**

```typescript
// src/app/errors/page.tsx
import { apiGroups } from '@/data';
import { ErrorCatalog } from '@/features/errors/error-catalog';

export const metadata = { title: 'Error Catalog' };

export default function ErrorsPage() {
  return <ErrorCatalog groups={apiGroups} />;
}
```

- [ ] **Step 2: Create error catalog component**

```tsx
// src/features/errors/error-catalog/index.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { ApiGroup } from '@/types/api-contract';
import type { ErrorCase } from '@/types/journey';
import { getErrorsForEndpoint, getLinksForEndpoint } from '@/data/cross-links';
import styles from './error-catalog.module.scss';

interface ErrorCatalogProps {
  groups: ApiGroup[];
}

interface EndpointErrors {
  method: string;
  path: string;
  description: string;
  errors: ErrorCase[];
  journeyCount: number;
}

export function ErrorCatalog({ groups }: ErrorCatalogProps) {
  const allEndpointErrors = useMemo(() => {
    const result: { groupName: string; endpoints: EndpointErrors[] }[] = [];

    for (const group of groups) {
      const endpoints: EndpointErrors[] = [];
      for (const ep of group.endpoints) {
        const errors = getErrorsForEndpoint(ep.method, ep.path);
        const journeyLinks = getLinksForEndpoint(ep.method, ep.path);
        endpoints.push({
          method: ep.method,
          path: ep.path,
          description: ep.description,
          errors,
          journeyCount: journeyLinks.length,
        });
      }
      result.push({ groupName: group.name, endpoints });
    }

    return result;
  }, [groups]);

  const stats = useMemo(() => {
    let totalEndpoints = 0;
    let withErrors = 0;
    let withoutErrors = 0;
    let totalErrors = 0;
    const statusCounts = new Map<number, number>();

    for (const group of allEndpointErrors) {
      for (const ep of group.endpoints) {
        totalEndpoints++;
        if (ep.errors.length > 0) {
          withErrors++;
          totalErrors += ep.errors.length;
          for (const err of ep.errors) {
            if (err.httpStatus) {
              statusCounts.set(err.httpStatus, (statusCounts.get(err.httpStatus) ?? 0) + 1);
            }
          }
        } else {
          withoutErrors++;
        }
      }
    }

    return { totalEndpoints, withErrors, withoutErrors, totalErrors, statusCounts };
  }, [allEndpointErrors]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Error Catalog</h1>
        <p className={styles.subtitle}>
          {stats.totalErrors} documented errors across {stats.withErrors} endpoints
        </p>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.withErrors}</span>
          <span className={styles.statLabel}>With errors</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: '#b86e0a' }}>
            {stats.withoutErrors}
          </span>
          <span className={styles.statLabel}>No errors documented</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.totalErrors}</span>
          <span className={styles.statLabel}>Total error cases</span>
        </div>
        {Array.from(stats.statusCounts.entries())
          .sort(([a], [b]) => a - b)
          .map(([code, count]) => (
            <div key={code} className={styles.stat}>
              <span className={styles.statValue} style={{ color: '#b84040' }}>
                {count}
              </span>
              <span className={styles.statLabel}>{code} errors</span>
            </div>
          ))}
      </div>

      {/* Groups */}
      {allEndpointErrors.map((group) => {
        const hasErrors = group.endpoints.some((ep) => ep.errors.length > 0);
        return (
          <div key={group.groupName} className={styles.group}>
            <div className={styles.groupHeader}>
              <h2 className={styles.groupName}>{group.groupName}</h2>
              {!hasErrors && <span className={styles.noCoverage}>no error docs</span>}
            </div>
            <div className={styles.endpoints}>
              {group.endpoints.map((ep) => (
                <div key={`${ep.method}-${ep.path}`} className={styles.endpoint}>
                  <div className={styles.endpointHeader}>
                    <span className={`${styles.method} ${styles[ep.method.toLowerCase()]}`}>
                      {ep.method}
                    </span>
                    <span className={styles.path}>{ep.path}</span>
                    {ep.errors.length === 0 && (
                      <span className={styles.noErrors}>no errors documented</span>
                    )}
                    {ep.journeyCount > 0 && (
                      <span className={styles.journeyBadge}>
                        {ep.journeyCount} journey{ep.journeyCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {ep.errors.length > 0 && (
                    <div className={styles.errorList}>
                      {ep.errors.map((err, i) => (
                        <div key={i} className={styles.errorRow}>
                          {err.httpStatus && (
                            <span className={styles.httpBadge}>{err.httpStatus}</span>
                          )}
                          <span className={styles.errorCondition}>{err.condition}</span>
                          <span className={styles.errorResult}>{err.result}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create error catalog styles**

```scss
// src/features/errors/error-catalog/error-catalog.module.scss
.container {
  padding: 24px 28px;
  overflow-y: auto;
  height: 100%;
}

.header {
  margin-bottom: 20px;
}

.title {
  font-family: var(--font-family-serif);
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-weight: 400;
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

// ─── Stats ───

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 16px;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  min-width: 80px;
}

.statValue {
  font-size: 18px;
  font-family: var(--font-family-mono);
  font-weight: 600;
  color: var(--text-primary);
}

.statLabel {
  font-size: 9px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

// ─── Groups ───

.group {
  margin-bottom: 28px;
}

.groupHeader {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.groupName {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
}

.noCoverage {
  font-size: 9px;
  color: #b86e0a;
  font-family: var(--font-family-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

// ─── Endpoints ───

.endpoints {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.endpoint {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.endpointHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
}

.method {
  font-size: 9px;
  font-weight: 700;
  font-family: var(--font-family-mono);
  padding: 2px 8px;
  border-radius: 3px;
  min-width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.get {
  color: #3d8c75;
  background: rgba(61, 140, 117, 0.1);
}
.post {
  color: #e27739;
  background: rgba(226, 119, 57, 0.1);
}
.put {
  color: #b86e0a;
  background: rgba(184, 110, 10, 0.1);
}
.patch {
  color: #e89048;
  background: rgba(232, 144, 72, 0.1);
}
.delete {
  color: #b84040;
  background: rgba(184, 64, 64, 0.1);
}

.path {
  font-size: 11px;
  font-family: var(--font-family-mono);
  color: var(--text-primary);
}

.noErrors {
  font-size: 9px;
  color: var(--text-dim);
  margin-left: auto;
}

.journeyBadge {
  font-size: 9px;
  color: #3d8c75;
  font-family: var(--font-family-mono);
  margin-left: auto;
}

// ─── Error List ───

.errorList {
  border-top: 1px solid var(--border-subtle);
}

.errorRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: rgba(184, 64, 64, 0.02);
  border-bottom: 1px solid var(--border-subtle);

  &:last-child {
    border-bottom: none;
  }
}

.httpBadge {
  font-family: var(--font-family-mono);
  font-size: 9px;
  font-weight: 700;
  color: #b84040;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(184, 64, 64, 0.1);
  flex-shrink: 0;
}

.errorCondition {
  font-size: 11px;
  color: var(--text-primary);
}

.errorResult {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: auto;
  flex-shrink: 0;
}
```

- [ ] **Step 4: Verify it builds**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm build`

- [ ] **Step 5: Commit**

```bash
git add src/app/errors/page.tsx src/features/errors/
git commit -m "feat: add error catalog page"
```

---

## Task 5: Config Reference

**Files:**

- Create: `src/types/config-ref.ts`
- Create: `src/data/config-reference.ts`
- Create: `src/app/config/page.tsx`
- Create: `src/features/config/config-list/index.tsx`
- Create: `src/features/config/config-list/config-list.module.scss`

- [ ] **Step 1: Create config reference types**

```typescript
// src/types/config-ref.ts
export interface ConfigValue {
  value: string;
  label: string;
  description?: string;
}

export interface ConfigEnum {
  slug: string;
  name: string;
  description: string;
  source: string;
  values: ConfigValue[];
}
```

- [ ] **Step 2: Create config reference data**

```typescript
// src/data/config-reference.ts
import type { ConfigEnum } from '@/types/config-ref';

export const configEnums: ConfigEnum[] = [
  {
    slug: 'listing-category',
    name: 'Listing Categories',
    description:
      'Product categories for marketplace listings. Used in search filters, listing forms, and autocomplete.',
    source: 'listing_category enum (Postgres) + src/features/listings/config/categories.ts',
    values: [
      { value: 'rods', label: 'Rods', description: 'Fishing rods and poles' },
      { value: 'reels', label: 'Reels', description: 'Spinning, baitcasting, fly reels' },
      { value: 'lures', label: 'Lures', description: 'Hard baits, soft plastics, spinnerbaits' },
      { value: 'flies', label: 'Flies', description: 'Dry flies, nymphs, streamers' },
      { value: 'tackle', label: 'Tackle', description: 'Hooks, weights, swivels, tackle boxes' },
      { value: 'line', label: 'Line', description: 'Monofilament, braided, fluorocarbon' },
      { value: 'apparel', label: 'Apparel', description: 'Waders, jackets, hats, gloves' },
      { value: 'electronics', label: 'Electronics', description: 'Fish finders, GPS, cameras' },
      { value: 'watercraft', label: 'Watercraft', description: 'Kayaks, float tubes, accessories' },
      { value: 'other', label: 'Other', description: 'Everything else' },
    ],
  },
  {
    slug: 'listing-condition',
    name: 'Listing Conditions',
    description:
      'Item condition grades from best to worst. Displayed on listing cards and detail pages.',
    source: 'listing_condition enum (Postgres)',
    values: [
      {
        value: 'new_with_tags',
        label: 'New with Tags',
        description: 'Brand new, original tags still attached',
      },
      {
        value: 'new_without_tags',
        label: 'New without Tags',
        description: 'Never used, tags removed',
      },
      { value: 'like_new', label: 'Like New', description: 'Used once or twice, no visible wear' },
      { value: 'good', label: 'Good', description: 'Normal wear, fully functional' },
      { value: 'fair', label: 'Fair', description: 'Visible wear, still works' },
      { value: 'poor', label: 'Poor', description: 'Heavy wear, may need repair' },
    ],
  },
  {
    slug: 'listing-status',
    name: 'Listing Status',
    description:
      'Listing lifecycle status. Transitions enforced by VALID_TRANSITIONS in the status API.',
    source: 'listing_status enum (Postgres)',
    values: [
      { value: 'draft', label: 'Draft', description: 'Not published, only visible to owner' },
      { value: 'active', label: 'Active', description: 'Published, appears in search' },
      { value: 'reserved', label: 'Reserved', description: 'Future: held during checkout' },
      { value: 'sold', label: 'Sold', description: 'Transaction complete, preserved for history' },
      { value: 'archived', label: 'Archived', description: 'Hidden from search, can be relisted' },
      { value: 'deleted', label: 'Deleted', description: 'Soft-deleted with deleted_at timestamp' },
    ],
  },
  {
    slug: 'shipping-paid-by',
    name: 'Shipping Payment',
    description: 'Who pays for shipping. Configurable per listing.',
    source: 'shipping_paid_by enum (Postgres)',
    values: [
      { value: 'seller', label: 'Seller Pays' },
      { value: 'buyer', label: 'Buyer Pays' },
      { value: 'split', label: 'Split' },
    ],
  },
  {
    slug: 'invite-status',
    name: 'Invite Status',
    description: 'Shop invite lifecycle status. Used in shop_invites table.',
    source: 'invite_status enum (Postgres)',
    values: [
      { value: 'pending', label: 'Pending', description: 'Awaiting acceptance, token valid' },
      { value: 'accepted', label: 'Accepted', description: 'Member joined the shop' },
      { value: 'expired', label: 'Expired', description: '7-day window passed' },
      { value: 'revoked', label: 'Revoked', description: 'Owner cancelled the invite' },
    ],
  },
  {
    slug: 'species',
    name: 'Fish Species',
    description: 'Primary species tags for member profiles and listing relevance.',
    source: 'src/features/listings/config/species.ts',
    values: [
      { value: 'bass', label: 'Bass' },
      { value: 'trout', label: 'Trout' },
      { value: 'walleye', label: 'Walleye' },
      { value: 'catfish', label: 'Catfish' },
      { value: 'crappie', label: 'Crappie' },
      { value: 'pike', label: 'Pike' },
      { value: 'musky', label: 'Musky' },
      { value: 'salmon', label: 'Salmon' },
      { value: 'steelhead', label: 'Steelhead' },
      { value: 'panfish', label: 'Panfish' },
      { value: 'carp', label: 'Carp' },
      { value: 'striper', label: 'Striper' },
      { value: 'redfish', label: 'Redfish' },
      { value: 'snook', label: 'Snook' },
      { value: 'tarpon', label: 'Tarpon' },
    ],
  },
  {
    slug: 'shop-role',
    name: 'Shop Roles',
    description:
      'System roles with RBAC permissions. Custom roles per shop are supported but not yet in the UI.',
    source: 'shop_roles table (Postgres) + src/features/shops/constants/roles.ts',
    values: [
      {
        value: 'owner',
        label: 'Owner',
        description: 'Full control. One per shop. Transfer via ownership-transfer flow.',
      },
      {
        value: 'manager',
        label: 'Manager',
        description:
          'Operational access: listings, pricing, orders, messaging. View-only settings.',
      },
      {
        value: 'contributor',
        label: 'Contributor',
        description: 'Listings only. No pricing, orders, messaging, settings, or member access.',
      },
    ],
  },
  {
    slug: 'subscription-tier',
    name: 'Subscription Tiers',
    description: 'Shop subscription levels.',
    source: 'shops.subscription_tier CHECK constraint',
    values: [
      { value: 'basic', label: 'Basic' },
      { value: 'premium', label: 'Premium' },
    ],
  },
  {
    slug: 'subscription-status',
    name: 'Subscription Status',
    description: 'Stripe subscription states synced to shop.',
    source: 'shops.subscription_status CHECK constraint',
    values: [
      { value: 'active', label: 'Active' },
      { value: 'past_due', label: 'Past Due' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'trialing', label: 'Trialing' },
    ],
  },
];
```

- [ ] **Step 3: Create page route**

```typescript
// src/app/config/page.tsx
import { configEnums } from '@/data/config-reference';
import { ConfigList } from '@/features/config/config-list';

export const metadata = { title: 'Config Reference' };

export default function ConfigPage() {
  return <ConfigList enums={configEnums} />;
}
```

- [ ] **Step 4: Create config list component**

```tsx
// src/features/config/config-list/index.tsx
'use client';

import { useState } from 'react';
import type { ConfigEnum } from '@/types/config-ref';
import styles from './config-list.module.scss';

interface ConfigListProps {
  enums: ConfigEnum[];
}

export function ConfigList({ enums }: ConfigListProps) {
  const [openSlugs, setOpenSlugs] = useState<Set<string>>(new Set());
  const totalValues = enums.reduce((s, e) => s + e.values.length, 0);

  const toggle = (slug: string) => {
    setOpenSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Config Reference</h1>
        <p className={styles.subtitle}>
          {enums.length} enums · {totalValues} values
        </p>
      </div>

      {/* TOC */}
      <nav className={styles.toc}>
        {enums.map((e) => (
          <button key={e.slug} className={styles.tocItem} onClick={() => toggle(e.slug)}>
            <span>{e.name}</span>
            <span className={styles.tocCount}>{e.values.length}</span>
          </button>
        ))}
      </nav>

      {/* Enums */}
      {enums.map((enumDef) => {
        const isOpen = openSlugs.has(enumDef.slug);
        return (
          <div key={enumDef.slug} className={styles.enumBlock}>
            <button className={styles.enumHeader} onClick={() => toggle(enumDef.slug)}>
              <span className={styles.enumName}>{enumDef.name}</span>
              <span className={styles.enumCount}>{enumDef.values.length} values</span>
              <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className={styles.enumBody}>
                <p className={styles.enumDesc}>{enumDef.description}</p>
                <div className={styles.source}>
                  <span className={styles.sourceLabel}>Source</span>
                  <code className={styles.sourceValue}>{enumDef.source}</code>
                </div>
                <div className={styles.valueTable}>
                  <div className={styles.valueHeader}>
                    <span className={styles.valCol}>Value</span>
                    <span className={styles.labelCol}>Label</span>
                    <span className={styles.descCol}>Description</span>
                  </div>
                  {enumDef.values.map((v) => (
                    <div key={v.value} className={styles.valueRow}>
                      <code className={styles.valCol}>{v.value}</code>
                      <span className={styles.labelCol}>{v.label}</span>
                      <span className={styles.descCol}>{v.description ?? ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Create config list styles**

```scss
// src/features/config/config-list/config-list.module.scss
.container {
  padding: 24px 28px;
  overflow-y: auto;
  height: 100%;
}

.header {
  margin-bottom: 20px;
}

.title {
  font-family: var(--font-family-serif);
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-weight: 400;
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

// ─── TOC ───

.toc {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.tocItem {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    border-color: var(--border-medium);
    background: var(--bg-hover);
  }
}

.tocCount {
  font-family: var(--font-family-mono);
  font-size: 9px;
  color: var(--text-dim);
  padding: 1px 5px;
  border-radius: 8px;
  background: var(--bg-body);
}

// ─── Enum Blocks ───

.enumBlock {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
}

.enumHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-raised);
  border: none;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: var(--bg-hover);
  }
}

.enumName {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.enumCount {
  font-size: 10px;
  color: var(--text-dim);
  font-family: var(--font-family-mono);
  margin-left: auto;
}

.chevron {
  font-size: 10px;
  color: var(--text-dim);
}

.enumBody {
  padding: 14px 16px;
  border-top: 1px solid var(--border-subtle);
}

.enumDesc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 10px;
}

.source {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.sourceLabel {
  font-size: 9px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.sourceValue {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-body);
  padding: 2px 8px;
  border-radius: 3px;
}

.valueTable {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.valueHeader {
  display: grid;
  grid-template-columns: 140px 120px 1fr;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-raised);
  border-bottom: 1px solid var(--border-medium);
  font-size: 9px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.valueRow {
  display: grid;
  grid-template-columns: 140px 120px 1fr;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 11px;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.01);
  }
}

.valCol {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: #3d8c75;
}

.labelCol {
  color: var(--text-primary);
}

.descCol {
  color: var(--text-muted);
  font-size: 10px;
}
```

- [ ] **Step 6: Verify it builds**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm build`

- [ ] **Step 7: Commit**

```bash
git add src/types/config-ref.ts src/data/config-reference.ts src/app/config/page.tsx src/features/config/
git commit -m "feat: add config reference page"
```

---

## Task 6: Onboarding Tracker

**Files:**

- Create: `src/data/onboarding.ts`
- Create: `src/app/onboarding/page.tsx`
- Create: `src/features/onboarding/onboarding-tracker/index.tsx`
- Create: `src/features/onboarding/onboarding-tracker/onboarding-tracker.module.scss`

- [ ] **Step 1: Create onboarding data**

```typescript
// src/data/onboarding.ts

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  field: string;
  gates?: string;
  relatedJourney?: { label: string; href: string };
  relatedApi?: { label: string; href: string };
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'avatar',
    label: 'Upload Avatar',
    description:
      'Profile photo cropped to 200x200 WebP. Stored in profile-assets/members/{id}/avatar.webp.',
    required: false,
    field: 'members.avatar_url',
    relatedApi: { label: 'POST /api/members/avatar', href: '/api-map#members' },
  },
  {
    id: 'name',
    label: 'First & Last Name',
    description: 'Populated from auth metadata on registration. Editable during onboarding.',
    required: true,
    field: 'members.first_name, members.last_name',
  },
  {
    id: 'bio',
    label: 'Bio',
    description: 'Short description, max 280 characters.',
    required: false,
    field: 'members.bio',
  },
  {
    id: 'species',
    label: 'Primary Species',
    description:
      'Array of fish species tags (e.g., bass, trout, walleye). Used for recommendations.',
    required: false,
    field: 'members.primary_species[]',
  },
  {
    id: 'technique',
    label: 'Primary Technique',
    description: 'Array of fishing technique tags. Used for member profiles and matching.',
    required: false,
    field: 'members.primary_technique[]',
  },
  {
    id: 'state',
    label: 'Home State',
    description: 'US state code (2 chars). Used for location-based features.',
    required: false,
    field: 'members.home_state',
  },
  {
    id: 'years',
    label: 'Years Fishing',
    description: 'Integer value. Displayed on public profile.',
    required: false,
    field: 'members.years_fishing',
  },
  {
    id: 'complete',
    label: 'Complete Onboarding',
    description:
      'Sets onboarding_completed_at timestamp. proxy.ts stops redirecting to /onboarding.',
    required: true,
    field: 'members.onboarding_completed_at',
    gates:
      'Access to dashboard, listings, shops, cart — proxy.ts enforces completion before any authenticated page',
    relatedJourney: { label: 'Onboarding Journey', href: '/journeys/onboarding' },
  },
];

export interface SellerPrecondition {
  id: string;
  label: string;
  description: string;
  field: string;
}

export const sellerPreconditions: SellerPrecondition[] = [
  {
    id: 'onboarding',
    label: 'Onboarding Complete',
    description: 'onboarding_completed_at must be non-null.',
    field: 'members.onboarding_completed_at',
  },
  {
    id: 'toggle',
    label: 'Seller Mode Enabled',
    description: 'is_seller toggled to true via POST /api/members/toggle-seller.',
    field: 'members.is_seller',
  },
  {
    id: 'stripe',
    label: 'Stripe Connected (planned)',
    description:
      'is_stripe_connected must be true. Checked by GET /api/members/seller-preconditions.',
    field: 'members.is_stripe_connected',
  },
];
```

- [ ] **Step 2: Create page route**

```typescript
// src/app/onboarding/page.tsx
import { onboardingSteps, sellerPreconditions } from '@/data/onboarding';
import { OnboardingTracker } from '@/features/onboarding/onboarding-tracker';

export const metadata = { title: 'Onboarding' };

export default function OnboardingPage() {
  return <OnboardingTracker steps={onboardingSteps} sellerPreconditions={sellerPreconditions} />;
}
```

- [ ] **Step 3: Create onboarding tracker component**

```tsx
// src/features/onboarding/onboarding-tracker/index.tsx
'use client';

import Link from 'next/link';
import type { OnboardingStep, SellerPrecondition } from '@/data/onboarding';
import styles from './onboarding-tracker.module.scss';

interface OnboardingTrackerProps {
  steps: OnboardingStep[];
  sellerPreconditions: SellerPrecondition[];
}

export function OnboardingTracker({ steps, sellerPreconditions }: OnboardingTrackerProps) {
  const requiredSteps = steps.filter((s) => s.required);
  const optionalSteps = steps.filter((s) => !s.required);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Onboarding Flow</h1>
        <p className={styles.subtitle}>
          {steps.length} steps ({requiredSteps.length} required, {optionalSteps.length} optional) ·{' '}
          {sellerPreconditions.length} seller preconditions
        </p>
      </div>

      {/* Flow visualization */}
      <div className={styles.flow}>
        <div className={styles.flowLabel}>Registration → Onboarding → Buyer → Seller</div>
        <div className={styles.flowSteps}>
          {steps.map((step, i) => (
            <div key={step.id} className={styles.flowStep}>
              <div className={styles.stepConnector}>
                <div
                  className={`${styles.stepDot} ${step.required ? styles.required : styles.optional}`}
                />
                {i < steps.length - 1 && <div className={styles.stepLine} />}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepTop}>
                  <span className={styles.stepLabel}>{step.label}</span>
                  <span className={step.required ? styles.reqBadge : styles.optBadge}>
                    {step.required ? 'required' : 'optional'}
                  </span>
                </div>
                <p className={styles.stepDesc}>{step.description}</p>
                <code className={styles.stepField}>{step.field}</code>
                {step.gates && (
                  <div className={styles.gates}>
                    <span className={styles.gatesLabel}>Gates</span>
                    <span className={styles.gatesValue}>{step.gates}</span>
                  </div>
                )}
                {(step.relatedJourney || step.relatedApi) && (
                  <div className={styles.stepLinks}>
                    {step.relatedJourney && (
                      <Link href={step.relatedJourney.href} className={styles.stepLink}>
                        {step.relatedJourney.label}
                      </Link>
                    )}
                    {step.relatedApi && (
                      <Link href={step.relatedApi.href} className={styles.stepLink}>
                        {step.relatedApi.label}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seller preconditions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Seller Preconditions</h2>
        <p className={styles.sectionDesc}>
          Requirements that must be met before a member can create listings. Checked by GET
          /api/members/seller-preconditions.
        </p>
        <div className={styles.preconditions}>
          {sellerPreconditions.map((p, i) => (
            <div key={p.id} className={styles.precondition}>
              <span className={styles.preconditionNum}>{i + 1}</span>
              <div className={styles.preconditionContent}>
                <span className={styles.preconditionLabel}>{p.label}</span>
                <p className={styles.preconditionDesc}>{p.description}</p>
                <code className={styles.preconditionField}>{p.field}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create onboarding tracker styles**

```scss
// src/features/onboarding/onboarding-tracker/onboarding-tracker.module.scss
.container {
  padding: 24px 28px;
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
  font-weight: 400;
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

// ─── Flow ───

.flow {
  margin-bottom: 32px;
}

.flowLabel {
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
}

.flowSteps {
  display: flex;
  flex-direction: column;
}

.flowStep {
  display: flex;
  gap: 16px;
}

.stepConnector {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
}

.stepDot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid;

  &.required {
    background: #3d8c75;
    border-color: #3d8c75;
  }

  &.optional {
    background: transparent;
    border-color: var(--text-dim);
  }
}

.stepLine {
  width: 1px;
  flex: 1;
  background: var(--border-medium);
  min-height: 20px;
}

.stepContent {
  padding-bottom: 20px;
  flex: 1;
}

.stepTop {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.stepLabel {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.reqBadge {
  font-size: 9px;
  font-family: var(--font-family-mono);
  color: #3d8c75;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(61, 140, 117, 0.1);
}

.optBadge {
  font-size: 9px;
  font-family: var(--font-family-mono);
  color: var(--text-dim);
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--bg-raised);
}

.stepDesc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0 0 4px;
}

.stepField {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: var(--text-secondary);
  background: var(--bg-raised);
  padding: 2px 8px;
  border-radius: 3px;
}

.gates {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(226, 119, 57, 0.04);
  border-left: 2px solid #e27739;
  border-radius: 4px;
}

.gatesLabel {
  font-size: 9px;
  color: #e27739;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  flex-shrink: 0;
}

.gatesValue {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.stepLinks {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.stepLink {
  font-size: 10px;
  color: #3d8c75;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// ─── Seller Preconditions ───

.section {
  padding-top: 24px;
  border-top: 1px solid var(--border-subtle);
}

.sectionTitle {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-weight: 600;
}

.sectionDesc {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0 0 16px;
  line-height: 1.5;
}

.preconditions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.precondition {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

.preconditionNum {
  font-size: 14px;
  font-family: var(--font-family-mono);
  color: var(--text-dim);
  font-weight: 600;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.preconditionContent {
  flex: 1;
}

.preconditionLabel {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.preconditionDesc {
  font-size: 11px;
  color: var(--text-muted);
  margin: 2px 0 4px;
}

.preconditionField {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: var(--text-secondary);
  background: var(--bg-body);
  padding: 2px 8px;
  border-radius: 3px;
}
```

- [ ] **Step 5: Verify it builds**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm build`

- [ ] **Step 6: Commit**

```bash
git add src/data/onboarding.ts src/app/onboarding/page.tsx src/features/onboarding/
git commit -m "feat: add onboarding tracker page"
```

---

## Task 7: Changelog

**Files:**

- Create: `src/data/changelog.ts`
- Create: `src/app/changelog/page.tsx`
- Create: `src/features/changelog/changelog-feed/index.tsx`
- Create: `src/features/changelog/changelog-feed/changelog-feed.module.scss`

- [ ] **Step 1: Create changelog data**

```typescript
// src/data/changelog.ts

export type ChangeType = 'added' | 'changed' | 'fixed' | 'removed';

export interface ChangelogEntry {
  date: string;
  changes: {
    type: ChangeType;
    description: string;
    area?: string;
  }[];
}

export const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; color: string }> = {
  added: { label: 'Added', color: '#3d8c75' },
  changed: { label: 'Changed', color: '#b86e0a' },
  fixed: { label: 'Fixed', color: '#e27739' },
  removed: { label: 'Removed', color: '#b84040' },
};

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-03-25',
    changes: [
      { type: 'added', description: 'Feature readiness dashboard', area: 'features' },
      { type: 'added', description: 'Permissions matrix page', area: 'permissions' },
      { type: 'added', description: 'Entity relationship diagram', area: 'data-model' },
      {
        type: 'added',
        description: 'Error catalog aggregating all documented error cases',
        area: 'errors',
      },
      { type: 'added', description: 'Config reference with all enums and options', area: 'config' },
      {
        type: 'added',
        description: 'Onboarding tracker with seller preconditions',
        area: 'onboarding',
      },
      { type: 'added', description: 'Changelog page', area: 'changelog' },
      {
        type: 'changed',
        description: 'Search now indexes features, config enums, and errors',
        area: 'search',
      },
      {
        type: 'changed',
        description: 'Sidebar updated with new navigation sections',
        area: 'layout',
      },
    ],
  },
  {
    date: '2026-03-24',
    changes: [
      {
        type: 'added',
        description:
          'Canvas-based journey visualizations (signup, guest-cart, shop-invite, onboarding, create-listing, shop-creation)',
        area: 'journeys',
      },
      {
        type: 'added',
        description: 'API map with 100+ endpoints across 11 groups',
        area: 'api-map',
      },
      {
        type: 'added',
        description: 'Data model documentation with 15 entities',
        area: 'data-model',
      },
      {
        type: 'added',
        description:
          'Lifecycle state machines (listing, shop-invite, cart-item, member, ownership-transfer)',
        area: 'lifecycles',
      },
      {
        type: 'added',
        description: 'Coverage matrix showing journey-to-API mapping',
        area: 'coverage',
      },
      {
        type: 'added',
        description: 'Global search (⌘K) across journeys, endpoints, entities, and lifecycles',
        area: 'search',
      },
      {
        type: 'added',
        description: 'Cross-linking between journeys, APIs, and entities',
        area: 'cross-links',
      },
    ],
  },
];
```

- [ ] **Step 2: Create page route**

```typescript
// src/app/changelog/page.tsx
import { changelog } from '@/data/changelog';
import { ChangelogFeed } from '@/features/changelog/changelog-feed';

export const metadata = { title: 'Changelog' };

export default function ChangelogPage() {
  return <ChangelogFeed entries={changelog} />;
}
```

- [ ] **Step 3: Create changelog feed component**

```tsx
// src/features/changelog/changelog-feed/index.tsx
'use client';

import type { ChangelogEntry } from '@/data/changelog';
import { CHANGE_TYPE_CONFIG } from '@/data/changelog';
import styles from './changelog-feed.module.scss';

interface ChangelogFeedProps {
  entries: ChangelogEntry[];
}

export function ChangelogFeed({ entries }: ChangelogFeedProps) {
  const totalChanges = entries.reduce((s, e) => s + e.changes.length, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Changelog</h1>
        <p className={styles.subtitle}>
          {totalChanges} changes across {entries.length} releases
        </p>
      </div>

      <div className={styles.timeline}>
        {entries.map((entry) => (
          <div key={entry.date} className={styles.entry}>
            <div className={styles.dateLine}>
              <div className={styles.dateDot} />
              <span className={styles.date}>{entry.date}</span>
              <span className={styles.changeCount}>{entry.changes.length} changes</span>
            </div>
            <div className={styles.changes}>
              {entry.changes.map((change, i) => {
                const cfg = CHANGE_TYPE_CONFIG[change.type];
                return (
                  <div key={i} className={styles.change}>
                    <span
                      className={styles.changeBadge}
                      style={{ color: cfg.color, borderColor: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span className={styles.changeDesc}>{change.description}</span>
                    {change.area && <span className={styles.changeArea}>{change.area}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create changelog feed styles**

```scss
// src/features/changelog/changelog-feed/changelog-feed.module.scss
.container {
  padding: 24px 28px;
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
  font-weight: 400;
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

// ─── Timeline ───

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.entry {
  padding-bottom: 28px;
  border-left: 1px solid var(--border-medium);
  margin-left: 5px;
  padding-left: 24px;
  position: relative;

  &:last-child {
    border-left-color: transparent;
  }
}

.dateLine {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.dateDot {
  position: absolute;
  left: -4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #3d8c75;
  border: 2px solid var(--bg-body);
}

.date {
  font-size: 14px;
  font-family: var(--font-family-mono);
  color: var(--text-primary);
  font-weight: 600;
}

.changeCount {
  font-size: 10px;
  color: var(--text-dim);
  font-family: var(--font-family-mono);
}

.changes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 4px;

  &:hover {
    background: var(--bg-raised);
  }
}

.changeBadge {
  font-size: 9px;
  font-family: var(--font-family-mono);
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 3px;
  border: 1px solid;
  flex-shrink: 0;
  min-width: 60px;
  text-align: center;
}

.changeDesc {
  font-size: 12px;
  color: var(--text-primary);
}

.changeArea {
  font-size: 9px;
  font-family: var(--font-family-mono);
  color: var(--text-dim);
  margin-left: auto;
  flex-shrink: 0;
}
```

- [ ] **Step 5: Verify it builds**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm build`

- [ ] **Step 6: Commit**

```bash
git add src/data/changelog.ts src/app/changelog/page.tsx src/features/changelog/
git commit -m "feat: add changelog page"
```

---

## Task 8: Sidebar Navigation + Search Enhancement + Data Barrel Updates

**Files:**

- Modify: `src/components/layout/sidebar/index.tsx`
- Modify: `src/features/search/search-index.ts`
- Modify: `src/data/index.ts`
- Modify: `src/types/docs-context.ts`
- Modify: `src/components/layout/detail-panel/index.tsx`
- Create: `src/components/layout/detail-panel/panels/feature-panel.tsx`
- Create: `src/components/layout/detail-panel/panels/permission-panel.tsx`

- [ ] **Step 1: Update data barrel export**

Add to `src/data/index.ts`:

```typescript
export { features } from './features';
export { roles } from './permissions';
export { configEnums } from './config-reference';
export { onboardingSteps, sellerPreconditions } from './onboarding';
export { changelog } from './changelog';
export { erdNodes, erdEdges } from './entity-relationships';
```

- [ ] **Step 2: Update sidebar navigation**

Replace the `NAV_ITEMS` array in `src/components/layout/sidebar/index.tsx`:

```typescript
import {
  HiOutlineMap,
  HiOutlineServer,
  HiOutlineDatabase,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlinePuzzle,
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineCog,
  HiOutlineAcademicCap,
  HiOutlineClock,
} from 'react-icons/hi';

const NAV_ITEMS = [
  { id: 'journeys', label: 'Journeys', icon: HiOutlineMap, href: '/journeys' },
  { id: 'api', label: 'API Map', icon: HiOutlineServer, href: '/api-map' },
  { id: 'data', label: 'Data Model', icon: HiOutlineDatabase, href: '/data-model' },
  { id: 'lifecycles', label: 'Lifecycles', icon: HiOutlineRefresh, href: '/lifecycles' },
  { id: 'coverage', label: 'Coverage', icon: HiOutlineChartBar, href: '/coverage' },
  { id: 'features', label: 'Features', icon: HiOutlinePuzzle, href: '/features' },
  { id: 'permissions', label: 'Permissions', icon: HiOutlineShieldCheck, href: '/permissions' },
  { id: 'errors', label: 'Errors', icon: HiOutlineExclamationCircle, href: '/errors' },
  { id: 'config', label: 'Config', icon: HiOutlineCog, href: '/config' },
  { id: 'onboarding', label: 'Onboarding', icon: HiOutlineAcademicCap, href: '/onboarding' },
  { id: 'changelog', label: 'Changelog', icon: HiOutlineClock, href: '/changelog' },
];
```

- [ ] **Step 3: Update SelectedItem type**

Add to the union in `src/types/docs-context.ts`:

```typescript
import type { Feature } from './feature';
import type { Role } from './permission';

export type SelectedItem =
  | { type: 'step'; node: JourneyNode; journey: Journey }
  | { type: 'api'; endpoint: ApiEndpoint; group: string }
  | { type: 'entity'; entity: Entity }
  | { type: 'lifecycle-state'; state: LifecycleState; lifecycle: Lifecycle }
  | { type: 'coverage'; journey: Journey }
  | { type: 'feature'; feature: Feature }
  | { type: 'role'; role: Role }
  | null;
```

- [ ] **Step 4: Create feature detail panel**

```tsx
// src/components/layout/detail-panel/panels/feature-panel.tsx
import Link from 'next/link';
import type { Feature } from '@/types/feature';
import { STATUS_COLORS } from '@/types/feature';

export function FeaturePanel({ feature }: { feature: Feature }) {
  return (
    <div style={{ padding: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
          {feature.name}
        </h3>
        <span
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-family-mono)',
            color: STATUS_COLORS[feature.status],
            textTransform: 'uppercase',
          }}
        >
          {feature.status}
        </span>
      </div>
      <p
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          margin: '0 0 12px',
        }}
      >
        {feature.description}
      </p>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          fontSize: '10px',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-family-mono)',
          marginBottom: '12px',
        }}
      >
        {feature.componentCount > 0 && <span>{feature.componentCount} components</span>}
        {feature.endpointCount > 0 && <span>{feature.endpointCount} endpoints</span>}
      </div>
      {feature.links.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {feature.links.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              style={{ fontSize: '11px', color: '#3d8c75', textDecoration: 'none' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create permission detail panel**

```tsx
// src/components/layout/detail-panel/panels/permission-panel.tsx
import type { Role } from '@/types/permission';
import { PERMISSION_FEATURES, LEVEL_CONFIG } from '@/types/permission';

export function PermissionPanel({ role }: { role: Role }) {
  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '14px', color: role.color, margin: '0 0 4px' }}>{role.name}</h3>
      <p
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          margin: '0 0 12px',
        }}
      >
        {role.description}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {PERMISSION_FEATURES.map((f) => {
          const level = role.permissions[f.key];
          const cfg = LEVEL_CONFIG[level];
          return (
            <div
              key={f.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 0',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{f.label}</span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-family-mono)',
                  color: cfg.color,
                  fontWeight: 600,
                }}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update detail panel to render new types**

Add to `src/components/layout/detail-panel/index.tsx` the new cases in the switch/conditional that renders panels. Add imports for `FeaturePanel` and `PermissionPanel`, then add:

```tsx
{
  selectedItem?.type === 'feature' && <FeaturePanel feature={selectedItem.feature} />;
}
{
  selectedItem?.type === 'role' && <PermissionPanel role={selectedItem.role} />;
}
```

- [ ] **Step 7: Update search index**

Add to `src/features/search/search-index.ts` inside `buildIndex()`:

```typescript
import { features } from '@/data/features';
import { configEnums } from '@/data/config-reference';

// Features
for (const f of features) {
  results.push({
    type: 'feature' as SearchResult['type'],
    title: f.name,
    subtitle: `Feature · ${f.status} · ${f.componentCount} components`,
    href: '/features',
    color: '#3d8c75',
    icon: '⬢',
  });
}

// Config enums
for (const e of configEnums) {
  results.push({
    type: 'config' as SearchResult['type'],
    title: e.name,
    subtitle: `Config · ${e.values.length} values`,
    href: '/config',
    color: '#78756f',
    icon: '⚙',
  });
  for (const v of e.values) {
    results.push({
      type: 'config' as SearchResult['type'],
      title: v.label,
      subtitle: `${e.name} · ${v.value}`,
      href: '/config',
      color: '#78756f',
      icon: '·',
    });
  }
}
```

Also update the `SearchResult` type to include the new types:

```typescript
export interface SearchResult {
  type: 'step' | 'journey' | 'endpoint' | 'entity' | 'lifecycle' | 'state' | 'feature' | 'config';
  // ... rest unchanged
}
```

- [ ] **Step 8: Verify the full app builds**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm build`
Expected: Build succeeds with all new pages

- [ ] **Step 9: Run linting**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm lint && pnpm lint:styles`
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add src/components/layout/sidebar/index.tsx src/features/search/search-index.ts src/data/index.ts src/types/docs-context.ts src/components/layout/detail-panel/
git commit -m "feat: update sidebar, search index, and detail panels for new pages"
```

---

## Task 9: Final Integration + ERD link from Data Model

**Files:**

- Modify: `src/features/data-model/entity-list/index.tsx` — Add link to ERD

- [ ] **Step 1: Add ERD link to data model page**

In `src/features/data-model/entity-list/index.tsx`, add a link to the ERD page in the header area:

```tsx
import Link from 'next/link';

// Inside the return, after the title or group header area:
<Link href="/data-model/erd" className={styles.erdLink}>
  View Entity Relationships →
</Link>;
```

Add to `entity-list.module.scss`:

```scss
.erdLink {
  font-size: 11px;
  color: #3d8c75;
  text-decoration: none;
  display: inline-block;
  margin-bottom: 16px;

  &:hover {
    text-decoration: underline;
  }
}
```

- [ ] **Step 2: Final build check**

Run: `cd /Users/kyleholloway/Documents/Development/nessi-docs && pnpm build`
Expected: Full build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/features/data-model/entity-list/
git commit -m "feat: add ERD link from data model page"
```
