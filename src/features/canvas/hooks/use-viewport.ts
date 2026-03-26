'use client';

import { useMemo } from 'react';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;
const DECISION_SIZE = 48;
const PADDING = 60;

interface NodeLike {
  x: number;
  y: number;
  type: string;
}

export function useViewport(nodes: NodeLike[]) {
  return useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, width: 800, height: 600 };

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
      const w = n.type === 'decision' ? DECISION_SIZE : NODE_WIDTH;
      const h = n.type === 'decision' ? DECISION_SIZE : NODE_HEIGHT;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + w);
      maxY = Math.max(maxY, n.y + h);
    }

    return {
      minX: minX - PADDING,
      minY: minY - PADDING,
      width: maxX - minX + PADDING * 2,
      height: maxY - minY + PADDING * 2,
    };
  }, [nodes]);
}
