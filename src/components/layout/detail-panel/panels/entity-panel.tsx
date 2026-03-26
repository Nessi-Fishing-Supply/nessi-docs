import type { Entity } from '@/types/data-model';

interface EntityPanelProps {
  entity: Entity;
}

export function EntityPanel({ entity }: EntityPanelProps) {
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-family-mono)', fontSize: '14px', color: '#3d8c75', margin: '0 0 4px' }}>
        {entity.name}
      </h3>
      <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'var(--bg-raised)', color: 'var(--text-dim)' }}>
        {entity.badge}
      </span>

      {entity.why && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '12px', marginBottom: '4px' }}>
            Why this exists
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', padding: '8px 10px', background: 'rgba(61,140,117,0.05)', borderLeft: '2px solid #3d8c75', borderRadius: '4px' }}>
            {entity.why}
          </div>
        </>
      )}

      <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '16px', marginBottom: '6px' }}>
        Fields ({entity.fields.length})
      </div>

      <div style={{ fontSize: '10px', overflow: 'auto' }}>
        {entity.fields.map((f) => (
          <div key={f.name} style={{ display: 'flex', gap: '8px', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ width: '100px', flexShrink: 0, color: '#e8e6e1', fontFamily: 'var(--font-family-mono)', fontSize: '10px' }}>{f.name}</span>
            <span style={{ width: '80px', flexShrink: 0, color: 'var(--text-dim)', fontFamily: 'var(--font-family-mono)', fontSize: '9px' }}>{f.type}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px', flex: 1 }}>{f.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
