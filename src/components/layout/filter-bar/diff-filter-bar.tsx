'use client';

import { FilterBar, FilterChip } from './index';

export type DiffStatusFilter = 'all' | 'added' | 'modified' | 'removed';

interface DiffFilterBarProps {
  active: DiffStatusFilter;
  onChange: (filter: DiffStatusFilter) => void;
  counts: { added: number; modified: number; removed: number };
}

const FILTERS: {
  label: string;
  value: DiffStatusFilter;
  color?: string;
  colorBg?: string;
  colorBorder?: string;
}[] = [
  { label: 'All Changes', value: 'all' },
  {
    label: 'New',
    value: 'added',
    color: 'var(--diff-added)',
    colorBg: 'var(--diff-added-bg)',
    colorBorder: 'var(--diff-added-border)',
  },
  {
    label: 'Modified',
    value: 'modified',
    color: 'var(--diff-modified)',
    colorBg: 'var(--diff-modified-bg)',
    colorBorder: 'var(--diff-modified-border)',
  },
  {
    label: 'Removed',
    value: 'removed',
    color: 'var(--diff-removed)',
    colorBg: 'var(--diff-removed-bg)',
    colorBorder: 'var(--diff-removed-border)',
  },
];

export function DiffFilterBar({ active, onChange, counts }: DiffFilterBarProps) {
  const total = counts.added + counts.modified + counts.removed;

  return (
    <FilterBar>
      {FILTERS.map((f) => {
        const count = f.value === 'all' ? total : counts[f.value as keyof typeof counts];
        if (f.value !== 'all' && count === 0) return null;
        return (
          <FilterChip
            key={f.value}
            label={f.label}
            active={active === f.value}
            onToggle={() => onChange(f.value)}
            color={f.color}
            colorBg={f.colorBg}
            colorBorder={f.colorBorder}
            count={count > 0 ? count : undefined}
          />
        );
      })}
    </FilterBar>
  );
}
