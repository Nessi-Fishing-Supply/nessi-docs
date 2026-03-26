import { hexToRgba } from '../utils/geometry';

const LAYERS: { label: string; color: string }[] = [
  { label: 'Start', color: '#3ba8d4' },
  { label: 'Client', color: '#3d8c75' },
  { label: 'Server', color: '#e27739' },
  { label: 'Database', color: '#8b5cf6' },
  { label: 'Background', color: '#6b7280' },
  { label: 'Email', color: '#ec4899' },
  { label: 'External', color: '#f59e0b' },
];

const STATUSES: { label: string; color: string }[] = [
  { label: 'Planned', color: '#5c5a55' },
  { label: 'Built', color: '#3d8c75' },
  { label: 'Tested', color: '#1a6b43' },
];

const NODES: { label: string; color: string; shape: string }[] = [
  { label: 'Start / Entry', color: '#3ba8d4', shape: 'pill' },
  { label: 'Step', color: '#3d8c75', shape: 'rect' },
  { label: 'Decision', color: '#a78bfa', shape: 'diamond' },
];

interface LegendProps {
  visible: boolean;
}

export function Legend({ visible }: LegendProps) {
  if (!visible) return null;

  const sectionLabel: React.CSSProperties = {
    fontSize: 9,
    color: '#6a6860',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  };

  const row: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 10,
    color: '#9a9790',
    marginBottom: 4,
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        background: 'rgba(15,19,25,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        backdropFilter: 'blur(8px)',
        padding: '12px 16px',
        display: 'flex',
        gap: 20,
        zIndex: 5,
        animation: 'tooltip-in 150ms ease-out',
      }}
    >
      {/* Node Types */}
      <div>
        <div style={sectionLabel}>Node Types</div>
        {NODES.map((n) => (
          <div key={n.label} style={row}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              {n.shape === 'pill' && (
                <rect x="1" y="3" width="12" height="8" rx="4" fill={hexToRgba(n.color, 0.2)} stroke={hexToRgba(n.color, 0.5)} strokeWidth="0.8" />
              )}
              {n.shape === 'rect' && (
                <>
                  <rect x="1" y="2" width="12" height="10" rx="2" fill={hexToRgba(n.color, 0.15)} stroke={hexToRgba(n.color, 0.4)} strokeWidth="0.8" />
                  <rect x="1" y="4" width="2" height="6" rx="0.5" fill={n.color} />
                </>
              )}
              {n.shape === 'diamond' && (
                <g transform="translate(7,7) rotate(45)">
                  <rect x="-4" y="-4" width="8" height="8" rx="1" fill={hexToRgba(n.color, 0.2)} stroke={hexToRgba(n.color, 0.5)} strokeWidth="0.8" />
                </g>
              )}
            </svg>
            <span>{n.label}</span>
          </div>
        ))}
      </div>

      {/* Layers */}
      <div>
        <div style={sectionLabel}>Layers</div>
        {LAYERS.map((l) => (
          <div key={l.label} style={row}>
            <div style={{ width: 3, height: 10, borderRadius: 1, background: l.color, flexShrink: 0 }} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Status */}
      <div>
        <div style={sectionLabel}>Status</div>
        {STATUSES.map((s) => (
          <div key={s.label} style={row}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
