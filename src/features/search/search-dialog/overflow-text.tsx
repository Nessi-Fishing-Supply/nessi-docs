'use client';

import { useRef, useState, useCallback } from 'react';

interface OverflowTextProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}

export function OverflowText({ children, className, style }: OverflowTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [overflow, setOverflow] = useState(0);

  const handleMouseEnter = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const diff = el.scrollWidth - el.clientWidth;
    if (diff > 0) {
      setOverflow(diff);
      setScrolling(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setScrolling(false);
    setOverflow(0);
  }, []);

  const duration = overflow > 0 ? (overflow / 50) * 1000 + 800 : 0;

  return (
    <span
      ref={ref}
      className={className}
      style={{
        ...style,
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: scrolling ? 'clip' : 'ellipsis',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        style={
          {
            display: 'inline-block',
            transition: scrolling ? 'none' : undefined,
            animation: scrolling ? `overflow-scroll ${duration}ms linear` : undefined,
            '--scroll-distance': `-${overflow}px`,
          } as React.CSSProperties
        }
      >
        {children}
      </span>
    </span>
  );
}
