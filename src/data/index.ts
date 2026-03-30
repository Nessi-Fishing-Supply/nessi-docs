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
import type { ChangelogEntry, ChangelogChange, ChangeType } from '@/types/changelog';
import type { CrossLink } from '@/types/docs-context';
import type { FeatureDomain, DashboardMetrics } from '@/types/dashboard';
import type { ErrorCase } from '@/types/journey';
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
  fields: {
    name: string;
    type: string;
    nullable?: boolean;
    description?: string;
    isPrimaryKey?: boolean;
    default?: string;
    references?: { table: string; column: string; onDelete?: string };
  }[];
  rlsPolicies?: {
    name: string;
    operation: string;
    using?: string;
    withCheck?: string;
  }[];
  indexes?: {
    name: string;
    columns: string[];
    unique: boolean;
  }[];
  triggers?: {
    name: string;
    event: string;
    timing: string;
    function: string;
  }[];
}

/* ------------------------------------------------------------------ */
/*  1. Journey Horizontal Layout Engine                                */
/*  Topological layering with decision-aware vertical positioning      */
/* ------------------------------------------------------------------ */

const NODE_W = 200;
const NODE_H = 80;
const H_GAP = 100;
const V_GAP = 100;
const MULTI_ENTRY_GAP = 200; // Extra vertical gap between sub-journeys

