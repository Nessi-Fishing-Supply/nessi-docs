'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DiffBadge } from '@/components/ui/diff-badge';
import type { DiffStatus, FieldChange } from '@/types/diff';
import styles from './diff-domain-group.module.scss';

export interface ChangeItem {
  key: string;
  label: string;
  status: DiffStatus;
  href: string | null;
  changedFields?: FieldChange[];
}

interface DiffDomainGroupProps {
  domain: string;
  icon: React.ReactNode;
  items: ChangeItem[];
  defaultExpanded?: boolean;
}

function ChangeRow({ item }: { item: ChangeItem }) {
  const content = (
    <div className={`${styles.row} ${styles[`row_${item.status}`]}`}>
      <DiffBadge status={item.status as Exclude<DiffStatus, 'unchanged'>} />
      <span className={styles.rowLabel}>{item.label}</span>
      {item.changedFields && item.changedFields.length > 0 && (
        <span className={styles.fieldCount}>
          {item.changedFields.length} {item.changedFields.length === 1 ? 'field' : 'fields'} changed
        </span>
      )}
    </div>
  );

  if (!item.href || item.status === 'removed') {
    return content;
  }

  return (
    <Link href={item.href} className={styles.rowLink}>
      {content}
    </Link>
  );
}

export function DiffDomainGroup({ domain, icon, items, defaultExpanded }: DiffDomainGroupProps) {
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
          {addedCount > 0 && <span className={styles.countAdded}>{addedCount} added</span>}
          {modifiedCount > 0 && (
            <span className={styles.countModified}>{modifiedCount} modified</span>
          )}
          {removedCount > 0 && <span className={styles.countRemoved}>{removedCount} removed</span>}
        </span>
        <span className={styles.chevron}>{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className={styles.items}>
          {items.map((item) => (
            <ChangeRow key={item.key} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
