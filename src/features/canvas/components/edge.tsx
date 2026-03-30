import { getPort, smoothPath, autoPortSides } from '../utils/geometry';

interface EdgeProps {
  from: { x: number; y: number; type: string };
  to: { x: number; y: number; type: string };
  isDecision?: boolean;
  isLit?: boolean;
  isDimmed?: boolean;
}

export function Edge({ from, to, isDecision, isLit, isDimmed }: EdgeProps) {
  const [fDir, tDir] = autoPortSides(from, to);
  const fp = getPort(from, fDir);
  const tp = getPort(to, tDir);
  const d = smoothPath(fp.x, fp.y, fDir, tp.x, tp.y, tDir);

  // When lit, this edge becomes a subtle track — the AnimatedEdge is the primary visual
  const opacity = isDimmed ? 0.06 : isLit ? 0.2 : 0.25;
  const strokeWidth = isLit ? 1.5 : 1.5;
  const stroke = isDecision ? 'rgba(167,139,250,0.6)' : 'rgba(61,140,117,0.6)';
  const marker = isLit ? undefined : isDecision ? 'url(#arrow-decision)' : 'url(#arrow)';

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={isDecision ? '5 5' : undefined}
      markerEnd={marker}
      style={{ opacity, transition: 'opacity 400ms ease-out, stroke-width 300ms ease-out' }}
    />
  );
}
