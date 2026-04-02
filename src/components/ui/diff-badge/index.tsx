import type { DiffStatus } from '@/types/diff';
import styles from './diff-badge.module.scss';

const LABELS: Record<Exclude<DiffStatus, 'unchanged'>, string> = {
  added: 'New',
  modified: 'Modified',
  removed: 'Removed',
};

interface DiffBadgeProps {
  status: Exclude<DiffStatus, 'unchanged'>;
  count?: number;
}

export function DiffBadge({ status, count }: DiffBadgeProps) {
  const label = LABELS[status];
  const showCount = count !== undefined && count > 1;
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {label}
      {showCount && ` (${count})`}
    </span>
  );
}
