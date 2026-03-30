'use client';

import { useState } from 'react';
import type { ErdNode, ErdEdge } from '@/types/entity-relationship';
import type { Entity } from '@/types/data-model';
import { useDocsContext } from '@/providers/docs-provider';
import { CanvasProvider } from '@/features/canvas/canvas-provider';
import { EntityNode } from '@/features/canvas/components/entity-node';
import { EntityTooltip } from '@/features/canvas/components/entity-tooltip';
import { LabelPill } from '@/features/canvas/components/label-pill';
import { CanvasToolbar } from '@/features/canvas/components/canvas-toolbar';
import { Minimap } from '@/features/canvas/components/minimap';
import { ErdLegend } from '@/features/canvas/components/erd-legend';
import { useErdTrace } from '@/features/canvas/hooks/use-erd-trace';
import {
  ERD_NODE_WIDTH,
  ERD_NODE_HEIGHT,
  smoothPath,
  type PortSide,
} from '@/features/canvas/utils/geometry';

import type { ErdCategoryGroup } from '@/data/index';

interface ErdCanvasProps {
  nodes: ErdNode[];
  edges: ErdEdge[];
  entities: Entity[];
  categoryGroups?: ErdCategoryGroup[];
}

/** Spread between sibling edges sharing the same node pair */
const SIBLING_SPREAD = 32;

/** Pill dimensions for collision detection */
const PILL_H = 18;
const PILL_PADDING = 6;

/** Push apart any label pills that overlap after initial placement. */
function deconflictPills(
  pills: { lx: number; ly: number; w: number }[],
): { lx: number; ly: number }[] {
  const result = pills.map((p) => ({ lx: p.lx, ly: p.ly }));
  const step = PILL_H + PILL_PADDING;

  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = Math.abs(result[i].lx - result[j].lx);
        const dy = Math.abs(result[i].ly - result[j].ly);
        const overlapX = (pills[i].w + pills[j].w) / 2;
        if (dx < overlapX && dy < step) {
          const push = (step - dy) / 2 + 1;
          if (result[i].ly <= result[j].ly) {
            result[i].ly -= push;
            result[j].ly += push;
          } else {
            result[i].ly += push;
            result[j].ly -= push;
          }
        }
      }
    }
  }
  return result;
}

/**
 * Build a map of edge pair key → count of siblings and per-edge index.
 * Returns a Map keyed by edge index with { siblingIndex, siblingCount }.
 */
function buildSiblingMap(edges: ErdEdge[]) {
  // Group by sorted node pair
  const groups = new Map<string, number[]>();
  edges.forEach((e, i) => {
    const key = [e.from, e.to].sort().join('::');
    const arr = groups.get(key) ?? [];
    arr.push(i);
    groups.set(key, arr);
  });

  const result = new Map<number, { siblingIndex: number; siblingCount: number }>();
  for (const indices of groups.values()) {
    indices.forEach((edgeIdx, sibIdx) => {
      result.set(edgeIdx, { siblingIndex: sibIdx, siblingCount: indices.length });
    });
  }
  return result;
}

function getEdgePath(fromNode: ErdNode, toNode: ErdNode, perpOffset = 0) {
  const fromCx = fromNode.x + ERD_NODE_WIDTH / 2;
  const fromCy = fromNode.y + ERD_NODE_HEIGHT / 2;
  const toCx = toNode.x + ERD_NODE_WIDTH / 2;
  const toCy = toNode.y + ERD_NODE_HEIGHT / 2;

  const dx = toCx - fromCx;
  const dy = toCy - fromCy;

  let fx: number, fy: number, tx: number, ty: number;
  let fDir: PortSide, tDir: PortSide;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant — exit right/left sides
    fy = fromNode.y + ERD_NODE_HEIGHT / 2 + perpOffset;
    ty = toNode.y + ERD_NODE_HEIGHT / 2 + perpOffset;
    if (dx > 0) {
      fx = fromNode.x + ERD_NODE_WIDTH;
      tx = toNode.x;
      fDir = 'right';
      tDir = 'left';
    } else {
      fx = fromNode.x;
      tx = toNode.x + ERD_NODE_WIDTH;
      fDir = 'left';
      tDir = 'right';
    }
  } else {
    // Vertical dominant — exit top/bottom
    fx = fromNode.x + ERD_NODE_WIDTH / 2 + perpOffset;
    tx = toNode.x + ERD_NODE_WIDTH / 2 + perpOffset;
    if (dy > 0) {
      fy = fromNode.y + ERD_NODE_HEIGHT;
      ty = toNode.y;
      fDir = 'bottom';
      tDir = 'top';
    } else {
      fy = fromNode.y;
      ty = toNode.y + ERD_NODE_HEIGHT;
      fDir = 'top';
      tDir = 'bottom';
    }
  }

  return {
    d: smoothPath(fx, fy, fDir, tx, ty, tDir),
    mx: (fx + tx) / 2,
    my: (fy + ty) / 2,
    fx,
    fy,
    tx,
    ty,
  };
}

