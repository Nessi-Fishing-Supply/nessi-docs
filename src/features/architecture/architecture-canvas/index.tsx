'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import type { ArchDiagram, ArchNode, ArchConnection } from '@/types/architecture';
import { CanvasProvider } from '@/features/canvas/canvas-provider';
import { CanvasToolbar } from '@/features/canvas/components/canvas-toolbar';
import { LabelPill } from '@/features/canvas/components/label-pill';
import { smoothPath, type PortSide } from '@/features/canvas/utils/geometry';
import {
  TT_BG,
  TT_BORDER,
  TT_SHADOW,
  sectionLabel,
} from '@/features/canvas/constants/tooltip-styles';

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const LAYER_PADDING = 28;
const LAYER_GAP = 60;
const NODE_WIDTH = 160;
const NODE_HEIGHT = 58;
const NODE_GAP_X = 50;
const NODE_GAP_Y = 40;
const NODES_PER_ROW = 4;
const LAYER_HEADER_HEIGHT = 36;

/* ------------------------------------------------------------------ */
/*  Tooltip styles                                                     */
/* ------------------------------------------------------------------ */

// TT_BG, TT_BORDER, TT_SHADOW imported from shared constants

/* ------------------------------------------------------------------ */
/*  Layout engine                                                      */
/* ------------------------------------------------------------------ */

interface PositionedNode {
  node: ArchNode;
  layerId: string;
  x: number;
  y: number;
}

interface PositionedLayer {
  layer: { id: string; label: string; color?: string };
  x: number;
  y: number;
  width: number;
  height: number;
}

function computeLayout(diagram: ArchDiagram) {
  const positionedLayers: PositionedLayer[] = [];
  const positionedNodes: PositionedNode[] = [];
  const nodePositions = new Map<string, { x: number; y: number }>();

  let currentY = LAYER_GAP;

  for (const layer of diagram.layers) {
    const cols = Math.min(layer.nodes.length, NODES_PER_ROW);
    const rows = Math.ceil(layer.nodes.length / NODES_PER_ROW);
    const layerContentWidth = cols * NODE_WIDTH + (cols - 1) * NODE_GAP_X;
    const layerContentHeight = rows * NODE_HEIGHT + (rows - 1) * NODE_GAP_Y;
    const layerWidth = layerContentWidth + LAYER_PADDING * 2;
    const layerHeight = layerContentHeight + LAYER_PADDING * 2 + LAYER_HEADER_HEIGHT;

    const layerX = LAYER_GAP;

    positionedLayers.push({
      layer: { id: layer.id, label: layer.label, color: layer.color },
      x: layerX,
      y: currentY,
      width: layerWidth,
      height: layerHeight,
    });

    layer.nodes.forEach((node, idx) => {
      const col = idx % NODES_PER_ROW;
      const row = Math.floor(idx / NODES_PER_ROW);
      const nodeX = layerX + LAYER_PADDING + col * (NODE_WIDTH + NODE_GAP_X);
      const nodeY =
        currentY + LAYER_HEADER_HEIGHT + LAYER_PADDING + row * (NODE_HEIGHT + NODE_GAP_Y);

      positionedNodes.push({ node, layerId: layer.id, x: nodeX, y: nodeY });
      nodePositions.set(node.id, {
        x: nodeX + NODE_WIDTH / 2,
        y: nodeY + NODE_HEIGHT / 2,
      });
    });

    currentY += layerHeight + LAYER_GAP;
  }

  const maxWidth = Math.max(...positionedLayers.map((l) => l.width));
  for (const pl of positionedLayers) {
    pl.width = maxWidth;
  }

  return {
    positionedLayers,
    positionedNodes,
    nodePositions,
    totalWidth: maxWidth + LAYER_GAP * 2,
    totalHeight: currentY,
  };
}

/* ------------------------------------------------------------------ */
/*  Trace hook (click to isolate connections — same pattern as ERD)    */
/* ------------------------------------------------------------------ */

