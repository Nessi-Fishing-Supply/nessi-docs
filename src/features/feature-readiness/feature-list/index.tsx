'use client';

import Link from 'next/link';
import type { Feature, FeatureStatus } from '@/types/feature';
import { STATUS_COLORS } from '@/types/feature';
import { useDocsContext } from '@/providers/docs-provider';
import { PageHeader } from '@/components/ui/page-header';
import styles from './feature-list.module.scss';

const STATUS_LABELS: Record<FeatureStatus, string> = {
  built: 'Built',
  'in-progress': 'In Progress',
  stubbed: 'Stubbed',
  planned: 'Planned',
};

const STATUS_ORDER: FeatureStatus[] = ['built', 'in-progress', 'stubbed', 'planned'];

const LINK_TYPE_LABELS: Record<string, string> = {
  journey: 'Journey',
  'api-group': 'API',
  entity: 'Table',
  lifecycle: 'Lifecycle',
};

const LINK_TYPE_COLORS: Record<string, string> = {
  journey: '#3d8c75',
  'api-group': '#e27739',
  entity: '#b86e0a',
  lifecycle: '#78756f',
};

interface FeatureListProps {
  features: Feature[];
}

export function FeatureList({ features }: FeatureListProps) {
  const { setSelectedItem } = useDocsContext();

  const total = features.length;
  const builtCount = features.filter((f) => f.status === 'built').length;
  const totalComponents = features.reduce((sum, f) => sum + f.componentCount, 0);
  const totalEndpoints = features.reduce((sum, f) => sum + f.endpointCount, 0);
  const journeyCoverageCount = features.filter((f) =>
    f.links?.some((l) => l.type === 'journey'),
  ).length;
  const builtPct = total > 0 ? Math.round((builtCount / total) * 100) : 0;

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: features.filter((f) => f.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <PageHeader
        title="Feature Readiness"
        metrics={[
          { value: total, label: 'features' },
          { value: totalComponents, label: 'components' },
          { value: totalEndpoints, label: 'endpoints' },
        ]}
      />

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.progressBar}>
          {STATUS_ORDER.map((status) => {
            const count = features.filter((f) => f.status === status).length;
            const pct = total > 0 ? (count / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={status}
                className={styles.progressSegment}
                style={{ width: `${pct}%`, background: STATUS_COLORS[status] }}
                title={`${STATUS_LABELS[status]}: ${count}`}
              />
            );
          })}
        </div>
        <div className={styles.statsRow}>
          {STATUS_ORDER.map((status) => {
            const count = features.filter((f) => f.status === status).length;
            return (
              <div key={status} className={styles.statItem}>
                <span className={styles.statDot} style={{ background: STATUS_COLORS[status] }} />
                <span className={styles.statLabel}>{STATUS_LABELS[status]}</span>
                <span className={styles.statCount}>{count}</span>
              </div>
            );
          })}
          <div className={styles.statItem}>
            <span className={styles.statPct}>{builtPct}% built</span>
          </div>
        </div>
      </div>

      {/* Groups */}
      {grouped.map(({ status, items }) => (
        <div key={status} className={styles.group}>
          <div className={styles.groupHeader}>
            <span className={styles.groupDot} style={{ background: STATUS_COLORS[status] }} />
            <span className={styles.groupName}>{STATUS_LABELS[status]}</span>
            <span className={styles.groupCount}>{items.length}</span>
          </div>
          <div className={styles.cards}>
            {items.map((feature) => (
              <button
                key={feature.slug}
                className={styles.card}
                onClick={() => setSelectedItem({ type: 'feature', feature })}
              >
                {/* Card header */}
                <div className={styles.cardHeader}>
                  <span className={styles.cardName}>{feature.name}</span>
                  <span
                    className={styles.statusBadge}
                    style={{
                      color: STATUS_COLORS[feature.status],
                      background: `${STATUS_COLORS[feature.status]}18`,
                      borderColor: `${STATUS_COLORS[feature.status]}40`,
                    }}
                  >
                    {STATUS_LABELS[feature.status]}
                  </span>
                </div>

                {/* Description */}
                <p className={styles.cardDesc}>{feature.description}</p>

                {/* Meta row */}
                <div className={styles.metaRow}>
                  {feature.componentCount > 0 && (
                    <span className={styles.metaBadge}>{feature.componentCount} components</span>
                  )}
                  {feature.endpointCount > 0 && (
                    <span className={styles.metaBadge}>{feature.endpointCount} endpoints</span>
                  )}
                  {feature.journeyCoverage && (
                    <span className={styles.journeyBadge}>has journey</span>
                  )}
                </div>

                {/* Cross-links */}
                {(feature.links?.length ?? 0) > 0 && (
                  <div className={styles.links}>
                    {(feature.links ?? []).map((link, i) => (
                      <Link
                        key={i}
                        href={link.href}
                        className={styles.link}
                        style={{ color: LINK_TYPE_COLORS[link.type] }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className={styles.linkType}>{LINK_TYPE_LABELS[link.type]}</span>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
