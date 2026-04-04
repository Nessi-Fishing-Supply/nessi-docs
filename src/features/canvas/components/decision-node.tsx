'use client';

import { useState, memo } from 'react';
import type { DecisionOption } from '@/features/journeys';
import { DECISION_SIZE, hexToRgba } from '../utils/geometry';
import type { DiffStatus } from '@/types/diff';
import { useNodeState } from '../hooks/use-node-state';
import { NodeGlow } from './node-glow';

const DECISION_COLOR = '#a78bfa';

/** Clean snake_case/SCREAMING_CASE into title case: "email_not_confirmed" → "Email Not Confirmed" */
function humanize(text: string): string {
  if (text.includes('_')) {
    return text
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return text;
}

/** Split "No — empty state: 'Add your first address'" into { short: "No", detail: "empty state: ..." } */
function parseOptionLabel(label: string): { short: string; detail?: string } {
  const sep = label.indexOf(' — ');
  if (sep !== -1) {
    return { short: humanize(label.slice(0, sep).trim()), detail: label.slice(sep + 3).trim() };
  }
  return { short: humanize(label) };
}

interface DecisionNodeProps {
  x: number;
  y: number;
  label: string;
  options: DecisionOption[];
  chosenOpt?: string;
  isDimmed?: boolean;
  diffStatus?: DiffStatus | null;
  onChoose?: (opt: string, targetId: string) => void;
}

export const DecisionNode = memo(function DecisionNode({
  x,
  y,
  label,
  options,
  chosenOpt,
  isDimmed,
  diffStatus,
  onChoose,
}: DecisionNodeProps) {
  const [hoveredPill, setHoveredPill] = useState<string | null>(null);
  const cx = x + DECISION_SIZE / 2;
  const cy = y + DECISION_SIZE / 2;

  const { containerStyle, isGhost, isDiffChanged, diffColor, isInteractive } = useNodeState({
    diffStatus,
    isDimmed,
  });

  const showDiffGlow = isDiffChanged;

  const parsedOptions = options.map((opt) => ({
    ...opt,
    ...parseOptionLabel(opt.label),
  }));

  // Measure pill width from short label
  const pillW = Math.max(DECISION_SIZE + 10, ...parsedOptions.map((o) => o.short.length * 7 + 24));

  // Outer ring radius: slightly larger than the diamond's half-diagonal
  const diamondHalf = (DECISION_SIZE - 12) / 2;
  const ringRadius = Math.round(diamondHalf * Math.SQRT2 + 6);

  return (
    <g style={containerStyle}>
      {/* Outer diff ring — circle outline around the diamond, only for added/modified */}
      {diffColor && (
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius}
          fill="none"
          stroke={diffColor}
          strokeWidth={1.5}
          strokeOpacity={0.7}
        />
      )}
      {/* Diff glow — centered on diamond */}
      {showDiffGlow && diffColor && (
        <NodeGlow
          id={`${x}-${y}`}
          type="diff"
          color={diffColor}
          cx={cx}
          cy={cy}
          rx={DECISION_SIZE * 0.55}
        />
      )}
      {/* Diamond — no hover, not interactive (pills below are the actions) */}
      <g transform={`translate(${cx},${cy}) rotate(45)`} style={{ cursor: 'default' }}>
        <rect
          x={-DECISION_SIZE / 2 + 6}
          y={-DECISION_SIZE / 2 + 6}
          width={DECISION_SIZE - 12}
          height={DECISION_SIZE - 12}
          rx={4}
          fill={hexToRgba(DECISION_COLOR, 0.12)}
          stroke={hexToRgba(DECISION_COLOR, 0.35)}
          strokeWidth={1}
          strokeDasharray={isGhost ? '4 3' : undefined}
        />
      </g>

      {/* ? mark */}
      <text
        x={cx}
        y={cy + 4}
        fill={DECISION_COLOR}
        fontSize={14}
        fontWeight={700}
        textAnchor="middle"
      >
        ?
      </text>

      {/* Label above */}
      <text x={cx} y={y - 6} fill="#9a9790" fontSize={9} textAnchor="middle">
        {label}
      </text>

      {/* Option pills — short labels only */}
      {parsedOptions.map((opt, i) => {
        const py = y + DECISION_SIZE + 8 + i * 26;
        const isChosen = chosenOpt === opt.label;
        const pillOpacity = chosenOpt && !isChosen ? 0.35 : 1;
        const isHovPill = hoveredPill === opt.label;

        return (
          <g
            key={opt.label}
            transform={`translate(${cx - pillW / 2},${py})`}
            onClick={isInteractive ? () => onChoose?.(opt.label, opt.to) : undefined}
            onMouseEnter={isInteractive ? () => setHoveredPill(opt.label) : undefined}
            onMouseLeave={isInteractive ? () => setHoveredPill(null) : undefined}
            style={{ cursor: isInteractive ? 'pointer' : 'default', opacity: pillOpacity }}
          >
            <rect
              width={pillW}
              height={20}
              rx={10}
              fill={hexToRgba(DECISION_COLOR, isChosen ? 0.2 : isHovPill ? 0.14 : 0.08)}
              stroke={hexToRgba(DECISION_COLOR, isChosen ? 0.5 : isHovPill ? 0.35 : 0.2)}
              strokeWidth={0.8}
            />
            <text
              x={pillW / 2}
              y={13}
              fill={isChosen ? '#e8e6e1' : '#9a9790'}
              fontSize={10}
              fontWeight={isChosen ? 500 : 400}
              textAnchor="middle"
            >
              {opt.short}
            </text>

            {/* Detail tooltip on pill hover */}
            {isHovPill && opt.detail && (
              <foreignObject
                x={pillW + 12}
                y={-10}
                width={230}
                height={1}
                overflow="visible"
                style={{ pointerEvents: 'none' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    display: 'flex',
                    alignItems: 'center',
                    animation: 'tooltip-in 120ms ease-out',
                  }}
                >
                  {/* Left arrow — overlaps tooltip border by 2px to hide seam */}
                  <svg
                    width="7"
                    height="14"
                    viewBox="0 0 7 14"
                    style={{
                      display: 'block',
                      flexShrink: 0,
                      marginRight: -3,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <path
                      d="M7,0 L1,6 Q0,7 1,8 L7,14"
                      fill="rgba(15,19,25,0.97)"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                    <rect x="5" y="0" width="3" height="14" fill="rgba(15,19,25,0.97)" />
                  </svg>
                  <div
                    style={{
                      position: 'relative',
                      maxWidth: 200,
                      padding: '6px 10px',
                      background: 'rgba(15,19,25,0.97)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.3)',
                      fontSize: '10px',
                      color: '#b0ada8',
                      lineHeight: '1.4',
                    }}
                  >
                    {opt.detail}
                  </div>
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </g>
  );
});
