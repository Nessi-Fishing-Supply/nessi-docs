'use client';

import { useState } from 'react';
import type { JourneyNode } from '@/types/journey';
import { LAYER_CONFIG } from '@/types/journey';

interface NodeTooltipProps {
  node: JourneyNode;
  children: React.ReactNode;
}

export function NodeTooltip({ node, children }: NodeTooltipProps) {
  const [hovered, setHovered] = useState(false);

  // Only show tooltip for step nodes with a why or route
  const hasContent = node.type === 'step' && (node.why || node.route);
  if (!hasContent) {
    return <>{children}</>;
  }

  const layer = node.layer ? LAYER_CONFIG[node.layer] : null;

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}
      {hovered && (
        <foreignObject
          x={node.x}
          y={node.y - 8}
          width={280}
          height={1}
          overflow="visible"
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: 0,
              width: 260,
              padding: '10px 12px',
              background: 'rgba(15,19,25,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'tooltip-in 150ms ease-out',
            }}
          >
            {node.route && (
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-family-mono)',
                  color: '#e27739',
                  marginBottom: node.why ? '6px' : '0',
                }}
              >
                {node.route}
              </div>
            )}
            {node.why && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#9a9790',
                  lineHeight: '1.5',
                  borderLeft: `2px solid ${layer?.color ?? '#3d8c75'}`,
                  paddingLeft: '8px',
                }}
              >
                {node.why.length > 150 ? node.why.slice(0, 150) + '...' : node.why}
              </div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}
