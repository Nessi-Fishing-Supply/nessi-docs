# Nessi Docs Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the nessi-docs-playground.html prototype into a proper Next.js 16 App Router application with dark-mode SaaS UI, 5 page types (Journeys, API Map, Data Model, Lifecycles, Coverage), an interactive SVG canvas engine, and an automated data extraction pipeline from nessi-web-app.

**Architecture:** Three-column layout (sidebar + canvas/content + detail panel) as the root layout. SVG canvas with pan/zoom shared between Journeys and Lifecycles. Data loaded at build time from typed JSON files. CI pipeline extracts API routes, DB schema, and lifecycles from nessi-web-app on merge to main.

**Tech Stack:** Next.js 16 (App Router, SSG), React 19, TypeScript, SCSS Modules, SVG (no third-party canvas/charting libs), Nessi design tokens

**Spec:** `docs/superpowers/specs/2026-03-25-nessi-docs-migration-design.md`

**Playground reference:** `nessi-docs-playground.html` (root of repo — the working prototype to match)

---

## Task 1: Cleanup — Remove Old Components & Prepare

**Files:**
- Delete: `src/features/journeys/components/flow-visualizer/`
- Delete: `src/features/journeys/components/step-card/`
- Delete: `src/features/journeys/components/layer-badge/`
- Delete: `src/app/page.tsx` (old homepage)
- Delete: `src/app/page.module.scss`
- Delete: `src/app/journeys/[slug]/page.tsx` (old journey detail)
- Delete: `src/app/journeys/[slug]/page.module.scss`
- Keep: `src/types/journey.ts` (will be expanded in Task 2)
- Keep: `src/data/journeys/` (JSON files stay)
- Keep: `src/styles/` (tokens stay, will extend)
- Keep: `src/app/layout.tsx` (will be rewritten in Task 5)

- [ ] **Step 1: Delete old journey components**

```bash
rm -rf src/features/journeys/components/flow-visualizer
rm -rf src/features/journeys/components/step-card
rm -rf src/features/journeys/components/layer-badge
```

- [ ] **Step 2: Delete old pages**

```bash
rm src/app/page.tsx src/app/page.module.scss
rm -rf src/app/journeys
```

- [ ] **Step 3: Verify the app still compiles (will have missing page, that's fine)**

```bash
pnpm typecheck
```

Expected: May have errors from missing pages — that's fine, we'll create new ones.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old vertical timeline components and pages

Preparing for migration to 2D canvas-based visualization.
Old FlowVisualizer, StepCard, and LayerBadge removed.
Old homepage and journey detail pages removed.
Types, data, and styles preserved for reuse."
```

---

## Task 2: Data Types — Expand Journey Types & Add New Types

**Files:**
- Modify: `src/types/journey.ts`
- Create: `src/types/api-contract.ts`
- Create: `src/types/data-model.ts`
- Create: `src/types/lifecycle.ts`
- Create: `src/types/docs-context.ts`

- [ ] **Step 1: Expand journey types with canvas layout + UX annotations**

Replace `src/types/journey.ts` with the expanded types. Keep existing LAYER_CONFIG, STATUS_CONFIG, PERSONA_CONFIG. Add canvas node/edge types, the `ux` field on Step, and the `why` field.

```typescript
// src/types/journey.ts

// --- Layer/Status/Persona configs (kept from existing) ---

export type StepLayer = 'client' | 'server' | 'database' | 'background' | 'email' | 'external';
export type StepStatus = 'planned' | 'built' | 'tested';
export type Persona =
  | 'guest' | 'auth' | 'onboarding' | 'buyer' | 'seller'
  | 'shop-owner' | 'shop-member' | 'account' | 'context';

export interface LayerConfig {
  label: string;
  color: string;
  icon: string;
}

export interface StatusConfig {
  label: string;
  color: string;
}

export interface PersonaConfig {
  label: string;
  description: string;
  color: string;
}

export const LAYER_CONFIG: Record<StepLayer, LayerConfig> = {
  client:     { label: 'Client',     color: '#3d8c75', icon: 'HiOutlineDesktopComputer' },
  server:     { label: 'Server',     color: '#e27739', icon: 'HiOutlineServer' },
  database:   { label: 'Database',   color: '#1e4a40', icon: 'HiOutlineDatabase' },
  background: { label: 'Background', color: '#b86e0a', icon: 'HiOutlineLightningBolt' },
  email:      { label: 'Email',      color: '#b84040', icon: 'HiOutlineMail' },
  external:   { label: 'External',   color: '#78756f', icon: 'HiOutlineGlobe' },
};

export const STATUS_CONFIG: Record<StepStatus, StatusConfig> = {
  planned: { label: 'Planned', color: '#5c5a55' },
  built:   { label: 'Built',   color: '#3d8c75' },
  tested:  { label: 'Tested',  color: '#1a6b43' },
};

export const PERSONA_CONFIG: Record<Persona, PersonaConfig> = {
  guest:         { label: 'Guest',        description: 'Unauthenticated visitor', color: '#78756f' },
  auth:          { label: 'Auth',         description: 'Authentication flows',    color: '#3d8c75' },
  onboarding:    { label: 'Onboarding',   description: 'New user setup',          color: '#b86e0a' },
  buyer:         { label: 'Buyer',        description: 'Authenticated buyer',     color: '#1e4a40' },
  seller:        { label: 'Seller',       description: 'Listing creator',         color: '#e27739' },
  'shop-owner':  { label: 'Shop Owner',   description: 'Shop administrator',      color: '#e89048' },
  'shop-member': { label: 'Shop Member',  description: 'Shop participant',        color: '#b84040' },
  account:       { label: 'Account',      description: 'Profile management',      color: '#681a19' },
  context:       { label: 'Context',      description: 'Identity switching',      color: '#5c5a55' },
};

// --- UX behavior annotations ---

export interface UxBehavior {
  toast?: string;
  redirect?: string;
  modal?: string;
  email?: string;
  notification?: string;
  stateChange?: string;
}

// --- Error cases ---

export interface ErrorCase {
  condition: string;
  result: string;
  httpStatus?: number;
}

// --- Canvas layout types ---

export interface DecisionOption {
  label: string;
  to: string;
}

export interface JourneyNode {
  id: string;
  type: 'entry' | 'step' | 'decision';
  label: string;
  x: number;
  y: number;
  // Step fields (when type === 'step')
  layer?: StepLayer;
  status?: StepStatus;
  route?: string;
  codeRef?: string;
  notes?: string;
  why?: string;
  errorCases?: ErrorCase[];
  ux?: UxBehavior;
  // Decision fields (when type === 'decision')
  options?: DecisionOption[];
}

export interface JourneyEdge {
  from: string;
  to: string;
  opt?: string;  // Decision option label
}

// --- Top-level journey (canvas format) ---

export interface Journey {
  slug: string;
  title: string;
  persona: Persona;
  description: string;
  relatedIssues?: number[];
  nodes: JourneyNode[];
  edges: JourneyEdge[];
}
```

- [ ] **Step 2: Create API contract types**

```typescript
// src/types/api-contract.ts

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  why?: string;
}

