'use client';

import type { Lifecycle, LifecycleState } from '@/features/lifecycles';
import { DEFAULT_STATE_COLOR } from '@/features/lifecycles';
import type { DiffStatus } from '@/features/shared/types/diff';
import { GitHubLink } from '@/components/data-display/github-link';
import { DiffTooltipSection } from './diff-tooltip-section';
import type { NodeChange } from '../hooks/use-diff-nodes';
import { LIFECYCLE_NODE_WIDTH } from '../utils/geometry';
import { CANVAS_COLORS } from '../constants/canvas-colors';
import { TooltipWrapper } from './tooltip-wrapper';
import { TooltipSection } from './tooltip-parts';

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
    <TooltipWrapper
      nodeX={state.x}
      nodeY={state.y}
      nodeWidth={LIFECYCLE_NODE_WIDTH}
      tooltipWidth={280}
      visible={true}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
                background: CANVAS_COLORS.bgSubtle,
                color: CANVAS_COLORS.textSecondary,
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
            <TooltipSection label="Purpose">
              <div
                style={{
                  fontSize: '11px',
                  color: CANVAS_COLORS.textSecondary,
                  lineHeight: '1.5',
                  borderLeft: `2px solid ${color}`,
                  paddingLeft: '8px',
                }}
              >
                {lifecycle.why}
              </div>
            </TooltipSection>
          )}

          {/* Source file */}
          {lifecycle.sourceFile && (
            <TooltipSection label="Source">
              <GitHubLink filePath={lifecycle.sourceFile} />
            </TooltipSection>
          )}

          {/* Incoming transitions */}
          {incoming.length > 0 && (
            <TooltipSection label="How you get here">
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
                      background: CANVAS_COLORS.bgSubtle,
                    }}
                  >
                    <span style={{ color: CANVAS_COLORS.textMuted }}>{t.from}</span>
                    <span style={{ color: CANVAS_COLORS.textDim }}>→</span>
                    <span style={{ color: CANVAS_COLORS.textSecondary }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </TooltipSection>
          )}

          {/* Outgoing transitions */}
          {outgoing.length > 0 && (
            <TooltipSection label="Where it goes">
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
                      background: CANVAS_COLORS.bgSubtle,
                    }}
                  >
                    <span style={{ color: CANVAS_COLORS.textSecondary }}>{t.label}</span>
                    <span style={{ color: CANVAS_COLORS.textDim }}>→</span>
                    <span style={{ color: CANVAS_COLORS.textMuted }}>{t.to}</span>
                  </div>
                ))}
              </div>
            </TooltipSection>
          )}

          {/* Terminal indicator */}
          {isTerminal && (
            <div
              style={{
                fontSize: '10px',
                color: CANVAS_COLORS.textMuted,
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
    </TooltipWrapper>
  );
}
