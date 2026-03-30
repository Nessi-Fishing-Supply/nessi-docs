'use client';

import Link from 'next/link';
import type { Feature } from '@/types/feature';
import { useDocsContext } from '@/providers/docs-provider';
import { PageHeader } from '@/components/ui/page-header';
import styles from './feature-list.module.scss';

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

  const totalComponents = features.reduce((sum, f) => sum + f.componentCount, 0);
  const totalEndpoints = features.reduce((sum, f) => sum + f.endpointCount, 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Features"
        metrics={[
          { value: features.length, label: 'features' },
          { value: totalComponents, label: 'components' },
          { value: totalEndpoints, label: 'endpoints' },
        ]}
      />

      <div className={styles.cards}>
        {features.map((feature) => (
          <button
            key={feature.slug}
            className={styles.card}
            onClick={() => setSelectedItem({ type: 'feature', feature })}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardName}>{feature.name}</span>
            </div>

            <p className={styles.cardDesc}>{feature.description}</p>

            <div className={styles.metaRow}>
              {feature.componentCount > 0 && (
                <span className={styles.metaBadge}>{feature.componentCount} components</span>
              )}
              {feature.endpointCount > 0 && (
                <span className={styles.metaBadge}>{feature.endpointCount} endpoints</span>
              )}
              {feature.journeyCoverage && <span className={styles.journeyBadge}>has journey</span>}
            </div>

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
  );
}
