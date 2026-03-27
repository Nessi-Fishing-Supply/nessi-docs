# API Map Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the API Map into a polished Swagger-inspired explorer with filter bar, inline expand, cross-linking, and a new shared PageHeader component.

**Architecture:** Replace the current grouped-card layout with a filter bar (group + method chips) and inline-expand endpoint rows. Create a shared `PageHeader` component with gradient glow card design and adopt it across all pages. Remove the detail panel from the API Map page. Add deep-link highlighting for cross-navigation from journeys.

**Tech Stack:** Next.js 16 App Router, React, SCSS Modules, existing design tokens

**Spec:** `docs/superpowers/specs/2026-03-26-api-map-redesign.md`

**Data note:** If additional fields are needed during implementation (e.g., response body schemas, richer endpoint descriptions), the extraction scripts in `nessi-web-app` can be updated to capture them. The current plan uses only fields already present in `api-contracts.json`.

---

### Task 1: Update ApiEndpoint type to include requestFields and tags

The raw JSON has `requestFields` and `tags` that aren't in the TypeScript type. We need these for the redesigned expanded view.

**Files:**

- Modify: `src/types/api-contract.ts`

- [ ] **Step 1: Add missing fields to ApiEndpoint**

```ts
export interface RequestField {
  name: string;
  type: string;
  required: boolean;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
  label?: string;
  why?: string;
  auth?: string;
  errorCodes?: number[];
  permissions?: { feature: string; level: string };
  requestFields?: RequestField[];
  tags?: string[];
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: No new errors (fields are optional, existing code unaffected).

- [ ] **Step 3: Commit**

```bash
git add src/types/api-contract.ts
git commit -m "feat(types): add requestFields and tags to ApiEndpoint"
```

---

### Task 2: Create shared PageHeader component

A reusable gradient glow card header for all doc pages.

**Files:**

- Create: `src/components/ui/page-header/index.tsx`
- Create: `src/components/ui/page-header/page-header.module.scss`

- [ ] **Step 1: Create the SCSS module**

Create `src/components/ui/page-header/page-header.module.scss`:

```scss
.header {
  position: relative;
  padding: 24px 20px 18px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    rgb(30 74 64 / 8%) 0%,
    rgb(15 19 25 / 40%) 60%,
    rgb(226 119 57 / 3%) 100%
  );
  border: 1px solid rgb(61 140 117 / 10%);
  overflow: hidden;
  margin-bottom: 16px;

  &::before {
    content: '';
    position: absolute;
    top: -40px;
    left: -40px;
    width: 160px;
    height: 160px;
    background: radial-gradient(circle, rgb(61 140 117 / 12%) 0%, transparent 70%);
    pointer-events: none;
  }
}

.titleRow {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
  position: relative;
}

.title {
  font-family: var(--font-family-serif);
  font-size: 20px;
  color: var(--text-primary);
  margin: 0;
  font-weight: 400;
}

.badge {
  font-family: var(--font-family-mono);
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgb(61 140 117 / 12%);
  color: #3d8c75;
  font-weight: 600;
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  position: relative;
}

.stats {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  position: relative;
}

.stat {
  font-size: 11px;
  color: var(--text-muted);
}

.statValue {
  font-family: var(--font-family-mono);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 13px;
  margin-right: 3px;
}

.children {
  position: relative;
  margin-top: 12px;
}
```

- [ ] **Step 2: Create the component**

Create `src/components/ui/page-header/index.tsx`:

```tsx
import styles from './page-header.module.scss';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  metrics?: Array<{ value: number | string; label: string }>;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, badge, metrics, children }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{title}</h2>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>

      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

      {metrics && metrics.length > 0 && (
        <div className={styles.stats}>
          {metrics.map((m) => (
            <div key={m.label} className={styles.stat}>
              <span className={styles.statValue}>{m.value}</span>
              {m.label}
            </div>
          ))}
        </div>
      )}

      {children && <div className={styles.children}>{children}</div>}
    </div>
  );
}
```

- [ ] **Step 3: Export from the UI barrel** (if one exists, otherwise skip)

Check if `src/components/ui/index.ts` exists. If it does, add:

```ts
export { PageHeader } from './page-header';
```

- [ ] **Step 4: Verify it builds**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/page-header/
git commit -m "feat: add shared PageHeader component with gradient glow design"
```

