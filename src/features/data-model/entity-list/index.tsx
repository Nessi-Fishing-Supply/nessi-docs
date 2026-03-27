'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Entity } from '@/types/data-model';
import { getMethodColors } from '@/constants/colors';
import { rlsOperationToMethod, getBestEndpointForOperation } from '@/data/cross-links';
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
  onScrollToEntity,
}: {
  entity: Entity;
  staggerIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onScrollToEntity: (name: string) => void;
}) {
  const fkCount = countForeignKeys(entity);
  const rowRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === `#${entity.name}`) {
      if (!isOpen) onToggle();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount init for deep-link
      setHighlight(true);
      setTimeout(
        () => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        100,
      );
      setTimeout(() => setHighlight(false), 4000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={rowRef}
      id={entity.name}
      className={`${styles.entityRow} ${isOpen ? styles.entityRowOpen : ''} ${highlight ? styles.entityRowHighlight : ''}`}
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
            <span className={styles.fkBadge}>FK</span>
          )}
          <span className={styles.fieldCount}>{entity.fields.length} fields</span>
          <span className={styles.chevron}>&#9656;</span>
        </span>
      </button>

      {isOpen && <EntityExpansion entity={entity} onScrollToEntity={onScrollToEntity} />}
    </div>
  );
}

/* ── Field Table ── */

function FieldTable({ entity, onScrollToEntity }: { entity: Entity; onScrollToEntity: (name: string) => void }) {
  return (
    <table className={styles.fieldTable}>
      <thead>
        <tr>
          <th className={styles.fieldThName}>Column</th>
          <th className={styles.fieldThType}>Type</th>
          <th className={styles.fieldThDefault}>Default</th>
          <th className={styles.fieldThRef}></th>
        </tr>
      </thead>
      <tbody>
        {entity.fields.map((f) => (
          <tr key={f.name} className={styles.fieldRow}>
            <td className={styles.fieldName}>
              {f.name}
              {f.isPrimaryKey && <span className={styles.tagPk}>PK</span>}
              {f.references && <span className={styles.tagFk}>FK</span>}
              {f.nullable && !f.isPrimaryKey && !f.references && (
                <span className={styles.tagNull}>null</span>
              )}
            </td>
            <td className={styles.fieldType}>{f.type}</td>
            <td className={styles.fieldDefault}>{f.default ?? ''}</td>
            <td className={styles.fieldRef}>
              {f.references && (
                <a
                  href={`#${f.references.table}`}
                  className={styles.fkRef}
                  onClick={(e) => {
                    e.preventDefault();
                    onScrollToEntity(f.references!.table);
                  }}
                >
                  → {f.references.table}.{f.references.column}
                  {f.references.onDelete ? ` ${f.references.onDelete}` : ''}
                </a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Meta Sections ── */

function MetaSections({ entity }: { entity: Entity }) {
  return (
    <div className={styles.metaSections}>
      {entity.rlsPolicies && entity.rlsPolicies.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>RLS Policies</div>
          {entity.rlsPolicies.map((p, i) => {
            const method = rlsOperationToMethod(p.operation);
            const { color, bg } = getMethodColors(method);
            const bestEndpoint = getBestEndpointForOperation(entity.name, p.operation);

            const row = (
              <div
                key={i}
                className={`${styles.metaRow} ${bestEndpoint ? styles.metaRowLink : ''}`}
              >
                <span
                  className={styles.policyOp}
                  style={{ color, background: bg }}
                >
                  {p.operation}
                </span>
                <span className={styles.metaText}>{p.name}</span>
                {bestEndpoint && (
                  <span className={styles.metaArrow}>→</span>
                )}
              </div>
            );

            if (bestEndpoint) {
              return (
                <Link
                  key={i}
                  href={`/api-map#${bestEndpoint.anchor}`}
                  className={styles.metaLink}
                >
                  {row}
                </Link>
              );
            }
            return row;
          })}
        </div>
      )}

      {entity.triggers && entity.triggers.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>Triggers</div>
          {entity.triggers.map((t, i) => (
            <div key={i} className={styles.metaRow}>
              <span className={styles.triggerEvent}>{t.event}</span>
              <span className={styles.metaText}>{t.name}</span>
              <span className={styles.triggerFn}>{t.function}</span>
            </div>
          ))}
        </div>
      )}

      {entity.indexes && entity.indexes.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>Indexes</div>
          {entity.indexes.map((idx, i) => (
            <div key={i} className={styles.metaRow}>
              <span className={styles.indexCols}>{idx.columns.join(', ')}</span>
              {idx.unique && <span className={styles.indexUnique}>unique</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Entity Expansion ── */

function EntityExpansion({ entity, onScrollToEntity }: { entity: Entity; onScrollToEntity: (name: string) => void }) {
  const hasMeta = hasMetaSections(entity);

  return (
    <div className={styles.expansion}>
      <div className={hasMeta ? styles.splitLayout : undefined}>
        <div className={hasMeta ? styles.splitLeft : styles.fullWidth}>
          <FieldTable entity={entity} onScrollToEntity={onScrollToEntity} />
        </div>
        {hasMeta && (
          <div className={styles.splitRight}>
            <MetaSections entity={entity} />
          </div>
        )}
      </div>
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

  const scrollToAndExpand = (entityName: string) => {
    setOpenEntities((prev) => {
      const next = new Set(prev);
      next.add(entityName);
      return next;
    });
    setTimeout(() => {
      const el = document.getElementById(entityName);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add(styles.entityRowHighlight);
        setTimeout(() => el.classList.remove(styles.entityRowHighlight), 4000);
      }
    }, 50);
  };

  let staggerIndex = 0;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Data Model"
        metrics={[{ value: entities.length, label: 'tables' }]}
      />

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
                  onScrollToEntity={scrollToAndExpand}
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
