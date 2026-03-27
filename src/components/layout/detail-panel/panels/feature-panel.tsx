import type { Feature } from '@/types/feature';
import { STATUS_COLORS } from '@/types/feature';
import { CrossLink } from '@/components/ui';
import styles from './panel-content.module.scss';

export function FeaturePanel({ feature }: { feature: Feature }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
          {feature.name}
        </h3>
        <span
          style={{
            fontSize: 'var(--font-size-100)',
            fontFamily: 'var(--font-family-mono)',
            color: STATUS_COLORS[feature.status],
            textTransform: 'uppercase',
          }}
        >
          {feature.status}
        </span>
      </div>

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
