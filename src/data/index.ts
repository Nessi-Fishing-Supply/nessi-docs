/* ------------------------------------------------------------------ */
/*  Adapter layer — imports generated JSON and re-exports typed data  */
/*  Transforms raw extraction output into shapes the UI expects       */
/* ------------------------------------------------------------------ */

import type { ApiGroup } from '@/types/api-contract';
import type { Entity } from '@/types/data-model';
import type { ErdNode, ErdEdge } from '@/types/entity-relationship';
import type { Role } from '@/types/permission';
import type { ConfigEnum } from '@/types/config-ref';
import type { Feature } from '@/types/feature';
import type { Lifecycle } from '@/types/lifecycle';
import type { Journey } from '@/types/journey';
import type { ChangelogEntry, ChangelogChange, ChangeType } from '@/types/changelog';
import type { CrossLink } from '@/types/docs-context';
import type { FeatureDomain, DashboardMetrics } from '@/types/dashboard';
import type { ErrorCase } from '@/types/journey';
import type {
  RawJourney,
  RawLifecycle,
  RawLifecycleState,
  RawErdNode,
  RawEntity,
} from './raw-types';
import type { RoadmapItem } from '@/types/roadmap';
import type { ExtractionMeta } from '@/types/extraction-meta';
import type { ArchDiagram } from '@/types/architecture';
import { DOMAINS } from '@/constants/domains';
import type { DomainConfig } from '@/constants/domains';

import apiContractsRaw from './generated/api-contracts.json';
import dataModelRaw from './generated/data-model.json';
import entityRelationshipsRaw from './generated/entity-relationships.json';
import permissionsRaw from './generated/permissions.json';
import configReferenceRaw from './generated/config-reference.json';
import featuresRaw from './generated/features.json';
import lifecyclesRaw from './generated/lifecycles.json';
import journeysRaw from './generated/journeys.json';
import changelogRaw from './generated/changelog.json';
import roadmapRaw from './generated/roadmap.json';
import architectureRaw from './generated/architecture.json';
import metaRaw from './generated/_meta.json';

import { transformJourneys, detectJourneyBackEdges } from './layout/journey-layout';

export { detectJourneyBackEdges };

/* ------------------------------------------------------------------ */
/*  2. Lifecycle Layout + Color Assignment                             */
/*  Topological sort via transitions → left-to-right positions        */
/* ------------------------------------------------------------------ */

const LC_NODE_W = 140;
const LC_NODE_H = 60;
const LC_H_GAP = 140;
const LC_V_GAP = 120;

const STATE_COLOR_MAP: Record<string, string> = {
  sold: '#3d8c75',
  accepted: '#3d8c75',
  completed: '#3d8c75',
  active: '#4a9e7a',
  published: '#4a9e7a',
  draft: '#78756f',
  pending: '#b8860b',
  deleted: '#b84040',
  revoked: '#b84040',
  cancelled: '#b84040',
  rejected: '#b84040',
  archived: '#6b6966',
  deactivated: '#6b6966',
  expired: '#a0522d',
  reserved: '#5f7fbf',
};
const DEFAULT_STATE_COLOR = '#78756f';

function getStateColor(stateId: string): string {
  return STATE_COLOR_MAP[stateId] ?? DEFAULT_STATE_COLOR;
}

