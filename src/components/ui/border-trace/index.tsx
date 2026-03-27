'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './border-trace.module.scss';

interface BorderTraceProps {
  /** Whether the trace animation is active */
  active: boolean;
  /** Border radius in pixels */
  radius?: number;
  /** Duration of one full loop in seconds */
  duration?: number;
  /** Number of loops before fading out */
  loops?: number;
  /** Color of the trace highlight */
  color?: string;
}

/**
 * SVG-based border trace animation that moves at constant perimeter speed.
 * Renders an absolutely-positioned SVG overlay with an animated stroke-dashoffset.
 * Must be placed inside a `position: relative` container.
 */
export function BorderTrace({
  active,
  radius = 8,
  duration = 2.5,
  loops = 3,
  color = 'rgb(61, 140, 117)',
}: BorderTraceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!active || !svgRef.current) return;

    const parent = svgRef.current.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width + 2, // +2 for the 1px border on each side
          height: entry.contentRect.height + 2,
        });
      }
    });

    observer.observe(parent);
    return () => observer.disconnect();
  }, [active]);

  if (!active || dimensions.width === 0) {
    return active ? (
      <svg ref={svgRef} className={styles.svg} aria-hidden="true" />
    ) : null;
  }

  const { width, height } = dimensions;
  // Perimeter of rounded rectangle (approximate — close enough for animation)
  const straightH = Math.max(0, width - 2 * radius);
  const straightV = Math.max(0, height - 2 * radius);
  const cornerArc = 2 * Math.PI * radius / 4; // quarter circle per corner
  const perimeter = 2 * straightH + 2 * straightV + 4 * cornerArc;

  // The visible "trace" is ~15% of the perimeter
  const traceLength = perimeter * 0.15;
  const gapLength = perimeter - traceLength;

  const totalDuration = duration * loops;

  return (
    <svg
      ref={svgRef}
      className={styles.svg}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{
        '--trace-duration': `${duration}s`,
        '--trace-loops': loops,
        '--fade-duration': `${totalDuration}s`,
      } as React.CSSProperties}
    >
      <rect
        className={styles.trace}
        x="0.75"
        y="0.75"
        width={width - 1.5}
        height={height - 1.5}
        rx={radius}
        ry={radius}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={`${traceLength} ${gapLength}`}
        strokeDashoffset={perimeter}
        strokeLinecap="round"
      />
    </svg>
  );
}
