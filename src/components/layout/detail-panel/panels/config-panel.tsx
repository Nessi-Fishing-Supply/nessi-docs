import type { ConfigEnum } from '@/types/config-ref';

export function ConfigPanel({ configEnum }: { configEnum: ConfigEnum }) {
  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 4px' }}>
        {configEnum.name}
      </h3>
      <p
        style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 8px' }}
      >
        {configEnum.description}
      </p>
      <div
        style={{
          fontSize: '9px',
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '4px',
        }}
      >
        Source
      </div>
      <code
        style={{
          fontSize: '10px',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--text-secondary)',
          background: 'var(--bg-raised)',
          padding: '2px 8px',
          borderRadius: '3px',
          display: 'block',
          marginBottom: '12px',
        }}
      >
        {configEnum.source}
      </code>
      <div
        style={{
          fontSize: '9px',
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '6px',
        }}
      >
        Values ({configEnum.values.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {configEnum.values.map((v) => (
          <div
            key={v.value}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '3px 0',
            }}
          >
            <code
              style={{ fontSize: '10px', fontFamily: 'var(--font-family-mono)', color: '#3d8c75' }}
            >
              {v.value}
            </code>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