export interface ApiGroup {
  name: string;
  endpoints: ApiEndpoint[];
}
```

- [ ] **Step 3: Create data model types**

```typescript
// src/types/data-model.ts

export interface EntityField {
  name: string;
  type: string;
  description: string;
}

export interface Entity {
  name: string;
  badge: string;
  why?: string;
  fields: EntityField[];
}
```

- [ ] **Step 4: Create lifecycle types**

```typescript
// src/types/lifecycle.ts

export interface LifecycleState {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
}

export interface LifecycleTransition {
  from: string;
  to: string;
  label: string;
  side?: 'r-l' | 'b-t' | 't-b' | 'b-l';
  fx?: number;
  fy?: number;
  tx?: number;
  ty?: number;
}

export interface Lifecycle {
  slug: string;
  name: string;
  badge: string;
  description: string;
  why?: string;
  states: LifecycleState[];
  transitions: LifecycleTransition[];
}
```

- [ ] **Step 5: Create docs context types (for shared state)**

```typescript
// src/types/docs-context.ts

import type { JourneyNode, Journey } from './journey';
import type { ApiEndpoint } from './api-contract';
import type { Entity } from './data-model';
import type { Lifecycle, LifecycleState } from './lifecycle';

export type SelectedItem =
  | { type: 'step'; node: JourneyNode; journey: Journey }
  | { type: 'api'; endpoint: ApiEndpoint; group: string }
  | { type: 'entity'; entity: Entity }
  | { type: 'lifecycle-state'; state: LifecycleState; lifecycle: Lifecycle }
  | { type: 'coverage'; journey: Journey }
  | null;

export interface CrossLink {
  label: string;
  href: string;
  highlight?: string;
}
```

- [ ] **Step 6: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS (types only, no consumers yet)

- [ ] **Step 7: Commit**

```bash
git add src/types/
git commit -m "feat: add expanded type definitions for all doc page types

Journey types extended with canvas layout (JourneyNode, JourneyEdge),
UX behavior annotations, and why field.
New types for ApiContract, DataModel, Lifecycle, and DocsContext."
```

---

## Task 3: Data Files — Migrate Playground Data to Typed Files

**Files:**
- Modify: `src/data/journeys/index.ts`
- Create: `src/data/journeys/canvas/signup.ts`
- Create: `src/data/journeys/canvas/guest-cart.ts`
- Create: `src/data/journeys/canvas/shop-invite.ts`
- Create: `src/data/journeys/canvas/onboarding.ts`
- Create: `src/data/journeys/canvas/create-listing.ts`
- Create: `src/data/journeys/canvas/shop-creation.ts`
- Create: `src/data/journeys/canvas/index.ts`
- Create: `src/data/api-contracts.ts`
- Create: `src/data/data-model.ts`
- Create: `src/data/lifecycles.ts`
- Create: `src/data/cross-links.ts`
- Create: `src/data/index.ts`

This task migrates the hardcoded JS objects from the playground HTML into properly typed TypeScript data files. The data was already made accurate in our playground iteration.

- [ ] **Step 1: Create canvas-format journey data files**

For each of the 6 journeys in the playground's `JJ` array, create a TypeScript file exporting a `Journey` object. Copy the node/edge data directly from the playground HTML. Each file follows this pattern:

```typescript
// src/data/journeys/canvas/signup.ts
import type { Journey } from '@/types/journey';

export const signup: Journey = {
  slug: 'signup',
  title: 'Signup (Email + OTP)',
  persona: 'auth',
  description: 'Register with email/password, verify via OTP, then background side effects.',
  nodes: [
    // Copy all nodes from playground JJ[0].nodes
  ],
  edges: [
    // Copy all edges from playground JJ[0].edges
  ],
};
```

Create all 6 files: `signup.ts`, `guest-cart.ts`, `shop-invite.ts`, `onboarding.ts`, `create-listing.ts`, `shop-creation.ts`.

- [ ] **Step 2: Create the journey canvas index**

```typescript
// src/data/journeys/canvas/index.ts
import type { Journey } from '@/types/journey';
import { signup } from './signup';
import { guestCart } from './guest-cart';
import { shopInvite } from './shop-invite';
import { onboarding } from './onboarding';
import { createListing } from './create-listing';
import { shopCreation } from './shop-creation';

export const journeys: Journey[] = [
  signup, guestCart, shopInvite, onboarding, createListing, shopCreation,
];

export function getAllJourneys(): Journey[] {
  return journeys;
}

export function getJourney(slug: string): Journey | undefined {
  return journeys.find((j) => j.slug === slug);
}

