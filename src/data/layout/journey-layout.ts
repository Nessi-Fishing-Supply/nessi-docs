/* ------------------------------------------------------------------ */
/*  Journey Horizontal Layout Engine                                   */
/*  Topological layering with decision-aware vertical positioning      */
/* ------------------------------------------------------------------ */

import type { Journey, JourneyNode, JourneyEdge } from '@/features/journeys';
import type { RawJourneyNode, RawJourneyEdge, RawJourney } from '../raw-types';

const NODE_W = 200;
const NODE_H = 80;
const H_GAP = 100;
const V_GAP = 100;
const MULTI_ENTRY_GAP = 200; // Extra vertical gap between sub-journeys

function layoutJourneyNodes(rawNodes: RawJourneyNode[], rawEdges: RawJourneyEdge[]): JourneyNode[] {
  // If all nodes already have x/y, use them as-is (backwards compat)
  const allHavePositions = rawNodes.every(
    (n) => typeof n.x === 'number' && typeof n.y === 'number',
  );
  if (allHavePositions) {
    return rawNodes as JourneyNode[];
  }

  // ── Build adjacency ──
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const node of rawNodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }
  for (const edge of rawEdges) {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.get(edge.to)?.push(edge.from);
  }

  // ── Detect back-edges via DFS ──
  const backEdgeSet = new Set<number>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function detectBackEdges(nodeId: string) {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const next of outgoing.get(nodeId) ?? []) {
      if (inStack.has(next)) {
        const ei = rawEdges.findIndex((e) => e.from === nodeId && e.to === next);
        if (ei >= 0) backEdgeSet.add(ei);
      } else if (!visited.has(next)) {
        detectBackEdges(next);
      }
    }
    inStack.delete(nodeId);
  }

  const entryIds = rawNodes
    .filter((n) => n.type === 'entry' || (incoming.get(n.id) ?? []).length === 0)
    .map((n) => n.id);
  const roots = entryIds.length > 0 ? entryIds : [rawNodes[0]?.id].filter(Boolean);

  for (const r of roots) {
    if (!visited.has(r)) detectBackEdges(r);
  }
  // Visit any remaining disconnected nodes
  for (const node of rawNodes) {
    if (!visited.has(node.id)) detectBackEdges(node.id);
  }

  // ── Longest-path column assignment ──
  // Uses raw incoming adjacency with back-edge filtering (before DAG is built).
  const colMemo = new Map<string, number>();

  function longestPathTo(nodeId: string): number {
    if (colMemo.has(nodeId)) return colMemo.get(nodeId)!;
    // Filter to non-back-edge parents
    const parents = (incoming.get(nodeId) ?? []).filter((p) => {
      const ei = rawEdges.findIndex((e) => e.from === p && e.to === nodeId);
      return ei >= 0 && !backEdgeSet.has(ei);
    });
    if (parents.length === 0) {
      colMemo.set(nodeId, 0);
      return 0;
    }
    const maxParent = Math.max(...parents.map((p) => longestPathTo(p)));
    const col = maxParent + 1;
    colMemo.set(nodeId, col);
    return col;
  }

  const column = new Map<string, number>();
  for (const node of rawNodes) {
    column.set(node.id, longestPathTo(node.id));
  }

  // ── Decision branch column capping ──
  // When a node is a direct decision option target but has been pushed far
  // right by a merge edge from a long parallel chain, demote those non-decision
  // incoming edges to back-edges and reset the column. This keeps decision
  // branches visually close to their decision node.
  for (const node of rawNodes) {
    if (node.type !== 'decision' || !node.options) continue;
    const decCol = column.get(node.id) ?? 0;
    for (const opt of node.options) {
      const targetCol = column.get(opt.to) ?? 0;
      if (targetCol > decCol + 1) {
        // This target was pushed far right — demote incoming edges from
        // nodes that are further right than the decision. Edges from nodes
        // at or near the decision column are normal merge flows, not back-edges.
        rawEdges.forEach((edge, i) => {
          if (backEdgeSet.has(i)) return;
          if (edge.to !== opt.to) return;
          if (edge.from === node.id) return; // Keep the decision's own edge
          const srcCol = column.get(edge.from) ?? 0;
          if (srcCol > decCol + 1) {
            backEdgeSet.add(i);
          }
        });
        column.set(opt.to, decCol + 1);
      }
    }
  }

  // Rebuild DAG adjacency after adding new back-edges
  const dagOutgoing = new Map<string, string[]>();
  const dagIncoming = new Map<string, string[]>();
  for (const n of rawNodes) {
    dagOutgoing.set(n.id, []);
    dagIncoming.set(n.id, []);
  }
  rawEdges.forEach((edge, i) => {
    if (!backEdgeSet.has(i)) {
      dagOutgoing.get(edge.from)?.push(edge.to);
      dagIncoming.get(edge.to)?.push(edge.from);
    }
  });

  // ── Identify sub-journeys ──
  // BFS from each entry node through DAG edges to assign nodes to entry groups
  const nodeToEntry = new Map<string, string>();

  for (const entryId of roots) {
    const bfsQueue = [entryId];
    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift()!;
      if (nodeToEntry.has(current)) continue;
      nodeToEntry.set(current, entryId);
      for (const next of dagOutgoing.get(current) ?? []) {
        if (!nodeToEntry.has(next)) bfsQueue.push(next);
      }
    }
  }
  // Assign any remaining nodes to the first root
  for (const node of rawNodes) {
    if (!nodeToEntry.has(node.id)) {
      nodeToEntry.set(node.id, roots[0]);
    }
  }

  // Group entries in order
  const entryOrder = roots.filter((r) => rawNodes.some((n) => nodeToEntry.get(n.id) === r));

  // ── Decision-aware vertical positioning ──
  // Build a map from decision node id → ordered option target ids
  const nodeById = new Map(rawNodes.map((n) => [n.id, n]));
  const decisionChildren = new Map<string, string[]>();
  for (const node of rawNodes) {
    if (node.type === 'decision' && node.options) {
      const ordered = node.options.map((opt) => opt.to).filter((to): to is string => !!to);
      decisionChildren.set(node.id, ordered);
    }
  }

  function getOrderedChildren(nodeId: string): string[] {
    const dc = decisionChildren.get(nodeId);
    if (dc) {
      // Return decision options in order, then any DAG children not in options
      const optSet = new Set(dc);
      const extra = (dagOutgoing.get(nodeId) ?? []).filter((c) => !optSet.has(c));
      return [...dc, ...extra];
    }
    return dagOutgoing.get(nodeId) ?? [];
  }

  // Subtree extent: total vertical height a subtree needs
  const extentMemo = new Map<string, number>();

  function subtreeExtent(nodeId: string): number {
    if (extentMemo.has(nodeId)) return extentMemo.get(nodeId)!;
    const children = getOrderedChildren(nodeId);
    const dagChildren = children.filter((c) => (dagOutgoing.get(nodeId) ?? []).includes(c));
    if (dagChildren.length === 0) {
      extentMemo.set(nodeId, NODE_H);
      return NODE_H;
    }
    const n = nodeById.get(nodeId);
    if (n?.type === 'decision' && dagChildren.length > 1) {
      // Sum all branch extents + gaps between them
      const total = dagChildren.reduce((sum, c) => sum + subtreeExtent(c), 0);
      const gaps = (dagChildren.length - 1) * V_GAP;
      const ext = Math.max(NODE_H, total + gaps);
      extentMemo.set(nodeId, ext);
      return ext;
    }
    // Linear node: take max child extent
    const maxExt = Math.max(...dagChildren.map((c) => subtreeExtent(c)));
    const ext = Math.max(NODE_H, maxExt);
    extentMemo.set(nodeId, ext);
    return ext;
  }

  const positions = new Map<string, { x: number; y: number }>();
  const placed = new Set<string>();
  // Pre-assigned y-values for decision branch targets.
  // These override DFS-inherited y to ensure branches stack vertically
  // even when a branch target is reached through a sibling edge first.
  const reservedY = new Map<string, number>();

  function layoutSubJourney(entryId: string, yStart: number): number {
    // Pre-pass: walk the DAG and pre-assign y-values for all decision branches.
    // This ensures stacking even when DFS reaches targets through sibling edges.
    const preVisited = new Set<string>();

    function preAssignDecisionBranches(nodeId: string, y: number) {
      if (preVisited.has(nodeId)) return;
      preVisited.add(nodeId);
      if (nodeToEntry.get(nodeId) !== entryId) return;

      const n = nodeById.get(nodeId);
      const allChildren = getOrderedChildren(nodeId).filter(
        (c) => nodeToEntry.get(c) === entryId && (dagOutgoing.get(nodeId) ?? []).includes(c),
      );

      if (n?.type === 'decision' && allChildren.length > 1) {
        let branchY = y;
        for (let i = 0; i < allChildren.length; i++) {
          const childY = i === 0 ? y : branchY;
          reservedY.set(allChildren[i], childY);
          if (i === 0) {
            branchY = y + Math.max(subtreeExtent(allChildren[0]), NODE_H) + V_GAP;
          } else {
            branchY += Math.max(subtreeExtent(allChildren[i]), NODE_H) + V_GAP;
          }
          // Recurse into each branch with its assigned y
          preAssignDecisionBranches(allChildren[i], childY);
        }
      } else {
        // Linear: children inherit same y
        for (const child of allChildren) {
          preAssignDecisionBranches(child, y);
        }
      }
    }

    preAssignDecisionBranches(entryId, yStart);

    // Main DFS: place nodes using reserved y-values where available
    const stack: { nodeId: string; y: number }[] = [{ nodeId: entryId, y: yStart }];
    let maxY = yStart;

    while (stack.length > 0) {
      const { nodeId, y: stackY } = stack.pop()!;
      if (nodeToEntry.get(nodeId) !== entryId) continue;

      // Use reserved y if this node is a decision branch target, otherwise use stack y
      const y = reservedY.has(nodeId) ? reservedY.get(nodeId)! : stackY;

      if (placed.has(nodeId)) {
        // Already placed — but if reserved y differs, reposition it
        const existing = positions.get(nodeId);
        if (existing && reservedY.has(nodeId) && existing.y !== y) {
          positions.set(nodeId, { x: existing.x, y });
        }
        continue;
      }

      placed.add(nodeId);
      const col = column.get(nodeId) ?? 0;
      positions.set(nodeId, {
        x: col * (NODE_W + H_GAP),
        y,
      });
      maxY = Math.max(maxY, y + NODE_H);

      const children = getOrderedChildren(nodeId).filter(
        (c) =>
          !placed.has(c) &&
          nodeToEntry.get(c) === entryId &&
          (dagOutgoing.get(nodeId) ?? []).includes(c),
      );

      // Linear flow: all children get same y as parent
      // Decision fork stacking is already handled by the pre-pass (reservedY)
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({ nodeId: children[i], y });
      }
    }

    return maxY;
  }

  // ── Layout each sub-journey ──
  let currentY = 0;
  for (let i = 0; i < entryOrder.length; i++) {
    const maxY = layoutSubJourney(entryOrder[i], currentY);
    currentY = maxY + MULTI_ENTRY_GAP;
  }

  // Place any remaining unplaced nodes
  for (const node of rawNodes) {
    if (!placed.has(node.id)) {
      const col = column.get(node.id) ?? 0;
      positions.set(node.id, {
        x: col * (NODE_W + H_GAP),
        y: currentY,
      });
      currentY += NODE_H + V_GAP;
    }
  }

  // ── Normalize — translate all positions so first entry is at (0, 0) ──
  const firstEntry = roots[0];
  const originPos = positions.get(firstEntry) ?? { x: 0, y: 0 };
  const offsetX = originPos.x;
  const offsetY = originPos.y;

  if (offsetX !== 0 || offsetY !== 0) {
    for (const [id, pos] of positions) {
      positions.set(id, {
        x: pos.x - offsetX,
        y: pos.y - offsetY,
      });
    }
  }

  return rawNodes.map((node) => ({
    ...node,
    x: positions.get(node.id)?.x ?? 0,
    y: positions.get(node.id)?.y ?? 0,
  })) as JourneyNode[];
}

