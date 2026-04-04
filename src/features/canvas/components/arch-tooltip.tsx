'use client';

import type { ArchNode, ArchConnection } from '@/features/architecture';
import { NODE_WIDTH } from '@/features/architecture/components/architecture-canvas/arch-layout';
import { CANVAS_COLORS } from '../constants/canvas-colors';
import { TooltipWrapper } from './tooltip-wrapper';
import { TooltipSection } from './tooltip-parts';

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
    <TooltipWrapper
      nodeX={x}
      nodeY={y}
      nodeWidth={NODE_WIDTH}
      tooltipWidth={280}
      visible={true}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
              color: CANVAS_COLORS.textMuted,
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
            color: CANVAS_COLORS.textSecondary,
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
        <TooltipSection label="Receives from">
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
                    background: CANVAS_COLORS.bgSubtle,
                  }}
                >
                  <span style={{ color: CANVAS_COLORS.textMuted }}>
                    {fromNode?.label ?? c.from}
                  </span>
                  {c.label && (
                    <>
                      <span style={{ color: CANVAS_COLORS.textDim }}>{'\u2192'}</span>
                      <span style={{ color: CANVAS_COLORS.textSecondary }}>{c.label}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </TooltipSection>
      )}

      {/* Outgoing connections */}
      {outgoing.length > 0 && (
        <TooltipSection label="Sends to">
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
                    background: CANVAS_COLORS.bgSubtle,
                  }}
                >
                  {c.label && (
                    <>
                      <span style={{ color: CANVAS_COLORS.textSecondary }}>{c.label}</span>
                      <span style={{ color: CANVAS_COLORS.textDim }}>{'\u2192'}</span>
                    </>
                  )}
                  <span style={{ color: CANVAS_COLORS.textMuted }}>{toNode?.label ?? c.to}</span>
                </div>
              );
            })}
          </div>
        </TooltipSection>
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
    </TooltipWrapper>
  );
}
