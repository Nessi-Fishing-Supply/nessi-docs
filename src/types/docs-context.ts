import type { JourneyNode, Journey } from './journey';
import type { ApiEndpoint } from './api-contract';
import type { Entity } from './data-model';
import type { Lifecycle, LifecycleState } from './lifecycle';
import type { Feature } from './feature';
import type { Role } from './permission';
import type { ConfigEnum } from './config-ref';

export type SelectedItem =
  | { type: 'step'; node: JourneyNode; journey: Journey }
  | { type: 'api'; endpoint: ApiEndpoint; group: string }
  | { type: 'entity'; entity: Entity }
  | { type: 'lifecycle-state'; state: LifecycleState; lifecycle: Lifecycle }
  | { type: 'feature'; feature: Feature }
  | { type: 'role'; role: Role }
  | { type: 'config-enum'; configEnum: ConfigEnum }
  | null;

export interface CrossLink {
  label: string;
  href: string;
  highlight?: string;
}
