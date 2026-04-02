'use client';

import { useState, useMemo } from 'react';
import type { ArchDiagram } from '@/types/architecture';
import { useBranchHref } from '@/providers/branch-provider';
import { useAppStore } from '@/stores/app-store';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { Badge } from '@/components/indicators/badge';
import { PageHeader } from '@/components/layout/page-header';
import { ListRow } from '@/components/layout/list-row';
import { FilterBar, FilterChip } from '@/components/layout/filter-bar';
import type { DiffStatusFilter } from '@/components/layout/filter-bar/diff-filter-bar';
import styles from './architecture-list.module.scss';

interface ArchitectureListProps {
  diagrams: ArchDiagram[];
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  stack: { label: 'Stack', color: 'rgba(88,166,255,0.7)' },
  flow: { label: 'Flow', color: 'rgba(61,140,117,0.7)' },
  pipeline: { label: 'Pipeline', color: 'rgba(210,168,255,0.7)' },
};

export function ArchitectureList({ diagrams }: ArchitectureListProps) {
  const branchHref = useBranchHref();
  const setSelectedItem = useAppStore.getState().selectItem;
  const { isActive: isDiffMode, diffResult } = useDiffMode();
  const archStatusMap = isDiffMode ? diffResult?.archDiagrams.statusMap : undefined;
  const [diffFilter, setDiffFilter] = useState<DiffStatusFilter>('all');

  const diffCounts = useMemo(() => {
    if (!archStatusMap) return { added: 0, modified: 0, removed: 0 };
    let added = 0;
    let modified = 0;
    let removed = 0;
    archStatusMap.forEach((status) => {
      if (status === 'added') added++;
      else if (status === 'modified') modified++;
      else if (status === 'removed') removed++;
    });
    // Also count removed diagrams not in statusMap
    if (diffResult) removed += diffResult.archDiagrams.removed.length;
    return { added, modified, removed };
  }, [archStatusMap, diffResult]);

  /* Merge production diagrams with added diagrams from diff */
  const allDiagrams = useMemo(() => {
    if (!isDiffMode || !diffResult) return diagrams;
    const addedDiagrams = diffResult.archDiagrams.added ?? [];
    return [...diagrams, ...addedDiagrams];
  }, [diagrams, isDiffMode, diffResult]);

  const filteredDiagrams = useMemo(() => {
    if (!isDiffMode) return allDiagrams;
    return allDiagrams.filter((d) => {
      const status = archStatusMap?.get(d.slug) ?? 'unchanged';
      if (status === 'unchanged') return false;
      if (diffFilter === 'all') return true;
      return status === diffFilter;
    });
  }, [allDiagrams, isDiffMode, archStatusMap, diffFilter]);

  /* Also include removed diagrams (not in production data) */
  const removedDiagrams = useMemo(() => {
    if (!isDiffMode || !diffResult) return [];
    if (diffFilter !== 'all' && diffFilter !== 'removed') return [];
    return diffResult.archDiagrams.removed;
  }, [isDiffMode, diffResult, diffFilter]);

  const totalNodes = diagrams.reduce(
    (s, d) => s + d.layers.reduce((ls, l) => ls + l.nodes.length, 0),
    0,
  );
  const totalConnections = diagrams.reduce((s, d) => s + d.connections.length, 0);

  const total = diffCounts.added + diffCounts.modified + diffCounts.removed;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Architecture"
        metrics={[
          { value: diagrams.length, label: 'diagrams' },
          { value: totalNodes, label: 'nodes' },
          { value: totalConnections, label: 'connections' },
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
        {filteredDiagrams.map((d, idx) => {
          const nodeCount = d.layers.reduce((s, l) => s + l.nodes.length, 0);
          const cat = CATEGORY_CONFIG[d.category] ?? {
            label: d.category,
            color: 'rgba(106,104,96,0.5)',
          };
          const dStatus = archStatusMap?.get(d.slug) ?? 'unchanged';

          const handleClick = () => {
            if (isDiffMode && dStatus !== 'unchanged') {
              setSelectedItem({
                type: 'diff-item',
                item: {
                  key: d.slug,
                  label: d.title,
                  status: dStatus,
                  domain: 'Architecture',
                  href: branchHref(`/architecture/${d.slug}`),
                  data: d,
                },
              });
            }
          };

          return (
            <ListRow
              key={d.slug}
              href={branchHref(`/architecture/${d.slug}`)}
              staggerIndex={idx}
              diffStatus={archStatusMap ? dStatus : undefined}
              onClick={handleClick}
            >
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>
                  {d.title}
                  {dStatus !== 'unchanged' && <Badge variant="diff" status={dStatus} />}
                </div>
                <div className={styles.rowDesc}>{d.description}</div>
              </div>
              <span
                className={styles.categoryBadge}
                style={{ background: `${cat.color}25`, color: cat.color }}
              >
                {cat.label}
              </span>
              <span className={styles.statCount}>{d.layers.length} layers</span>
              <span className={styles.statCount}>{nodeCount} nodes</span>
              <span className={styles.statCount}>{d.connections.length} edges</span>
              <span className={styles.chevron}>&rsaquo;</span>
            </ListRow>
          );
        })}
        {removedDiagrams.map((d) => {
          const cat = CATEGORY_CONFIG[d.category] ?? {
            label: d.category,
            color: 'rgba(106,104,96,0.5)',
          };
          const nodeCount = d.layers.reduce((s, l) => s + l.nodes.length, 0);
          return (
            <div
              key={`removed-${d.slug}`}
              className={styles.removedRow}
              onClick={() => {
                setSelectedItem({
                  type: 'diff-item',
                  item: {
                    key: d.slug,
                    label: d.title,
                    status: 'removed',
                    domain: 'Architecture',
                    href: branchHref(`/architecture/${d.slug}`),
                    data: d,
                  },
                });
              }}
            >
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>
                  {d.title}
                  <Badge variant="diff" status="removed" />
                </div>
                <div className={styles.rowDesc}>{d.description}</div>
              </div>
              <span
                className={styles.categoryBadge}
                style={{ background: `${cat.color}25`, color: cat.color }}
              >
                {cat.label}
              </span>
              <span className={styles.statCount}>{d.layers.length} layers</span>
              <span className={styles.statCount}>{nodeCount} nodes</span>
              <span className={styles.statCount}>{d.connections.length} edges</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
