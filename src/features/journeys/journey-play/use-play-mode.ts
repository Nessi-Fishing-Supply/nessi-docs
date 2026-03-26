'use client';

import { useState, useCallback } from 'react';
import type { JourneyNode, JourneyEdge } from '@/types/journey';

/**
 * User-driven play mode. The user clicks nodes to build the path.
 * At decision nodes, the user picks an option to continue.
 */

interface PlayStep {
  nodeId: string;
  edgeIndex?: number;
}

export function usePlayMode(nodes: JourneyNode[], edges: JourneyEdge[]) {
  const [active, setActive] = useState(false);
  const [steps, setSteps] = useState<PlayStep[]>([]);

  const start = useCallback(() => {
    const entries = nodes.filter((n) => n.type === 'entry');
    setSteps(entries.map((n) => ({ nodeId: n.id })));
    setActive(true);
  }, [nodes]);

  const stop = useCallback(() => {
    setActive(false);
    setSteps([]);
  }, []);

  // User clicks a node — only allow if reachable from current path
  const advanceTo = useCallback((nodeId: string) => {
    if (!active) return;
    if (steps.some((s) => s.nodeId === nodeId)) return;

    const visitedIds = new Set(steps.map((s) => s.nodeId));
    const edgeIdx = edges.findIndex(
      (e) => visitedIds.has(e.from) && e.to === nodeId
    );
    if (edgeIdx >= 0) {
      setSteps((prev) => [...prev, { nodeId, edgeIndex: edgeIdx }]);
    }
  }, [active, steps, edges]);

  const chooseOption = useCallback((decisionId: string, optLabel: string, targetId: string) => {
    if (!active) return;
    const edgeIdx = edges.findIndex(
      (e) => e.from === decisionId && e.opt === optLabel
    );
    setSteps((prev) => [...prev, { nodeId: targetId, edgeIndex: edgeIdx >= 0 ? edgeIdx : undefined }]);
  }, [active, edges]);

  const undo = useCallback(() => {
    setSteps((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
  }, []);

  const visitedNodes = new Set(steps.map((s) => s.nodeId));
  const visitedEdges = new Set(
    steps.map((s) => s.edgeIndex).filter((i): i is number => i !== undefined)
  );
  const currentNodeId = steps.length > 0 ? steps[steps.length - 1].nodeId : null;
  const currentNode = currentNodeId ? nodes.find((n) => n.id === currentNodeId) : null;
  const atDecision = currentNode?.type === 'decision';

  // What nodes can the user click next
  const reachableNodes = new Set<string>();
  if (active) {
    for (const edge of edges) {
      if (visitedNodes.has(edge.from) && !visitedNodes.has(edge.to)) {
        if (edge.opt) {
          if (edge.from === currentNodeId) reachableNodes.add(edge.to);
        } else {
          reachableNodes.add(edge.to);
        }
      }
    }
  }

  return {
    isActive: active,
    currentNodeId,
    atDecision,
    visitedNodes,
    visitedEdges,
    reachableNodes,
    stepCount: steps.length,
    start,
    stop,
    advanceTo,
    chooseOption,
    undo,
  };
}
