import { getPort, bezier } from '../utils/geometry';

interface EdgeProps {
  from: { x: number; y: number; type: string };
  to: { x: number; y: number; type: string };
  isDecision?: boolean;
  isLit?: boolean;
  isDimmed?: boolean;
}

export function Edge({ from, to, isDecision, isLit, isDimmed }: EdgeProps) {
  const fp = getPort(from, 'right');
  const tp = getPort(to, 'left');
  const d = bezier(fp.x, fp.y, tp.x, tp.y);

  const opacity = isDimmed ? 0.06 : isLit ? 0.75 : 0.25;
  const strokeWidth = isLit ? 2.5 : 1.5;
  const stroke = isDecision
    ? 'rgba(232,144,72,0.6)'
    : 'rgba(61,140,117,0.6)';
  const marker = isDecision
    ? 'url(#arrow-decision)'
    : isLit
      ? 'url(#arrow-lit)'
      : 'url(#arrow)';

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
