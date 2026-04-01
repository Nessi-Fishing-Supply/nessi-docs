import {
  getPort,
  smoothPath,
  backEdgeArc,
  autoPortSides,
  journeyPortSides,
} from '../utils/geometry';
import type { DiffStatus } from '@/types/diff';

interface EdgeProps {
  from: { x: number; y: number; type: string };
  to: { x: number; y: number; type: string };
  isDecision?: boolean;
  isLit?: boolean;
  isDimmed?: boolean;
  isBackEdge?: boolean;
  isDecisionBranch?: boolean;
  useJourneyPorts?: boolean;
  diffStatus?: DiffStatus | null;
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
  diffStatus,
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
  // Back-edges are more visible since they don't get the animated overlay
  let opacity = isDimmed ? 0.06 : isBackEdge ? 0.55 : isLit ? 0.2 : 0.25;
  const strokeWidth = isLit ? 1.5 : 1.5;
  let stroke = isBackEdge
    ? 'rgba(234,179,8,0.5)'
    : isDecision
      ? 'rgba(167,139,250,0.6)'
      : 'rgba(61,140,117,0.6)';
  let marker = isLit
    ? undefined
    : isBackEdge
      ? 'url(#arrow-back)'
      : isDecision
        ? 'url(#arrow-decision)'
        : 'url(#arrow)';

  let computedStrokeDasharray: string | undefined = isDecision || isBackEdge ? '5 5' : undefined;

  if (diffStatus) {
    if (diffStatus === 'added') {
      stroke = 'rgba(61,140,117,0.7)';
      marker = 'url(#arrow-diff-added)';
      opacity = 1;
    } else if (diffStatus === 'modified') {
      stroke = 'rgba(123,143,205,0.7)';
      marker = 'url(#arrow-diff-modified)';
      opacity = 1;
    } else if (diffStatus === 'removed') {
      stroke = 'rgba(184,64,64,0.5)';
      computedStrokeDasharray = '3 5';
      marker = 'url(#arrow-diff-removed)';
      opacity = 0.5;
    } else if (diffStatus === 'unchanged') {
      opacity = 0.15;
    }
  }

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={computedStrokeDasharray}
      markerEnd={marker}
      style={{ opacity, transition: 'opacity 400ms ease-out, stroke-width 300ms ease-out' }}
    />
  );
}
