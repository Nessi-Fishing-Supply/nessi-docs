'use client';

import { useState, memo } from 'react';
import { NODE_HEIGHT, hexToRgba } from '../utils/geometry';
import type { DiffStatus } from '@/types/diff';

const ENTRY_COLOR = '#3ba8d4';
import { TT_BG, TT_BORDER, TT_SHADOW } from '../constants/tooltip-styles';

const ENTRY_W = 160;

export interface EntryNodeMeta {
  description?: string;
  persona?: string;
  personaColor?: string;
  stepCount?: number;
  decisionCount?: number;
  errorCount?: number;
}

interface EntryNodeProps {
  x: number;
  y: number;
  label: string;
  isDimmed?: boolean;
  isActive?: boolean;
  diffStatus?: DiffStatus | null;
  meta?: EntryNodeMeta;
  onClick?: () => void;
}

export const EntryNode = memo(function EntryNode({
  x,
  y,
  label,
  isDimmed,
  isActive,
  diffStatus,
  meta,
  onClick,
}: EntryNodeProps) {
  const [hovered, setHovered] = useState(false);
  const h = NODE_HEIGHT;
  const isGhost = diffStatus === 'removed';

  const effectiveColor =
    diffStatus === 'added'
      ? '#3d8c75'
      : diffStatus === 'modified'
        ? '#7b8fcd'
        : diffStatus === 'removed'
          ? '#b84040'
          : ENTRY_COLOR;

  const diffOpacity = isGhost ? 0.4 : diffStatus === 'unchanged' ? 0.6 : 1;
  const opacity = isDimmed ? 0.15 : diffStatus != null ? diffOpacity : 1;

  const showGlow = (hovered || isActive) && !isGhost;
  const showDiffGlow = (diffStatus === 'added' || diffStatus === 'modified') && !isActive;

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={isGhost ? undefined : onClick}
      onMouseEnter={isGhost ? undefined : () => setHovered(true)}
      onMouseLeave={isGhost ? undefined : () => setHovered(false)}
      style={{
        cursor: isGhost ? 'default' : 'pointer',
        opacity,
        transition: 'opacity 400ms ease-out',
        pointerEvents: isGhost ? 'none' : undefined,
      }}
    >
      {/* Diff glow */}
      {showDiffGlow && (
        <>
          <defs>
            <radialGradient id={`entry-diff-${x}-${y}`}>
              <stop offset="0%" stopColor={effectiveColor} stopOpacity={0.12} />
              <stop offset="100%" stopColor={effectiveColor} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse
            cx={ENTRY_W / 2}
            cy={h / 2}
            rx={ENTRY_W * 0.55}
            ry={h * 1.2}
            fill={`url(#entry-diff-${x}-${y})`}
            style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
          />
        </>
      )}
      {/* Hover/active glow */}
      {showGlow && (
        <>
          <defs>
            <radialGradient id={`entry-glow-${x}-${y}`}>
              <stop offset="0%" stopColor={effectiveColor} stopOpacity={isActive ? 0.18 : 0.1} />
              <stop offset="100%" stopColor={effectiveColor} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse
            cx={ENTRY_W / 2}
            cy={h / 2}
            rx={ENTRY_W * 0.55}
            ry={h * 1.2}
            fill={`url(#entry-glow-${x}-${y})`}
            style={isActive ? { animation: 'glow-pulse 3s ease-in-out infinite' } : undefined}
          />
        </>
      )}
      {/* Background pill */}
      <rect
        width={ENTRY_W}
        height={h}
        rx={h / 2}
        fill={hexToRgba(effectiveColor, isActive ? 0.15 : 0.1)}
        stroke={hexToRgba(effectiveColor, hovered || isActive ? 0.5 : 0.3)}
        strokeWidth={isActive ? 1.5 : 1}
        strokeDasharray={isGhost ? '4 3' : undefined}
      />
      {/* Play icon */}
      <text
        x={16}
        y={h / 2 + 1}
        fill={effectiveColor}
        fontSize={11}
        fontWeight={600}
        dominantBaseline="central"
      >
        &#9654;
      </text>
      {/* Label */}
      <text x={32} y={h / 2} fill="#e8e6e1" fontSize={11} dominantBaseline="central">
        {label.length > 16 ? label.slice(0, 16) + '...' : label}
      </text>

      {/* Rich tooltip on hover */}
      {hovered && (
        <foreignObject
          x={-20}
          y={-8}
          width={ENTRY_W + 40}
          height={1}
          overflow="visible"
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 260,
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
              {/* Title */}
              <div
                style={{ fontSize: '12px', fontWeight: 500, color: '#e8e6e1', lineHeight: '1.4' }}
              >
                {label}
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '9px',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    background: `${effectiveColor}1a`,
                    color: effectiveColor,
                  }}
                >
                  Entry Point
                </span>
                {meta?.persona && (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      background: `${meta.personaColor ?? '#78756f'}1a`,
                      color: meta.personaColor ?? '#78756f',
                    }}
                  >
                    {meta.persona}
                  </span>
                )}
              </div>

              {/* Description */}
              {meta?.description && (
                <div style={{ fontSize: '11px', color: '#9a9790', lineHeight: '1.5' }}>
                  {meta.description}
                </div>
              )}

              {/* Flow stats */}
              {meta && (meta.stepCount || meta.decisionCount || meta.errorCount) && (
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-family-mono)',
                    color: '#6a6860',
                  }}
                >
                  {meta.stepCount != null && <span>{meta.stepCount} steps</span>}
                  {meta.decisionCount != null && meta.decisionCount > 0 && (
                    <span>{meta.decisionCount} decisions</span>
                  )}
                  {meta.errorCount != null && meta.errorCount > 0 && (
                    <span style={{ color: '#e05555' }}>{meta.errorCount} errors</span>
                  )}
                </div>
              )}

              {/* CTA */}
              <div style={{ fontSize: '10px', color: '#4a4840', fontStyle: 'italic' }}>
                {isActive
                  ? 'Tracing this flow — choose a path at decision nodes'
                  : 'Click to trace this flow'}
              </div>

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
      )}
    </g>
  );
});
