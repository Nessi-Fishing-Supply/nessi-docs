'use client';

import { useState, useEffect } from 'react';

/**
 * Returns a Set of node IDs that have "entered" (should be visible).
 * Nodes enter one by one with a stagger delay, sorted left-to-right by x position.
 */
export function useStaggerEntry(nodeIds: { id: string; x: number }[], delay = 30) {
  const [entered, setEntered] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Sort by x position (left to right)
    const sorted = [...nodeIds].sort((a, b) => a.x - b.x);
    const timers: ReturnType<typeof setTimeout>[] = [];

    sorted.forEach((node, i) => {
      const t = setTimeout(() => {
        setEntered((prev) => new Set(prev).add(node.id));
      }, i * delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  }, []);

  return entered;
}
