import { memo } from 'react';

interface NodeGlowProps {
  id: string;
  type: 'diff' | 'hover' | 'selection';
  color: string;
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
}

const GLOW_CONFIG = {
  diff: { innerOpacity: 0.3, animation: 'glow-pulse 3s ease-in-out infinite' },
  hover: { innerOpacity: 0.08, animation: undefined },
  selection: { innerOpacity: 0.15, animation: 'glow-pulse 3s ease-in-out infinite' },
} as const;

export const NodeGlow = memo(function NodeGlow({ id, type, color, cx, cy, rx, ry }: NodeGlowProps) {
  const config = GLOW_CONFIG[type];
  const gradientId = `glow-${type}-${id}`;

  return (
    <>
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor={color} stopOpacity={config.innerOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry ?? rx}
        fill={`url(#${gradientId})`}
        style={config.animation ? { animation: config.animation } : undefined}
      />
    </>
  );
});