---

### Task 3: Remove /api-map from detail panel pages and hide panel

The AppShell currently lists `/api-map` in `DETAIL_PANEL_PAGES`. Remove it so the detail panel hides automatically on this page.

**Files:**

- Modify: `src/components/layout/app-shell/index.tsx`

- [ ] **Step 1: Remove /api-map from the list**

In `src/components/layout/app-shell/index.tsx`, change:

```ts
const DETAIL_PANEL_PAGES = ['/api-map', '/data-model', '/lifecycles', '/coverage', '/features'];
```

to:

```ts
const DETAIL_PANEL_PAGES = ['/data-model', '/lifecycles', '/coverage', '/features'];
```

- [ ] **Step 2: Verify it builds**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/app-shell/index.tsx
git commit -m "feat: hide detail panel on API Map page"
```

---

### Task 4: Rewrite the API Map page with PageHeader

Replace the old header/TOC in `ApiList` with `PageHeader`, and update the page component.

**Files:**

- Modify: `src/app/api-map/page.tsx`
- Modify: `src/features/api-map/api-list/index.tsx`
- Modify: `src/features/api-map/api-list/api-list.module.scss`

- [ ] **Step 1: Update the page component to pass data for PageHeader**

Replace `src/app/api-map/page.tsx`:

```tsx
import { apiGroups } from '@/data';
import { ApiList } from '@/features/api-map/api-list';

export const metadata = { title: 'API Map' };

export default function ApiMapPage() {
  const totalEndpoints = apiGroups.reduce((sum, g) => sum + g.endpoints.length, 0);

  return <ApiList groups={apiGroups} totalEndpoints={totalEndpoints} />;
}
```

- [ ] **Step 2: Rewrite ApiList component — filter state and layout**

Replace the entire contents of `src/features/api-map/api-list/index.tsx`:

```tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { ApiGroup, ApiEndpoint } from '@/types/api-contract';
import { getLinksForEndpoint, getErrorsForEndpoint } from '@/data';
import { getMethodColors } from '@/constants/colors';
import { PageHeader } from '@/components/ui/page-header';
import styles from './api-list.module.scss';

/* ── Constants ── */

const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

/* ── Filter Bar ── */