function layoutJourneyNodes(rawNodes: RawJourneyNode[], rawEdges: RawJourneyEdge[]): JourneyNode[] {
  // If all nodes already have x/y, use them as-is (backwards compat)
  const allHavePositions = rawNodes.every(
    (n) => typeof n.x === 'number' && typeof n.y === 'number',
  );
  if (allHavePositions) {
    return rawNodes as JourneyNode[];
  }

  // ── Build adjacency ──
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const node of rawNodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }
  for (const edge of rawEdges) {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.get(edge.to)?.push(edge.from);
  }

  // ── Detect back-edges via DFS ──
  const backEdgeSet = new Set<number>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function detectBackEdges(nodeId: string) {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const next of outgoing.get(nodeId) ?? []) {
      if (inStack.has(next)) {
        const ei = rawEdges.findIndex((e) => e.from === nodeId && e.to === next);
        if (ei >= 0) backEdgeSet.add(ei);
      } else if (!visited.has(next)) {
        detectBackEdges(next);
      }
    }
    inStack.delete(nodeId);
  }

  const entryIds = rawNodes
    .filter((n) => n.type === 'entry' || (incoming.get(n.id) ?? []).length === 0)
    .map((n) => n.id);
  const roots = entryIds.length > 0 ? entryIds : [rawNodes[0]?.id].filter(Boolean);

  for (const r of roots) {
    if (!visited.has(r)) detectBackEdges(r);
  }
  // Visit any remaining disconnected nodes
  for (const node of rawNodes) {
    if (!visited.has(node.id)) detectBackEdges(node.id);
  }

  // ── Build DAG adjacency (outgoing minus back-edges) ──
  const dagOutgoing = new Map<string, string[]>();
  const dagIncoming = new Map<string, string[]>();
  for (const node of rawNodes) {
    dagOutgoing.set(node.id, []);
    dagIncoming.set(node.id, []);
  }
  rawEdges.forEach((edge, i) => {
    if (!backEdgeSet.has(i)) {
      dagOutgoing.get(edge.from)?.push(edge.to);
      dagIncoming.get(edge.to)?.push(edge.from);
    }
  });

  // ── Longest-path column assignment ──
  const colMemo = new Map<string, number>();

  function longestPathTo(nodeId: string): number {
    if (colMemo.has(nodeId)) return colMemo.get(nodeId)!;
    const parents = dagIncoming.get(nodeId) ?? [];
    if (parents.length === 0) {
      colMemo.set(nodeId, 0);
      return 0;
    }
    const maxParent = Math.max(...parents.map((p) => longestPathTo(p)));
    const col = maxParent + 1;
    colMemo.set(nodeId, col);
    return col;
  }

  const column = new Map<string, number>();
  for (const node of rawNodes) {
    column.set(node.id, longestPathTo(node.id));
  }

  // ── Identify sub-journeys ──
  // BFS from each entry node through DAG edges to assign nodes to entry groups
  const nodeToEntry = new Map<string, string>();

  for (const entryId of roots) {
    const bfsQueue = [entryId];
    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift()!;
      if (nodeToEntry.has(current)) continue;
      nodeToEntry.set(current, entryId);
      for (const next of dagOutgoing.get(current) ?? []) {
        if (!nodeToEntry.has(next)) bfsQueue.push(next);
      }
    }
  }
  // Assign any remaining nodes to the first root
  for (const node of rawNodes) {
    if (!nodeToEntry.has(node.id)) {
      nodeToEntry.set(node.id, roots[0]);
    }
  }

  // Group entries in order
  const entryOrder = roots.filter((r) => rawNodes.some((n) => nodeToEntry.get(n.id) === r));

  // ── Decision-aware vertical positioning ──
  // Build a map from decision node id → ordered option target ids
  const nodeById = new Map(rawNodes.map((n) => [n.id, n]));
  const decisionChildren = new Map<string, string[]>();
  for (const node of rawNodes) {
    if (node.type === 'decision' && node.options) {
      const ordered = node.options.map((opt) => opt.to).filter((to): to is string => !!to);
      decisionChildren.set(node.id, ordered);
    }
  }

  function getOrderedChildren(nodeId: string): string[] {
    const dc = decisionChildren.get(nodeId);
    if (dc) {
      // Return decision options in order, then any DAG children not in options
      const optSet = new Set(dc);
      const extra = (dagOutgoing.get(nodeId) ?? []).filter((c) => !optSet.has(c));
      return [...dc, ...extra];
    }
    return dagOutgoing.get(nodeId) ?? [];
  }

  // Subtree extent: total vertical height a subtree needs
  const extentMemo = new Map<string, number>();

  function subtreeExtent(nodeId: string): number {
    if (extentMemo.has(nodeId)) return extentMemo.get(nodeId)!;
    const children = getOrderedChildren(nodeId);
    const dagChildren = children.filter((c) => (dagOutgoing.get(nodeId) ?? []).includes(c));
    if (dagChildren.length === 0) {
      extentMemo.set(nodeId, NODE_H);
      return NODE_H;
    }
    const n = nodeById.get(nodeId);
    if (n?.type === 'decision' && dagChildren.length > 1) {
      // Sum all branch extents + gaps between them
      const total = dagChildren.reduce((sum, c) => sum + subtreeExtent(c), 0);
      const gaps = (dagChildren.length - 1) * V_GAP;
      const ext = Math.max(NODE_H, total + gaps);
      extentMemo.set(nodeId, ext);
      return ext;
    }
    // Linear node: take max child extent
    const maxExt = Math.max(...dagChildren.map((c) => subtreeExtent(c)));
    const ext = Math.max(NODE_H, maxExt);
    extentMemo.set(nodeId, ext);
    return ext;
  }

  const positions = new Map<string, { x: number; y: number }>();
  const placed = new Set<string>();

  function layoutSubJourney(entryId: string, yStart: number): number {
    // Place nodes depth-first from the entry
    const stack: { nodeId: string; y: number }[] = [{ nodeId: entryId, y: yStart }];
    let maxY = yStart;

    while (stack.length > 0) {
      const { nodeId, y } = stack.pop()!;
      if (placed.has(nodeId)) continue;
      if (nodeToEntry.get(nodeId) !== entryId) continue;

      placed.add(nodeId);
      const col = column.get(nodeId) ?? 0;
      positions.set(nodeId, {
        x: col * (NODE_W + H_GAP),
        y,
      });
      maxY = Math.max(maxY, y + NODE_H);

      const children = getOrderedChildren(nodeId).filter(
        (c) =>
          !placed.has(c) &&
          nodeToEntry.get(c) === entryId &&
          (dagOutgoing.get(nodeId) ?? []).includes(c),
      );

      const n = nodeById.get(nodeId);
      if (n?.type === 'decision' && children.length > 1) {
        // Decision fork: first option inherits parent's y (happy path),
        // alternates stack below
        let branchY = y;
        // Process in reverse so first child ends up on top of the stack (processed first)
        for (let i = children.length - 1; i >= 0; i--) {
          const childY = i === 0 ? y : branchY;
          stack.push({ nodeId: children[i], y: childY });
          if (i > 0) {
            // Stack next branch below
            const ext = subtreeExtent(children[i]);
            branchY = Math.max(branchY + ext + V_GAP, branchY + NODE_H + V_GAP);
          }
          if (i === 0 && children.length > 1) {
            // After first child (happy path), start alternates below
            branchY = y + subtreeExtent(children[0]) + V_GAP;
          }
        }
        // Re-do: place first at y, then stack remaining below
        // Clear the stack entries we just added and redo correctly
        // (The loop above already handles this: i=0 gets y, others get stacked branchY)
      } else {
        // Linear flow: all children get same y as parent
        for (let i = children.length - 1; i >= 0; i--) {
          stack.push({ nodeId: children[i], y });
        }
      }
    }

    return maxY;
  }

  // ── Layout each sub-journey ──
  let currentY = 0;
  for (let i = 0; i < entryOrder.length; i++) {
    const maxY = layoutSubJourney(entryOrder[i], currentY);
    currentY = maxY + MULTI_ENTRY_GAP;
  }

  // Place any remaining unplaced nodes
  for (const node of rawNodes) {
    if (!placed.has(node.id)) {
      const col = column.get(node.id) ?? 0;
      positions.set(node.id, {
        x: col * (NODE_W + H_GAP),
        y: currentY,
      });
      currentY += NODE_H + V_GAP;
    }
  }

  // ── Normalize — translate all positions so first entry is at (0, 0) ──
  const firstEntry = roots[0];
  const originPos = positions.get(firstEntry) ?? { x: 0, y: 0 };
  const offsetX = originPos.x;
  const offsetY = originPos.y;

  if (offsetX !== 0 || offsetY !== 0) {
    for (const [id, pos] of positions) {
      positions.set(id, {
        x: pos.x - offsetX,
        y: pos.y - offsetY,
      });
    }
  }

  return rawNodes.map((node) => ({
    ...node,
    x: positions.get(node.id)?.x ?? 0,
    y: positions.get(node.id)?.y ?? 0,
  })) as JourneyNode[];
}