function transformLifecycles(raw: RawLifecycle[]): Lifecycle[] {
  return raw.map((lc) => {
    // Build adjacency for topological-ish layout
    const stateIds = lc.states.map((s) => s.id);
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, number>();

    for (const id of stateIds) {
      outgoing.set(id, []);
      incoming.set(id, 0);
    }
    for (const t of lc.transitions) {
      outgoing.get(t.from)?.push(t.to);
      incoming.set(t.to, (incoming.get(t.to) ?? 0) + 1);
    }

    // BFS from root states (no incoming edges) to assign levels (cycle-safe)
    const roots = stateIds.filter((id) => (incoming.get(id) ?? 0) === 0);
    const level = new Map<string, number>();
    const bfsQueue = roots.length > 0 ? [...roots] : [stateIds[0]];
    for (const r of bfsQueue) level.set(r, 0);

    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift()!;
      const currentLevel = level.get(current)!;
      for (const next of outgoing.get(current) ?? []) {
        // Only assign first-seen level — prevents back-edges from inflating levels
        if (!level.has(next)) {
          level.set(next, currentLevel + 1);
          bfsQueue.push(next);
        }
      }
    }

    // Assign any unvisited states
    for (const id of stateIds) {
      if (!level.has(id)) level.set(id, 0);
    }

    // Group by level, then assign x/y
    const byLevel = new Map<number, string[]>();
    for (const [id, lvl] of level) {
      if (!byLevel.has(lvl)) byLevel.set(lvl, []);
      byLevel.get(lvl)!.push(id);
    }

    const positions = new Map<string, { x: number; y: number }>();
    const sortedLevels = [...byLevel.keys()].sort((a, b) => a - b);

    for (const lvl of sortedLevels) {
      const ids = byLevel.get(lvl)!;
      for (let i = 0; i < ids.length; i++) {
        positions.set(ids[i], {
          x: lvl * (LC_NODE_W + LC_H_GAP),
          y: i * (LC_NODE_H + LC_V_GAP),
        });
      }
    }

    return {
      slug: lc.slug,
      name: lc.name,
      badge: lc.badge,
      description: lc.description,
      why: lc.why,
      source: lc.source,
      states: lc.states.map((s) => ({
        id: s.id,
        label: s.label,
        color: getStateColor(s.id),
        x: positions.get(s.id)?.x ?? 0,
        y: positions.get(s.id)?.y ?? 0,
      })),
      transitions: lc.transitions.map((t) => ({
        from: t.from,
        to: t.to,
        label: t.label,
      })),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  3. Entity Categorization                                           */
/*  Map table names → semantic categories for entity list badges      */
/* ------------------------------------------------------------------ */

const ENTITY_CATEGORY_MAP: Record<string, string> = {
  // Core marketplace entities
  members: 'core',
  shops: 'core',
  listings: 'core',
  cart_items: 'core',
  // Shop management (invites, transfers, roles, membership)
  shop_members: 'shops',
  shop_roles: 'shops',
  shop_invites: 'shops',
  shop_ownership_transfers: 'shops',
  // Commerce (offers, watchers, price tracking)
  offers: 'commerce',
  watchers: 'commerce',
  price_drop_notifications: 'commerce',
  // Social (follows, blocks, flags)
  follows: 'social',
  member_blocks: 'social',
  flags: 'social',
  // Messaging
  message_threads: 'messaging',
  message_thread_participants: 'messaging',
  messages: 'messaging',
  // Content & discovery
  listing_photos: 'content',
  recently_viewed: 'content',
  search_suggestions: 'content',
  // User data
  addresses: 'user',
  slugs: 'user',
};

function transformEntities(raw: RawEntity[]): Entity[] {
  return raw.map((e) => ({
    ...e,
    badge: ENTITY_CATEGORY_MAP[e.name] ?? 'system',
  }));
}

/* ------------------------------------------------------------------ */
/*  3b. Feature Domain Mapping                                         */
/*  Map feature slugs → domain slugs for dashboard grouping            */
/* ------------------------------------------------------------------ */

const FEATURE_TO_DOMAIN: Record<string, string> = {
  addresses: 'account',
  auth: 'auth',
  blocks: 'shopping',
  cart: 'cart',
  context: 'auth',
  dashboard: 'account',
  editorial: 'listings',
  email: 'shops',
  flags: 'shopping',
  follows: 'shopping',
  listings: 'listings',
  members: 'account',
  messaging: 'shopping',
  orders: 'cart',
  'recently-viewed': 'shopping',
  shared: 'shopping',
  shops: 'shops',
  watchlist: 'shopping',
};

const SCOPE_TO_DOMAIN: Record<string, string> = {
  auth: 'auth',
  onboarding: 'auth',
  context: 'auth',
  cart: 'cart',
  checkout: 'cart',
  orders: 'cart',
  shops: 'shops',
  shop: 'shops',
  invites: 'shops',
  email: 'shops',
  listings: 'listings',
  listing: 'listings',
  editorial: 'listings',
  follows: 'shopping',
  search: 'shopping',
  recently: 'shopping',
  'recently-viewed': 'shopping',
  reports: 'shopping',
  flags: 'shopping',
  recommendations: 'shopping',
  watchlist: 'shopping',
  blocks: 'shopping',
  messaging: 'shopping',
  account: 'account',
  addresses: 'account',
  members: 'account',
  profiles: 'account',
  dashboard: 'account',
};

/** A feature with no components, endpoints, or entities is a utility — not a product feature. */
function hasProductSurface(f: Feature): boolean {
  const entities = (f as unknown as { entities?: string[] }).entities ?? [];
  return f.componentCount > 0 || f.endpointCount > 0 || entities.length > 0;
}

export function getFeatureDomains(): FeatureDomain[] {
  const allFeatures = featuresRaw.features as unknown as Feature[];
  const allJourneys = journeysRaw.journeys as unknown as RawJourney[];

  return DOMAINS.map((d) => {
    const domainFeatures = allFeatures
      .filter((f) => FEATURE_TO_DOMAIN[f.slug] === d.slug)
      .filter(hasProductSurface);
    if (domainFeatures.length === 0) return null;

    const endpointCount = domainFeatures.reduce((sum, f) => sum + f.endpointCount, 0);
    const journeyCount = allJourneys.filter((j) => j.domain === d.slug).length;
    const entityCount = domainFeatures.reduce((sum, f) => {
      const entities = (f as unknown as { entities?: string[] }).entities ?? [];
      return sum + entities.length;
    }, 0);

    return {
      slug: d.slug,
      label: d.label,
      description: d.description,
      featureCount: domainFeatures.length,
      endpointCount,
      journeyCount,
      entityCount,
    } satisfies FeatureDomain;
  }).filter((d): d is FeatureDomain => d !== null);
}

export function getFeaturesByDomain(domain: string): Feature[] {
  const allFeatures = featuresRaw.features as unknown as Feature[];
  return allFeatures.filter((f) => FEATURE_TO_DOMAIN[f.slug] === domain).filter(hasProductSurface);
}

export function getDomainForScope(scope: string): string | undefined {
  return SCOPE_TO_DOMAIN[scope.toLowerCase()];
}

export function getChangelogByDomain(domain: string): ChangelogEntry[] {
  const raw = changelogRaw.entries as {
    title?: string;
    mergedAt?: string;
    type?: string;
    area?: string;
    number?: number;
    url?: string;
  }[];

  const scopeRegex = /^\w+\(([^)]+)\):/;
  const matched = raw.filter((entry) => {
    const match = (entry.title ?? '').match(scopeRegex);
    if (!match) return false;
    const scope = match[1].toLowerCase();
    return SCOPE_TO_DOMAIN[scope] === domain;
  });

  return transformChangelog(matched);
}

export function getDashboardMetrics(): DashboardMetrics {
  const allFeatures = featuresRaw.features as unknown as Feature[];
  const allJourneys = journeysRaw.journeys as unknown as RawJourney[];

  return {
    totalFeatures: allFeatures.length,
    totalEndpoints: (apiContractsRaw.groups as unknown as ApiGroup[]).reduce(
      (sum, g) => sum + g.endpoints.length,
      0,
    ),
    totalJourneys: allJourneys.length,
    totalEntities: (dataModelRaw.entities as RawEntity[]).length,
    totalLifecycles: (lifecyclesRaw.lifecycles as RawLifecycle[]).length,
  };
}

/* ------------------------------------------------------------------ */
/*  4. ERD Category-Clustered Layout                                   */
/*  Groups entities by category into containers, lays out in 2 cols   */
/* ------------------------------------------------------------------ */

export interface ErdCategoryGroup {
  key: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const ERD_NODE_W = 160;
const ERD_NODE_H = 52;
const ERD_NODE_GAP_X = 80;
const ERD_NODE_GAP_Y = 70;
const ERD_GROUP_PADDING = 32;
const ERD_GROUP_HEADER = 36;
const ERD_GROUP_GAP = 100;
const ERD_GROUP_COL_GAP = 160;
const ERD_NODES_PER_ROW = 3; // Nodes per row within a group

const ERD_CATEGORY_ORDER: { key: string; label: string; color: string }[] = [
  { key: 'core', label: 'Core', color: '#3d8c75' },
  { key: 'shops', label: 'Shop Management', color: '#d4923a' },
  { key: 'commerce', label: 'Commerce', color: '#e27739' },
  { key: 'social', label: 'Social', color: '#9b7bd4' },
  { key: 'messaging', label: 'Messaging', color: '#5b9fd6' },
  { key: 'content', label: 'Content & Discovery', color: '#5bbfcf' },
  { key: 'user', label: 'User', color: '#8a8580' },
];

let _erdCategoryGroups: ErdCategoryGroup[] = [];

function transformErdNodes(rawNodes: RawErdNode[], rawEntities: RawEntity[]): ErdNode[] {
  const entityMap = new Map(rawEntities.map((e) => [e.name, e]));

  // If all nodes already have x/y, just enrich with badge/fieldCount
  const allHavePositions = rawNodes.every(
    (n) => typeof n.x === 'number' && typeof n.y === 'number',
  );
  if (allHavePositions) {
    _erdCategoryGroups = [];
    return rawNodes.map((node) => {
      const entity = entityMap.get(node.id);
      return {
        id: node.id,
        label: node.label,
        badge: ENTITY_CATEGORY_MAP[node.id],
        fieldCount: entity?.fields.length,
        x: node.x as number,
        y: node.y as number,
      };
    });
  }

  // Group nodes by category
  const groups = new Map<string, RawErdNode[]>();
  for (const node of rawNodes) {
    const cat = ENTITY_CATEGORY_MAP[node.id] ?? 'system';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(node);
  }

  // Compute group dimensions and positions
  const positioned: ErdNode[] = [];
  const categoryGroups: ErdCategoryGroup[] = [];

  // Lay out groups in 2 columns, filling top-to-bottom in each column
  const colYOffsets = [0, 0]; // Track current y for each column

  for (const catDef of ERD_CATEGORY_ORDER) {
    const groupNodes = groups.get(catDef.key);
    if (!groupNodes || groupNodes.length === 0) continue;

    // Compute group internal layout
    const nodesPerRow = Math.min(ERD_NODES_PER_ROW, groupNodes.length);
    const rows = Math.ceil(groupNodes.length / nodesPerRow);
    const contentW = nodesPerRow * ERD_NODE_W + (nodesPerRow - 1) * ERD_NODE_GAP_X;
    const contentH = rows * ERD_NODE_H + (rows - 1) * ERD_NODE_GAP_Y;
    const groupW = contentW + ERD_GROUP_PADDING * 2;
    const groupH = contentH + ERD_GROUP_PADDING * 2 + ERD_GROUP_HEADER;

    // Pick the shorter column
    const col = colYOffsets[0] <= colYOffsets[1] ? 0 : 1;

    // Compute max group width for this column (for alignment)
    const groupX = col * (groupW + ERD_GROUP_COL_GAP);
    const groupY = colYOffsets[col];

    categoryGroups.push({
      key: catDef.key,
      label: catDef.label,
      color: catDef.color,
      x: groupX,
      y: groupY,
      width: groupW,
      height: groupH,
    });

    // Position nodes within the group
    const contentX = groupX + ERD_GROUP_PADDING;
    const contentY = groupY + ERD_GROUP_PADDING + ERD_GROUP_HEADER;

    for (let i = 0; i < groupNodes.length; i++) {
      const node = groupNodes[i];
      const nodeCol = i % nodesPerRow;
      const nodeRow = Math.floor(i / nodesPerRow);
      const entity = entityMap.get(node.id);
      positioned.push({
        id: node.id,
        label: node.label,
        badge: catDef.key,
        fieldCount: entity?.fields.length,
        x: contentX + nodeCol * (ERD_NODE_W + ERD_NODE_GAP_X),
        y: contentY + nodeRow * (ERD_NODE_H + ERD_NODE_GAP_Y),
      });
    }

    colYOffsets[col] += groupH + ERD_GROUP_GAP;
  }

  // Align group widths within each column
  const leftGroups = categoryGroups.filter((g) => g.x === 0);
  const rightGroups = categoryGroups.filter((g) => g.x > 0);
  const maxLeftW = Math.max(...leftGroups.map((g) => g.width), 0);
  const maxRightW = Math.max(...rightGroups.map((g) => g.width), 0);
  for (const g of leftGroups) g.width = maxLeftW;
  // Align right column x and width
  const rightX = maxLeftW + ERD_GROUP_COL_GAP;
  for (const g of rightGroups) {
    g.x = rightX;
    g.width = maxRightW;
  }
  // Shift right-column node x positions to match
  for (const node of positioned) {
    const group = categoryGroups.find((g) => g.key === node.badge);
    if (group && group.x === rightX) {
      const oldGroup = ERD_CATEGORY_ORDER.find((c) => c.key === node.badge);
      if (oldGroup) {
        // Recompute node x relative to the aligned group x
        const groupNodes = groups.get(node.badge ?? 'system')!;
        const idx = groupNodes.findIndex((n) => n.id === node.id);
        const nodesPerRow = Math.min(ERD_NODES_PER_ROW, groupNodes.length);
        const nodeCol = idx % nodesPerRow;
        node.x = rightX + ERD_GROUP_PADDING + nodeCol * (ERD_NODE_W + ERD_NODE_GAP_X);
      }
    }
  }

  _erdCategoryGroups = categoryGroups;
  return positioned;
}

export function getErdCategoryGroups(): ErdCategoryGroup[] {
  return _erdCategoryGroups;
}

/* ------------------------------------------------------------------ */
/*  5. Changelog Grouping                                              */
/*  Flat PR entries → grouped by date with change types                */
/* ------------------------------------------------------------------ */

const TYPE_TO_CHANGE_TYPE: Record<string, ChangeType> = {
  feature: 'added',
  fix: 'fixed',
  refactor: 'changed',
  chore: 'changed',
  docs: 'changed',
};

function transformChangelog(
  raw: {
    title?: string;
    mergedAt?: string;
    type?: string;
    area?: string;
    number?: number;
    url?: string;
  }[],
): ChangelogEntry[] {
  // Group entries by date (YYYY-MM-DD from mergedAt)
  const byDate = new Map<string, ChangelogChange[]>();

  for (const entry of raw) {
    const date = entry.mergedAt ? entry.mergedAt.slice(0, 10) : 'unknown';
    if (!byDate.has(date)) byDate.set(date, []);

    // Strip conventional commit prefix for cleaner description
    const description = (entry.title ?? '')
      .replace(
        /^(feat|fix|chore|refactor|docs|style|test|perf|ci|build|revert)(\([^)]*\))?:\s*/i,
        '',
      )
      .replace(/^#\d+\s*/, '');

    byDate.get(date)!.push({
      type: TYPE_TO_CHANGE_TYPE[entry.type ?? ''] ?? 'changed',
      description: description || entry.title || 'No description',
      area: entry.area,
      prNumber: entry.number,
      prUrl: entry.url,
    });
  }

  // Sort dates descending and return as ChangelogEntry[]
  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, changes]) => ({ date, changes }));
}

