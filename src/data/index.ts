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
import type { Journey, JourneyNode, JourneyEdge } from '@/types/journey';
import type { ChangelogEntry, ChangeType } from '@/types/changelog';
import type { CrossLink } from '@/types/docs-context';
import type { ErrorCase } from '@/types/journey';
import type { RoadmapItem } from '@/types/roadmap';
import type { ExtractionMeta } from '@/types/extraction-meta';
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
import metaRaw from './generated/_meta.json';

/* ------------------------------------------------------------------ */
/*  Raw types — what the extractors produce (no x/y guaranteed)       */
/* ------------------------------------------------------------------ */

interface RawJourneyNode {
  id: string;
  type: 'entry' | 'step' | 'decision';
  label?: string;
  title?: string;
  x?: number;
  y?: number;
  layer?: string;
  status?: string;
  route?: string;
  codeRef?: string;
  notes?: string;
  why?: string;
  tooltip?: string;
  action?: string;
  method?: string;
  errorCases?: ErrorCase[];
  ux?: JourneyNode['ux'];
  options?: JourneyNode['options'];
}

interface RawJourneyEdge {
  from: string;
  to: string;
  opt?: string;
}

interface RawJourney {
  slug: string;
  domain: string;
  title: string;
  persona: string;
  description: string;
  relatedIssues?: number[];
  nodes: RawJourneyNode[];
  edges: RawJourneyEdge[];
}

interface RawLifecycleState {
  id: string;
  label: string;
}

interface RawLifecycle {
  slug: string;
  name: string;
  badge?: string;
  description: string;
  why?: string;
  source?: 'enum' | 'check_constraint' | 'typescript';
  states: RawLifecycleState[];
  transitions: { from: string; to: string; label: string }[];
}

interface RawErdNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
}

interface RawEntity {
  name: string;
  label?: string;
  badges?: string[];
  fields: { name: string; type: string; nullable?: boolean; description?: string }[];
}

/* ------------------------------------------------------------------ */
/*  1. Journey Horizontal Layout Engine                                */
/*  BFS from entry nodes → left-to-right column assignment            */
/* ------------------------------------------------------------------ */

const NODE_W = 200;
const NODE_H = 80;
const H_GAP = 100;
const V_GAP = 100;

function layoutJourneyNodes(rawNodes: RawJourneyNode[], rawEdges: RawJourneyEdge[]): JourneyNode[] {
  // If all nodes already have x/y, use them as-is (backwards compat)
  const allHavePositions = rawNodes.every(
    (n) => typeof n.x === 'number' && typeof n.y === 'number',
  );
  if (allHavePositions) {
    return rawNodes as JourneyNode[];
  }

  // Build adjacency from edges
  const outgoing = new Map<string, string[]>();
  const incomingCount = new Map<string, number>();
  for (const node of rawNodes) {
    outgoing.set(node.id, []);
    incomingCount.set(node.id, 0);
  }
  for (const edge of rawEdges) {
    outgoing.get(edge.from)?.push(edge.to);
    incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 0) + 1);
  }

  // Entry nodes: explicit type=entry OR zero incoming edges
  const entryIds = rawNodes
    .filter((n) => n.type === 'entry' || (incomingCount.get(n.id) ?? 0) === 0)
    .map((n) => n.id);
  const roots = entryIds.length > 0 ? entryIds : [rawNodes[0]?.id].filter(Boolean);

  // BFS to assign column levels (first-visit — back-edges ignored for layout)
  const level = new Map<string, number>();
  const queue: string[] = [];
  for (const r of roots) {
    level.set(r, 0);
    queue.push(r);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = level.get(current)!;
    for (const next of outgoing.get(current) ?? []) {
      if (!level.has(next)) {
        level.set(next, currentLevel + 1);
        queue.push(next);
      }
    }
  }

  // Assign any unreachable nodes to column 0
  for (const node of rawNodes) {
    if (!level.has(node.id)) level.set(node.id, 0);
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
        x: lvl * (NODE_W + H_GAP),
        y: i * (NODE_H + V_GAP),
      });
    }
  }

  return rawNodes.map((node) => ({
    ...node,
    x: positions.get(node.id)?.x ?? 0,
    y: positions.get(node.id)?.y ?? 0,
  })) as JourneyNode[];
}

/** Clean journey titles: strip parenthetical tech details, arrows, file refs */
function cleanJourneyTitle(title: string): string {
  let t = title;
  // Strip parenthetical details: "Account Deletion (Full Cascade)" → "Account Deletion"
  t = t.replace(/\s*\([^)]*\)\s*/g, '').trim();
  // Strip arrow chains: "Guest Cart → Login → Merge" → "Guest Cart"
  // But keep the first segment which is the meaningful name
  if (t.includes(' → ')) {
    t = t.split(' → ')[0].trim();
  }
  // Strip "& TechDetail" when the second part is technical
  // Keep genuine compound names like "Browse & Discover"
  return t;
}