export function getJourneySlugs(): string[] {
  return journeys.map((j) => j.slug);
}
```

- [ ] **Step 3: Create API contracts data file**

Create `src/data/api-contracts.ts` exporting `ApiGroup[]`. Copy all 68 endpoints across 10 groups from the playground's `API` object. Convert to typed TypeScript using the `ApiGroup` and `ApiEndpoint` types.

- [ ] **Step 4: Create data model data file**

Create `src/data/data-model.ts` exporting `Entity[]`. Copy all 13 tables from the playground's `DM` array. Convert to typed TypeScript using the `Entity` and `EntityField` types.

- [ ] **Step 5: Create lifecycles data file**

Create `src/data/lifecycles.ts` exporting `Lifecycle[]` plus helper functions:

```typescript
// src/data/lifecycles.ts
import type { Lifecycle } from '@/types/lifecycle';

export const lifecycles: Lifecycle[] = [
  // Copy all 5 lifecycles from playground LIFECYCLES array
  // Each with slug added (e.g., slug: 'listing')
];

export function getLifecycle(slug: string): Lifecycle | undefined {
  return lifecycles.find((l) => l.slug === slug);
}

export function getLifecycleSlugs(): string[] {
  return lifecycles.map((l) => l.slug);
}
```

- [ ] **Step 6: Create cross-link index builder**

```typescript
// src/data/cross-links.ts
import type { CrossLink } from '@/types/docs-context';
import { getAllJourneys } from './journeys/canvas';
import { apiGroups } from './api-contracts';

export function getLinksForRoute(route: string): CrossLink[] {
  const links: CrossLink[] = [];
  // Check if route exists in API contracts
  for (const group of apiGroups) {
    for (const ep of group.endpoints) {
      const key = `${ep.method} ${ep.path}`;
      if (key === route) {
        links.push({ label: 'View in API Map', href: '/api-map', highlight: route });
      }
    }
  }
  return links;
}

export function getLinksForEndpoint(method: string, path: string): CrossLink[] {
  const links: CrossLink[] = [];
  const key = `${method} ${path}`;
  for (const journey of getAllJourneys()) {
    for (const node of journey.nodes) {
      if (node.type === 'step' && node.route === key) {
        links.push({
          label: `Used in: ${journey.title} (${node.label})`,
          href: `/journeys/${journey.slug}`,
          highlight: node.id,
        });
      }
    }
  }
  return links;
}
```

- [ ] **Step 7: Create unified data index**

```typescript
// src/data/index.ts
export { getAllJourneys, getJourney, getJourneySlugs } from './journeys/canvas';
export { apiGroups } from './api-contracts';
export { entities } from './data-model';
export { lifecycles, getLifecycle, getLifecycleSlugs } from './lifecycles';
export { getLinksForRoute, getLinksForEndpoint } from './cross-links';
```

- [ ] **Step 8: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 9: Commit**

```bash
git add src/data/
git commit -m "feat: add typed data files for all doc pages

Journey canvas data (6 journeys with nodes/edges/positions),
API contracts (68 endpoints in 10 groups),
Data model (13 tables with full field definitions),
Lifecycles (5 state machines with transitions),
Cross-link index builder for inter-page navigation."
```

---

## Task 4: Dark Theme & Global Styles

**Files:**
- Create: `src/styles/variables/dark-theme.scss`
- Modify: `src/styles/globals.scss`

- [ ] **Step 1: Create dark theme variables**

```scss
// src/styles/variables/dark-theme.scss

:root {
  // Dark mode surface colors
  --bg-body: #090b0e;
  --bg-panel: #0f1319;
  --bg-raised: #161c26;
  --bg-hover: #1e2636;
  --bg-active: #283044;
  --bg-input: #0c0f12;

  // Text
  --text-primary: #e8e6e1;
  --text-secondary: #9a9790;
  --text-muted: #6a6860;
  --text-dim: #4a4840;

  // Borders
  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-medium: rgba(255, 255, 255, 0.09);
  --border-strong: rgba(255, 255, 255, 0.15);

  // Glow effects
  --glow-green: rgba(61, 140, 117, 0.3);
  --glow-orange: rgba(226, 119, 57, 0.25);

  // Transitions
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-fast: 150ms var(--ease-out);
  --transition-base: 250ms var(--ease-out);
}
```

- [ ] **Step 2: Update globals.scss for dark mode**

Add `@use 'variables/dark-theme';` import. Update body styles to use dark theme tokens. Keep existing font variables and accessibility styles.

- [ ] **Step 3: Commit**

```bash
git add src/styles/
git commit -m "feat: add dark theme tokens and update globals

Dark mode surface colors, text hierarchy, border opacity tokens,
glow effects, and transition variables."
```

---

## Task 5: App Shell — Layout, Topbar, Sidebar, Detail Panel

**Files:**
- Rewrite: `src/app/layout.tsx`
- Create: `src/components/layout/app-shell/index.tsx`
- Create: `src/components/layout/app-shell/app-shell.module.scss`
- Create: `src/components/layout/topbar/index.tsx`
- Create: `src/components/layout/topbar/topbar.module.scss`
- Create: `src/components/layout/sidebar/index.tsx`
- Create: `src/components/layout/sidebar/sidebar.module.scss`
- Create: `src/components/layout/detail-panel/index.tsx`
- Create: `src/components/layout/detail-panel/detail-panel.module.scss`
- Create: `src/providers/docs-provider.tsx`
- Copy: `src/assets/logos/logo_full.svg` (from nessi-web-app)
- Create: `src/app/page.tsx` (homepage redirect)

The largest task — builds the persistent three-column shell.

- [ ] **Step 1: Copy the Nessi logo SVG**

```bash
mkdir -p src/assets/logos
cp /Users/kyleholloway/Documents/Development/nessi-web-app/src/assets/logos/logo_full.svg src/assets/logos/logo_full.svg
```

- [ ] **Step 2: Create DocsProvider (shared state context)**

```typescript
// src/providers/docs-provider.tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SelectedItem } from '@/types/docs-context';

