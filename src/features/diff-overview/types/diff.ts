import type { Entity } from '@/features/data-model';
import type { Journey } from '@/features/journeys';
import type { Lifecycle } from '@/features/lifecycles';
import type { ApiGroup, ApiEndpoint } from '@/features/api-map';
import type { ArchDiagram } from '@/features/architecture';
import type { Feature } from '@/features/domains';
import type { ErdNode, ErdEdge } from '@/features/data-model';
import type { ConfigEnum } from '@/features/config';

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
