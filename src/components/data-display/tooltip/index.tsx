import type { ReactNode } from 'react';
import styles from './tooltip.module.scss';

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <span className={styles.wrapper}>
      {children}
      <span className={styles.tip}>{text}</span>
    </span>
  );
}