interface DocsContextValue {
  selectedItem: SelectedItem;
  setSelectedItem: (item: SelectedItem) => void;
  clearSelection: () => void;
}

const DocsContext = createContext<DocsContextValue | null>(null);

export function DocsProvider({ children }: { children: ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const clearSelection = useCallback(() => setSelectedItem(null), []);

  return (
    <DocsContext.Provider value={{ selectedItem, setSelectedItem, clearSelection }}>
      {children}
    </DocsContext.Provider>
  );
}

export function useDocsContext() {
  const ctx = useContext(DocsContext);
  if (!ctx) throw new Error('useDocsContext must be used within DocsProvider');
  return ctx;
}
```

- [ ] **Step 3: Create AppShell component + styles**

Three-column grid wrapper. Grid: `220px 1fr 280px` columns, `48px 1fr` rows. Match the playground's CSS exactly for `.shell`, `.topbar`, `.sidebar`, `.main`, `.detail`.

- [ ] **Step 4: Create Topbar component + styles**

Renders Nessi logo SVG + "docs" label in mono caps + site URL right-aligned. Match the playground topbar: green gradient logo mark, DM Serif for "Nessi", separator, mono URL.

- [ ] **Step 5: Create Sidebar component + styles**

Client component (`'use client'`). Uses `usePathname()` to determine active page. Props: `journeys: Journey[]`, `lifecycles: Lifecycle[]`. Renders 5 nav items. Shows sub-nav below separator for journeys page (journey list) and lifecycles page (lifecycle list). Sub-items use `<Link>` to `/journeys/[slug]` and `/lifecycles/[slug]`.

Match playground sidebar styles: active item has green left border + raised bg, sub-items show persona dots.

- [ ] **Step 6: Create DetailPanel component + styles**

Client component. Reads from `useDocsContext()`. Shows empty state ("Select any item to see its details") when nothing selected. Panel variant rendering will be added in Task 10.

Match playground detail panel styles: section headers (9px uppercase), green-bordered "why" blockquote, mono orange route, maroon error cards.

- [ ] **Step 7: Rewrite root layout.tsx**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import { DocsProvider } from '@/providers/docs-provider';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { Sidebar } from '@/components/layout/sidebar';
import { DetailPanel } from '@/components/layout/detail-panel';
import { getAllJourneys } from '@/data';
import { lifecycles } from '@/data/lifecycles';
import '@/styles/globals.scss';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const dmSerif = DM_Serif_Display({
  weight: '400', subsets: ['latin'], variable: '--font-dm-serif',
});

export const metadata: Metadata = {
  title: { template: '%s | Nessi Docs', default: 'Nessi Docs' },
  description: 'Documentation and testing tool for the Nessi fishing marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const journeys = getAllJourneys();

  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body>
        <DocsProvider>
          <AppShell
            topbar={<Topbar />}
            sidebar={<Sidebar journeys={journeys} lifecycles={lifecycles} />}
            detail={<DetailPanel />}
          >
            {children}
          </AppShell>
        </DocsProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Create homepage redirect**

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation';
import { getJourneySlugs } from '@/data';

export default function Home() {
  const slugs = getJourneySlugs();
  redirect(`/journeys/${slugs[0]}`);
}
```

- [ ] **Step 9: Verify the shell renders**

```bash
pnpm dev
```

Open http://localhost:3000. Should see three-column dark layout with sidebar nav, empty main area, and detail panel empty state.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: app shell with dark theme, sidebar, topbar, detail panel

Three-column layout (220px sidebar + flex canvas + 280px detail).
Nessi logo in topbar. DocsProvider for shared selection state.
Sidebar with 5 nav items + conditional journey/lifecycle sub-nav.
Detail panel with empty state. Homepage redirects to first journey."
```

---

## Task 6: Canvas Engine — Pan/Zoom, Viewport, SVG Wrapper

**Files:**
- Create: `src/features/canvas/hooks/use-pan-zoom.ts`
- Create: `src/features/canvas/hooks/use-viewport.ts`
- Create: `src/features/canvas/canvas-provider/index.tsx`
- Create: `src/features/canvas/canvas-provider/canvas-provider.module.scss`

- [ ] **Step 1: Create usePanZoom hook**

Port pan/zoom logic from playground. Standard drag direction (drag right = content moves right). Returns `{ zoom, panX, panY, zoomIn, zoomOut, resetView, handlers }` where `handlers` is `{ onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onWheel }`.

Key math (from the playground's corrected version):
- mousedown: `startX = e.clientX - panX`, `startY = e.clientY - panY`
- mousemove: `panX = e.clientX - startX`, `panY = e.clientY - startY`
- wheel: `zoom = clamp(zoom + (deltaY > 0 ? -0.06 : 0.06), 0.25, 3)`

- [ ] **Step 2: Create useViewport hook**

Takes array of `{x, y, type}` node objects. Returns SVG viewBox string. Uses node dimensions (NW=160, NH=44, DW=48 for decisions) to calculate bounds with padding. Adjusts for pan/zoom.

- [ ] **Step 3: Create CanvasProvider component + styles**

Client component wrapping `<svg>` with:
- Grid pattern background (`<pattern>` in `<defs>`)
- Arrow markers in `<defs>` (green for flow, orange for decisions)
- Pan/zoom handlers on the SVG element
- Zoom controls (bottom-left: minus, reset, plus buttons)
- Zoom level display
- Children rendered inside a `<g>` element
- Background gradient (green top-left, orange bottom-right, subtle)

- [ ] **Step 4: Commit**

```bash
git add src/features/canvas/
git commit -m "feat: canvas engine with pan/zoom and SVG wrapper

usePanZoom hook for mouse drag + scroll wheel zoom.
useViewport hook for dynamic viewBox calculation.
CanvasProvider component with grid pattern and arrow markers."
```

---

## Task 7: Canvas Engine — SVG Node Components

**Files:**
- Create: `src/features/canvas/components/step-node.tsx`
- Create: `src/features/canvas/components/entry-node.tsx`
- Create: `src/features/canvas/components/decision-node.tsx`
- Create: `src/features/canvas/components/state-node.tsx`
- Create: `src/features/canvas/components/edge.tsx`
- Create: `src/features/canvas/components/animated-edge.tsx`
- Create: `src/features/canvas/components/label-pill.tsx`
- Create: `src/features/canvas/utils/geometry.ts`

- [ ] **Step 1: Create geometry utilities**

```typescript
// src/features/canvas/utils/geometry.ts

// Node dimensions (matching playground constants)
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 44;
export const DECISION_SIZE = 48;
export const LIFECYCLE_NODE_WIDTH = 170;
export const LIFECYCLE_NODE_HEIGHT = 48;

// Get connection port for a node
export function getPort(
  node: { x: number; y: number; type: string },
  side: 'left' | 'right'
): { x: number; y: number } {
  if (node.type === 'decision') {
    const cx = node.x + DECISION_SIZE / 2;
    const cy = node.y + DECISION_SIZE / 2;
    return side === 'right'
      ? { x: node.x + DECISION_SIZE, y: cy }
      : { x: node.x, y: cy };
  }
  return side === 'right'
    ? { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 }
    : { x: node.x, y: node.y + NODE_HEIGHT / 2 };
}

// Build bezier curve between two points
export function bezier(fx: number, fy: number, tx: number, ty: number): string {
  const dx = Math.abs(tx - fx);
  const cp = Math.max(dx * 0.4, 30);
  return `M${fx},${fy} C${fx + cp},${fy} ${tx - cp},${ty} ${tx},${ty}`;
}

// RGBA helper
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
```

- [ ] **Step 2: Create StepNode component**

Port from playground's `renderNd()` function. SVG `<g>` with: rounded rect (layer-colored), left accent bar, status dot, label text, sublabel (route or layer name), error count badge. Props include `node`, `isSelected`, `isDimmed`, `onClick`, `onMouseEnter`, `onMouseLeave`.

- [ ] **Step 3: Create EntryNode component**

Port from playground's `renderEnt()`. Pill-shaped rect with arrow icon and label.

- [ ] **Step 4: Create DecisionNode component**

Port from playground's `renderDec()`. Diamond shape + "?" text + label above + option pills. Option pills positioned at 30% along the bezier to target. `chosen` = full opacity, `unchosen` = 35% opacity but still clickable. Fires `onChoose(decisionId, optionLabel, targetId)`.

- [ ] **Step 5: Create StateNode component**

For lifecycle states. Rounded rect with color, left accent, centered label. Similar to StepNode but simpler. Props: `state: LifecycleState`, `isSelected`, `onClick`.

- [ ] **Step 6: Create Edge component**

SVG `<path>` with bezier curve. Uses `getPort()` + `bezier()`. Props: `from` node, `to` node, `isDecision` (dashed), `isLit`, `isDimmed`. Lit = 75% opacity + 2.5px stroke. Dimmed = 6% opacity.

- [ ] **Step 7: Create AnimatedEdge component**

Same path as Edge with CSS animation: `stroke-dasharray: 4 16; animation: flowPulse 1.8s linear infinite`. Only renders when not dimmed.

- [ ] **Step 8: Create LabelPill component**

For lifecycle transition labels. Rounded rect + text at midpoint of an edge. Props: `x`, `y`, `label`.

- [ ] **Step 9: Commit**

```bash
git add src/features/canvas/
git commit -m "feat: SVG node components for canvas

StepNode, EntryNode, DecisionNode, StateNode for node rendering.
Edge + AnimatedEdge for bezier connections with flow particles.
LabelPill for lifecycle transition labels. Geometry utilities."
```

---

## Task 8: Canvas Engine — Path Tracing Hook

**Files:**
- Create: `src/features/canvas/hooks/use-path-trace.ts`

- [ ] **Step 1: Create usePathTrace hook**

```typescript
// src/features/canvas/hooks/use-path-trace.ts
'use client';

import { useState, useMemo, useCallback } from 'react';
import type { JourneyNode, JourneyEdge } from '@/types/journey';

interface PathChoice {
  decId: string;
  opt: string;
  targetId: string;
}

export function usePathTrace(nodes: JourneyNode[], edges: JourneyEdge[]) {
  const [chosenPath, setChosenPath] = useState<PathChoice[]>([]);

  const choosePath = useCallback((decId: string, opt: string, targetId: string) => {
    setChosenPath((prev) => {
      const filtered = prev.filter((c) => c.decId !== decId);
      return [...filtered, { decId, opt, targetId }];
    });
  }, []);

  const resetPath = useCallback(() => setChosenPath([]), []);

  const { litNodes, litEdges } = useMemo(() => {
    if (chosenPath.length === 0) {
      return { litNodes: new Set<string>(), litEdges: new Set<number>() };
    }

    const litN = new Set<string>();
    const litE = new Set<number>();

    // Seed with chosen targets + all entry nodes
    for (const c of chosenPath) {
      litN.add(c.decId);
      litN.add(c.targetId);
    }
    for (const n of nodes) {
      if (n.type === 'entry') litN.add(n.id);
    }

    // Flood fill through non-optional and chosen-optional edges
    let changed = true;
    let safety = 0;
    while (changed && safety++ < 100) {
      changed = false;
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if (!litN.has(e.from)) continue;
        // Non-optional edge: always follow
        if (!e.opt && !litN.has(e.to)) {
          litN.add(e.to);
          changed = true;
        }
        // Optional edge: only follow if chosen
        if (e.opt) {
          const chosen = chosenPath.find((c) => c.decId === e.from && c.opt === e.opt);
          if (chosen && !litN.has(e.to)) {
            litN.add(e.to);
            changed = true;
          }
        }
        // Mark edge as lit if both endpoints lit
        if (litN.has(e.from) && litN.has(e.to) && !litE.has(i)) {
          litE.add(i);
          changed = true;
        }
      }
    }

    return { litNodes: litN, litEdges: litE };
  }, [chosenPath, nodes, edges]);

  const hasPath = chosenPath.length > 0;

  return { chosenPath, choosePath, resetPath, litNodes, litEdges, hasPath };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/canvas/hooks/use-path-trace.ts
git commit -m "feat: usePathTrace hook for decision path tracing

Flood-fill algorithm computes lit nodes and edges from chosen decisions.
Clicking a different option at the same decision auto-switches the path."
```

---

## Task 9: Journey Page — Canvas + Filters + Route

**Files:**
- Create: `src/features/journeys/journey-canvas/index.tsx`
- Create: `src/features/journeys/journey-filters/index.tsx`
- Create: `src/features/journeys/journey-filters/journey-filters.module.scss`
- Create: `src/app/journeys/[slug]/page.tsx`
- Create: `src/app/journeys/page.tsx` (index redirect)

- [ ] **Step 1: Create JourneyCanvas component**

Client component. Takes `journey: Journey` and filter state. Renders CanvasProvider with all nodes (StepNode, EntryNode, DecisionNode) and edges (Edge, AnimatedEdge). Integrates `usePathTrace` for decision interaction. Calls `useDocsContext().setSelectedItem()` on node clicks. Handles node visibility filtering by layer and status. Renders pathbar (clickable to clear) when path is active.

- [ ] **Step 2: Create JourneyFilters component + styles**

Collapsible filter bar at top of canvas area. Layer chips (Client through External, colored) and status chips (Planned/Built/Tested). Toggle on/off. "Filters" button to show/hide. Match playground filter bar styles.

- [ ] **Step 3: Create journey page route**

```tsx
// src/app/journeys/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getJourney, getJourneySlugs } from '@/data';
import { JourneyPageClient } from './client';

export function generateStaticParams() {
  return getJourneySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journey = getJourney(slug);
  return { title: journey?.title ?? 'Journey' };
}

export default async function JourneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journey = getJourney(slug);
  if (!journey) notFound();
  return <JourneyPageClient journey={journey} />;
}
```

Create `src/app/journeys/[slug]/client.tsx` as the client wrapper that manages filter state and renders JourneyFilters + JourneyCanvas.

- [ ] **Step 4: Create journeys index redirect**

```tsx
// src/app/journeys/page.tsx
import { redirect } from 'next/navigation';
import { getJourneySlugs } from '@/data';

