import type { ExtractionMeta } from '@/types/extraction-meta';
import type { Entity } from '@/features/data-model';
import type { Journey } from '@/features/journeys';
import type { Lifecycle } from '@/features/lifecycles';
import type { ErdNode, ErdEdge, ErdCategoryGroup } from '@/features/data-model';
import type { ApiGroup } from '@/features/api-map';
import type { ArchDiagram } from '@/features/architecture';
import type { Feature } from '@/features/feature-domain';
import type { Role } from '@/features/config';
import type { ConfigEnum } from '@/features/config';
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
