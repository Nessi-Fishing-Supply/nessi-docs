'use client';

import type React from 'react';
import { TT_BG, TT_BORDER, TT_SHADOW } from '../constants/tooltip-styles';

interface TooltipWrapperProps {
  nodeX: number;
  nodeY: number;
  nodeWidth: number;
  tooltipWidth?: number;
  visible: boolean;
  interactive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
}

export function TooltipWrapper({
  nodeX,
  nodeY,
  nodeWidth,
  tooltipWidth = 280,
  visible,
  interactive = true,
  onMouseEnter,
  onMouseLeave,
  children,
}: TooltipWrapperProps) {
  if (!visible) return null;

  return (
    <foreignObject
      x={nodeX}
      y={nodeY - 8}
      width={320}
      height={1}
      overflow="visible"
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: nodeWidth / 2 - tooltipWidth / 2,
          width: tooltipWidth,
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
          {children}

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