export default function JourneysIndex() {
  redirect(`/journeys/${getJourneySlugs()[0]}`);
}
```

- [ ] **Step 5: Verify journey page renders with interactive canvas**

```bash
pnpm dev
```

Navigate to http://localhost:3000/journeys/signup. Verify: nodes render, edges connect, decisions have clickable option pills, path tracing works, pan/zoom works, filter bar toggles visibility.

- [ ] **Step 6: Commit**

```bash
git add src/features/journeys/ src/app/journeys/
git commit -m "feat: journey page with interactive 2D canvas

JourneyCanvas renders nodes, edges, and decision pills on SVG canvas.
Path tracing: click decision options to highlight branches.
JourneyFilters: toggleable layer and status filter chips.
Static generation via generateStaticParams."
```

---

## Task 10: Detail Panel Variants

**Files:**
- Create: `src/components/layout/detail-panel/panels/step-panel.tsx`
- Create: `src/components/layout/detail-panel/panels/api-panel.tsx`
- Create: `src/components/layout/detail-panel/panels/entity-panel.tsx`
- Create: `src/components/layout/detail-panel/panels/lifecycle-panel.tsx`
- Create: `src/components/layout/detail-panel/panels/coverage-panel.tsx`
- Modify: `src/components/layout/detail-panel/index.tsx`

- [ ] **Step 1: Create StepPanel**

Renders: label (DM Serif), layer + status badges, "Why this exists" green-bordered blockquote, API route (mono orange), code reference (mono green), implementation notes, UX behaviors (toast/redirect/modal/email icons), error cases (maroon cards with condition/result/HTTP status), and cross-links via `getLinksForRoute()`.

- [ ] **Step 2: Create ApiPanel**

Renders: path (DM Mono), method badge, description, "Why this exists" blockquote, cross-links to journeys via `getLinksForEndpoint()`.

- [ ] **Step 3: Create EntityPanel**

Renders: entity name (mono green), badge, "Why this exists", field table (name | type | description columns with fixed widths: 150px | 90px | flex).

- [ ] **Step 4: Create LifecyclePanel**

Renders: state name, lifecycle badge, "How you get here" (incoming transitions list), "Where it goes" (outgoing transitions list), "Terminal State" indicator when no outgoing.

- [ ] **Step 5: Create CoveragePanel**

Renders: journey title, persona badge, description, built/tested percentages, "Not Yet Built" step list (maroon), "Built but Untested" step list (orange).

- [ ] **Step 6: Wire panels into DetailPanel**

Update `DetailPanel` to switch on `selectedItem.type` and render the appropriate panel. Cross-links render as clickable `<Link>` elements using Next.js routing.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/detail-panel/
git commit -m "feat: detail panel variants for all page types

StepPanel with why/route/code/errors/ux/cross-links.
ApiPanel with why/description/journey cross-links.
EntityPanel with why/field table.
LifecyclePanel with incoming/outgoing transitions.
CoveragePanel with built/tested breakdown."
```

