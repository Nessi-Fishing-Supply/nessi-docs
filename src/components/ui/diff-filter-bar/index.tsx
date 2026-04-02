'use client';

import styles from './diff-filter-bar.module.scss';

export type DiffStatusFilter = 'all' | 'added' | 'modified' | 'removed';

const FILTERS: { value: DiffStatusFilter; label: string }[] = [
  { value: 'all', label: 'All Changes' },
  { value: 'added', label: 'New' },
  { value: 'modified', label: 'Modified' },
  { value: 'removed', label: 'Removed' },
];

interface DiffFilterBarProps {
  active: DiffStatusFilter;
  onChange: (value: DiffStatusFilter) => void;
  counts: { added: number; modified: number; removed: number };
}

export function DiffFilterBar({ active, onChange, counts }: DiffFilterBarProps) {
  const total = counts.added + counts.modified + counts.removed;

  return (
    <div className={styles.bar}>
      {FILTERS.map((f) => {
        const count = f.value === 'all' ? total : counts[f.value as keyof typeof counts];
        if (f.value !== 'all' && count === 0) return null;
        return (
          <button
            key={f.value}
            className={`${styles.pill} ${active === f.value ? styles.pillActive : ''} ${f.value !== 'all' ? styles[`pill_${f.value}`] : ''}`}
            onClick={() => onChange(f.value)}
          >
            {f.label}
            {count > 0 && <span className={styles.count}>({count})</span>}
          </button>
        );
      })}
    </div>
  );
}
