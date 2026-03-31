'use client';

import { useState, memo } from 'react';
import { LIFECYCLE_NODE_WIDTH, LIFECYCLE_NODE_HEIGHT, hexToRgba } from '../utils/geometry';
import type { LifecycleState } from '@/types/lifecycle';
import { DEFAULT_STATE_COLOR } from '@/types/lifecycle';

interface StateNodeProps {
  state: LifecycleState;
  isSelected?: boolean;
  onClick?: () => void;
}

export const StateNode = memo(function StateNode({ state, isSelected, onClick }: StateNodeProps) {
  const [hovered, setHovered] = useState(false);
  const color = state.color ?? DEFAULT_STATE_COLOR;
  const showHoverGlow = hovered && !isSelected;

  return (
    <g
      transform={`translate(${state.x},${state.y})`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Hover glow */}
      {showHoverGlow && (
        <>
          <defs>
            <radialGradient id={`lc-hover-${state.id}`}>
              <stop offset="0%" stopColor={color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            cx={LIFECYCLE_NODE_WIDTH / 2}
            cy={LIFECYCLE_NODE_HEIGHT / 2}
            r={LIFECYCLE_NODE_WIDTH * 0.5}
            fill={`url(#lc-hover-${state.id})`}
          />
        </>
      )}
      {/* Selection glow */}
      {isSelected && (
        <>
          <defs>
            <radialGradient id={`lc-glow-${state.id}`}>
              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            cx={LIFECYCLE_NODE_WIDTH / 2}
            cy={LIFECYCLE_NODE_HEIGHT / 2}
            r={LIFECYCLE_NODE_WIDTH * 0.55}
            fill={`url(#lc-glow-${state.id})`}
            style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
          />
        </>
      )}
      {/* Frosted glass backdrop */}
      <foreignObject
        width={LIFECYCLE_NODE_WIDTH}
        height={LIFECYCLE_NODE_HEIGHT}
        style={{ borderRadius: 8 }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 8,
            backdropFilter: 'blur(6px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(6px) saturate(1.2)',
            background: 'rgba(20,25,32,0.15)',
          }}
        />
      </foreignObject>
      {/* Colored card */}
      <rect
        width={LIFECYCLE_NODE_WIDTH}
        height={LIFECYCLE_NODE_HEIGHT}
        rx={8}
        fill={hexToRgba(color, 0.12)}
        stroke={isSelected ? color : hovered ? hexToRgba(color, 0.4) : hexToRgba(color, 0.3)}
        strokeWidth={isSelected ? 1.5 : 1}
      />
      {/* Left accent bar */}
      <rect x={0} y={8} width={3} height={LIFECYCLE_NODE_HEIGHT - 16} rx={1.5} fill={color} />
      {/* State label */}
      <text
        x={LIFECYCLE_NODE_WIDTH / 2}
        y={LIFECYCLE_NODE_HEIGHT / 2 + 4}
        fill="#e8e6e1"
        fontSize={12}
        fontWeight={500}
        textAnchor="middle"
      >
        {state.label}
      </text>
    </g>
  );
});
