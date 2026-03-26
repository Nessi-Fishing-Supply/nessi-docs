import { type ReactNode } from 'react';
import styles from './badge.module.scss';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  variant?: 'default' | 'method' | 'subtle';
}

export function Badge({ children, color, variant = 'default' }: BadgeProps) {
  const classNames = [styles.badge, variant === 'method' && styles.method, variant === 'subtle' && styles.subtle]
    .filter(Boolean)
    .join(' ');

  const style =
    color && variant !== 'subtle'
      ? { background: `${color}1a`, color }
      : undefined;

  return (
    <span className={classNames} style={style}>
      {children}
    </span>
  );
}
