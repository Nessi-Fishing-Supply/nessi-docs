'use client';

import { useState, memo } from 'react';
import { ERD_NODE_WIDTH, ERD_NODE_HEIGHT, hexToRgba } from '../utils/geometry';
import type { ErdNode } from '@/features/data-model';
import type { DiffStatus } from '@/features/shared/types/diff';
import { useNodeState } from '../hooks/use-node-state';
import { NodeGlow } from './node-glow';
import { CANVAS_COLORS } from '../constants/canvas-colors';

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
  diffStatus?: DiffStatus | null;
}

export const EntityNode = memo(function EntityNode({
  node,
  isSelected,
  onClick,
  diffStatus,
}: EntityNodeProps) {
  const [hovered, setHovered] = useState(false);

  // Always use natural color — diff status never overrides the badge color
  const color = CANVAS_COLORS.category[node.badge ?? ''] ?? CANVAS_COLORS.categoryDefault;

  const { containerStyle, isGhost, isDiffChanged, diffColor, isInteractive } = useNodeState({
    diffStatus,
    isHovered: hovered,
    isSelected,
  });

  const showDiffGlow = isDiffChanged && !isSelected;
  const showHoverGlow = hovered && !isSelected && !isGhost;

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onClick={isInteractive ? onClick : undefined}
      onMouseEnter={isInteractive ? () => setHovered(true) : undefined}
      onMouseLeave={isInteractive ? () => setHovered(false) : undefined}
      style={containerStyle}
    >
      {/* Diff glow — uses diffColor, larger radius */}
      {showDiffGlow && diffColor && (
        <NodeGlow
          id={node.id}
          type="diff"
          color={diffColor}
          cx={ERD_NODE_WIDTH / 2}
          cy={ERD_NODE_HEIGHT / 2}
          rx={ERD_NODE_WIDTH * 0.7}
        />
      )}
      {/* Hover glow — uses natural color */}
      {showHoverGlow && (
        <NodeGlow
          id={node.id}
          type="hover"
          color={color}
          cx={ERD_NODE_WIDTH / 2}
          cy={ERD_NODE_HEIGHT / 2}
          rx={ERD_NODE_WIDTH * 0.55}
        />
      )}
      {/* Selection glow — uses natural color */}
      {isSelected && (
        <NodeGlow
          id={node.id}
          type="selection"
          color={color}
          cx={ERD_NODE_WIDTH / 2}
          cy={ERD_NODE_HEIGHT / 2}
          rx={ERD_NODE_WIDTH * 0.6}
        />
      )}
      {/* Outer diff ring — rendered outside the card, only for changed/ghost nodes */}
      {diffColor && (isDiffChanged || isGhost) && (
        <rect
          x={-4}
          y={-4}
          width={ERD_NODE_WIDTH + 8}
          height={ERD_NODE_HEIGHT + 8}
          rx={10}
          fill="none"
          stroke={diffColor}
          strokeWidth={1.5}
          strokeDasharray={diffStatus === 'modified' ? '4 3' : undefined}
        />
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
            background: CANVAS_COLORS.bgFrost,
          }}
        />
      </foreignObject>
      {/* Colored card — always uses natural color */}
      <rect
        width={ERD_NODE_WIDTH}
        height={ERD_NODE_HEIGHT}
        rx={6}
        fill={hexToRgba(color, 0.08)}
        stroke={isSelected ? color : hovered ? hexToRgba(color, 0.4) : hexToRgba(color, 0.2)}
        strokeWidth={isSelected ? 1.5 : 1}
        strokeDasharray={isGhost ? '4 3' : undefined}
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
        fill={CANVAS_COLORS.borderMedium}
        fontSize={9}
        fontFamily="var(--font-family-mono)"
      >
        {node.badge ?? ''}
        {node.badge && node.fieldCount ? ' · ' : ''}
        {node.fieldCount ? `${node.fieldCount} fields` : ''}
      </text>
    </g>
  );
});
