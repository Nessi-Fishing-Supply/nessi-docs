'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import type { ArchDiagram, ArchNode } from '@/types/architecture';
import type { DiffStatus } from '@/types/diff';
import { CanvasProvider } from '@/features/canvas/canvas-provider';
import { CanvasToolbar } from '@/features/canvas/components/canvas-toolbar';
import { LabelPill } from '@/features/canvas/components/label-pill';
import { smoothPath, type PortSide } from '@/features/canvas/utils/geometry';
import { useDiffResult } from '@/hooks/use-diff-result';
import { useDiffNodes } from '@/features/canvas/hooks/use-diff-nodes';
import { computeLayout, NODE_WIDTH, NODE_HEIGHT, LAYER_PADDING } from './arch-layout';
import { useArchTrace } from './use-arch-trace';
import { ArchTooltip } from '@/features/canvas/components/arch-tooltip';

/* ------------------------------------------------------------------ */
/*  Edge path                                                          */
/* ------------------------------------------------------------------ */

function edgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { d: string; mx: number; my: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Determine exit/entry port directions based on relative position
  let fDir: PortSide;
  let tDir: PortSide;

  if (Math.abs(dy) > Math.abs(dx) * 0.5) {
    // Vertical dominant
    fDir = dy > 0 ? 'bottom' : 'top';
    tDir = dy > 0 ? 'top' : 'bottom';
  } else {
    // Horizontal dominant
    fDir = dx > 0 ? 'right' : 'left';
    tDir = dx > 0 ? 'left' : 'right';
  }

  return {
    d: smoothPath(from.x, from.y, fDir, to.x, to.y, tDir),
    mx: (from.x + to.x) / 2,
    my: (from.y + to.y) / 2,
  };
}

/* ------------------------------------------------------------------ */
/*  Diff helpers                                                       */
/* ------------------------------------------------------------------ */

function getEdgeDiffStatus(
  fromId: string,
  toId: string,
  statusMap: Map<string, DiffStatus>,
): DiffStatus | null {
  if (statusMap.size === 0) return null;
  const fromStatus = statusMap.get(fromId);
  const toStatus = statusMap.get(toId);
  if (fromStatus === 'removed' || toStatus === 'removed') return 'removed';
  if (fromStatus === 'added' || toStatus === 'added') return 'added';
  if (fromStatus === 'modified' || toStatus === 'modified') return 'modified';
  return 'unchanged';
}

/* ------------------------------------------------------------------ */
/*  Canvas component                                                   */
/* ------------------------------------------------------------------ */

interface ArchitectureCanvasProps {
  diagram: ArchDiagram;
}

