'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ConfigEnum } from '@/types/config-ref';
import type { Role } from '@/types/permission';
import type { FieldChange } from '@/types/diff';
import { PERMISSION_FEATURES, LEVEL_CONFIG } from '@/types/permission';
import { useDocsContext } from '@/providers/docs-provider';
import { useBranchHref } from '@/providers/branch-provider';
import { PageHeader } from '@/components/ui/page-header';
import { BorderTrace } from '@/components/ui/border-trace';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
import { DiffFilterBar, type DiffStatusFilter } from '@/components/ui/diff-filter-bar';
import styles from './config-list.module.scss';

const ROLES_SLUG = '__roles__';

interface ConfigListProps {
  enums: ConfigEnum[];
  roles?: Role[];
}

export function ConfigList({ enums, roles }: ConfigListProps) {
  const { setSelectedItem } = useDocsContext();
  const branchHref = useBranchHref();
  const { isActive: isDiffMode, diffResult } = useDiffMode();
  const configStatusMap = isDiffMode ? diffResult?.configEnums.statusMap : undefined;
  const [openSlugs, setOpenSlugs] = useState<Set<string>>(new Set());
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
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

  // Deep-link: detect hash, expand accordion, highlight, scroll
  useEffect(() => {
    function checkHash() {
      const hashes = window.location.hash.split('#').filter(Boolean);
      const hash = hashes[hashes.length - 1];
      if (!hash) return;

      setOpenSlugs((prev) => new Set(prev).add(hash));
      setHighlightSlug(hash);
      history.replaceState(null, '', window.location.pathname);
      setTimeout(() => {
        blockRefs.current.get(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => setHighlightSlug(null), 9500);
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const toggleSlug = (slug: string) => {
    if (isDiffMode && configStatusMap?.get(slug) === 'unchanged') return;
    const willOpen = !openSlugs.has(slug);
    setOpenSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
    if (willOpen && slug !== ROLES_SLUG) {
      const enumDef = enums.find((e) => e.slug === slug) ?? addedEnums.find((e) => e.slug === slug);
      if (!enumDef) return;
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
      } else {
        setSelectedItem({ type: 'config-enum', configEnum: enumDef });
      }
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
          <div
            id={ROLES_SLUG}
            ref={(el) => {
              if (el) blockRefs.current.set(ROLES_SLUG, el);
            }}
            className={`${styles.enumBlock} ${rolesOpen ? styles.enumOpen : ''}`}
          >
            <BorderTrace active={highlightSlug === ROLES_SLUG} />
            <button className={styles.enumHeader} onClick={() => toggleSlug(ROLES_SLUG)}>
              <span className={styles.enumName}>Roles &amp; Permissions</span>
              <span className={styles.enumCount}>{roles.length} roles</span>
              <span className={styles.chevron}>{rolesOpen ? '▾' : '▸'}</span>
            </button>

            {rolesOpen && (
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
            )}
          </div>
        )}

        {/* Config Enum Blocks */}
        {filteredEnums.map((e) => {
          const isOpen = openSlugs.has(e.slug);
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
            <div
              key={e.slug}
              id={e.slug}
              ref={(el) => {
                if (el) blockRefs.current.set(e.slug, el);
              }}
              className={`${styles.enumBlock} ${isOpen ? styles.enumOpen : ''} ${status ? styles[`diff_${status}`] : ''}`}
            >
              <BorderTrace active={highlightSlug === e.slug} />
              <button className={styles.enumHeader} onClick={() => toggleSlug(e.slug)}>
                <span className={styles.enumName}>{e.name}</span>
                {status && status !== 'unchanged' && <DiffBadge status={status} />}
                <span className={styles.enumCount}>{e.values.length} values</span>
                <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
              </button>

              {isOpen && (
                <div className={styles.enumBody}>
                  <p className={styles.enumDescription}>{e.description}</p>

                  <div className={styles.sourceRow}>
                    <span className={styles.sourceLabel}>Source</span>
                    <code className={styles.sourceValue}>{e.source}</code>
                  </div>

                  <div className={styles.valueTable}>
                    <div className={styles.valueHeader}>
                      <span>Value</span>
                      <span>Label</span>
                      <span>Description</span>
                    </div>
                    {e.values.map((v) => (
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
                      <div
                        key={`added-${v.value}`}
                        className={`${styles.valueRow} ${styles.valueRowAdded}`}
                      >
                        <span className={styles.valueCode}>{v.value}</span>
                        <span className={styles.valueLabel}>{v.label}</span>
                        <span className={styles.valueDesc}>{v.description ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Added Config Enums (diff mode only) */}
        {isDiffMode &&
          (diffFilter === 'all' || diffFilter === 'added') &&
          addedEnums.map((e) => {
            const isOpen = openSlugs.has(e.slug);
            return (
              <div
                key={`added-${e.slug}`}
                className={`${styles.enumBlock} ${isOpen ? styles.enumOpen : ''} ${styles.diff_added}`}
              >
                <button className={styles.enumHeader} onClick={() => toggleSlug(e.slug)}>
                  <span className={styles.enumName}>{e.name}</span>
                  <DiffBadge status="added" />
                  <span className={styles.enumCount}>{e.values.length} values</span>
                  <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
                </button>

                {isOpen && (
                  <div className={styles.enumBody}>
                    <p className={styles.enumDescription}>{e.description}</p>
                    <div className={styles.sourceRow}>
                      <span className={styles.sourceLabel}>Source</span>
                      <code className={styles.sourceValue}>{e.source}</code>
                    </div>
                    <div className={styles.valueTable}>
                      <div className={styles.valueHeader}>
                        <span>Value</span>
                        <span>Label</span>
                        <span>Description</span>
                      </div>
                      {e.values.map((v) => (
                        <div key={v.value} className={styles.valueRow}>
                          <span className={styles.valueCode}>{v.value}</span>
                          <span className={styles.valueLabel}>{v.label}</span>
                          <span className={styles.valueDesc}>{v.description ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
