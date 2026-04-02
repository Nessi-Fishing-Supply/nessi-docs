'use client';

import { useState, useMemo } from 'react';
import type { Lifecycle } from '@/types/lifecycle';
import { getEntitiesForLifecycle, getJourneysForLifecycle } from '@/data';
import { useBranchHref } from '@/providers/branch-provider';
import { useDocsContext } from '@/providers/docs-provider';
import { PageHeader } from '@/components/layout/page-header';
import { ListRow } from '@/components/layout/list-row';
import { FilterBar, FilterChip } from '@/components/layout/filter-bar';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { Badge } from '@/components/indicators/badge';
import type { DiffStatusFilter } from '@/components/layout/filter-bar/diff-filter-bar';
import styles from './lifecycle-list.module.scss';

interface LifecycleListProps {
  lifecycles: Lifecycle[];
}

function sourceColor(source?: string): string {
  switch (source) {
    case 'enum':
      return 'rgba(61,140,117,0.7)';
    case 'check_constraint':
      return 'rgba(226,119,57,0.7)';
    case 'typescript':
      return 'rgba(88,166,255,0.7)';
    default:
      return 'rgba(106,104,96,0.5)';
  }
}

function sourceLabel(source?: string): string {
  switch (source) {
    case 'enum':
      return 'enum';
    case 'check_constraint':
      return 'check';
    case 'typescript':
      return 'ts';
    default:
      return 'unknown';
  }
}

