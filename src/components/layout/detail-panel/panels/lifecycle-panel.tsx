import type { Lifecycle, LifecycleState } from '@/types/lifecycle';

interface LifecyclePanelProps {
  state: LifecycleState;
  lifecycle: Lifecycle;
}

export function LifecyclePanel({ state, lifecycle }: LifecyclePanelProps) {
  const incoming = lifecycle.transitions.filter((t) => t.to === state.id);
  const outgoing = lifecycle.transitions.filter((t) => t.from === state.id);

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 4px' }}>
        {state.label}
      </h3>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: `${state.color}1a`, color: state.color }}>
          {lifecycle.name}
        </span>
        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'var(--bg-raised)', color: 'var(--text-dim)' }}>
          {lifecycle.badge}
        </span>
      </div>

      {incoming.length > 0 && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
            How you get here
          </div>
          {incoming.map((t, i) => (
            <div key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 8px', background: 'var(--bg-raised)', borderRadius: '4px', marginBottom: '3px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.from}</span>
              <span style={{ color: 'var(--text-dim)', margin: '0 6px' }}>→</span>
              <span>{t.label}</span>
            </div>
          ))}
        </>
      )}

      {outgoing.length > 0 && (
        <>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '12px', marginBottom: '4px' }}>
            Where it goes
          </div>
          {outgoing.map((t, i) => (
            <div key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 8px', background: 'var(--bg-raised)', borderRadius: '4px', marginBottom: '3px' }}>
              <span>{t.label}</span>
              <span style={{ color: 'var(--text-dim)', margin: '0 6px' }}>→</span>
              <span style={{ color: 'var(--text-muted)' }}>{t.to}</span>
            </div>
          ))}
        </>
      )}

      {outgoing.length === 0 && (
        <div style={{ fontSize: '11px', color: '#b84040', padding: '8px 10px', background: 'rgba(184,64,64,0.06)', border: '1px solid rgba(184,64,64,0.12)', borderRadius: '4px', marginTop: '12px' }}>
          Terminal state — no outgoing transitions
        </div>
      )}
    </div>
  );
}
