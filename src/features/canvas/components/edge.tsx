import {
  getPort,
  smoothPath,
  backEdgeArc,
  autoPortSides,
  journeyPortSides,
} from '../utils/geometry';

interface EdgeProps {
  from: { x: number; y: number; type: string };
  to: { x: number; y: number; type: string };
  isDecision?: boolean;
  isLit?: boolean;
  isDimmed?: boolean;
  isBackEdge?: boolean;
  isDecisionBranch?: boolean;
  useJourneyPorts?: boolean;
}

export function Edge({
  from,
  to,
  isDecision,
  isLit,
  isDimmed,
  isBackEdge,
  isDecisionBranch,
  useJourneyPorts,
}: EdgeProps) {
  const [fDir, tDir] = useJourneyPorts
    ? journeyPortSides(from, to, { isBackEdge, isDecisionBranch })
    : autoPortSides(from, to);
  const fp = getPort(from, fDir);
  const tp = getPort(to, tDir);

  const d = isBackEdge
    ? backEdgeArc(fp.x, fp.y, tp.x, tp.y)
    : smoothPath(fp.x, fp.y, fDir, tp.x, tp.y, tDir);

  // When lit, this edge becomes a subtle track — the AnimatedEdge is the primary visual
  const opacity = isDimmed ? 0.06 : isLit ? 0.2 : 0.25;
  const strokeWidth = isLit ? 1.5 : 1.5;
  const stroke = isBackEdge
    ? 'rgba(234,179,8,0.5)'
    : isDecision
      ? 'rgba(167,139,250,0.6)'
      : 'rgba(61,140,117,0.6)';
  const marker = isLit
    ? undefined
    : isBackEdge
      ? 'url(#arrow-back)'
      : isDecision
        ? 'url(#arrow-decision)'
        : 'url(#arrow)';

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={isDecision || isBackEdge ? '5 5' : undefined}
      markerEnd={marker}
      style={{ opacity, transition: 'opacity 400ms ease-out, stroke-width 300ms ease-out' }}
    />
  );
}
