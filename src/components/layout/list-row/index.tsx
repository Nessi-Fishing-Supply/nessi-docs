import Link from 'next/link';
import type { DiffStatus } from '@/types/diff';
import styles from './list-row.module.scss';

interface ListRowProps {
  href: string;
  staggerIndex: number;
  diffStatus?: DiffStatus;
  children: React.ReactNode;
}

export function ListRow({ href, staggerIndex, diffStatus, children }: ListRowProps) {
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
    >
      {children}
    </Link>
  );
}
