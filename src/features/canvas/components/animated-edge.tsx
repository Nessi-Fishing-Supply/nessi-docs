import { getPort, smoothPath } from '../utils/geometry';

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
  const d = smoothPath(fp.x, fp.y, 'right', tp.x, tp.y, 'left');

  const opacity = isLit ? 0.85 : 0.08;
  const color = isLit ? 'rgba(61,140,117,0.7)' : 'rgba(255,255,255,0.15)';
  const marker = isLit ? 'url(#arrow-lit)' : undefined;

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={isLit ? 2.5 : 1}
      strokeDasharray="4 16"
      strokeLinecap="round"
      markerEnd={marker}
      style={{
        animation: 'flow-pulse 1.8s linear infinite',
        opacity,
        transition: 'opacity 400ms ease-out',
      }}
    />
  );
}
