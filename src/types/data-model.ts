export interface ForeignKeyReference {
  table: string;
  column: string;
  onDelete?: string;
}

export interface EntityField {
  name: string;
  type: string;
  description?: string;
  nullable?: boolean;
  isPrimaryKey?: boolean;
  default?: string;
  references?: ForeignKeyReference;
}

export interface RlsPolicy {
  name: string;
  operation: string;
  using?: string;
  withCheck?: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface TableTrigger {
  name: string;
  event: string;
  timing: string;
  function: string;
}

export interface Entity {
  name: string;
  label?: string;
  badge?: string;
  badges?: string[];
  why?: string;
  fields: EntityField[];
  rlsPolicies?: RlsPolicy[];
  indexes?: TableIndex[];
  triggers?: TableTrigger[];
}
