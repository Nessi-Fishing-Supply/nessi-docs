'use client';

import { useRef, useCallback } from 'react';
import type { JourneyNode } from '@/types/journey';
import { LAYER_CONFIG } from '@/types/journey';
import { NODE_WIDTH, NODE_HEIGHT, DECISION_SIZE } from '../utils/geometry';

interface MinimapProps {
  nodes: JourneyNode[];
  /** The base viewBox bounds (full extent of all nodes with padding) */
  bounds: { minX: number; minY: number; width: number; height: number };
  /** Current viewBox string from usePanZoom: "x y w h" */
  viewBoxString: string;
  /** Called when user clicks/drags on minimap to pan. Receives SVG coords for the new viewBox center. */
  onPan: (svgX: number, svgY: number) => void;
}

const MINIMAP_W = 160;
const MINIMAP_H = 100;

export function Minimap({ nodes, bounds, viewBoxString, onPan }: MinimapProps) {
  const dragging = useRef(false);

  // Parse current viewBox
  const parts = viewBoxString.split(' ').map(Number);
  const vx = parts[0] ?? 0;
  const vy = parts[1] ?? 0;
  const vw = parts[2] ?? bounds.width;
  const vh = parts[3] ?? bounds.height;

  // Scale factor: minimap pixels per SVG unit
  const sx = MINIMAP_W / bounds.width;
  const sy = MINIMAP_H / bounds.height;
  const scale = Math.min(sx, sy);

  // Center the content in the minimap
  const contentW = bounds.width * scale;
  const contentH = bounds.height * scale;
  const offsetX = (MINIMAP_W - contentW) / 2;
  const offsetY = (MINIMAP_H - contentH) / 2;

  // Convert SVG coords to minimap coords
  const toMini = (svgX: number, svgY: number) => ({
    x: (svgX - bounds.minX) * scale + offsetX,
    y: (svgY - bounds.minY) * scale + offsetY,
  });

  // Convert minimap coords to SVG center coords
  const toSvg = useCallback(
    (mx: number, my: number) => ({
      x: (mx - offsetX) / scale + bounds.minX,
      y: (my - offsetY) / scale + bounds.minY,
    }),
    [offsetX, offsetY, scale, bounds.minX, bounds.minY],
  );

  const handlePointer = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const svgPos = toSvg(mx, my);
      onPan(svgPos.x, svgPos.y);
    },
    [onPan, toSvg],
  );

  // Viewport rectangle in minimap coords
  const vpMini = toMini(vx, vy);
  const vpW = vw * scale;
  const vpH = vh * scale;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: MINIMAP_W,
        height: MINIMAP_H,
        background: 'rgba(15,19,25,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
        zIndex: 5,
        cursor: 'crosshair',
        backdropFilter: 'blur(8px)',
      }}
      onMouseDown={(e) => {
        dragging.current = true;
        handlePointer(e);
      }}
      onMouseMove={(e) => {
        if (dragging.current) handlePointer(e);
      }}
      onMouseUp={() => {
        dragging.current = false;
      }}
      onMouseLeave={() => {
        dragging.current = false;
      }}
    >
      <svg width={MINIMAP_W} height={MINIMAP_H}>
        {/* Node dots */}
        {nodes.map((node) => {
          const pos = toMini(node.x, node.y);
          const color = node.layer ? (LAYER_CONFIG[node.layer]?.color ?? '#78756f') : '#3d8c75';
          const w = (node.type === 'decision' ? DECISION_SIZE : NODE_WIDTH) * scale;
          const h = (node.type === 'decision' ? DECISION_SIZE : NODE_HEIGHT) * scale;
          return (
            <rect
              key={node.id}
              x={pos.x}
              y={pos.y}
              width={Math.max(w, 2)}
              height={Math.max(h, 1.5)}
              rx={0.5}
              fill={color}
              opacity={0.6}
            />
          );
        })}

        {/* Viewport rectangle */}
        <rect
          x={vpMini.x}
          y={vpMini.y}
          width={vpW}
          height={vpH}
          fill="rgba(61,140,117,0.08)"
          stroke="rgba(61,140,117,0.5)"
          strokeWidth={1}
          rx={1}
        />
      </svg>
    </div>
  );
}
