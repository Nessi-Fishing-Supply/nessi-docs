'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DomainWithStats } from '@/data';
import { PageHeader } from '@/components/ui/page-header';
import styles from './domain-grid.module.scss';

interface DomainGridProps {
  domains: DomainWithStats[];
}

function coverageColor(percent: number): string {
  if (percent >= 75) return 'rgba(61,140,117,0.7)';
  if (percent >= 50) return 'rgba(226,119,57,0.7)';
  return 'rgba(106,104,96,0.5)';
}

export function DomainGrid({ domains }: DomainGridProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

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
        {domains.map((d, i) => (
          <Link
            key={d.slug}
            href={`/journeys/${d.slug}`}
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
            <div className={styles.cardDesc}>{d.description}</div>
            <div className={styles.cardStats}>
              <div className={styles.statGroup}>
                <span>{d.stepCount} steps</span>
                <span>{d.decisionCount} decisions</span>
              </div>
              <span
                className={styles.coveragePercent}
                style={{ color: coverageColor(d.builtPercent) }}
              >
                {d.builtPercent}%
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{
                  width: entered ? `${d.builtPercent}%` : '0%',
                  background: coverageColor(d.builtPercent),
                  transitionDelay: `${i * 50 + 300}ms`,
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