function useArchTrace(connections: ArchConnection[]) {
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
/*  Tooltip component                                                  */
/* ------------------------------------------------------------------ */

interface ArchTooltipProps {
  node: ArchNode;
  x: number;
  y: number;
  color: string;
  connections: ArchConnection[];
  allNodes: Map<string, ArchNode>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function ArchTooltip({
  node,
  x,
  y,
  color,
  connections,
  allNodes,
  onMouseEnter,
  onMouseLeave,
}: ArchTooltipProps) {
  const outgoing = connections.filter((c) => c.from === node.id);
  const incoming = connections.filter((c) => c.to === node.id);

  return (
    <foreignObject
      x={x}
      y={y - 8}
      width={320}
      height={1}
      overflow="visible"
      style={{ pointerEvents: 'auto' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: NODE_WIDTH / 2 - 140,
          width: 280,
          animation: 'tooltip-in 120ms ease-out',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: '12px 14px',
            background: TT_BG,
            border: `1px solid ${TT_BORDER}`,
            borderRadius: '8px',
            backdropFilter: 'blur(12px)',
            boxShadow: TT_SHADOW,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Header */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color, lineHeight: '1.4' }}>
              {node.label}
            </div>
            {node.sublabel && (
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-family-mono)',
                  color: '#6a6860',
                  marginTop: '2px',
                }}
              >
                {node.sublabel}
              </div>
            )}
          </div>

          {/* Tooltip / description */}
          {node.tooltip && (
            <div
              style={{
                fontSize: '11px',
                color: '#9a9790',
                lineHeight: '1.5',
                borderLeft: `2px solid ${color}`,
                paddingLeft: '8px',
              }}
            >
              {node.tooltip}
            </div>
          )}

          {/* Incoming connections */}
          {incoming.length > 0 && (
            <div>
              <div style={sectionLabel}>Receives from</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {incoming.map((c, i) => {
                  const fromNode = allNodes.get(c.from);
                  return (
                    <div
                      key={i}
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-family-mono)',
                        display: 'flex',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <span style={{ color: '#6a6860' }}>{fromNode?.label ?? c.from}</span>
                      {c.label && (
                        <>
                          <span style={{ color: '#4a4840' }}>→</span>
                          <span style={{ color: '#9a9790' }}>{c.label}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outgoing connections */}
          {outgoing.length > 0 && (
            <div>
              <div style={sectionLabel}>Sends to</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {outgoing.map((c, i) => {
                  const toNode = allNodes.get(c.to);
                  return (
                    <div
                      key={i}
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-family-mono)',
                        display: 'flex',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      {c.label && (
                        <>
                          <span style={{ color: '#9a9790' }}>{c.label}</span>
                          <span style={{ color: '#4a4840' }}>→</span>
                        </>
                      )}
                      <span style={{ color: '#6a6860' }}>{toNode?.label ?? c.to}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* External link */}
          {node.url && (
            <a
              href={node.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '10px',
                color: '#58a6ff',
                textDecoration: 'none',
              }}
            >
              View docs →
            </a>
          )}

          {/* Down arrow */}
          <svg
            width="14"
            height="7"
            viewBox="0 0 14 7"
            style={{
              position: 'absolute',
              bottom: -7,
              left: '50%',
              marginLeft: -7,
              display: 'block',
            }}
          >
            <path
              d="M0,0 L6,6 Q7,7 8,6 L14,0"
              fill={TT_BG}
              stroke={TT_BORDER}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <rect x="0" y="0" width="14" height="1" fill={TT_BG} />
          </svg>
        </div>
      </div>
    </foreignObject>
  );
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
        const isDimmed = hasTrace && !isLit;

        return (
          <g key={`edge-${i}`}>
            <path
              d={path.d}
              fill="none"
              stroke={isLit ? 'rgba(61,140,117,0.5)' : 'rgba(154,151,144,0.3)'}
              strokeWidth={isLit ? 2 : 1.5}
              strokeDasharray={conn.style === 'dashed' ? '4 3' : undefined}
              markerEnd={isLit ? 'url(#arch-arrow-lit)' : 'url(#arch-arrow)'}
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
        const isDimmed = hasTrace && !isLit;

        return (
          <g
            key={`label-${i}`}
            style={{ opacity: isDimmed ? 0.1 : 1, transition: 'opacity 400ms ease-out' }}
          >
            <LabelPill x={path.mx} y={path.my} label={conn.label} />
          </g>
        );
      })}

      {/* Nodes */}
      {layout.positionedNodes.map((pn) => {
        const isLit = litNodes.has(pn.node.id);
        const isDimmed = hasTrace && !isLit;
        const isSelected = isLit && hasTrace;
        const isHovered = hoveredNodeId === pn.node.id;
        const layerColor =
          layout.positionedLayers.find((l) => l.layer.id === pn.layerId)?.layer.color ?? '#78756f';

        return (
          <g
            key={pn.node.id}
            style={{
              opacity: isDimmed ? 0.15 : 1,
              transition: 'opacity 400ms ease-out',
              cursor: 'pointer',
            }}
            onMouseEnter={() => {
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
              if (!isDimmed) setHoveredNodeId(pn.node.id);
            }}
            onMouseLeave={() => {
              hoverTimer.current = setTimeout(() => setHoveredNodeId(null), 120);
            }}
            onClick={() => toggleFocus(pn.node.id)}
          >
            {/* Hover glow */}
            {isHovered && !isSelected && (
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
            {isSelected && (
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
              fill={`${layerColor}1e`}
              stroke={isSelected ? layerColor : `${layerColor}4d`}
              strokeWidth={isSelected ? 1.5 : 1}
              style={{ cursor: 'pointer' }}
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
              fill="#e8e6e1"
              fontSize={12}
              fontWeight={500}
              style={{ cursor: 'pointer' }}
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
                style={{ cursor: 'pointer' }}
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
