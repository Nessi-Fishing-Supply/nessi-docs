interface LabelPillProps {
  x: number;
  y: number;
  label: string;
}

export function LabelPill({ x, y, label }: LabelPillProps) {
  const w = label.length * 6.5 + 16;
  const h = 18;
  return (
    <g transform={`translate(${x - w / 2},${y - h / 2})`}>
      {/* Frosted glass backdrop */}
      <foreignObject width={w} height={h} style={{ borderRadius: 9 }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 9,
            backdropFilter: 'blur(8px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(8px) saturate(1.3)',
            background: 'rgba(15,19,25,0.75)',
          }}
        />
      </foreignObject>
      <rect
        width={w}
        height={h}
        rx={9}
        fill="none"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth={0.5}
      />
      <text x={w / 2} y={12} fill="#9a9790" fontSize={9} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
