/* ------------------------------------------------------------------ */
/*  Adapter layer — imports generated JSON and re-exports typed data  */
/*  Transforms raw extraction output into shapes the UI expects       */
/* ------------------------------------------------------------------ */

import type { ApiGroup } from '@/types/api-contract';
import type { ErdEdge } from '@/types/entity-relationship';
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

import { transformErdNodes, getErdCategoryGroups } from './layout/erd-layout';
export type { ErdCategoryGroup } from './layout/erd-layout';
export { getErdCategoryGroups };

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
