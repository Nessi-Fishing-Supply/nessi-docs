import { type ReactNode } from 'react';
import styles from './info-block.module.scss';

interface InfoBlockProps {
  children: ReactNode;
}

export function InfoBlock({ children }: InfoBlockProps) {
  return <div className={styles.block}>{children}</div>;
}
