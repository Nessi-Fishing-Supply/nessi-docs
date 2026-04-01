import type { ExtractionMeta } from '@/types/extraction-meta';
import type { Entity } from '@/types/data-model';
import type { Journey } from '@/types/journey';
import type { Lifecycle } from '@/types/lifecycle';
import type { ErdNode, ErdEdge, ErdCategoryGroup } from '@/types/entity-relationship';
import type { ApiGroup } from '@/types/api-contract';
import type { ArchDiagram } from '@/types/architecture';
import type { Feature } from '@/types/feature';
import type { Role } from '@/types/permission';
import type { ConfigEnum } from '@/types/config-ref';
import type { ChangelogEntry } from '@/types/changelog';
import type { RoadmapItem } from '@/types/roadmap';

export interface BranchInfo {
  name: string; // URL segment: 'main', 'staging'
  label: string; // Display: 'Production', 'Staging'
  description: string; // Short description for switcher
  color: string; // Dot color CSS value
  isDefault: boolean; // true for 'main'
}

export interface BranchData {
  meta: ExtractionMeta;
  entities: Entity[];
  journeys: Journey[];
  lifecycles: Lifecycle[];
  erdNodes: ErdNode[];
  erdEdges: ErdEdge[];
  erdCategoryGroups: ErdCategoryGroup[];
  apiGroups: ApiGroup[];
  archDiagrams: ArchDiagram[];
  features: Feature[];
  roles: Role[];
  configEnums: ConfigEnum[];
  changelog: ChangelogEntry[];
  rawChangelog: RawChangelogEntry[];
  roadmapItems: RoadmapItem[];
}

export interface RawChangelogEntry {
  title?: string;
  mergedAt?: string;
  type?: string;
  area?: string;
  number?: number;
  url?: string;
}
