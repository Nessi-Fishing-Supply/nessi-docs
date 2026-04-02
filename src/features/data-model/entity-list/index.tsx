'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Entity } from '@/types/data-model';
import { getMethodColors } from '@/constants/colors';
import { rlsOperationToMethod, getBestEndpointForOperation, getLifecycleForEntity } from '@/data';
import { useBranchHref } from '@/providers/branch-provider';
import { PageHeader } from '@/components/ui/page-header';
import { BorderTrace } from '@/components/data-display/border-trace';
import { Tooltip } from '@/components/data-display';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { useDocsContext } from '@/providers/docs-provider';
import { DiffBadge } from '@/components/ui/diff-badge';
import { DiffFilterBar, type DiffStatusFilter } from '@/components/ui/diff-filter-bar';
import type { DiffStatus, FieldChange } from '@/types/diff';
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
  changedFields,
  onToggle,
  onOpen,
  onScrollToEntity,
}: {
  entity: Entity;
  staggerIndex: number;
  isOpen: boolean;
  isHighlighted: boolean;
  diffStatus: DiffStatus | null;
  changedFields?: FieldChange[];
  onToggle: () => void;
  onOpen: () => void;
  onScrollToEntity: (name: string) => void;
}) {
  const branchHref = useBranchHref();
  const { setSelectedItem } = useDocsContext();
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
        onClick={
          diffStatus === 'unchanged'
            ? undefined
            : () => {
                onToggle();
                if (diffStatus) {
                  setSelectedItem({
                    type: 'diff-item',
                    item: {
                      key: entity.name,
                      label: entity.name,
                      status: diffStatus,
                      domain: 'Data Model',
                      href: branchHref(`/data-model#${entity.name}`),
                      changedFields,
                      data: entity,
                    },
                  });
                }
              }
        }
        style={diffStatus === 'unchanged' ? { cursor: 'default' } : undefined}
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

      {isOpen && (
        <EntityExpansion
          entity={entity}
          onScrollToEntity={onScrollToEntity}
          changedFields={changedFields}
        />
      )}
    </div>
  );
}

/* ── Field Table ── */

