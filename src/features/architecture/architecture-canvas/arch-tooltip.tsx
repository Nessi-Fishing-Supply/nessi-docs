'use client';

import type { ArchNode, ArchConnection } from '@/types/architecture';
import {
  TT_BG,
  TT_BORDER,
  TT_SHADOW,
  sectionLabel,
} from '@/features/canvas/constants/tooltip-styles';
import { NODE_WIDTH } from './arch-layout';

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

export function ArchTooltip({
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
                          <span style={{ color: '#4a4840' }}>{'\u2192'}</span>
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
                          <span style={{ color: '#4a4840' }}>{'\u2192'}</span>
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
              {'View docs \u2192'}
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
