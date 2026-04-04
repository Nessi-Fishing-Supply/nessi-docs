'use client';

import { useState } from 'react';
import { Badge } from '@/components/indicators/badge';
import type { DiffStatus, FieldChange } from '@/features/shared/types/diff';
import styles from './diff-domain-group.module.scss';

export interface ChangeItem {
  key: string;
  label: string;
  status: DiffStatus;
  href: string | null;
  changedFields?: FieldChange[];
  data?: unknown;
}

interface DiffDomainGroupProps {
  domain: string;
  icon: React.ReactNode;
  items: ChangeItem[];
  defaultExpanded?: boolean;
  selectedKey?: string | null;
  onSelect?: (item: ChangeItem) => void;
}

function ChangeRow({
  item,
  isSelected,
  onSelect,
}: {
  item: ChangeItem;
  isSelected: boolean;
  onSelect?: (item: ChangeItem) => void;
}) {
  return (
    <button
      className={`${styles.row} ${styles[`row_${item.status}`]} ${isSelected ? styles.rowSelected : ''}`}
      onClick={() => onSelect?.(item)}
      type="button"
    >
      <Badge variant="diff" status={item.status as Exclude<DiffStatus, 'unchanged'>} />
      <span className={styles.rowLabel}>{item.label}</span>
      {item.changedFields && item.changedFields.length > 0 && (
        <span className={styles.fieldCount}>
          {item.changedFields.length} {item.changedFields.length === 1 ? 'field' : 'fields'} changed
        </span>
      )}
    </button>
  );
}

export function DiffDomainGroup({
  domain,
  icon,
  items,
  defaultExpanded,
  selectedKey,
  onSelect,
}: DiffDomainGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? items.length <= 10);

  const addedCount = items.filter((i) => i.status === 'added').length;
  const modifiedCount = items.filter((i) => i.status === 'modified').length;
  const removedCount = items.filter((i) => i.status === 'removed').length;

  return (
    <div className={styles.group}>
      <button className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.headerIcon}>{icon}</span>
        <span className={styles.headerDomain}>{domain}</span>
        <span className={styles.headerCounts}>
          {addedCount > 0 && <span className={styles.countAdded}>New ({addedCount})</span>}
          {modifiedCount > 0 && (
            <span className={styles.countModified}>Modified ({modifiedCount})</span>
          )}
          {removedCount > 0 && (
            <span className={styles.countRemoved}>Removed ({removedCount})</span>
          )}
        </span>
        <span className={styles.chevron}>{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className={styles.items}>
          {items.map((item) => (
            <ChangeRow
              key={item.key}
              item={item}
              isSelected={selectedKey === item.key}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
