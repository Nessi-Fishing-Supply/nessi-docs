'use client';

import { useState, memo } from 'react';
import { NODE_HEIGHT, hexToRgba } from '../utils/geometry';
import type { DiffStatus } from '@/features/shared/types/diff';
import { useNodeState } from '../hooks/use-node-state';
import { NodeGlow } from './node-glow';
import { CANVAS_COLORS } from '../constants/canvas-colors';

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

  const { containerStyle, isGhost, isDiffChanged, diffColor, isInteractive } = useNodeState({
    diffStatus,
    isDimmed,
  });

  const showDiffGlow = isDiffChanged && !isActive;
  // Hover-only glow (no active): standard opacity, no animation
  const showHoverGlow = hovered && !isActive && !isGhost && isInteractive;
  // Active glow (with or without hover): higher opacity + animation
  const showActiveGlow = isActive && !isGhost && isInteractive;

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={isInteractive ? onClick : undefined}
      onMouseEnter={isInteractive ? () => setHovered(true) : undefined}
      onMouseLeave={isInteractive ? () => setHovered(false) : undefined}
      style={containerStyle}
    >
      {/* Outer diff ring — pill shape, only for added/modified */}
      {diffColor && (
        <rect
          x={-4}
          y={-4}
          width={ENTRY_W + 8}
          height={h + 8}
          rx={(h + 8) / 2}
          fill="none"
          stroke={diffColor}
          strokeWidth={1.5}
          strokeOpacity={0.7}
        />
      )}
      {/* Diff glow — ellipse shaped */}
      {showDiffGlow && diffColor && (
        <NodeGlow
          id={`${x}-${y}`}
          type="diff"
          color={diffColor}
          cx={ENTRY_W / 2}
          cy={h / 2}
          rx={ENTRY_W * 0.55}
          ry={h * 1.2}
        />
      )}
      {/* Hover glow — ellipse shaped, no animation */}
      {showHoverGlow && (
        <NodeGlow
          id={`${x}-${y}`}
          type="hover"
          color={ENTRY_COLOR}
          cx={ENTRY_W / 2}
          cy={h / 2}
          rx={ENTRY_W * 0.55}
          ry={h * 1.2}
        />
      )}
      {/* Active glow — ellipse shaped, with pulse animation */}
      {showActiveGlow && (
        <NodeGlow
          id={`${x}-${y}-active`}
          type="selection"
          color={ENTRY_COLOR}
          cx={ENTRY_W / 2}
          cy={h / 2}
          rx={ENTRY_W * 0.55}
          ry={h * 1.2}
        />
      )}
      {/* Background pill — always uses natural ENTRY_COLOR */}
      <rect
        width={ENTRY_W}
        height={h}
        rx={h / 2}
        fill={hexToRgba(ENTRY_COLOR, isActive ? 0.15 : 0.1)}
        stroke={hexToRgba(ENTRY_COLOR, hovered || isActive ? 0.5 : 0.3)}
        strokeWidth={isActive ? 1.5 : 1}
        strokeDasharray={isGhost ? '4 3' : undefined}
      />
      {/* Play icon */}
      <text
        x={16}
        y={h / 2 + 1}
        fill={ENTRY_COLOR}
        fontSize={11}
        fontWeight={600}
        dominantBaseline="central"
      >
        &#9654;
      </text>
      {/* Label */}
      <text
        x={32}
        y={h / 2}
        fill={CANVAS_COLORS.textPrimary}
        fontSize={11}
        dominantBaseline="central"
      >
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
                    background: `${ENTRY_COLOR}1a`,
                    color: ENTRY_COLOR,
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
