import { hexToRgba } from '../utils/geometry';
import { DIFF_COLORS } from '@/features/shared/constants/diff';

const DIFF_ENTRIES = [
  { label: 'New', color: DIFF_COLORS.added },
  { label: 'Modified', color: DIFF_COLORS.modified },
  { label: 'Removed', color: DIFF_COLORS.removed },
  { label: 'Unchanged', color: DIFF_COLORS.unchanged },
];

export function DiffLegendSection() {
  const sectionLabel: React.CSSProperties = {
    fontSize: 9,
    color: '#6a6860',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
    marginTop: 12,
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
    <div>
      <div style={sectionLabel}>Diff</div>
      {DIFF_ENTRIES.map((entry) => (
        <div key={entry.label} style={row}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect
              x="1"
              y="2"
              width="12"
              height="10"
              rx="3"
              fill={hexToRgba(entry.color, 0.15)}
              stroke={hexToRgba(entry.color, 0.4)}
              strokeWidth="0.8"
            />
            <rect x="1" y="4" width="2" height="6" rx="0.5" fill={entry.color} />
          </svg>
          <span>{entry.label}</span>
        </div>
      ))}
    </div>
  );
}
