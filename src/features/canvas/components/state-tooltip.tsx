'use client';

import type { Lifecycle, LifecycleState } from '@/types/lifecycle';
import { DEFAULT_STATE_COLOR } from '@/types/lifecycle';
import type { DiffStatus } from '@/types/diff';
import { GitHubLink } from '@/components/data-display/github-link';
import { DiffTooltipSection } from './diff-tooltip-section';
import type { NodeChange } from '../hooks/use-diff-nodes';
import { LIFECYCLE_NODE_WIDTH } from '../utils/geometry';
import { TT_BG, TT_BORDER, TT_SHADOW, sectionLabel } from '../constants/tooltip-styles';

interface StateTooltipProps {
  state: LifecycleState;
  lifecycle: Lifecycle;
  diffStatus?: DiffStatus | null;
  diffChanges?: NodeChange[];
  diffOnly?: boolean;
  activeBranchLabel?: string;
  compareBranchLabel?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function StateTooltip({
  state,
  lifecycle,
  diffStatus,
  diffChanges,
  diffOnly,
  activeBranchLabel,
  compareBranchLabel,
  onMouseEnter,
  onMouseLeave,
}: StateTooltipProps) {
  const color = state.color ?? DEFAULT_STATE_COLOR;
  const incoming = lifecycle.transitions.filter((t) => t.to === state.id);
  const outgoing = lifecycle.transitions.filter((t) => t.from === state.id);
  const isTerminal = outgoing.length === 0;

  return (
    <foreignObject
      x={state.x}
      y={state.y - 8}
      width={320}
      height={1}
      overflow="visible"
      style={{ pointerEvents: 'auto' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: LIFECYCLE_NODE_WIDTH / 2 - 140,
          width: 280,
          animation: 'tooltip-in 120ms ease-out',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: '12px 14px',
            background: TT_BG,
            border: `1px solid ${TT_BORDER}`,
            borderRadius: '8px',
            backdropFilter: 'blur(12px)',
            boxShadow: TT_SHADOW,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Header */}
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color,
                lineHeight: '1.4',
                marginBottom: '5px',
              }}
            >
              {state.label}
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  background: `${color}1a`,
                  color,
                }}
              >
                {lifecycle.name}
              </span>
              {lifecycle.source && (
                <span
                  style={{
                    fontSize: '9px',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#9a9790',
                  }}
                >
                  {lifecycle.source}
                </span>
              )}
              {isTerminal && (
                <span
                  style={{
                    fontSize: '9px',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    background: 'rgba(220,60,60,0.1)',
                    color: '#e05555',
                  }}
                >
                  terminal
                </span>
              )}
            </div>
          </div>

          {/* Diff changes */}
          {diffStatus && diffStatus !== 'unchanged' && (
            <DiffTooltipSection
              status={diffStatus}
              changes={diffChanges}
              activeBranchLabel={activeBranchLabel}
              compareBranchLabel={compareBranchLabel}
            />
          )}

          {/* Normal content — hidden in diff-only mode */}
          {diffOnly ? null : (
            <>
              {/* Description */}
              {lifecycle.why && (
                <div>
                  <div style={sectionLabel}>Purpose</div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#9a9790',
                      lineHeight: '1.5',
                      borderLeft: `2px solid ${color}`,
                      paddingLeft: '8px',
                    }}
                  >
                    {lifecycle.why}
                  </div>
                </div>
              )}

              {/* Source file */}
              {lifecycle.sourceFile && (
                <div>
                  <div style={sectionLabel}>Source</div>
                  <GitHubLink filePath={lifecycle.sourceFile} />
                </div>
              )}

              {/* Incoming transitions */}
              {incoming.length > 0 && (
                <div>
                  <div style={sectionLabel}>How you get here</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {incoming.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-family-mono)',
                          display: 'flex',
                          gap: '6px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <span style={{ color: '#6a6860' }}>{t.from}</span>
                        <span style={{ color: '#4a4840' }}>→</span>
                        <span style={{ color: '#9a9790' }}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outgoing transitions */}
              {outgoing.length > 0 && (
                <div>
                  <div style={sectionLabel}>Where it goes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {outgoing.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-family-mono)',
                          display: 'flex',
                          gap: '6px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <span style={{ color: '#9a9790' }}>{t.label}</span>
                        <span style={{ color: '#4a4840' }}>→</span>
                        <span style={{ color: '#6a6860' }}>{t.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terminal indicator */}
              {isTerminal && (
                <div
                  style={{
                    fontSize: '10px',
                    color: '#6a6860',
                    fontStyle: 'italic',
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '4px',
                  }}
                >
                  Terminal state — no outgoing transitions
                </div>
              )}
            </>
          )}

          {/* Down arrow */}
          <svg
            width="14"
            height="7"
            viewBox="0 0 14 7"
            style={{
              position: 'absolute',
              bottom: -7,
              left: '50%',
              marginLeft: -7,
              display: 'block',
            }}
          >
            <path
              d="M0,0 L6,6 Q7,7 8,6 L14,0"
              fill={TT_BG}
              stroke={TT_BORDER}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <rect x="0" y="0" width="14" height="1" fill={TT_BG} />
          </svg>
        </div>
      </div>
    </foreignObject>
  );
}