/** Padding around node boxes for label collision detection */
const LABEL_PAD = 8;

/** Check if a point overlaps any node's bounding box (with padding) */
function overlapsNode(
  x: number,
  y: number,
  allNodes: ErdNode[],
  excludeIds: Set<string>,
): ErdNode | null {
  for (const n of allNodes) {
    if (excludeIds.has(n.id)) continue;
    if (
      x >= n.x - LABEL_PAD &&
      x <= n.x + ERD_NODE_WIDTH + LABEL_PAD &&
      y >= n.y - LABEL_PAD &&
      y <= n.y + ERD_NODE_HEIGHT + LABEL_PAD
    ) {
      return n;
    }
  }
  return null;
}

/** Nudge a label position along the edge direction to avoid overlapping a node */
function avoidNodeOverlap(
  mx: number,
  my: number,
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  allNodes: ErdNode[],
  edgeFromId: string,
  edgeToId: string,
): { lx: number; ly: number } {
  const excludeIds = new Set([edgeFromId, edgeToId]);
  if (!overlapsNode(mx, my, allNodes, excludeIds)) {
    return { lx: mx, ly: my };
  }

  // Try sliding toward source and target in 10% increments
  for (let t = 0.3; t >= 0.1; t -= 0.1) {
    // Closer to source
    const sx = fx + (tx - fx) * t;
    const sy = fy + (ty - fy) * t;
    if (!overlapsNode(sx, sy, allNodes, excludeIds)) {
      return { lx: sx, ly: sy };
    }
    // Closer to target
    const dx = fx + (tx - fx) * (1 - t);
    const dy = fy + (ty - fy) * (1 - t);
    if (!overlapsNode(dx, dy, allNodes, excludeIds)) {
      return { lx: dx, ly: dy };
    }
  }

  // Fallback: return original midpoint
  return { lx: mx, ly: my };
}

const CATEGORY_DEFS = [
  { key: 'core', label: 'Core', color: '#3d8c75' },
  { key: 'user', label: 'User', color: '#5b9fd6' },
  { key: 'lifecycle', label: 'Lifecycle', color: '#d4923a' },
  { key: 'junction', label: 'Junction', color: '#9b7bd4' },
  { key: 'media', label: 'Media', color: '#d46b8a' },
  { key: 'tracking', label: 'Tracking', color: '#5bbfcf' },
  { key: 'discovery', label: 'Discovery', color: '#c9b44a' },
  { key: 'config', label: 'Config', color: '#8a8580' },
  { key: 'system', label: 'System', color: '#7a8591' },
];

const ALL_CATEGORIES = new Set(CATEGORY_DEFS.map((c) => c.key));

