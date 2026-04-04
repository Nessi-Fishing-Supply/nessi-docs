import {
  getPort,
  smoothPath,
  backEdgeArc,
  autoPortSides,
  journeyPortSides,
} from '../utils/geometry';
import type { DiffStatus } from '@/features/shared/types/diff';

interface AnimatedEdgeProps {
  from: { x: number; y: number; type: string };
  to: { x: number; y: number; type: string };
  isLit?: boolean;
  isDimmed?: boolean;
  hasActivePath?: boolean;
  isBackEdge?: boolean;
  isDecisionBranch?: boolean;
  useJourneyPorts?: boolean;
  diffStatus?: DiffStatus | null;
}

export function AnimatedEdge({
  from,
  to,
  isLit,
  isDimmed,
  hasActivePath,
  isBackEdge,
  isDecisionBranch,
  useJourneyPorts,
  diffStatus,
}: AnimatedEdgeProps) {
  // Removed or unchanged diff states don't animate
  if (diffStatus === 'removed' || diffStatus === 'unchanged') return null;

  // When path is active: only show on lit edges
  // When no path: show ambient on all edges
  if (hasActivePath && (!isLit || isDimmed)) return null;

  const [fDir, tDir] = useJourneyPorts
    ? journeyPortSides(from, to, { isBackEdge, isDecisionBranch })
    : autoPortSides(from, to);
  const fp = getPort(from, fDir);
  const tp = getPort(to, tDir);
  const d = isBackEdge
    ? backEdgeArc(fp.x, fp.y, tp.x, tp.y)
    : smoothPath(fp.x, fp.y, fDir, tp.x, tp.y, tDir);

  const opacity = isBackEdge ? 0.25 : isLit ? 0.85 : 0.08;

  let animColor = isBackEdge
    ? 'rgba(234,179,8,0.5)'
    : isLit
      ? 'rgba(61,140,117,0.7)'
      : 'rgba(255,255,255,0.15)';

  if (diffStatus === 'added') animColor = 'rgba(61,140,117,0.7)';
  if (diffStatus === 'modified') animColor = 'rgba(123,143,205,0.7)';

  const marker = isLit ? 'url(#arrow-lit)' : undefined;

  return (
    <path
      d={d}
      fill="none"
      stroke={animColor}
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
