'use client';

import Link from 'next/link';
import type { ErdNode, ErdEdge } from '@/types/entity-relationship';
import styles from './erd-canvas.module.scss';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 52;
const CANVAS_PADDING = 60;

const BADGE_COLORS: Record<string, string> = {
  core: '#3d8c75',
  lifecycle: '#b86e0a',
  junction: '#e89048',
  config: '#78756f',
  media: '#e27739',
  tracking: '#1e4a40',
  discovery: '#b86e0a',
  user: '#3d8c75',
  system: '#5c5a55',
};

const BADGE_ORDER = [
  'core',
  'lifecycle',
  'junction',
  'config',
  'media',
  'tracking',
  'discovery',
  'user',
  'system',
];

interface ErdCanvasProps {
  nodes: ErdNode[];
  edges: ErdEdge[];
}

function getNodeCenter(node: ErdNode) {
  return {
    x: node.x + NODE_WIDTH / 2,
    y: node.y + NODE_HEIGHT / 2,
  };
}

function getEdgePath(fromNode: ErdNode, toNode: ErdNode) {
  const from = getNodeCenter(fromNode);
  const to = getNodeCenter(toNode);

  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Control point offset for bezier curve
  const cpOffset = Math.max(Math.abs(dx) * 0.4, 40);

  // Determine exit/entry sides based on relative positions
  let fromX = from.x;
  let fromY = from.y;
  let toX = to.x;
  let toY = to.y;
  let cp1x: number;
  let cp1y: number;
  let cp2x: number;
  let cp2y: number;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant: exit from left/right sides
    if (dx > 0) {
      fromX = fromNode.x + NODE_WIDTH;
      toX = toNode.x;
    } else {
      fromX = fromNode.x;
      toX = toNode.x + NODE_WIDTH;
    }
    fromY = fromNode.y + NODE_HEIGHT / 2;
    toY = toNode.y + NODE_HEIGHT / 2;
    cp1x = fromX + (dx > 0 ? cpOffset : -cpOffset);
    cp1y = fromY;
    cp2x = toX + (dx > 0 ? -cpOffset : cpOffset);
    cp2y = toY;
  } else {
    // Vertical dominant: exit from top/bottom sides
    if (dy > 0) {
      fromY = fromNode.y + NODE_HEIGHT;
      toY = toNode.y;
    } else {
      fromY = fromNode.y;
      toY = toNode.y + NODE_HEIGHT;
    }
    fromX = fromNode.x + NODE_WIDTH / 2;
    toX = toNode.x + NODE_WIDTH / 2;
    cp1x = fromX;
    cp1y = fromY + (dy > 0 ? cpOffset : -cpOffset);
    cp2x = toX;
    cp2y = toY + (dy > 0 ? -cpOffset : cpOffset);
  }

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  return {
    d: `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`,
    midX,
    midY,
  };
}

export function ErdCanvas({ nodes, edges }: ErdCanvasProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_WIDTH + CANVAS_PADDING;
  const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_HEIGHT + CANVAS_PADDING;
  const svgWidth = maxX + CANVAS_PADDING;
  const svgHeight = maxY + CANVAS_PADDING;

  const presentBadges = BADGE_ORDER.filter((b) => nodes.some((n) => n.badge === b));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/data-model" className={styles.backLink}>
            ← Data Model
          </Link>
          <h1 className={styles.title}>Entity Relationships</h1>
        </div>
        <p className={styles.subtitle}>
          {nodes.length} entities · {edges.length} relationships
        </p>
      </div>

      <div className={styles.canvasWrapper}>
        <svg
          className={styles.svg}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.06)" />
            </pattern>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.2)" />
            </marker>
          </defs>

          {/* Dot grid background */}
          <rect width={svgWidth} height={svgHeight} fill="url(#dot-grid)" />

          {/* Edges */}
          {edges.map((edge, i) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;

            const { d, midX, midY } = getEdgePath(fromNode, toNode);

            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                />
                {/* FK label */}
                <rect
                  x={midX - 32}
                  y={midY - 9}
                  width={64}
                  height={16}
                  rx={3}
                  fill="#0f1319"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth={1}
                />
                <text x={midX} y={midY + 4} className={styles.edgeLabel} textAnchor="middle">
                  {edge.fk ?? edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const color = BADGE_COLORS[node.badge ?? ''] ?? '#78756f';
            return (
              <g key={node.id}>
                {/* Node box */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  fill="#161c26"
                  stroke={color}
                  strokeWidth={1.5}
                />
                {/* Left accent bar */}
                <rect
                  x={node.x}
                  y={node.y + 8}
                  width={3}
                  height={NODE_HEIGHT - 16}
                  rx={1.5}
                  fill={color}
                />
                {/* Entity label */}
                <text x={node.x + 14} y={node.y + 22} className={styles.nodeLabel} fill={color}>
                  {node.label}
                </text>
                {/* Badge + field count meta */}
                <text
                  x={node.x + 14}
                  y={node.y + 38}
                  className={styles.nodeMeta}
                  fill="rgba(255,255,255,0.3)"
                >
                  {node.badge ?? ''}
                  {node.badge && node.fieldCount ? ' · ' : ''}
                  {node.fieldCount ? `${node.fieldCount} fields` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {presentBadges.map((badge) => (
          <div key={badge} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: BADGE_COLORS[badge] }} />
            <span className={styles.legendLabel}>{badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