export function ArchitectureCanvas({ diagram }: ArchitectureCanvasProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [minimapVisible, setMinimapVisible] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toggleFocus, resetTrace, litNodes, litEdges, hasTrace } = useArchTrace(
    diagram.connections,
  );

  // Diff mode integration
  const { isActive: isDiffMode, diffResult } = useDiffResult();

  const baseDiagram = useMemo(() => {
    if (!isDiffMode || !diffResult) return null;
    return diffResult.archDiagrams.modified.find((m) => m.base.slug === diagram.slug)?.base ?? null;
  }, [isDiffMode, diffResult, diagram.slug]);

  const headFlatNodes = useMemo(() => diagram.layers.flatMap((l) => l.nodes), [diagram.layers]);
  const baseFlatNodes = useMemo(
    () => (baseDiagram ? baseDiagram.layers.flatMap((l) => l.nodes) : null),
    [baseDiagram],
  );

  const getNodeKey = useCallback((n: ArchNode) => n.id, []);

  const { statusMap: nodeStatusMap } = useDiffNodes(headFlatNodes, baseFlatNodes, getNodeKey);

  const layout = useMemo(() => computeLayout(diagram), [diagram]);

  const allNodes = useMemo(() => {
    const map = new Map<string, ArchNode>();
    for (const layer of diagram.layers) {
      for (const node of layer.nodes) {
        map.set(node.id, node);
      }
    }
    return map;
  }, [diagram.layers]);

  const padding = 60;
  const viewBox = {
    minX: -padding,
    minY: -padding,
    width: layout.totalWidth + padding * 2,
    height: layout.totalHeight + padding * 2,
  };

  return (
    <CanvasProvider
      viewBox={viewBox}
      viewKey={`architecture-${diagram.slug}`}
      renderToolbar={(zoomControls) => (
        <CanvasToolbar
          zoomControls={zoomControls}
          minimapVisible={minimapVisible}
          onToggleMinimap={() => setMinimapVisible((p) => !p)}
          pathControls={{
            hasPath: hasTrace,
            resetPath: resetTrace,
          }}
          resetControls={{
            isDirty: hasTrace,
            onReset: resetTrace,
          }}
        />
      )}
    >
      {/* Arrow markers */}
      <defs>
        <marker id="arch-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill="none" stroke="rgba(154,151,144,0.3)" strokeWidth="1" />
        </marker>
        <marker
          id="arch-arrow-lit"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L8,3 L0,6" fill="none" stroke="rgba(61,140,117,0.5)" strokeWidth="1" />
        </marker>
      </defs>

      {/* Layers */}
      {layout.positionedLayers.map((pl) => (
        <g key={pl.layer.id}>
          <rect
            x={pl.x}
            y={pl.y}
            width={pl.width}
            height={pl.height}
            rx={12}
            fill="rgba(255,255,255,0.02)"
            stroke={pl.layer.color ?? 'var(--border-subtle)'}
            strokeWidth={1}
            strokeOpacity={0.3}
          />
          <text
            x={pl.x + LAYER_PADDING}
            y={pl.y + 22}
            fill={pl.layer.color ?? 'var(--text-muted)'}
            fontSize={12}
            fontWeight={600}
            fontFamily="var(--font-family-mono)"
            textAnchor="start"
          >
            {pl.layer.label}
          </text>
        </g>
      ))}

      {/* Connection lines */}
      {diagram.connections.map((conn, i) => {
        const from = layout.nodePositions.get(conn.from);
        const to = layout.nodePositions.get(conn.to);
        if (!from || !to) return null;

        const path = edgePath(from, to);
        const isLit = litEdges.has(i);
        const isDimmed = !isDiffMode && hasTrace && !isLit;
        const edgeDiffStatus = isDiffMode
          ? getEdgeDiffStatus(conn.from, conn.to, nodeStatusMap)
          : null;

        let edgeStroke = isLit ? 'rgba(61,140,117,0.5)' : 'rgba(154,151,144,0.3)';
        let edgeOpacity = isDimmed ? 0.08 : 1;
        let edgeMarker = isLit ? 'url(#arch-arrow-lit)' : 'url(#arch-arrow)';
        let edgeDash = conn.style === 'dashed' ? '4 3' : undefined;

        if (edgeDiffStatus) {
          if (edgeDiffStatus === 'added') {
            edgeStroke = 'rgba(61,140,117,0.7)';
            edgeMarker = 'url(#arrow-diff-added)';
          } else if (edgeDiffStatus === 'modified') {
            edgeStroke = 'rgba(123,143,205,0.7)';
            edgeMarker = 'url(#arrow-diff-modified)';
          } else if (edgeDiffStatus === 'removed') {
            edgeStroke = 'rgba(184,64,64,0.5)';
            edgeMarker = 'url(#arrow-diff-removed)';
            edgeDash = '3 5';
            edgeOpacity = 0.5;
          } else if (edgeDiffStatus === 'unchanged') {
            edgeOpacity = isDimmed ? 0.08 : 0.15;
          }
        }

        return (
          <g key={`edge-${i}`}>
            <path
              d={path.d}
              fill="none"
              stroke={edgeStroke}
              strokeWidth={isLit ? 2 : 1.5}
              strokeDasharray={edgeDash}
              markerEnd={edgeMarker}
              style={{
                opacity: edgeOpacity,
                transition: 'opacity 400ms ease-out',
              }}
            />
            {/* Animated flow on lit edges */}
            {isLit && edgeDiffStatus !== 'removed' && edgeDiffStatus !== 'unchanged' && (
              <path
                d={path.d}
                fill="none"
                stroke="rgba(61,140,117,0.7)"
                strokeWidth={2.5}
                strokeDasharray="4 16"
                strokeLinecap="round"
                markerEnd="url(#arch-arrow-lit)"
                style={{
                  animation: 'flow-pulse 1.8s linear infinite',
                  opacity: 0.85,
                }}
              />
            )}
          </g>
        );
      })}

      {/* Connection labels */}
      {diagram.connections.map((conn, i) => {
        const from = layout.nodePositions.get(conn.from);
        const to = layout.nodePositions.get(conn.to);
        if (!from || !to || !conn.label) return null;

        const path = edgePath(from, to);
        const isLit = litEdges.has(i);
        const isDimmed = !isDiffMode && hasTrace && !isLit;
        const edgeDiffStatus = isDiffMode
          ? getEdgeDiffStatus(conn.from, conn.to, nodeStatusMap)
          : null;

        const labelOpacity =
          edgeDiffStatus === 'unchanged'
            ? 0.15
            : edgeDiffStatus === 'removed'
              ? 0.4
              : isDimmed
                ? 0.1
                : 1;

        return (
          <g
            key={`label-${i}`}
            style={{ opacity: labelOpacity, transition: 'opacity 400ms ease-out' }}
          >
            <LabelPill x={path.mx} y={path.my} label={conn.label} />
          </g>
        );
      })}

      {/* Nodes */}
      {layout.positionedNodes.map((pn) => {
        const isLit = litNodes.has(pn.node.id);
        const isDimmed = !isDiffMode && hasTrace && !isLit;
        const isSelected = !isDiffMode && isLit && hasTrace;
        const isHovered = hoveredNodeId === pn.node.id;
        const layerColor =
          layout.positionedLayers.find((l) => l.layer.id === pn.layerId)?.layer.color ?? '#78756f';

        const nodeDiffStatus = isDiffMode ? (nodeStatusMap.get(pn.node.id) ?? null) : null;
        const isChangedNode = nodeDiffStatus === 'added' || nodeDiffStatus === 'modified';

        // Diff color overrides
        let rectFill = `${layerColor}1e`;
        let rectStroke = isSelected ? layerColor : `${layerColor}4d`;
        let rectStrokeWidth = isSelected ? 1.5 : 1;
        let rectStrokeDash: string | undefined = undefined;
        let labelFill = '#e8e6e1';
        let nodeOpacity = isDimmed ? 0.15 : 1;

        if (nodeDiffStatus === 'added') {
          rectFill = 'rgba(61,140,117,0.12)';
          rectStroke = 'rgba(61,140,117,0.7)';
          rectStrokeWidth = 1.5;
          labelFill = 'rgba(130,210,180,0.95)';
        } else if (nodeDiffStatus === 'modified') {
          rectFill = 'rgba(123,143,205,0.12)';
          rectStroke = 'rgba(123,143,205,0.7)';
          rectStrokeWidth = 1.5;
          labelFill = 'rgba(170,185,230,0.95)';
        } else if (nodeDiffStatus === 'removed') {
          rectFill = 'rgba(184,64,64,0.08)';
          rectStroke = 'rgba(184,64,64,0.5)';
          rectStrokeWidth = 1.5;
          rectStrokeDash = '4 3';
          labelFill = 'rgba(220,130,130,0.8)';
          nodeOpacity = isDimmed ? 0.08 : 0.4;
        } else if (nodeDiffStatus === 'unchanged') {
          nodeOpacity = isDimmed ? 0.08 : 0.6;
        }

        const isRemoved = nodeDiffStatus === 'removed';

        return (
          <g
            key={pn.node.id}
            style={{
              opacity: nodeOpacity,
              transition: 'opacity 400ms ease-out',
              cursor: isRemoved ? 'default' : 'pointer',
              pointerEvents: isDiffMode && !isChangedNode ? 'none' : undefined,
            }}
            onMouseEnter={() => {
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
              const canHover = isDiffMode ? isChangedNode : !isDimmed && !isRemoved;
              if (canHover) setHoveredNodeId(pn.node.id);
            }}
            onMouseLeave={() => {
              hoverTimer.current = setTimeout(() => setHoveredNodeId(null), 120);
            }}
            onClick={() => !isRemoved && !isDiffMode && toggleFocus(pn.node.id)}
          >
            {/* Hover glow */}
            {isHovered && !isSelected && !isRemoved && (
              <>
                <defs>
                  <radialGradient id={`arch-hover-${pn.node.id}`}>
                    <stop offset="0%" stopColor={layerColor} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={layerColor} stopOpacity={0} />
                  </radialGradient>
                </defs>
                <circle
                  cx={pn.x + NODE_WIDTH / 2}
                  cy={pn.y + NODE_HEIGHT / 2}
                  r={NODE_WIDTH * 0.45}
                  fill={`url(#arch-hover-${pn.node.id})`}
                />
              </>
            )}

            {/* Selection glow */}
            {isSelected && !isRemoved && (
              <>
                <defs>
                  <radialGradient id={`arch-glow-${pn.node.id}`}>
                    <stop offset="0%" stopColor={layerColor} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={layerColor} stopOpacity={0} />
                  </radialGradient>
                </defs>
                <circle
                  cx={pn.x + NODE_WIDTH / 2}
                  cy={pn.y + NODE_HEIGHT / 2}
                  r={NODE_WIDTH * 0.5}
                  fill={`url(#arch-glow-${pn.node.id})`}
                  style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
                />
              </>
            )}

            {/* Frosted glass backdrop */}
            <foreignObject
              x={pn.x}
              y={pn.y}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 8,
                  backdropFilter: 'blur(6px) saturate(1.2)',
                  WebkitBackdropFilter: 'blur(6px) saturate(1.2)',
                  background: 'rgba(20,25,32,0.15)',
                }}
              />
            </foreignObject>

            {/* Node card */}
            <rect
              x={pn.x}
              y={pn.y}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={8}
              fill={rectFill}
              stroke={rectStroke}
              strokeWidth={rectStrokeWidth}
              strokeDasharray={rectStrokeDash}
              style={{ cursor: isRemoved ? 'default' : 'pointer' }}
            />

            {/* Left accent bar */}
            <rect
              x={pn.x}
              y={pn.y + 8}
              width={3}
              height={NODE_HEIGHT - 16}
              rx={1.5}
              fill={layerColor}
            />

            {/* Label */}
            <text
              x={pn.x + 14}
              y={pn.y + (pn.node.sublabel ? 23 : NODE_HEIGHT / 2 + 4)}
              fill={labelFill}
              fontSize={12}
              fontWeight={500}
              style={{ cursor: isRemoved ? 'default' : 'pointer' }}
            >
              {pn.node.label}
            </text>

            {/* Sublabel */}
            {pn.node.sublabel && (
              <text
                x={pn.x + 14}
                y={pn.y + 38}
                fill="#6a6860"
                fontSize={10}
                fontFamily="var(--font-family-mono)"
                style={{ cursor: isRemoved ? 'default' : 'pointer' }}
              >
                {pn.node.sublabel}
              </text>
            )}
          </g>
        );
      })}

      {/* Tooltip — rendered last so it sits above all nodes */}
      {hoveredNodeId &&
        (() => {
          const pn = layout.positionedNodes.find((n) => n.node.id === hoveredNodeId);
          if (!pn) return null;
          const node = pn.node;
          // Skip tooltip for removed nodes
          if (isDiffMode && nodeStatusMap.get(node.id) === 'removed') return null;
          // Only show tooltip if there's meaningful content
          if (!node.tooltip && !node.url) return null;
          const layerColor =
            layout.positionedLayers.find((l) => l.layer.id === pn.layerId)?.layer.color ??
            '#78756f';
          return (
            <ArchTooltip
              node={node}
              x={pn.x}
              y={pn.y}
              color={layerColor}
              connections={diagram.connections}
              allNodes={allNodes}
              onMouseEnter={() => {
                if (hoverTimer.current) clearTimeout(hoverTimer.current);
              }}
              onMouseLeave={() => {
                hoverTimer.current = setTimeout(() => setHoveredNodeId(null), 120);
              }}
            />
          );
        })()}
    </CanvasProvider>
  );
}
