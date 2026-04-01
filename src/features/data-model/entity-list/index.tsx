'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Entity } from '@/types/data-model';
import { getMethodColors } from '@/constants/colors';
import { rlsOperationToMethod, getBestEndpointForOperation, getLifecycleForEntity } from '@/data';
import { useBranchHref } from '@/providers/branch-provider';
import { PageHeader } from '@/components/ui/page-header';
import { BorderTrace } from '@/components/ui/border-trace';
import { Tooltip } from '@/components/ui';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
import type { DiffStatus } from '@/types/diff';
import styles from './entity-list.module.scss';

/* ── Constants ── */

const CATEGORY_ORDER = [
  'core',
  'shops',
  'commerce',
  'social',
  'messaging',
  'content',
  'user',
  'system',
];

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core Entities',
  shops: 'Shop Management',
  commerce: 'Commerce',
  social: 'Social',
  messaging: 'Messaging',
  content: 'Content & Discovery',
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

function getEntityDiffStatus(
  entityName: string,
  statusMap: Map<string, DiffStatus> | undefined,
): DiffStatus | null {
  if (!statusMap) return null;
  return statusMap.get(entityName) ?? null;
}

function diffSort<T>(
  items: T[],
  getKey: (item: T) => string,
  statusMap: Map<string, DiffStatus> | undefined,
): T[] {
  if (!statusMap) return items;
  return [...items].sort((a, b) => {
    const aStatus = statusMap.get(getKey(a));
    const bStatus = statusMap.get(getKey(b));
    const aChanged = aStatus === 'added' || aStatus === 'modified';
    const bChanged = bStatus === 'added' || bStatus === 'modified';
    if (aChanged && !bChanged) return -1;
    if (!aChanged && bChanged) return 1;
    return 0;
  });
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
  isHighlighted,
  diffStatus,
  onToggle,
  onOpen,
  onScrollToEntity,
}: {
  entity: Entity;
  staggerIndex: number;
  isOpen: boolean;
  isHighlighted: boolean;
  diffStatus: DiffStatus | null;
  onToggle: () => void;
  onOpen: () => void;
  onScrollToEntity: (name: string) => void;
}) {
  const branchHref = useBranchHref();
  const fkCount = countForeignKeys(entity);
  const [isDeepLinkTarget] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.location.hash.split('#').filter(Boolean).includes(entity.name),
  );
  const rowRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    function checkHash() {
      // Handle stacked hashes (e.g. #members#members) by splitting on #
      const hashes = window.location.hash.split('#').filter(Boolean);
      if (hashes.includes(entity.name)) {
        onOpen();
        setHighlight(true);
        history.replaceState(null, '', window.location.pathname);
        setTimeout(
          () => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          100,
        );
        setTimeout(() => setHighlight(false), 9500);
      }
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={rowRef}
      id={entity.name}
      className={`${styles.entityRow} ${isOpen ? styles.entityRowOpen : ''} ${diffStatus ? styles[`diff_${diffStatus}`] : ''}`}
      style={
        { '--stagger': isDeepLinkTarget ? '0ms' : `${staggerIndex * 20}ms` } as React.CSSProperties
      }
    >
      <BorderTrace active={highlight || isHighlighted} />
      <button
        className={styles.entityRowHeader}
        onClick={diffStatus === 'removed' || diffStatus === 'unchanged' ? undefined : onToggle}
        style={
          diffStatus === 'removed' || diffStatus === 'unchanged' ? { cursor: 'default' } : undefined
        }
      >
        <span className={styles.entityName}>{entity.name}</span>
        {diffStatus && diffStatus !== 'unchanged' && <DiffBadge status={diffStatus} />}
        <span className={styles.categoryBadge}>{entity.badge}</span>
        {(() => {
          const lc = getLifecycleForEntity(entity.name);
          if (!lc) return null;
          return (
            <Link
              href={branchHref(`/lifecycles/${lc.slug}`)}
              className={styles.lifecycleLink}
              onClick={(e) => e.stopPropagation()}
            >
              ↻ {lc.name}
            </Link>
          );
        })()}
        <span className={styles.entityMeta}>
          {(entity.rlsPolicies?.length ?? 0) > 0 && <span className={styles.rlsBadge}>RLS</span>}
          {(entity.triggers?.length ?? 0) > 0 && (
            <span className={styles.triggerBadge}>Triggers</span>
          )}
          {fkCount > 0 && <span className={styles.fkBadge}>FK</span>}
          <span className={styles.fieldCount}>{entity.fields.length} fields</span>
          <span className={styles.chevron}>&#9656;</span>
        </span>
      </button>

      {isOpen && <EntityExpansion entity={entity} onScrollToEntity={onScrollToEntity} />}
    </div>
  );
}

/* ── Field Table ── */

