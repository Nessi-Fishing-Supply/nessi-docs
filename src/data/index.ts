/* ------------------------------------------------------------------ */
/*  Adapter layer — imports generated JSON and re-exports typed data  */
/*  Transforms raw extraction output into shapes the UI expects       */
/* ------------------------------------------------------------------ */

import type { ApiGroup } from '@/types/api-contract';
import type { ErdNode, ErdEdge } from '@/types/entity-relationship';
import type { Role } from '@/types/permission';
import type { ConfigEnum } from '@/types/config-ref';
import type { Feature } from '@/types/feature';
import type { Lifecycle } from '@/types/lifecycle';
import type { Journey } from '@/types/journey';
import type { CrossLink } from '@/types/docs-context';
import type { ErrorCase } from '@/types/journey';
import type { RawJourney, RawLifecycle, RawErdNode, RawEntity } from './raw-types';
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
import { transformLifecycles } from './layout/lifecycle-layout';
import { transformEntities } from './transforms/entities';
import { ENTITY_CATEGORY_MAP } from './transforms/entities';
import { transformChangelog } from './transforms/changelog';
import {
  getFeatureDomains,
  getFeaturesByDomain,
  getDomainForScope,
  getChangelogByDomain,
  getDashboardMetrics,
} from './transforms/features';

export { detectJourneyBackEdges };
export {
  getFeatureDomains,
  getFeaturesByDomain,
  getDomainForScope,
  getChangelogByDomain,
  getDashboardMetrics,
};

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
