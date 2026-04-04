'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Entity, EntityField } from '@/types/data-model';
import { getMethodColors } from '@/constants/colors';
import { rlsOperationToMethod, getBestEndpointForOperation, getLifecycleForEntity } from '@/data';
import { useBranchHref } from '@/hooks/use-branch-href';
import { PageHeader } from '@/components/layout/page-header';
import { CollapsibleRow } from '@/components/layout/collapsible-row';
import { FieldTable, type FieldTableColumn } from '@/components/data-display/field-table';
import { FilterBar, FilterChip } from '@/components/layout/filter-bar';
import { Tooltip } from '@/components/data-display';
import { useDiffResult } from '@/features/diff-overview';
import { useAppStore } from '@/stores/app-store';
import { Badge } from '@/components/indicators/badge';
import {
  DiffFilterBar,
  type DiffStatusFilter,
} from '@/components/layout/filter-bar/diff-filter-bar';
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

/* ── Entity Row Header ── */

function EntityRowHeader({
  entity,
  diffStatus,
  isOpen,
}: {
  entity: Entity;
  diffStatus: DiffStatus | null;
  isOpen: boolean;
}) {
  const branchHref = useBranchHref();
  const fkCount = countForeignKeys(entity);

  return (
    <>
      <span className={styles.entityName}>{entity.name}</span>
      {diffStatus && diffStatus !== 'unchanged' && <Badge variant="diff" status={diffStatus} />}
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
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>&#9656;</span>
      </span>
    </>
  );
}

/* ── Field Table Columns ── */

function useFieldTableColumns(
  onScrollToEntity: (name: string) => void,
): FieldTableColumn<EntityField>[] {
  return useMemo(
    () => [
      {
        key: 'name',
        label: 'Column',
        width: '150px',
        render: (_value: unknown, field: EntityField) => (
          <span className={styles.fieldName}>
            {field.name}
            {field.isPrimaryKey && <span className={styles.tagPk}>PK</span>}
            {field.references && <span className={styles.tagFk}>FK</span>}
            {field.nullable && !field.isPrimaryKey && !field.references && (
              <span className={styles.tagNull}>null</span>
            )}
          </span>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '80px',
        render: (_value: unknown, field: EntityField) => (
          <span className={styles.fieldType}>{field.type}</span>
        ),
      },
      {
        key: 'default',
        label: 'Default',
        width: '120px',
        render: (_value: unknown, field: EntityField) => (
          <span className={styles.fieldDefault}>
            {field.default && field.default.length > 15 ? (
              <Tooltip text={field.default}>
                <span className={styles.fieldDefaultTruncated}>{field.default}</span>
              </Tooltip>
            ) : (
              (field.default ?? '')
            )}
          </span>
        ),
      },
      {
        key: 'references',
        label: '',
        render: (_value: unknown, field: EntityField) =>
          field.references ? (
            <a
              href={`#${field.references.table}`}
              className={styles.fkRef}
              onClick={(e) => {
                e.preventDefault();
                onScrollToEntity(field.references!.table);
              }}
            >
              → {field.references.table}.{field.references.column}
              {field.references.onDelete ? ` ${field.references.onDelete}` : ''}
            </a>
          ) : null,
      },
    ],
    [onScrollToEntity],
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
  const columns = useFieldTableColumns(onScrollToEntity);

  // Compute which individual fields were added/changed if 'fields' is in changedFields
  const { changedFieldNames, addedFields } = useMemo(() => {
    const empty = { changedFieldNames: new Set<string>(), addedFields: [] as EntityField[] };
    if (!changedFields) return empty;
    const fieldsChange = changedFields.find((c) => c.field === 'fields');
    if (!fieldsChange) return empty;
    const baseFields = Array.isArray(fieldsChange.baseValue) ? fieldsChange.baseValue : [];
    const headFields = Array.isArray(fieldsChange.headValue) ? fieldsChange.headValue : [];
    const baseNames = new Map(baseFields.map((f: { name: string }) => [f.name, JSON.stringify(f)]));
    const changed = new Set<string>();
    const added: EntityField[] = [];
    for (const f of headFields as EntityField[]) {
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
            fields={entity.fields}
            columns={columns}
            changedFields={changedFieldNames}
            addedFields={addedFields}
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
  const branchHref = useBranchHref();
  const setSelectedItem = useAppStore.getState().selectItem;
  const { isActive: isDiffMode, diffResult } = useDiffResult();
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

  const scrollToAndExpand = (entityName: string) => {
    // Trigger hash-based deep-link — CollapsibleRow's useDeepLink handles
    // expand, scroll, highlight, and hash cleanup automatically
    window.location.hash = entityName;
  };

  const handleExpand = (entity: Entity, diffStatus: DiffStatus | null) => {
    if (diffStatus && diffStatus !== 'unchanged') {
      setSelectedItem({
        type: 'diff-item',
        item: {
          key: entity.name,
          label: entity.name,
          status: diffStatus,
          domain: 'Data Model',
          href: branchHref(`/data-model#${entity.name}`),
          changedFields: changedFieldsMap.get(entity.name),
          data: entity,
        },
      });
    }
  };

  let staggerIndex = 0;

  return (
    <div className={styles.container}>
      <PageHeader title="Data Model" metrics={[{ value: entities.length, label: 'tables' }]} />

      {!isDiffMode && (
        <FilterBar className={styles.filterBar}>
          <span className={styles.filterLabel}>Category</span>
          <FilterChip
            label="All"
            active={activeCategories.size === categories.length}
            onToggle={toggleAll}
            count={entities.length}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat.name}
              label={cat.label}
              active={activeCategories.has(cat.name)}
              onToggle={() => toggleCategory(cat.name)}
              count={cat.count}
            />
          ))}
        </FilterBar>
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
              const diffStatus = getEntityDiffStatus(entity.name, entityStatusMap);
              return (
                <CollapsibleRow
                  key={entity.name}
                  id={entity.name}
                  staggerIndex={idx}
                  isOpen={openEntities.has(entity.name)}
                  onToggle={() => toggleEntity(entity.name)}
                  diffStatus={diffStatus ?? undefined}
                  onExpand={() => handleExpand(entity, diffStatus)}
                  header={
                    <EntityRowHeader
                      entity={entity}
                      diffStatus={diffStatus}
                      isOpen={openEntities.has(entity.name)}
                    />
                  }
                >
                  <EntityExpansion
                    entity={entity}
                    onScrollToEntity={scrollToAndExpand}
                    changedFields={changedFieldsMap.get(entity.name)}
                  />
                </CollapsibleRow>
              );
            })}

            {isDiffMode &&
              (diffFilter === 'all' || diffFilter === 'added') &&
              addedEntities
                .filter((e) => e.badge === group.category)
                .map((entity) => (
                  <CollapsibleRow
                    key={`added-${entity.name}`}
                    id={entity.name}
                    staggerIndex={0}
                    isOpen={openEntities.has(entity.name)}
                    onToggle={() => toggleEntity(entity.name)}
                    diffStatus="added"
                    onExpand={() => handleExpand(entity, 'added')}
                    header={
                      <EntityRowHeader
                        entity={entity}
                        diffStatus="added"
                        isOpen={openEntities.has(entity.name)}
                      />
                    }
                  >
                    <EntityExpansion entity={entity} onScrollToEntity={scrollToAndExpand} />
                  </CollapsibleRow>
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
