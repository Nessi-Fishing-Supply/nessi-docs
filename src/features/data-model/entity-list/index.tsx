'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Entity } from '@/types/data-model';
import { PageHeader } from '@/components/ui/page-header';
import styles from './entity-list.module.scss';

/* ── Constants ── */

const CATEGORY_ORDER = [
  'core', 'lifecycle', 'junction', 'config',
  'media', 'tracking', 'discovery', 'user', 'system',
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

/* ── Helpers ── */

function countForeignKeys(entity: Entity): number {
  return entity.fields.filter((f) => f.references).length;
}

function hasMetaSections(entity: Entity): boolean {
  return (
    (entity.rlsPolicies?.length ?? 0) > 0 ||
    (entity.triggers?.length ?? 0) > 0 ||
    (entity.indexes?.length ?? 0) > 0
  );
}

/* ── Filter Bar ── */

function FilterBar({
  categories,
  activeCategories,
  onToggleCategory,
  onToggleAll,
  totalCount,
}: {
  categories: { name: string; label: string; count: number }[];
  activeCategories: Set<string>;
  onToggleCategory: (name: string) => void;
  onToggleAll: () => void;
  totalCount: number;
}) {
  const allActive = activeCategories.size === categories.length;

  return (
    <div className={styles.filterBar}>
      <span className={styles.filterLabel}>Category</span>
      <button
        className={`${styles.filterChip} ${allActive ? styles.filterChipActive : ''}`}
        onClick={onToggleAll}
      >
        All <span className={styles.chipCount}>{totalCount}</span>
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          className={`${styles.filterChip} ${activeCategories.has(cat.name) ? styles.filterChipActive : ''}`}
          onClick={() => onToggleCategory(cat.name)}
        >
          {cat.label} <span className={styles.chipCount}>{cat.count}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Entity Row ── */

function EntityRow({
  entity,
  staggerIndex,
  isOpen,
  onToggle,
}: {
  entity: Entity;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const fkCount = countForeignKeys(entity);

  return (
    <div
      id={entity.name}
      className={`${styles.entityRow} ${isOpen ? styles.entityRowOpen : ''}`}
      style={{ '--stagger': `${staggerIndex * 20}ms` } as React.CSSProperties}
    >
      <button className={styles.entityRowHeader} onClick={onToggle}>
        <span className={styles.entityName}>{entity.name}</span>
        <span className={styles.categoryBadge}>{entity.badge}</span>
        <span className={styles.entityMeta}>
          {(entity.rlsPolicies?.length ?? 0) > 0 && (
            <span className={styles.rlsBadge}>RLS</span>
          )}
          {(entity.triggers?.length ?? 0) > 0 && (
            <span className={styles.triggerBadge}>Triggers</span>
          )}
          {fkCount > 0 && (
            <span className={styles.fkCount}>{fkCount} FK</span>
          )}
          <span className={styles.fieldCount}>{entity.fields.length} fields</span>
          <span className={styles.chevron}>&#9656;</span>
        </span>
      </button>

      {isOpen && <EntityExpansion entity={entity} />}
    </div>
  );
}

/* ── Entity Expansion (placeholder — built in Task 6) ── */

function EntityExpansion({ entity }: { entity: Entity }) {
  return (
    <div className={styles.expansion}>
      <p style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: '12px' }}>
        Expansion view — {entity.fields.length} fields
      </p>
    </div>
  );
}

/* ── Main Component ── */

interface EntityListProps {
  entities: Entity[];
}

export function EntityList({ entities }: EntityListProps) {
  const [openEntities, setOpenEntities] = useState<Set<string>>(new Set());
  const [activeCategories, setActiveCategories] = useState<Set<string>>(() => {
    const cats = new Set<string>();
    for (const e of entities) {
      if (e.badge) cats.add(e.badge);
    }
    return cats;
  });

  const allCategoryNames = useMemo(() => {
    const cats = new Set<string>();
    for (const e of entities) {
      if (e.badge) cats.add(e.badge);
    }
    return cats;
  }, [entities]);

  const categories = useMemo(() => {
    return CATEGORY_ORDER
      .filter((cat) => allCategoryNames.has(cat))
      .map((cat) => ({
        name: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        count: entities.filter((e) => e.badge === cat).length,
      }));
  }, [entities, allCategoryNames]);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER
      .filter((cat) => activeCategories.has(cat) && allCategoryNames.has(cat))
      .map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        entities: entities.filter((e) => e.badge === cat),
      }))
      .filter((g) => g.entities.length > 0);
  }, [entities, activeCategories, allCategoryNames]);

  const toggleCategory = (name: string) => {
    setActiveCategories((prev) => {
      const allSelected = prev.size === allCategoryNames.size;
      if (allSelected) return new Set([name]);
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        return next.size === 0 ? new Set(allCategoryNames) : next;
      }
      next.add(name);
      return next;
    });
  };

  const toggleAll = () => setActiveCategories(new Set(allCategoryNames));

  const toggleEntity = (name: string) => {
    setOpenEntities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  let staggerIndex = 0;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Data Model"
        metrics={[{ value: entities.length, label: 'tables' }]}
      >
        <Link href="/entity-relationships" className={styles.erdLink}>
          View Entity Relationships →
        </Link>
      </PageHeader>

      <FilterBar
        categories={categories}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        onToggleAll={toggleAll}
        totalCount={entities.length}
      />

      <div className={styles.entityContainer}>
        {grouped.map((group) => (
          <div key={group.category}>
            <div className={styles.groupDivider}>
              <span className={styles.groupName}>{group.label}</span>
              <span className={styles.groupLine} />
              <span className={styles.groupCount}>{group.entities.length}</span>
            </div>

            {group.entities.map((entity) => {
              const idx = staggerIndex++;
              return (
                <EntityRow
                  key={entity.name}
                  entity={entity}
                  staggerIndex={idx}
                  isOpen={openEntities.has(entity.name)}
                  onToggle={() => toggleEntity(entity.name)}
                />
              );
            })}
          </div>
        ))}

        {grouped.length === 0 && (
          <div className={styles.emptyState}>No tables match the current filters.</div>
        )}
      </div>
    </div>
  );
}
