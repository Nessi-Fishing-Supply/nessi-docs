import type { JourneyNode, Journey } from '@/features/journeys';
import type { ApiEndpoint } from '@/features/api-map';
import type { Entity } from '@/features/data-model';
import type { Lifecycle, LifecycleState } from '@/features/lifecycles';
import type { Feature } from '@/features/domains';
import type { Role } from '@/features/config';
import type { ConfigEnum } from '@/features/config';
import type { DiffStatus, FieldChange } from '@/features/diff-overview/types/diff';

export interface DiffItemSelection {
  key: string;
  label: string;
  status: DiffStatus;
  domain: string;
  href: string | null;
  changedFields?: FieldChange[];
  /** The full source object (added/removed item, or head item for modified) */
  data?: unknown;
}

export type SelectedItem =
  | { type: 'step'; node: JourneyNode; journey: Journey }
  | { type: 'api'; endpoint: ApiEndpoint; group: string }
  | { type: 'entity'; entity: Entity }
  | { type: 'lifecycle-state'; state: LifecycleState; lifecycle: Lifecycle }
  | { type: 'feature'; feature: Feature }
  | { type: 'role'; role: Role }
  | { type: 'config-enum'; configEnum: ConfigEnum }
  | { type: 'diff-item'; item: DiffItemSelection }
  | null;

export interface CrossLink {
  label: string;
  href: string;
  highlight?: string;
}
