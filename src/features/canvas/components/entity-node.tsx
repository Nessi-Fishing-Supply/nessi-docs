'use client';

import { useState } from 'react';
import { ERD_NODE_WIDTH, ERD_NODE_HEIGHT, hexToRgba } from '../utils/geometry';
import type { ErdNode } from '@/types/entity-relationship';

const BADGE_COLORS: Record<string, string> = {
  core: '#3d8c75',       // teal — primary business entities
  user: '#5b9fd6',       // blue — identity / people
  lifecycle: '#d4923a',  // amber — state transitions
  junction: '#9b7bd4',   // purple — relationship join tables
  media: '#d46b8a',      // rose — visual / uploads
  tracking: '#5bbfcf',   // cyan — analytics / metrics
  discovery: '#c9b44a',  // gold — search / finding
  config: '#8a8580',     // warm gray — settings
  system: '#7a8591',     // cool slate — infrastructure
};

const DEFAULT_COLOR = '#8a8580';
const LABEL_MAX = 20;

/** Truncate at a word boundary when possible */
function smartTruncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > max * 0.5) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}

interface EntityNodeProps {
  node: ErdNode;
  isSelected?: boolean;
  onClick?: () => void;
}

export function EntityNode({ node, isSelected, onClick }: EntityNodeProps) {
  const [hovered, setHovered] = useState(false);
  const color = BADGE_COLORS[node.badge ?? ''] ?? DEFAULT_COLOR;
  const showHoverGlow = hovered && !isSelected;

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Hover glow */}
      {showHoverGlow && (
        <>
          <defs>
            <radialGradient id={`erd-hover-${node.id}`}>
              <stop offset="0%" stopColor={color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            cx={ERD_NODE_WIDTH / 2}
            cy={ERD_NODE_HEIGHT / 2}
            r={ERD_NODE_WIDTH * 0.55}
            fill={`url(#erd-hover-${node.id})`}
          />
        </>
      )}
      {/* Selection glow */}
      {isSelected && (
        <>
          <defs>
            <radialGradient id={`erd-glow-${node.id}`}>
              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            cx={ERD_NODE_WIDTH / 2}
            cy={ERD_NODE_HEIGHT / 2}
            r={ERD_NODE_WIDTH * 0.6}
            fill={`url(#erd-glow-${node.id})`}
            style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
          />
        </>
      )}
      {/* Frosted glass backdrop — blurs edges passing behind */}
      <foreignObject width={ERD_NODE_WIDTH} height={ERD_NODE_HEIGHT} style={{ borderRadius: 6 }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 6,
            backdropFilter: 'blur(6px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(6px) saturate(1.2)',
            background: 'rgba(20,25,32,0.15)',
          }}
        />
      </foreignObject>
      {/* Colored card */}
      <rect
        width={ERD_NODE_WIDTH}
        height={ERD_NODE_HEIGHT}
        rx={6}
        fill={hexToRgba(color, 0.08)}
        stroke={
          isSelected
            ? color
            : hovered
              ? hexToRgba(color, 0.4)
              : hexToRgba(color, 0.2)
        }
        strokeWidth={isSelected ? 1.5 : 1}
      />
      {/* Left accent bar */}
      <rect x={0} y={8} width={3} height={ERD_NODE_HEIGHT - 16} rx={1.5} fill={color} />
      {/* Entity label */}
      <text
        x={14}
        y={22}
        fill={color}
        fontSize={11}
        fontWeight={600}
        fontFamily="var(--font-family-mono)"
      >
        {smartTruncate(node.label, LABEL_MAX)}
      </text>
      {/* Badge + field count meta */}
      <text
        x={14}
        y={38}
        fill="rgba(255,255,255,0.3)"
        fontSize={9}
        fontFamily="var(--font-family-mono)"
      >
        {node.badge ?? ''}
        {node.badge && node.fieldCount ? ' · ' : ''}
        {node.fieldCount ? `${node.fieldCount} fields` : ''}
      </text>
    </g>
  );
}
