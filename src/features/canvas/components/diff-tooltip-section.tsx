import type { DiffStatus } from '@/types/diff';
import type { NodeChange } from '../hooks/use-diff-nodes';
import { sectionLabel } from '../constants/tooltip-styles';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  added: { label: 'New', color: '#3d8c75', bg: 'rgba(61,140,117,0.12)' },
  modified: { label: 'Modified', color: '#7b8fcd', bg: 'rgba(123,143,205,0.12)' },
  removed: { label: 'Removed', color: '#b84040', bg: 'rgba(184,64,64,0.12)' },
};

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return '(none)';
  if (typeof val === 'string') return val.length > 30 ? val.slice(0, 27) + '...' : val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return `[${val.length} items]`;
  return JSON.stringify(val).slice(0, 30);
}

interface DiffTooltipSectionProps {
  status: DiffStatus;
  changes?: NodeChange[];
  /** Label for the active branch (what you're viewing), e.g. "Production" */
  activeBranchLabel?: string;
  /** Label for the comparison branch (what you're comparing against), e.g. "Staging" */
  compareBranchLabel?: string;
}

export function DiffTooltipSection({
  status,
  changes,
  activeBranchLabel,
  compareBranchLabel,
}: DiffTooltipSectionProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const activeLabel = activeBranchLabel || 'Current';
  const compareLabel = compareBranchLabel || 'Comparison';

  return (
    <div>
      <div style={sectionLabel}>Compare</div>

      {/* Status badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 4,
          background: config.bg,
          color: config.color,
          marginBottom: changes && changes.length > 0 ? 8 : 0,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: config.color,
          }}
        />
        {config.label}
      </div>

      {/* Field changes for modified nodes — side by side with branch labels */}
      {changes && changes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {changes.map((c) => (
            <div
              key={c.field}
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-family-mono)',
                padding: '4px 8px',
                borderRadius: 4,
                background: 'rgba(123,143,205,0.06)',
              }}
            >
              <div style={{ color: '#7b8fcd', marginBottom: 3, fontSize: 9, fontWeight: 600 }}>
                {c.field}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontSize: 8,
                      color: '#6a6860',
                      minWidth: 50,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {compareLabel}
                  </span>
                  <span style={{ color: '#6a6860' }}>{formatValue(c.from)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontSize: 8,
                      color: '#9a9790',
                      minWidth: 50,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {activeLabel}
                  </span>
                  <span style={{ color: '#e8e6e1' }}>{formatValue(c.to)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