/**
 * Detect back-edges in a journey's edge list.
 * Includes both DFS cycle edges AND merge-back edges to decision branch targets
 * (edges from later-in-flow nodes to a decision's direct branch target).
 * Returns a Set of edge indices.
 */
export function detectJourneyBackEdges(
  nodes: { id: string; type: string; options?: { label: string; to: string }[] }[],
  edges: { from: string; to: string }[],
): Set<number> {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const node of nodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }
  for (const edge of edges) {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.get(edge.to)?.push(edge.from);
  }

  // Step 1: DFS cycle detection
  const backEdges = new Set<number>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string) {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const next of outgoing.get(nodeId) ?? []) {
      if (inStack.has(next)) {
        const ei = edges.findIndex((e) => e.from === nodeId && e.to === next);
        if (ei >= 0) backEdges.add(ei);
      } else if (!visited.has(next)) {
        dfs(next);
      }
    }
    inStack.delete(nodeId);
  }

  const roots = nodes
    .filter((n) => n.type === 'entry' || (incoming.get(n.id) ?? []).length === 0)
    .map((n) => n.id);
  for (const r of roots) {
    if (!visited.has(r)) dfs(r);
  }
  for (const node of nodes) {
    if (!visited.has(node.id)) dfs(node.id);
  }

  // Step 2: Longest-path columns (excluding cycle back-edges)
  const colMemo = new Map<string, number>();
  function longestPath(nodeId: string): number {
    if (colMemo.has(nodeId)) return colMemo.get(nodeId)!;
    const parents = (incoming.get(nodeId) ?? []).filter((p) => {
      const ei = edges.findIndex((e) => e.from === p && e.to === nodeId);
      return ei >= 0 && !backEdges.has(ei);
    });
    if (parents.length === 0) {
      colMemo.set(nodeId, 0);
      return 0;
    }
    const maxP = Math.max(...parents.map((p) => longestPath(p)));
    colMemo.set(nodeId, maxP + 1);
    return maxP + 1;
  }
  const col = new Map<string, number>();
  for (const node of nodes) col.set(node.id, longestPath(node.id));

  // Step 3: Mark merge-back edges to decision branch targets
  // Only demote edges from nodes significantly further right (not same-column merges)
  for (const node of nodes) {
    if (node.type !== 'decision' || !node.options) continue;
    const decCol = col.get(node.id) ?? 0;
    for (const opt of node.options) {
      if ((col.get(opt.to) ?? 0) > decCol + 1) {
        edges.forEach((edge, i) => {
          if (backEdges.has(i)) return;
          if (edge.to !== opt.to) return;
          if (edge.from === node.id) return;
          const srcCol = col.get(edge.from) ?? 0;
          if (srcCol > decCol + 1) {
            backEdges.add(i);
          }
        });
      }
    }
  }

  return backEdges;
}

