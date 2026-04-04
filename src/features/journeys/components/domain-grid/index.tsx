'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { DomainWithStats } from '@/data';
import { useBranchHref } from '@/features/shared/hooks/use-branch-href';
import { useDiffResult } from '@/features/diff-overview';
import { PageHeader } from '@/components/layout/page-header';
import styles from './domain-grid.module.scss';

interface DomainGridProps {
  domains: DomainWithStats[];
}

export function DomainGrid({ domains }: DomainGridProps) {
  const branchHref = useBranchHref();
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const { isActive: isDiffMode, diffResult } = useDiffResult();

  const domainDiffCounts = useMemo(() => {
    if (!isDiffMode || !diffResult)
      return new Map<string, { added: number; modified: number; removed: number }>();
    const counts = new Map<string, { added: number; modified: number; removed: number }>();

    for (const j of diffResult.journeys.added) {
      const prev = counts.get(j.domain) ?? { added: 0, modified: 0, removed: 0 };
      counts.set(j.domain, { ...prev, added: prev.added + 1 });
    }
    for (const m of diffResult.journeys.modified) {
      const domain = m.head.domain;
      const prev = counts.get(domain) ?? { added: 0, modified: 0, removed: 0 };
      counts.set(domain, { ...prev, modified: prev.modified + 1 });
    }
    for (const j of diffResult.journeys.removed) {
      const prev = counts.get(j.domain) ?? { added: 0, modified: 0, removed: 0 };
      counts.set(j.domain, { ...prev, removed: prev.removed + 1 });
    }

    return counts;
  }, [isDiffMode, diffResult]);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Journeys"
        metrics={[
          { value: domains.length, label: 'domains' },
          { value: domains.reduce((s, d) => s + d.journeyCount, 0), label: 'journeys' },
        ]}
      />

      <div className={styles.grid}>
        {domains
          .filter((d) => {
            if (!isDiffMode) return true;
            return domainDiffCounts.has(d.slug);
          })
          .map((d, i) => {
            const dc = isDiffMode ? domainDiffCounts.get(d.slug) : undefined;
            return (
              <Link
                key={d.slug}
                href={branchHref(`/journeys/${d.slug}`)}
                className={styles.card}
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'translateY(0)' : 'translateY(8px)',
                  transition: `opacity 300ms ease-out ${i * 50}ms, transform 300ms ease-out ${i * 50}ms, border-color 200ms ease-out, box-shadow 200ms ease-out`,
                }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardName}>{d.label}</span>
                  <span className={styles.cardCount}>{d.journeyCount}</span>
                </div>
                {dc && (dc.added > 0 || dc.modified > 0 || dc.removed > 0) && (
                  <div className={styles.diffBadges}>
                    {dc.added > 0 && (
                      <span className={styles.diffPill} data-status="added">
                        New ({dc.added})
                      </span>
                    )}
                    {dc.modified > 0 && (
                      <span className={styles.diffPill} data-status="modified">
                        Modified ({dc.modified})
                      </span>
                    )}
                    {dc.removed > 0 && (
                      <span className={styles.diffPill} data-status="removed">
                        Removed ({dc.removed})
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.cardDesc}>{d.description}</div>
                <div className={styles.cardStats}>
                  <div className={styles.statGroup}>
                    <span>{d.stepCount} steps</span>
                    <span>{d.decisionCount} decisions</span>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