export function ErdCanvas({ nodes, edges, entities, categoryGroups }: ErdCanvasProps) {
  const [minimapVisible, setMinimapVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);
  const [pinnedNodeId, setPinnedNodeId] = useState<string | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    () => new Set(ALL_CATEGORIES),
  );
  const { setSelectedItem } = useDocsContext();
  const { toggleFocus, resetTrace, litNodes, litEdges, hasTrace } = useErdTrace(edges);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const entityMap = new Map(entities.map((e) => [e.name, e]));
  const siblingMap = buildSiblingMap(edges);

  const toggleCategory = (key: string) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isNodeVisible = (node: ErdNode) => {
    const badge = node.badge ?? 'system';
    return visibleCategories.has(badge);
  };

  // Compute viewBox from node positions
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + ERD_NODE_WIDTH);
    maxY = Math.max(maxY, n.y + ERD_NODE_HEIGHT);
  }
  const padding = 80;
  const viewBox = {
    minX: minX - padding,
    minY: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };

  return (
    <CanvasProvider
      viewBox={viewBox}
      viewKey="erd"
      renderMinimap={(vbs, panTo) => (
        <Minimap
          nodes={nodes}
          bounds={viewBox}
          viewBoxString={vbs}
          onPan={panTo}
          visible={minimapVisible}
          nodeWidth={ERD_NODE_WIDTH}
          nodeHeight={ERD_NODE_HEIGHT}
          nodeColor="#3d8c75"
        />
      )}
      legend={<ErdLegend visible={legendVisible} />}
      renderToolbar={(zoomControls) => (
        <CanvasToolbar
          zoomControls={zoomControls}
          minimapVisible={minimapVisible}
          onToggleMinimap={() => setMinimapVisible((p) => !p)}
          legendVisible={legendVisible}
          onToggleLegend={() => setLegendVisible((p) => !p)}
          categoryControls={{
            categories: CATEGORY_DEFS,
            visibleCategories,
            onToggleCategory: toggleCategory,
          }}
          pathControls={{
            hasPath: hasTrace,
            resetPath: () => {
              resetTrace();
              setPinnedNodeId(null);
            },
          }}
          resetControls={{
            isDirty: hasTrace || visibleCategories.size !== ALL_CATEGORIES.size,
            onReset: () => {
              resetTrace();
              setPinnedNodeId(null);
              setVisibleCategories(new Set(ALL_CATEGORIES));
            },
          }}
        />
      )}
    >
      {/* Category group containers — lowest z-layer */}
      {categoryGroups?.map((group) => (
        <g key={group.key}>
          <rect
            x={group.x}
            y={group.y}
            width={group.width}
            height={group.height}
            rx={12}
            fill="rgba(255,255,255,0.02)"
            stroke={group.color}
            strokeWidth={1}
            strokeOpacity={0.2}
          />
          <text
            x={group.x + 16}
            y={group.y + 20}
            fill={group.color}
            fontSize={11}
            fontWeight={600}
            fontFamily="var(--font-family-mono)"
            opacity={0.6}
          >
            {group.label}
          </text>
        </g>
      ))}

      {/* Edge lines */}
      {edges.map((edge, i) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return null;
        if (!isNodeVisible(fromNode) || !isNodeVisible(toNode)) return null;

        const isLit = litEdges.has(i);
        const isDimmed = hasTrace && !isLit;

        const sibling = siblingMap.get(i);
        const perpOffset =
          sibling && sibling.siblingCount > 1
            ? (sibling.siblingIndex - (sibling.siblingCount - 1) / 2) * SIBLING_SPREAD
            : 0;

        const path = getEdgePath(fromNode, toNode, perpOffset);

        return (
          <g key={i}>
            <path
              d={path.d}
              fill="none"
              stroke={isLit ? 'rgba(61,140,117,0.5)' : 'rgba(154,151,144,0.25)'}
              strokeWidth={isLit ? 2 : 1.5}
              markerEnd={isLit ? 'url(#arrow-lit)' : 'url(#arrow)'}
              style={{
                opacity: isDimmed ? 0.08 : 1,
                transition: 'opacity 400ms ease-out',
              }}
            />
            {/* Animated flow on lit edges */}
            {isLit && (
              <path
                d={path.d}
                fill="none"
                stroke="rgba(61,140,117,0.7)"
                strokeWidth={2.5}
                strokeDasharray="4 16"
                strokeLinecap="round"
                markerEnd="url(#arrow-lit)"
                style={{
                  animation: 'flow-pulse 1.8s linear infinite',
                  opacity: 0.85,
                }}
              />
            )}
          </g>
        );
      })}

      {/* Edge labels — rendered above all lines so glass effect works */}
      {(() => {
        // Pass 1: compute initial positions
        const pillData = edges.map((edge, i) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;
          if (!isNodeVisible(fromNode) || !isNodeVisible(toNode)) return null;

          const sibling = siblingMap.get(i);
          const perpOffset =
            sibling && sibling.siblingCount > 1
              ? (sibling.siblingIndex - (sibling.siblingCount - 1) / 2) * SIBLING_SPREAD
              : 0;

          const path = getEdgePath(fromNode, toNode, perpOffset);
          const { lx, ly } = avoidNodeOverlap(
            path.mx,
            path.my,
            path.fx,
            path.fy,
            path.tx,
            path.ty,
            nodes,
            edge.from,
            edge.to,
          );

          const label = edge.fk ?? edge.label;
          const w = label.length * 6.5 + 16;
          const isLit = litEdges.has(i);
          const isDimmed = hasTrace && !isLit;

          return { i, lx, ly, w, label, isDimmed };
        });

        const visible = pillData.filter((p): p is NonNullable<typeof p> => p !== null);

        // Pass 2: push apart overlapping pills
        const deconflicted = deconflictPills(visible);

        return visible.map((pill, idx) => (
          <g
            key={pill.i}
            style={{ opacity: pill.isDimmed ? 0.1 : 1, transition: 'opacity 400ms ease-out' }}
          >
            <LabelPill x={deconflicted[idx].lx} y={deconflicted[idx].ly} label={pill.label} />
          </g>
        ));
      })()}

      {/* Entity nodes */}
      {nodes.map((node) => {
        if (!isNodeVisible(node)) return null;
        const entity = entityMap.get(node.id);
        const isPinned = pinnedNodeId === node.id;
        const isLit = litNodes.has(node.id);
        const isDimmed = hasTrace && !isLit;

        return (
          <g
            key={node.id}
            style={{
              opacity: isDimmed ? 0.15 : 1,
              transition: 'opacity 400ms ease-out',
            }}
          >
            <EntityTooltip node={node} entity={entity} suppressTooltip={isDimmed}>
              <EntityNode
                node={node}
                isSelected={isPinned}
                onClick={() => {
                  // Toggle trace focus
                  toggleFocus(node.id);

                  if (isPinned) {
                    setPinnedNodeId(null);
                  } else {
                    setPinnedNodeId(node.id);
                    if (entity) setSelectedItem({ type: 'entity', entity });
                  }
                }}
              />
            </EntityTooltip>
          </g>
        );
      })}
    </CanvasProvider>
  );
}
