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
 * Uses a blurred glow layer + a sharp core layer for a soft highlight effect.
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

  // Short trace (~8% of perimeter) for a tight glow spot
  const traceLength = perimeter * 0.08;
  const gapLength = perimeter - traceLength;

  const totalDuration = duration * loops;

  const rectProps = {
    x: 0.75,
    y: 0.75,
    width: width - 1.5,
    height: height - 1.5,
    rx: radius,
    ry: radius,
    fill: 'none' as const,
    strokeDasharray: `${traceLength} ${gapLength}`,
    strokeDashoffset: perimeter,
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
        <filter id="trace-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow layer — blurred, wider, softer */}
      <rect
        className={styles.trace}
        {...rectProps}
        stroke={color}
        strokeWidth="6"
        strokeOpacity="0.4"
        filter="url(#trace-glow)"
      />

      {/* Core layer — sharp, thinner, brighter */}
      <rect
        className={styles.trace}
        {...rectProps}
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />
    </svg>
  );
}
