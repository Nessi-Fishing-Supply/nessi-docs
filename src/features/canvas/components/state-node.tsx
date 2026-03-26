import {
  LIFECYCLE_NODE_WIDTH,
  LIFECYCLE_NODE_HEIGHT,
  hexToRgba,
} from '../utils/geometry';
import type { LifecycleState } from '@/types/lifecycle';

interface StateNodeProps {
  state: LifecycleState;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StateNode({ state, isSelected, onClick }: StateNodeProps) {
  return (
    <g
      transform={`translate(${state.x},${state.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <rect
        width={LIFECYCLE_NODE_WIDTH}
        height={LIFECYCLE_NODE_HEIGHT}
        rx={8}
        fill={hexToRgba(state.color, 0.12)}
        stroke={isSelected ? state.color : hexToRgba(state.color, 0.3)}
        strokeWidth={isSelected ? 1.5 : 1}
      />
      <rect
        x={0}
        y={8}
        width={3}
        height={LIFECYCLE_NODE_HEIGHT - 16}
        rx={1.5}
        fill={state.color}
      />
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
}