/* ------------------------------------------------------------------ */
/*  Static exports                                                     */
/* ------------------------------------------------------------------ */

export const apiGroups = apiContractsRaw.groups as unknown as ApiGroup[];

export const entities = transformEntities(dataModelRaw.entities as RawEntity[]);

export const erdNodes = transformErdNodes(
  entityRelationshipsRaw.nodes as RawErdNode[],
  dataModelRaw.entities as RawEntity[],
);
export const erdEdges = entityRelationshipsRaw.edges as unknown as ErdEdge[];

export const roles = permissionsRaw.roles as unknown as Role[];

export const configEnums = configReferenceRaw.configs as unknown as ConfigEnum[];

export const features = featuresRaw.features as unknown as Feature[];

export const lifecycles = transformLifecycles(lifecyclesRaw.lifecycles as RawLifecycle[]);

const journeys: Journey[] = transformJourneys(journeysRaw.journeys as unknown as RawJourney[]);

export const changelog = transformChangelog(
  changelogRaw.entries as {
    title?: string;
    mergedAt?: string;
    type?: string;
    area?: string;
    number?: number;
    url?: string;
  }[],
);

export const roadmapItems = roadmapRaw.items as unknown as RoadmapItem[];

export const extractionMeta = metaRaw as unknown as ExtractionMeta;

