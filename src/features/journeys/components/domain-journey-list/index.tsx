'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Journey } from '../../types/journey';
import { PERSONA_CONFIG } from '../../types/journey';
import type { DomainConfig } from '@/constants/domains';
import { useBranchHref } from '@/hooks/use-branch-href';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import styles from './domain-journey-list.module.scss';

interface DomainJourneyListProps {
  domain: DomainConfig;
  journeys: Journey[];
  stats: { stepCount: number };
  siblingDomains?: { slug: string; label: string }[];
}

export function DomainJourneyList({
  domain,
  journeys,
  stats,
  siblingDomains,
}: DomainJourneyListProps) {
  const branchHref = useBranchHref();
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  return (
    <div className={styles.container}>
      <Breadcrumb
        segments={[{ label: 'Journeys', href: branchHref('/journeys') }, { label: domain.label }]}
        switcher={siblingDomains?.map((d) => ({
          label: d.label,
          href: branchHref(`/journeys/${d.slug}`),
          active: d.slug === domain.slug,
        }))}
      />

      <div className={styles.domainHeader}>
        <div className={styles.domainTitle}>{domain.label}</div>
        <div className={styles.domainDesc}>{domain.description}</div>
        <div className={styles.domainStats}>
          <span>{journeys.length} journeys</span>
          <span>{stats.stepCount} steps</span>
        </div>
      </div>

      <div className={styles.list}>
        {journeys.map((j, i) => {
          const persona = PERSONA_CONFIG[j.persona];
          const stepCount = j.nodes.filter((n) => n.type === 'step').length;

          return (
            <Link
              key={j.slug}
              href={branchHref(`/journeys/${domain.slug}/${j.slug}`)}
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
              <span className={styles.chevron}>&rsaquo;</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
