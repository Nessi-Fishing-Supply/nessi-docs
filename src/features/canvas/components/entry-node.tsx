import { NODE_HEIGHT, hexToRgba } from '../utils/geometry';

interface EntryNodeProps {
  x: number;
  y: number;
  label: string;
  isDimmed?: boolean;
  onClick?: () => void;
}

export function EntryNode({ x, y, label, isDimmed, onClick }: EntryNodeProps) {
  const w = 160;
  const h = NODE_HEIGHT;
  const opacity = isDimmed ? 0.15 : 1;

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onClick}
      style={{ cursor: 'pointer', opacity, transition: 'opacity 400ms ease-out' }}
    >
      <rect
        width={w}
        height={h}
        rx={h / 2}
        fill={hexToRgba('#3d8c75', 0.1)}
        stroke={hexToRgba('#3d8c75', 0.3)}
        strokeWidth={1}
      />
      <text x={14} y={16} fill="#3d8c75" fontSize={12} fontWeight={600}>
        &#9654;
      </text>
      <text x={30} y={27} fill="#e8e6e1" fontSize={11}>
        {label.length > 18 ? label.slice(0, 18) + '...' : label}
      </text>
    </g>
  );
}