export function LifecycleList({ lifecycles }: LifecycleListProps) {
  const branchHref = useBranchHref();
  const { setSelectedItem } = useDocsContext();
  const { isActive: isDiffMode, diffResult } = useDiffMode();
  const lifecycleStatusMap = isDiffMode ? diffResult?.lifecycles.statusMap : undefined;
  const [diffFilter, setDiffFilter] = useState<DiffStatusFilter>('all');

  const diffCounts = useMemo(() => {
    if (!lifecycleStatusMap) return { added: 0, modified: 0, removed: 0 };
    let added = 0;
    let modified = 0;
    let removed = 0;
    lifecycleStatusMap.forEach((status) => {
      if (status === 'added') added++;
      else if (status === 'modified') modified++;
      else if (status === 'removed') removed++;
    });
    if (diffResult) removed += diffResult.lifecycles.removed.length;
    return { added, modified, removed };
  }, [lifecycleStatusMap, diffResult]);

  /* Merge production lifecycles with added lifecycles from diff */
  const allLifecycles = useMemo(() => {
    if (!isDiffMode || !diffResult) return lifecycles;
    const addedLifecycles = diffResult.lifecycles.added ?? [];
    return [...lifecycles, ...addedLifecycles];
  }, [lifecycles, isDiffMode, diffResult]);

  const filteredLifecycles = useMemo(() => {
    if (!isDiffMode) return allLifecycles;
    return allLifecycles.filter((lc) => {
      const status = lifecycleStatusMap?.get(lc.slug) ?? 'unchanged';
      if (status === 'unchanged') return false;
      if (diffFilter === 'all') return true;
      return status === diffFilter;
    });
  }, [allLifecycles, isDiffMode, lifecycleStatusMap, diffFilter]);

  const removedLifecycles = useMemo(() => {
    if (!isDiffMode || !diffResult) return [];
    if (diffFilter !== 'all' && diffFilter !== 'removed') return [];
    return diffResult.lifecycles.removed;
  }, [isDiffMode, diffResult, diffFilter]);

  const totalStates = lifecycles.reduce((s, l) => s + l.states.length, 0);
  const totalTransitions = lifecycles.reduce((s, l) => s + l.transitions.length, 0);

  const total = diffCounts.added + diffCounts.modified + diffCounts.removed;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Lifecycles"
        metrics={[
          { value: lifecycles.length, label: 'lifecycles' },
          { value: totalStates, label: 'states' },
          { value: totalTransitions, label: 'transitions' },
        ]}
      />

      {isDiffMode && (
        <FilterBar className={styles.filterBar}>
          <FilterChip
            label="All Changes"
            active={diffFilter === 'all'}
            onToggle={() => setDiffFilter('all')}
            count={total}
          />
          {diffCounts.added > 0 && (
            <FilterChip
              label="New"
              active={diffFilter === 'added'}
              onToggle={() => setDiffFilter('added')}
              count={diffCounts.added}
            />
          )}
          {diffCounts.modified > 0 && (
            <FilterChip
              label="Modified"
              active={diffFilter === 'modified'}
              onToggle={() => setDiffFilter('modified')}
              count={diffCounts.modified}
            />
          )}
          {diffCounts.removed > 0 && (
            <FilterChip
              label="Removed"
              active={diffFilter === 'removed'}
              onToggle={() => setDiffFilter('removed')}
              count={diffCounts.removed}
            />
          )}
        </FilterBar>
      )}

      <div className={styles.list}>
        {filteredLifecycles.map((lc, idx) => {
          const lcStatus = lifecycleStatusMap?.get(lc.slug) ?? 'unchanged';

          const handleClick = () => {
            if (isDiffMode && lcStatus !== 'unchanged') {
              setSelectedItem({
                type: 'diff-item',
                item: {
                  key: lc.slug,
                  label: lc.name,
                  status: lcStatus,
                  domain: 'Lifecycles',
                  href: branchHref(`/lifecycles/${lc.slug}`),
                  data: lc,
                },
              });
            }
          };

          return (
            <ListRow
              key={lc.slug}
              href={branchHref(`/lifecycles/${lc.slug}`)}
              staggerIndex={idx}
              diffStatus={lifecycleStatusMap ? lcStatus : undefined}
              onClick={handleClick}
            >
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>
                  {lc.name}
                  {lcStatus !== 'unchanged' && <Badge variant="diff" status={lcStatus} />}
                </div>
                <div className={styles.rowDesc}>{lc.description}</div>
                <div className={styles.rowMeta}>
                  {(() => {
                    const entityNames = getEntitiesForLifecycle(lc.slug);
                    if (entityNames.length === 0) return null;
                    return (
                      <span
                        role="link"
                        tabIndex={0}
                        className={styles.metaLink}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = branchHref(`/data-model#${entityNames[0]}`);
                        }}
                      >
                        Table: {entityNames[0]}
                      </span>
                    );
                  })()}
                  {(() => {
                    const journeys = getJourneysForLifecycle(lc.slug);
                    if (journeys.length === 0) return null;
                    return (
                      <span className={styles.metaText}>
                        {journeys.length} {journeys.length === 1 ? 'journey' : 'journeys'}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <span
                className={styles.sourceBadge}
                style={{ background: `${sourceColor(lc.source)}25`, color: sourceColor(lc.source) }}
              >
                {sourceLabel(lc.source)}
              </span>
              <span className={styles.statCount}>{lc.states.length} states</span>
              <span className={styles.statCount}>{lc.transitions.length} transitions</span>
              <span className={styles.chevron}>&rsaquo;</span>
            </ListRow>
          );
        })}
        {removedLifecycles.map((lc) => (
          <div
            key={`removed-${lc.slug}`}
            className={styles.removedRow}
            onClick={() => {
              setSelectedItem({
                type: 'diff-item',
                item: {
                  key: lc.slug,
                  label: lc.name,
                  status: 'removed',
                  domain: 'Lifecycles',
                  href: branchHref(`/lifecycles/${lc.slug}`),
                  data: lc,
                },
              });
            }}
          >
            <div className={styles.rowContent}>
              <div className={styles.rowTitle}>
                {lc.name}
                <Badge variant="diff" status="removed" />
              </div>
              <div className={styles.rowDesc}>{lc.description}</div>
            </div>
            <span className={styles.statCount}>{lc.states.length} states</span>
            <span className={styles.statCount}>{lc.transitions.length} transitions</span>
          </div>
        ))}
      </div>
    </div>
  );
}