---

## Task 11: API Map, Data Model, Coverage Pages

**Files:**
- Create: `src/features/api-map/api-list/index.tsx`
- Create: `src/features/api-map/api-list/api-list.module.scss`
- Create: `src/app/api-map/page.tsx`
- Create: `src/features/data-model/entity-list/index.tsx`
- Create: `src/features/data-model/entity-list/entity-list.module.scss`
- Create: `src/app/data/page.tsx`
- Create: `src/features/coverage/coverage-list/index.tsx`
- Create: `src/features/coverage/coverage-list/coverage-list.module.scss`
- Create: `src/app/coverage/page.tsx`

- [ ] **Step 1: Create ApiList component + styles**

Client component. Renders API groups with endpoint rows. Each row: method badge (color-coded GET/POST/PUT/PATCH/DELETE) + path (mono) + description. Clicking a row calls `setSelectedItem({ type: 'api', endpoint, group })`. Active row gets green border. Scrollable content area. Match playground `renderApiView` styles.

- [ ] **Step 2: Create API Map page**

```tsx
// src/app/api-map/page.tsx
import { apiGroups } from '@/data';
import { ApiList } from '@/features/api-map/api-list';

export const metadata = { title: 'API Map' };

export default function ApiMapPage() {
  return <ApiList groups={apiGroups} />;
}
```

