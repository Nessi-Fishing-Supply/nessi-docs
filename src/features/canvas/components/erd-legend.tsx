import { hexToRgba } from '../utils/geometry';

const CATEGORIES: { label: string; color: string }[] = [
  { label: 'Core', color: '#3d8c75' },
  { label: 'Shop Management', color: '#d4923a' },
  { label: 'Commerce', color: '#e27739' },
  { label: 'Social', color: '#9b7bd4' },
  { label: 'Messaging', color: '#5b9fd6' },
  { label: 'Content & Discovery', color: '#5bbfcf' },
  { label: 'User', color: '#8a8580' },
];

interface ErdLegendProps {
  visible: boolean;
}

export function ErdLegend({ visible }: ErdLegendProps) {
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
      {/* Categories */}
      <div>
        <div style={sectionLabel}>Entity Categories</div>
        {CATEGORIES.map((c) => (
          <div key={c.label} style={row}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <rect
                x="1"
                y="2"
                width="12"
                height="10"
                rx="2"
                fill={hexToRgba(c.color, 0.15)}
                stroke={hexToRgba(c.color, 0.4)}
                strokeWidth="0.8"
              />
              <rect x="1" y="4" width="2" height="6" rx="0.5" fill={c.color} />
            </svg>
            <span>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Connections */}
      <div>
        <div style={sectionLabel}>Connections</div>
        <div style={row}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="1" y1="7" x2="13" y2="7" stroke="rgba(154,151,144,0.4)" strokeWidth="1.5" />
            <polygon points="11,5 13,7 11,9" fill="rgba(61,140,117,0.5)" />
          </svg>
          <span>Foreign key</span>
        </div>
        <div style={row}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect
              x="0"
              y="3"
              width="14"
              height="8"
              rx="4"
              fill="rgba(15,19,25,0.75)"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="0.5"
            />
          </svg>
          <span>FK column name</span>
        </div>
      </div>
    </div>
  );
}
