'use client';

import { useState, useMemo, useCallback } from 'react';
import type { ErdEdge } from '@/types/entity-relationship';

export function useErdTrace(edges: ErdEdge[]) {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const toggleFocus = useCallback((nodeId: string) => {
    setFocusedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const resetTrace = useCallback(() => {
    setFocusedNodeId(null);
  }, []);

  const { litNodes, litEdges } = useMemo(() => {
    if (!focusedNodeId) {
      return { litNodes: new Set<string>(), litEdges: new Set<number>() };
    }

    const litN = new Set<string>([focusedNodeId]);
    const litE = new Set<number>();

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (e.from === focusedNodeId || e.to === focusedNodeId) {
        litN.add(e.from);
        litN.add(e.to);
        litE.add(i);
      }
    }

    return { litNodes: litN, litEdges: litE };
  }, [focusedNodeId, edges]);

  const hasTrace = focusedNodeId !== null;

  return {
    focusedNodeId,
    toggleFocus,
    resetTrace,
    litNodes,
    litEdges,
    hasTrace,
  };
}
