import { hexToRgba } from '../utils/geometry';
import { DiffLegendSection } from './diff-legend-section';

const STATE_TYPES: { label: string; color: string }[] = [
  { label: 'Active / Complete', color: '#3d8c75' },
  { label: 'Draft / Default', color: '#78756f' },
  { label: 'Pending', color: '#b8860b' },
  { label: 'Reserved', color: '#5f7fbf' },
  { label: 'Expired', color: '#a0522d' },
  { label: 'Deleted / Revoked', color: '#b84040' },
  { label: 'Archived', color: '#6b6966' },
];

interface LifecycleLegendProps {
  visible: boolean;
  isDiffMode?: boolean;
}

export function LifecycleLegend({ visible, isDiffMode }: LifecycleLegendProps) {
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
      {/* State types */}
      <div>
        <div style={sectionLabel}>State Types</div>
        {STATE_TYPES.map((s) => (
          <div key={s.label} style={row}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <rect
                x="1"
                y="2"
                width="12"
                height="10"
                rx="3"
                fill={hexToRgba(s.color, 0.15)}
                stroke={hexToRgba(s.color, 0.4)}
                strokeWidth="0.8"
              />
              <rect x="1" y="4" width="2" height="6" rx="0.5" fill={s.color} />
            </svg>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Transitions */}
      <div>
        <div style={sectionLabel}>Transitions</div>
        <div style={row}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="1" y1="7" x2="13" y2="7" stroke="rgba(154,151,144,0.4)" strokeWidth="1.5" />
            <polygon points="11,5 13,7 11,9" fill="rgba(61,140,117,0.5)" />
          </svg>
          <span>State transition</span>
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
          <span>Action label</span>
        </div>
        {isDiffMode && <DiffLegendSection />}
      </div>
    </div>
  );
}
