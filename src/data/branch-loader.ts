/* ------------------------------------------------------------------ */
/*  Branch loader — loads a raw bundle, runs all transforms,          */
/*  and returns a typed BranchData object.                            */
/*  All branches are pre-computed at module load time.               */
/* ------------------------------------------------------------------ */

import type { BranchData } from '@/features/shared/types/branch';
import type { ApiGroup } from '@/features/api-map';
import type { ErdEdge } from '@/features/data-model';
import type { Role } from '@/features/config';
import type { ConfigEnum } from '@/features/config';
import type { Feature } from '@/features/domains';
import type { ArchDiagram } from '@/features/architecture';
import type { RoadmapItem } from '@/features/shared/types/roadmap';
import type { ExtractionMeta } from '@/features/shared/types/extraction-meta';
import type { RawJourney, RawLifecycle, RawErdNode, RawEntity } from './raw-types';

import { transformJourneys } from './layout/journey-layout';
import { transformLifecycles } from './layout/lifecycle-layout';
import { transformErdNodes, getErdCategoryGroups } from './layout/erd-layout';
import { transformEntities } from './transforms/entities';
import { transformChangelog } from './transforms/changelog';

import * as mainRaw from './branches/raw-main';
import * as stagingRaw from './branches/raw-staging';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RawBundle = typeof mainRaw;

const RAW_BUNDLES: Record<string, RawBundle> = {
  main: mainRaw,
  staging: stagingRaw,
};

/* ------------------------------------------------------------------ */
/*  Transform                                                          */
/* ------------------------------------------------------------------ */

function transformBundle(raw: RawBundle): BranchData {
  const apiGroups = raw.apiContracts.groups as unknown as ApiGroup[];
  const entities = transformEntities(raw.dataModel.entities as RawEntity[]);
  const erdNodes = transformErdNodes(
    raw.entityRelationships.nodes as RawErdNode[],
    raw.dataModel.entities as RawEntity[],
  );
  const erdEdges = raw.entityRelationships.edges as unknown as ErdEdge[];
  const erdCategoryGroups = getErdCategoryGroups();
  const roles = raw.permissions.roles as unknown as Role[];
  const configEnums = raw.configReference.configs as unknown as ConfigEnum[];
  const features = raw.features.features as unknown as Feature[];
  const lifecycles = transformLifecycles(raw.lifecycles.lifecycles as RawLifecycle[]);
  const journeys = transformJourneys(raw.journeys.journeys as unknown as RawJourney[]);
  const rawChangelogEntries = raw.changelog.entries as {
    title?: string;
    mergedAt?: string;
    type?: string;
    area?: string;
    number?: number;
    url?: string;
  }[];
  const changelog = transformChangelog(rawChangelogEntries);
  const rawChangelog = rawChangelogEntries;
  const roadmapItems = raw.roadmap.items as unknown as RoadmapItem[];
  const meta = raw.meta as unknown as ExtractionMeta;
  const archDiagrams = (raw.architecture as { diagrams: ArchDiagram[] }).diagrams;

  return {
    meta,
    entities,
    journeys,
    lifecycles,
    erdNodes,
    erdEdges,
    erdCategoryGroups,
    apiGroups,
    archDiagrams,
    features,
    roles,
    configEnums,
    changelog,
    rawChangelog,
    roadmapItems,
  };
}

/* ------------------------------------------------------------------ */
/*  Cache — pre-computed at module load time                          */
/* ------------------------------------------------------------------ */

const BRANCH_CACHE: Record<string, BranchData> = {};
for (const [name, raw] of Object.entries(RAW_BUNDLES)) {
  BRANCH_CACHE[name] = transformBundle(raw);
}

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export function loadBranch(name: string): BranchData | null {
  return BRANCH_CACHE[name] ?? null;
}

export function getAllBranchData(): Record<string, BranchData> {
  return BRANCH_CACHE;
}
