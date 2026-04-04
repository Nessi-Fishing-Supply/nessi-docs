import { useState, useMemo, useCallback } from 'react';
import type { ArchConnection } from '../../types/architecture';

/* ------------------------------------------------------------------ */
/*  Trace hook (click to isolate connections — same pattern as ERD)    */
/* ------------------------------------------------------------------ */

export function useArchTrace(connections: ArchConnection[]) {
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

    for (let i = 0; i < connections.length; i++) {
      const c = connections[i];
      if (c.from === focusedNodeId || c.to === focusedNodeId) {
        litN.add(c.from);
        litN.add(c.to);
        litE.add(i);
      }
    }

    return { litNodes: litN, litEdges: litE };
  }, [focusedNodeId, connections]);

  return {
    focusedNodeId,
    toggleFocus,
    resetTrace,
    litNodes,
    litEdges,
    hasTrace: focusedNodeId !== null,
  };
}
