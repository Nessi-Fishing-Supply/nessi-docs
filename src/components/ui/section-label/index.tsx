import { type ReactNode } from 'react';
import styles from './section-label.module.scss';

interface SectionLabelProps {
  children: ReactNode;
  spaced?: boolean;
}

export function SectionLabel({ children, spaced = true }: SectionLabelProps) {
  return <div className={`${styles.label} ${spaced ? styles.spaced : ''}`}>{children}</div>;
}
