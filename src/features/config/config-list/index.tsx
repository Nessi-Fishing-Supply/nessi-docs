'use client';

import { useState, useMemo } from 'react';
import type { ConfigEnum } from '@/types/config-ref';
import type { Role } from '@/types/permission';
import type { FieldChange } from '@/types/diff';
import { PERMISSION_FEATURES, LEVEL_CONFIG } from '@/types/permission';
import { useAppStore } from '@/stores/app-store';
import { useBranchHref } from '@/hooks/use-branch-href';
import { PageHeader } from '@/components/layout/page-header';
import { CollapsibleRow } from '@/components/layout/collapsible-row';
import { useDiffResult } from '@/hooks/use-diff-result';
import { Badge } from '@/components/indicators/badge';
import {
  DiffFilterBar,
  type DiffStatusFilter,
} from '@/components/layout/filter-bar/diff-filter-bar';
import styles from './config-list.module.scss';

const ROLES_SLUG = '__roles__';

/* ── Row Headers ── */

function EnumRowHeader({
  enumDef,
  status,
  isOpen,
}: {
  enumDef: ConfigEnum;
  status?: string;
  isOpen: boolean;
}) {
  return (
    <>
      <span className={styles.enumName}>{enumDef.name}</span>
      {status && status !== 'unchanged' && (
        <Badge variant="diff" status={status as 'added' | 'modified' | 'removed'} />
      )}
      <span className={styles.enumCount}>{enumDef.values.length} values</span>
      <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
    </>
  );
}

function RolesRowHeader({ count, isOpen }: { count: number; isOpen: boolean }) {
  return (
    <>
      <span className={styles.enumName}>Roles &amp; Permissions</span>
      <span className={styles.enumCount}>{count} roles</span>
      <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
    </>
  );
}

/* ── Enum Body ── */

