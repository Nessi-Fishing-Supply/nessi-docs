import type { DecisionOption } from '@/types/journey';
import { DECISION_SIZE, hexToRgba } from '../utils/geometry';

interface DecisionNodeProps {
  x: number;
  y: number;
  label: string;
  options: DecisionOption[];
  chosenOpt?: string;
  isDimmed?: boolean;
  onChoose?: (opt: string, targetId: string) => void;
}

export function DecisionNode({
  x,
  y,
  label,
  options,
  chosenOpt,
  isDimmed,
  onChoose,
}: DecisionNodeProps) {
  const cx = x + DECISION_SIZE / 2;
  const cy = y + DECISION_SIZE / 2;
  const opacity = isDimmed ? 0.15 : 1;

  return (
    <g style={{ opacity, transition: 'opacity 400ms ease-out' }}>
      {/* Diamond */}
      <g
        transform={`translate(${cx},${cy}) rotate(45)`}
        style={{ cursor: 'default' }}
      >
        <rect
          x={-DECISION_SIZE / 2 + 6}
          y={-DECISION_SIZE / 2 + 6}
          width={DECISION_SIZE - 12}
          height={DECISION_SIZE - 12}
          rx={4}
          fill={hexToRgba('#e89048', 0.12)}
          stroke={hexToRgba('#e89048', 0.35)}
          strokeWidth={1}
        />
      </g>
      {/* ? mark */}
      <text
        x={cx}
        y={cy + 4}
        fill="#e89048"
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
      {/* Option pills */}
      {options.map((opt, i) => {
        const py = y + DECISION_SIZE + 8 + i * 24;
        const isChosen = chosenOpt === opt.label;
        const pillOpacity = chosenOpt && !isChosen ? 0.35 : 1;
        return (
          <g
            key={opt.label}
            transform={`translate(${x - 10},${py})`}
            onClick={() => onChoose?.(opt.label, opt.to)}
            style={{ cursor: 'pointer', opacity: pillOpacity }}
          >
            <rect
              width={DECISION_SIZE + 30}
              height={18}
              rx={9}
              fill={hexToRgba('#e89048', isChosen ? 0.2 : 0.08)}
              stroke={hexToRgba('#e89048', isChosen ? 0.5 : 0.2)}
              strokeWidth={0.8}
            />
            <text
              x={(DECISION_SIZE + 30) / 2}
              y={12}
              fill={isChosen ? '#e8e6e1' : '#9a9790'}
              fontSize={9}
              textAnchor="middle"
            >
              {opt.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
