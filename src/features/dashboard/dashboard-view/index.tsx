'use client';

import Link from 'next/link';
import type { FeatureDomain, DashboardMetrics } from '@/types/dashboard';
import type { ChangelogEntry } from '@/types/changelog';
import { CHANGE_TYPE_CONFIG } from '@/types/changelog';
import { useBranchHref } from '@/hooks/use-branch-href';
import { formatDate } from '@/constants/dates';
import styles from './dashboard-view.module.scss';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  domains: FeatureDomain[];
  recentChanges: ChangelogEntry[];
}

export function DashboardView({ metrics, domains, recentChanges }: DashboardViewProps) {
  const branchHref = useBranchHref();
  const flatChanges = recentChanges
    .flatMap((entry) => (entry.changes ?? []).map((c) => ({ ...c, date: entry.date })))
    .slice(0, 8);

  return (
    <div className={styles.container}>
      {/* ── Hero: Metrics + Changelog ── */}
      <div className={styles.hero}>
        {/* Left — Metrics */}
        <div className={styles.metricsCard}>
          <div className={styles.metricsLabel}>System Overview</div>

          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue} style={{ color: '#3d8c75' }}>
                {metrics.totalFeatures}
              </span>
              <span className={styles.metricLabel}>Features</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue} style={{ color: '#3d8c75' }}>
                {metrics.totalJourneys}
              </span>
              <span className={styles.metricLabel}>Journeys</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue} style={{ color: '#e27739' }}>
                {metrics.totalEndpoints}
              </span>
              <span className={styles.metricLabel}>Endpoints</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue} style={{ color: '#9b7bd4' }}>
                {metrics.totalEntities}
              </span>
              <span className={styles.metricLabel}>Entities</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue} style={{ color: '#d4923a' }}>
                {metrics.totalLifecycles}
              </span>
              <span className={styles.metricLabel}>Lifecycles</span>
            </div>
          </div>
        </div>

        {/* Right — Changelog */}
        <div className={styles.changelogCard}>
          <div className={styles.changelogHeader}>
            <span className={styles.changelogLabel}>Recent Changes</span>
            <Link href={branchHref('/changelog')} className={styles.viewAll}>
              View all &rarr;
            </Link>
          </div>

          <ul className={styles.changeList}>
            {flatChanges.map((change, i) => {
              const config = CHANGE_TYPE_CONFIG[change.type];
              return (
                <li key={i} className={styles.changeItem}>
                  <span
                    className={styles.changeBadge}
                    style={{ color: config.color, borderColor: config.color }}
                  >
                    {config.label}
                  </span>
                  <span className={styles.changeDesc}>{change.description}</span>
                  {change.date && (
                    <span className={styles.changeDate}>{formatDate(change.date)}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Domain Grid ── */}
      <div className={styles.domainSection}>
        <span className={styles.domainLabel}>Feature Domains</span>
        <div className={styles.domainGrid}>
          {domains.map((d) => (
            <Link
              key={d.slug}
              href={branchHref(`/features/${d.slug}`)}
              className={styles.domainCard}
            >
              <div className={styles.domainCardHeader}>
                <span className={styles.domainCardName}>{d.label}</span>
                <span className={styles.domainCardCount}>{d.featureCount}</span>
              </div>
              <div className={styles.domainCardDesc}>{d.description}</div>
              <div className={styles.domainCardStats}>
                <span>{d.featureCount} features</span>
                <span>{d.endpointCount} endpoints</span>
                {d.journeyCount > 0 && <span>{d.journeyCount} journeys</span>}
                {d.entityCount > 0 && <span>{d.entityCount} entities</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
