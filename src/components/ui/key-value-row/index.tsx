import { type ReactNode } from 'react';
import styles from './key-value-row.module.scss';

interface KeyValueRowProps {
  label: ReactNode;
  value: ReactNode;
  valueColor?: string;
  bordered?: boolean;
}

export function KeyValueRow({ label, value, valueColor, bordered = false }: KeyValueRowProps) {
  return (
    <div className={`${styles.row} ${bordered ? styles.bordered : ''}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
}