/** Clean journey titles: strip parenthetical tech details, arrows, file refs */
function cleanJourneyTitle(title: string): string {
  let t = title;
  // Strip parenthetical details: "Account Deletion (Full Cascade)" → "Account Deletion"
  t = t.replace(/\s*\([^)]*\)\s*/g, '').trim();
  // Strip arrow chains: "Guest Cart → Login → Merge" → "Guest Cart"
  // But keep the first segment which is the meaningful name
  if (t.includes(' → ')) {
    t = t.split(' → ')[0].trim();
  }
  // Strip "& TechDetail" when the second part is technical
  // Keep genuine compound names like "Browse & Discover"
  return t;
}

/** Convert a node id slug to a readable label: "delete-account--click-delete" → "Click Delete" */
function idToLabel(id: string): string {
  // Take the part after "--" if present (the action), otherwise the whole id
  const parts = id.split('--');
  const actionPart = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return actionPart
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Normalize raw nodes: v2 schema uses 'title' instead of 'label', handle both */
function normalizeNodes(rawNodes: RawJourneyNode[]): RawJourneyNode[] {
  return rawNodes.map((n) => ({
    ...n,
    label: n.label || n.title || n.route || idToLabel(n.id),
  }));
}

/** Map extracted domain slugs to current domain slugs (for renamed/merged domains). */
const DOMAIN_ALIASES: Record<string, string> = {
  identity: 'auth',
};

export function transformJourneys(raw: RawJourney[]): Journey[] {
  return raw.map((j) => {
    const normalizedNodes = normalizeNodes(j.nodes);
    return {
      ...j,
      domain: DOMAIN_ALIASES[j.domain] ?? j.domain,
      title: cleanJourneyTitle(j.title),
      nodes: layoutJourneyNodes(normalizedNodes, j.edges),
      edges: j.edges as JourneyEdge[],
    };
  }) as Journey[];
}
