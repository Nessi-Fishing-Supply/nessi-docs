import type { Journey } from '@/types/journey';
import { PERSONA_CONFIG, STATUS_CONFIG } from '@/types/journey';

interface CoveragePanelProps {
  journey: Journey;
}

export function CoveragePanel({ journey }: CoveragePanelProps) {
  const steps = journey.nodes.filter((n) => n.type === 'step');
  const total = steps.length;
  const built = steps.filter((s) => s.status === 'built' || s.status === 'tested').length;
  const tested = steps.filter((s) => s.status === 'tested').length;
  const builtPct = total > 0 ? Math.round((built / total) * 100) : 0;
  const testedPct = total > 0 ? Math.round((tested / total) * 100) : 0;
  const planned = steps.filter((s) => s.status === 'planned');
  const builtUntested = steps.filter((s) => s.status === 'built');
  const personaCfg = PERSONA_CONFIG[journey.persona];

  return (
    <div>
      <h3
        style={{
          fontFamily: 'var(--font-dm-serif)',
          fontSize: '16px',
          color: 'var(--text-primary)',
          margin: '0 0 4px',
        }}
      >
        {journey.title}
      </h3>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '10px',
            background: `${personaCfg.color}1a`,
            color: personaCfg.color,
          }}
        >
          {personaCfg.label}
        </span>
      </div>

      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginBottom: '16px',
          lineHeight: '1.5',
        }}
      >
        {journey.description}
      </div>

      {/* Built progress */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            marginBottom: '4px',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Built</span>
          <span style={{ color: STATUS_CONFIG.built.color }}>
            {builtPct}% ({built}/{total})
          </span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'var(--bg-raised)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${builtPct}%`,
              background: STATUS_CONFIG.built.color,
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {/* Tested progress */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            marginBottom: '4px',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Tested</span>
          <span style={{ color: STATUS_CONFIG.tested.color }}>
            {testedPct}% ({tested}/{total})
          </span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'var(--bg-raised)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${testedPct}%`,
              background: STATUS_CONFIG.tested.color,
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {planned.length > 0 && (
        <>
          <div
            style={{
              fontSize: '9px',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              marginBottom: '4px',
            }}
          >
            Not Yet Built ({planned.length})
          </div>
          {planned.map((s) => (
            <div
              key={s.id}
              style={{
                fontSize: '10px',
                color: '#b84040',
                padding: '3px 8px',
                background: 'rgba(184,64,64,0.06)',
                borderRadius: '3px',
                marginBottom: '2px',
              }}
            >
              {s.label}
            </div>
          ))}
        </>
      )}

      {builtUntested.length > 0 && (
        <>
          <div
            style={{
              fontSize: '9px',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              marginTop: '12px',
              marginBottom: '4px',
            }}
          >
            Built but Untested ({builtUntested.length})
          </div>
          {builtUntested.map((s) => (
            <div
              key={s.id}
              style={{
                fontSize: '10px',
                color: '#e27739',
                padding: '3px 8px',
                background: 'rgba(226,119,57,0.06)',
                borderRadius: '3px',
                marginBottom: '2px',
              }}
            >
              {s.label}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
