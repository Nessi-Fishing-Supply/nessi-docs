import type { JourneyNode, Journey } from './journey';
import type { ApiEndpoint } from './api-contract';
import type { Entity } from './data-model';
import type { Lifecycle, LifecycleState } from './lifecycle';
import type { Feature } from './feature';
import type { Role } from './permission';
import type { ConfigEnum } from './config-ref';
import type { DiffStatus, FieldChange } from './diff';

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
