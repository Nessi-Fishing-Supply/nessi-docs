'use client';

import { useState, memo } from 'react';
import { LIFECYCLE_NODE_WIDTH, LIFECYCLE_NODE_HEIGHT, hexToRgba } from '../utils/geometry';
import type { LifecycleState } from '@/features/lifecycles';
import { DEFAULT_STATE_COLOR } from '@/features/lifecycles';
import type { DiffStatus } from '@/features/diff-overview/types/diff';
import { useNodeState } from '../hooks/use-node-state';
import { NodeGlow } from './node-glow';
import { CANVAS_COLORS } from '../constants/canvas-colors';

interface StateNodeProps {
  state: LifecycleState;
  isSelected?: boolean;
  onClick?: () => void;
  diffStatus?: DiffStatus | null;
}

export const StateNode = memo(function StateNode({
  state,
  isSelected,
  onClick,
  diffStatus,
}: StateNodeProps) {
  const [hovered, setHovered] = useState(false);

  // Always use the node's natural color — diff is additive, not a replacement
  const color = state.color ?? DEFAULT_STATE_COLOR;

  const { containerStyle, isGhost, isDiffChanged, diffColor, isInteractive } = useNodeState({
    diffStatus,
    isHovered: hovered,
    isSelected,
  });

  const showHoverGlow = hovered && !isSelected && isInteractive;
  const showDiffGlow = isDiffChanged && !isSelected;

  return (
    <g
      transform={`translate(${state.x},${state.y})`}
      onClick={isInteractive ? onClick : undefined}
      onMouseEnter={isInteractive ? () => setHovered(true) : undefined}
      onMouseLeave={isInteractive ? () => setHovered(false) : undefined}
      style={containerStyle}
    >
      {/* Diff glow — uses diffColor, larger radius */}
      {showDiffGlow && diffColor && (
        <NodeGlow
          id={state.id}
          type="diff"
          color={diffColor}
          cx={LIFECYCLE_NODE_WIDTH / 2}
          cy={LIFECYCLE_NODE_HEIGHT / 2}
          rx={LIFECYCLE_NODE_WIDTH * 0.7}
        />
      )}
      {/* Diff outer ring — solid for added, dashed for modified */}
      {isDiffChanged && diffColor && (
        <rect
          x={-4}
          y={-4}
          width={LIFECYCLE_NODE_WIDTH + 8}
          height={LIFECYCLE_NODE_HEIGHT + 8}
          rx={12}
          fill="none"
          stroke={diffColor}
          strokeWidth={1.5}
          strokeOpacity={0.6}
          strokeDasharray={diffStatus === 'added' ? undefined : '6 3'}
        />
      )}
      {/* Ghost outer ring */}
      {isGhost && diffColor && (
        <rect
          x={-3}
          y={-3}
          width={LIFECYCLE_NODE_WIDTH + 6}
          height={LIFECYCLE_NODE_HEIGHT + 6}
          rx={11}
          fill="none"
          stroke={diffColor}
          strokeWidth={1}
          strokeOpacity={0.4}
          strokeDasharray="4 3"
        />
      )}
      {/* Hover glow — uses natural color */}
      {showHoverGlow && (
        <NodeGlow
          id={state.id}
          type="hover"
          color={color}
          cx={LIFECYCLE_NODE_WIDTH / 2}
          cy={LIFECYCLE_NODE_HEIGHT / 2}
          rx={LIFECYCLE_NODE_WIDTH * 0.5}
        />
      )}
      {/* Selection glow — uses natural color */}
      {isSelected && (
        <NodeGlow
          id={state.id}
          type="selection"
          color={color}
          cx={LIFECYCLE_NODE_WIDTH / 2}
          cy={LIFECYCLE_NODE_HEIGHT / 2}
          rx={LIFECYCLE_NODE_WIDTH * 0.55}
        />
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
            background: CANVAS_COLORS.bgFrost,
          }}
        />
      </foreignObject>
      {/* Colored card — always uses natural color */}
      <rect
        width={LIFECYCLE_NODE_WIDTH}
        height={LIFECYCLE_NODE_HEIGHT}
        rx={8}
        fill={hexToRgba(color, 0.12)}
        stroke={isSelected ? color : hovered ? hexToRgba(color, 0.4) : hexToRgba(color, 0.3)}
        strokeWidth={isSelected ? 1.5 : 1}
        strokeDasharray={isGhost ? '4 3' : undefined}
      />
      {/* Left accent bar */}
      <rect x={0} y={8} width={3} height={LIFECYCLE_NODE_HEIGHT - 16} rx={1.5} fill={color} />
      {/* State label */}
      <text
        x={LIFECYCLE_NODE_WIDTH / 2}
        y={LIFECYCLE_NODE_HEIGHT / 2 + 4}
        fill={CANVAS_COLORS.textPrimary}
        fontSize={12}
        fontWeight={500}
        textAnchor="middle"
      >
        {state.label}
      </text>
    </g>
  );
});