/**
 * Detect back-edges (cycle edges) in a journey's edge list.
 * Returns a Set of edge indices that are back-edges.
 * Used by JourneyCanvas to render back-edges with distinct visual treatment.
 */
export function detectJourneyBackEdges(
  nodes: { id: string; type: string }[],
  edges: { from: string; to: string }[],
): Set<number> {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const node of nodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }
  for (const edge of edges) {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.get(edge.to)?.push(edge.from);
  }

  const backEdges = new Set<number>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string) {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const next of outgoing.get(nodeId) ?? []) {
      if (inStack.has(next)) {
        const ei = edges.findIndex((e) => e.from === nodeId && e.to === next);
        if (ei >= 0) backEdges.add(ei);
      } else if (!visited.has(next)) {
        dfs(next);
      }
    }
    inStack.delete(nodeId);
  }

  const roots = nodes
    .filter((n) => n.type === 'entry' || (incoming.get(n.id) ?? []).length === 0)
    .map((n) => n.id);
  for (const r of roots) {
    if (!visited.has(r)) dfs(r);
  }
  for (const node of nodes) {
    if (!visited.has(node.id)) dfs(node.id);
  }

  return backEdges;
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

/** Map extracted domain slugs to current domain slugs (for renamed/merged domains). */
const DOMAIN_ALIASES: Record<string, string> = {
  identity: 'auth',
};

function transformJourneys(raw: RawJourney[]): Journey[] {
  return raw.map((j) => {
    const normalizedNodes = normalizeNodes(j.nodes);
    return {
      ...j,
      domain: DOMAIN_ALIASES[j.domain] ?? j.domain,
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
