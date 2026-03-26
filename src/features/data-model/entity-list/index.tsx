'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Entity } from '@/types/data-model';
import { useDocsContext } from '@/providers/docs-provider';
import { PageHeader } from '@/components/ui/page-header';
import styles from './entity-list.module.scss';

const CATEGORY_ORDER = [
  'core',
  'lifecycle',
  'junction',
  'config',
  'media',
  'tracking',
  'discovery',
  'user',
  'system',
];

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core Entities',
  lifecycle: 'Lifecycle & State',
  junction: 'Junction Tables',
  config: 'Configuration',
  media: 'Media',
  tracking: 'Tracking',
  discovery: 'Discovery',
  user: 'User Data',
  system: 'System',
};

interface EntityListProps {
  entities: Entity[];
}

export function EntityList({ entities }: EntityListProps) {
  const { selectedItem, setSelectedItem } = useDocsContext();
  const [openEntities, setOpenEntities] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<string, Entity[]>();
    for (const e of entities) {
      const cat = e.badge || 'other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(e);
    }
    // Sort by defined order
    return CATEGORY_ORDER.filter((cat) => map.has(cat)).map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      entities: map.get(cat)!,
    }));
  }, [entities]);

  const handleClick = (entity: Entity) => {
    const isOpen = openEntities.has(entity.name);
    setOpenEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entity.name)) next.delete(entity.name);
      else next.add(entity.name);
      return next;
    });
    if (!isOpen) {
      setSelectedItem({ type: 'entity', entity });
    }
  };

  const isSelected = (e: Entity) =>
    selectedItem?.type === 'entity' && selectedItem.entity.name === e.name;

  return (
    <div className={styles.container}>
      <PageHeader title="Data Model" metrics={[{ value: entities.length, label: 'tables' }]}>
        <Link href="/data-model/erd" className={styles.erdLink}>
          View Entity Relationships →
        </Link>
      </PageHeader>
      {grouped.map(({ category, label, entities: groupEntities }) => (
        <div key={category} className={styles.group}>
          <div className={styles.groupHeader}>
            <h2 className={styles.groupName}>{label}</h2>
            <span className={styles.groupCount}>
              {groupEntities.length} {groupEntities.length === 1 ? 'table' : 'tables'}
            </span>
          </div>
          <div className={styles.cards}>
            {groupEntities.map((entity) => {
              const isOpen = openEntities.has(entity.name);
              return (
                <div
                  key={entity.name}
                  className={`${styles.card} ${isSelected(entity) ? styles.active : ''}`}
                >
                  <button className={styles.cardHeader} onClick={() => handleClick(entity)}>
                    <span className={styles.name}>{entity.name}</span>
                    <span className={styles.count}>{entity.fields.length} fields</span>
                    <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <div className={styles.fields}>
                      <div className={styles.fieldHeader}>
                        <span className={styles.fieldName}>Column</span>
                        <span className={styles.fieldType}>Type</span>
                        <span className={styles.fieldDesc}>Description</span>
                      </div>
                      {entity.fields.map((f) => (
                        <div key={f.name} className={styles.fieldRow}>
                          <span className={styles.fieldName}>{f.name}</span>
                          <span className={styles.fieldType}>{f.type}</span>
                          <span className={styles.fieldDesc}>{f.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
