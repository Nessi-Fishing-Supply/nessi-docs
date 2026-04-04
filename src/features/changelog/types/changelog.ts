export type ChangeType = 'added' | 'changed' | 'fixed' | 'removed';

export interface ChangelogChange {
  type: ChangeType;
  description: string;
  area?: string;
  prNumber?: number;
  prUrl?: string;
}

export interface ChangelogEntry {
  date?: string;
  title?: string;
  number?: number;
  url?: string;
  mergedAt?: string;
  author?: string;
  labels?: string[];
  area?: string;
  type?: string;
  changes?: ChangelogChange[];
}

export const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; color: string }> = {
  added: { label: 'Added', color: '#3d8c75' },
  changed: { label: 'Changed', color: '#7b8fcd' },
  fixed: { label: 'Fixed', color: '#e27739' },
  removed: { label: 'Removed', color: '#b84040' },
};
