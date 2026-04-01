import type { Entity } from '@/types/data-model';
import type { Journey } from '@/types/journey';
import type { Lifecycle } from '@/types/lifecycle';
import type { ApiGroup, ApiEndpoint } from '@/types/api-contract';
import type { ArchDiagram } from '@/types/architecture';
import type { Feature } from '@/types/feature';
import type { ErdNode, ErdEdge } from '@/types/entity-relationship';
import type { ConfigEnum } from '@/types/config-ref';

export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

export interface FieldChange {
  field: string;
  baseValue: unknown;
  headValue: unknown;
}

export interface ModifiedItem<T> {
  base: T;
  head: T;
  changes: FieldChange[];
}

export interface DiffSet<T> {
  added: T[];
  removed: T[];
  modified: ModifiedItem<T>[];
  unchanged: T[];
  statusMap: Map<string, DiffStatus>;
}

export interface ApiGroupDiff {
  group: ApiGroup;
  status: DiffStatus;
  endpointDiffs: {
    added: ApiEndpoint[];
    removed: ApiEndpoint[];
    modified: { base: ApiEndpoint; head: ApiEndpoint; changes: FieldChange[] }[];
    unchanged: ApiEndpoint[];
  };
}

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  byDomain: Record<string, { added: number; removed: number; modified: number }>;
}

export interface DiffResult {
  entities: DiffSet<Entity>;
  journeys: DiffSet<Journey>;
  lifecycles: DiffSet<Lifecycle>;
  apiGroups: DiffSet<ApiGroup>;
  apiGroupDiffs: ApiGroupDiff[];
  archDiagrams: DiffSet<ArchDiagram>;
  features: DiffSet<Feature>;
  erdNodes: DiffSet<ErdNode>;
  erdEdges: DiffSet<ErdEdge>;
  configEnums: DiffSet<ConfigEnum>;
  summary: DiffSummary;
}
