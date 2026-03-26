export const DEFAULT_STATE_COLOR = '#78756f';

export interface LifecycleState {
  id: string;
  label: string;
  color?: string;
  x: number;
  y: number;
}

export interface LifecycleTransition {
  from: string;
  to: string;
  label: string;
  side?: 'r-l' | 'b-t' | 't-b' | 'b-l';
  fx?: number;
  fy?: number;
  tx?: number;
  ty?: number;
}

export interface Lifecycle {
  slug: string;
  name: string;
  badge?: string;
  description: string;
  why?: string;
  source?: 'enum' | 'check_constraint' | 'typescript';
  states: LifecycleState[];
  transitions: LifecycleTransition[];
}
