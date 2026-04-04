'use client';

import type { DiffStatus } from '@/features/shared/types/diff';
import { useDeepLink } from '@/features/shared/hooks/use-deep-link';
import { BorderTrace } from '@/components/data-display/border-trace';
import styles from './collapsible-row.module.scss';

interface CollapsibleRowProps {
  id: string;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  diffStatus?: DiffStatus;
  onExpand?: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function CollapsibleRow({
  id,
  staggerIndex,
  isOpen,
  onToggle,
  diffStatus,
  onExpand,
  header,
  children,
}: CollapsibleRowProps) {
  const { isHighlighted, ref } = useDeepLink(id, () => {
    onToggle();
    onExpand?.();
  });

  const isUnchanged = diffStatus === 'unchanged';
  const diffClass =
    diffStatus && diffStatus !== 'unchanged'
      ? styles[`diff_${diffStatus}`]
      : isUnchanged
        ? styles.diff_unchanged
        : '';

  function handleClick() {
    if (isUnchanged) return;
    onToggle();
    if (!isOpen) onExpand?.();
  }

  return (
    <div
      ref={ref}
      className={`${styles.row} ${diffClass} ${isOpen ? styles.open : ''}`}
      style={
        { '--stagger': isHighlighted ? '0ms' : `${staggerIndex * 20}ms` } as React.CSSProperties
      }
    >
      {isHighlighted && <BorderTrace active />}
      <div className={styles.header} onClick={handleClick}>
        {header}
      </div>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
}
