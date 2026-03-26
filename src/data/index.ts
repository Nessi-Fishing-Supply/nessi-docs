/* ------------------------------------------------------------------ */
/*  Adapter layer — imports generated JSON and re-exports typed data  */
/* ------------------------------------------------------------------ */

import type { ApiGroup } from '@/types/api-contract';
import type { Entity } from '@/types/data-model';
import type { ErdNode, ErdEdge } from '@/types/entity-relationship';
import type { Role } from '@/types/permission';
import type { ConfigEnum } from '@/types/config-ref';
import type { Feature } from '@/types/feature';
import type { Lifecycle } from '@/types/lifecycle';
import type { Journey } from '@/types/journey';
import type { OnboardingStep, SellerPrecondition } from '@/types/onboarding';
import type { ChangelogEntry } from '@/types/changelog';
import type { CrossLink } from '@/types/docs-context';
import type { ErrorCase } from '@/types/journey';
import type { RoadmapItem } from '@/types/roadmap';
import type { ExtractionMeta } from '@/types/extraction-meta';

import apiContractsRaw from './generated/api-contracts.json';
import dataModelRaw from './generated/data-model.json';
import entityRelationshipsRaw from './generated/entity-relationships.json';
import permissionsRaw from './generated/permissions.json';
import configReferenceRaw from './generated/config-reference.json';
import featuresRaw from './generated/features.json';
import lifecyclesRaw from './generated/lifecycles.json';
import journeysRaw from './generated/journeys.json';
import onboardingRaw from './generated/onboarding.json';
import changelogRaw from './generated/changelog.json';
import roadmapRaw from './generated/roadmap.json';
import metaRaw from './generated/_meta.json';

/* ------------------------------------------------------------------ */
/*  Static exports                                                     */
/* ------------------------------------------------------------------ */

export const apiGroups = apiContractsRaw.groups as unknown as ApiGroup[];

export const entities = dataModelRaw.entities as unknown as Entity[];

export const erdNodes = entityRelationshipsRaw.nodes as unknown as ErdNode[];
export const erdEdges = entityRelationshipsRaw.edges as unknown as ErdEdge[];

export const roles = permissionsRaw.roles as unknown as Role[];

export const configEnums = configReferenceRaw.configs as unknown as ConfigEnum[];

export const features = featuresRaw.features as unknown as Feature[];

export const lifecycles = lifecyclesRaw.lifecycles as unknown as Lifecycle[];

export const onboardingSteps = onboardingRaw.steps as unknown as OnboardingStep[];
export const sellerPreconditions = onboardingRaw.sellerPreconditions as unknown as SellerPrecondition[];

export const changelog = changelogRaw.entries as unknown as ChangelogEntry[];

export const roadmapItems = roadmapRaw.items as unknown as RoadmapItem[];

export const extractionMeta = metaRaw as unknown as ExtractionMeta;

/* ------------------------------------------------------------------ */
/*  Journey helpers                                                    */
/* ------------------------------------------------------------------ */

const journeys: Journey[] = journeysRaw.journeys as Journey[];

export function getAllJourneys(): Journey[] {
  return journeys;
}

export function getJourney(slug: string): Journey | undefined {
  return journeys.find((j) => j.slug === slug);
}

export function getJourneySlugs(): string[] {
  return journeys.map((j) => j.slug);
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
        links.push({ label: `${ep.method} ${ep.path}`, href: `/api-map#${anchor}`, highlight: route });
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
