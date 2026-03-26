import { getPort, bezier } from '../utils/geometry';

interface AnimatedEdgeProps {
  from: { x: number; y: number; type: string };
  to: { x: number; y: number; type: string };
  isLit?: boolean;
  isDimmed?: boolean;
  hasActivePath?: boolean;
}

export function AnimatedEdge({ from, to, isLit, isDimmed, hasActivePath }: AnimatedEdgeProps) {
  // When path is active: only show on lit edges
  // When no path: show ambient on all edges
  if (hasActivePath && (!isLit || isDimmed)) return null;

  const fp = getPort(from, 'right');
  const tp = getPort(to, 'left');
  const d = bezier(fp.x, fp.y, tp.x, tp.y);

  const opacity = isLit ? 0.6 : 0.08;
  const color = isLit ? 'rgba(61,140,117,0.6)' : 'rgba(255,255,255,0.15)';

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={isLit ? 2 : 1}
      strokeDasharray="4 16"
      style={{
        animation: 'flow-pulse 1.8s linear infinite',
        opacity,
      }}
    />
  );
}