- [ ] **Step 3: Create EntityList component + styles**

Client component. Renders entity cards (expandable). Click card to select + expand field table. Match playground styles: entity name in mono green, badge pill, field rows with fixed column widths (150px name | 90px type | flex description).

- [ ] **Step 4: Create Data Model page**

```tsx
// src/app/data/page.tsx
import { entities } from '@/data';
import { EntityList } from '@/features/data-model/entity-list';

export const metadata = { title: 'Data Model' };

export default function DataModelPage() {
  return <EntityList entities={entities} />;
}
```

- [ ] **Step 5: Create CoverageList component + styles**

Client component. Renders coverage card per journey: title, persona + stats line, progress bars (built %, tested %), layer distribution bars. Clicking selects for detail panel. Match playground `renderCovView` styles.

- [ ] **Step 6: Create Coverage page**

```tsx
// src/app/coverage/page.tsx
import { getAllJourneys } from '@/data';
import { CoverageList } from '@/features/coverage/coverage-list';

export const metadata = { title: 'Coverage' };

export default function CoveragePage() {
  return <CoverageList journeys={getAllJourneys()} />;
}
```

- [ ] **Step 7: Update sidebar nav hrefs**

Ensure sidebar links point to: `/journeys/{first}`, `/api-map`, `/data`, `/lifecycles/{first}`, `/coverage`. Active detection uses `pathname.startsWith()`.

- [ ] **Step 8: Verify all pages**

Navigate each page. Click items. Verify detail panel updates with cross-links.

- [ ] **Step 9: Commit**

```bash
git add src/features/api-map/ src/features/data-model/ src/features/coverage/ src/app/api-map/ src/app/data/ src/app/coverage/
git commit -m "feat: API Map, Data Model, and Coverage pages

ApiList: 68 endpoints in 10 groups, clickable for detail panel.
EntityList: 13 tables with expandable fields.
CoverageList: build/test coverage per journey with progress bars."
```

---

## Task 12: Lifecycles Page — Canvas + Route

**Files:**
- Create: `src/features/lifecycles/lifecycle-canvas/index.tsx`
- Create: `src/app/lifecycles/[slug]/page.tsx`
- Create: `src/app/lifecycles/page.tsx` (index redirect)

- [ ] **Step 1: Create LifecycleCanvas component**

Client component. Takes `lifecycle: Lifecycle`. Renders CanvasProvider with StateNode components and Edge/AnimatedEdge/LabelPill for transitions. Clicking a state calls `setSelectedItem({ type: 'lifecycle-state', state, lifecycle })`. Also renders lifecycle title and description as SVG text at top of canvas.

Uses larger node dimensions: width=170, height=48 (LIFECYCLE_NODE_WIDTH/HEIGHT from geometry utils).

For transitions with explicit `fx/fy/tx/ty` coordinates, use those directly. Otherwise, calculate from `side` property using state positions.

- [ ] **Step 2: Create lifecycle page route**

```tsx
// src/app/lifecycles/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getLifecycle, getLifecycleSlugs } from '@/data';
import { LifecycleCanvas } from '@/features/lifecycles/lifecycle-canvas';

export function generateStaticParams() {
  return getLifecycleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lc = getLifecycle(slug);
  return { title: lc ? `${lc.name} Lifecycle` : 'Lifecycle' };
}

export default async function LifecyclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lifecycle = getLifecycle(slug);
  if (!lifecycle) notFound();
  return <LifecycleCanvas lifecycle={lifecycle} />;
}
```

- [ ] **Step 3: Create lifecycles index redirect**

```tsx
// src/app/lifecycles/page.tsx
import { redirect } from 'next/navigation';
import { getLifecycleSlugs } from '@/data';

export default function LifecyclesIndex() {
  redirect(`/lifecycles/${getLifecycleSlugs()[0]}`);
}
```

- [ ] **Step 4: Verify lifecycle canvas**

Navigate to http://localhost:3000/lifecycles/listing. Verify state machine diagram renders. Click states for detail panel.

- [ ] **Step 5: Commit**

```bash
git add src/features/lifecycles/ src/app/lifecycles/
git commit -m "feat: lifecycle pages with SVG state machine canvas

LifecycleCanvas renders states and transitions with bezier edges.
5 lifecycles: Listing, Shop Invite, Cart Item, Member, Ownership Transfer."
```

---

## Task 13: Extraction Scripts (in nessi-web-app)

**Files (in nessi-web-app repo):**
- Create: `scripts/docs-extract/extract-api-routes.ts`
- Create: `scripts/docs-extract/extract-data-model.ts`
- Create: `scripts/docs-extract/extract-lifecycles.ts`
- Create: `scripts/docs-extract/index.ts`
- Modify: `package.json` (add `docs:extract` script)

- [ ] **Step 1: Create API route extractor**

Walks `src/app/api/` directory tree using `readdirSync`/`readFileSync`/`statSync` (no shell commands). For each `route.ts`, reads file content and uses regex `/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g` to find HTTP methods. Builds path from directory structure. Groups by top-level directory. Outputs `docs/generated/api-contracts.json`.

- [ ] **Step 2: Create data model extractor**

