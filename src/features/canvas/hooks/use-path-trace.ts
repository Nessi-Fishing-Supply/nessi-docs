'use client';

import { useState, useMemo, useCallback } from 'react';
import type { JourneyNode, JourneyEdge } from '@/features/journeys';

interface PathChoice {
  decId: string;
  opt: string;
  targetId: string;
}

export function usePathTrace(nodes: JourneyNode[], edges: JourneyEdge[]) {
  const [chosenPath, setChosenPath] = useState<PathChoice[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  // Track which node set these choices belong to — stale choices are filtered in the memo
  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

  const choosePath = useCallback((decId: string, opt: string, targetId: string) => {
    setChosenPath((prev) => {
      const existing = prev.find((c) => c.decId === decId);
      // Toggle off if clicking the already-selected option
      if (existing && existing.opt === opt) {
        return prev.filter((c) => c.decId !== decId);
      }
      const filtered = prev.filter((c) => c.decId !== decId);
      return [...filtered, { decId, opt, targetId }];
    });
  }, []);

  const startFromEntry = useCallback((entryId: string) => {
    setActiveEntryId((prev) => (prev === entryId ? null : entryId));
    // Clear decision choices when toggling entry
    setChosenPath([]);
  }, []);

  const resetPath = useCallback(() => {
    setChosenPath([]);
    setActiveEntryId(null);
  }, []);

  const { litNodes, litEdges } = useMemo(() => {
    // Filter out choices that belong to a different journey (stale)
    const validChoices = chosenPath.filter((c) => nodeIds.has(c.decId));
    const hasEntry = activeEntryId && nodeIds.has(activeEntryId);

    if (validChoices.length === 0 && !hasEntry) {
      return { litNodes: new Set<string>(), litEdges: new Set<number>() };
    }

    // Build adjacency maps
    const outgoing = new Map<string, { to: string; edgeIdx: number; opt?: string }[]>();
    const incoming = new Map<string, { from: string; edgeIdx: number; opt?: string }[]>();
    for (const n of nodes) {
      outgoing.set(n.id, []);
      incoming.set(n.id, []);
    }
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      outgoing.get(e.from)?.push({ to: e.to, edgeIdx: i, opt: e.opt });
      incoming.get(e.to)?.push({ from: e.from, edgeIdx: i, opt: e.opt });
    }

    // Decision nodes: any node that has outgoing edges with opt
    const decisionNodeIds = new Set(edges.filter((e) => e.opt).map((e) => e.from));

    // Chosen decisions as a lookup: decId → chosen opt label
    const chosenMap = new Map(validChoices.map((c) => [c.decId, c.opt]));

    const litN = new Set<string>();
    const litE = new Set<number>();

    // Entry trace: BFS forward from entry, stop at unchosen decision nodes
    if (hasEntry) {
      litN.add(activeEntryId!);
      const queue = [activeEntryId!];
      const visited = new Set<string>([activeEntryId!]);

      while (queue.length > 0) {
        const current = queue.shift()!;

        // If this is a decision node, only proceed if a choice was made
        if (decisionNodeIds.has(current)) {
          litN.add(current); // always light the decision itself
          const chosenOpt = chosenMap.get(current);
          if (chosenOpt === undefined) continue; // stop here — user hasn't chosen yet
        }

        for (const out of outgoing.get(current) ?? []) {
          if (visited.has(out.to)) continue;

          // For decision edges, only follow the chosen option
          if (decisionNodeIds.has(current)) {
            const chosenOpt = chosenMap.get(current);
            if (chosenOpt !== out.opt) continue;
          }

          visited.add(out.to);
          litN.add(out.to);
          queue.push(out.to);
        }
      }
    }

    // Decision-based tracing (original logic)
    if (validChoices.length > 0 && !hasEntry) {
      // Step 1: Trace BACKWARDS from each chosen decision to its entry node
      for (const choice of validChoices) {
        litN.add(choice.decId);

        const backQueue = [choice.decId];
        const visited = new Set<string>([choice.decId]);

        while (backQueue.length > 0) {
          const current = backQueue.shift()!;
          for (const inc of incoming.get(current) ?? []) {
            if (visited.has(inc.from)) continue;

            if (decisionNodeIds.has(inc.from)) {
              const chosenOpt = chosenMap.get(inc.from);
              if (chosenOpt === undefined || chosenOpt !== inc.opt) continue;
            }

            visited.add(inc.from);
            litN.add(inc.from);
            backQueue.push(inc.from);
          }
        }
      }

      // Step 2: Trace FORWARDS from each chosen decision's target
      for (const choice of validChoices) {
        litN.add(choice.targetId);

        const fwdQueue = [choice.targetId];
        const visited = new Set<string>([choice.targetId]);

        while (fwdQueue.length > 0) {
          const current = fwdQueue.shift()!;
          for (const out of outgoing.get(current) ?? []) {
            if (visited.has(out.to)) continue;

            if (decisionNodeIds.has(current)) {
              const chosenOpt = chosenMap.get(current);
              if (chosenOpt === undefined) continue;
              if (chosenOpt !== out.opt) continue;
            }

            visited.add(out.to);
            litN.add(out.to);
            fwdQueue.push(out.to);
          }
        }
      }
    }

    // Step 3: Light edges where both endpoints are lit AND the edge is on the chosen path
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (!litN.has(e.from) || !litN.has(e.to)) continue;

      if (decisionNodeIds.has(e.from)) {
        const chosenOpt = chosenMap.get(e.from);
        if (chosenOpt !== undefined && chosenOpt === e.opt) {
          litE.add(i);
        }
      } else {
        litE.add(i);
      }
    }

    return { litNodes: litN, litEdges: litE };
  }, [chosenPath, activeEntryId, nodeIds, nodes, edges]);

  const hasPath =
    chosenPath.filter((c) => nodeIds.has(c.decId)).length > 0 ||
    (activeEntryId !== null && nodeIds.has(activeEntryId));

  return {
    chosenPath,
    choosePath,
    startFromEntry,
    activeEntryId,
    resetPath,
    litNodes,
    litEdges,
    hasPath,
  };
}
