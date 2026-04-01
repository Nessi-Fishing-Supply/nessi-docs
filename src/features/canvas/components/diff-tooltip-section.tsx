import type { DiffStatus } from '@/types/diff';
import type { NodeChange } from '../hooks/use-diff-nodes';
import { sectionLabel } from '../constants/tooltip-styles';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  added: { label: 'Added', color: '#3d8c75', bg: 'rgba(61,140,117,0.12)' },
  modified: { label: 'Modified', color: '#7b8fcd', bg: 'rgba(123,143,205,0.12)' },
  removed: { label: 'Removed', color: '#b84040', bg: 'rgba(184,64,64,0.12)' },
};

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return '(none)';
  if (typeof val === 'string') return val.length > 40 ? val.slice(0, 37) + '...' : val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return `[${val.length} items]`;
  return JSON.stringify(val).slice(0, 40);
}

interface DiffTooltipSectionProps {
  status: DiffStatus;
  changes?: NodeChange[];
  branchLabel?: string;
}

export function DiffTooltipSection({ status, changes, branchLabel }: DiffTooltipSectionProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

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
          marginBottom: changes && changes.length > 0 ? 6 : 0,
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
        {status === 'added' && branchLabel && (
          <span style={{ fontWeight: 400, opacity: 0.7 }}> on {branchLabel}</span>
        )}
      </div>

      {/* Field changes for modified nodes */}
      {changes && changes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {changes.map((c) => (
            <div
              key={c.field}
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-family-mono)',
                display: 'flex',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'rgba(123,143,205,0.06)',
              }}
            >
              <span style={{ color: '#7b8fcd', minWidth: 60 }}>{c.field}</span>
              <span style={{ color: '#6a6860' }}>{formatValue(c.from)}</span>
              <span style={{ color: '#4a4840' }}>→</span>
              <span style={{ color: '#9a9790' }}>{formatValue(c.to)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
