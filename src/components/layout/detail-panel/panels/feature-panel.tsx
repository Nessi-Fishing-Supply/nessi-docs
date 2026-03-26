import Link from 'next/link';
import type { Feature } from '@/types/feature';
import { STATUS_COLORS } from '@/types/feature';

export function FeaturePanel({ feature }: { feature: Feature }) {
  return (
    <div style={{ padding: '16px' }}>
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
            fontSize: '9px',
            fontFamily: 'var(--font-family-mono)',
            color: STATUS_COLORS[feature.status],
            textTransform: 'uppercase',
          }}
        >
          {feature.status}
        </span>
      </div>
      <p
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          margin: '0 0 12px',
        }}
      >
        {feature.description}
      </p>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          fontSize: '10px',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-family-mono)',
          marginBottom: '12px',
        }}
      >
        {feature.componentCount > 0 && <span>{feature.componentCount} components</span>}
        {feature.endpointCount > 0 && <span>{feature.endpointCount} endpoints</span>}
      </div>
      {(feature.links?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {(feature.links ?? []).map((link, i) => (
            <Link
              key={i}
              href={link.href}
              style={{ fontSize: '11px', color: '#3d8c75', textDecoration: 'none' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