/* ------------------------------------------------------------------ */
/*  6. Journey helpers                                                 */
/* ------------------------------------------------------------------ */

export function getAllJourneys(): Journey[] {
  return journeys;
}

export function getJourney(slugOrDomain: string, slug?: string): Journey | undefined {
  if (slug) {
    return journeys.find((j) => j.domain === slugOrDomain && j.slug === slug);
  }
  return journeys.find((j) => j.slug === slugOrDomain);
}

export function getJourneySlugs(): string[] {
  return journeys.map((j) => j.slug);
}

/* ------------------------------------------------------------------ */
/*  Domain helpers                                                     */
/* ------------------------------------------------------------------ */

export interface DomainWithStats extends DomainConfig {
  journeyCount: number;
  stepCount: number;
  decisionCount: number;
}

export function getDomains(): DomainWithStats[] {
  return DOMAINS.map((d) => {
    const dJourneys = journeys.filter((j) => j.domain === d.slug);
    const allNodes = dJourneys.flatMap((j) => j.nodes);
    const steps = allNodes.filter((n) => n.type === 'step');
    return {
      ...d,
      journeyCount: dJourneys.length,
      stepCount: steps.length,
      decisionCount: allNodes.filter((n) => n.type === 'decision').length,
    };
  }).filter((d) => d.journeyCount > 0);
}