function FieldTable({
  entity,
  onScrollToEntity,
}: {
  entity: Entity;
  onScrollToEntity: (name: string) => void;
}) {
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
            <td className={styles.fieldDefault}>
              {f.default && f.default.length > 15 ? (
                <Tooltip text={f.default}>
                  <span className={styles.fieldDefaultTruncated}>{f.default}</span>
                </Tooltip>
              ) : (
                (f.default ?? '')
              )}
            </td>
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
  const branchHref = useBranchHref();
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
                <span className={styles.policyOp} style={{ color, background: bg }}>
                  {p.operation}
                </span>
                <span className={styles.metaText}>{p.name}</span>
                {bestEndpoint && <span className={styles.metaArrow}>→</span>}
              </div>
            );

            if (bestEndpoint) {
              return (
                <Link
                  key={i}
                  href={branchHref(`/api-map#${bestEndpoint.anchor}`)}
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

function EntityExpansion({
  entity,
  onScrollToEntity,
}: {
  entity: Entity;
  onScrollToEntity: (name: string) => void;
}) {
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
  const { isActive: isDiffMode, diffResult } = useDiffMode();
  const entityStatusMap = isDiffMode ? diffResult?.entities.statusMap : undefined;

  const [openEntities, setOpenEntities] = useState<Set<string>>(new Set());
  const [highlightedEntity, setHighlightedEntity] = useState<string | null>(null);
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
    if (isDiffMode && diffResult) {
      for (const e of diffResult.entities.removed) {
        if (e.badge) cats.add(e.badge);
      }
    }
    return cats;
  }, [entities, isDiffMode, diffResult]);

  const categories = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => allCategoryNames.has(cat)).map((cat) => ({
      name: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      count: entities.filter((e) => e.badge === cat).length,
    }));
  }, [entities, allCategoryNames]);

  const removedEntities = useMemo(() => {
    if (!isDiffMode || !diffResult) return [];
    return diffResult.entities.removed;
  }, [isDiffMode, diffResult]);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => activeCategories.has(cat) && allCategoryNames.has(cat))
      .map((cat) => {
        const catEntities = entities.filter((e) => e.badge === cat);
        return {
          category: cat,
          label: CATEGORY_LABELS[cat] ?? cat,
          entities: isDiffMode
            ? diffSort(catEntities, (e) => e.name, entityStatusMap)
            : catEntities,
        };
      })
      .filter((g) => g.entities.length > 0 || removedEntities.some((e) => e.badge === g.category));
  }, [entities, activeCategories, allCategoryNames, removedEntities, isDiffMode, entityStatusMap]);

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

  const openEntity = (name: string) => {
    setOpenEntities((prev) => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  const scrollToAndExpand = (entityName: string) => {
    // Step 1: Expand the target entity
    setOpenEntities((prev) => {
      const next = new Set(prev);
      next.add(entityName);
      return next;
    });
    // Step 2: After expansion renders, scroll into view
    setTimeout(() => {
      const el = document.getElementById(entityName);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Step 3: After scroll settles, start the trace
        setTimeout(() => {
          setHighlightedEntity(entityName);
          setTimeout(() => setHighlightedEntity(null), 9500);
        }, 400);
      }
    }, 50);
  };

  let staggerIndex = 0;

  return (
    <div className={styles.container}>
      <PageHeader title="Data Model" metrics={[{ value: entities.length, label: 'tables' }]} />

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
              {isDiffMode &&
                entityStatusMap &&
                (() => {
                  const addedCount = group.entities.filter(
                    (e) => entityStatusMap.get(e.name) === 'added',
                  ).length;
                  const modifiedCount = group.entities.filter(
                    (e) => entityStatusMap.get(e.name) === 'modified',
                  ).length;
                  if (addedCount === 0 && modifiedCount === 0) return null;
                  return (
                    <span className={styles.diffCounts}>
                      {addedCount > 0 && (
                        <span className={styles.diffCountAdded}>{addedCount} new</span>
                      )}
                      {modifiedCount > 0 && (
                        <span className={styles.diffCountModified}>{modifiedCount} modified</span>
                      )}
                    </span>
                  );
                })()}
            </div>

            {group.entities.map((entity) => {
              const idx = staggerIndex++;
              return (
                <EntityRow
                  key={entity.name}
                  entity={entity}
                  staggerIndex={idx}
                  isOpen={openEntities.has(entity.name)}
                  isHighlighted={highlightedEntity === entity.name}
                  diffStatus={getEntityDiffStatus(entity.name, entityStatusMap)}
                  onToggle={() => toggleEntity(entity.name)}
                  onOpen={() => openEntity(entity.name)}
                  onScrollToEntity={scrollToAndExpand}
                />
              );
            })}

            {isDiffMode &&
              removedEntities
                .filter((e) => e.badge === group.category)
                .map((entity) => (
                  <EntityRow
                    key={`removed-${entity.name}`}
                    entity={entity}
                    staggerIndex={0}
                    isOpen={false}
                    isHighlighted={false}
                    diffStatus="removed"
                    onToggle={() => {}}
                    onOpen={() => {}}
                    onScrollToEntity={() => {}}
                  />
                ))}
          </div>
        ))}

        {grouped.length === 0 && (
          <div className={styles.emptyState}>No tables match the current filters.</div>
        )}
      </div>
    </div>
  );
}
