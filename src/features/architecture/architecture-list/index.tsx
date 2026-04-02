'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { ArchDiagram } from '@/types/architecture';
import { useBranchHref } from '@/providers/branch-provider';
import { useDocsContext } from '@/providers/docs-provider';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
import { DiffFilterBar, type DiffStatusFilter } from '@/components/ui/diff-filter-bar';
import { PageHeader } from '@/components/layout/page-header';
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
  const { setSelectedItem } = useDocsContext();
  const { isActive: isDiffMode, diffResult } = useDiffMode();
  const archStatusMap = isDiffMode ? diffResult?.archDiagrams.statusMap : undefined;
  const [diffFilter, setDiffFilter] = useState<DiffStatusFilter>('all');
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

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
        <div className={styles.diffFilterRow}>
          <DiffFilterBar active={diffFilter} onChange={setDiffFilter} counts={diffCounts} />
        </div>
      )}

      <div className={styles.list}>
        {filteredDiagrams.map((d, i) => {
          const nodeCount = d.layers.reduce((s, l) => s + l.nodes.length, 0);
          const cat = CATEGORY_CONFIG[d.category] ?? {
            label: d.category,
            color: 'rgba(106,104,96,0.5)',
          };
          const dStatus = archStatusMap?.get(d.slug) ?? 'unchanged';
          const rowClass = `${styles.row} ${archStatusMap ? styles[`diff_${dStatus}`] : ''}`;
          const rowStyle = {
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(4px)',
            transition: `opacity 200ms ease-out ${i * 30}ms, transform 200ms ease-out ${i * 30}ms, background 150ms ease-out`,
          };
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
          const rowContent = (
            <>
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>
                  {d.title}
                  {dStatus !== 'unchanged' && <DiffBadge status={dStatus} />}
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
            </>
          );

          return (
            <Link
              key={d.slug}
              href={branchHref(`/architecture/${d.slug}`)}
              className={rowClass}
              style={rowStyle}
              onClick={handleClick}
            >
              {rowContent}
            </Link>
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
              className={`${styles.row} ${styles.diff_removed}`}
              style={{ opacity: 0.6 }}
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
                  <DiffBadge status="removed" />
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
