'use client';

import { useState, useMemo, useCallback } from 'react';
import type { JourneyNode, JourneyEdge } from '@/types/journey';

interface PathChoice {
  decId: string;
  opt: string;
  targetId: string;
}

export function usePathTrace(nodes: JourneyNode[], edges: JourneyEdge[]) {
  const [chosenPath, setChosenPath] = useState<PathChoice[]>([]);

  const choosePath = useCallback(
    (decId: string, opt: string, targetId: string) => {
      setChosenPath((prev) => {
        const filtered = prev.filter((c) => c.decId !== decId);
        return [...filtered, { decId, opt, targetId }];
      });
    },
    [],
  );

  const resetPath = useCallback(() => setChosenPath([]), []);

  const { litNodes, litEdges } = useMemo(() => {
    if (chosenPath.length === 0) {
      return { litNodes: new Set<string>(), litEdges: new Set<number>() };
    }

    const litN = new Set<string>();
    const litE = new Set<number>();

    for (const c of chosenPath) {
      litN.add(c.decId);
      litN.add(c.targetId);
    }
    for (const n of nodes) {
      if (n.type === 'entry') litN.add(n.id);
    }

    let changed = true;
    let safety = 0;
    while (changed && safety++ < 100) {
      changed = false;
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if (!litN.has(e.from)) continue;
        if (!e.opt && !litN.has(e.to)) {
          litN.add(e.to);
          changed = true;
        }
        if (e.opt) {
          const chosen = chosenPath.find(
            (c) => c.decId === e.from && c.opt === e.opt,
          );
          if (chosen && !litN.has(e.to)) {
            litN.add(e.to);
            changed = true;
          }
        }
        if (litN.has(e.from) && litN.has(e.to) && !litE.has(i)) {
          litE.add(i);
          changed = true;
        }
      }
    }

    return { litNodes: litN, litEdges: litE };
  }, [chosenPath, nodes, edges]);

  const hasPath = chosenPath.length > 0;

  return { chosenPath, choosePath, resetPath, litNodes, litEdges, hasPath };
}
