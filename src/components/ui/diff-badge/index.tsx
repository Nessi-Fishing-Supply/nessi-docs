import type { DiffStatus } from '@/types/diff';
import styles from './diff-badge.module.scss';

const LABELS: Record<Exclude<DiffStatus, 'unchanged'>, string> = {
  added: 'NEW',
  modified: 'CHANGED',
  removed: 'REMOVED',
};

interface DiffBadgeProps {
  status: Exclude<DiffStatus, 'unchanged'>;
}

export function DiffBadge({ status }: DiffBadgeProps) {
  return <span className={`${styles.badge} ${styles[status]}`}>{LABELS[status]}</span>;
}
