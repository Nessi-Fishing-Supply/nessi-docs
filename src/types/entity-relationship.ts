export interface ErdNode {
  id: string;
  label: string;
  badge?: string;
  fieldCount?: number;
  x: number;
  y: number;
}

export interface ErdEdge {
  from: string;
  to: string;
  label: string;
  cardinality?: '1:1' | '1:N' | 'N:M';
  fk?: string;
}
