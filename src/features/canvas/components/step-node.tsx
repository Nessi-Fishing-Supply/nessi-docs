import { LAYER_CONFIG, STATUS_CONFIG, type JourneyNode } from '@/types/journey';
import { NODE_WIDTH, NODE_HEIGHT, hexToRgba } from '../utils/geometry';

interface StepNodeProps {
  node: JourneyNode;
  isSelected?: boolean;
  isDimmed?: boolean;
  onClick?: () => void;
}

export function StepNode({ node, isSelected, isDimmed, onClick }: StepNodeProps) {
  const layer = node.layer ?? 'client';
  const status = node.status ?? 'planned';
  const layerCfg = LAYER_CONFIG[layer];
  const statusCfg = STATUS_CONFIG[status];
  const opacity = isDimmed ? 0.15 : 1;
  const errorCount = node.errorCases?.length ?? 0;

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer', opacity, transition: 'opacity 400ms ease-out' }}
    >
      {/* Selection glow */}
      {isSelected && (
        <defs>
          <radialGradient id={`glow-${node.id}`}>
            <stop offset="0%" stopColor={layerCfg.color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={layerCfg.color} stopOpacity={0} />
          </radialGradient>
        </defs>
      )}
      {isSelected && (
        <circle
          cx={NODE_WIDTH / 2}
          cy={NODE_HEIGHT / 2}
          r={NODE_WIDTH * 0.6}
          fill={`url(#glow-${node.id})`}
          style={{ animation: 'glowPulse 3s ease-in-out infinite' }}
        />
      )}
      {/* Background */}
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={6}
        fill={hexToRgba(layerCfg.color, 0.08)}
        stroke={isSelected ? layerCfg.color : hexToRgba(layerCfg.color, 0.2)}
        strokeWidth={isSelected ? 1.5 : 1}
      />
      {/* Left accent */}
      <rect
        x={0}
        y={6}
        width={2.5}
        height={NODE_HEIGHT - 12}
        rx={1}
        fill={layerCfg.color}
      />
      {/* Status dot */}
      <circle cx={NODE_WIDTH - 10} cy={10} r={3} fill={statusCfg.color} />
      {/* Label */}
      <text x={12} y={18} fill="#e8e6e1" fontSize={11} fontWeight={500}>
        {node.label.length > 20 ? node.label.slice(0, 20) + '...' : node.label}
      </text>
      {/* Sublabel */}
      <text
        x={12}
        y={32}
        fill="#6a6860"
        fontSize={9}
        fontFamily="var(--font-family-mono)"
      >
        {node.route ?? layerCfg.label}
      </text>
      {/* Error badge */}
      {errorCount > 0 && (
        <g transform={`translate(${NODE_WIDTH - 28}, ${NODE_HEIGHT - 16})`}>
          <rect
            width={20}
            height={14}
            rx={7}
            fill="rgba(184,64,64,0.15)"
            stroke="rgba(184,64,64,0.3)"
            strokeWidth={0.5}
          />
          <text
            x={10}
            y={10}
            fill="#b84040"
            fontSize={8}
            fontWeight={600}
            textAnchor="middle"
          >
            {errorCount}
          </text>
        </g>
      )}
    </g>
  );
}
