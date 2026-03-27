'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Journey } from '@/types/journey';
import { PERSONA_CONFIG } from '@/types/journey';
import type { DomainConfig } from '@/constants/domains';
import { Breadcrumb } from '@/components/ui';
import styles from './domain-journey-list.module.scss';

interface DomainJourneyListProps {
  domain: DomainConfig;
  journeys: Journey[];
  stats: { stepCount: number; builtPercent: number };
  siblingDomains?: { slug: string; label: string }[];
}

function coverageColor(percent: number): string {
  if (percent >= 75) return 'rgba(61,140,117,0.7)';
  if (percent >= 50) return 'rgba(226,119,57,0.7)';
  return 'rgba(106,104,96,0.5)';
}

function journeyCoverage(journey: Journey): number {
  const steps = journey.nodes.filter((n) => n.type === 'step');
  const built = steps.filter((s) => s.status === 'built' || s.status === 'tested').length;
  return steps.length > 0 ? Math.round((built / steps.length) * 100) : 0;
}

export function DomainJourneyList({ domain, journeys, stats, siblingDomains }: DomainJourneyListProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  return (
    <div className={styles.container}>
      <Breadcrumb
        segments={[
          { label: 'Journeys', href: '/journeys' },
          { label: domain.label },
        ]}
        switcher={siblingDomains?.map((d) => ({
          label: d.label,
          href: `/journeys/${d.slug}`,
          active: d.slug === domain.slug,
        }))}
      />

      <div className={styles.domainHeader}>
        <div className={styles.domainTitle}>{domain.label}</div>
        <div className={styles.domainDesc}>{domain.description}</div>
        <div className={styles.domainStats}>
          <span>{journeys.length} journeys</span>
          <span>{stats.stepCount} steps</span>
          <span style={{ color: coverageColor(stats.builtPercent) }}>{stats.builtPercent}% built</span>
        </div>
      </div>

      <div className={styles.list}>
        {journeys.map((j, i) => {
          const persona = PERSONA_CONFIG[j.persona];
          const stepCount = j.nodes.filter((n) => n.type === 'step').length;
          const coverage = journeyCoverage(j);

          return (
            <Link
              key={j.slug}
              href={`/journeys/${domain.slug}/${j.slug}`}
              className={styles.row}
              style={{
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateY(0)' : 'translateY(4px)',
                transition: `opacity 200ms ease-out ${i * 30}ms, transform 200ms ease-out ${i * 30}ms, background 150ms ease-out`,
              }}
            >
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>{j.title}</div>
                <div className={styles.rowDesc}>{j.description}</div>
              </div>
              <span
                className={styles.personaBadge}
                style={{ background: `${persona.color}25`, color: persona.color }}
              >
                {persona.label}
              </span>
              <span className={styles.stepCount}>{stepCount} steps</span>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: entered ? `${coverage}%` : '0%',
                    background: coverageColor(coverage),
                    transitionDelay: `${i * 30 + 200}ms`,
                  }}
                />
              </div>
              <span className={styles.chevron}>&rsaquo;</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
