export interface EntityField {
  name: string;
  type: string;
  description: string;
}

export interface Entity {
  name: string;
  badge: string;
  why?: string;
  fields: EntityField[];
}
