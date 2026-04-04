import { type ReactNode } from 'react';
import { DIFF_STATUS_CONFIG } from '@/features/shared/constants/diff';
import type { DiffStatus } from '@/features/diff-overview/types/diff';
import styles from './badge.module.scss';

const METHOD_COLORS: Record<string, string> = {
  GET: '#3d8c75',
  POST: '#e27739',
  PUT: '#7b8fcd',
  PATCH: '#7b8fcd',
  DELETE: '#b84040',
};

interface BadgeProps {
  children?: ReactNode;
  color?: string;
  variant?: 'category' | 'method' | 'diff' | 'count' | 'subtle';
  method?: string;
  status?: Exclude<DiffStatus, 'unchanged'>;
  count?: number;
}

export function Badge({
  children,
  color,
  variant = 'category',
  method,
  status,
  count,
}: BadgeProps) {
  if (variant === 'diff' && status) {
    const config = DIFF_STATUS_CONFIG[status];
    const showCount = count !== undefined && count > 1;
    return (
      <span className={`${styles.badge} ${styles.diff} ${styles[status]}`}>
        {config.label}
        {showCount && ` (${count})`}
      </span>
    );
  }

  if (variant === 'method' && method) {
    const methodColor = METHOD_COLORS[method.toUpperCase()] ?? '#6a6860';
    return (
      <span
        className={`${styles.badge} ${styles.method}`}
        style={{ background: `${methodColor}1a`, color: methodColor }}
      >
        {method}
      </span>
    );
  }

  if (variant === 'count') {
    return <span className={`${styles.badge} ${styles.count}`}>{children}</span>;
  }

  if (variant === 'subtle') {
    return <span className={`${styles.badge} ${styles.subtle}`}>{children}</span>;
  }

  // category (default)
  const style = color ? { background: `${color}1a`, color } : undefined;
  return (
    <span className={styles.badge} style={style}>
      {children}
    </span>
  );
}
