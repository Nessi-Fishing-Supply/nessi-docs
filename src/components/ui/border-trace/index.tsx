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
 * SVG-based border trace animation — a small glowing sparkle that traces
 * the border at constant perimeter speed. Uses layered strokes with
 * decreasing opacity/length to create a gradient tail effect.
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
          width: entry.contentRect.width + 2,
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
  const straightH = Math.max(0, width - 2 * radius);
  const straightV = Math.max(0, height - 2 * radius);
  const cornerArc = (2 * Math.PI * radius) / 4;
  const perimeter = 2 * straightH + 2 * straightV + 4 * cornerArc;

  const totalDuration = duration * loops;

  // Layered strokes — each shorter and more opaque to create gradient falloff
  // The "sparkle" is the bright tip; the tail fades out behind it
  const layers = [
    { lengthPct: 0.04, opacity: 0.08, width: 3 },   // outermost soft tail
    { lengthPct: 0.025, opacity: 0.15, width: 2.5 }, // mid tail
    { lengthPct: 0.012, opacity: 0.3, width: 2 },    // inner tail
    { lengthPct: 0.004, opacity: 0.6, width: 1.5 },  // bright core
  ];

  const rectBase = {
    x: 0.75,
    y: 0.75,
    width: width - 1.5,
    height: height - 1.5,
    rx: radius,
    ry: radius,
    fill: 'none' as const,
    stroke: color,
    strokeLinecap: 'round' as const,
  };

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
      <defs>
        <filter id="trace-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {layers.map((layer, i) => {
        const traceLength = perimeter * layer.lengthPct;
        const gapLength = perimeter - traceLength;
        return (
          <rect
            key={i}
            className={styles.trace}
            {...rectBase}
            strokeWidth={layer.width}
            strokeOpacity={layer.opacity}
            strokeDasharray={`${traceLength} ${gapLength}`}
            strokeDashoffset={perimeter}
            filter={i < 2 ? 'url(#trace-soft)' : undefined}
          />
        );
      })}
    </svg>
  );
}