export function getJourneysByDomain(domain: string): Journey[] {
  return journeys.filter((j) => j.domain === domain);
}

export function getDomainSlugs(): string[] {
  return getDomains().map((d) => d.slug);
}

/* ------------------------------------------------------------------ */
/*  Lifecycle helpers                                                  */
/* ------------------------------------------------------------------ */

export function getLifecycle(slug: string): Lifecycle | undefined {
  return lifecycles.find((l) => l.slug === slug);
}

export function getLifecycleSlugs(): string[] {
  return lifecycles.map((l) => l.slug);
}

export function getAllLifecycles(): Lifecycle[] {
  return lifecycles;
}

/* ------------------------------------------------------------------ */
/*  Architecture helpers                                               */
/* ------------------------------------------------------------------ */

const archDiagrams: ArchDiagram[] = (architectureRaw as { diagrams: ArchDiagram[] }).diagrams;

export function getAllArchDiagrams(): ArchDiagram[] {
  return archDiagrams;
}

export function getArchDiagram(slug: string): ArchDiagram | undefined {
  return archDiagrams.find((d) => d.slug === slug);
}

export function getArchDiagramSlugs(): string[] {
  return archDiagrams.map((d) => d.slug);
}

/* ------------------------------------------------------------------ */
/*  Cross-link helpers                                                 */
/* ------------------------------------------------------------------ */

export function getLinksForRoute(route: string): CrossLink[] {
  const links: CrossLink[] = [];
  for (const group of apiGroups) {
    for (const ep of group.endpoints) {
      const key = `${ep.method} ${ep.path}`;
      if (key === route) {
        const anchor = ep.path
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        links.push({
          label: `${ep.method} ${ep.path}`,
          href: `/api-map#${anchor}`,
          highlight: route,
        });
      }
    }
  }
  return links;
}

export function getErrorsForEndpoint(method: string, path: string): ErrorCase[] {
  const errors: ErrorCase[] = [];
  const seen = new Set<string>();
  const key = `${method} ${path}`;
  for (const journey of getAllJourneys()) {
    for (const node of journey.nodes) {
      if (node.type === 'step' && node.route === key && node.errorCases) {
        for (const err of node.errorCases) {
          const sig = `${err.condition}|${err.httpStatus}`;
          if (!seen.has(sig)) {
            seen.add(sig);
            errors.push(err);
          }
        }
      }
    }
  }
  return errors;
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