function EnumBody({
  enumDef,
  addedValueNames,
  addedValueObjects,
}: {
  enumDef: ConfigEnum;
  addedValueNames: Set<string>;
  addedValueObjects: ConfigEnum['values'];
}) {
  return (
    <div className={styles.enumBody}>
      <p className={styles.enumDescription}>{enumDef.description}</p>

      <div className={styles.sourceRow}>
        <span className={styles.sourceLabel}>Source</span>
        <code className={styles.sourceValue}>{enumDef.source}</code>
      </div>

      <div className={styles.valueTable}>
        <div className={styles.valueHeader}>
          <span>Value</span>
          <span>Label</span>
          <span>Description</span>
        </div>
        {enumDef.values.map((v) => (
          <div
            key={v.value}
            className={`${styles.valueRow} ${addedValueNames.has(v.value) ? styles.valueRowAdded : ''}`}
          >
            <span className={styles.valueCode}>{v.value}</span>
            <span className={styles.valueLabel}>{v.label}</span>
            <span className={styles.valueDesc}>{v.description ?? '—'}</span>
          </div>
        ))}
        {addedValueObjects.map((v) => (
          <div key={`added-${v.value}`} className={`${styles.valueRow} ${styles.valueRowAdded}`}>
            <span className={styles.valueCode}>{v.value}</span>
            <span className={styles.valueLabel}>{v.label}</span>
            <span className={styles.valueDesc}>{v.description ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Roles Body ── */

function RolesBody({ roles }: { roles: Role[] }) {
  const setSelectedItem = useAppStore.getState().selectItem;

  return (
    <div className={styles.enumBody}>
      {/* Role Cards */}
      <div className={styles.roleCards}>
        {roles.map((role) => (
          <button
            key={role.slug}
            className={styles.roleCard}
            onClick={() => setSelectedItem({ type: 'role', role })}
          >
            <span className={styles.roleName} style={{ color: role.color }}>
              {role.name}
            </span>
            <p className={styles.roleDescription}>{role.description}</p>
          </button>
        ))}
      </div>

      {/* Permission Matrix */}
      <div className={styles.matrix}>
        <div className={styles.matrixHeader}>
          <div className={styles.featureCol}>Feature</div>
          {roles.map((role) => (
            <div key={role.slug} className={styles.roleCol} style={{ color: role.color }}>
              {role.name}
            </div>
          ))}
        </div>

        {PERMISSION_FEATURES.map((feature, idx) => (
          <div
            key={feature.key}
            className={`${styles.matrixRow} ${idx % 2 === 0 ? styles.matrixRowEven : ''}`}
          >
            <div className={styles.featureInfo}>
              <span className={styles.featureLabel}>{feature.label}</span>
              <span className={styles.featureDescription}>{feature.description}</span>
            </div>
            {roles.map((role) => {
              const level = role.permissions[feature.key];
              const config = LEVEL_CONFIG[level];
              return (
                <div key={role.slug} className={styles.levelCell}>
                  <span
                    className={styles.levelBadge}
                    style={{ color: config.color, borderColor: config.color }}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */

interface ConfigListProps {
  enums: ConfigEnum[];
  roles?: Role[];
}

export function ConfigList({ enums, roles }: ConfigListProps) {
  const setSelectedItem = useAppStore.getState().selectItem;
  const branchHref = useBranchHref();
  const { isActive: isDiffMode, diffResult } = useDiffResult();
  const configStatusMap = isDiffMode ? diffResult?.configEnums.statusMap : undefined;
  const [openSlugs, setOpenSlugs] = useState<Set<string>>(new Set());
  const [diffFilter, setDiffFilter] = useState<DiffStatusFilter>('all');

  const diffCounts = useMemo(() => {
    if (!diffResult) return { added: 0, modified: 0, removed: 0 };
    return {
      added: diffResult.configEnums.added.length,
      modified: diffResult.configEnums.modified.length,
      removed: diffResult.configEnums.removed.length,
    };
  }, [diffResult]);

  const changedFieldsMap = useMemo(() => {
    const map = new Map<string, FieldChange[]>();
    if (!diffResult) return map;
    for (const mod of diffResult.configEnums.modified) {
      map.set(mod.head.slug, mod.changes);
    }
    return map;
  }, [diffResult]);

  const addedEnums = useMemo(() => {
    if (!isDiffMode || !diffResult) return [];
    return diffResult.configEnums.added;
  }, [isDiffMode, diffResult]);

  const filteredEnums = useMemo(() => {
    if (!isDiffMode || !configStatusMap) return enums;
    if (diffFilter === 'all') {
      return enums.filter((e) => {
        const s = configStatusMap.get(e.slug);
        return s === 'added' || s === 'modified' || s === 'removed';
      });
    }
    return enums.filter((e) => configStatusMap.get(e.slug) === diffFilter);
  }, [enums, isDiffMode, configStatusMap, diffFilter]);

  const totalValues = enums.reduce((sum, e) => sum + e.values.length, 0);

  const toggleSlug = (slug: string) => {
    if (isDiffMode && configStatusMap?.get(slug) === 'unchanged') return;
    setOpenSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const handleExpand = (slug: string, enumDef: ConfigEnum) => {
    const status = configStatusMap?.get(slug);
    if (isDiffMode && status && status !== 'unchanged') {
      setSelectedItem({
        type: 'diff-item',
        item: {
          key: slug,
          label: enumDef.name,
          status,
          domain: 'Config',
          href: branchHref(`/config#${slug}`),
          changedFields: changedFieldsMap.get(slug),
          data: enumDef,
        },
      });
    } else if (!isDiffMode) {
      setSelectedItem({ type: 'config-enum', configEnum: enumDef });
    }
  };

  const rolesOpen = openSlugs.has(ROLES_SLUG);

  const metrics: { value: number; label: string }[] = [
    { value: enums.length, label: 'enums' },
    { value: totalValues, label: 'total values' },
  ];
  if (roles && roles.length > 0) {
    metrics.push({ value: roles.length, label: 'roles' });
  }

  let staggerIndex = 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <PageHeader title="Config Reference" metrics={metrics} />

      {/* Table of Contents — hidden in diff mode */}
      {!isDiffMode && (
        <nav className={styles.toc}>
          {roles && roles.length > 0 && (
            <button
              className={`${styles.tocItem} ${rolesOpen ? styles.tocItemActive : ''}`}
              onClick={() => toggleSlug(ROLES_SLUG)}
            >
              <span className={styles.tocName}>Roles &amp; Permissions</span>
              <span className={styles.tocCount}>{roles.length}</span>
            </button>
          )}
          {filteredEnums.map((e) => (
            <button
              key={e.slug}
              className={`${styles.tocItem} ${openSlugs.has(e.slug) ? styles.tocItemActive : ''}`}
              onClick={() => toggleSlug(e.slug)}
            >
              <span className={styles.tocName}>{e.name}</span>
              <span className={styles.tocCount}>{e.values.length}</span>
            </button>
          ))}
        </nav>
      )}

      {isDiffMode && (
        <div className={styles.diffFilterRow}>
          <DiffFilterBar active={diffFilter} onChange={setDiffFilter} counts={diffCounts} />
        </div>
      )}

      {/* Enum Blocks */}
      <div className={styles.enums}>
        {/* Roles & Permissions Section — hidden in diff mode since roles don't change */}
        {roles && roles.length > 0 && !isDiffMode && (
          <CollapsibleRow
            id={ROLES_SLUG}
            staggerIndex={staggerIndex++}
            isOpen={rolesOpen}
            onToggle={() => toggleSlug(ROLES_SLUG)}
            header={<RolesRowHeader count={roles.length} isOpen={rolesOpen} />}
          >
            <RolesBody roles={roles} />
          </CollapsibleRow>
        )}

        {/* Config Enum Blocks */}
        {filteredEnums.map((e) => {
          const idx = staggerIndex++;
          const status = configStatusMap?.get(e.slug);
          const changes = changedFieldsMap.get(e.slug);
          const { addedValueNames, addedValueObjects } = (() => {
            if (!changes)
              return {
                addedValueNames: new Set<string>(),
                addedValueObjects: [] as ConfigEnum['values'],
              };
            const vc = changes.find((c) => c.field === 'values');
            if (!vc)
              return {
                addedValueNames: new Set<string>(),
                addedValueObjects: [] as ConfigEnum['values'],
              };
            const base = Array.isArray(vc.baseValue) ? vc.baseValue : [];
            const head = Array.isArray(vc.headValue) ? vc.headValue : [];
            const baseVals = new Set(base.map((v: { value: string }) => v.value));
            const added = (head as ConfigEnum['values']).filter((v) => !baseVals.has(v.value));
            return {
              addedValueNames: new Set(added.map((v) => v.value)),
              addedValueObjects: added,
            };
          })();
          return (
            <CollapsibleRow
              key={e.slug}
              id={e.slug}
              staggerIndex={idx}
              isOpen={openSlugs.has(e.slug)}
              onToggle={() => toggleSlug(e.slug)}
              diffStatus={status}
              onExpand={() => handleExpand(e.slug, e)}
              header={<EnumRowHeader enumDef={e} status={status} isOpen={openSlugs.has(e.slug)} />}
            >
              <EnumBody
                enumDef={e}
                addedValueNames={addedValueNames}
                addedValueObjects={addedValueObjects}
              />
            </CollapsibleRow>
          );
        })}

        {/* Added Config Enums (diff mode only) */}
        {isDiffMode &&
          (diffFilter === 'all' || diffFilter === 'added') &&
          addedEnums.map((e) => (
            <CollapsibleRow
              key={`added-${e.slug}`}
              id={e.slug}
              staggerIndex={0}
              isOpen={openSlugs.has(e.slug)}
              onToggle={() => toggleSlug(e.slug)}
              diffStatus="added"
              onExpand={() => handleExpand(e.slug, e)}
              header={<EnumRowHeader enumDef={e} status="added" isOpen={openSlugs.has(e.slug)} />}
            >
              <EnumBody enumDef={e} addedValueNames={new Set<string>()} addedValueObjects={[]} />
            </CollapsibleRow>
          ))}
      </div>
    </div>
  );
}