/** Convert a node id slug to a readable label: "delete-account--click-delete" → "Click Delete" */
function idToLabel(id: string): string {
  // Take the part after "--" if present (the action), otherwise the whole id
  const parts = id.split('--');
  const actionPart = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return actionPart
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Normalize raw nodes: v2 schema uses 'title' instead of 'label', handle both */
function normalizeNodes(rawNodes: RawJourneyNode[]): RawJourneyNode[] {
  return rawNodes.map((n) => ({
    ...n,
    label: n.label || n.title || n.route || idToLabel(n.id),
  }));
}

function transformJourneys(raw: RawJourney[]): Journey[] {
  return raw.map((j) => {
    const normalizedNodes = normalizeNodes(j.nodes);
    return {
      ...j,
      title: cleanJourneyTitle(j.title),
      nodes: layoutJourneyNodes(normalizedNodes, j.edges),
      edges: j.edges as JourneyEdge[],
    };
  }) as Journey[];
}

/* ------------------------------------------------------------------ */
/*  2. Lifecycle Layout + Color Assignment                             */
/*  Topological sort via transitions → left-to-right positions        */
/* ------------------------------------------------------------------ */

const LC_NODE_W = 140;
const LC_NODE_H = 60;
const LC_H_GAP = 80;
const LC_V_GAP = 80;

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

    const maxIter = stateIds.length * lc.transitions.length + stateIds.length;
    let iter = 0;
    while (bfsQueue.length > 0 && iter++ < maxIter) {
      const current = bfsQueue.shift()!;
      const currentLevel = level.get(current)!;
      for (const next of outgoing.get(current) ?? []) {
        const proposed = currentLevel + 1;
        if (!level.has(next) || level.get(next)! < proposed) {
          level.set(next, proposed);
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
  members: 'core',
  shops: 'core',
  listings: 'core',
  cart_items: 'core',
  shop_invites: 'lifecycle',
  shop_ownership_transfers: 'lifecycle',
  shop_members: 'junction',
  shop_roles: 'junction',
  listing_photos: 'media',
  recently_viewed: 'tracking',
  search_suggestions: 'discovery',
  addresses: 'user',
  slugs: 'system',
};

function transformEntities(raw: RawEntity[]): Entity[] {
  return raw.map((e) => ({
    ...e,
    badge: ENTITY_CATEGORY_MAP[e.name] ?? 'system',
  }));
}

/* ------------------------------------------------------------------ */
/*  4. ERD Grid Layout                                                 */
/*  Compute grid positions from node count (no incoming x/y)          */
/* ------------------------------------------------------------------ */

const ERD_COLS = 3;
const ERD_X_SPACING = 280;
const ERD_Y_SPACING = 160;

function transformErdNodes(rawNodes: RawErdNode[], rawEntities: RawEntity[]): ErdNode[] {
  const entityMap = new Map(rawEntities.map((e) => [e.name, e]));

  // If all nodes already have x/y, just enrich with badge/fieldCount
  const allHavePositions = rawNodes.every(
    (n) => typeof n.x === 'number' && typeof n.y === 'number',
  );

  return rawNodes.map((node, index) => {
    const entity = entityMap.get(node.id);
    const col = index % ERD_COLS;
    const row = Math.floor(index / ERD_COLS);
    return {
      id: node.id,
      label: node.label,
      badge: ENTITY_CATEGORY_MAP[node.id],
      fieldCount: entity?.fields.length,
      x: allHavePositions ? (node.x as number) : col * ERD_X_SPACING,
      y: allHavePositions ? (node.y as number) : row * ERD_Y_SPACING,
    };
  });
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
  raw: { title?: string; mergedAt?: string; type?: string; area?: string }[],
): ChangelogEntry[] {
  // Group entries by date (YYYY-MM-DD from mergedAt)
  const byDate = new Map<string, { type: ChangeType; description: string; area?: string }[]>();

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
  changelogRaw.entries as { title?: string; mergedAt?: string; type?: string; area?: string }[],
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

/* ------------------------------------------------------------------ */
/*  Lifecycle helpers                                                  */
/* ------------------------------------------------------------------ */

export function getLifecycle(slug: string): Lifecycle | undefined {
  return lifecycles.find((l) => l.slug === slug);
}

export function getLifecycleSlugs(): string[] {
  return lifecycles.map((l) => l.slug);
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
