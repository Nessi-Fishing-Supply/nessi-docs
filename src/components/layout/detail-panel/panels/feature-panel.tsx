import type { Feature } from '@/features/feature-domain';
import { CrossLink } from '@/components/data-display';
import styles from './panel-content.module.scss';

export function FeaturePanel({ feature }: { feature: Feature }) {
  return (
    <div>
      <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 8px' }}>
        {feature.name}
      </h3>

      <p className={styles.descriptionMuted}>{feature.description}</p>

      <div className={styles.statRow}>
        {feature.componentCount > 0 && <span>{feature.componentCount} components</span>}
        {feature.endpointCount > 0 && <span>{feature.endpointCount} endpoints</span>}
      </div>

      {(feature.links?.length ?? 0) > 0 && (
        <div className={styles.linkList}>
          {(feature.links ?? []).map((link, i) => (
            <CrossLink key={i} href={link.href}>
              {link.label}
            </CrossLink>
          ))}
        </div>
      )}
    </div>
  );
}
