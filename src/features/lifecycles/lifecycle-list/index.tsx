'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Lifecycle } from '@/types/lifecycle';
import { getEntitiesForLifecycle, getJourneysForLifecycle } from '@/data';
import { useBranchHref } from '@/providers/branch-provider';
import { PageHeader } from '@/components/ui/page-header';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
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
  const { isActive: isDiffMode, diffResult } = useDiffMode();
  const lifecycleStatusMap = isDiffMode ? diffResult?.lifecycles.statusMap : undefined;
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const totalStates = lifecycles.reduce((s, l) => s + l.states.length, 0);
  const totalTransitions = lifecycles.reduce((s, l) => s + l.transitions.length, 0);

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

      <div className={styles.list}>
        {lifecycles.map((lc, i) => (
          <Link
            key={lc.slug}
            href={branchHref(`/lifecycles/${lc.slug}`)}
            className={`${styles.row} ${lifecycleStatusMap ? styles[`diff_${lifecycleStatusMap.get(lc.slug) ?? 'unchanged'}`] : ''}`}
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateY(0)' : 'translateY(4px)',
              transition: `opacity 200ms ease-out ${i * 30}ms, transform 200ms ease-out ${i * 30}ms, background 150ms ease-out`,
            }}
          >
            <div className={styles.rowContent}>
              <div className={styles.rowTitle}>
                {lc.name}
                {(() => {
                  const status = lifecycleStatusMap?.get(lc.slug);
                  if (!status || status === 'unchanged') return null;
                  return <DiffBadge status={status} />;
                })()}
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
          </Link>
        ))}
        {isDiffMode &&
          diffResult &&
          diffResult.lifecycles.removed.map((lc) => (
            <div
              key={`removed-${lc.slug}`}
              className={`${styles.row} ${styles.diff_removed}`}
              style={{ opacity: 0.6 }}
            >
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>
                  {lc.name}
                  <DiffBadge status="removed" />
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
