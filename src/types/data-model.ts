export interface EntityField {
  name: string;
  type: string;
  description?: string;
  nullable?: boolean;
}

export interface Entity {
  name: string;
  label?: string;
  badge?: string;
  badges?: string[];
  why?: string;
  fields: EntityField[];
}