function FilterBar({
  groups,
  activeGroups,
  activeMethods,
  onToggleGroup,
  onToggleMethod,
  onToggleAllGroups,
}: {
  groups: ApiGroup[];
  activeGroups: Set<string>;
  activeMethods: Set<string>;
  onToggleGroup: (name: string) => void;
  onToggleMethod: (method: string) => void;
  onToggleAllGroups: () => void;
}) {
  const allGroupsActive = activeGroups.size === groups.length;

  return (
    <div className={styles.filterBar}>
      <span className={styles.filterLabel}>Group</span>
      <button
        className={`${styles.filterChip} ${allGroupsActive ? styles.filterChipActive : ''}`}
        onClick={onToggleAllGroups}
      >
        All{' '}
        <span className={styles.chipCount}>
          {groups.reduce((s, g) => s + g.endpoints.length, 0)}
        </span>
      </button>
      {groups.map((g) => (
        <button
          key={g.name}
          className={`${styles.filterChip} ${activeGroups.has(g.name) ? styles.filterChipActive : ''}`}
          onClick={() => onToggleGroup(g.name)}
        >
          {g.name} <span className={styles.chipCount}>{g.endpoints.length}</span>
        </button>
      ))}

      <span className={styles.filterDivider} />
      <span className={styles.filterLabel}>Method</span>
      {ALL_METHODS.map((m) => {
        const { color, bg, border } = getMethodColors(m);
        return (
          <button
            key={m}
            className={`${styles.methodChip} ${activeMethods.has(m) ? styles.methodChipActive : ''}`}
            style={
              {
                '--mc': color,
                '--mbg': bg,
                '--mborder': border,
              } as React.CSSProperties
            }
            onClick={() => onToggleMethod(m)}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

/* ── Endpoint Row (Expanded Detail) ── */

function EndpointDetail({ endpoint }: { endpoint: ApiEndpoint }) {
  const errors = getErrorsForEndpoint(endpoint.method, endpoint.path);
  const journeyLinks = getLinksForEndpoint(endpoint.method, endpoint.path);
  const hasRequestFields = endpoint.requestFields && endpoint.requestFields.length > 0;
  const responseCodes = buildResponseCodes(endpoint.errorCodes);

  return (
    <div className={styles.epDetail}>
      <div className={hasRequestFields ? styles.detailCols : undefined}>
        {/* Left column: request fields + error cases */}
        {hasRequestFields && (
          <div>
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Request Body</div>
              <div className={styles.fieldTable}>
                {endpoint.requestFields!.map((f) => (
                  <div key={f.name} className={styles.fieldRow}>
                    <span className={styles.fieldName}>{f.name}</span>
                    <span className={styles.fieldType}>{f.type}</span>
                    {f.required && <span className={styles.fieldReq}>required</span>}
                  </div>
                ))}
              </div>
            </div>

            {errors.length > 0 && (
              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>Error Cases</div>
                {errors.map((err, i) => (
                  <div key={i} className={styles.errorCase}>
                    {err.httpStatus && <span className={styles.errorHttp}>{err.httpStatus}</span>}
                    <span className={styles.errorText}>
                      {err.condition}
                      {err.result && <> &mdash; {err.result}</>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right column (or only column): responses, auth, journeys */}
        <div>
          <div className={styles.detailSection}>
            <div className={styles.detailLabel}>Responses</div>
            <div className={styles.responseRow}>
              {responseCodes.map((rc) => (
                <span
                  key={rc.code}
                  className={`${styles.statusPill} ${rc.isError ? styles.statusError : styles.statusSuccess}`}
                >
                  {rc.code} <span className={styles.statusDesc}>{rc.label}</span>
                </span>
              ))}
            </div>
          </div>

          {endpoint.auth && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Authentication</div>
              <div
                className={`${styles.authIndicator} ${endpoint.auth === 'admin' ? styles.authAdmin : ''}`}
              >
                <span className={styles.authDot} />
                {endpoint.auth === 'admin' ? 'Admin required' : 'User required'}
              </div>
            </div>
          )}

          {!hasRequestFields && errors.length > 0 && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Error Cases</div>
              {errors.map((err, i) => (
                <div key={i} className={styles.errorCase}>
                  {err.httpStatus && <span className={styles.errorHttp}>{err.httpStatus}</span>}
                  <span className={styles.errorText}>
                    {err.condition}
                    {err.result && <> &mdash; {err.result}</>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {journeyLinks.length > 0 && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Used in Journeys</div>
              <div className={styles.journeyChips}>
                {journeyLinks.map((link, i) => (
                  <Link key={i} href={link.href} className={styles.journeyChip}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Endpoint Row ── */

function EndpointRow({
  endpoint,
  groupName,
  staggerIndex,
}: {
  endpoint: ApiEndpoint;
  groupName: string;
  staggerIndex: number;
}) {
  const slug = `${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')}`;
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const { color, bg, border } = getMethodColors(endpoint.method);
  const errors = getErrorsForEndpoint(endpoint.method, endpoint.path);
  const errorCount = errors.length;

  // Deep-link: auto-expand and highlight on hash match
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === `#${slug}`) {
      setIsOpen(true);
      setHighlight(true);
      setTimeout(
        () => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        100,
      );
      setTimeout(() => setHighlight(false), 2000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Render path with highlighted params
  const pathParts = endpoint.path.split(/(:[\w]+)/g);

  return (
    <div
      ref={rowRef}
      id={slug}
      className={`${styles.epRow} ${isOpen ? styles.epRowOpen : ''} ${highlight ? styles.epRowHighlight : ''}`}
      style={
        {
          '--method-color': color,
          '--method-bg': bg,
          '--method-border': border,
          '--stagger': `${staggerIndex * 20}ms`,
        } as React.CSSProperties
      }
    >
      <button className={styles.epRowHeader} onClick={() => setIsOpen((p) => !p)}>
        <span className={styles.methodBadge}>{endpoint.method}</span>
        <span className={styles.epPath}>
          {pathParts.map((part, i) =>
            part.startsWith(':') ? (
              <span key={i} className={styles.epParam}>
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </span>
        <span className={styles.epMeta}>
          {endpoint.auth && (
            <span
              className={`${styles.epAuth} ${endpoint.auth === 'admin' ? styles.epAuthAdmin : ''}`}
            >
              {endpoint.auth}
            </span>
          )}
          {endpoint.tags?.map((tag) => (
            <span key={tag} className={styles.epTag}>
              {tag}
            </span>
          ))}
          {errorCount > 0 && <span className={styles.epErrors}>{errorCount}</span>}
          <span className={styles.epChevron}>&#9656;</span>
        </span>
      </button>

      {isOpen && <EndpointDetail endpoint={endpoint} />}
    </div>
  );
}

/* ── Helpers ── */

interface ResponseCode {
  code: number;
  label: string;
  isError: boolean;
}

function buildResponseCodes(errorCodes?: number[]): ResponseCode[] {
  const codes: ResponseCode[] = [{ code: 200, label: 'OK', isError: false }];
  const seen = new Set<number>([200]);

  const STATUS_LABELS: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable',
    500: 'Server Error',
  };

  if (errorCodes) {
    for (const code of errorCodes) {
      if (!seen.has(code)) {
        seen.add(code);
        codes.push({ code, label: STATUS_LABELS[code] ?? 'Error', isError: code >= 400 });
      }
    }
  }

  return codes;
}

/* ── Main Component ── */

interface ApiListProps {
  groups: ApiGroup[];
  totalEndpoints: number;
}

export function ApiList({ groups, totalEndpoints }: ApiListProps) {
  const [activeGroups, setActiveGroups] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.name)),
  );
  const [activeMethods, setActiveMethods] = useState<Set<string>>(() => new Set(ALL_METHODS));

  const toggleGroup = (name: string) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleAllGroups = () => {
    setActiveGroups((prev) =>
      prev.size === groups.length ? new Set<string>() : new Set(groups.map((g) => g.name)),
    );
  };

  const toggleMethod = (method: string) => {
    setActiveMethods((prev) => {
      const next = new Set(prev);
      if (next.has(method)) next.delete(method);
      else next.add(method);
      return next;
    });
  };

  // Filter groups and endpoints
  const filteredGroups = useMemo(() => {
    return groups
      .filter((g) => activeGroups.has(g.name))
      .map((g) => ({
        ...g,
        endpoints: g.endpoints.filter((ep) => activeMethods.has(ep.method)),
      }))
      .filter((g) => g.endpoints.length > 0);
  }, [groups, activeGroups, activeMethods]);

  // Global stagger index across all groups
  let staggerIndex = 0;

  return (
    <div className={styles.container}>
      <PageHeader
        title="API Map"
        metrics={[
          { value: totalEndpoints, label: 'endpoints' },
          { value: groups.length, label: 'groups' },
        ]}
      />

      <FilterBar
        groups={groups}
        activeGroups={activeGroups}
        activeMethods={activeMethods}
        onToggleGroup={toggleGroup}
        onToggleMethod={toggleMethod}
        onToggleAllGroups={toggleAllGroups}
      />

      <div className={styles.epContainer}>
        {filteredGroups.map((group) => (
          <div key={group.name}>
            <div className={styles.groupDivider}>
              <span className={styles.groupName}>{group.name}</span>
              <span className={styles.groupLine} />
              <span className={styles.groupCount}>{group.endpoints.length}</span>
            </div>

            {group.endpoints.map((ep) => {
              const idx = staggerIndex++;
              return (
                <EndpointRow
                  key={`${ep.method}-${ep.path}`}
                  endpoint={ep}
                  groupName={group.name}
                  staggerIndex={idx}
                />
              );
            })}
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className={styles.emptyState}>No endpoints match the current filters.</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles (styles will be broken, that's expected)**

Run: `pnpm typecheck`
Expected: PASS (component references styles that don't exist yet, but typecheck only validates TS)

- [ ] **Step 4: Commit**

```bash
git add src/app/api-map/page.tsx src/features/api-map/api-list/index.tsx
git commit -m "feat(api-map): rewrite component with filter bar, inline expand, PageHeader"
```

---

### Task 5: Rewrite the API Map SCSS module

Complete styling rewrite to match the journey canvas design language.

**Files:**

- Modify: `src/features/api-map/api-list/api-list.module.scss`

- [ ] **Step 1: Replace the entire SCSS file**

Replace `src/features/api-map/api-list/api-list.module.scss` with:

```scss
.container {
  padding: 24px 28px;
  overflow-y: auto;
  height: 100%;
}

// ─── Filter Bar ───

.filterBar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 0;
  margin-bottom: 8px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}

.filterLabel {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  font-weight: 600;
  margin-right: 2px;
  white-space: nowrap;
}

.filterChip {
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 6px;
  background: rgb(255 255 255 / 3%);
  border: 1px solid rgb(255 255 255 / 6%);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 150ms ease-out;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: rgb(255 255 255 / 12%);
    color: var(--text-secondary);
    background: rgb(255 255 255 / 5%);
  }
}

.filterChipActive {
  background: rgb(30 74 64 / 12%);
  border-color: rgb(61 140 117 / 25%);
  color: #3d8c75;
}

.chipCount {
  font-size: 8px;
  color: var(--text-dim);

  .filterChipActive & {
    color: rgb(61 140 117 / 60%);
  }
}

.filterDivider {
  width: 1px;
  height: 16px;
  background: rgb(255 255 255 / 6%);
  margin: 0 4px;
  flex-shrink: 0;
}

.methodChip {
  font-family: var(--font-family-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease-out;
  border: 1px solid transparent;
  color: var(--text-dim);
  background: rgb(255 255 255 / 2%);

  &:hover {
    color: var(--mc);
    background: var(--mbg);
    border-color: var(--mborder);
  }
}

.methodChipActive {
  color: var(--mc);
  background: var(--mbg);
  border-color: var(--mborder);
}

// ─── Endpoint Container ───

.epContainer {
  padding-top: 4px;
}

// ─── Group Dividers ───

.groupDivider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0 8px;

  &:first-child {
    margin-top: 0;
  }
}

.groupName {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.groupLine {
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}

.groupCount {
  font-size: 9px;
  color: var(--text-dim);
  background: rgb(255 255 255 / 3%);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: var(--font-family-mono);
}

// ─── Endpoint Row ───

.epRow {
  margin-bottom: 2px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 150ms ease-out;
  animation: rowEnter 200ms ease-out both;
  animation-delay: var(--stagger);
}

@keyframes rowEnter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.epRowHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: 8px;
  transition: background 150ms ease-out;
  color: inherit;
  font: inherit;

  &:hover {
    background: rgb(255 255 255 / 2%);
  }
}

.epRow:hover {
  border-color: rgb(255 255 255 / 4%);
}

.epRowOpen {
  background: rgb(30 74 64 / 5%);
  border-color: rgb(61 140 117 / 15%);

  .epRowHeader {
    border-radius: 8px 8px 0 0;
  }
}

.epRowHighlight {
  animation: deepLinkGlow 2s ease-out;
}

@keyframes deepLinkGlow {
  0% {
    box-shadow: 0 0 20px rgb(61 140 117 / 20%);
    border-color: rgb(61 140 117 / 40%);
  }
  30% {
    box-shadow: 0 0 20px rgb(61 140 117 / 20%);
    border-color: rgb(61 140 117 / 40%);
  }
  100% {
    box-shadow: none;
    border-color: transparent;
  }
}

.methodBadge {
  font-family: var(--font-family-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--method-color);
  background: var(--method-bg);
  padding: 3px 8px;
  border-radius: 5px;
  min-width: 46px;
  text-align: center;
  flex-shrink: 0;
}

.epPath {
  font-family: var(--font-family-mono);
  font-size: 11.5px;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.epParam {
  color: #3d8c75;
}

.epMeta {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.epAuth {
  font-size: 9px;
  color: var(--text-muted);
  background: rgb(255 255 255 / 4%);
  padding: 2px 7px;
  border-radius: 4px;
}

.epAuthAdmin {
  color: #a78bfa;
  background: rgb(139 92 246 / 8%);
}

.epTag {
  font-size: 8px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgb(255 255 255 / 3%);
  color: var(--text-dim);
}

.epErrors {
  font-size: 9px;
  color: #b84040;
  background: rgb(184 64 64 / 8%);
  padding: 2px 7px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 3px;

  &::before {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #b84040;
  }
}

.epChevron {
  font-size: 10px;
  color: var(--text-dim);
  transition: transform 200ms ease-out;

  .epRowOpen & {
    transform: rotate(90deg);
  }
}

// ─── Expanded Detail ───

.epDetail {
  padding: 16px 20px;
  background: rgb(15 19 25 / 50%);
  border-top: 1px solid rgb(61 140 117 / 10%);
  border-radius: 0 0 8px 8px;
}

.detailCols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.detailSection {
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }
}

.detailLabel {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  margin-bottom: 6px;
  font-weight: 600;
}

// ─── Request Fields Table ───

.fieldTable {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: rgb(255 255 255 / 3%);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 4%);
}

.fieldRow {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: var(--bg-panel);
  gap: 8px;

  &:hover {
    background: rgb(255 255 255 / 2%);
  }
}

.fieldName {
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--text-primary);
  min-width: 90px;
}

.fieldType {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: var(--text-muted);
  min-width: 60px;
}

.fieldReq {
  font-size: 9px;
  color: #e27739;
  font-weight: 600;
}

// ─── Responses ───

.responseRow {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.statusPill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 5px;
  font-family: var(--font-family-mono);
  font-size: 10px;
  font-weight: 600;
}

.statusSuccess {
  background: rgb(61 140 117 / 10%);
  color: #3d8c75;
  border: 1px solid rgb(61 140 117 / 15%);
}

.statusError {
  background: rgb(184 64 64 / 8%);
  color: #b84040;
  border: 1px solid rgb(184 64 64 / 10%);
}

.statusDesc {
  font-size: 9px;
  font-weight: 400;
  color: var(--text-muted);
  font-family: var(--font-family-sans);
}

// ─── Auth Indicator ───

.authIndicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.authAdmin {
  color: #a78bfa;
}

.authDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);

  .authAdmin & {
    background: #a78bfa;
  }
}

// ─── Error Cases ───

.errorCase {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  background: rgb(184 64 64 / 4%);
  border: 1px solid rgb(184 64 64 / 8%);
  border-radius: 6px;
  margin-bottom: 4px;
}

.errorHttp {
  font-family: var(--font-family-mono);
  font-size: 9px;
  font-weight: 700;
  color: #b84040;
  background: rgb(184 64 64 / 12%);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

.errorText {
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.4;
}

// ─── Journey Chips ───

.journeyChips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.journeyChip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  color: #3d8c75;
  background: rgb(61 140 117 / 6%);
  border: 1px solid rgb(61 140 117 / 10%);
  transition: all 150ms ease-out;
  text-decoration: none;
  cursor: pointer;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #3d8c75;
    opacity: 0.5;
  }

  &:hover {
    background: rgb(61 140 117 / 12%);
    border-color: rgb(61 140 117 / 20%);
  }
}

// ─── Empty State ───

.emptyState {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 12px;
  color: var(--text-dim);
}
```

- [ ] **Step 2: Run dev server and visually verify**

Run: `pnpm dev`

Open `http://localhost:3000/api-map` and verify:

- Gradient glow PageHeader renders at top
- Filter bar shows all group chips + method chips
- Toggling filters shows/hides groups and methods
- Clicking an endpoint row expands inline detail
- Request fields table shows for endpoints that have them (e.g., POST /api/auth/register)
- Error count badges appear on rows with errors
- Admin auth shows in purple
- Staggered row entry animation plays on load
- Detail panel is hidden (two-column grid, no right panel)

- [ ] **Step 3: Run lint and typecheck**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/api-map/api-list/api-list.module.scss
git commit -m "feat(api-map): rewrite SCSS with canvas design language"
```

---

### Task 6: Adopt PageHeader across all other pages

Replace the inline header/title/subtitle pattern in each feature component with the shared `PageHeader`.

**Files:**

- Modify: `src/features/journeys/domain-grid/index.tsx`
- Modify: `src/features/data-model/entity-list/index.tsx`
- Modify: `src/features/feature-readiness/feature-list/index.tsx`
- Modify: `src/features/permissions/permissions-matrix/index.tsx`
- Modify: `src/features/config/config-list/index.tsx`
- Modify: `src/features/coverage/coverage-list/index.tsx`
- Modify: `src/features/changelog/changelog-feed/index.tsx`

- [ ] **Step 1: Update DomainGrid (Journeys)**

In `src/features/journeys/domain-grid/index.tsx`, add import:

```tsx
import { PageHeader } from '@/components/ui/page-header';
```

Replace the header block:

```tsx
<div className={styles.header}>
  <h2 className={styles.title}>Journeys</h2>
  <p className={styles.subtitle}>
    {domains.length} domains · {domains.reduce((s, d) => s + d.journeyCount, 0)} journeys
  </p>
</div>
```

with:

```tsx
<PageHeader
  title="Journeys"
  metrics={[
    { value: domains.length, label: 'domains' },
    { value: domains.reduce((s, d) => s + d.journeyCount, 0), label: 'journeys' },
  ]}
/>
```

Remove unused `.header`, `.title`, `.subtitle` styles from `domain-grid.module.scss` if they exist.

- [ ] **Step 2: Update ChangelogFeed**

In `src/features/changelog/changelog-feed/index.tsx`, add import:

```tsx
import { PageHeader } from '@/components/ui/page-header';
```

Replace:

```tsx
<div className={styles.header}>
  <h2 className={styles.title}>Changelog</h2>
  <p className={styles.subtitle}>
    {totalChanges} changes across {entries.length} releases
  </p>
</div>
```

with:

```tsx
<PageHeader
  title="Changelog"
  metrics={[
    { value: totalChanges, label: 'changes' },
    { value: entries.length, label: 'releases' },
  ]}
/>
```

- [ ] **Step 3: Update EntityList (Data Model)**

In `src/features/data-model/entity-list/index.tsx`, add import and replace header. The Data Model page also has an ERD link — use the `children` slot:

```tsx
<PageHeader title="Data Model" metrics={[{ value: entities.length, label: 'tables' }]}>
  <Link href="/data-model/erd" className={styles.erdLink}>
    View Entity Relationships →
  </Link>
</PageHeader>
```

- [ ] **Step 4: Update FeatureList**

In `src/features/feature-readiness/feature-list/index.tsx`:

```tsx
<PageHeader
  title="Feature Readiness"
  metrics={[
    { value: total, label: 'features' },
    { value: totalComponents, label: 'components' },
    { value: totalEndpoints, label: 'endpoints' },
  ]}
/>
```

(Exact variable names may differ — use whatever the component already calculates.)

- [ ] **Step 5: Update PermissionsMatrix**

In `src/features/permissions/permissions-matrix/index.tsx`:

```tsx
<PageHeader
  title="Permissions Matrix"
  metrics={[
    { value: roles.length, label: 'roles' },
    { value: PERMISSION_FEATURES.length, label: 'features' },
  ]}
/>
```

- [ ] **Step 6: Update ConfigList**

In `src/features/config/config-list/index.tsx`:

```tsx
<PageHeader
  title="Config Reference"
  metrics={[
    { value: enums.length, label: 'enums' },
    { value: totalValues, label: 'total values' },
  ]}
/>
```

- [ ] **Step 7: Update CoverageList**

In `src/features/coverage/coverage-list/index.tsx`:

```tsx
<PageHeader title="Journey Coverage" metrics={[{ value: journeys.length, label: 'journeys' }]} />
```

- [ ] **Step 8: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 9: Visually verify a few pages**

Run dev server, check `/journeys`, `/changelog`, `/data-model` — each should now show the gradient glow header.

- [ ] **Step 10: Commit**

```bash
git add src/features/journeys/domain-grid/ src/features/changelog/changelog-feed/ src/features/data-model/entity-list/ src/features/feature-readiness/feature-list/ src/features/permissions/permissions-matrix/ src/features/config/config-list/ src/features/coverage/coverage-list/
git commit -m "feat: adopt PageHeader component across all doc pages"
```

---

### Task 7: Remove the API detail panel

Clean up the now-unused `ApiPanel` component and stop the API Map from calling `setSelectedItem`.

**Files:**

- Remove: `src/components/layout/detail-panel/panels/api-panel.tsx`
- Modify: `src/components/layout/detail-panel/index.tsx` (remove the `api` case)

- [ ] **Step 1: Check how the detail panel routes to ApiPanel**

Read `src/components/layout/detail-panel/index.tsx` and find the `case 'api'` or `type === 'api'` branch.

- [ ] **Step 2: Remove the api case from the detail panel**

In `src/components/layout/detail-panel/index.tsx`, remove the import:

```tsx
import { ApiPanel } from './panels/api-panel';
```

And remove the rendering branch for `type === 'api'`:

```tsx
// Remove this block:
if (selectedItem.type === 'api') {
  return <ApiPanel endpoint={selectedItem.endpoint} group={selectedItem.group} />;
}
```

(The exact syntax may be a switch/case or if/else chain — remove just the api branch.)

- [ ] **Step 3: Delete the api-panel file**

```bash
rm src/components/layout/detail-panel/panels/api-panel.tsx
```

- [ ] **Step 4: Verify build**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -u src/components/layout/detail-panel/
git commit -m "feat: remove ApiPanel — detail panel no longer used on API Map"
```

---

### Task 8: Clean up unused header styles from feature SCSS modules

Each feature component had its own `.header`, `.title`, `.subtitle` styles. Now that PageHeader handles this, remove the dead CSS.

**Files:**

- Modify: `src/features/journeys/domain-grid/domain-grid.module.scss`
- Modify: `src/features/changelog/changelog-feed/changelog-feed.module.scss`
- Modify: `src/features/data-model/entity-list/entity-list.module.scss`
- Modify: `src/features/feature-readiness/feature-list/feature-list.module.scss`
- Modify: `src/features/permissions/permissions-matrix/permissions-matrix.module.scss`
- Modify: `src/features/config/config-list/config-list.module.scss`
- Modify: `src/features/coverage/coverage-list/coverage-list.module.scss`

- [ ] **Step 1: For each file, remove the `.header`, `.title`, and `.subtitle` style blocks**

Open each SCSS file and remove the header-related blocks. These typically look like:

```scss
// Remove these blocks from each file:
.header { ... }
.title { ... }
.subtitle { ... }
```

Some files may have additional header-related styles (like `.headerTitle`, `.version`, `.baseUrl`, `.baseLabel`, `.baseValue`, `.toc`, `.tocItem`, `.tocName`, `.tocCount`). Remove those too — they're all dead now.

- [ ] **Step 2: Run lint:styles to check for issues**

Run: `pnpm lint:styles`
Expected: PASS (no unused class warnings since SCSS modules only warn on import)

- [ ] **Step 3: Verify dev server still works**

Run: `pnpm dev` and spot-check a few pages.

- [ ] **Step 4: Commit**

```bash
git add src/features/journeys/domain-grid/ src/features/changelog/changelog-feed/ src/features/data-model/entity-list/ src/features/feature-readiness/feature-list/ src/features/permissions/permissions-matrix/ src/features/config/config-list/ src/features/coverage/coverage-list/
git commit -m "chore: remove dead header styles replaced by PageHeader"
```

---

### Task 9: Final build verification

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: Successful static build with no errors.

- [ ] **Step 2: Full lint + typecheck**

Run: `pnpm typecheck && pnpm lint && pnpm lint:styles`
Expected: All pass.

- [ ] **Step 3: Format check**

Run: `pnpm format:check`
If failures, run: `pnpm format` then commit.

- [ ] **Step 4: Final commit if format changes**

```bash
git add -A
git commit -m "chore: format"
```