function FieldTable({
  entity,
  onScrollToEntity,
  changedFieldNames,
  addedFields,
}: {
  entity: Entity;
  onScrollToEntity: (name: string) => void;
  changedFieldNames?: Set<string>;
  addedFields?: Entity['fields'];
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
          <tr
            key={f.name}
            className={`${styles.fieldRow} ${changedFieldNames?.has(f.name) ? styles.fieldRowChanged : ''}`}
          >
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
        {addedFields &&
          addedFields.map((f) => (
            <tr key={`added-${f.name}`} className={`${styles.fieldRow} ${styles.fieldRowAdded}`}>
              <td className={styles.fieldName}>
                {f.name}
                {f.nullable && <span className={styles.tagNull}>null</span>}
              </td>
              <td className={styles.fieldType}>{f.type}</td>
              <td className={styles.fieldDefault}>{f.default ?? ''}</td>
              <td className={styles.fieldRef} />
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
  changedFields,
}: {
  entity: Entity;
  onScrollToEntity: (name: string) => void;
  changedFields?: FieldChange[];
}) {
  const hasMeta = hasMetaSections(entity);

  // Compute which individual fields were added/changed if 'fields' is in changedFields
  const { changedFieldNames, addedFields } = useMemo(() => {
    const empty = { changedFieldNames: new Set<string>(), addedFields: [] as Entity['fields'] };
    if (!changedFields) return empty;
    const fieldsChange = changedFields.find((c) => c.field === 'fields');
    if (!fieldsChange) return empty;
    const baseFields = Array.isArray(fieldsChange.baseValue) ? fieldsChange.baseValue : [];
    const headFields = Array.isArray(fieldsChange.headValue) ? fieldsChange.headValue : [];
    const baseNames = new Map(baseFields.map((f: { name: string }) => [f.name, JSON.stringify(f)]));
    const changed = new Set<string>();
    const added: Entity['fields'] = [];
    for (const f of headFields as Entity['fields']) {
      const baseJson = baseNames.get(f.name);
      if (!baseJson) {
        changed.add(f.name);
        added.push(f);
      } else if (baseJson !== JSON.stringify(f)) {
        changed.add(f.name);
      }
    }
    return { changedFieldNames: changed, addedFields: added };
  }, [changedFields]);

  return (
    <div className={styles.expansion}>
      <div className={hasMeta ? styles.splitLayout : undefined}>
        <div className={hasMeta ? styles.splitLeft : styles.fullWidth}>
          <FieldTable
            entity={entity}
            onScrollToEntity={onScrollToEntity}
            addedFields={addedFields}
            changedFieldNames={changedFieldNames}
          />
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
  const [diffFilter, setDiffFilter] = useState<DiffStatusFilter>('all');

  const diffCounts = useMemo(() => {
    if (!diffResult) return { added: 0, modified: 0, removed: 0 };
    return {
      added: diffResult.entities.added.length,
      modified: diffResult.entities.modified.length,
      removed: diffResult.entities.removed.length,
    };
  }, [diffResult]);

  const changedFieldsMap = useMemo(() => {
    const map = new Map<string, FieldChange[]>();
    if (!diffResult) return map;
    for (const mod of diffResult.entities.modified) {
      map.set(mod.head.name, mod.changes);
    }
    return map;
  }, [diffResult]);

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
      for (const e of diffResult.entities.added) {
        if (e.badge) cats.add(e.badge);
      }
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

  const addedEntities = useMemo(() => {
    if (!isDiffMode || !diffResult) return [];
    return diffResult.entities.added;
  }, [isDiffMode, diffResult]);

  const removedEntities = useMemo(() => {
    if (!isDiffMode || !diffResult) return [];
    return diffResult.entities.removed;
  }, [isDiffMode, diffResult]);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => activeCategories.has(cat) && allCategoryNames.has(cat))
      .map((cat) => {
        let catEntities = entities.filter((e) => e.badge === cat);
        // Apply diff status filter — 'all' in compare mode means "all changes" (not unchanged)
        if (isDiffMode && entityStatusMap) {
          if (diffFilter === 'all') {
            catEntities = catEntities.filter((e) => {
              const s = entityStatusMap.get(e.name);
              return s === 'added' || s === 'modified' || s === 'removed';
            });
          } else {
            catEntities = catEntities.filter((e) => entityStatusMap.get(e.name) === diffFilter);
          }
        }
        return {
          category: cat,
          label: CATEGORY_LABELS[cat] ?? cat,
          entities: catEntities,
        };
      })
      .filter((g) => {
        if (g.entities.length > 0) return true;
        if (diffFilter === 'all' || diffFilter === 'added') {
          if (addedEntities.some((e) => e.badge === g.category)) return true;
        }
        if (diffFilter === 'all' || diffFilter === 'removed') {
          if (removedEntities.some((e) => e.badge === g.category)) return true;
        }
        return false;
      });
  }, [
    entities,
    activeCategories,
    allCategoryNames,
    addedEntities,
    removedEntities,
    isDiffMode,
    entityStatusMap,
    diffFilter,
  ]);

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

      {!isDiffMode && (
        <FilterBar
          categories={categories}
          activeCategories={activeCategories}
          onToggleCategory={toggleCategory}
          onToggleAll={toggleAll}
          totalCount={entities.length}
        />
      )}

      {isDiffMode && (
        <div className={styles.diffFilterRow}>
          <DiffFilterBar active={diffFilter} onChange={setDiffFilter} counts={diffCounts} />
        </div>
      )}

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
                  changedFields={changedFieldsMap.get(entity.name)}
                  onToggle={() => toggleEntity(entity.name)}
                  onOpen={() => openEntity(entity.name)}
                  onScrollToEntity={scrollToAndExpand}
                />
              );
            })}

            {isDiffMode &&
              (diffFilter === 'all' || diffFilter === 'added') &&
              addedEntities
                .filter((e) => e.badge === group.category)
                .map((entity) => (
                  <EntityRow
                    key={`added-${entity.name}`}
                    entity={entity}
                    staggerIndex={0}
                    isOpen={openEntities.has(entity.name)}
                    isHighlighted={false}
                    diffStatus="added"
                    onToggle={() => toggleEntity(entity.name)}
                    onOpen={() => openEntity(entity.name)}
                    onScrollToEntity={scrollToAndExpand}
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
