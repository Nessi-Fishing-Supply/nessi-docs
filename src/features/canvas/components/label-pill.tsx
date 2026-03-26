interface LabelPillProps {
  x: number;
  y: number;
  label: string;
}

export function LabelPill({ x, y, label }: LabelPillProps) {
  const w = label.length * 6.5 + 16;
  return (
    <g transform={`translate(${x - w / 2},${y - 9})`}>
      <rect
        width={w}
        height={18}
        rx={9}
        fill="rgba(15,19,25,0.9)"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth={0.5}
      />
      <text x={w / 2} y={12} fill="#9a9790" fontSize={9} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
