'use client';

import { useState } from 'react';
import type { JourneyNode } from '@/types/journey';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/types/journey';
import { NODE_WIDTH } from '../utils/geometry';

const TT_BG = 'rgba(15,19,25,0.97)';
const TT_BORDER = 'rgba(255,255,255,0.12)';
const TT_SHADOW = '0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.3)';

const sectionLabel: React.CSSProperties = {
  fontSize: '9px',
  color: '#4a4840',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '3px',
};

const monoBlock: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'var(--font-family-mono)',
  background: 'rgba(255,255,255,0.04)',
  padding: '4px 8px',
  borderRadius: '4px',
};

interface NodeTooltipProps {
  node: JourneyNode;
  children: React.ReactNode;
  suppressTooltip?: boolean;
}

export function NodeTooltip({ node, children, suppressTooltip }: NodeTooltipProps) {
  const [hovered, setHovered] = useState(false);

  if (node.type !== 'step' || suppressTooltip) {
    return <g onMouseEnter={() => setHovered(false)}>{children}</g>;
  }

  const layer = node.layer ? LAYER_CONFIG[node.layer] : null;
  const status = node.status ? STATUS_CONFIG[node.status] : null;
  const errorCount = node.errorCases?.length ?? 0;
  const ux = node.ux;
  const hasUx = ux && Object.values(ux).some(Boolean);

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}
      {hovered && (
        <foreignObject
          x={node.x}
          y={node.y - 8}
          width={320}
          height={1}
          overflow="visible"
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: NODE_WIDTH / 2 - 150,
              width: 300,
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
              {/* Header: title + badges */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#e8e6e1', lineHeight: '1.4', marginBottom: '5px' }}>
                  {node.label || node.route || 'Step'}
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {layer && (
                    <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '10px', background: `${layer.color}1a`, color: layer.color }}>
                      {layer.label}
                    </span>
                  )}
                  {status && (
                    <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '10px', background: `${status.color}1a`, color: status.color }}>
                      {status.label}
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '10px', background: 'rgba(220,60,60,0.15)', color: '#e05555' }}>
                      {errorCount} error{errorCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Route / Endpoint */}
              {node.route && (
                <div>
                  <div style={sectionLabel}>{node.layer === 'server' ? 'Endpoint' : 'Page'}</div>
                  <div style={{ ...monoBlock, color: '#e27739' }}>{node.route}</div>
                </div>
              )}

              {/* What it does / Why */}
              {node.why && (
                <div>
                  <div style={sectionLabel}>What it does</div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#9a9790',
                      lineHeight: '1.5',
                      borderLeft: `2px solid ${layer?.color ?? '#3d8c75'}`,
                      paddingLeft: '8px',
                    }}
                  >
                    {node.why.length > 250 ? node.why.slice(0, 250) + '...' : node.why}
                  </div>
                </div>
              )}

              {/* UX Behavior */}
              {hasUx && (
                <div>
                  <div style={sectionLabel}>UX Behavior</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {ux!.toast && (
                      <div style={{ fontSize: '10px', color: '#9a9790', display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#6b7280', flexShrink: 0 }}>Toast</span>
                        <span>{ux!.toast}</span>
                      </div>
                    )}
                    {ux!.redirect && (
                      <div style={{ fontSize: '10px', color: '#9a9790', display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#6b7280', flexShrink: 0 }}>Redirect</span>
                        <span style={{ fontFamily: 'var(--font-family-mono)' }}>{ux!.redirect}</span>
                      </div>
                    )}
                    {ux!.modal && (
                      <div style={{ fontSize: '10px', color: '#9a9790', display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#6b7280', flexShrink: 0 }}>Modal</span>
                        <span>{ux!.modal}</span>
                      </div>
                    )}
                    {ux!.email && (
                      <div style={{ fontSize: '10px', color: '#9a9790', display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#6b7280', flexShrink: 0 }}>Email</span>
                        <span>{ux!.email}</span>
                      </div>
                    )}
                    {ux!.notification && (
                      <div style={{ fontSize: '10px', color: '#9a9790', display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#6b7280', flexShrink: 0 }}>Notification</span>
                        <span>{ux!.notification}</span>
                      </div>
                    )}
                    {ux!.stateChange && (
                      <div style={{ fontSize: '10px', color: '#9a9790', display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#6b7280', flexShrink: 0 }}>State</span>
                        <span>{ux!.stateChange}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Source file */}
              {node.codeRef && (
                <div>
                  <div style={sectionLabel}>Source</div>
                  <div style={{ ...monoBlock, color: '#3d8c75' }}>{node.codeRef}</div>
                </div>
              )}

              {/* Implementation notes */}
              {node.notes && (
                <div>
                  <div style={sectionLabel}>Notes</div>
                  <div style={{ fontSize: '10px', color: '#6a6860', lineHeight: '1.4' }}>
                    {node.notes.length > 200 ? node.notes.slice(0, 200) + '...' : node.notes}
                  </div>
                </div>
              )}

              {/* Error cases */}
              {errorCount > 0 && (
                <div>
                  <div style={sectionLabel}>Error Cases</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {node.errorCases!.slice(0, 4).map((err, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '10px',
                          padding: '4px 8px',
                          background: 'rgba(220,60,60,0.06)',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <span style={{ color: '#e05555' }}>{err.condition}</span>
                        <span style={{ color: '#6a6860', flexShrink: 0 }}>
                          {err.httpStatus ? `${err.httpStatus}` : ''}
                        </span>
                      </div>
                    ))}
                    {errorCount > 4 && (
                      <div style={{ fontSize: '9px', color: '#4a4840', paddingLeft: '8px' }}>
                        +{errorCount - 4} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Down arrow */}
              <svg width="14" height="7" viewBox="0 0 14 7" style={{ position: 'absolute', bottom: -7, left: '50%', marginLeft: -7, display: 'block' }}>
                <path d="M0,0 L6,6 Q7,7 8,6 L14,0" fill={TT_BG} stroke={TT_BORDER} strokeWidth="1" strokeLinejoin="round" />
                <rect x="0" y="0" width="14" height="1" fill={TT_BG} />
              </svg>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
