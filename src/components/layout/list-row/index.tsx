import Link from 'next/link';
import type { DiffStatus } from '@/features/diff-overview/types/diff';
import styles from './list-row.module.scss';

interface ListRowProps {
  href: string;
  staggerIndex: number;
  diffStatus?: DiffStatus;
  onClick?: () => void;
  children: React.ReactNode;
}

export function ListRow({ href, staggerIndex, diffStatus, onClick, children }: ListRowProps) {
  const diffClass =
    diffStatus && diffStatus !== 'unchanged'
      ? styles[`diff_${diffStatus}`]
      : diffStatus === 'unchanged'
        ? styles.diff_unchanged
        : '';

  return (
    <Link
      href={href}
      className={`${styles.row} ${diffClass}`}
      style={{ '--stagger': `${staggerIndex * 30}ms` } as React.CSSProperties}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