Reads `src/types/database.ts`. Uses regex to extract table definitions from the Supabase generated `Tables` interface. For each table: extracts `Row` type fields with their TypeScript types. Outputs `docs/generated/data-model.json`.

- [ ] **Step 3: Create lifecycle extractor**

Reads enum definitions from `src/types/database.ts` (e.g., `Database['public']['Enums']`). Reads VALID_TRANSITIONS from `src/app/api/listings/[id]/status/route.ts`. Outputs `docs/generated/lifecycles.json`.

- [ ] **Step 4: Create orchestrator**

```typescript
// scripts/docs-extract/index.ts
import { extractApiRoutes } from './extract-api-routes';
import { extractDataModel } from './extract-data-model';
import { extractLifecycles } from './extract-lifecycles';
import { cpSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = join(process.cwd(), 'docs/generated');
const JOURNEYS_SRC = join(process.cwd(), 'docs/journeys');
const JOURNEYS_DST = join(OUTPUT_DIR, 'journeys');

mkdirSync(OUTPUT_DIR, { recursive: true });

console.log('Extracting API routes...');
extractApiRoutes();

console.log('Extracting data model...');
extractDataModel();

console.log('Extracting lifecycles...');
extractLifecycles();

console.log('Copying journey JSON files...');
mkdirSync(JOURNEYS_DST, { recursive: true });
cpSync(JOURNEYS_SRC, JOURNEYS_DST, { recursive: true });

console.log('Done! Output in docs/generated/');
```

- [ ] **Step 5: Add package.json script**

Add to nessi-web-app's package.json scripts: `"docs:extract": "tsx scripts/docs-extract/index.ts"`

- [ ] **Step 6: Test extraction**

```bash
cd /Users/kyleholloway/Documents/Development/nessi-web-app
pnpm run docs:extract
ls docs/generated/
```

Verify it outputs `api-contracts.json`, `data-model.json`, `lifecycles.json`, and `journeys/` directory.

- [ ] **Step 7: Commit (in nessi-web-app)**

```bash
git add scripts/docs-extract/ package.json
git commit -m "feat: add docs extraction scripts for nessi-docs sync

Extracts API routes, data model, and lifecycles from source code.
Copies journey JSON files. Output to docs/generated/ for CI sync."
```

---

## Task 14: CI Pipeline — GitHub Action

**Files (in nessi-web-app):**
- Create: `.github/workflows/sync-docs.yml`

- [ ] **Step 1: Create GitHub Action workflow**

```yaml
# .github/workflows/sync-docs.yml
name: Sync Docs Data

on:
  push:
    branches: [main]
    paths:
      - 'src/app/api/**'
      - 'src/types/database.ts'
      - 'supabase/migrations/**'
      - 'docs/journeys/**'
      - 'scripts/docs-extract/**'
  workflow_dispatch: {} # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout nessi-web-app
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run extraction scripts
        run: pnpm run docs:extract

      - name: Push to nessi-docs
        uses: cpina/github-action-push-to-another-repository@main
        env:
          SSH_DEPLOY_KEY: ${{ secrets.NESSI_DOCS_DEPLOY_KEY }}
        with:
          source-directory: 'docs/generated'
          destination-github-username: ${{ github.repository_owner }}
          destination-repository-name: 'nessi-docs'
          target-directory: 'src/data/synced'
          target-branch: 'main'
          commit-message: >-
            sync: update docs data from nessi-web-app (${{ github.sha }})
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/sync-docs.yml
git commit -m "ci: add GitHub Action to sync docs data to nessi-docs

Triggers on push to main when API routes, DB types, migrations,
or journey files change. Runs extraction and pushes to nessi-docs."
```

---

## Task 15: Final Cleanup & Verification

**Files:**
- Delete: `nessi-docs-playground.html`
- Modify: `.gitignore`

- [ ] **Step 1: Delete playground HTML**

```bash
rm nessi-docs-playground.html
```

- [ ] **Step 2: Update .gitignore**

Add `.superpowers/` to `.gitignore`.

- [ ] **Step 3: Full build verification**

```bash
pnpm build
```

Should generate all static pages with zero errors.

- [ ] **Step 4: Dev server smoke test**

```bash
pnpm dev
```

Walk through every page:
- `/journeys/signup` — canvas renders, decisions clickable, path tracing works, detail panel shows step info with cross-links
- `/journeys/onboarding` — 3-way decision branch works
- `/api-map` — all 10 endpoint groups, clicking shows detail with journey cross-links
- `/data` — all 13 entities expandable, field columns aligned properly
- `/lifecycles/listing` — state machine with 5 transitions, states clickable
- `/coverage` — all 6 journey cards with progress bars, clicking shows breakdown
- Sidebar sub-nav switches correctly between journeys and lifecycles
- Cross-links navigate between pages

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove playground HTML, final cleanup

Playground prototype served its purpose. All functionality now in
the proper Next.js app with typed data, component architecture,
and automated extraction pipeline."
```

---

## Summary

| Task | What it builds | Depends on |
|------|---------------|------------|
| 1 | Cleanup old components | — |
| 2 | Type definitions | 1 |
| 3 | Data files (from playground) | 2 |
| 4 | Dark theme + globals | 1 |
| 5 | App shell (layout, topbar, sidebar, detail, provider) | 2, 3, 4 |
| 6 | Canvas engine (pan/zoom, viewport, SVG wrapper) | 4 |
| 7 | SVG node components (step, entry, decision, state, edges) | 6 |
| 8 | Path tracing hook | 2 |
| 9 | Journey page (canvas + filters + route) | 5, 7, 8 |
| 10 | Detail panel variants | 5, 3 |
| 11 | API Map, Data Model, Coverage pages | 5, 3, 10 |
| 12 | Lifecycles page (canvas + route) | 5, 7 |
| 13 | Extraction scripts (in nessi-web-app) | — (independent) |
| 14 | CI pipeline (GitHub Action) | 13 |
| 15 | Final cleanup + verification | All above |
