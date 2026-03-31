import type { JourneyNode } from '@/types/journey';
import type { ErrorCase } from '@/types/journey';

export interface RawJourneyNode {
  id: string;
  type: 'entry' | 'step' | 'decision';
  label?: string;
  title?: string;
  x?: number;
  y?: number;
  layer?: string;
  status?: string;
  route?: string;
  codeRef?: string;
  notes?: string;
  why?: string;
  tooltip?: string;
  action?: string;
  method?: string;
  errorCases?: ErrorCase[];
  ux?: JourneyNode['ux'];
  options?: JourneyNode['options'];
}

export interface RawJourneyEdge {
  from: string;
  to: string;
  opt?: string;
}

export interface RawJourney {
  slug: string;
  domain: string;
  title: string;
  persona: string;
  description: string;
  relatedIssues?: number[];
  nodes: RawJourneyNode[];
  edges: RawJourneyEdge[];
}

export interface RawLifecycleState {
  id: string;
  label: string;
}

export interface RawLifecycle {
  slug: string;
  name: string;
  badge?: string;
  description: string;
  why?: string;
  source?: 'enum' | 'check_constraint' | 'typescript';
  states: RawLifecycleState[];
  transitions: { from: string; to: string; label: string }[];
}

export interface RawErdNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
}

export interface RawEntity {
  name: string;
  label?: string;
  badges?: string[];
  fields: {
    name: string;
    type: string;
    nullable?: boolean;
    description?: string;
    isPrimaryKey?: boolean;
    default?: string;
    references?: { table: string; column: string; onDelete?: string };
  }[];
  rlsPolicies?: {
    name: string;
    operation: string;
    using?: string;
    withCheck?: string;
  }[];
  indexes?: {
    name: string;
    columns: string[];
    unique: boolean;
  }[];
  triggers?: {
    name: string;
    event: string;
    timing: string;
    function: string;
  }[];
}
